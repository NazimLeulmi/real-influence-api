const express = require("express");
const mongoose = require("mongoose");
const validation = require("./validation");
const models = require("./models");
const bcrypt = require("bcrypt");
const session = require("express-session");
const multer = require("multer");
const sharp = require("sharp");
const fs = require("fs");
const helmet = require("helmet");
const compression = require("compression");
const cors = require("cors");
const MongoStore = require("connect-mongo");

let app = express();
// cross origin scripting

app.use(
  cors({
    origin: [
      "http://localhost:8888",
      "http://localhost:3000",
      "http://localhost",
    ],
    credentials: true,
  })
);

// security layer
app.use(helmet());
// compression
app.use(compression());

app.use("/static", express.static("static"));

app.use(express.json({ limit: "50mb" }));

const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: { fieldSize: 100 * 1024 * 1024 },
});

// Mongo Database Connection
connectDB().catch((err) => console.log(err));
async function connectDB() {
  await mongoose.connect("mongodb://localhost:27017/real-influence");
  console.log("Connected to Mongo Database");
}

app.use(
  session({
    secret: "my very important session secret",
    resave: true,
    saveUninitialized: false,
    store: MongoStore.create({
      client: mongoose.connection.getClient(),
      dbName: "real-influence",
      collectionName: "express-sessions",
      ttl: 480 * 60 * 1000,
    }),
    // proxy: true,
    // maxAge : 8 hours
    cookie: {
      secure: false,
      maxAge: 480 * 60 * 1000,
      httpOnly: true,
    },
  })
);

app.get("/", async (req, res) => {
  res.send("<h1>Real Influence</h1>");
});

app.post("/signin", async (req, res) => {
  const { isValid, errors } = validation.validateSignIn(req.body.email);
  if (!isValid) return res.json({ isValid: false, errors });
  const user = await models.UserModel.findOne({
    email: req.body.email.toLowerCase(),
  });
  if (!user) {
    return res.json({
      isValid: false,
      error: "The user doesn't exist",
    });
  }
  const isCorrect = await bcrypt.compare(req.body.password, user.password);
  if (!isCorrect) {
    return res.json({
      isValid: false,
      error: "The password is invalid",
    });
  }
  if (user.approved === false) {
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
      return;
    }
    const duplicate = await models.UserModel.findOne({
      email: req.body.email.toLowerCase(),
    });
    if (duplicate) {
      console.log("Duplicate email");
      return res.json({
        success: false,
        error: "The email has been used already",
      });
    }
    fs.access("./static", (err) => {
      if (err) {
        fs.mkdirSync("./static");
        console.log("Created static folder");
      }
    });
    await sharp(req.files.profileImage[0].buffer)
      .resize({
        width: 1080,
        height: 1080,
      })
      .toFile("./static/" + req.files.profileImage[0].originalname);
    const hash = await bcrypt.hash(req.body.password, 12);
    const userModel = new models.UserModel({
      name: req.body.name,
      email: req.body.email.toLowerCase(),
      dialCode: req.body.dialCode,
      isoCode: req.body.isoCode,
      number: req.body.number,
      password: hash,
      profileImg: "static/" + req.files.profileImage[0].originalname,
    });
    const userEntry = await userModel.save().catch((err) => console.log(err));
    return res.json({ success: true });
  } catch (error) {
    console.log(error);
  }
});

