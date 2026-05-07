// config/email.js - Gmail con configuración robusta
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,  // ← Cambiar de 587 a 465
  secure: true, // ← true para puerto 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  // ⏱️ Configuración de timeouts para Render
  connectionTimeout: 10000, // 10 segundos
  socketTimeout: 10000,
  greetingTimeout: 10000,
  // 🔄 Reintentos
  tls: {
    rejectUnauthorized: false
  }
});

// Verificar conexión al iniciar (con manejo de errores)
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Gmail no responde:", error.message);
  } else {
    console.log("✅ Gmail listo para enviar");
  }
});

async function sendVerificationEmail(email, code) {
  const mailOptions = {
    from: `"Tu Tienda" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "🔐 Código de verificación",
    text: `Tu código es: ${code}. Expira en 10 minutos.`,
    html: `<h1>🔐 Tu código: <b>${code}</b></h1><p>Expira en 10 minutos.</p>`
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`📧 Email enviado - ID: ${info.messageId}`);
  return info;
}

module.exports = { sendVerificationEmail };