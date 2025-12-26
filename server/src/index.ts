/**
 * AURA Automate Server
 *
 * Provides:
 * - MCP Proxy (stdio → WebSocket)
 * - Webhook receiver
 * - Real API integrations
 */

import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { config } from 'dotenv';
import { MCPProxyServer } from './mcp/proxy.js';
import { WebhookServer } from './webhooks/server.js';

config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Start HTTP server
const server = app.listen(PORT, () => {
  console.log(`✅ AURA Server running on port ${PORT}`);
});

// WebSocket server for MCP proxy
const wss = new WebSocketServer({
  server,
  path: '/mcp'
});

const mcpProxy = new MCPProxyServer(wss);
await mcpProxy.initialize();

// Webhook server
const webhookServer = new WebhookServer(app);
await webhookServer.initialize();

console.log(`✅ MCP Proxy running on ws://localhost:${PORT}/mcp`);
console.log(`✅ Webhooks available at http://localhost:${PORT}/webhooks/*`);

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  await mcpProxy.shutdown();
  server.close();
  process.exit(0);
});
