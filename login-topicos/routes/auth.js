const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");


// 🔹 REGISTRO
router.post("/register", async (req, res) => {

  try {

    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        message: "Todos los campos son obligatorios"
      });
    }

    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        message: "Usuario o email ya existe"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      email,
      password: hashedPassword
    });

    await newUser.save();

    res.status(201).json({
      message: "Usuario registrado correctamente"
    });

  } catch (error) {

    console.error("Error en registro:", error);

    res.status(500).json({
      message: "Error del servidor"
    });

  }

});


// 🔹 LOGIN
router.post("/login", async (req, res) => {

  try {

    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "Usuario no encontrado"
      });
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(400).json({
        message: "Contraseña incorrecta"
      });
    }

    res.status(200).json({
      message: "Login exitoso",
      role: user.role,
      username: user.username
    });

  } catch (error) {

    console.error("Error en login:", error);

    res.status(500).json({
      message: "Error del servidor"
    });

  }

});

module.exports = router;