// config/email.js - Brevo API (HTTPS - ✅ Sin dominio, envío a cualquier correo)
const fetch = require("node-fetch");

/**
 * Enviar email de verificación usando Brevo API
 * @param {string} email - Destinatario (cualquier email)
 * @param {string} code - Código de 6 dígitos
 */
async function sendVerificationEmail(email, code) {
  const BREVO_API_KEY = process.env.BREVO_API_KEY;
  
  if (!BREVO_API_KEY) {
    throw new Error("BREVO_API_KEY no configurada en variables de entorno");
  }

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "api-key": BREVO_API_KEY
    },
    body: JSON.stringify({
      // ✅ Remitente: puede ser cualquier email, Brevo lo acepta en free tier
    sender: { 
         name: "Tu Tienda", 
        email: process.env.BREVO_SENDER || "camposfede76@gmail.com" // ✅ Tu email real verificado en Brevo
    },
      to: [{ email }], // ✅ Destinatario: CUALQUIER correo real
      subject: "🔐 Código de verificación - Tu Tienda",
      textContent: `Tu código de verificación es: ${code}\n\nExpira en 10 minutos.\n\nSi no solicitaste este registro, ignora este mensaje.`,
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
          <h1 style="text-align: center; color: #1a1a1a; margin-bottom: 24px;">🌸 Tu Tienda</h1>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 12px; text-align: center;">
            <p style="margin: 0 0 16px 0; color: #333; font-size: 16px;">Tu código de verificación:</p>
            <div style="background: white; border: 2px solid #e0e0e0; padding: 16px 24px; border-radius: 8px; display: inline-block;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1a1a1a;">${code}</span>
            </div>
          </div>
          <p style="color: #666; margin: 20px 0 0 0; font-size: 14px;">
            ⏰ Este código expira en <strong>10 minutos</strong>.
          </p>
          <p style="color: #999; font-size: 13px; margin-top: 24px; padding-top: 16px; border-top: 1px solid #eee;">
            Si no solicitaste este registro, puedes ignorar este mensaje de forma segura.
          </p>
        </div>
      `
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    console.error("❌ Brevo API error:", error);
    throw new Error(error.message || `Error HTTP ${response.status}`);
  }

  const data = await response.json();
  console.log(`📧 Brevo: Email enviado a ${email} - Message ID: ${data.messageId}`);
  return data;
}

module.exports = { sendVerificationEmail };