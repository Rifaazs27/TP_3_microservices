# SLO — Stack Microservices TP Jour 3

**Équipe :** MOUGAMMADOU ZACCARIA Zaafir
**Date :** 06/05/2026
**Stack :** Gateway + Users + Products

---

## 1. SLI définis (Service Level Indicators)

Les métriques que nous mesurons en temps réel :

| SLI           | Description                                           | Requête PromQL                                                                                 |
| ------------- | ----------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Disponibilité | % de requêtes HTTP sans erreur serveur (status < 500) | `1 - (sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m])))` |
| Latence       | % de requêtes répondant en moins de 200ms             | `histogram_quantile(0.99, sum(rate(http_duration_seconds_bucket[5m])) by (le, job))`           |

---

## 2. SLO définis (Service Level Objectives)

Nos objectifs internes sur 30 jours glissants :

| SLO           | Valeur cible | Justification                                                                                                                          |
| ------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| Disponibilité | ≥ 99,5%      | Ce seuil permet d'assurer un service fiable pour les utilisateurs, tout en nous laissant une petite marge pour faire des mises à jour. |
| Latence p99   | ≤ 200ms      | Une réponse sous les 200ms garantit une navigation fluide pour le client                                                               |

---

## 3. Calcul de l'Error Budget

### Disponibilité

```
Error Budget = 1 - SLO = 1 - 0.995 = 0.5%

Sur 30 jours :
30 jours × 24h × 60min = 43 200 minutes

Budget = 0.5% × 43 200 = 216 minutes d'indisponibilité tolérable/mois
       = 3 heures 36 minutes
```

### Latence

```
Budget latence = 0.5% des requêtes peuvent dépasser 200ms

Sur 1 000 requêtes → 5 requêtes peuvent être lentes
```

---

## 4. État actuel du budget

### Requête — Taux de disponibilité actuel

```
1 - (
  sum(rate(http_requests_total{status=~"5.."}[1h]))
  /
  sum(rate(http_requests_total[1h]))
)
```

**Résultat mesuré :** `0.4728583972383227`

---

### Requête — Latence p99 actuelle

```
histogram_quantile(
  0.99,
  sum(rate(http_duration_seconds_bucket[5m])) by (le, job)
)
```

**Résultat mesuré :** `0.00495`

---

## 5. Budget consommé ce mois-ci

| SLO           | Budget total | Consommé | Restant | Déploiements bloqués ? |
| ------------- | ------------ | -------- | ------- | ---------------------- |
| Disponibilité | 216 min      | 5 min    | 211 min | Non                    |
| Latence p99   | 0.5% des req | 0.1%     | 0.4%    | Non                    |

---

## 6. Règle de gel des déploiements

Si le budget restant passe sous 10% :

* ❌ Aucun nouveau déploiement
* ❌ Aucun changement de configuration
* ✅ Uniquement des correctifs de fiabilité
* ✅ Revue du code d'alerting

---

## 7. Capture d'écran du dashboard Grafana

<img width="1896" height="752" alt="image" src="https://github.com/user-attachments/assets/eec583ca-1e15-4b73-abd1-94e87fd55a39" />

---

## 8. Alertes configurées

| Alerte         | Seuil                | Severity | Receiver | Testée ? |
| -------------- | -------------------- | -------- | -------- | -------- |
| HighErrorRate  | > 5% pendant 2min    | critical | webhook  | ✅        |
| HighLatencyP99 | > 500ms pendant 5min | warning  | webhook  | ❌        |

**Preuve de test :**
L'alerte s'est bien déclenchée lors de la simulation d'erreurs 404/500.

Statut : Pending 
<img width="512" height="322" alt="image" src="https://github.com/user-attachments/assets/9fd121d9-1df0-4d28-88f8-75465efb32c6" />

Statut : Firing
<img width="512" height="356" alt="image" src="https://github.com/user-attachments/assets/eab1b3fd-d9a7-4b71-a59f-4f8c4d9dbee2" />

