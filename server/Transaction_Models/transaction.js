const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  transaction_id: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },

  intent_id: {
    type: String,
    required: true,
    index: true,
  },

  from_user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "auth",
    required: true,
  },

  to_retailer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Retailer",
    required: true,
  },

  amount: {
    type: Number,
    required: true,
    min: 1,
  },

  status: {
    type: String,
    enum: ["SUCCESS", "FAILED"],
    default: "SUCCESS",
  },

  created_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Transaction", transactionSchema);
