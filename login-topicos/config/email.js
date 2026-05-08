const { Resend } = require("resend");

// No necesitas verificar dominio propio para enviar a cualquier correo en modo free
const resend = new Resend(process.env.RESEND_API_KEY);

async function sendVerificationEmail(email, code) {
  const { data, error } = await resend.emails.send({
    from: "Tu Tienda <onboarding@resend.dev>", // ✅ Remitente oficial de Resend
    to: [email], // ✅ Acepta CUALQUIER correo real
    subject: "🔐 Código de verificación",
    text: `Tu código es: ${code}. Expira en 10 min.`,
    html: `<h1>🔐 Tu código: <b>${code}</b></h1><p>Expira en 10 minutos.</p>`
  });

  if (error) throw new Error(error.message);
  console.log(`📧 Enviado a ${email} | ID: ${data.id}`);
  return data;
}

module.exports = { sendVerificationEmail };