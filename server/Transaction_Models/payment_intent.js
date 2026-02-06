const mongoose = require("mongoose");

const paymentIntentSchema = new mongoose.Schema({
  intent_id: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },

  retailer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Retailer",
    required: true,
  },

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "auth",
    default: null, // user linked only after fingerprint auth
  },

  amount: {
    type: Number,
    required: true,
    min: 1,
  },

  status: {
    type: String,
    enum: ["CREATED", "AUTHORIZED", "COMPLETED", "FAILED", "EXPIRED"],
    default: "CREATED",
  },

  expires_at: {
    type: Date,
    required: true,
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

// auto update updated_at
paymentIntentSchema.pre("save", function (next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model("PaymentIntent", paymentIntentSchema);
