const mongoose = require("mongoose");
const { Schema } = mongoose;
const voteSchema = new Schema(
  {
    influencer: { type: Schema.Types.ObjectId, ref: "Influencer" },
    user: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

const VoteModel = mongoose.model("Vote", voteSchema);

module.exports = VoteModel;
