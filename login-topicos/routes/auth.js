const express = require("express");
const router = express.Router();
const User = require("../models/User");
const PendingUser = require("../models/PendingUser"); // ← NUEVO
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken"); // ← NUEVO
const crypto = require("crypto"); // ← NUEVO
const { sendVerificationEmail } = require("../config/email");

// 🔹 REGISTRO (con 2FA)
// routes/auth.js

// ... imports ...

router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // 1. Validaciones básicas
    if (!username || !email || !password) {
      return res.status(400).json({ message: "Datos incompletos" });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: "Usuario o email ya existe" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const twoFACode = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const tempToken = jwt.sign(
      { email, step: "pending_2fa" },
      process.env.JWT_TEMP_SECRET,
      { expiresIn: "10m" }
    );

    await PendingUser.create({
      username, email, password: hashedPassword, twoFACode, expiresAt, tempToken
    });

    // 🔥 CAMBIO CLAVE: NO USAR 'await' AQUÍ.
    // Esto hace que el servidor responda "201" INMEDIATAMENTE al frontend.
    // El correo se intentará enviar en segundo plano.
    
    sendVerificationEmail(email, twoFACode)
      .then(() => console.log(`✅ [BACKGROUND] Email enviado a ${email}`))
      .catch(err => console.error(`❌ [BACKGROUND] Falló el envío a ${email}:`, err.message));

    // ✅ Responde al usuario INMEDIATAMENTE (sin esperar al correo)
    return res.status(201).json({
      message: "Registro exitoso. Revisa tu correo.",
      requires2FA: true,
      tempToken,
      method: "email"
    });

  } catch (error) {
    console.error("Error crítico:", error);
    res.status(500).json({ message: "Error del servidor" });
  }
});

// 🔹 Verificación del código 2FA - POST /api/auth/verify-2fa
router.post("/verify-2fa", async (req, res) => {
  console.log("🔍 [BACKEND] Recibido verify-2fa:", { 
    email: req.body.email, 
    code: req.body.code ? "***" : "vacío",
    hasTempToken: !!req.body.tempToken 
  });
  
  try {
    const { tempToken, email, code } = req.body;

    if (!tempToken || !email || !code) {
      console.warn("⚠️ Datos incompletos:", { tempToken, email, code });
      return res.status(400).json({ message: "Datos incompletos" });
    }

    // Validar token temporal
    let decoded;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_TEMP_SECRET || "temp_secret_change_this");
      console.log("✅ Token temporal válido:", decoded);
    } catch (jwtError) {
      console.error("❌ Token inválido:", jwtError.message);
      return res.status(401).json({ message: "Token inválido o expirado" });
    }

    // Buscar registro pendiente
    const pending = await PendingUser.findOne({
      email,
      tempToken,
      expiresAt: { $gt: new Date() } // No expirado
    });

    console.log("🔍 Pending user encontrado:", !!pending);
    
    if (!pending) {
      return res.status(400).json({ message: "Registro no encontrado o expirado" });
    }
    
    if (pending.twoFACode !== code) {
      console.warn("⚠️ Código incorrecto. Esperado:", pending.twoFACode, "Recibido:", code);
      return res.status(400).json({ message: "Código incorrecto" });
    }

    // ✅ Crear usuario definitivo
    const newUser = new User({
      username: pending.username,
      email: pending.email,
      password: pending.password,
      role: "user",
      twoFAEnabled: true
    });

    await newUser.save();
    console.log("✅ Usuario creado:", newUser.email);

    // 🗑️ Eliminar registro pendiente
    await PendingUser.deleteOne({ _id: pending._id });
    console.log("🗑️ PendingUser eliminado");

    // 🎫 Generar token de sesión final
    const token = jwt.sign(
      { userId: newUser._id, role: newUser.role },
      process.env.JWT_SECRET || "secret_change_this",
      { expiresIn: "24h" }
    );

    console.log("✅ Verificación completada para:", email);
    
    res.status(200).json({
      message: "Cuenta verificada exitosamente 🌸",
      token,
      username: newUser.username,
      role: newUser.role
    });

  } catch (error) {
    console.error("💥 Error crítico en verify-2fa:", error);
    res.status(500).json({ message: "Error del servidor" });
  }
});

// 🔹 LOGIN (sin cambios mayores, pero puedes agregar validación de 2FA si quieres)
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Usuario no encontrado" });
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(400).json({ message: "Contraseña incorrecta" });
    }

    // 🔐 Opcional: Si el usuario tiene 2FA activado, pedir código aquí también
    // if (user.twoFAEnabled) { ... }

    res.status(200).json({
      message: "Login exitoso",
      role: user.role,
      username: user.username
      // token: ... si usas JWT
    });

  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ message: "Error del servidor" });
  }
});

module.exports = router;