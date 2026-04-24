//importation des modules
const { Pool } = require('pg');
//pg=module de travailler avec PostrgreSQL
//on importe Pool depuis la bib pg
//Pool =permet de gérer plusiers connexions a la base

require('dotenv').config();
//permet de charger les var du fic .env
//eviter d'ecrire les mdp dans le code directement (sécurité)

//création de la connexion
const pool = new Pool({
  //on crée un pool de connexion a la base
  host: process.env.DB_HOST,
  //adrs du serveur(ex:localhost)
  user: process.env.DB_USER,
  //nom d'utilisateur PostgreSQL
  password: process.env.DB_PASSWORD,
  //mot de passe
  database: process.env.DB_NAME,
  //nom de la base de données
  port: process.env.DB_PORT,
  //port (5432)
});

//test de connexion
pool.connect()
//on essaie de se connecter a la base
  .then(() => console.log('PostgreSQL connecté ✅'))
  //si succès -> msg dans le console
  .catch(err => console.error('Erreur connexion DB ❌', err));
  //si erreur -> affiche l'erreur

  //export
module.exports = pool;
//on exporte pool
//pour avoir l'utiliser dans d'autre fic comme account.controller.js