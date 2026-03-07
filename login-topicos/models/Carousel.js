const mongoose = require("mongoose");

const carouselSchema = new mongoose.Schema({
  image: {
    type: String,
    required: true,
    unique: true
  },
  order: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model("Carousel", carouselSchema);