# 💳 Banque Mobile App – PFE

Application bancaire mobile développée dans le cadre du **Projet de Fin d'Études (PFE)**.
Le projet permet aux clients d’une banque de gérer leur compte, consulter leurs transactions et prendre des rendez-vous avec un conseiller via une application mobile.

---

# 📱 Fonctionnalités principales

### 🔐 Authentification

* Inscription utilisateur
* Connexion sécurisée avec **JWT**
* Vérification par **OTP envoyé par email**
* Gestion des rôles (Client / Admin)

### 💰 Gestion du compte

* Consultation du compte bancaire
* Affichage du solde
* Informations du client

### 💸 Transactions

* Liste des transactions
* Historique des opérations

### 📅 Rendez-vous bancaire

* Prendre un rendez-vous avec la banque
* Modifier un rendez-vous
* Supprimer un rendez-vous

### 🛠 Administration

* Liste des clients
* Détails d’un client
* Statistiques globales

---

# 🧰 Technologies utilisées

## Backend

* **Node.js**
* **Express.js**
* **PostgreSQL**
* **JWT Authentication**
* **Nodemailer** (OTP Email)
* **bcryptjs** (hash mot de passe)

## Mobile

* **React Native**
* **Expo**
* **Expo Router**
* **Zustand** (gestion d'état)

---

# 🏗 Architecture du projet

```
banque-app-pfe
│
├── banque-backend
│   │
│   ├── config
│   │   └── db.js
│   │
│   ├── controllers
│   │   ├── auth.controller.js
│   │   ├── account.controller.js
│   │   ├── transaction.controller.js
│   │   ├── appointment.controller.js
│   │   └── admin.controller.js
│   │
│   ├── middlewares
│   │   ├── authMiddleware.js
│   │   └── adminMiddleware.js
│   │
│   ├── routes
│   │   ├── auth.routes.js
│   │   ├── account.routes.js
│   │   ├── transaction.routes.js
│   │   ├── appointment.routes.js
│   │   └── admin.routes.js
│   │
│   ├── server.js
│   └── package.json
│
├── banque-mobile
│   │
│   ├── app
│   │   ├── (auth)
│   │   ├── (tabs)
│   │   └── index.tsx
│   │
│   ├── components
│   ├── assets
│   ├── store
│   └── package.json
│
└── README.md
```

---

# ⚙ Installation du projet

## 1️⃣ Cloner le projet

```
git clone https://github.com/molka-gara-hellal/banque-app-pfe.git
```

---

# 🚀 Backend

## Installation

```
cd banque-backend
npm install
```

## Configuration

Créer un fichier `.env`

```
PORT=5000

DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=banque_app
DB_PORT=5433

JWT_SECRET=your_secret

SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_pass

MAIL_FROM=your_email@gmail.com
OTP_TTL_SECONDS=300
```

## Lancer le serveur

```
node server.js
```

Le backend tourne sur :

```
http://localhost:5000
```

---

# 📱 Mobile

## Installation

```
cd banque-mobile
npm install
```

## Lancer l'application

```
npx expo start
```

Puis scanner le **QR code avec Expo Go**.

---

# 🔗 API Endpoints

## Authentification

```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/send-otp-email
POST /api/auth/verify-otp
GET  /api/auth/me
```

## Comptes

```
GET /api/accounts/me
```

## Transactions

```
GET /api/transactions
```

## Rendez-vous

```
POST   /api/appointments
GET    /api/appointments
PUT    /api/appointments/:id
DELETE /api/appointments/:id
```

## Administration

```
GET /api/admin/clients
GET /api/admin/clients/:id
GET /api/admin/stats
```

---

# 🔐 Sécurité

* Authentification avec **JWT**
* Mots de passe hashés avec **bcrypt**
* OTP sécurisé avec **SHA256**
* Middleware d'authentification
* Gestion des rôles utilisateurs

---

# 👩‍💻 Auteur

Projet réalisé par :

**Molka Gara Hellal**

Projet de Fin d'Études – Développement d'une application bancaire mobile.

---

# 📄 Licence

Projet académique réalisé dans le cadre d'un PFE.
