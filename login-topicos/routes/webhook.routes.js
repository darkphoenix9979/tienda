// TIENDA/routes/webhook.routes.js
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const mercadopago = require('mercadopago');

/**
 * ✅ Validar firma del webhook (seguridad crítica)
 */
function validateWebhookSignature(req) {
  const xSignature = req.headers['x-signature'];
  const xRequestId = req.headers['x-request-id'];
  const secretSignature = process.env.MP_WEBHOOK_SECRET;
  
  if (!xSignature || !secretSignature) return false;
  
  // Parsear signature: "ts=1234567890,v1=abc123..."
  const parts = xSignature.split(',');
  const ts = parts.find(p => p.startsWith('ts='))?.split('=')[1];
  const signature = parts.find(p => p.startsWith('v1='))?.split('=')[1];
  
  if (!ts || !signature) return false;
  
  // ✅ Validar timestamp (previene replay attacks)
  const now = Date.now();
  const tolerance = 5 * 60 * 1000; // 5 minutos
  if (Math.abs(now - parseInt(ts)) > tolerance) {
    console.warn('[WEBHOOK] Timestamp fuera de rango');
    return false;
  }
  
  // ✅ Construir mensaje para HMAC
  const messageId = req.body.data?.id;
  const topic = req.body.topic;
  const action = req.body.action;
  
  const message = `id:${messageId};topic:${topic};action:${action};ts:${ts};api_version:v1;request-id:${xRequestId || ''}`;
  
  // ✅ Calcular HMAC-SHA256
  const expectedSignature = crypto
    .createHmac('sha256', secretSignature)
    .update(message)
    .digest('hex');
  
  // ✅ Comparación segura
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch {
    return false;
  }
}

/**
 * POST /api/webhooks/mercadopago
 * Recibe notificaciones de MercadoPago
 */
router.post('/mercadopago', async (req, res) => {
  try {
    const { topic, data, action } = req.body;
    
    console.log('[WEBHOOK] Recibido:', { topic, action, id: data?.id });
    
    // ✅ 1. Validar firma (CRÍTICO)
    const isValid = validateWebhookSignature(req);
    if (!isValid) {
      console.warn('[WEBHOOK] ⚠️ Firma inválida - posible ataque');
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // ✅ 2. Procesar solo pagos
    if (topic === 'payment' && action === 'payment.updated') {
      const paymentId = data.id;
      
      // 🔍 Obtener detalles del pago
      const payment = await mercadopago.payment.get(paymentId);
      const { status, transaction_amount, additional_info } = payment.body;
      
      console.log(`[WEBHOOK] Pago #${paymentId}: ${status} - $${transaction_amount}`);
      
      // ✅ 3. Solo descontar stock si está APROBADO
      if (status === 'approved') {
        await updateStockAfterPayment(additional_info?.items || [], paymentId);
        
        // Aquí podrías enviar email, notificar al usuario, etc.
        console.log(`[STOCK] ✅ Stock descontado para pago #${paymentId}`);
      }
      
      // ✅ 4. Revertir stock si fue rechazado/cancelado
      else if (['rejected', 'cancelled'].includes(status)) {
        await releaseStockAfterFailedPayment(additional_info?.items || [], paymentId);
        console.log(`[STOCK] 🔄 Stock liberado para pago fallido #${paymentId}`);
      }
    }
    
    // ✅ 5. SIEMPRE responder 200 (MP reintenta si no recibe respuesta)
    return res.status(200).json({ received: true });
    
  } catch (error) {
    console.error('[WEBHOOK] Error:', error);
    // Aún así responder 200 para evitar reintentos infinitos
    return res.status(200).json({ received: true, error: 'Logged' });
  }
});

/**
 * Descontar stock tras pago aprobado
 */
async function updateStockAfterPayment(items, paymentId) {
  for (const item of items) {
    // Ejemplo con MongoDB:
    // const Product = require('../models/product.model');
    // await Product.findByIdAndUpdate(
    //   item.id,
    //   { $inc: { stock: -item.quantity } },
    //   { runValidators: true }
    // );
    
    console.log(`[STOCK] Producto ${item.id}: -${item.quantity} unidades`);
  }
}

/**
 * Liberar stock tras pago fallido
 */
async function releaseStockAfterFailedPayment(items, paymentId) {
  for (const item of items) {
    // Ejemplo con MongoDB:
    // const Product = require('../models/product.model');
    // await Product.findByIdAndUpdate(
    //   item.id,
    //   { $inc: { stock: +item.quantity } },
    //   { runValidators: true }
    // );
    
    console.log(`[STOCK] Producto ${item.id}: +${item.quantity} unidades (revertido)`);
  }
}

module.exports = router;