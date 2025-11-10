const express = require("express");
require("dotenv").config();
const Retailer = require('../Retailer_Models/auth')
const verify_firebase = require("../Middleware/verify-firebase");
const router = express.Router();

/**
 * @route   POST /retailer/register
 * @desc    Register or sync retailer with Firebase user
 * @access  Protected (Firebase token required)
 */
router.post("/register_retailer", verify_firebase, async (req, res) => {
  try {
    const {
      shop_name,
      owner_name,
      phone,
      // bank_name,
      // account_number,
      // ifsc_code,
      // upi_id,
      address,
      city,
      state,
      pincode,
    } = req.body;

    const { email } = req.user; // Decoded from Firebase token

    // ✅ Validate required fields
    if (!shop_name || !owner_name || !phone) {
      return res.status(400).json({
        success: false,
        message: "Shop name, owner name, and phone number are required",
      });
    }

    // ✅ Check if retailer already exists
    let retailer = await Retailer.findOne({ email });

    if (!retailer) {
      // ✅ Create new retailer
      retailer = new Retailer({
        shop_name,
        owner_name,
        email,
        phone,
        // bank_name,
        // account_number,
        // ifsc_code,
        // upi_id,
        address,
        city,
        state,
        pincode,
      });

      await retailer.save();
    } else {
      // ✅ Update existing retailer info (optional sync behavior)
      retailer.shop_name = shop_name || retailer.shop_name;
      retailer.owner_name = owner_name || retailer.owner_name;
      retailer.phone = phone || retailer.phone;
      // retailer.bank_name = bank_name || retailer.bank_name;
      // retailer.account_number = account_number || retailer.account_number;
      // retailer.ifsc_code = ifsc_code || retailer.ifsc_code;
      // retailer.upi_id = upi_id || retailer.upi_id;
      retailer.address = address || retailer.address;
      retailer.city = city || retailer.city;
      retailer.state = state || retailer.state;
      retailer.pincode = pincode || retailer.pincode;
      retailer.isActive = true;

      await retailer.save();
    }

    res.status(201).json({
      success: true,
      message: retailer
        ? "Retailer registered or updated successfully"
        : "New retailer created",
      retailer,
    });
  } catch (error) {
    console.error("Error in /retailer/register:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

module.exports = router;
