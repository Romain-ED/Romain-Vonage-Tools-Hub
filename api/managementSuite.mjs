/**
 * Management Suite API Routes
 * Combines Number Manager + Subaccount Management functionality
 */

import express from 'express';
import { CredentialManager } from '../lib/credentials.mjs';
import { VonageNumbersClient } from '../lib/vonageClient.mjs';
import { broadcastNumberManagerLog } from '../server.mjs';

const router = express.Router();
const credentialManager = new CredentialManager();

// Store client instances per session
const sessionClients = new Map();

/**
 * Get or create client for session
 */
function getClientForSession(sessionId) {
    if (!sessionClients.has(sessionId)) {
        sessionClients.set(sessionId, new VonageNumbersClient());
    }
    return sessionClients.get(sessionId);
}

/**
 * Broadcast log message
 */
function log(message, type = 'info') {
    console.log(`[${type.toUpperCase()}] ${message}`);
    broadcastNumberManagerLog(message, type);
}

// ============================================================================
// CREDENTIALS MANAGEMENT
// ============================================================================

/**
 * Load saved credentials
 */
router.get('/api/credentials/load', (req, res) => {
    try {
        const result = credentialManager.loadCredentials();
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * Save credentials
 */
router.post('/api/credentials/save', (req, res) => {
    try {
        const { api_key, api_secret } = req.body;

        if (!api_key || !api_secret) {
            return res.status(400).json({
                success: false,
                message: 'Missing API key or secret'
            });
        }

        const result = credentialManager.saveCredentials(api_key, api_secret);
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * Delete saved credentials
 */
router.delete('/api/credentials', (req, res) => {
    try {
        const result = credentialManager.deleteCredentials();
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// ============================================================================
// CONNECTION
// ============================================================================

/**
 * Connect to Vonage API
 */
router.post('/api/connect', (req, res) => {
    try {
        const { api_key, api_secret, session_id = 'default' } = req.body;

        if (!api_key || !api_secret) {
            return res.status(400).json({
                success: false,
                message: 'Missing API key or secret'
            });
        }

        const client = getClientForSession(session_id);
        log('Attempting to connect to Vonage API...', 'info');

        const result = client.connect(api_key, api_secret);

        if (result.success) {
            log('Connected successfully to Vonage API', 'success');
        } else {
            log(`Connection failed: ${result.message}`, 'error');
        }

        res.json(result);
    } catch (error) {
        log(`Connection error: ${error.message}`, 'error');
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// ============================================================================
// ACCOUNT MANAGEMENT
// ============================================================================

/**
 * Get account balance (master account)
 */
router.get('/api/account/balance', async (req, res) => {
    try {
        const sessionId = req.query.session_id || 'default';
        const client = getClientForSession(sessionId);

        if (!client.isConnected()) {
            return res.status(401).json({
                success: false,
                message: 'Not connected to Vonage API'
            });
        }

        log('Fetching account balance...', 'info');
        const result = await client.getAccountBalance();

        if (result.success) {
            log(`Account balance: ${result.balance}`, 'success');
        } else {
            log(`Failed to get balance: ${result.message}`, 'error');
        }

        res.json(result);
    } catch (error) {
        log(`Balance error: ${error.message}`, 'error');
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// ============================================================================
// NUMBERS MANAGEMENT
// ============================================================================

/**
 * List owned numbers
 */
router.get('/api/numbers/owned', async (req, res) => {
    try {
        const sessionId = req.query.session_id || 'default';
        const client = getClientForSession(sessionId);

        if (!client.isConnected()) {
            return res.status(401).json({
                success: false,
                message: 'Not connected to Vonage API'
            });
        }

        log('Fetching owned numbers...', 'info');
        const result = await client.listOwnedNumbers();

        if (result.success) {
            log(`Found ${result.count} owned numbers`, 'success');
        } else {
            log(`Failed to list numbers: ${result.message}`, 'error');
        }

        res.json(result);
    } catch (error) {
        log(`Numbers list error: ${error.message}`, 'error');
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * Search available numbers
 */
router.post('/api/numbers/search', async (req, res) => {
    try {
        const { country, pattern, features, type, session_id = 'default' } = req.body;
        const client = getClientForSession(session_id);

        if (!client.isConnected()) {
            return res.status(401).json({
                success: false,
                message: 'Not connected to Vonage API'
            });
        }

        if (!country) {
            return res.status(400).json({
                success: false,
                message: 'Country code is required'
            });
        }

        log(`Searching for numbers in ${country}...`, 'info');
        const result = await client.searchAvailableNumbers(country, pattern, features, type);

        if (result.success) {
            log(`Found ${result.count} available numbers`, 'success');
        } else {
            log(`Search failed: ${result.message}`, 'error');
        }

        res.json(result);
    } catch (error) {
        log(`Search error: ${error.message}`, 'error');
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * Buy a number
 */
router.post('/api/numbers/buy', async (req, res) => {
    try {
        const { country, msisdn, target_api_key, session_id = 'default' } = req.body;
        const client = getClientForSession(session_id);

        if (!client.isConnected()) {
            return res.status(401).json({
                success: false,
                message: 'Not connected to Vonage API'
            });
        }

        if (!country || !msisdn) {
            return res.status(400).json({
                success: false,
                message: 'Country and MSISDN are required'
            });
        }

        log(`Purchasing number ${msisdn}...`, 'info');
        const result = await client.buyNumber(country, msisdn, target_api_key);

        if (result.success) {
            log(`Successfully purchased ${msisdn}`, 'success');
        } else {
            log(`Purchase failed: ${result.message}`, 'error');
        }

        res.json(result);
    } catch (error) {
        log(`Purchase error: ${error.message}`, 'error');
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * Cancel a number
 */
router.post('/api/numbers/cancel', async (req, res) => {
    try {
        const { country, msisdn, target_api_key, session_id = 'default' } = req.body;
        const client = getClientForSession(session_id);

        if (!client.isConnected()) {
            return res.status(401).json({
                success: false,
                message: 'Not connected to Vonage API'
            });
        }

        if (!country || !msisdn) {
            return res.status(400).json({
                success: false,
                message: 'Country and MSISDN are required'
            });
        }

        log(`Cancelling number ${msisdn}...`, 'warning');
        const result = await client.cancelNumber(country, msisdn, target_api_key);

        if (result.success) {
            log(`Successfully cancelled ${msisdn}`, 'success');
        } else {
            log(`Cancellation failed: ${result.message}`, 'error');
        }

        res.json(result);
    } catch (error) {
        log(`Cancellation error: ${error.message}`, 'error');
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// ============================================================================
// SUBACCOUNTS MANAGEMENT
// ============================================================================

/**
 * List all subaccounts
 */
router.get('/api/subaccounts', async (req, res) => {
    try {
        const sessionId = req.query.session_id || 'default';
        const client = getClientForSession(sessionId);

        if (!client.isConnected()) {
            return res.status(401).json({
                success: false,
                message: 'Not connected to Vonage API'
            });
        }

        log('Fetching subaccounts...', 'info');
        const result = await client.getSubaccounts();

        if (result.success) {
            log(`Found ${result.subaccounts.length} subaccounts`, 'success');
        } else {
            log(`Failed to get subaccounts: ${result.message}`, 'error');
        }

        res.json(result);
    } catch (error) {
        log(`Subaccounts error: ${error.message}`, 'error');
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * Create a new subaccount
 */
router.post('/api/subaccounts/create', async (req, res) => {
    try {
        const { name, secret, use_primary_balance = true, session_id = 'default' } = req.body;
        const client = getClientForSession(session_id);

        if (!client.isConnected()) {
            return res.status(401).json({
                success: false,
                message: 'Not connected to Vonage API'
            });
        }

        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Subaccount name is required'
            });
        }

        log(`Creating subaccount: ${name}...`, 'info');
        const result = await client.createSubaccount(name, secret, use_primary_balance);

        if (result.success) {
            log(`Successfully created subaccount: ${name}`, 'success');
        } else {
            log(`Failed to create subaccount: ${result.message}`, 'error');
        }

        res.json(result);
    } catch (error) {
        log(`Create subaccount error: ${error.message}`, 'error');
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * Get balance for a specific account (master or subaccount)
 */
router.get('/api/subaccounts/balance/:apiKey', async (req, res) => {
    try {
        const { apiKey } = req.params;
        const sessionId = req.query.session_id || 'default';
        const client = getClientForSession(sessionId);

        if (!client.isConnected()) {
            return res.status(401).json({
                success: false,
                message: 'Not connected to Vonage API'
            });
        }

        log(`Fetching balance for account ${apiKey}...`, 'info');
        const result = await client.getAccountBalanceByKey(apiKey);

        if (result.success) {
            log(`Account ${apiKey} balance: ${result.balance}`, 'success');
        } else {
            log(`Failed to get balance: ${result.message}`, 'error');
        }

        res.json(result);
    } catch (error) {
        log(`Balance error: ${error.message}`, 'error');
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * Transfer credit between accounts
 */
router.post('/api/subaccounts/transfer', async (req, res) => {
    try {
        const { from, to, amount, reference, session_id = 'default' } = req.body;
        const client = getClientForSession(session_id);

        if (!client.isConnected()) {
            return res.status(401).json({
                success: false,
                message: 'Not connected to Vonage API'
            });
        }

        if (!from || !to || !amount) {
            return res.status(400).json({
                success: false,
                message: 'From account, to account, and amount are required'
            });
        }

        if (isNaN(amount) || parseFloat(amount) <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Amount must be a positive number'
            });
        }

        log(`Transferring ${amount} credits from ${from} to ${to}...`, 'info');
        const result = await client.transferCredit(from, to, parseFloat(amount), reference);

        if (result.success) {
            log(`Successfully transferred ${amount} credits`, 'success');
        } else {
            log(`Transfer failed: ${result.message}`, 'error');
        }

        res.json(result);
    } catch (error) {
        log(`Transfer error: ${error.message}`, 'error');
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

export default router;
