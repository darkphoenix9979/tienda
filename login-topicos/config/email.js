// config/email.js
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  // Configuración extra para mejorar compatibilidad
  tls: {
    rejectUnauthorized: false // A veces necesario en entornos cloud
  }
});

async function sendVerificationEmail(email, code) {
  const mailOptions = {
    from: `"Tu Tienda" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "🔐 Código de Verificación",
    html: `<h1>Tu código es: <b>${code}</b></h1><p>Expira en 10 min.</p>`,
    text: `Tu código es: ${code}`
  };

  // Devolvemos la promesa para poder usar .then/.catch en el auth.js
  return transporter.sendMail(mailOptions);
}

module.exports = { sendVerificationEmail };