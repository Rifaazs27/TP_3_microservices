const express = require('express');
const { register, trackRequest } = require('./instrumentation'); 
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

app.get('/slow', async (req, res) => {
  await new Promise(resolve => setTimeout(resolve, 600)); 
  res.json({ message: 'Réponse très lente...' });
});
app.listen(PORT, () => console.log(`Service RH lancé sur le port ${PORT}`));
