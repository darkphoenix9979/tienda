const express = require("express");
const fs = require("fs");
const mongoose = require("mongoose");
const path = require("path");
const cors = require("cors");
const helmet = require("helmet"); // ✅ Seguridad adicional
require("dotenv").config();

const app = express();

/* ==========================
   MIDDLEWARE
========================== */

// ✅ Helmet para headers de seguridad (OWASP)
app.use(helmet());

// ✅ CORS configurado explícitamente
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true
}));

// ✅ Parsear JSON con rawBody para webhooks (CRÍTICO para validar firma)
app.use(express.json({ 
    verify: (req, res, buf) => {
        req.rawBody = buf.toString();
    }
}));
app.use(express.urlencoded({ extended: true }));

/* ==========================
   ARCHIVOS ESTÁTICOS
========================== */
app.use(express.static(path.join(__dirname, "public")));

/* ==========================
   RUTAS DE LA API
========================== */

// ✅ Rutas existentes
const productsRoutes = require("./routes/products");
const authRoutes = require("./routes/auth");
const carouselRoutes = require("./routes/carousel");

app.use("/api/products", productsRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/carousel", carouselRoutes);

// ✅ NUEVO: Rutas de pago (MercadoPago)
const paymentRoutes = require('./routes/payment.routes'); // ← Verifica el nombre del archivo
app.use('/api/payment', paymentRoutes);

// ✅ NUEVO: Rutas de webhooks (NOTIFICACIONES de MercadoPago)
const webhookRoutes = require('./routes/webhook.routes'); // ← Debes crear este archivo
app.use('/api/webhooks', webhookRoutes);

/* ==========================
   CHATBOT - PREGUNTAS DESCONOCIDAS
========================== */
const UnknownQuestion = require("./models/UnknownQuestion");

app.post("/api/chatbot/unknown", async (req, res) => {
    try {
        const question = req.body.question;
        if (!question) {
            return res.status(400).json({ error: "Pregunta vacía" });
        }

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
   USUARIOS
========================== */
const User = require("./models/User");

app.get("/api/users", async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: "Error obteniendo usuarios" });
    }
});

/* ==========================
   RUTAS FRONTEND
========================== */
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "tienda.html"));
});

// ✅ Health check para monitoreo
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        env: process.env.NODE_ENV 
    });
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
   MIDDLEWARE DE ERROR (Global)
========================== */
// ✅ Captura errores 404
app.use((req, res, next) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
});

// ✅ Captura errores de la aplicación
app.use((err, req, res, next) => {
    console.error('❌ Error global:', err);
    res.status(500).json({ 
        error: 'Error interno del servidor',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

/* ==========================
   PUERTO DEL SERVIDOR
========================== */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📦 Modo: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});