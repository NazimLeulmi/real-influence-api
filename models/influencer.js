const mongoose = require("mongoose");
const { Schema } = mongoose;

const influencerSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    bio: {
      type: String,
      required: true,
      default: `Tell us about your self in less than 300 letters , so your followers can get to know you`,
    },
    isoCode: { type: String, required: true },
    dialCode: { type: String, required: true },
    number: { type: String, required: true },
    password: { type: String, required: true },
    approved: { type: Boolean, default: false },
    type: { type: String, default: "influencer" },
    profileImg: { type: String },
  },
  { timestamps: true }
);

const InfluencerModel = mongoose.model("Influencer", influencerSchema);

module.exports = InfluencerModel;
