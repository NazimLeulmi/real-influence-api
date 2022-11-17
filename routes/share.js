const express = require("express");
const router = express.Router();

router.get("/profile/:id", async (req, res) => {
  try {
    const { id } = req.params;
    return res.redirect(`realinfluence://profile/${id}`)
  } catch (error) {
    console.log(error);
  }
});

router.get("/feed/:id/:index", async (req, res) => {
  try {
    const { id,index } = req.params;
    return res.redirect(`realinfluence://feed/${id}/${index}`)
  } catch (error) {
    console.log(error);
  }
});



module.exports = router;
