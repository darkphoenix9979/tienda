// config/email.js
const nodemailer = require("nodemailer");

// Crear transporter con Gmail
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // tu correo Gmail
    pass: process.env.EMAIL_PASS  // contraseña de aplicación (NO tu password normal)
  }
});

// Verificar conexión al iniciar
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Error de conexión con Gmail:", error);
  } else {
    console.log("✅ Servidor de correo listo para enviar");
  }
});

/**
 * Enviar email de verificación 2FA
 * @param {string} email - Destinatario
 * @param {string} code - Código de 6 dígitos
 */
async function sendVerificationEmail(email, code) {
  const mailOptions = {
    from: `"Tu Tienda" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "🔐 Verificación de cuenta - Tu Tienda",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px; }
          .container { max-width: 500px; margin: 0 auto; background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
          .code { background: #f0f0f0; padding: 20px; text-align: center; font-size: 32px; letter-spacing: 8px; font-weight: bold; color: #ff00cc; border-radius: 8px; margin: 20px 0; }
          .footer { margin-top: 30px; font-size: 12px; color: #999; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>¡Bienvenido a Tu Tienda! 🌸</h2>
          <p>Para completar tu registro y activar tu cuenta, usa este código de verificación:</p>
          
          <div class="code">${code}</div>
          
          <p>⏰ Este código expira en <strong>10 minutos</strong>.</p>
          <p>Si no solicitaste este registro, puedes ignorar este correo de forma segura.</p>
          
          <div class="footer">
            <p>© 2026 Tu Tienda. Todos los derechos reservados.</p>
            <p>Este es un mensaje automático, por favor no respondas.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Tu código de verificación es: ${code}. Expira en 10 minutos.`
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`📧 Email enviado a ${email} - Message ID: ${info.messageId}`);
  return info;
}

module.exports = { sendVerificationEmail };