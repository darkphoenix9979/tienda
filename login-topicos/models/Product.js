const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: String,
  price: Number,
  image: String,
  stock: {
    type: Number,
    default: 0
  }
});

module.exports = mongoose.model("Product", productSchema);