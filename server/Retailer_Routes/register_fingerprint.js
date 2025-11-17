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
      const { code, fingerprint_hash } = req.body;
  
      if (!code) {
        return res.status(400).json({
          success: false,
          message: "Verification code is required",
        });
      }
  
      // Hash the incoming code for comparison
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
  
      // Validate fingerprint hash
      if (!fingerprint_hash) {
        return res.status(400).json({
          success: false,
          message: "Fingerprint hash is required",
        });
      }
  
      // Register fingerprint
      user.fingerprint = fingerprint_hash;
      user.isfingerprint_registered = true;
  
      // Clear code fields
      user.verification_code = null;
      user.code_expiry = null;
  
      await user.save();
      
      try {
        if (user.device_token_mobile) {
          await sendFCM(
            user.device_token_mobile,
            "Fingerprint Registered",
            "Your fingerprint has been successfully registered."
          );
        }
  
        if (user.device_token_web) {
          await sendFCM(
            user.device_token_web,
            "Fingerprint Registered",
            "Your fingerprint is now active."
          );
        }
      } catch (fcmErr) {
        console.error("FCM Error:", fcmErr);
        // DO NOT return error → FCM is optional.
      }


      res.status(200).json({
        success: true,
        message: "Fingerprint registered successfully",
        user: {
          name: user.name,
          email: user.email,
          phone: user.phone,
        },
      });
    } catch (error) {
      console.error("Error in verify_code_and_register_fingerprint:", error);
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
  module.exports = router;