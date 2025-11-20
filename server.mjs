import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import numberManagerRouter from './api/numberManager.mjs';
import managementSuiteRouter from './api/managementSuite.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.VCR_PORT || 3000;
const HOST = process.env.VCR_HOST || "0.0.0.0";

// Create HTTP server for WebSocket support
const server = createServer(app);

// WebSocket server for logs
const wss = new WebSocketServer({ noServer: true });
const numberManagerClients = new Set();
const managementSuiteClients = new Set();

// Debug middleware to log all requests
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// WebSocket upgrade handler
server.on('upgrade', (request, socket, head) => {
    if (request.url === '/number-manager/ws/logs') {
        wss.handleUpgrade(request, socket, head, (ws) => {
            numberManagerClients.add(ws);

            console.log('Number Manager WebSocket client connected');
            ws.send(JSON.stringify({
                type: 'info',
                message: 'Connected to Number Manager logs',
                timestamp: new Date().toISOString()
            }));

            ws.on('close', () => {
                numberManagerClients.delete(ws);
                console.log('Number Manager WebSocket client disconnected');
            });

            ws.on('error', (error) => {
                console.error('WebSocket error:', error);
                numberManagerClients.delete(ws);
            });
        });
    } else if (request.url === '/management-suite/ws/logs') {
        wss.handleUpgrade(request, socket, head, (ws) => {
            managementSuiteClients.add(ws);

            console.log('Management Suite WebSocket client connected');
            ws.send(JSON.stringify({
                type: 'info',
                message: 'Connected to Management Suite logs',
                timestamp: new Date().toISOString()
            }));

            ws.on('close', () => {
                managementSuiteClients.delete(ws);
                console.log('Management Suite WebSocket client disconnected');
            });

            ws.on('error', (error) => {
                console.error('WebSocket error:', error);
                managementSuiteClients.delete(ws);
            });
        });
    } else {
        socket.destroy();
    }
});

// Broadcast function for Number Manager logs
export function broadcastNumberManagerLog(message, type = 'info') {
    const logMessage = JSON.stringify({
        type: type,
        message: message,
        timestamp: new Date().toISOString()
    });

    // Broadcast to both Number Manager and Management Suite clients
    // (since Management Suite uses the same Vonage client)
    const allClients = [...numberManagerClients, ...managementSuiteClients];
    allClients.forEach((client) => {
        if (client.readyState === 1) { // WebSocket.OPEN
            client.send(logMessage);
        }
    });
}

// API routes for Number Manager
app.use('/number-manager', numberManagerRouter);

// API routes for Management Suite
app.use('/management-suite', managementSuiteRouter);

// Serve static files from public directory
app.use(express.static('public', {
    extensions: ['html'],
    index: 'index.html'
}));

// Health check endpoint for VCR (required endpoint: /_/health)
app.get('/_/health', (req, res) => {
    console.log('Health check requested at /_/health');
    res.status(200).send('OK');
});

// Additional health endpoint for convenience
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'Romain Vonage Tools Hub',
        version: '1.2.0',
        tools: {
            'rakuten-report': 'Rakuten Security Report Builder',
            'report-filtering': 'Vonage Reports API Filter Tool',
            'number-manager': 'Vonage Numbers Manager',
            'management-suite': 'Vonage Management Suite'
        }
    });
});

// Start server
server.listen(PORT, HOST, () => {
    console.log(`🚀 Romain Vonage Tools Hub running on ${HOST}:${PORT}`);
    console.log(`📊 Access the application at http://${HOST}:${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 VCR Instance URL: ${process.env.VCR_INSTANCE_PUBLIC_URL || 'Not set'}`);
    console.log(`🏥 Health check available at: http://${HOST}:${PORT}/_/health`);
    console.log(`\n📌 Available Tools:`);
    console.log(`   - Landing Page: http://${HOST}:${PORT}/`);
    console.log(`   - Rakuten Report Builder: http://${HOST}:${PORT}/rakuten-report`);
    console.log(`   - Report Filtering Tool: http://${HOST}:${PORT}/report-filtering`);
    console.log(`   - Number Manager: http://${HOST}:${PORT}/number-manager`);
    console.log(`   - Management Suite: http://${HOST}:${PORT}/management-suite`);

    // Test the health endpoint internally
    setTimeout(() => {
        console.log('\n📋 Available routes:');
        app._router.stack.forEach((r) => {
            if (r.route && r.route.path) {
                console.log(`  ${Object.keys(r.route.methods)} ${r.route.path}`);
            }
        });
    }, 1000);
});
