const { config } = require("dotenv")
let app=require("./app")
let mongoose=require("mongoose")
require("dotenv").config()
let port=process.env.PORT || 5000


mongoose.connect(process.env.db_url)
.then(()=>{
    console.log("mongoDB is connected")
})
.catch(()=>{
    console.log("mongoDB is not connected")
})

app.listen(port,()=>{
    console.log(`your server is running at http://localhost:${port}`)
})


