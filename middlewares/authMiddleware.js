const jwt = require("jsonwebtoken");

module.exports = function authMiddleware(req, res, next) {
  try {
    // ✅ prend token depuis Header OU Query Params
    const authHeader =
      req.headers.authorization ||
      req.headers.Authorization ||
      req.query.authorization ||
      req.query.Authorization ||
      "";

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : authHeader; // si tu envoies direct le token sans "Bearer"

    if (!token) {
      return res.status(401).json({ message: "Token manquant" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token invalide" });
  }
};