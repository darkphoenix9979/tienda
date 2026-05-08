const express = require("express");
const fs = require("fs");
const mongoose = require("mongoose");
const path = require("path");
const cors = require("cors");
const verifyToken = require("./middleware/verifyToken"); // ← Tu middleware existente
require("dotenv").config();

const app = express();

/* ==========================
   MODELOS
========================== */

const User = require("./models/User");
const UnknownQuestion = require("./models/UnknownQuestion");

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
const paymentRoutes = require("./routes/payment");

app.use("/api/products", productsRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/carousel", carouselRoutes);
app.use("/api/payment", paymentRoutes);

/* ==========================
   MIDDLEWARE: VERIFICAR ADMIN
========================== */

// 🔐 Verifica que req.user.role sea 'admin'
// (req.user ya fue seteado por verifyToken.js)
const verificarAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Acceso denegado: se requiere rol admin" });
  }
  next();
};

/* ==========================
   RUTAS: GESTIÓN DE USUARIOS (SOLO ADMIN)
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

// PUT /api/users/:id/role - Cambiar rol de usuario
app.put("/api/users/:id/role", verifyToken, verificarAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    
    if (!["admin", "user", "moderator"].includes(role)) {
      return res.status(400).json({ message: "Rol no válido" });
    }
    
    // Prevenir que el último admin pierda su rol
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
    
    if (!usuario) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    
    res.json({ message: "Rol actualizado", usuario });
    
  } catch (error) {
    console.error("Error actualizando rol:", error);
    res.status(500).json({ message: "Error del servidor" });
  }
});

// DELETE /api/users/:id - Eliminar usuario
app.delete("/api/users/:id", verifyToken, verificarAdmin, async (req, res) => {
  try {
    // Prevenir auto-eliminación
    if (req.user.id === req.params.id) {
      return res.status(400).json({ message: "No puedes eliminar tu propia cuenta" });
    }
    
    const usuario = await User.findByIdAndDelete(req.params.id);
    
    if (!usuario) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    
    res.json({ message: "Usuario eliminado" });
    
  } catch (error) {
    console.error("Error eliminando usuario:", error);
    res.status(500).json({ message: "Error del servidor" });
  }
});

/* ==========================
   GUARDAR PREGUNTAS DESCONOCIDAS (MongoDB)
========================== */

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

/* ==========================
   PUERTO DEL SERVIDOR
========================== */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});