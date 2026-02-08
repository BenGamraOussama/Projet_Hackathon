# ASTBA Training Management System

Bienvenue dans le projet ASTBA Training Management. Cette plateforme est une solution complète pour la gestion des formations, intégrant un backend robuste, une interface utilisateur moderne et des fonctionnalités d'intelligence artificielle.

## 📚 Vue d'ensemble

Ce projet est composé de trois parties principales :

1.  **Backend (`/backend`)** : Une API RESTful construite avec Spring Boot (Java).
2.  **Frontend (`/frontend`)** : Une application web interactive construite avec React, Vite et Tailwind CSS.
3.  **Service IA (`/python_ai`)** : Un microservice Python pour l'analyse intelligente et le filtrage.

## 🛠 Technologies Utilisées

### Backend
*   **Langage** : Java 17
*   **Framework** : Spring Boot 3.2.3
*   **Base de Données** : MySQL / H2 (pour le développement)
*   **Sécurité** : Spring Security, JWT (JSON Web Tokens)
*   **Documentation** : OpenAPI (Swagger)
*   **Outils** : Flyway (Migration DB), Lombok, Maven

### Frontend
*   **Framework** : React 19
*   **Build Tool** : Vite
*   **Langage** : TypeScript
*   **Style** : Tailwind CSS
*   **Gestion d'état/Routing** : React Router DOM, Axios
*   **Internationalisation** : i18next

### Intelligence Artificielle et Services
*   **Service Python** : Flask (Microservice de scoring et filtrage de mots-clés)
*   **LLM** : Intégration avec Mistral AI pour la génération de contenu/structures de formation.

## 🚀 Installation et Démarrage

### Prérequis
*   Java 17+
*   Node.js (v18+ recommandé)
*   Python 3.x
*   MySQL (optionnel si H2 est utilisé)

### 1. Démarrer le Backend
```bash
cd backend
# Lancer l'application (télécharge les dépendances Maven automatiquement)
./mvnw spring-boot:run
```
L'API sera accessible sur : `http://localhost:8080/api`
Console H2 (si active) : `http://localhost:8080/h2-console`

### 2. Démarrer le Frontend
```bash
cd frontend
# Installer les dépendances
npm install
# Lancer le serveur de développement
npm run dev
```
L'application sera accessible sur : `http://localhost:5173`

### 3. Démarrer le Service IA
```bash
cd python_ai
# Installer les dépendances Python
pip install -r requirements.txt
# Lancer le service Flask
python app.py
```
Le service écoutera sur : `http://localhost:5005`

## 🔑 Comptes de Démonstration

Pour tester l'application, vous pouvez utiliser les comptes suivants (Mot de passe : `demo123`) :

*   **Responsable** : `responsable@astba.tn` (Gestion des formations, plannings, étudiants)
*   **Formateur** : `formateur@astba.tn` (Suivi des présences, évaluation)
*   **Admin** : `admin@astba.tn` (Administration globale)

## ✨ Fonctionnalités Principales

*   **Gestion des Formations** : Création manuelle ou automatique de structures de formation.
*   **Assistance IA** : Génération de plans de cours et de structures pédagogiques via IA.
*   **Suivi des Étudiants** : Inscription, suivi de présence et génération de certificats.
*   **Tableaux de Bord** : Vues spécifiques pour les Responsables et Formateurs avec statistiques graphiques.
*   **Sécurité** : Authentification JWT et gestion des rôles (RBAC).

## 📂 Structure du Projet

```
.
├── backend/        # Code source Java / Spring Boot
├── frontend/       # Code source React / TypeScript
├── python_ai/      # Scripts Python pour l'IA
├── DEMO.md         # Scénarios de démonstration détaillés
├── STATUS.md       # État actuel du projet et configuration technique
└── ...
```

---
*Généré automatiquement par l'assistant IA.*
