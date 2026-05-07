// config/email.js - Versión Resend (HTTPS API - ✅ Compatible con Render Free)
const { Resend } = require("resend");

// Inicializar cliente (usa la clave de entorno)
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Enviar email de verificación 2FA usando Resend API
 * @param {string} email - Destinatario
 * @param {string} code - Código de 6 dígitos
 */
async function sendVerificationEmail(email, code) {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || "Tu Tienda <onboarding@resend.dev>",
      to: [email],
      subject: "🔐 Código de verificación - Tu Tienda",
      text: `Tu código de verificación es: ${code}\n\nExpira en 10 minutos.\n\nSi no solicitaste este registro, ignora este mensaje.`,
      html: `
        <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #1a1a1a; margin: 0; font-size: 24px;">🌸 Tu Tienda</h1>
          </div>
          
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
    });

    if (error) {
      console.error("❌ Resend API error:", error);
      throw new Error(error.message);
    }

    console.log(`📧 Resend: Email enviado a ${email} - ID: ${data?.id}`);
    return data;
    
  } catch (err) {
    console.error("❌ Error al enviar con Resend:", err.message);
    throw err;
  }
}

module.exports = { sendVerificationEmail };