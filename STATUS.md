# 🚀 Applications ASTBA - Statut de Démarrage

## ✅ État Actuel

### Backend (Spring Boot)
- **Statut**: ✅ EN MARCHE
- **Port**: 8080
- **URL**: http://localhost:8080
- **API Base**: http://localhost:8080/api
- **Base de données**: H2 Database (./data/astbadb)
- **Console H2**: http://localhost:8080/h2-console

### Frontend (React + Vite)
- **Statut**: ✅ EN MARCHE
- **Port**: 5173
- **URL**: http://localhost:5173
- **Dev Server**: Vite v7.3.1

## 🔗 Connexion Entre les Apps

**Frontend → Backend**:
- L'API client utilise `axios` avec `baseURL: http://localhost:8080/api`
- Les tokens JWT sont stockés dans `localStorage`
- Les requêtes incluent l'entête `Authorization: Bearer {token}`

**Backend → Frontend CORS**:
- ✅ CORS configuré pour accepter `http://localhost:5173`
- ✅ Credentials activées
- ✅ Tous les headers autorisés
- ✅ Toutes les méthodes HTTP autorisées

## 📝 Configuration de l'Authentification

- **JWT Secret**: `9a4f2c8d3b7a1e6f4g5h8i0j2k4l6m8n0o2p4q6r8s0t2u4v6w8x0y2z4`
- **Expiration JWT**: 86400000 ms (24 heures)
- **Hash**: BCrypt

## 🔐 Endpoints Authentification

- `POST /api/auth/login` - Connexion (email, password)
- `POST /api/auth/logout` - Déconnexion

## 📚 Architecture

```
HACK/
├── backend/ (Spring Boot 3.2.3)
│   ├── src/main/java/com/astba/backend/
│   │   ├── controller/ (AuthController, MessageController, etc.)
│   │   ├── service/ (Services métier)
│   │   ├── entity/ (Entités JPA)
│   │   ├── dto/ (DTOs - LoginRequest, JwtAuthenticationResponse)
│   │   ├── config/ (SecurityConfig, DataSeeder)
│   │   └── security/ (JwtTokenProvider, JwtAuthenticationFilter)
│   └── pom.xml (Maven configuration)
│
└── frontend/ (React 19 + Vite)
    ├── src/
    │   ├── pages/ (Dashboard, Login, Messages, etc.)
    │   ├── components/ (Réutilisables - Badge, Button, Card)
    │   ├── services/ (api.ts, auth.service.ts, etc.)
    │   ├── router/ (Configuration React Router)
    │   └── i18n/ (Internationalisation)
    └── package.json (npm dependencies)
```

## 🎯 Prochaines Étapes

1. Ouvrir http://localhost:5173 dans un navigateur
2. Se connecter avec les credentials de test
3. Tester les endpoints API
4. Vérifier les messages et formations

## 🛠️ Commandes Utiles

**Backend**:
```bash
cd backend
mvn clean spring-boot:run  # Démarrer
mvn clean compile          # Compiler
```

**Frontend**:
```bash
cd frontend
npm install               # Installer les dépendances
npm run dev             # Démarrer le serveur de développement
npm run build           # Compiler pour production
npm run lint            # Vérifier le code
```

## 📊 Services Disponibles

- **Message Service**: Gestion des messages
- **Student Service**: Gestion des étudiants
- **Training Service**: Gestion des formations
- **Auth Service**: Authentification
- **Student Attendance**: Gestion de la présence

---

**Date de démarrage**: 7 février 2026
**Utilisateur**: OUSSAMA BEN GAMRA
