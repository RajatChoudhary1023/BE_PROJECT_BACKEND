const mongoose = require("mongoose");

const fingerprintSchema = new mongoose.Schema({
  fingerprint: {
    type: String, // store as Base64 or encrypted binary
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Fingerprint", fingerprintSchema);
