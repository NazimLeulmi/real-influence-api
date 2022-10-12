const mongoose = require("mongoose");
const { Schema } = mongoose;
const imgSchema = new Schema(
  {
    influencer: {
      type: Schema.Types.ObjectId,
      ref: "Influencer",
      required: true,
    },
    path: { type: String, required: true },
  },
  { timestamps: true }
);

const ImageModel = mongoose.model("Image", imgSchema);

module.exports = ImageModel;
