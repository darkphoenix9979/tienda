const express = require("express");
const router = express.Router();
const Product = require("../models/Product");

// Crear producto (versión estable sin multer)
router.post("/", async (req, res) => {
  try {
    const { name, price, image, stock } = req.body;

    const newProduct = new Product({
      name,
      price,
      image,
      stock
    });

    await newProduct.save();

    res.status(201).json(newProduct);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al crear producto" });
  }
});

// Obtener productos
router.get("/", async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener productos" });
  }
});

module.exports = router;