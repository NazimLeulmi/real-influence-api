const express = require("express");
const router = express.Router();
const UserModel = require("../models/user");
const LikeModel = require("../models/like");
const InfluencerModel = require("../models/influencer");
const ImageModel = require("../models/image");


router.get("/", async (req, res) => {
  try {
    if (!req.session.adminId) {
      return res.json({ access: "restricted" });
    }
    const likes = await LikeModel.find();
    const users = await UserModel.find();
    const influencers = await InfluencerModel.find();
    const uploads = await ImageModel.find();
    return res.json({
      likes: likes ? likes.length : 0,
      users: users ? users.length : 0,
      influencers: influencers ? influencers.length : 0,
      uploads: uploads ? uploads.length : 0,
    })
  } catch (error) {
    console.log(error);
    return res.json({ access: "restricted" });
  }
});


module.exports = router;

