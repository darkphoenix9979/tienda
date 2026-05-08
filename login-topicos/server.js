const express = require("express");
const fs = require("fs");
const mongoose = require("mongoose");
const path = require("path");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();

/* ==========================
   MODELOS
========================== */
const User = require("./models/User");
const UnknownQuestion = require("./models/UnknownQuestion");

/* ==========================
   MIDDLEWARE: VERIFY TOKEN (INLINE)
========================== */
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "No autorizado" });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Token faltante" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secreto123");
    req.user = { 
      id: decoded.userId || decoded.id,
      username: decoded.username,
      role: decoded.role
    };
    next();
  } catch (err) {
    console.error("Error token:", err.message);
    return res.status(401).json({ message: "Token inválido o expirado" });
  }
};

/* ==========================
   MIDDLEWARE: VERIFICAR ADMIN (DEFINIDO ANTES DE USARLO)
========================== */
const verificarAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Acceso denegado: se requiere rol admin" });
  }
  next();
};

/* ==========================
   MIDDLEWARE: EXPRESS
========================== */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

/* ==========================
   RUTAS EXTERNAS
========================== */
const productsRoutes = require("./routes/products");
const authRoutes = require("./routes/auth");
const carouselRoutes = require("./routes/carousel");
const paymentRoutes = require("./routes/payment");

app.use("/api/products", productsRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/carousel", carouselRoutes);
app.use("/api/payment", paymentRoutes);

/* ==========================
   RUTAS: GESTIÓN DE USUARIOS (verificarAdmin YA ESTÁ DEFINIDO)
========================== */

// GET /api/users - Listar usuarios (sin passwords)
app.get("/api/users", verifyToken, verificarAdmin, async (req, res) => {
  try {
    const usuarios = await User.find({}, "-password -__v -resetToken -resetTokenExpire");
    res.json(usuarios);
  } catch (error) {
    console.error("Error obteniendo usuarios:", error);
    res.status(500).json({ message: "Error del servidor" });
  }
});

// PUT /api/users/:id/role - Cambiar rol
app.put("/api/users/:id/role", verifyToken, verificarAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    if (!["admin", "user", "moderator"].includes(role)) {
      return res.status(400).json({ message: "Rol no válido" });
    }
    if (role !== "admin" && req.user.id === req.params.id) {
      const adminsCount = await User.countDocuments({ role: "admin" });
      if (adminsCount <= 1) {
        return res.status(400).json({ message: "Debe haber al menos un administrador" });
      }
    }
    const usuario = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, select: "-password -__v" }
    );
    if (!usuario) return res.status(404).json({ message: "Usuario no encontrado" });
    res.json({ message: "Rol actualizado", usuario });
  } catch (error) {
    console.error("Error actualizando rol:", error);
    res.status(500).json({ message: "Error del servidor" });
  }
});

// DELETE /api/users/:id - Eliminar usuario
app.delete("/api/users/:id", verifyToken, verificarAdmin, async (req, res) => {
  try {
    if (req.user.id === req.params.id) {
      return res.status(400).json({ message: "No puedes eliminar tu propia cuenta" });
    }
    const usuario = await User.findByIdAndDelete(req.params.id);
    if (!usuario) return res.status(404).json({ message: "Usuario no encontrado" });
    res.json({ message: "Usuario eliminado" });
  } catch (error) {
    console.error("Error eliminando usuario:", error);
    res.status(500).json({ message: "Error del servidor" });
  }
});

/* ==========================
   CHATBOT: PREGUNTAS DESCONOCIDAS
========================== */
app.post("/api/chatbot/unknown", async (req, res) => {
  try {
    const question = req.body.question;
    if (!question) return res.status(400).json({ error: "Pregunta vacía" });
    const newQuestion = new UnknownQuestion({ question });
    await newQuestion.save();
    res.json({ status: "saved" });
  } catch (error) {
    console.error("Error guardando pregunta:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
});

app.get("/api/chatbot/questions", async (req, res) => {
  try {
    const questions = await UnknownQuestion.find().sort({ date: -1 });
    res.json(questions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error del servidor" });
  }
});

/* ==========================
   CONEXIÓN MONGODB
========================== */
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB conectado"))
  .catch(err => console.error("❌ Error MongoDB:", err));

/* ==========================
   RUTA PRINCIPAL
========================== */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "tienda.html"));
});

/* ==========================
   PUERTO
========================== */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor en puerto ${PORT}`);
});