const express = require("express");
const router = express.Router();
const Carousel = require("../models/Carousel");
const Product = require("../models/Product");

// Obtener carrusel ordenado
router.get("/", async (req, res) => {
  const images = await Carousel.find().sort({ order: 1 });
  res.json(images);
});

// Agregar imagen (sin repetir y sin usar imágenes de productos)
router.post("/", async (req, res) => {
  const { image } = req.body;

  const existsInProducts = await Product.findOne({ image });
  if (existsInProducts) {
    return res.status(400).json({ message: "Esta imagen ya pertenece a un producto" });
  }

  const existsInCarousel = await Carousel.findOne({ image });
  if (existsInCarousel) {
    return res.status(400).json({ message: "La imagen ya está en el carrusel" });
  }

  const count = await Carousel.countDocuments();

  const newImage = new Carousel({
    image,
    order: count
  });

  await newImage.save();
  res.json(newImage);
});

// Actualizar orden (drag and drop)
router.put("/reorder", async (req, res) => {
  const { items } = req.body;

  for (let i = 0; i < items.length; i++) {
    await Carousel.findByIdAndUpdate(items[i], { order: i });
  }

  res.json({ message: "Orden actualizado" });
});

// Eliminar imagen
router.delete("/:id", async (req, res) => {
  await Carousel.findByIdAndDelete(req.params.id);
  res.json({ message: "Imagen eliminada" });
});

module.exports = router;