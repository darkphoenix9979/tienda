// middlewares/verifyToken.js
const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "No autorizado" });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Token faltante" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secreto123");
    req.user = { id: decoded.id, username: decoded.username };
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token inválido" });
  }
};