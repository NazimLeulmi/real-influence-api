const express = require("express");
const validation = require("../validation");
const bcrypt = require("bcrypt");
const router = express.Router();
const UserModel = require("../models/user");
const sendMail = require("../smtp");


function getOTP() {
  var digits = "0123456789";
  let OTP = "";
  for (let i = 0; i < 5; i++) {
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
    sendMail(otp, req.body.email.toLowerCase());
    const user = new UserModel({
      name: req.body.name,
      email: req.body.email.toLowerCase(),
      dialCode: req.body.dialCode,
      isoCode: req.body.isoCode,
      number: req.body.number,
      password: hash,
      otp: otp,
    });
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
  try {
    if (!req.session.adminId) {
      return res.json({ access: "restricted" });
    }
    const deleted = await UserModel.deleteOne({ _id: req.body.id });

    return res.json({ success: true });
  } catch (err) {
    console.log(err);
    return res.json({ error: err })
  }
});

router.post("/otp", async (req, res) => {
  try {
    console.log(req.body, "body");
    const user = await UserModel.findOne({ email: req.body.email.toLowerCase() });
    console.log(user, "trying to approve")
    if (user.otp === req.body.otp) {
      user.approved = true;
      user.otp = null;
      approvedUser = await user.save();
      console.log("approved user", user);
      return res.json({ success: true, error: null });
    } else {
      return res.json({ success: false, error: "The OTP is incorrect" });
    }
  } catch (err) {
    console.log(err);
    return res.json({ success: false })
  }
});
module.exports = router;