app.get("/check-auth", async (req, res) => {
  if (req.session.userId) {
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
  await sharp(req.file.buffer)
    .resize({
      width: 1080,
      height: 1080,
    })
    .toFile("./static/" + req.file.originalname);

  const updated = await models.UserModel.findOneAndUpdate(
    { _id: req.session.userId },
    {
      $push: { gallery: { path: "static/" + req.file.originalname } },
    },
    { new: true }
  );
  return res.json({ success: true, user: updated });
});
// GET influencers
app.get("/users", async (req, res) => {
  if (!req.session.adminId && !req.session.userId) {
    console.log(req.session);
    console.log("restricted route");
    return res.json({ access: "restricted" });
  }
  const users = await models.UserModel.find().select(
    "id name bio email profileImg gallery approved"
  );
  return res.json({ success: true, influencers: users });
});

app.get("/influencers-table", async (req, res) => {
  if (!req.session.adminId) {
    console.log(req.session);
    console.log("restricted route");
    return res.json({ access: "restricted" });
  }
  const users = await models.UserModel.find().select(
    "id name bio email profileImg approved"
  );
  return res.json({ success: true, influencers: users });
});

app.get("/admins", async (req, res) => {
  if (!req.session.adminId) {
    console.log(req.session);
    console.log("restricted route");
    return res.json({ access: "restricted" });
  }
  const admins = await models.AdminModel.find();
  return res.json({ success: true, admins: admins });
});
app.post("/admin-signup", async (req, res) => {
  const { isValid, errors } = validation.validateAdminSignUp(req.body);
  if (!isValid) return res.json({ isValid, errors });
  try {
    let dupUser = await models.AdminModel.findOne({ email: req.body.email });
    if (dupUser)
      return res.json({
        isValid: false,
        errors: { email: "The email has been used by another admin" },
      });
    const { email, password, username } = req.body;
    const hash = await bcrypt.hash(password, 12);
    const newAdmin = new models.AdminModel({
      email: email,
      username: username,
      password: hash,
      super: false,
    });
    const adminEntry = await newAdmin.save().catch((err) => console.log(err));
    console.log("Registered admin account", adminEntry);
    return res.json({ isValid: true });
  } catch (error) {
    console.log(error);
    return res.json({ success: false });
  }
});
app.post("/admin-signin", async (req, res) => {
  console.log("Admin Sign in");
  const { isValid, errors } = validation.validateSignIn(req.body.email);
  if (!isValid) return res.json({ isValid: false, errors });
  const admin = await models.AdminModel.findOne({
    email: req.body.email.toLowerCase(),
  });
  if (!admin) {
    return res.json({
      isValid: false,
      error: "The user doesn't exist",
    });
  }
  const isCorrect = await bcrypt.compare(req.body.password, admin.password);
  if (!isCorrect) {
    return res.json({
      isValid: false,
      error: "The password is invalid",
    });
  }
  req.session.adminId = admin._id.toHexString();
  req.session.username = admin.username;
  req.session.email = admin.email;
  console.log(req.session);
  return res.json({
    success: true,
    admin: {
      adminId: admin._id.toHexString(),
      email: admin.email,
      super: admin.super,
    },
  });
});
app.post("/delete-admin", async (req, res) => {
  if (!req.session.adminId) {
    return res.json({ access: "restricted" });
  }
  const superAdmin = await models.AdminModel.findById(req.session.adminId);
  if (superAdmin.super === false) {
    console.log("Restricted Access");
    return res.json({ access: "restricted" });
  }

  const admin = await models.AdminModel.findById(req.body.id);
  if (admin.super === true) {
    console.log("You can't delete a super admin");
    return res.json({ access: "restricted" });
  }

  await admin.delete();

  return res.json({ success: true });

  // const updated = await models.UserModel.findOneAndUpdate(
  //   { _id: req.body.id },
  //   { approved: true },
  //   { new: true }
  // ).select("id name bio email profileImg approved");
  // console.log(updated, "Approved");
  // return res.json({ success: true, user: updated });
});

app.post("/approve", async (req, res) => {
  if (!req.session.adminId) {
    return res.json({ access: "restricted" });
  }

  const updated = await models.UserModel.findOneAndUpdate(
    { _id: req.body.id },
    { approved: true },
    { new: true }
  ).select("id name bio email profileImg approved");
  console.log(updated, "Approved");
  return res.json({ success: true, user: updated });
});
app.post("/revoke", async (req, res) => {
  if (!req.session.adminId) {
    return res.json({ access: "restricted" });
  }

  const updated = await models.UserModel.findOneAndUpdate(
    { _id: req.body.id },
    { approved: false },
    { new: true }
  ).select("id name bio email profileImg approved");
  console.log(updated, "Revoked");
  return res.json({ success: true, user: updated });
});
app.listen(8888, () => console.log("Node.js server running on port 8888"));
