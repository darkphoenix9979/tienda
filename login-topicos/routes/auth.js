const express = require("express");
const router = express.Router();
const User = require("../models/User");
const PendingUser = require("../models/PendingUser");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { sendVerificationEmail } = require("../config/email");

// 🔐 CONSTANTES DE SEGURIDAD - NIVEL MÓDULO (ACCESIBLES POR TODAS LAS FUNCIONES)
const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;
const RECAPTCHA_VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_TEMP_SECRET = process.env.JWT_TEMP_SECRET;

// Validar que las variables críticas existan en producción
if (!JWT_SECRET || !JWT_TEMP_SECRET || !RECAPTCHA_SECRET_KEY) {
  console.warn("⚠️ ADVERTENCIA: Falta una variable de entorno crítica. Revisa tu .env");
}

// 🔹 Middleware para verificar reCAPTCHA (definido ANTES de usarse)
async function verifyRecaptcha(token, userIP) {
  if (!token) return { success: false, message: 'Verificación de seguridad requerida' };
  if (!RECAPTCHA_SECRET_KEY) {
    console.error("❌ RECAPTCHA_SECRET_KEY no configurada");
    return { success: false, message: 'Error de configuración del servidor' };
  }
  
  try {
    const response = await fetch(RECAPTCHA_VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: RECAPTCHA_SECRET_KEY,
        response: token,
        remoteip: userIP
      })
    });
    
    const result = await response.json();
    
    if (!result.success) {
      console.warn('❌ reCAPTCHA fallido:', result['error-codes']);
      return { success: false, message: 'Verificación de seguridad fallida' };
    }
    
    return { success: true };
    
  } catch (error) {
    console.error('🌐 Error conectando con Google reCAPTCHA:', error.message);
    return { success: false, message: 'Servicio de verificación no disponible' };
  }
}

// 🔹 REGISTRO (con 2FA por email)
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validaciones básicas
    if (!username || !email || !password) {
      return res.status(400).json({ message: "Todos los campos son obligatorios" });
    }

    // Verificar usuario existente
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: "El usuario o correo ya está registrado" });
    }

    // Hash de contraseña + código 2FA
    const hashedPassword = await bcrypt.hash(password, 10);
    const twoFACode = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

    // Token temporal para el flujo 2FA
    const tempToken = jwt.sign(
      { email, step: "pending_2fa" },
      JWT_TEMP_SECRET,
      { expiresIn: "10m" }
    );

    // Guardar usuario pendiente
    await PendingUser.create({
      username, 
      email, 
      password: hashedPassword, 
      twoFACode, 
      expiresAt, 
      tempToken
    });

    // Enviar email en segundo plano (non-blocking)
    sendVerificationEmail(email, twoFACode)
      .then(() => console.log(`✅ Email 2FA enviado a ${email}`))
      .catch(err => console.error(`❌ Error enviando email a ${email}:`, err.message));

    // Respuesta inmediata al frontend
    return res.status(201).json({
      message: "Registro exitoso. Verifica tu correo para activar la cuenta.",
      requires2FA: true,
      tempToken,
      method: "email"
    });

  } catch (error) {
    console.error("💥 Error en /register:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
});

// 🔹 Verificación 2FA - POST /api/auth/verify-2fa
router.post("/verify-2fa", async (req, res) => {
  try {
    const { tempToken, email, code } = req.body;

    if (!tempToken || !email || !code) {
      return res.status(400).json({ message: "Datos incompletos" });
    }

    // Validar token temporal
    let decoded;
    try {
      decoded = jwt.verify(tempToken, JWT_TEMP_SECRET);
    } catch (jwtError) {
      return res.status(401).json({ message: "Token de verificación inválido o expirado" });
    }

    // Buscar registro pendiente
    const pending = await PendingUser.findOne({
      email,
      tempToken,
      expiresAt: { $gt: new Date() }
    });

    if (!pending) {
      return res.status(400).json({ message: "Sesión de registro expirada. Regístrate nuevamente." });
    }
    
    if (pending.twoFACode !== code) {
      return res.status(400).json({ message: "Código de verificación incorrecto" });
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
    await PendingUser.deleteOne({ _id: pending._id });

    // Generar token de sesión final
    const token = jwt.sign(
      { 
        userId: newUser._id, 
        username: newUser.username,
        role: newUser.role 
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.status(200).json({
      message: "¡Cuenta verificada exitosamente! 🌸",
      token,
      username: newUser.username,
      role: newUser.role
    });

  } catch (error) {
    console.error("💥 Error en /verify-2fa:", error);
    res.status(500).json({ message: "Error del servidor" });
  }
});

// 🔹 LOGIN con reCAPTCHA - POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password, recaptchaToken } = req.body;
    const userIP = req.ip || req.connection.remoteAddress;

    // 🔐 1. Validar reCAPTCHA PRIMERO (antes de cualquier operación sensible)
    const captchaResult = await verifyRecaptcha(recaptchaToken, userIP);
    if (!captchaResult.success) {
      // Mensaje genérico para evitar enumeración de usuarios
      return res.status(400).json({ message: captchaResult.message });
    }

    // 2. Buscar usuario
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Credenciales inválidas" }); // Mensaje genérico
    }

    // 3. Validar contraseña
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: "Credenciales inválidas" });
    }

    // 4. Generar JWT con claims compatibles con verifyToken.js
    const token = jwt.sign(
      { 
        userId: user._id,
        username: user.username,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    // 5. Respuesta exitosa
    res.status(200).json({
      message: "Login exitoso",
      token,
      role: user.role,
      username: user.username,
      userId: user._id
    });

  } catch (error) {
    console.error("💥 Error en /login:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
});

module.exports = router;