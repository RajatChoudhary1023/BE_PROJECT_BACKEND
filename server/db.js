const mongoose=require('mongoose')
require("dotenv").config();
const mongoURI=process.env.MONGODB_URI
require("node:dns").setServers(["1.1.1.1", "8.8.8.8","8.8.4.4"]);

const connection=()=> {
    mongoose.connect(mongoURI)
}

mongoose.connection.on("connected",()=> {
    console.log("MongoDb Database Connected Successfully")
})

module.exports=connection