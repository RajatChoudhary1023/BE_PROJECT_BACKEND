const express = require("express");
const Wallet = require("../Models/wallet");
const verify_firebase = require("../Middleware/verify-firebase");
const auth = require("../Models/auth");

const router = express.Router();

router.post("/add_to_wallet", verify_firebase, async (req, res) => {
// router.post("/add_to_wallet", async (req, res) => {
    try {
      const { amount } = req.body;
      const { email } = req.user;
    // const  email  = "c.rajat1006@gmail.com";

  
      if (amount <= 0) {
        return res.status(400).json({ success: false, message: "Invalid amount" });
      }
  
      const user = await auth.findOne({ email });
      if (!user) {
        return res.status(400).json({success:false,message:"User not found"});
      }
      const wallet = await Wallet.findOne({ user: user._id });
  
      wallet.balance += Number(amount);
      await wallet.save();
  
      res.json({ success: true, message: "Amount added successfully", balance: wallet.balance });
    } catch (error) {
      console.error("Error adding to wallet:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });


  router.post("/deduct_from_wallet", verify_firebase, async (req, res) => {
    // router.post("/deduct_from_wallet", async (req, res) => {
    try {
      const { amount } = req.body;
      const { email } = req.user;
        // const  email  = "c.rajat1006@gmail.com"
  
      if (amount <= 0) {
        return res.status(400).json({ success: false, message: "Invalid amount" });
      }
  
      const user = await auth.findOne({ email });
      if (!user) {
        return res.status(400).json({success:false,message:"User not found"});
      }
      const wallet = await Wallet.findOne({ user: user._id });
  
      if (wallet.balance < amount) {
        return res.status(400).json({ success: false, message: "Insufficient balance" });
      }
  
      wallet.balance -= Number(amount);
      await wallet.save();
  
      res.json({ success: true, message: "Amount deducted successfully", balance: wallet.balance });
    } catch (error) {
      console.error("Error deducting from wallet:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  router.get("/check_balance",verify_firebase,async (req,res)=> {
    // router.get("/check_balance",async (req,res)=> {

    const { email }=req.user;
    // const email ="c.rajat1006@gmail.com";
    const user=await auth.findOne({ email })
    if (!user) {
      return res.status(404).json({success:"false",message:"User not found"})
    }
    const wallet=await Wallet.findOne({user:user._id})
    const balance=wallet.balance;
    return res.status(500).json({success:true,balance:balance})
  })

module.exports=router