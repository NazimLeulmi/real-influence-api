const express = require("express");
const validation = require("../validation");
const models = require("../models/like");
const bcrypt = require("bcrypt");
const router = express.Router();

router.get("/", async (req, res) => {
  if (!req.session.adminId) {
    console.log(req.session);
    console.log("restricted route");
    return res.json({ access: "restricted" });
  }
  const admins = await models.AdminModel.find();
  return res.json({ success: true, admins: admins });
});

router.post("/signup", async (req, res) => {
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

router.post("/signin", async (req, res) => {
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
  return res.json({
    success: true,
    admin: {
      adminId: admin._id.toHexString(),
      email: admin.email,
      super: admin.super,
    },
  });
});

router.delete("/delete", async (req, res) => {
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

router.post("/approve", async (req, res) => {
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
router.post("/revoke", async (req, res) => {
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
router.get("/influencers", async (req, res) => {
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

module.exports = router;
