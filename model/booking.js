let mongoose=require("mongoose")

// here the ref is the model name of the mongoose model
let bookingSchema=mongoose.Schema({
    userId:{type:mongoose.Schema.Types.ObjectId, required:true,  },
    place:{type:mongoose.Schema.Types.ObjectId, required:true, ref:"places"},
    checkIn:{type:Date, required:true},
    checkOut:{type:Date,required:true},
    name:{type:String, required:true},
    mobileNo:{type:String, required:true},
    maxGuest:String,
    price:Number
})

module.exports=mongoose.model("booking",bookingSchema)