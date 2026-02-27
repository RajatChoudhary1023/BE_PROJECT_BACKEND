const express = require("express");
require("dotenv").config();
const auth = require("../Models/auth");
const crypto = require("crypto");
const verify_firebase = require("../Middleware/verify-firebase");
const router = express.Router();
const fcm=require('../Helper/fcm')

function hashCode(code) {
    return crypto.createHash("sha256").update(code).digest("hex");
  }
  

router.post("/verify_code_and_register_fingerprint", async (req, res) => {
  try {
    const { code, fingerprint_id } = req.body;

    if (!code || fingerprint_id === undefined) {
      return res.status(400).json({
        success: false,
        message: "Code and fingerprint ID are required",
      });
    }

    const hashedCode = hashCode(code);

    const user = await auth.findOne({ verification_code: hashedCode });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Invalid or expired verification code",
      });
    }

    if (user.code_expiry < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Verification code has expired",
      });
    }

    // ✅ Store fingerprint ID instead of hash
    user.fingerprint_id = fingerprint_id;
    user.isfingerprint_registered = true;

    user.verification_code = null;
    user.code_expiry = null;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Fingerprint registered successfully",
      fingerprint_id: fingerprint_id,
    });

  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});
  

router.post('/send_code_to_device',async (req,res)=> {
    try {
      const {code}=req.body;
      if (!code) {
        return res.status(404).json({success:false,message:"Verification Code not found"})
      }
      const hashedCode = hashCode(code);
      // Find user with that hashed code
      const user = await auth.findOne({ verification_code: hashedCode });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Invalid or expired verification code",
        });
      }
  
      // Check if code expired
      if (user.code_expiry < new Date()) {
        return res.status(400).json({
          success: false,
          message: "Verification code has expired",
        });
      }
      res.status(200).json({success:true,message:"Code Sent to device successfully",code:code,user: {
        name: user.name,
        email: user.email,
        phone: user.phone,
      },})
    } catch (error) {
      console.error("Error in sending code to device:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  })

router.post("/check_fingerprint_status", async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: "Verification code is required",
      });
    }

    const hashedCode = hashCode(code);

    // Find user with that hashed code
    const user = await auth.findOne({ verification_code: hashedCode });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Invalid verification code or user not found",
      });
    }

    res.status(200).json({
      success: true,
      isfingerprint_registered: user.isfingerprint_registered,
      message: user.isfingerprint_registered
        ? "Fingerprint is registered"
        : "Fingerprint is not registered",
    });
  } catch (error) {
    console.error("Error checking fingerprint status:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});
  module.exports = router;