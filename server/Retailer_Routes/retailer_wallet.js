const express = require("express");
const Wallet = require("../Retailer_Models/wallet");
const verify_firebase = require("../Middleware/verify-firebase");
const Retailer=require('../Retailer_Models/auth')
const router = express.Router();
const Transaction=require('../Transaction_Models/transaction')
  router.get("/check_retailer_balance",verify_firebase,async (req,res)=> {
    // router.get("/check_retailer_balance",async (req,res)=> {

    // const  email ="sharma@gmail.com"
    const { email }=req.user
    const user=await Retailer.findOne({ email })
    if (!user) {
      return res.status(404).json({success:"false",message:"User not found"})
    }
    const wallet=await Wallet.findOne({retailer:user._id})
    const balance=wallet.balance;
    return res.status(500).json({success:true,balance:balance})
  })

router.post("/add_to_retailer_wallet",verify_firebase,async (req, res) => {
    try {
      const { amount } = req.body;
      const { email } = req.user;

      // Validate amount
      if (!amount || amount <= 0) {
        return res.status(400).json({
          success: false,
          message: "Valid amount is required",
        });
      }

      // Find retailer
      const user = await Retailer.findOne({ email });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Atomic wallet update (creates wallet if not exists)
      const wallet = await Wallet.findOneAndUpdate(
        { retailer: user._id },
        { $inc: { balance: Number(amount) } },
        {
          new: true,      // return updated document
          upsert: true,   // create if not exists
        }
      );

      return res.status(200).json({
        success: true,
        message: "Amount added to wallet successfully",
        balance: wallet.balance,
      });
    } catch (error) {
      console.error("Wallet update error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
);

router.get("/transactions", verify_firebase, async (req, res) => {
  // router.get("/transactions", async (req, res) => {
  try {
    const { email } = req.user;
    // const email="sharma@gmail.com"
    const retailer = await Retailer.findOne({ email });

    const txns = await Transaction.find({ to_retailer: retailer._id })
      .sort({ created_at: -1 })
      .populate("from_user", "name email");

    res.json({
      success: true,
      transactions: txns,
    });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});


module.exports=router