const express = require("express");
const fs = require("fs");
const mongoose = require("mongoose");
const path = require("path");
const cors = require("cors");
require("dotenv").config();

const app = express();

/* ==========================
   MIDDLEWARE
========================== */

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ==========================
   ARCHIVOS ESTÁTICOS
========================== */

app.use(express.static(path.join(__dirname, "public")));

/* ==========================
   RUTAS
========================== */

const productsRoutes = require("./routes/products");
const authRoutes = require("./routes/auth");
const carouselRoutes = require("./routes/carousel");

app.use("/api/products", productsRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/carousel", carouselRoutes);

/* ==========================
   GUARDAR PREGUNTAS DESCONOCIDAS (MongoDB)
========================== */

const UnknownQuestion = require("./models/UnknownQuestion");

app.post("/api/chatbot/unknown", async (req, res) => {

    try {

        const question = req.body.question;

        if (!question) {
            return res.status(400).json({ error: "Pregunta vacía" });
        }

        const newQuestion = new UnknownQuestion({
            question: question
        });

        await newQuestion.save();

        res.json({ status: "saved" });

    } catch (error) {

        console.error("Error guardando pregunta:", error);
        res.status(500).json({ error: "Error del servidor" });

    }

});

/* ==========================
   VER PREGUNTAS DESCONOCIDAS
========================== */

app.get("/api/chatbot/questions", async (req, res) => {

    try {

        const questions = await UnknownQuestion.find().sort({ date: -1 });

        res.json(questions);

    } catch (error) {

        console.error(error);
        res.status(500).json({ error: "Error del servidor" });

    }

});

// 🔐 Middleware: verificar que sea admin
const verificarAdmin = (req, res, next) => {
  if (req.usuario?.role !== 'admin') {
    return res.status(403).json({ message: "Acceso denegado" });
  }
  next();
};

// GET /api/users - Listar usuarios (sin passwords)
app.get("/api/users", verificarAdmin, async (req, res) => {
  try {
    // 🔒 PROYECTAR para EXCLUIR password y datos sensibles
    const usuarios = await User.find({}, "-password -__v -resetToken");
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ message: "Error del servidor", error: error.message });
  }
});

// PUT /api/users/:id/role - Cambiar rol
app.put("/api/users/:id/role", verificarAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    if (!["admin", "user", "moderator"].includes(role)) {
      return res.status(400).json({ message: "Rol no válido" });
    }
    
    // 🔐 Prevenir auto-eliminación de último admin
    if (role !== "admin") {
      const adminsCount = await User.countDocuments({ role: "admin" });
      if (adminsCount <= 1 && req.usuario._id === req.params.id) {
        return res.status(400).json({ message: "Debe haber al menos un admin" });
      }
    }
    
    const usuario = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, select: "-password" }
    );
    
    if (!usuario) return res.status(404).json({ message: "Usuario no encontrado" });
    
    res.json({ message: "Rol actualizado", usuario });
  } catch (error) {
    res.status(500).json({ message: "Error del servidor" });
  }
});

// DELETE /api/users/:id - Eliminar usuario
app.delete("/api/users/:id", verificarAdmin, async (req, res) => {
  try {
    // 🔐 Prevenir eliminación del propio admin
    if (req.usuario._id === req.params.id) {
      return res.status(400).json({ message: "No puedes eliminarte a ti mismo" });
    }
    
    const usuario = await User.findByIdAndDelete(req.params.id);
    if (!usuario) return res.status(404).json({ message: "Usuario no encontrado" });
    
    res.json({ message: "Usuario eliminado" });
  } catch (error) {
    res.status(500).json({ message: "Error del servidor" });
  }
});

/* ==========================
   CONEXIÓN A MONGODB
========================== */

mongoose.connect(process.env.MONGO_URI)
.then(() => {
    console.log("✅ MongoDB conectado correctamente");
})
.catch((err) => {
    console.error("❌ Error conectando a MongoDB:", err);
});

/* ==========================
   RUTA PRINCIPAL
========================== */

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "tienda.html"));
});

// ==========================
// OBTENER USUARIOS
// ==========================

const User = require("./models/User");

app.get("/api/users", async (req,res)=>{

try{

const users = await User.find();

res.json(users);

}catch(error){

res.status(500).json({message:"Error obteniendo usuarios"});

}

});

// app.js o index.js
const paymentRoutes = require('./routes/payment');
app.use('/api/payment', paymentRoutes);

/* ==========================
   PUERTO DEL SERVIDOR
========================== */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});