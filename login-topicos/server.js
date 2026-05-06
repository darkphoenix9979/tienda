// server.js - VERSIÓN COMPLETA Y FUNCIONAL
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const cors = require("cors");
const helmet = require("helmet");

const app = express();

/* ==========================
   MIDDLEWARE
========================== */
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ 
    verify: (req, res, buf) => { req.rawBody = buf.toString(); }
}));
app.use(express.urlencoded({ extended: true }));

/* ==========================
   ARCHIVOS ESTÁTICOS (Cloudinary, imágenes, etc.)
========================== */
app.use(express.static(path.join(__dirname, "public"), {
    maxAge: '1d',  // Cache para producción
    setHeaders: (res, path) => {
        if (path.endsWith('.jpg') || path.endsWith('.png')) {
            res.setHeader('Cache-Control', 'public, max-age=31536000');
        }
    }
}));

/* ==========================
   CONEXIÓN A MONGODB
========================== */
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log("✅ MongoDB conectado"))
.catch((err) => console.error("❌ Error MongoDB:", err.message));

/* ==========================
   RUTAS DE LA API
========================== */

// ✅ Productos (para cargar imágenes de Cloudinary)
try {
    const productsRoutes = require("./routes/products");
    app.use("/api/products", productsRoutes);
    console.log("✅ Rutas de productos cargadas");
} catch (e) {
    console.warn("⚠️ No se pudieron cargar rutas de productos:", e.message);
}

// ✅ Carrusel (imágenes del hero)
try {
    const carouselRoutes = require("./routes/carousel");
    app.use("/api/carousel", carouselRoutes);
    console.log("✅ Rutas de carrusel cargadas");
} catch (e) {
    console.warn("⚠️ No se pudieron cargar rutas de carrusel:", e.message);
}

// ✅ Autenticación
try {
    const authRoutes = require("./routes/auth");
    app.use("/api/auth", authRoutes);
    console.log("✅ Rutas de auth cargadas");
} catch (e) {
    console.warn("⚠️ No se pudieron cargar rutas de auth:", e.message);
}

// ✅ Chatbot (para que funcione la lectura de página)
try {
    const UnknownQuestion = require("./models/UnknownQuestion");
    
    app.post("/api/chatbot/unknown", async (req, res) => {
        try {
            const { question } = req.body;
            if (!question) return res.status(400).json({ error: "Pregunta vacía" });
            
            const newQuestion = new UnknownQuestion({ question });
            await newQuestion.save();
            res.json({ status: "saved" });
        } catch (error) {
            console.error("Error chatbot:", error);
            res.status(500).json({ error: "Error del servidor" });
        }
    });

    app.get("/api/chatbot/questions", async (req, res) => {
        try {
            const UnknownQuestion = require("./models/UnknownQuestion");
            const questions = await UnknownQuestion.find().sort({ date: -1 });
            res.json(questions);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Error del servidor" });
        }
    });
    console.log("✅ Rutas de chatbot cargadas");
} catch (e) {
    console.warn("⚠️ No se pudieron cargar rutas de chatbot:", e.message);
}

// ✅ Pago con MercadoPago (botón "Comprar")
try {
    const paymentRoutes = require("./routes/payment");  // ← Verifica el nombre exacto
    app.use("/api/payment", paymentRoutes);
    console.log("✅ Rutas de pago cargadas");
} catch (e) {
    console.warn("⚠️ No se pudieron cargar rutas de pago:", e.message);
    // Ruta mínima de fallback para que el frontend no falle
    app.post("/api/payment/create-preference", (req, res) => {
        res.status(501).json({ 
            error: 'Servicio de pago no disponible', 
            hint: 'Configura Mercadopago en routes/payment.js' 
        });
    });
}

// ✅ Usuarios (si lo usas)
try {
    const User = require("./models/User");
    app.get("/api/users", async (req, res) => {
        try {
            const users = await User.find();
            res.json(users);
        } catch (error) {
            res.status(500).json({ message: "Error obteniendo usuarios" });
        }
    });
    console.log("✅ Ruta de usuarios cargada");
} catch (e) {
    console.warn("⚠️ No se pudo cargar ruta de usuarios:", e.message);
}

/* ==========================
   RUTAS FRONTEND
========================== */
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "tienda.html"));
});

app.get("/api/health", (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        routes: {
            products: '/api/products',
            carousel: '/api/carousel',
            payment: '/api/payment/create-preference',
            chatbot: '/api/chatbot/unknown'
        }
    });
});

/* ==========================
   MIDDLEWARE DE ERROR
========================== */
app.use((req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada', path: req.path });
});

app.use((err, req, res, next) => {
    console.error('❌ Error global:', err);
    res.status(500).json({ 
        error: 'Error interno',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

/* ==========================
   PUERTO - SOLO UNA VEZ
========================== */
const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
    console.log(`🌐 Health: http://localhost:${PORT}/api/health`);
});

process.on('SIGTERM', () => {
    console.log('🔄 Cerrando servidor...');
    process.exit(0);
});