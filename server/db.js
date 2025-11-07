const mongoose=require('mongoose')
require("dotenv").config();
const mongoURI=process.env.MONGODB_URI

const connection=()=> {
    mongoose.connect(mongoURI)
}

mongoose.connection.on("connected",()=> {
    console.log("MongoDb Database Connected Successfully")
})

module.exports=connection