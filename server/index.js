const express=require('express')
const cors=require('cors')
const database=require('./db')
const PORT=5000

const app=express()

app.use(cors())
app.use(express.json())
app.use('/api/auth',require('./Routes/auth'))
app.use('/api/retailer_auth',require('./Retailer_Routes/auth'))
// app.use('/api/Practicd',require('./Routes/Practice'))

app.get('/',(req,res)=> {
    res.send("Smart Biometric Payment System is Working")
})

database()
app.listen(PORT,()=> {
    console.log(`Smart Biometric Payment System is Working is running on http://localhost:${PORT}`)
})


// const fs = require('fs');

// const raw = fs.readFileSync('D:/project/Web/React/ecommerce/Backend/firebase_service_account.json');
// const json = JSON.parse(raw);

// // Escape newlines for env
// json.private_key = json.private_key.replace(/\n/g, '\\n');

// const envValue = JSON.stringify(json);
// console.log(`FIREBASE_SERVICE_ACCOUNT_JSON='${envValue}'`);
