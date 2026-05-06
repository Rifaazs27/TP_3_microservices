# TP1 - Microservices

## 🧩 Présentation

Ce projet est un TP autour d’une architecture microservices.
L’objectif est de mettre en place plusieurs services indépendants qui communiquent entre eux, le tout conteneurisé avec Docker et orchestré avec Docker Compose.

On retrouve ici un mélange de technologies (Node.js, Python, PHP), ce qui permet de simuler un environnement un peu plus réaliste côté backend.

---

## 🏛️ Architecture

Le projet repose sur 3 services principaux :

### 📌 Kanboard (PHP)
- Interface web de gestion de tâches
- Connectée à une base MariaDB
- Accessible via navigateur (login par défaut : admin/admin)

### 📌 API RH (Node.js / Express)
- Gère des données côté employés
- Expose des routes simples
- Fournit aussi des endpoints de monitoring

### 📌 Data Processor (Python / Flask)
- S’occupe du traitement de données
- Peut être utilisé pour des calculs ou transformations

---

## Choix techniques

### Docker
Chaque service tourne dans son propre conteneur.  
Les images sont optimisées grâce à des builds en plusieurs étapes pour éviter d’embarquer des dépendances inutiles.

### Docker Compose
- Tous les services sont lancés via un seul fichier
- Réseau interne pour la communication entre conteneurs
- Démarrage contrôlé avec `depends_on` et healthchecks

---

## 📊 Monitoring & sécurité

- `/health` → permet de vérifier si un service tourne
- `/metrics` → donne quelques infos (mémoire, uptime…)
- Certificats SSL générés avec OpenSSL (préparation HTTPS)

---

## 🚀 Lancer le projet

### Prérequis
- Docker
- Docker Compose
- OpenSSL

### Générer les certificats

```bash
mkdir -p certs

openssl req -x509 -newkey rsa:2048 \
-keyout certs/key.pem \
-out certs/cert.pem \
-days 365 \
-nodes \
-subj "/C=FR/O=TP_Microservices/CN=localhost"
```

### Démarrer les services

```bash
docker compose up --build -d
```

## 🔗 Accès aux Services

| Service | URL | Description |
|--------|-----|------------|
| Kanboard | http://localhost:8080 | Interface web (admin/admin) |
| API RH - Health | http://localhost:3000/health | État du service Node.js |
| API RH - Metrics | http://localhost:3000/metrics | Métriques Node.js |
| Python - Health | http://localhost:5000/health | État du service Python |
| Python - Metrics | http://localhost:5000/metrics | Métriques Python |

## ✅ Vérification des services

Pour vérifier que tous les conteneurs sont actifs et en bonne santé :

```bash
docker ps
```

## 🛠️ Vérification de la connectivité réseau

Pour valider que les microservices communiquent correctement entre eux au sein du cluster Docker, vous pouvez exécuter les tests suivants :

---

### 1️⃣ Test de résolution DNS interne

Vérifie que le service Kanboard est capable de localiser l’API-RH par son nom de service :

```bash
docker exec -it kanboard_app ping api_rh -c 3
```

### 2️⃣ Test d’échange de données (cURL)

Vérifie que le service Kanboard peut consommer les données de l’API-RH :

```bash
docker exec -it kanboard_app curl http://api_rh:3000/health
```

### 3️⃣ Inspection du réseau virtuel

Permet de visualiser tous les conteneurs connectés au réseau privé du TP :
```bash
docker network inspect tp_1_microservices_tp-network
```

## 🎯 Objectifs Pédagogiques Validés

Cette section récapitule la conformité du projet par rapport aux exigences du TP :

- [x] **Conteneurisation individuelle** Chaque service (PHP, Node.js, Python, MariaDB) possède son propre conteneur Docker isolé.

- [x] **Optimisation des images** : Utilisation de builds multi-étapes (*multi-stage builds*) pour minimiser la taille des images finales.

- [x] **Orchestration fonctionnelle** : Déploiement automatisé de l'ensemble de la stack via un fichier `docker-compose.yml` unique.

- [x] **Observabilité** : Implémentation de sondes de santé (*healthchecks*) et exposition de routes `/metrics` pour le monitoring.

