const express = require("express");
require("dotenv").config();
const auth = require("../Models/auth");
const verify_firebase = require("../Middleware/verify-firebase");
const router = express.Router();

router.post("/register", verify_firebase, async (req, res) => {
  try {
    const { name, fingerprint_hash,phone } = req.body;
    const { email } = req.user; // decoded from Firebase token

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
        phone
      });

      // Optional fingerprint info
      if (fingerprint_hash) {
        user.fingerprint = fingerprint_hash;
        user.isfingerprint_registered = true;
      }

      await user.save();
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

module.exports = router;
