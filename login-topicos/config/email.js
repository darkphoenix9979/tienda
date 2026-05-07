// config/email.js - Versión Brevo (RECOMENDADA)
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false, // false para 587 con STARTTLS
  auth: {
    user: process.env.BREVO_USER,
    pass: process.env.BREVO_PASS
  },
  // Timeouts para Render
  connectionTimeout: 10000,
  socketTimeout: 10000
});

// Verificar conexión
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Brevo error:", error.message);
  } else {
    console.log("✅ Brevo listo para enviar correos");
  }
});

async function sendVerificationEmail(email, code) {
  const mailOptions = {
    from: process.env.EMAIL_FROM || `"Tu Tienda" <${process.env.BREVO_USER}>`,
    to: email,
    subject: "🔐 Código de verificación - Tu Tienda",
    text: `Tu código de verificación es: ${code}\n\nExpira en 10 minutos.\n\nSi no solicitaste este registro, ignora este mensaje.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333; text-align: center;">🔐 Tu Tienda</h2>
        <p>Hola,</p>
        <p>Gracias por registrarte. Tu código de verificación es:</p>
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; font-size: 28px; font-weight: bold; letter-spacing: 8px; border-radius: 10px; margin: 25px 0;">
          ${code}
        </div>
        <p style="color: #666;">⏰ Este código expira en <strong>10 minutos</strong>.</p>
        <p style="color: #999; font-size: 13px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
          Si no solicitaste este registro, puedes ignorar este mensaje de forma segura.
        </p>
      </div>
    `
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`📧 Brevo: Email enviado a ${email} - Message ID: ${info.messageId}`);
  return info;
}

module.exports = { sendVerificationEmail };