const express = require("express");
const validation = require("../validation");
const bcrypt = require("bcrypt");
const router = express.Router();
const AdminModel = require("../models/admin");
const InfluencerModel = require("../models/influencer");
const UserModel = require("../models/user");

router.get("/", async (req, res) => {
  if (!req.session.adminId) {
    console.log("restricted route");
    return res.json({ admins: null });
  }
  const admin = await AdminModel.findById(req.session.adminId).select(
    "username email super"
  );
  if (!admin || admin.super === false) {
    console.log("restricted route");
    return res.json({ admins: null });
  }
  const admins = await AdminModel.find();
  return res.json({ admins: admins });
});

router.post("/signup", async (req, res) => {
  const { isValid, errors } = validation.validateAdminSignUp(req.body);
  if (!isValid) return res.json({ isValid, errors });
  try {
    let dupUser = await AdminModel.findOne({ email: req.body.email });
    if (dupUser)
      return res.json({
        isValid: false,
        errors: { email: "The email has been used by another admin" },
      });
    const { email, password, username } = req.body;
    const hash = await bcrypt.hash(password, 12);
    const newAdmin = new AdminModel({
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

router.post("/signin", async (req, res) => {
  console.log(req.body);
  const { isValid, errors } = validation.validateSignIn(req.body.email);
  if (!isValid) return res.json({ isValid: false, errors });
  const admin = await AdminModel.findOne({
    email: req.body.email.toLowerCase(),
  });
  if (!admin) {
    console.log(admin);
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
  return res.json({
    success: true,
    admin: {
      adminId: admin._id.toHexString(),
      email: admin.email,
      super: admin.super,
    },
  });
});

router.post("/delete", async (req, res) => {
  if (!req.session.adminId) {
    return res.json({ access: "restricted" });
  }
  const superAdmin = await AdminModel.findById(req.session.adminId);
  if (superAdmin.super === false) {
    console.log("Restricted Access");
    return res.json({ access: "restricted" });
  }

  const admin = await AdminModel.findById(req.body.id);
  if (admin.super === true) {
    console.log("You can't delete a super admin");
    return res.json({ access: "restricted" });
  }

  await admin.delete();

  return res.json({ success: true });
});

router.post("/status", async (req, res) => {
  if (!req.session.adminId) {
    return res.json({ access: "restricted" });
  }

  const influencer = await InfluencerModel.findById(req.body.id).select("id name bio email profileImg approved");
  influencer.approved = !influencer.approved;
  const newInfluencer = await influencer.save();
  return res.json({ influencer: newInfluencer });
});

router.post("/user/status", async (req, res) => {
  if (!req.session.adminId) {
    return res.json({ access: "restricted" });
  }

  const user = await UserModel.findById(req.body.id).select("id name email approved");
  user.approved = !user.approved;
  const newUser = await user.save();
  return res.json({ user: newUser });
});

router.get("/influencers", async (req, res) => {
  if (!req.session.adminId) {
    console.log("restricted route");
    return res.json({ influencers: null });
  }

  const admin = await AdminModel.findById(req.session.adminId).select(
    "username email super"
  );
  if (!admin) {
    console.log("restricted route");
    return res.json({ influencers: null });
  }
  const influencers = await InfluencerModel.find().select(
    "id name bio email profileImg approved"
  );
  return res.json({ influencers: influencers });
});
router.get("/users", async (req, res) => {
  console.log("Getting users");
  if (!req.session.adminId) {
    console.log("restricted route");
    return res.json({ users: null });
  }

  const admin = await AdminModel.findById(req.session.adminId);
  if (!admin) {
    console.log("restricted route");
    return res.json({ users: null });
  }
  const users = await UserModel.find().select("id name email approved");
  return res.json({ users: users });
});
router.get("/check-auth", async (req, res) => {
  try {
    if (req.session.adminId) {
      const admin = await AdminModel.findById(req.session.adminId).select(
        "username email super"
      );
      console.log("Admin is signed in");
      return res.json({ admin: admin });
    } else {
      console.log("Admin isn't signed in");
      return res.json({ admin: null });
    }
  } catch (err) {
    console.log(err);
    return res.json({ admin: null });
  }
});

module.exports = router;
