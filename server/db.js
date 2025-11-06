const mongoose=require('mongoose')
const mongoURI="mongodb+srv://rajatchoudhary2022comp_db_user:RcKz6puLDpIbOQnb@beproject.m7nu3ky.mongodb.net/?appName=BEPROJECT"

const connection=()=> {
    mongoose.connect(mongoURI)
}

mongoose.connection.on("connected",()=> {
    console.log("MongoDb Database Connected Successfully")
})

module.exports=connection