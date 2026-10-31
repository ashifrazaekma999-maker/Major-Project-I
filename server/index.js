import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { store } from './dataStore.js';

import authRouter from './routes/auth.js';
import erpRouter from './routes/erp.js';
import intelligenceRouter from './routes/intelligence.js';
import aiRouter from './routes/ai.js';
import analyticsRouter from './routes/analytics.js';
import biometricRouter from './routes/biometric.js';
import networkRouter from './routes/network.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Officer-Id');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  const reqId = `REQ-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  res.setHeader('X-Request-Id', reqId);
  next();
});

app.use('/api/auth', authRouter);
app.use('/api/erp', erpRouter);
app.use('/api/intelligence', intelligenceRouter);
app.use('/api/ai', aiRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/biometric', biometricRouter);
app.use('/api/network', networkRouter);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'HEALTHY',
    service: 'NETRISH Command Server',
    version: '1.0.0',
    datasetLoaded: store.isLoaded,
    datasetMetadata: store.datasetMetadata,
    recordsCount: store.records.length,
    entitiesCount: store.entities.size,
    casesCount: store.cases.size,
    phonesCount: store.phones.size,
    vehiclesCount: store.vehicles.size,
    graphNodesCount: store.graph.size,
    auditEntries: store.auditTrail.length,
    uptime: process.uptime()
  });
});

const clientDistPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientDistPath));

app.get('/logo.png', (req, res) => {
  const localLogo = path.join(clientDistPath, 'logo.png');
  const sourceLogo = 'C:/Users/india/Downloads/NETRISH logo PNG.png';
  if (fs.existsSync(localLogo)) {
    res.sendFile(localLogo);
  } else if (fs.existsSync(sourceLogo)) {
    res.sendFile(sourceLogo);
  } else {
    res.status(404).send('Not found');
  }
});

app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Endpoint not found' });
  }
  const indexPath = path.join(clientDistPath, 'index.html');
  res.sendFile(indexPath);
});

// JSON parsing & general error handling middleware
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ success: false, error: 'Malformed JSON payload' });
  }
  console.error('Unhandled request error:', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

store.loadDataset();

function startServer(port) {
  const server = app.listen(port, () => {
    console.log(`\n=======================================================`);
    console.log(`NETRISH server running on http://localhost:${port}`);
    console.log(`Open http://localhost:${port} in your browser`);
    console.log(`=======================================================\n`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${port} is currently in use, trying port ${Number(port) + 1}...`);
      startServer(Number(port) + 1);
    } else {
      console.error('Server error:', err);
    }
  });
}

startServer(PORT);
