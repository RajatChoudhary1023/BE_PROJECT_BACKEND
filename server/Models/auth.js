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
  fingerprint: {
    type: String,
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
});

module.exports=mongoose.model('auth',userschema)