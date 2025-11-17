const express = require("express");
require("dotenv").config();
const auth=require('../Models/auth')
const Retailer=require('../Retailer_Models/auth');
const verify_firebase = require("../Middleware/verify-firebase");
const router = express.Router();

router.post("/get_nearby_stores",verify_firebase, async (req, res) => {
    try {
        const { latitude, longitude, radius } = req.body;
        const { email } = req.user;
      const user = await auth.findOne({ email });
      if (!user) {
        return res.status(400).json({success:false,message:"User not found"});
      }
      if (!latitude || !longitude) {
        return res.status(400).json({
          success: false,
          message: "Latitude and longitude are required",
        });
      }
  
      // Default radius: 5km
      const searchRadius = radius ? radius * 1000 : 5000;
  
      const stores = await Retailer.find({
        location: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [longitude, latitude],
            },
            $maxDistance: searchRadius,
          },
        },
      });
  
      res.json({
        success: true,
        stores,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  });
  

  module.exports = router;