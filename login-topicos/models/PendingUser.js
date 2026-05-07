const mongoose = require("mongoose");

const pendingUserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  twoFACode: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  tempToken: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 86400 } // TTL: auto-borrado en 24h
});

module.exports = mongoose.model("PendingUser", pendingUserSchema);