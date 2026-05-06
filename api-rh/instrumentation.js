/**
 * instrumentation.js — Middleware Prometheus pour Express
 * 
 * Copiez ce fichier dans chaque service, puis dans index.js :
 *   const { register, trackRequest } = require('./instrumentation');
 *   app.use(trackRequest);
 *   app.get('/metrics', async (req, res) => {
 *     res.set('Content-Type', register.contentType);
 *     res.end(await register.metrics());
 *   });
 */

const client = require('prom-client');

// Registre Prometheus — collecte aussi les métriques Node.js par défaut
// (mémoire, CPU, event loop lag, etc.)
const register = new client.Registry();
client.collectDefaultMetrics({ register });

// ── Counter : nombre total de requêtes HTTP ─────────────────
const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests received',
  labelNames: ['method', 'path', 'status'],
  registers: [register]
});

// ── Histogram : durée des requêtes HTTP ─────────────────────
// Les buckets définissent les seuils de mesure en secondes
const httpDurationSeconds = new client.Histogram({
  name: 'http_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'path', 'status'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [register]
});

// ── Gauge : requêtes en cours ────────────────────────────────
const httpRequestsInFlight = new client.Gauge({
  name: 'http_requests_in_flight',
  help: 'Number of HTTP requests currently being processed',
  registers: [register]
});

/**
 * Middleware Express — à brancher sur app.use() avant les routes
 */
const trackRequest = (req, res, next) => {
  // Ne pas tracker /metrics lui-même (évite la récursion)
  if (req.path === '/metrics') return next();

  httpRequestsInFlight.inc();
  const end = httpDurationSeconds.startTimer({ method: req.method, path: req.path });

  res.on('finish', () => {
    httpRequestsTotal.inc({ method: req.method, path: req.path, status: res.statusCode });
    end({ status: res.statusCode });
    httpRequestsInFlight.dec();
  });

  next();
};

module.exports = { register, trackRequest, httpRequestsTotal, httpDurationSeconds };
