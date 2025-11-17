const express = require("express");
require("dotenv").config();
const Retailer = require('../Retailer_Models/auth')
const Retailer_wallet=require('../Retailer_Models/wallet')
const verify_firebase = require("../Middleware/verify-firebase");
const router = express.Router();

/**
 * @route   POST /retailer/register
 * @desc    Register or sync retailer with Firebase user
 * @access  Protected (Firebase token required)
 */
router.post("/register_retailer", verify_firebase, async (req, res) => {
  // router.post("/register_retailer", async (req, res) => {
  try {
    const {
      shop_name,
      owner_name,
      phone,
      address,
      city,
      state,
      pincode,
      lat,
      lng,   // 👈 ADD THESE
    } = req.body;

    const { email } = req.user;
    // const email="sharma@gmail.com";

    if (!shop_name || !owner_name || !phone) {
      return res.status(400).json({
        success: false,
        message: "Shop name, owner name, and phone number are required",
      });
    }

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude are required for retailer location",
      });
    }

    let retailer = await Retailer.findOne({ email });

    if (!retailer) {
      // 🔹 Create new retailer
      retailer = new Retailer({
        shop_name,
        owner_name,
        email,
        phone,
        address,
        city,
        state,
        pincode,

        // 🌍 Add location coordinates
        location: {
          type: "Point",
          coordinates: [lng, lat], // IMPORTANT: [longitude, latitude]
        },
      });

      await retailer.save();

      // 💰 Create wallet
      const wallet = new Retailer_wallet({
        retailer: retailer._id,
        balance: 0,
      });
      await wallet.save();

    } else {
      // 🔄 Update existing retailer
      retailer.shop_name = shop_name || retailer.shop_name;
      retailer.owner_name = owner_name || retailer.owner_name;
      retailer.phone = phone || retailer.phone;

      retailer.address = address || retailer.address;
      retailer.city = city || retailer.city;
      retailer.state = state || retailer.state;
      retailer.pincode = pincode || retailer.pincode;

      // 🌍 Update location if new coords given
      if (lat && lng) {
        retailer.location = {
          type: "Point",
          coordinates: [lng, lat],
        };
      }

      retailer.isActive = true;

      await retailer.save();
    }

    res.status(201).json({
      success: true,
      message: "Retailer registered or updated successfully",
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


router.post("/save_web_token", verify_firebase, async (req, res) => {
  try {
    const { device_token } = req.body;
    const { email } = req.user;
    if (!device_token) return res.status(400).json({ success:false, message:'device_token required' });

    const user = await auth.findOne({ email });
    if (!user) return res.status(404).json({ success:false, message:'user not found' });

    user.device_token_web = device_token;
    await user.save();
    res.json({ success:true, message:'web token saved' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success:false });
  }
});

module.exports = router;
