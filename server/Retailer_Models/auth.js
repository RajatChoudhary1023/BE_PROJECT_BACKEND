const mongoose = require("mongoose");

const retailerSchema = new mongoose.Schema({
  // 🏪 Basic store info
  shop_name: {
    type: String,
    required: true,
  },
  owner_name: {
    type: String,
    required: true,
  },

  // 📧 Contact info
  email: {
    type: String,
    required: true,
    unique: true, // one retailer per email
  },
  phone: {
    type: Number,
    required: true,
  },

  // 🏦 Bank or payment info
  // bank_name: {
  //   type: String,
  // },
  // account_number: {
  //   type: String,
  // },
  // ifsc_code: {
  //   type: String,
  // },
  // upi_id: {
  //   type: String,
  // },

  // 📍 Store location
  address: {
    type: String,
  },
  city: {
    type: String,
  },
  state: {
    type: String,
  },
  pincode: {
    type: String,
  },

  isActive: {
    type: Boolean,
    default: true,
  },
  // 🕒 Metadata
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
});

// Update timestamp automatically on save
retailerSchema.pre("save", function (next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model("Retailer", retailerSchema);
