#!/bin/bash

echo "--- 1. Vérification de la stack ---"
curl -s http://localhost:3000/health | grep "UP" || exit 1
echo "--- 2. Génération de trafic initial ---"
for i in {1..5}; do curl -s http://localhost:3000/chain && echo ""; done
echo "--- 3. INTERRUPTION : Arrêt du service Python ---"
docker stop python_processor [cite: 100]
echo "--- 4. Observation du comportement (Circuit Breaker) ---"

for i in {1..10}; do 
  curl -s http://localhost:3000/chain
  sleep 0.5
done

echo "--- 5. RÉTABLISSEMENT : Redémarrage du service Python ---"
docker start python_processor [cite: 102]
echo "--- 6. Test de retour à la normale ---"
sleep 5
curl -s http://localhost:3000/chain [cite: 103]
