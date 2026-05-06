// TIENDA/routes/payment.routes.js
const express = require('express');
const router = express.Router();
const mercadopago = require('mercadopago');
require('dotenv').config();

// Configurar SDK de MercadoPago
mercadopago.configure({
  access_token: process.env.MP_ACCESS_TOKEN
});

/**
 * POST /api/payment/create-preference
 * Crea una preferencia de pago en MercadoPago
 */
router.post('/create-preference', async (req, res) => {
  try {
    const { items, payer, backUrls } = req.body;

    // ✅ Validar que haya items
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'No hay productos en el carrito' });
    }

    // 🔍 Obtener precios desde la base de datos (NUNCA del frontend)
    // Esto es un ejemplo - ajusta según tu modelo de productos
    const productsFromDB = await getProductsFromDatabase(items.map(i => i.id));
    
    // ✅ Construir items con precios validados del backend
    const mpItems = items.map(item => {
      const product = productsFromDB.find(p => p._id.toString() === item.id);
      if (!product) {
        throw new Error(`Producto no encontrado: ${item.id}`);
      }
      if (product.stock < item.quantity) {
        throw new Error(`Stock insuficiente para: ${product.name}`);
      }
      
      return {
        id: product._id,
        title: product.name,
        quantity: item.quantity,
        unit_price: parseFloat(product.price),
        currency_id: 'MXN'
      };
    });

    // ✅ Crear preferencia de pago
    const preference = {
      items: mpItems,
      payer: payer ? {
        name: payer.name,
        email: payer.email
      } : undefined,
      back_urls: {
        success: backUrls?.success || `${process.env.FRONTEND_URL}/pago-exitoso`,
        failure: backUrls?.failure || `${process.env.FRONTEND_URL}/pago-fallido`,
        pending: backUrls?.pending || `${process.env.FRONTEND_URL}/pago-pendiente`
      },
      auto_return: 'approved',
      notification_url: `${process.env.FRONTEND_URL}/api/webhooks/mercadopago` // URL pública
    };

    const response = await mercadopago.preferences.create(preference);

    // ✅ Responder con init_point (URL de Checkout Pro)
    res.json({
      id: response.body.id,
      init_point: response.body.init_point
    });

  } catch (error) {
    console.error('[PAYMENT] Error creando preferencia:', error);
    res.status(500).json({ 
      error: error.message || 'Error al crear preferencia de pago' 
    });
  }
});

/**
 * Función auxiliar para obtener productos de la BD
 * Ajusta según tu modelo de base de datos
 */
async function getProductsFromDatabase(ids) {
  // Ejemplo con MongoDB/Mongoose:
  // const Product = require('../models/product.model');
  // return await Product.find({ _id: { $in: ids } });
  
  // 🔴 TEMPORAL: Si no tienes BD, usa esto (SOLO PARA PRUEBAS):
  return ids.map(id => ({
    _id: id,
    name: 'Producto de prueba',
    price: 100,
    stock: 10
  }));
}

module.exports = router;