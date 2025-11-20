import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.VCR_PORT || 3000;
const HOST = process.env.VCR_HOST || "0.0.0.0";

// Debug middleware to log all requests
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Serve static files from public directory
app.use(express.static('public'));

// Route for the landing page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Routes for individual tools
app.get('/rakuten-report', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'rakuten-report', 'index.html'));
});

app.get('/report-filtering', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'report-filtering', 'index.html'));
});

app.get('/number-manager', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'number-manager', 'index.html'));
});

app.get('/management-suite', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'management-suite', 'index.html'));
});

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
        version: '1.0.0',
        tools: {
            'rakuten-report': 'Rakuten Security Report Builder',
            'report-filtering': 'Vonage Reports API Filter Tool',
            'number-manager': 'Vonage Numbers Manager',
            'management-suite': 'Vonage Management Suite'
        }
    });
});

// Start server
app.listen(PORT, HOST, () => {
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
