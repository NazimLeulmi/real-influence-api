const express = require("express");
const validation = require("../validation");
const models = require("../models");
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

module.exports = router;
