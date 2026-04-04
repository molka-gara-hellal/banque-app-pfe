# 🏦 Wifak Bank — Application Mobile

Application mobile bancaire développée dans le cadre d'un **Projet de Fin d'Études (PFE)**, permettant aux clients de Wifak Bank de gérer leurs comptes, effectuer des virements, prendre des rendez-vous et interagir avec un assistant IA.

---

## 📱 Aperçu

| Connexion | Dashboard | Comptes | Rendez-vous |
|:---------:|:---------:|:-------:|:-----------:|
| Authentification sécurisée avec OTP | Vue d'ensemble du compte | Gestion des comptes bancaires | Prise de RDV en agence |

---

## 🚀 Fonctionnalités

### 👤 Authentification
- Inscription en 2 étapes (infos personnelles + sécurité)
- Connexion par email / mot de passe
- Vérification OTP par email
- Réinitialisation du mot de passe

### 🏠 Dashboard
- Solde en temps réel
- Dernières transactions
- Accès rapide aux fonctionnalités principales

### 💳 Comptes
- Liste des comptes bancaires
- Détail et historique par compte
- Téléchargement de relevé PDF

### 💸 Virements
- Virement entre comptes
- Virement vers un bénéficiaire

### 📅 Rendez-vous
- Calendrier interactif avec créneaux disponibles
- Prise de rendez-vous en agence
- Suivi des RDV (À venir / Passés)
- Annulation avec motif

### 💬 Assistant IA
- Chatbot bancaire intelligent

### 👤 Profil
- Informations personnelles
- Sécurité & mot de passe
- Notifications, langue, apparence
- Appareils connectés

---

## 🛠️ Stack Technique

### Mobile — `banque-mobile/`
| Technologie | Version |
|-------------|---------|
| React Native | via Expo |
| Expo SDK | 55 |
| Expo Router | File-based navigation |
| TypeScript / JSX | — |

### Backend — `banque-backend/`
| Technologie | Version |
|-------------|---------|
| Node.js | — |
| Express.js | 5.x |
| PostgreSQL | — |
| JWT | Authentification |
| Nodemailer | Envoi d'emails OTP |
| bcryptjs | Hashage des mots de passe |
| PDFKit | Génération de relevés |

---

## 📁 Structure du projet

```
banque-app-pfe-main/
├── banque-mobile/              # Application React Native (Expo)
│   ├── app/
│   │   ├── (auth)/             # Pages d'authentification
│   │   │   ├── login.jsx
│   │   │   ├── register-step1.jsx
│   │   │   ├── register-step2.jsx
│   │   │   ├── otp.tsx
│   │   │   ├── forgot-password.jsx
│   │   │   └── reset-password.jsx
│   │   ├── (tabs)/             # Pages principales (avec barre de navigation)
│   │   │   ├── dashboard.jsx
│   │   │   ├── comptes.jsx
│   │   │   ├── rdv.jsx
│   │   │   ├── assistant.jsx
│   │   │   ├── profil.jsx
│   │   │   ├── virement.jsx
│   │   │   ├── transactions.jsx
│   │   │   └── _layout.tsx
│   │   └── _layout.tsx
│   ├── assets/images/
│   ├── servives/api.js         # Configuration Axios
│   └── store/authStore.js      # Gestion du token JWT
│
└── banque-backend/             # API REST Node.js
    ├── server.js
    ├── config/db.js             # Connexion PostgreSQL
    ├── routes/
    │   ├── auth.routes.js
    │   ├── account.routes.js
    │   ├── transaction.routes.js
    │   ├── appointment.routes.js
    │   └── admin.routes.js
    ├── controllers/
    ├── middlewares/
    └── .env                    # Variables d'environnement (non versionné)
```

---

## ⚙️ Installation & Lancement

### Prérequis
- Node.js ≥ 18
- PostgreSQL
- Expo Go (sur téléphone) ou émulateur

### 1. Cloner le projet
```bash
git clone https://github.com/molka-gara-hellal/banque-app-pfe.git
cd banque-app-pfe-main
```

### 2. Configurer le Backend
```bash
cd banque-backend
npm install
```

Créer le fichier `.env` :
```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=votre_mot_de_passe
DB_NAME=banque_db
JWT_SECRET=votre_secret_jwt
EMAIL_USER=votre_email@gmail.com
EMAIL_PASS=votre_mot_de_passe_app
```

Créer les tables dans PostgreSQL puis lancer :
```bash
npm run dev
# Serveur sur http://localhost:5000
```

### 3. Lancer l'Application Mobile
```bash
cd banque-mobile
npm install
npx expo start
```

Scanner le QR code avec **Expo Go** sur votre téléphone.

---

## 🗄️ Base de données

Les principales tables :

| Table | Description |
|-------|-------------|
| `users` | Comptes utilisateurs |
| `accounts` | Comptes bancaires |
| `transactions` | Historique des transactions |
| `appointments` | Rendez-vous en agence |
| `disponibilites` | Créneaux disponibles pour RDV |

---

## 🔐 Sécurité

- Mots de passe hashés avec **bcryptjs**
- Authentification par **JWT** (Bearer Token)
- Vérification **OTP** par email à l'inscription
- Variables sensibles dans `.env` (non committé)

---

## 👩‍💻 Auteure

**Molka Gara Hellal**
Projet de Fin d'Études — 2025/2026

---

## 📄 Licence

Projet académique — tous droits réservés.
