const express = require("express");
const router = express.Router();
const Product = require("../models/Product");

// ==========================
// ✅ CREAR PRODUCTO (POST)
// ==========================
router.post("/", async (req, res) => {
  try {
    const { name, price, image, stock } = req.body;

    // Validación básica
    if (!name || price === undefined || stock === undefined || !image) {
      return res.status(400).json({ message: "Todos los campos son obligatorios" });
    }

    const newProduct = new Product({
      name,
      price: parseFloat(price),  // ✅ Asegurar que sea número
      image,
      stock: parseInt(stock)     // ✅ Asegurar que sea número
    });

    await newProduct.save();

    res.status(201).json(newProduct);

  } catch (error) {
    console.error("Error creando producto:", error);
    res.status(500).json({ message: "Error al crear producto", error: error.message });
  }
});

// ==========================
// ✅ OBTENER PRODUCTOS (GET)
// ==========================
router.get("/", async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 }); // ✅ Más recientes primero
    res.json(products);
  } catch (error) {
    console.error("Error obteniendo productos:", error);
    res.status(500).json({ message: "Error al obtener productos" });
  }
});

// ==========================
// ✅ ACTUALIZAR PRODUCTO (PUT) ← AGREGADO
// ==========================
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, stock, image } = req.body;

    // Validación básica
    if (!name || price === undefined || stock === undefined) {
      return res.status(400).json({ message: "Nombre, precio y stock son obligatorios" });
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      {
        name,
        price: parseFloat(price),
        stock: parseInt(stock),
        image: image || undefined  // ✅ Solo actualizar imagen si se envía nueva
      },
      { 
        new: true,           // ✅ Devuelve el documento actualizado
        runValidators: true  // ✅ Ejecuta validaciones del schema
      }
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    res.json({ 
      message: "Producto actualizado correctamente", 
      product: updatedProduct 
    });

  } catch (error) {
    console.error("Error actualizando producto:", error);
    res.status(500).json({ message: "Error al actualizar producto", error: error.message });
  }
});

// ==========================
// ✅ ELIMINAR PRODUCTO (DELETE) ← AGREGADO
// ==========================
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const deletedProduct = await Product.findByIdAndDelete(id);

    if (!deletedProduct) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    res.json({ message: "Producto eliminado correctamente" });

  } catch (error) {
    console.error("Error eliminando producto:", error);
    res.status(500).json({ message: "Error al eliminar producto", error: error.message });
  }
});

// ✅ AGREGAR EN: routes/products.js

// Actualizar stock después de compra
router.put('/:id/update-stock', async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ message: "Stock insuficiente" });
    }

    product.stock -= quantity;
    await product.save();

    res.json({ message: "Stock actualizado", stock: product.stock });

  } catch (error) {
    console.error("Error actualizando stock:", error);
    res.status(500).json({ message: "Error del servidor" });
  }
});

module.exports = router;