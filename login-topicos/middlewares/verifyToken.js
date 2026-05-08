// middlewares/verifyToken.js
const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "No autorizado" });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Token faltante" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secreto123");
    
    // ✅ Incluir role + manejar tanto 'id' como 'userId' del payload
    req.user = { 
      id: decoded.userId || decoded.id,  // Soporta ambos nombres
      username: decoded.username,
      role: decoded.role                  // ← ESTO FALTABA (necesario para verificarAdmin)
    };
    
    next();
  } catch (err) {
    console.error("Error verificando token:", err.message);
    return res.status(401).json({ message: "Token inválido o expirado" });
  }
};