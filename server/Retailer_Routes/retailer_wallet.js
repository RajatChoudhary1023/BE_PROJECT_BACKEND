const express = require("express");
const Wallet = require("../Retailer_Models/wallet");
const verify_firebase = require("../Middleware/verify-firebase");
const Retailer=require('../Retailer_Models/auth')
const router = express.Router();

//   router.get("/check_retailer_balance",verify_firebase,async (req,res)=> {
    router.get("/check_retailer_balance",async (req,res)=> {

    const  email ="xyz@gmail.com"
    // const email ="c.rajat1006@gmail.com";
    const user=await Retailer.findOne({ email })
    if (!user) {
      return res.status(404).json({success:"false",message:"User not found"})
    }
    const wallet=await Wallet.findOne({retailer:user._id})
    const balance=wallet.balance;
    return res.status(500).json({success:true,balance:balance})
  })

module.exports=router