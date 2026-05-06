// routes/payment.js - COMPATIBLE CON SDK v2.x
const express = require('express');
const router = express.Router();
// ✅ Nueva sintaxis para SDK v2.x
const { MercadoPagoConfig, Preference } = require('mercadopago');
require('dotenv').config();

// ✅ Configurar cliente con Access Token
const client = new MercadoPagoConfig({ 
    accessToken: process.env.MP_ACCESS_TOKEN,
    options: { timeout: 5000, idempotencyKey: 'abc' }
});

const preference = new Preference(client);

/**
 * POST /api/payment/create-preference
 */
router.post('/create-preference', async (req, res) => {
    try {
        console.log('[PAYMENT] 🔍 Recibiendo solicitud...');
        
        const { items, payer, backUrls } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ error: 'Carrito vacío' });
        }

        // ⚠️ TEMPORAL: Precios desde frontend (en producción, validar desde BD)
        const mpItems = items.map(item => ({
            id: item.id,
            title: 'Producto',
            quantity: parseInt(item.quantity),
            unit_price: parseFloat(100), // ← Reemplazar con precio de BD
            currency_id: 'MXN'
        }));

        console.log('[PAYMENT] 📤 Creando preferencia...');

        // ✅ Nueva sintaxis para crear preferencia (SDK v2.x)
        const result = await preference.create({
            body: {
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
                notification_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/api/webhooks/mercadopago`
            }
        });

        console.log('[PAYMENT] ✅ Preferencia creada:', result.id);

        res.json({
            id: result.id,
            init_point: result.init_point,
            sandbox_init_point: result.sandbox_init_point
        });

    } catch (error) {
        console.error('[PAYMENT] ❌ Error:', error);
        console.error('[PAYMENT] Details:', error.cause || error);
        
        res.status(500).json({ 
            error: error.message || 'Error al crear preferencia',
            details: process.env.NODE_ENV === 'development' ? error.cause : undefined
        });
    }
});

module.exports = router;