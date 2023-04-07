let mongoose=require("mongoose")

let userSchema= mongoose.Schema({
    name:String,
    email:{
        type:String,
        unique:true
    },
    password:String
})


module.exports=mongoose.model("UsersData",userSchema)