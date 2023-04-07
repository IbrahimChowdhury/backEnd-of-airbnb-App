let express = require("express")
let app = express()
require("dotenv").config()
let mongoose = require("mongoose")
let jwt = require("jsonwebtoken")
let cookieParser = require("cookie-parser")
let imageDownloader = require("image-downloader")
let multer = require("multer")
let cors = require("cors")
let usermodel = require("./model/userModel")
let PlacesModel = require("./model/placesModel")
let bookingModel=require("./model/booking")
let bcrypt = require("bcrypt")
const saltRounds = 10;
const bcyprtSecret = process.env.bcrypt_secret;

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use("/upload", express.static(__dirname + "/upload/"))



app.use(cors({
    origin: "http://localhost:3000",
    credentials:true
}))



app.use(cookieParser())


app.get("/test", (req, res) => {
    res.send("hellow everyone")
})

// get the user who is logged into the website
let getUserFromReqToken=(req)=>{
    return new Promise((resolve,reject)=>{
        
        jwt.verify(req.cookies.token, process.env.jwt_secret, {}, async (err, user) => {
            if(!user) {
                throw err
            }
            return resolve(user)
        })
    })
}


app.post("/register", async (req, res) => {
    try {

        let user = await usermodel.findOne({ email: req.body.email })
        if (user) {
            res.send("User already exists")
        }
        else {
            bcrypt.hash(req.body.password, saltRounds, async function (err, hash) {
                // Store hash in your password DB.

                let newUser = usermodel({
                    
                    email: req.body.email,
                    password: hash
                })

                await newUser.save()

                res.status(202).json(newUser)
            });
        }

    } catch (error) {
        res.status(404).json(error)
    }
})



app.post("/login", async (req, res) => {
    let user = await usermodel.findOne({ email: req.body.email })
    if (user) {
        bcrypt.compare(req.body.password, user.password, function (err, result) {
            // result == true
            if (result == true) {

                let payload = {
                    name:user.name,
                    email: user.email,
                    id: user._id
                }
                let token = jwt.sign(payload, process.env.jwt_secret, {
                    expiresIn: "2d"
                })

                res.cookie("token", token).send("password is ok")
            }
            else {
                res.send("password is not ok")
            }
        });
    }

    else {
        res.send("not found")
    }
})


// for profile getting the token from cookie and get the value of the token using jwt.varify() and the find the main user using that token information and send the information of the user
app.get("/profile", async (req, res) => {
    // let { token } = req.cookies
    // if (token) {
    //     jwt.verify(token, process.env.jwt_secret, {}, async (err, user) => {
    //         let findUser= await usermodel.findById(user.id)
    //         res.json(findUser)
    //     })
    // }
    // else {
    //     res.json(null);
    // }

    let user=await getUserFromReqToken(req)
    if(user)
    {
        res.json(user)
    }
    else{
        res.json(null)
    }
 
    // res.json(token)
})



// logout session .. after login if anyone click logOut then he or she will log out of the profile
app.post("/logout", (req, res) => {
    res.cookie("token", '').json(true)
})


// function isValidUrl(url) {
//     try {
//       new URL(url);
//       return true;
//     } catch (error) {
//       return false;
//     }
//   }


// app.post("/uploadByLink",async(req,res)=>{

//     try {
//         let link=req.body.link
//     if (!isValidUrl(link)) {
//         throw new Error("Invalid URL");
//       }
//     let newName= "photo"+Date.now()+".jpg"
//   await  imageDownloader.image({
//         url:link,
//         dest:__dirname + "/upload/"+newName
//     })

//     res.send(newName)

//     } catch (error) {
//         console.error(error);
//     res.status(500).send("Error uploading image");
//     }

// })


// download the image using the link
app.post("/uploadByLink", async (req, res) => {
    let { link } = req.body
    let newName = "photo" + Date.now() + ".jpg"
    await imageDownloader.image({
        url:link ,
        dest: __dirname + "/upload/" + newName
    })
    res.json(newName)
})



