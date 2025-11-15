// models/retailerWallet.js
const mongoose = require("mongoose");

const retailerWalletSchema = new mongoose.Schema({
  retailer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Retailer", // your retailer model name
    required: true,
    unique: true, // each retailer gets exactly one wallet
  },
  balance: {
    type: Number,
    default: 0, // initial balance
    min: 0,
  },
  currency: {
    type: String,
    default: "INR",
  },
  is_active: {
    type: Boolean,
    default: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
});

// Auto-update the updated_at field
retailerWalletSchema.pre("save", function (next) {
  this.updated_at = new Date();
  next();
});

module.exports = mongoose.model("RetailerWallet", retailerWalletSchema);
