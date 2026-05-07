# SLO Avancé — TP Jour 4
**M2 DevOps — SUP DE VINCI**

| Équipe | [Prénom Nom] / [Prénom Nom] |
|--------|----------------------------|
| Date   | [Date]                     |
| SLO cible | Disponibilité ≥ 99.5% sur fenêtre glissante 30 jours |

---

## Section 1 — SLI / SLO

| SLI              | PromQL                                                                 | Valeur mesurée |
|------------------|------------------------------------------------------------------------|----------------|
| Disponibilité    | `1 - (sum(increase(http_requests_total{status=~"5.."}[1h])) / sum(increase(http_requests_total[1h])))` | 0.00812006233578446 |
| Latence p99      | `histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))` | 0.00495 |
| Taux de succès commandes | `sum(rate(orders_total{status="success"}[5m])) / sum(rate(orders_total[5m]))` | 0.9278350515463918 |
| Commandes/min    | `rate(orders_total[5m]) * 60`                                          | 20.24 |




### Objectifs SLO définis

| SLO | Cible | Fenêtre |
|-----|-------|---------|
| Disponibilité HTTP | 99.5% | 30 jours glissants |
| Latence p99 | < 500ms | 5 minutes |
| Taux de succès commandes | > 98% | 1 heure |

---

## Section 2 — Error Budget en temps réel

### Requête PromQL — Budget restant

```promql
1 - (
  sum(increase(http_requests_total{status=~"5.."}[30d]))
  / sum(increase(http_requests_total[30d]))
) / 0.005
```

**Résultats obtenus :**

| Métrique | Valeur |
|----------|--------|
| Error budget total (30j) | 0.5% des requêtes autorisées en erreur |
| Budget consommé | 143.2% |
| Budget restant | -43.2% |
| Déploiements bloqués | oui |

### Interprétation

> [Expliquez ici l'état de votre error budget : est-il en bonne santé ?
Non, l'error budget n'est pas en bonne santé car il est complètement épuisé et en négatif (-43.2%).

> Y a-t-il des événements qui l'ont fortement consommé ?]
Oui, il a été fortement consommé par nos tests manuels qui ont généré volontairement des erreurs 500 pour déclencher les alertes.

---

## Section 3 — Analyse des traces Jaeger

### Capture d'écran

> <img width="1917" height="666" alt="Capture d&#39;écran 2026-05-07 100412" src="https://github.com/user-attachments/assets/6ade5636-1679-4fb5-82c2-27f3441d5539" />


### Analyse

| Question | Réponse |
|----------|---------|
| Durée totale de la trace la plus longue observée | 4.31 ms |
| Service introduisant le plus de latence | api-rh |
| Structure des appels | Séquentiel |

### Détail de la chaîne d'appels observée

```
gateway (Xms)
  └── users (Xms)
       └── database query (Xms)
  └── products (Xms)
```

> [Décrivez les spans observés et leur contribution à la latence totale]
La trace montre que l'API (api-rh) appelle le service Python (data-processor). L'opération prend 4.31 ms au total. Le service Python répond assez vite (876 µs), la majorité de l'attente vient donc simplement du temps de connexion réseau entre les deux services.

---

## Section 4 — Alertes Burn Rate déclenchées

### Test de déclenchement

Commande utilisée pour générer des erreurs :
```bash
for i in $(seq 1 200); do
  curl -s http://localhost:3000/endpoint-inexistant > /dev/null
  sleep 0.05
done
```

| Alerte | Déclenchée ? | Délai de déclenchement | Burn rate mesuré |
|--------|-------------|------------------------|------------------|
| SLOBurnRateCritical | non | [X] min | [VALEUR]x |
| SLOBurnRateWarning  | oui | 1 min | 12.2x |

<img width="928" height="731" alt="Capture d&#39;écran 2026-05-07 101529" src="https://github.com/user-attachments/assets/dae2062e-0948-4e66-b4ee-1d055b7f164b" />


---

## Section 5 — Dashboard Grafana

### Panels implémentés

- [ OK  ] Panel 1 — Error Budget restant (Stat, seuils vert/orange/rouge)
- [ OK ] Panel 2 — Burn Rate 1h (Time series, ligne de seuil à 14.4)
- [ OK ] Panel 3 — Commandes par minute (Time series)
- [ OK ] Panel 4 — Panier moyen (Stat, unité €)
- [ OK ] Panel 5 — Lien Jaeger (Text)

> <img width="1890" height="718" alt="Capture d&#39;écran 2026-05-07 093802" src="https://github.com/user-attachments/assets/1f1867a2-633c-4b5d-b143-75112a17dfeb" />


---

## Section 6 — Métriques métier (Custom Metrics)

### Métriques instrumentées

| Métrique | Type | Description | Labels |
|----------|------|-------------|--------|
| `orders_total` | Counter | Nombre total de commandes | `status`, `payment_method` |
| `order_value_euros` | Histogram | Valeur des commandes en € | — |
| `cart_items_active` | Gauge | Articles dans paniers actifs | — |
| `payment_processing_duration_seconds` | Summary | Durée traitement paiement | — |

### Valeurs observées (PromQL)

```promql
# Commandes par minute
rate(orders_total[5m]) * 60
# Résultat : 20.24

# Taux de succès
sum(rate(orders_total{status="success"}[5m])) / sum(rate(orders_total[5m]))
# Résultat : 0.92

# Panier moyen
rate(order_value_euros_sum[5m]) / rate(order_value_euros_count[5m])
# Résultat : 77.3 €

# Percentile 95 valeur commandes
histogram_quantile(0.95, rate(order_value_euros_bucket[5m]))
# Résultat : 182.1 €
```

---

## Section 7 — Bilan & Rétrospective

### Ce qui a bien fonctionné

> La création du dashboard Grafana pour surveiller l'Error Budget en temps réel a très bien fonctionné. J'ai également réussi à lier les services avec Jaeger et à observer la propagation des traces entre l'api et le service Python sans problème.

### Difficultés rencontrées

> > La compréhension et le déclenchement des alertes Prometheus ont été plus compliquées. Par exemple, lors de mes tests de charge, j'ai réalisé que générer des erreurs 404 ne faisait pas baisser l'Error Budget. Il a fallu adapter le scripts pour cibler de vraies erreurs 500 afin que les alertes de Burn Rate passent au moins au orange. 

### Améliorations possibles en production

> [Ex : stockage Elasticsearch pour Jaeger, sampling adaptatif, dashboards
> plus granulaires par service, SLO par endpoint...]

---

*TP Jour 4 — M2 DevOps SUP DE VINCI*
