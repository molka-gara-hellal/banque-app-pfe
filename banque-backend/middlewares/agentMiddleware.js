const AGENT_ROLES = [
  'admin',
  'chef_agence',
  'charge_clientele',
  'guichet_accueil',
  'responsable_guichet',
];

module.exports = function agentMiddleware(req, res, next) {
  if (!AGENT_ROLES.includes(req.user.role)) {
    return res.status(403).json({ message: "Accès réservé aux agents Wifak Bank" });
  }
  next();
};