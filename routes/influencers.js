const express = require("express");
const validation = require("../validation");
const models = require("../models");
const bcrypt = require("bcrypt");
const router = express.Router();
const sharp = require("sharp");
const fs = require("fs");

const multer = require("multer");
const { model } = require("mongoose");
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fieldSize: 100 * 1024 * 1024 },
});

router.post("/signin", async (req, res) => {
  try {
    const { isValid, errors } = validation.validateSignIn(req.body.email);
    if (!isValid) return res.json({ isValid: false, errors });
    const user = await models.InfluencerModel.findOne({
      email: req.body.email.toLowerCase(),
    }).populate({
      path: "gallery",
      populate: {
        path: "likes",
      },
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
        bio: user.bio,
        email: user.email,
        profileImg: user.profileImg,
        gallery: user.gallery,
        approved: user.approved,
        type: user.type,
      },
    });
  } catch (err) {
    console.log(err);
  }
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
router.post("/signup", signUpFields, async (req, res) => {
  try {
    const { isValid, errors } = validation.validateSignUp(req.body);
    if (isValid === false) {
      return;
    }
    const duplicate = await models.InfluencerModel.findOne({
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
    const user = new models.InfluencerModel({
      name: req.body.name,
      email: req.body.email.toLowerCase(),
      dialCode: req.body.dialCode,
      isoCode: req.body.isoCode,
      number: req.body.number,
      password: hash,
      profileImg: "static/" + req.files.profileImage[0].originalname,
    });
    const newInfluencer = await user.save();
    return res.json({ success: true });
  } catch (error) {
    console.log(error);
  }
});

router.post("/bio", async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.json({ access: "restricted" });
    }

    const updated = await models.InfluencerModel.findOneAndUpdate(
      { _id: req.session.userId },
      { bio: req.body.bio },
      { new: true }
    );
    return res.json({ success: true, user: updated });
  } catch (error) {
    console.log(error);
  }
});

router.post(
  "/profileImage",
  upload.single("profileImage"),
  async (req, res) => {
    try {
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

      const updated = await models.InfluencerModel.findOneAndUpdate(
        { _id: req.session.userId },
        {
          profileImg: "static/" + req.file.originalname,
        },
        { new: true }
      );
      return res.json({ success: true, user: updated });
    } catch (error) {
      console.log(error);
    }
  }
);

router.post(
  "/galleryImage",
  upload.single("galleryImage"),
  async (req, res) => {
    try {
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

      const imageModel = models.ImageModel({
        influencer: req.session.userId,
        path: "static/" + req.file.originalname,
        likes: [],
      });
      const newImage = await imageModel.save();

      const updated = await models.InfluencerModel.findOneAndUpdate(
        { _id: req.session.userId },
        {
          $push: { gallery: newImage._id },
        },
        { new: true }
      ).populate({
        path: "gallery",
        populate: {
          path: "likes",
        },
      });
      return res.json({ success: true, user: updated });
    } catch (error) {
      console.log(error);
    }
  }
);
router.post("/like", async (req, res) => {
  try {
    if (!req.session.userId) {
      console.log("Restricted route");
      return res.json({ access: "restricted" });
    }

    console.log("image id:", req.body.imageId);

    const like = await models.LikesModel.findOne({
      from: req.session.userId,
      image: req.body.imageId,
    });

    if (like) {
      await models.LikesModel.deleteOne({ _id: like._id });
      const newImage = await models.ImageModel.findOneAndUpdate(
        { _id: req.body.imageId },
        {
          $pull: { likes: like._id },
        },
        { new: true }
      );
      console.log("unliked", req.body.imageId);
      return res.json({ action: "unlike", image: newImage });
    }
    const likeModel = new models.LikesModel({
      from: req.session.userId,
      image: req.body.imageId,
    });

    const newLike = await likeModel.save();
    const newImage = await models.ImageModel.findOneAndUpdate(
      { _id: req.body.imageId },
      {
        $push: { likes: newLike._id },
      },
      { new: true }
    );
    console.log("Liked", req.body.imageId);
    return res.json({ action: "like", image: newImage });
  } catch (error) {
    console.log(error);
  }
});

// GET influencers
router.get("/", async (req, res) => {
  try {
    if (!req.session.userId) {
      console.log("restricted route");
      return res.json({ access: "restricted" });
    }
    const influencers = await models.InfluencerModel.find()
      .select("id name bio email profileImg gallery approved type")
      .populate({
        path: "gallery",
        populate: {
          path: "likes",
        },
      });

    // console.log("fetched influencers", influencers[0].gallery);
    return res.json({ success: true, influencers: influencers });
  } catch (error) {
    console.log(error);
  }
});
module.exports = router;
