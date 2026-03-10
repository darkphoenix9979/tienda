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

// Ruta para guardar preguntas desconocidas (del primer código)
app.post("/save_question", (req, res) => {
    const question = req.body.question;
    let data = [];
    
    if (fs.existsSync("unknown_questions.json")) {
        data = JSON.parse(fs.readFileSync("unknown_questions.json"));
    }
    
    data.push(question);
    fs.writeFileSync("unknown_questions.json", JSON.stringify(data, null, 2));
    
    res.json({ message: "Pregunta guardada" });
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