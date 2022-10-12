const mongoose = require("mongoose");
const { Schema } = mongoose;

const userSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    isoCode: { type: String, required: true },
    dialCode: { type: String, required: true },
    number: { type: String, required: true },
    password: { type: String, required: true },
    approved: { type: Boolean, default: false },
    type: { type: String, default: "user" },
    otp: { type: String },
  },
  { timestamps: true }
);

const UserModel = mongoose.model("User", userSchema);
module.exports = UserModel;
