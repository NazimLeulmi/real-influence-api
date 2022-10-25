const express = require("express");
const validation = require("../validation");
const bcrypt = require("bcrypt");
const router = express.Router();
const UserModel = require("../models/user");
const transporter = require("../smtp");
const makeTemplate = require("../email");

function getOTP() {
  // Declare a digits variable
  // which stores all digits
  var digits = "0123456789";
  let OTP = "";
  for (let i = 0; i < 6; i++) {
    OTP += digits[Math.floor(Math.random() * 10)];
  }
  return OTP;
}

router.post("/signup", async (req, res) => {
  try {
    console.log(req.body);
    const { isValid, errors } = validation.validateSignUp(req.body);
    if (isValid === false) {
      return;
    }
    const duplicate = await UserModel.findOne({
      email: req.body.email.toLowerCase(),
    });
    if (duplicate) {
      console.log("Duplicate email");
      return res.json({
        success: false,
        error: "The email has been used already",
      });
    }
    const hash = await bcrypt.hash(req.body.password, 12);
    const otp = getOTP();
    const user = new UserModel({
      name: req.body.name,
      email: req.body.email.toLowerCase(),
      dialCode: req.body.dialCode,
      isoCode: req.body.isoCode,
      number: req.body.number,
      password: hash,
      otp: otp,
    });
    // send mail with defined transport object
    const template = makeTemplate(otp);
    let info = await transporter.sendMail({
      from: '"Real Influence 👻" <leulminaz@outlook.com>',
      to: "leulminaz@outlook.com", // list of receivers
      subject: "Email Verification ✔", // Subject line
      html: template,
    });
    console.log(info, "email info");
    const newUser = await user.save();
    return res.json({ success: true });
  } catch (error) {
    console.log(error);
  }
});

router.post("/signin", async (req, res) => {
  try {
    console.log("Signing in user");
    const { isValid, errors } = validation.validateSignIn(req.body.email);
    if (!isValid) return res.json({ isValid: false, errors });
    const user = await UserModel.findOne({
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
    // The influencer login data is correct
    req.session.userId = user._id;
    return res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        approved: user.approved,
        type: user.type,
      },
    });
  } catch (err) {
    console.log(err);
  }
});

router.post("/delete", async (req, res) => {
  if (!req.session.adminId) {
    return res.json({ access: "restricted" });
  }
  const deleted = await UserModel.deleteOne({ _id: req.body.id });
  console.log(deleted, "deleted");
  return res.json({ success: true });
});
module.exports = router;
