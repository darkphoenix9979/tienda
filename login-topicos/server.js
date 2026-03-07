const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "public")));

const productsRoutes = require("./routes/products");
const authRoutes = require("./routes/auth");
const carouselRoutes = require("./routes/carousel");

app.use("/api/products", productsRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/carousel", carouselRoutes);

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Mongo conectado"))
  .catch(err => console.log(err));

app.listen(3000, () => {
  console.log("Servidor en puerto 3000");
});