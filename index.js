const express = require("express");
const mongoose = require("mongoose");
const validation = require("./validation");
const models = require("./models");
const bcrypt = require("bcrypt");
const session = require("express-session");
const multer = require("multer");
const path = require("path");
const sharp = require("sharp");
const fs = require("fs");

let app = express();


app.use("/static", express.static("static"));

app.use(express.json({ limit: "50mb" }));

const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: { fieldSize: 100 * 1024 * 1024 },
});

app.use(
  session({
    secret: "my very important session secret",
    resave: false,
    saveUninitialized: false,
    proxy: true,
    cookie: { secure: false, maxAge: 1000 * 60 * 60 * 8 },
  })
);

// Mongo Database Connection
connectDB().catch((err) => console.log(err));
async function connectDB() {
  await mongoose.connect("mongodb://localhost:27017/miss-influencer");
  console.log("Connected to Mongo Database");
}


app.get("/", async (req, res) => {
  res.send("<h1>Real Influence</h1>");
})

app.post("/signin", async (req, res) => {
  const { isValid, errors } = validation.validateSignIn(req.body.email);
  if (!isValid) return res.json({ isValid: false, errors });
  const user = await models.UserModel.findOne({ email: req.body.email.toLowerCase() });
  if (!user) {
    console.log("The user doesn't exist");
    return res.json({
      isValid: false,
      error: "The user doesn't exist",
    });
  }
  const isCorrect = await bcrypt.compare(req.body.password, user.password);
  if (!isCorrect) {
    console.log("The password is incorrect");
    return res.json({
      isValid: false,
      error: "The password is invalid",
    });
  }
  if (user.approved === false) {
    console.log("The user isn't approved");
    return res.json({
      isValid: false,
      error: "Your account has to be approved",
    });
  }
  // The user login data is correct
  req.session.userId = user._id;
  req.session.name = user.name;
  req.session.email = user.email;
  req.session.profileImg = user.profileImg;
  req.session.approved = user.approved;
  return res.json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      bio: user.bio,
      email: user.email,
      profileImg: user.profileImg,
      gallery: user.gallery,
      approved: user.approved,
    },
  });
});
const signUpFields = upload.fields([
  { name: "name" },
  { name: "email" },
  { name: "dialCode" },
  { name: "isoCode" },
  { name: "number" },
  { name: "password" },
  { name: "passwordc" },
  { name: "profileImage" },
]);
app.post("/signup", signUpFields, async (req, res) => {
  try {
    const { isValid, errors } = validation.validateSignUp(req.body);
    if (isValid === false) {
      console.log({ success: false, errors });
      return;
    }
    const duplicate = await models.UserModel.findOne({ email: req.body.email.toLowerCase() });
    if (duplicate) {
      console.log("Duplicate email");
      return res.json({
        success: false,
        error: "The email has been used already",
      });
    }
    fs.access("./static",err=>{
     if(err){
	fs.mkdirSync("./static");
	console.log("Created static folder");
     }
    })
    await sharp(req.files.profileImage[0].buffer).resize({
      width:1080,height:1080
    }).toFile("./static/"+req.files.profileImage[0].originalname);
    const hash = await bcrypt.hash(req.body.password, 12);
    const userModel = new models.UserModel({
      name: req.body.name,
      email: req.body.email.toLowerCase(),
      dialCode: req.body.dialCode,
      isoCode: req.body.isoCode,
      number: req.body.number,
      password: hash,
      profileImg: "static/"+req.files.profileImage[0].originalname,
    });
    const userEntry = await userModel.save().catch((err) => console.log(err));
    return res.json({ success: true });
  } catch (error) {
    console.log(error);
  }
});

app.get("/check-auth", async (req, res) => {
  if (req.session.userId) {
    console.log("User signed in");
    const user = await models.UserModel.findById(req.session.userId).catch(
      (err) => console.log(err)
    );
    if (!user) return res.json({ success: false });
    return res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        bio: user.bio,
        email: user.email,
        gallery: user.gallery,
        profileImg: user.profileImg,
      },
    });
  } else {
    console.log("User NOT signed in");
    return res.json({ success: false });
  }
});

app.post("/signout", async (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.json({ success: false });
    else return res.json({ success: true });
  });
});

app.post("/bio", async (req, res) => {
  if (!req.session.userId) {
    return res.json({ access: "restricted" });
  }

  const updated = await models.UserModel.findOneAndUpdate(
    { _id: req.session.userId },
    { bio: req.body.bio },
    { new: true }
  );
  console.log(updated.bio);
  return res.json({ success: true, user: updated });
});


app.post("/profileImage", upload.single("profileImage"), async (req, res) => {
  if (!req.session.userId) {
    console.log("Restricted route");
    return res.json({ access: "restricted" });
  }

  const updated = await models.UserModel.findOneAndUpdate(
    { _id: req.session.userId },
    {
      profileImg: req.file.path,
    },
    { new: true }
  );
  return res.json({ success: true, user: updated });
});
app.post("/galleryImage", upload.single("galleryImage"), async (req, res) => {
  if (!req.session.userId) {
    console.log("Restricted route");
    return res.json({ access: "restricted" });
  }
await sharp(req.file.buffer).resize({
      width:1080,height:1080
    }).toFile("./static/"+req.file.originalname);

  const updated = await models.UserModel.findOneAndUpdate(
    { _id: req.session.userId },
    {
      $push: { gallery: { path: "static/"+req.file.originalname } }
    },
    { new: true }
  );
  return res.json({ success: true, user: updated });
});
// GET influencers
app.get("/users", async (req, res) => {
  if (!req.session.userId) {
    console.log(req.session);
    console.log("restricted route")
    return res.json({ access: "restricted" });
  }
  console.log("getting users");

  const users = await models.UserModel.find().select('id name bio email profileImg gallery approved');
  console.log(users);
  return res.json({ success: true, influencers: users });
});

app.listen(8888, () => console.log("Node.js server running on port 8888"));
