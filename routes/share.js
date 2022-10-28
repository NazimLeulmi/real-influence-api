const express = require("express");
const router = express.Router();

router.get("/profile/:id", async (req, res) => {
  try {
    console.log("Influencer Profile", req.body);
    const { id } = req.params;
    console.log(id, "param");
    // return res.redirect(`exp://192.168.0.105:19000/--/profile/${id}`)
    return res.redirect(`exp://exp.host/@nazimleulmi/real-influence?release-channel=default/--/profile/${id}`)
  } catch (error) {
    console.log(error);
  }
});



module.exports = router;

