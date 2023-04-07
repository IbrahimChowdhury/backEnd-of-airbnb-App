let app=require("./app")
let port=4000
let mongoose=require("mongoose")
require("dotenv").config()


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


