const mongoose = require("mongoose");
const { Schema } = mongoose;
const imgSchema = new Schema(
  {
    path: { type: String },
  },
  { timestamps: true }
);

const userSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    isoCode: { type: String, required: true },
    dialCode: { type: String, required: true },
    number: { type: String, required: true },
    password: { type: String, required: true },
    approved: { type: Boolean, default: false },
    otp: { type: String },
  },
  { timestamps: true }
);
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
    profileImg: { type: String },
    gallery: [imgSchema],
  },
  { timestamps: true }
);

const adminSchema = new Schema(
  {
    email: { type: String, required: true, unique: true },
    username: { type: String, required: true },
    password: { type: String, required: true },
    super: { type: Boolean, required: true, default: false },
  },
  { timestamps: true }
);

const UserModel = mongoose.model("User", userSchema);
const InfluencerModel = mongoose.model("Influencer", influencerSchema);
const AdminModel = mongoose.model("Admin", adminSchema);

module.exports = { UserModel, AdminModel, InfluencerModel };
