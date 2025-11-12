// models/wallet.js
const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "auth", // your user model name
    required: true,
    unique: true, // each user has exactly one wallet
  },
  balance: {
    type: Number,
    default: 0, // start with 0
    min: 0,
  },
  currency: {
    type: String,
    default: "INR", // or USD, depends on your region
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

// Auto-update `updated_at` field whenever wallet is modified
walletSchema.pre("save", function (next) {
  this.updated_at = new Date();
  next();
});

module.exports = mongoose.model("Wallet", walletSchema);
