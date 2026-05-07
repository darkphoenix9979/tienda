// config/email.js - Versión Resend con formato seguro
const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Helper: Garantiza que el campo 'from' tenga formato válido para Resend
 */
function formatFromField(value) {
  if (!value) return "onboarding@resend.dev"; // Fallback por defecto
  
  // Si ya tiene formato "Nombre <email>", úsalo tal cual
  if (/<.+@.+>/.test(value)) {
    return value.trim();
  }
  
  // Si es solo un email, úsalo tal cual
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return value.trim();
  }
  
  // Si es solo un nombre, usa el email por defecto
  return "onboarding@resend.dev";
}

async function sendVerificationEmail(email, code) {
  try {
    // 🔧 Formatear el campo 'from' de manera segura
    const fromField = formatFromField(process.env.EMAIL_FROM);
    
    const { data, error } = await resend.emails.send({
      from: fromField, // ← Ahora siempre tiene formato válido
      to: [email],
      subject: "🔐 Código de verificación - Tu Tienda",
      text: `Tu código de verificación es: ${code}\n\nExpira en 10 minutos.`,
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
          <h1 style="text-align: center; color: #1a1a1a;">🌸 Tu Tienda</h1>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 12px; text-align: center; margin: 20px 0;">
            <p style="margin: 0 0 16px 0; color: #333;">Tu código de verificación:</p>
            <div style="background: white; border: 2px solid #e0e0e0; padding: 16px 24px; border-radius: 8px; display: inline-block;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px;">${code}</span>
            </div>
          </div>
          <p style="color: #666; font-size: 14px;">⏰ Expira en <strong>10 minutos</strong></p>
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