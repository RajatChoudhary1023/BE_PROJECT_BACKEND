const express = require("express");
require("dotenv").config();
const crypto = require("crypto");
const auth = require("../Models/auth");
const Wallet=require('../Models/wallet')
const verify_firebase = require("../Middleware/verify-firebase");
const router = express.Router();

// Helper function to generate 6-character alphanumeric code
function generateVerificationCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Helper function to hash code using SHA-256
function hashCode(code) {
  return crypto.createHash("sha256").update(code).digest("hex");
}




router.post("/register", verify_firebase, async (req, res) => {
//  router.post("/register", async (req, res) => {
  try {
    const { name, fingerprint_hash,phone } = req.body;
    const { email } = req.user; // decoded from Firebase token
    // const  email  = "c.rajat1006@gmail.com"; // decoded from Firebase token
    // ✅ Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Name is required",
      });
    }
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone Number is required",
      });
    }

    // ✅ Check if user already exists
    let user = await auth.findOne({ email });

    if (!user) {
      // ✅ Create new user
      user = new auth({
        name,
        email,
        phone,
      });

      // Optional fingerprint info
      if (fingerprint_hash) {
        user.fingerprint = fingerprint_hash;
        user.isfingerprint_registered = true;
      }

      await user.save();
      // ✅ Create wallet for this new user
      const wallet = new Wallet({
        user: user._id,
        balance: 0, // initial balance
      });
      await wallet.save();
    }

    res.status(201).json({
      success: true,
      message: user
        ? "User registered or synced successfully"
        : "New user created",
      user,
    });
  } catch (error) {
    console.error("Error in /register:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});


router.post("/generate_code", verify_firebase, async (req, res) => {
// router.post("/generate_code", async (req, res) => {

  try {
    const { email } = req.user; // from Firebase token
  // const  email  = "c.rajat1006@gmail.com"; // from Firebase token
    // Find user
    const user = await auth.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Generate random code
    const plainCode = generateVerificationCode();
    const hashedCode = hashCode(plainCode);
    const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 min validity

    // Store only the hash + expiry in DB
    user.verification_code = hashedCode;
    user.code_expiry = expiry;
    await user.save();
    console.log("Verification Code: ",plainCode)
    // Send the plain code only in the response
    res.status(200).json({
      success: true,
      message: "Verification code generated successfully",
      code: plainCode,
      expires_at: expiry,
    });
  } catch (error) {
    console.error("Error generating code:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});




module.exports = router;
