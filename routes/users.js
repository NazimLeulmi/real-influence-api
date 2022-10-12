const express = require("express");
const validation = require("../validation");
const models = require("../models/like");
const bcrypt = require("bcrypt");
const router = express.Router();

router.post("/signup", async (req, res) => {
  try {
    console.log(req.body);
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
    const hash = await bcrypt.hash(req.body.password, 12);
    const user = new models.UserModel({
      name: req.body.name,
      email: req.body.email.toLowerCase(),
      dialCode: req.body.dialCode,
      isoCode: req.body.isoCode,
      number: req.body.number,
      password: hash,
    });
    const newUser = await user.save();
    return res.json({ success: true });
  } catch (error) {
    console.log(error);
  }
});

router.post("/signin", async (req, res) => {
  try {
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
module.exports = router;