// storage file locally in the uploads folder
const storage = multer.diskStorage({
    destination: function (req, photo, cb) {
        cb(null, 'upload/')
    },
    filename: function (req, photo, cb) {
        const normalizedFileName = Date.now() + '-' + photo.originalname
        cb(null, normalizedFileName);
    }
});

// Initialize multer middleware with the storage engine
const upload = multer({ storage: storage });

app.post("/upload", upload.single("photo"), (req, res) => {
    let name = req.file.filename
    res.json(name)
})

// creating a  new places
app.post("/places", (req, res) => {
    let { token } = req.cookies
    let { title,
        address,
        addedPhotos,
        description,
        perks,
        extraInfo,
        checkIn,
        checkOut,
        maxGuest,
        price } = req.body

    if (token) {
        jwt.verify(token, process.env.jwt_secret, {}, async (err, user) => {
            let placesDoc = await PlacesModel.create({
                owner: user.id,
                title: title,
                address: address,
                photos: addedPhotos,
                description: description,
                perks: perks,
                extraInfo: extraInfo,
                checkIn: checkIn,
                checkOut: checkOut,
                maxGuests: maxGuest,
                price:price
            })
            res.json(placesDoc)

        })
    }
})

// it get all the places that are created by a specific user
app.get("/users-places", (req, res) => {
    try {

        let { token } = req.cookies
        jwt.verify(token, process.env.jwt_secret, {}, async (err, user) => {
            let id  = user.id
            res.json(await PlacesModel.find({ owner: id }))
        })


    } catch (error) {

    }
})

// get the place that is contain the id 
app.get("/account/places/:id", (req, res) => {
    let { token } = req.cookies
    jwt.verify(token, process.env.jwt_secret, {}, async (err, user) => {
        let { id } = req.params
        let userId = user.id
        let findPlace = await PlacesModel.findById(id)
        if (userId == findPlace.owner.toString()) {
            res.json(findPlace)
        }
    })

})

// update the following place
app.put("/places", async (req, res) => {
    let { token } = req.cookies

    let {
        id,
        title,
        address,
        addedPhotos,
        description,
        perks,
        extraInfo,
        checkIn,
        checkOut,
        maxGuest,
        price } = req.body


    jwt.verify(token, process.env.jwt_secret, {}, async (err, user) => {
        let findPlace = await PlacesModel.findById(id)
        if (user.id == findPlace.owner.toString()) {
            findPlace.set({
                title: title,
                address: address,
                photos: addedPhotos,
                description: description,
                perks: perks,
                extraInfo: extraInfo,
                checkIn: checkIn,
                checkOut: checkOut,
                maxGuests: maxGuest,
                price: price

            })
            await findPlace.save()
            res.json("ok")
        }
    })
})



// for index page to get all the places
app.get("/allPlaces", async (req, res) => {
    res.json(await PlacesModel.find())
})

app.get("/allplaces/:id", async(req, res) => {
  
        let { id } = req.params    
        let findPlace = await PlacesModel.findById(id)
            res.json(findPlace)
 

})


app.post("/bookings", async(req,res)=>{

    let user=await getUserFromReqToken(req)

    let { 
        place,checkIn,checkOut,maxGuest,name,mobileNo,price,}=req.body
     
    bookingModel.create({
       userId:user.id, place,checkIn,checkOut,maxGuest,name,mobileNo,price
    }).then((doc)=>{
        res.json(doc)
    }).catch((err)=>{
        throw err
    })
})




app.get("/bookings",async(req,res)=>{
    
    let user=await getUserFromReqToken(req)
    res.json(await bookingModel.find({userId:user.id}).populate('place'))
    
})


app.delete("/deleteUserPlace/:id",async(req,res)=>{
    let { id }=req.params
    await PlacesModel.findByIdAndDelete({_id:id})
})

app.delete("/deleteBookings/:id",async(req,res)=>{
    let {id}=req.params
    await bookingModel.findByIdAndDelete({_id:id})
})

module.exports = app