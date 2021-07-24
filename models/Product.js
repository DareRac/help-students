const mongoose = require("mongoose");
const Review = require("./Review");
const Schema = mongoose.Schema;

const ImageSchema = new Schema({
  url: String,
  filename: String,
});

const productSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  image: [ImageSchema],
  price: {
    type: Number,
    required: true,
  },
  category: {
    type: String,
    enum: ["Sports", "Stationary", "Electronics", "Living", "Others"],
    default: "Others",
  },
  reviews: [
    {
      type: Schema.Types.ObjectId,
      ref: "Review",
    },
  ],
});

module.exports = mongoose.model("Product", productSchema);
