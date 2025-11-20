import express from 'express';
import { CredentialManager } from '../lib/credentials.mjs';
import { VonageNumbersClient } from '../lib/vonageClient.mjs';

const router = express.Router();

// Session storage for connected clients (in-memory for simplicity)
const sessions = new Map();

// Credential manager instance
const credentialManager = new CredentialManager();

/**
 * Helper function to get or create session
 */
function getSession(sessionId) {
    if (!sessions.has(sessionId)) {
        sessions.set(sessionId, {
            client: new VonageNumbersClient(),
            connected: false
        });
    }
    return sessions.get(sessionId);
}

/**
 * Load saved credentials
 */
router.get('/api/credentials/load', (req, res) => {
    try {
        const credentials = credentialManager.loadCredentials();
        const hasSaved = credentialManager.hasSavedCredentials();

        res.json({
            has_saved: hasSaved,
            credentials: hasSaved ? credentials : null
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to load credentials',
            message: error.message
        });
    }
});

/**
 * Save credentials
 */
router.post('/api/credentials/save', express.json(), (req, res) => {
    try {
        const { api_key, api_secret } = req.body;

        if (!api_key || !api_secret) {
            return res.status(400).json({
                error: 'Missing credentials',
                message: 'API key and secret are required'
            });
        }

        const success = credentialManager.saveCredentials(api_key, api_secret);

        if (success) {
            res.json({
                success: true,
                message: 'Credentials saved successfully'
            });
        } else {
            res.status(500).json({
                error: 'Failed to save credentials'
            });
        }
    } catch (error) {
        res.status(500).json({
            error: 'Failed to save credentials',
            message: error.message
        });
    }
});

/**
 * Delete saved credentials
 */
router.delete('/api/credentials', (req, res) => {
    try {
        const success = credentialManager.deleteCredentials();

        if (success) {
            res.json({
                success: true,
                message: 'Credentials deleted successfully'
            });
        } else {
            res.status(500).json({
                error: 'Failed to delete credentials'
            });
        }
    } catch (error) {
        res.status(500).json({
            error: 'Failed to delete credentials',
            message: error.message
        });
    }
});

/**
 * Connect to Vonage API
 */
router.post('/api/connect', express.json(), (req, res) => {
    try {
        const { api_key, api_secret, session_id } = req.body;

        if (!api_key || !api_secret) {
            return res.status(400).json({
                error: 'Missing credentials',
                message: 'API key and secret are required'
            });
        }

        const sessionId = session_id || 'default';
        const session = getSession(sessionId);

        const result = session.client.connect(api_key, api_secret);

        if (result.success) {
            session.connected = true;
            res.json({
                success: true,
                message: result.message,
                session_id: sessionId
            });
        } else {
            res.status(401).json({
                error: 'Connection failed',
                message: result.message
            });
        }
    } catch (error) {
        res.status(500).json({
            error: 'Connection failed',
            message: error.message
        });
    }
});

/**
 * Get account balance
 */
router.get('/api/account/balance', async (req, res) => {
    try {
        const sessionId = req.query.session_id || 'default';
        const session = getSession(sessionId);

        if (!session.connected) {
            return res.status(401).json({
                error: 'Not connected',
                message: 'Please connect to Vonage API first'
            });
        }

        const result = await session.client.getAccountBalance();
        res.json(result);
    } catch (error) {
        res.status(500).json({
            error: 'Failed to get balance',
            message: error.message
        });
    }
});

/**
 * List owned numbers
 */
router.get('/api/numbers/owned', async (req, res) => {
    try {
        const sessionId = req.query.session_id || 'default';
        const session = getSession(sessionId);

        if (!session.connected) {
            return res.status(401).json({
                error: 'Not connected',
                message: 'Please connect to Vonage API first'
            });
        }

        const result = await session.client.listOwnedNumbers();
        res.json(result);
    } catch (error) {
        res.status(500).json({
            error: 'Failed to list numbers',
            message: error.message
        });
    }
});

/**
 * Search available numbers
 */
router.post('/api/numbers/search', express.json(), async (req, res) => {
    try {
        const { country, pattern, features, type, session_id } = req.body;

        if (!country) {
            return res.status(400).json({
                error: 'Missing country code',
                message: 'Country code is required'
            });
        }

        const sessionId = session_id || 'default';
        const session = getSession(sessionId);

        if (!session.connected) {
            return res.status(401).json({
                error: 'Not connected',
                message: 'Please connect to Vonage API first'
            });
        }

        const result = await session.client.searchAvailableNumbers(country, pattern, features, type);
        res.json(result);
    } catch (error) {
        res.status(500).json({
            error: 'Failed to search numbers',
            message: error.message
        });
    }
});

/**
 * Buy a number
 */
router.post('/api/numbers/buy', express.json(), async (req, res) => {
    try {
        const { country, msisdn, target_api_key, session_id } = req.body;

        if (!country || !msisdn) {
            return res.status(400).json({
                error: 'Missing parameters',
                message: 'Country and MSISDN are required'
            });
        }

        const sessionId = session_id || 'default';
        const session = getSession(sessionId);

        if (!session.connected) {
            return res.status(401).json({
                error: 'Not connected',
                message: 'Please connect to Vonage API first'
            });
        }

        const result = await session.client.buyNumber(country, msisdn, target_api_key);
        res.json(result);
    } catch (error) {
        res.status(500).json({
            error: 'Failed to purchase number',
            message: error.message
        });
    }
});

/**
 * Cancel a number
 */
router.post('/api/numbers/cancel', express.json(), async (req, res) => {
    try {
        const { country, msisdn, target_api_key, session_id } = req.body;

        if (!country || !msisdn) {
            return res.status(400).json({
                error: 'Missing parameters',
                message: 'Country and MSISDN are required'
            });
        }

        const sessionId = session_id || 'default';
        const session = getSession(sessionId);

        if (!session.connected) {
            return res.status(401).json({
                error: 'Not connected',
                message: 'Please connect to Vonage API first'
            });
        }

        const result = await session.client.cancelNumber(country, msisdn, target_api_key);
        res.json(result);
    } catch (error) {
        res.status(500).json({
            error: 'Failed to cancel number',
            message: error.message
        });
    }
});

/**
 * Get subaccounts
 */
router.get('/api/subaccounts', async (req, res) => {
    try {
        const sessionId = req.query.session_id || 'default';
        const session = getSession(sessionId);

        if (!session.connected) {
            return res.status(401).json({
                error: 'Not connected',
                message: 'Please connect to Vonage API first'
            });
        }

        const result = await session.client.getSubaccounts();
        res.json(result);
    } catch (error) {
        res.status(500).json({
            error: 'Failed to get subaccounts',
            message: error.message
        });
    }
});

export default router;
