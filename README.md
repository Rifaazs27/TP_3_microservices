# Rapport de TP : Observabilité & Résilience

## Présentation du projet

Ce projet démontre la mise en place d'une stack d'observabilité complète afin de monitorer des microservices et garantir leur résilience en cas de panne.

L'objectif principal est de :

- tracer les requêtes entre plusieurs services,
- centraliser les logs,
- corréler logs et traces,
- protéger les services grâce à un Circuit Breaker,
- visualiser l'état global via Grafana.

---

# 1. Tracing Distribué (Jaeger) — 5 pts

Nous avons connecté nos services **Node.js** et **Python** à **Jaeger** afin de mettre en place du tracing distribué.

Cette approche permet de :

- suivre le parcours complet d'une requête,
- identifier les services traversés,
- mesurer le temps passé dans chaque étape,
- détecter rapidement les ralentissements ou erreurs.

Grâce à Jaeger, il est possible de visualiser l'enchaînement exact des appels entre les microservices.

<img width="1918" height="330" alt="image" src="https://github.com/user-attachments/assets/6e0a72e1-e9a0-4d66-94ff-0f2196ece206" />


- Ouvrir : `http://localhost:16686`
- Sélectionner le service : `api-rh`
- Cliquer sur **Find Traces**
- Prendre une capture affichant :
  - le service Node.js,
  - le service Python,
  - les deux spans visibles l'un sous l'autre.

---

# 2. Stack Loki & Corrélation — 3 pts + 3 pts

Les logs de l'application sont envoyés directement dans **Loki** puis visualisés via **Grafana**.

Le point essentiel de cette architecture est la **corrélation entre logs et traces**.

Chaque log contient un identifiant `trace_id` correspondant à une trace Jaeger.  
Cela permet :

- de retrouver instantanément la trace liée à une erreur,
- d'analyser précisément le contexte d'un incident,
- de naviguer facilement entre logs et tracing.

Cette approche améliore énormément le diagnostic des problèmes en environnement distribué.

<img width="1260" height="186" alt="image" src="https://github.com/user-attachments/assets/5d785d92-8485-432e-a5c6-a3802bedfbe0" />


# 3. Circuit Breaker (Opossum) — 4 pts

Afin d'éviter qu'une panne du service Python ne provoque un crash global de l'application, nous avons mis en place un **Circuit Breaker** avec la librairie **Opossum**.

Le fonctionnement est le suivant :

- si le service Python répond correctement → le circuit reste **CLOSED** ;
- si plusieurs erreurs consécutives surviennent → le circuit passe en **OPEN** ;
- les appels sont alors bloqués immédiatement afin d'éviter les timeouts ;
- une réponse de secours ("Mode dégradé") est renvoyée à l'utilisateur ;
- après un délai, le circuit tente une reconnexion en mode **HALF-OPEN** ;
- si le service redevient disponible → le circuit revient en **CLOSED**.

Cette stratégie améliore fortement la résilience de l'application.

<img width="947" height="155" alt="image" src="https://github.com/user-attachments/assets/2d9496a4-0eb8-4048-bdca-f25a3c2427dd" />

# 4. Chaos Test & Résilience — 3 pts

Afin de tester la robustesse du système, nous avons volontairement arrêté le service Python :

```bash
docker stop python_processor
```

## Résultats observés

Immédiatement :

- le dashboard Grafana détecte les erreurs,
- le taux de succès chute,
- les logs d'erreur apparaissent,
- le Circuit Breaker passe en état **OPEN**.

Une fois le service relancé :

```bash
docker start python_processor
```

le système se rétablit automatiquement :

1. passage en **HALF-OPEN**,
2. tests de reconnexion,
3. retour en **CLOSED**.

Cette démonstration prouve que l'architecture est capable de survivre à une panne sans interruption complète du service.

---

# 5. Dashboard Grafana — 2 pts

Nous avons conçu un dashboard Grafana basé entièrement sur **Loki** et **LogQL**.

L'objectif est de piloter toute l'application depuis une seule interface.

Le dashboard contient :

##  Flux de logs

Permet de suivre les événements applicatifs en temps réel.

## Volume de trafic

Mesure le nombre de requêtes traitées par l'application.

## Santé du Circuit

Affiche les erreurs et les changements d'état du Circuit Breaker.

## Taux de succès

Permet de suivre la stabilité globale du système.

<img width="1913" height="577" alt="image" src="https://github.com/user-attachments/assets/bf9b7202-c794-49b1-8fc4-3afbb7e402f1" />


# Conclusion & Argumentation — 4 pts

Cette architecture est robuste car elle ne se limite pas à enregistrer des erreurs : elle protège activement le système.

Les principaux avantages sont :

- visibilité complète grâce au tracing distribué,
- centralisation des logs avec Loki,
- corrélation immédiate entre logs et traces,
- tolérance aux pannes grâce au Circuit Breaker,
- supervision centralisée avec Grafana.

L'utilisation de **Loki** comme source de métriques via **LogQL** permet également :

- de réduire la complexité de l'infrastructure,
- d'éviter l'ajout d'une base de données supplémentaire,
- d'obtenir un dashboard léger, rapide et précis.

Cette solution représente une architecture moderne d'observabilité adaptée aux environnements microservices.

---

# 🛠️ Comment lancer le projet

## Démarrage des services

```bash
docker-compose up -d
```

## Générer du trafic

```bash
curl http://localhost:3000/chain
```

## Tester la résilience

Arrêter le service Python :

```bash
docker stop python_processor
```

Relancer le service :

```bash
docker start python_processor
```
