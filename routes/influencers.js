const express = require("express");
const validation = require("../validation");
const bcrypt = require("bcrypt");
const router = express.Router();
const sharp = require("sharp");
const fs = require("fs");
const multer = require("multer");
const InfluencerModel = require("../models/influencer");
const ImageModel = require("../models/image");
const LikeModel = require("../models/like");
const AdminModel = require("../models/admin");
const VoteModel = require("../models/vote");

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fieldSize: 100 * 1024 * 1024 },
});

router.get("/", async (req, res) => {
  try {
    if (!req.session.userId) {
      console.log("restricted route");
      return res.json({ access: "restricted" });
    }
    const influencers = await InfluencerModel.find().select(
      "id name bio email profileImg approved type"
    );
    return res.json({ influencers: influencers });
  } catch (error) {
    console.log(error);
  }
});
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const influencer = await InfluencerModel.findById(id).select(
      "id name bio email profileImg approved type"
    );
    return res.json({ influencer: influencer });
  } catch (error) {
    console.log(error);
  }
});

router.get("/:id/likes", async (req, res) => {
  try {
    if (!req.session.userId) {
      console.log("restricted route");
      return res.json({ access: "restricted" });
    }
    const likes = await LikeModel.find({ influencer: req.params.id });
    return res.json({ likes: likes });
  } catch (error) {
    console.log(error);
  }
});
router.get("/:id/votes", async (req, res) => {
  try {
    if (!req.session.userId) {
      console.log("restricted route");
      return res.json({ access: "restricted" });
    }
    const votes = await VoteModel.find({ influencer: req.params.id });
    console.log("Fetched Votes", votes);
    return res.json({ votes: votes });
  } catch (error) {
    console.log(error);
  }
});

router.get("/:id/gallery", async (req, res) => {
  try {
    if (!req.session.userId) {
      console.log("restricted route");
      return res.json({ access: "restricted" });
    }
    const gallery = await ImageModel.find({ influencer: req.params.id });
    return res.json({ gallery: gallery });
  } catch (error) {
    console.log(error);
  }
});

router.post("/signin", async (req, res) => {
  try {
    console.log("Trying to sign in");
    const { isValid, errors } = validation.validateSignIn(req.body.email);
    if (!isValid) return res.json({ isValid: false, errors });
    const user = await InfluencerModel.findOne({
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
        bio: user.bio,
        email: user.email,
        profileImg: user.profileImg,
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
    const duplicate = await InfluencerModel.findOne({
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
    const user = new InfluencerModel({
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

    const updated = await InfluencerModel.findOneAndUpdate(
      { _id: req.session.userId },
      { bio: req.body.bio },
      { new: true }
    );
    return res.json({
      success: true, user: {
        id: updated._id,
        name: updated.name,
        bio: updated.bio,
        email: updated.email,
        profileImg: updated.profileImg,
        approved: updated.approved,
        type: updated.type,
      }
    });
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
      const updated = await InfluencerModel.findOneAndUpdate(
        { _id: req.session.userId },
        {
          profileImg: "static/" + req.file.originalname,
        },
        { new: true }
      );
      return res.json({
        success: true, user: {
          id: updated._id,
          name: updated.name,
          bio: updated.bio,
          email: updated.email,
          profileImg: updated.profileImg,
          approved: updated.approved,
          type: updated.type,
        }
      });
    } catch (error) {
      console.log(error);
    }
  }
);

router.post("/gallery", upload.single("galleryImage"), async (req, res) => {
  try {
    if (!req.session.userId) {
      console.log("Restricted route");
      return res.json({ access: "restricted" });
    }
    console.log(req.body);
    await sharp(req.file.buffer)
      .resize({
        width: 1080,
        height: 1080,
      })
      .toFile("./static/" + req.file.originalname);

    const imageModel = new ImageModel({
      influencer: req.session.userId,
      path: "static/" + req.file.originalname,
    });
    const newImage = await imageModel.save();
    return res.json({ image: newImage });
  } catch (error) {
    console.log(error);
  }
});

router.delete("/gallery/:id", async (req, res) => {
  try {
    if (!req.session.userId) {
      console.log("Restricted route");
      return res.json({ access: "restricted" });
    }
    const { id } = req.params;
    const image = await ImageModel.findById(id);
    if (req.session.userId !== image.influencer.toHexString()) {
      console.log("Restricted route");
      return res.json({ access: "restricted" });
    }
    const deleted = await image.delete();
    return res.json({ image: deleted });

    // await LikeModel.deleteOne({ _id: like._id });
  } catch (error) {
    console.log(error);
  }
});

router.post("/like", async (req, res) => {
  try {
    if (!req.session.userId) {
      console.log("Restricted route");
      return res.json({ access: "restricted" });
    }

    const like = await LikeModel.findOne({
      from: req.session.userId,
      image: req.body.imageId,
    });

    if (like) {
      await LikeModel.deleteOne({ _id: like._id });
      console.log("unliked", req.body.imageId);
      return res.json({ action: "unlike", like: like });
    }
    const likeModel = new LikeModel({
      influencer: req.body.influencerId,
      from: req.session.userId,
      image: req.body.imageId,
    });

    const newLike = await likeModel.save();
    console.log("Liked", req.body.imageId);
    return res.json({ action: "like", like: newLike });
  } catch (error) {
    console.log(error);
  }
});
router.post("/:id/votes", async (req, res) => {
  try {
    if (!req.session.userId) {
      console.log("restricted route");
      return res.json({ access: "restricted" });
    }
    const { id } = req.params;
    const vote = await VoteModel.findOne({
      user: req.session.userId,
      influencer: id,
    });

    if (vote) {
      await VoteModel.deleteOne({ _id: vote._id });
      console.log("vote down");
      return res.json({ action: "down", vote: vote });
    }
    const voteModel = new VoteModel({
      user: req.session.userId,
      influencer: id,
    });

    const newVote = await voteModel.save();
    console.log("vote up");
    return res.json({ action: "up", vote: newVote });
  } catch (error) {
    console.log(error);
  }
});

router.post("/delete", async (req, res) => {
  console.log("Deleting influencer");
  if (!req.session.adminId) {
    return res.json({ access: "restricted" });
  }
  const admin = await AdminModel.findById(req.session.adminId);
  if (!admin) {
    console.log("Restricted Access");
    return res.json({ access: "restricted" });
  }
  const deleted = await InfluencerModel.deleteOne({ _id: req.body.id });
  console.log(deleted, "deleted");

  return res.json({ success: true });
});

// GET influencers

module.exports = router;
