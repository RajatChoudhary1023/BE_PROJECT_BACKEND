const express = require("express");
const router = express.Router();
const PaymentIntent = require("../Transaction_Models/payment_intent")
const Retailer = require("../Retailer_Models/auth")
const verify_firebase = require("../Middleware/verify-firebase");
const User = require("../Models/auth");
const mongoose = require("mongoose");
const Transaction = require("../Transaction_Models/transaction");
const UserWallet = require("../Models/wallet"); // user wallet
const RetailerWallet = require("../Retailer_Models/wallet"); // retailer wallet

// Utility to generate intent id
function generateIntentId() {
  return "PI_" + Date.now() + "_" + Math.floor(Math.random() * 100000);
}

/**
 * @route   POST /payment/create_intent
 * @desc    Retailer creates a payment intent (bill)
 * @access  Protected (Retailer)
 */
router.post("/create_intent", verify_firebase, async (req, res) => {
// router.post("/create_intent", async (req, res) => {
  try {
    const { amount } = req.body;
    const { email } = req.user;
    // const email="sharma@gmail.com"

    // 1️⃣ Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount",
      });
    }

    // 2️⃣ Find retailer
    const retailer = await Retailer.findOne({ email });
    if (!retailer) {
      return res.status(403).json({
        success: false,
        message: "Retailer not found or unauthorized",
      });
    }

    // 3️⃣ Create intent
    const intentId = generateIntentId();

    const intent = new PaymentIntent({
      intent_id: intentId,
      retailer: retailer._id,
      amount,
      expires_at: new Date(Date.now() + 50 * 60 * 1000), // 50 minutes
    });

    await intent.save();

    // 4️⃣ Respond
    return res.status(201).json({
      success: true,
      intent_id: intent.intent_id,
      amount: intent.amount,
      expires_at: intent.expires_at,
    });

  } catch (error) {
    console.error("Error creating payment intent:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

/**
 * @route   POST /payment/authorize
 * @desc    Authorize payment intent using fingerprint (static for now)
 * @access  Public (device)
 */
router.post("/authorize", async (req, res) => {
  try {
    const { intent_id, fingerprint_ref } = req.body;

    if (!intent_id || !fingerprint_ref) {
      return res.status(400).json({
        success: false,
        message: "intent_id and fingerprint_ref are required",
      });
    }

    // 1️⃣ Find intent
    const intent = await PaymentIntent.findOne({ intent_id });

    if (!intent) {
      return res.status(404).json({
        success: false,
        message: "Payment intent not found",
      });
    }

    // 2️⃣ Check intent status
    if (intent.status !== "CREATED") {
      return res.status(400).json({
        success: false,
        message: `Intent cannot be authorized (status: ${intent.status})`,
      });
    }

    // 3️⃣ Check expiry
    if (intent.expires_at < new Date()) {
      intent.status = "EXPIRED";
      await intent.save();

      return res.status(400).json({
        success: false,
        message: "Payment intent has expired",
      });
    }

    // 4️⃣ Find user by fingerprint (STATIC for now)
    const user = await User.findOne({
      fingerprint: fingerprint_ref,
      isfingerprint_registered: true,
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Fingerprint not recognized",
      });
    }

    // 5️⃣ Authorize intent
    intent.user = user._id;
    intent.status = "AUTHORIZED";
    await intent.save();

    // 6️⃣ Respond
    return res.status(200).json({
      success: true,
      message: "Payment intent authorized via fingerprint",
      intent_id: intent.intent_id,
      amount: intent.amount,
      user: {
        name: user.name,
        email: user.email,
      },
    });

  } catch (error) {
    console.error("Error authorizing payment intent:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

/**
 * @route   POST /payment/settle
 * @desc    Settle authorized payment intent (wallet transfer)
 * @access  Internal / Backend
 */
router.post("/settle", async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { intent_id } = req.body;

    if (!intent_id) {
      return res.status(400).json({
        success: false,
        message: "intent_id is required",
      });
    }

    // 1️⃣ Fetch intent inside session
    const intent = await PaymentIntent.findOne({ intent_id }).session(session);

    if (!intent) {
      throw new Error("Payment intent not found");
    }

    // 2️⃣ Validate intent state
    if (intent.status !== "AUTHORIZED") {
      throw new Error(`Intent cannot be settled (status: ${intent.status})`);
    }

    if (intent.expires_at < new Date()) {
      intent.status = "EXPIRED";
      await intent.save({ session });
      throw new Error("Payment intent expired");
    }

    // 3️⃣ Fetch wallets
    const userWallet = await UserWallet.findOne({
      user: intent.user,
    }).session(session);

    const retailerWallet = await RetailerWallet.findOne({
      retailer: intent.retailer,
    }).session(session);

    if (!userWallet || !retailerWallet) {
      throw new Error("Wallet not found");
    }

    // 4️⃣ Balance check
    if (userWallet.balance < intent.amount) {
      throw new Error("Insufficient balance");
    }

    // 5️⃣ Debit user wallet
    userWallet.balance -= intent.amount;
    await userWallet.save({ session });

    // 6️⃣ Credit retailer wallet
    retailerWallet.balance += intent.amount;
    await retailerWallet.save({ session });

    // 7️⃣ Create transaction record
    const txnId =
      "TXN_" + Date.now() + "_" + Math.floor(Math.random() * 100000);

    await Transaction.create(
      [
        {
          transaction_id: txnId,
          intent_id: intent.intent_id,
          from_user: intent.user,
          to_retailer: intent.retailer,
          amount: intent.amount,
          status: "SUCCESS",
        },
      ],
      { session }
    );

    // 8️⃣ Mark intent as completed
    intent.status = "COMPLETED";
    await intent.save({ session });

    // 9️⃣ Commit transaction
    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      success: true,
      message: "Payment successful",
      transaction_id: txnId,
      amount: intent.amount,
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error("Settlement failed:", error.message);

    return res.status(500).json({
      success: false,
      message: error.message || "Payment settlement failed",
    });
  }
});


/**
 * @route   GET /payment/intent/:intent_id
 * @desc    Get payment intent status
 * @access  Public (UI / device)
 */
router.get("/intent/:intent_id", async (req, res) => {
  try {
    const { intent_id } = req.params;

    const intent = await PaymentIntent.findOne({ intent_id })
      .populate("retailer", "shop_name")
      .populate("user", "name email");

    if (!intent) {
      return res.status(404).json({
        success: false,
        message: "Payment intent not found",
      });
    }

    return res.json({
      success: true,
      intent_id: intent.intent_id,
      status: intent.status,
      amount: intent.amount,
      retailer: intent.retailer,
      user: intent.user || null,
      expires_at: intent.expires_at,
    });

  } catch (error) {
    console.error("Error fetching intent status:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});


module.exports = router;
