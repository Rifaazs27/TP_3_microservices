require('./tracing');
const http = require('http');
const express = require('express');
const { register, trackRequest, ordersTotal, orderValueEuros } = require('./instrumentation');
const { trace } = require('@opentelemetry/api');
const winston = require('winston');
const LokiTransport = require('winston-loki');
const CircuitBreaker = require('opossum');
const app = express();
const PORT = 3000;
const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service_name: 'api-rh' },
  transports: [
    new winston.transports.Console(),
    new LokiTransport({
      host: 'http://loki:3100',
      labels: { app: 'api-rh' },
      json: true
    })
  ]
});

const fetchPythonData = () => {
  return new Promise((resolve, reject) => {
    http.get('http://python_processor:5000/health', (resp) => {
      let data = '';
      if (resp.statusCode !== 200) return reject(new Error("Service Python Error"));
      resp.on('data', (chunk) => { data += chunk; });
      resp.on('end', () => resolve(JSON.parse(data)));
    }).on("error", reject);
  });
};

const breaker = new CircuitBreaker(fetchPythonData, {
  timeout: 3000, [cite: 81]
  errorThresholdPercentage: 50, [cite: 86]
  resetTimeout: 10000
});

breaker.on('open', () => logger.warn("CIRCUIT BREAKER: OPEN (Panne détectée)")); [cite: 87]
breaker.on('halfOpen', () => logger.info("CIRCUIT BREAKER: HALF-OPEN (Test de récupération)")); [cite: 87]
breaker.on('close', () => logger.info("CIRCUIT BREAKER: CLOSED (Service rétabli)")); [cite: 87]

breaker.fallback(() => ({ 
  message: "Service Python momentanément indisponible", 
  status: "DEGRADED_MODE" 
})); [cite: 83]

app.use(trackRequest);

// --- ROUTES ---

app.get('/health', (req, res) => {
    res.status(200).json({ status: "UP", service: "api-rh", timestamp: new Date() });
});
app.get('/metrics', async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
});

app.get('/chain', async (req, res) => {
  const span = trace.getSpan(trace.getActiveContext());
  const traceId = span ? span.spanContext().traceId : 'none'; [cite: 66]
  const spanId = span ? span.spanContext().spanId : 'none'; [cite: 67]
  logger.info("Appel du service Python via Circuit Breaker", { 
    trace_id: traceId, 
    span_id: spanId 
  }); [cite: 65]
  try {
    const data = await breaker.fire(); [cite: 80]
    res.json({
      message: "Chaîne de microservices réussie !",
      etape_1: "api-rh (Node.js)",
      etape_2: data
    });
  } catch (err) {
    res.status(500).json({ erreur: "Erreur critique", details: err.message });
  }
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

app.get('/', (req, res) => res.send("L'API RH est fonctionnelle"));
app.listen(PORT, () => console.log(`Service RH lancé sur le port ${PORT}`));
