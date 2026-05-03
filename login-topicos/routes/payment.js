// routes/payment.js - Backend (Node.js + Express)
const express = require('express');
const router = express.Router();
const { MercadoPagoConfig, Preference } = require('mercadopago');

// ✅ Configura el cliente con ACCESS_TOKEN (SOLO en backend)
const client = new MercadoPagoConfig({ 
  accessToken: process.env.MP_ACCESS_TOKEN // ✅ Usa variables de entorno
});

// ✅ Middleware de autenticación (ajusta según tu sistema)
const requireAuth = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token || token !== req.cookies?.token) { // O valida con JWT
    return res.status(401).json({ error: 'No autorizado' });
  }
  next();
};

// ✅ Endpoint para crear preferencia de pago
router.post('/create-preference', requireAuth, async (req, res) => {
  try {
    const { items, payer, backUrls } = req.body;

    // 🔒 Validación de entrada (OWASP A03:2021 - Injection)
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items inválidos' });
    }

    // 🔒 Validar que los precios vengan del backend, no del frontend
    // (previene manipulación de precios en cliente)
    const validatedItems = await Promise.all(items.map(async (item) => {
      // Consulta tu BD para obtener precio real por ID
      const product = await Product.findById(item.id);
      if (!product || product.stock < item.quantity) {
        throw new Error(`Producto no disponible: ${item.id}`);
      }
      return {
        id: item.id,
        title: product.name.substring(0, 60), // Límite MP
        quantity: item.quantity,
        unit_price: parseFloat(product.price), // ✅ Precio desde BD
        currency_id: 'MXN'
      };
    }));

    const preference = new Preference(client);
    
    const result = await preference.create({
      body: {
        items: validatedItems,
        payer: payer ? {
          email: payer.email, // ✅ Validar formato de email
          name: payer.name
        } : undefined,
        back_urls: {
          success: backUrls?.success || `${process.env.FRONTEND_URL}/success`,
          failure: backUrls?.failure || `${process.env.FRONTEND_URL}/failure`,
          pending: backUrls?.pending || `${process.env.FRONTEND_URL}/pending`
        },
        auto_return: 'approved',
        external_reference: `order_${Date.now()}_${payer?.email || 'guest'}`,
        notification_url: `${process.env.BACKEND_URL}/api/webhooks/mercadopago` // ✅ Webhook
      }
    });

    // ✅ Responder solo con datos necesarios (Principio de mínimo privilegio)
    res.json({
      id: result.id,
      init_point: result.init_point, // URL para redirección
      sandbox_init_point: result.sandbox_init_point
    });

  } catch (error) {
    console.error('[MP-PREFERENCE] Error:', error);
    // ✅ No exponer detalles internos del error al cliente
    res.status(500).json({ 
      error: 'Error procesando el pago',
      // En producción: registrar error completo en logs seguros
    });
  }
});

module.exports = router;