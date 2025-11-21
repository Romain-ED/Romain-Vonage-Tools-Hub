import { Auth } from '@vonage/auth';
import { Vonage } from '@vonage/server-sdk';
import { CredentialManager } from '../lib/credentials.mjs';

// Store active Vonage clients per session
const sessions = new Map();
const credentialManager = new CredentialManager();

export function setupApiTestingRoutes(app) {
    const prefix = '/api-testing/api';

    // Load saved credentials
    app.get(`${prefix}/credentials/load`, (req, res) => {
        try {
            const credentials = credentialManager.loadCredentials();
            if (credentials.api_key && credentials.api_secret) {
                res.json({
                    success: true,
                    credentials: credentials
                });
            } else {
                res.json({
                    success: false,
                    message: 'No saved credentials found'
                });
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    });

    // Save credentials
    app.post(`${prefix}/credentials/save`, (req, res) => {
        try {
            const { api_key, api_secret } = req.body;

            if (!api_key || !api_secret) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing API key or secret'
                });
            }

            const result = credentialManager.saveCredentials(api_key, api_secret);
            if (result) {
                res.json({
                    success: true,
                    message: 'Credentials saved successfully'
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Failed to save credentials'
                });
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    });

    // Delete saved credentials
    app.delete(`${prefix}/credentials`, (req, res) => {
        try {
            const result = credentialManager.deleteCredentials();
            if (result) {
                res.json({
                    success: true,
                    message: 'Credentials deleted successfully'
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Failed to delete credentials'
                });
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    });

    // Connect with credentials
    app.post(`${prefix}/connect`, async (req, res) => {
        try {
            const { api_key, api_secret, session_id = 'default' } = req.body;

            if (!api_key || !api_secret) {
                return res.status(400).json({ error: 'API key and secret are required' });
            }

            const credentials = new Auth({ apiKey: api_key, apiSecret: api_secret });
            const vonage = new Vonage(credentials);

            sessions.set(session_id, { vonage, credentials, api_key });

            res.json({
                success: true,
                message: 'Connected to Vonage API',
                api_key: api_key.substring(0, 8) + '...'
            });
        } catch (error) {
            console.error('Connect error:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // Get account balance
    app.get(`${prefix}/account/balance`, async (req, res) => {
        try {
            const { session_id = 'default' } = req.query;
            const session = sessions.get(session_id);

            if (!session) {
                return res.status(401).json({ error: 'Not connected. Please connect first.' });
            }

            const balance = await session.vonage.accounts.getBalance();

            res.json({
                success: true,
                balance: parseFloat(balance.value).toFixed(2),
                autoReload: balance.autoReload
            });
        } catch (error) {
            console.error('Balance error:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // Get owned numbers
    app.get(`${prefix}/numbers/owned`, async (req, res) => {
        try {
            const { session_id = 'default' } = req.query;
            const session = sessions.get(session_id);

            if (!session) {
                return res.status(401).json({ error: 'Not connected. Please connect first.' });
            }

            const result = await session.vonage.numbers.getOwnedNumbers();

            res.json({
                success: true,
                count: result.count || 0,
                numbers: result.numbers || []
            });
        } catch (error) {
            console.error('List numbers error:', error);
            res.status(500).json({
                success: false,
                error: error.message,
                numbers: []
            });
        }
    });

    // Send SMS
    app.post(`${prefix}/sms/send`, async (req, res) => {
        try {
            const { from, to, text, session_id = 'default' } = req.body;
            const session = sessions.get(session_id);

            if (!session) {
                return res.status(401).json({ error: 'Not connected. Please connect first.' });
            }

            const response = await session.vonage.sms.send({
                from,
                to,
                text
            });

            res.json({
                success: true,
                request: { from, to, text },
                response: response
            });
        } catch (error) {
            console.error('SMS send error:', error);
            res.status(500).json({
                success: false,
                error: error.message,
                details: error
            });
        }
    });

    // Send WhatsApp message
    app.post(`${prefix}/whatsapp/send`, async (req, res) => {
        try {
            const { from, to, text, session_id = 'default' } = req.body;
            const session = sessions.get(session_id);

            if (!session) {
                return res.status(401).json({ error: 'Not connected. Please connect first.' });
            }

            const response = await session.vonage.messages.send({
                message_type: 'text',
                channel: 'whatsapp',
                to,
                from,
                text
            });

            res.json({
                success: true,
                request: { from, to, text, channel: 'whatsapp' },
                response: response
            });
        } catch (error) {
            console.error('WhatsApp send error:', error);
            res.status(500).json({
                success: false,
                error: error.message,
                details: error
            });
        }
    });

    // Start Verify request
    app.post(`${prefix}/verify/start`, async (req, res) => {
        try {
            const { number, brand, session_id = 'default' } = req.body;
            const session = sessions.get(session_id);

            if (!session) {
                return res.status(401).json({ error: 'Not connected. Please connect first.' });
            }

            const response = await session.vonage.verify.start({
                number,
                brand: brand || 'Vonage'
            });

            res.json({
                success: true,
                request: { number, brand },
                response: response
            });
        } catch (error) {
            console.error('Verify start error:', error);
            res.status(500).json({
                success: false,
                error: error.message,
                details: error
            });
        }
    });

    // Check Verify code
    app.post(`${prefix}/verify/check`, async (req, res) => {
        try {
            const { request_id, code, session_id = 'default' } = req.body;
            const session = sessions.get(session_id);

            if (!session) {
                return res.status(401).json({ error: 'Not connected. Please connect first.' });
            }

            const response = await session.vonage.verify.check(request_id, code);

            res.json({
                success: true,
                request: { request_id, code },
                response: response
            });
        } catch (error) {
            console.error('Verify check error:', error);
            res.status(500).json({
                success: false,
                error: error.message,
                details: error
            });
        }
    });

    // Cancel Verify request
    app.post(`${prefix}/verify/cancel`, async (req, res) => {
        try {
            const { request_id, session_id = 'default' } = req.body;
            const session = sessions.get(session_id);

            if (!session) {
                return res.status(401).json({ error: 'Not connected. Please connect first.' });
            }

            const response = await session.vonage.verify.control({
                request_id,
                cmd: 'cancel'
            });

            res.json({
                success: true,
                request: { request_id, cmd: 'cancel' },
                response: response
            });
        } catch (error) {
            console.error('Verify cancel error:', error);
            res.status(500).json({
                success: false,
                error: error.message,
                details: error
            });
        }
    });

    // Make TTS call
    app.post(`${prefix}/voice/tts`, async (req, res) => {
        try {
            const { to, text, session_id = 'default' } = req.body;
            const session = sessions.get(session_id);

            if (!session) {
                return res.status(401).json({ error: 'Not connected. Please connect first.' });
            }

            const response = await session.vonage.voice.createOutboundCall({
                to: [{ type: 'phone', number: to }],
                from: { type: 'phone', number: '14157386102' }, // Vonage test number
                ncco: [{
                    action: 'talk',
                    text: text
                }]
            });

            res.json({
                success: true,
                request: { to, text },
                response: response
            });
        } catch (error) {
            console.error('Voice TTS error:', error);
            res.status(500).json({
                success: false,
                error: error.message,
                details: error
            });
        }
    });

    // Number Insight - Basic
    app.post(`${prefix}/insight/basic`, async (req, res) => {
        try {
            const { number, session_id = 'default' } = req.body;
            const session = sessions.get(session_id);

            if (!session) {
                return res.status(401).json({ error: 'Not connected. Please connect first.' });
            }

            const response = await session.vonage.numberInsight.get({
                level: 'basic',
                number
            });

            res.json({
                success: true,
                request: { number, level: 'basic' },
                response: response
            });
        } catch (error) {
            console.error('Number Insight error:', error);
            res.status(500).json({
                success: false,
                error: error.message,
                details: error
            });
        }
    });

    // Number Insight - Standard
    app.post(`${prefix}/insight/standard`, async (req, res) => {
        try {
            const { number, session_id = 'default' } = req.body;
            const session = sessions.get(session_id);

            if (!session) {
                return res.status(401).json({ error: 'Not connected. Please connect first.' });
            }

            const response = await session.vonage.numberInsight.get({
                level: 'standard',
                number
            });

            res.json({
                success: true,
                request: { number, level: 'standard' },
                response: response
            });
        } catch (error) {
            console.error('Number Insight error:', error);
            res.status(500).json({
                success: false,
                error: error.message,
                details: error
            });
        }
    });

    console.log('API Testing routes registered');
}
