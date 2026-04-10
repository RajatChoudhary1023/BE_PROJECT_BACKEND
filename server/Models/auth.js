const mongoose=require('mongoose')

const userschema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  phone: {
    type:String,
    required:true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  profile_image: {
    type: String, // Cloudinary URL
  },
  fingerprint_id: {
    type: Number,
  },
  isfingerprint_registered:{
    type:Boolean,
    default:false
  },
  verification_code: {
    type: String,
  },
  code_expiry: {
    type: Date,
  },
  device_token_mobile: { type: String },
});

module.exports=mongoose.model('auth',userschema)