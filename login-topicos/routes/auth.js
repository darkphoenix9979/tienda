const express = require("express");
const router = express.Router();
const User = require("../models/User");
const PendingUser = require("../models/PendingUser"); // ← NUEVO
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken"); // ← NUEVO
const crypto = require("crypto"); // ← NUEVO

// 🔹 REGISTRO (con 2FA)
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "Todos los campos son obligatorios" });
    }

    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({ message: "Usuario o email ya existe" });
    }

    // 🔐 Hash de contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // 🔢 Generar código 2FA de 6 dígitos
    const twoFACode = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

    // 🎫 Token temporal para el flujo de verificación
    const tempToken = jwt.sign(
      { email, step: "pending_2fa" },
      process.env.JWT_TEMP_SECRET || "temp_secret_change_this",
      { expiresIn: "10m" }
    );

    // 💾 Guardar en colección "pendiente"
    await PendingUser.create({
      username,
      email,
      password: hashedPassword,
      twoFACode,
      expiresAt,
      tempToken
    });

    // 📧 Aquí iría el envío del email (te dejo el ejemplo más abajo)
    console.log(`🔐 Código 2FA para ${email}: ${twoFACode}`); // ← Solo para desarrollo

    // ✅ Responder al frontend
    res.status(201).json({
      message: "Registro exitoso. Verifica tu cuenta.",
      requires2FA: true,
      tempToken,
      method: "email"
    });

  } catch (error) {
    console.error("Error en registro:", error);
    res.status(500).json({ message: "Error del servidor" });
  }
});

// 🔹 NUEVO: Verificación del código 2FA
router.post("/verify-2fa", async (req, res) => {
  try {
    const { tempToken, email, code } = req.body;

    if (!tempToken || !email || !code) {
      return res.status(400).json({ message: "Datos incompletos" });
    }

    // Validar token temporal
    let decoded;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_TEMP_SECRET || "temp_secret_change_this");
    } catch {
      return res.status(401).json({ message: "Token inválido o expirado" });
    }

    // Buscar registro pendiente
    const pending = await PendingUser.findOne({
      email,
      tempToken,
      expiresAt: { $gt: new Date() } // No expirado
    });

    if (!pending || pending.twoFACode !== code) {
      return res.status(400).json({ message: "Código incorrecto o expirado" });
    }

    // ✅ Crear usuario definitivo
    const newUser = new User({
      username: pending.username,
      email: pending.email,
      password: pending.password,
      role: "customer", // o el rol por defecto que uses
      twoFAEnabled: true
    });

    await newUser.save();

    // 🗑️ Eliminar registro pendiente
    await PendingUser.deleteOne({ _id: pending._id });

    // 🎫 Generar token de sesión final (opcional, si usas JWT para sesiones)
    const token = jwt.sign(
      { userId: newUser._id, role: newUser.role },
      process.env.JWT_SECRET || "secret_change_this",
      { expiresIn: "24h" }
    );

    res.status(200).json({
      message: "Cuenta verificada exitosamente 🌸",
      token,
      username: newUser.username,
      role: newUser.role
    });

  } catch (error) {
    console.error("Error en verificación 2FA:", error);
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