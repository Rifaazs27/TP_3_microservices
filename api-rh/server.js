require('./tracing');
const http = require('http');
const express = require('express');
const { register, trackRequest, ordersTotal, orderValueEuros } = require('./instrumentation');
const app = express();
const PORT = 3000;

app.use(trackRequest);

app.get('/health', (req, res) => {
    res.status(200).json({ status: "UP", service: "api-rh", timestamp: new Date() });
});

app.get('/metrics', async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
});

app.get('/', (req, res) => res.send("L'API RH est fonctionnelle"));

app.get('/chain', (req, res) => {
     http.get('http://python_processor:5000/health', (resp) => {
       let data = '';
       resp.on('data', (chunk) => { data += chunk; });
       resp.on('end', () => {
         res.json({
           message: "Chaîne de microservices réussie !",
           etape_1: "api-rh (Node.js)",
           etape_2: JSON.parse(data)
         });
       });
     }).on("error", (err) => {
       res.status(500).json({ erreur: "Impossible de joindre le service Python", details: err.message });
     });
});

app.get('/simulate-order', (req, res) => {
  const total = Math.floor(Math.random() * 145) + 5;
  const methods = ['credit_card', 'paypal', 'crypto'];
  const payment_method = methods[Math.floor(Math.random() * methods.length)];
  const isSuccess = Math.random() > 0.1;

  if (isSuccess) {
    ordersTotal.inc({ status: 'success', payment_method });
    orderValueEuros.observe(total);
    res.status(201).json({ message: "Commande réussie !", montant: total, paiement: payment_method });
  } else {
    ordersTotal.inc({ status: 'failed', payment_method });
    res.status(500).json({ erreur: "Échec du paiement", paiement: payment_method });
  }
});

app.listen(PORT, () => console.log(`Service RH lancé sur le port ${PORT}`));
