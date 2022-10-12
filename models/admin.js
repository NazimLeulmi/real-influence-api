const mongoose = require("mongoose");
const { Schema } = mongoose;

const adminSchema = new Schema(
  {
    email: { type: String, required: true, unique: true },
    username: { type: String, required: true },
    password: { type: String, required: true },
    super: { type: Boolean, required: true, default: false },
  },
  { timestamps: true }
);

const AdminModel = mongoose.model("Admin", adminSchema);

module.exports = AdminModel;
