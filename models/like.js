const mongoose = require("mongoose");
const { Schema } = mongoose;
const likeSchema = new Schema(
  {
    influencer: { type: Schema.Types.ObjectId, ref: "Influencer" },
    from: { type: Schema.Types.ObjectId },
    image: { type: Schema.Types.ObjectId },
  },
  { timestamps: true }
);

const LikeModel = mongoose.model("Like", likeSchema);

module.exports = LikeModel;
