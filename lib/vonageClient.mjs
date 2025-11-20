import { Auth } from '@vonage/auth';
import { Vonage } from '@vonage/server-sdk';

/**
 * Vonage Numbers API Client
 * Handles all Vonage Numbers API interactions
 */
export class VonageNumbersClient {
    constructor() {
        this.vonage = null;
        this.apiKey = null;
        this.apiSecret = null;
    }

    /**
     * Initialize Vonage client with credentials
     */
    connect(apiKey, apiSecret) {
        try {
            this.apiKey = apiKey;
            this.apiSecret = apiSecret;

            // Create auth credentials
            const credentials = new Auth({
                apiKey: apiKey,
                apiSecret: apiSecret
            });

            // Initialize Vonage client with credentials
            this.vonage = new Vonage(credentials);

            return {
                success: true,
                message: 'Connected successfully to Vonage API'
            };
        } catch (error) {
            return {
                success: false,
                message: `Connection failed: ${error.message}`
            };
        }
    }

    /**
     * Check if client is connected
     */
    isConnected() {
        return this.vonage !== null;
    }

    /**
     * Get account balance
     */
    async getAccountBalance() {
        if (!this.isConnected()) {
            throw new Error('Not connected to Vonage API');
        }

        try {
            const balance = await this.vonage.accounts.getBalance();
            return {
                success: true,
                balance: parseFloat(balance.value).toFixed(2),
                autoReload: balance.autoReload
            };
        } catch (error) {
            return {
                success: false,
                message: `Failed to get balance: ${error.message}`
            };
        }
    }

    /**
     * List owned numbers
     */
    async listOwnedNumbers() {
        if (!this.isConnected()) {
            throw new Error('Not connected to Vonage API');
        }

        try {
            // SDK v3 uses getOwnedNumbers() instead of list()
            const numbers = await this.vonage.numbers.getOwnedNumbers();
            return {
                success: true,
                count: numbers.count || 0,
                numbers: numbers.numbers || []
            };
        } catch (error) {
            return {
                success: false,
                message: `Failed to list numbers: ${error.message}`,
                numbers: []
            };
        }
    }

    /**
     * Search available numbers
     */
    async searchAvailableNumbers(country, pattern = null, features = null, type = null) {
        if (!this.isConnected()) {
            throw new Error('Not connected to Vonage API');
        }

        try {
            const searchParams = {
                country: country
            };

            if (pattern) searchParams.pattern = pattern;
            if (features) searchParams.features = features;
            if (type) searchParams.type = type;

            // SDK v3 uses getAvailableNumbers() instead of search()
            const numbers = await this.vonage.numbers.getAvailableNumbers(searchParams);
            return {
                success: true,
                count: numbers.count || 0,
                numbers: numbers.numbers || []
            };
        } catch (error) {
            return {
                success: false,
                message: `Failed to search numbers: ${error.message}`,
                numbers: []
            };
        }
    }

    /**
     * Buy a number
     */
    async buyNumber(country, msisdn, targetApiKey = null) {
        if (!this.isConnected()) {
            throw new Error('Not connected to Vonage API');
        }

        try {
            const params = {
                country: country,
                msisdn: msisdn
            };

            if (targetApiKey) {
                params.target_api_key = targetApiKey;
            }

            // SDK v3 uses buyNumber() instead of buy()
            const result = await this.vonage.numbers.buyNumber(params);
            return {
                success: true,
                message: `Successfully purchased number ${msisdn}`,
                result: result
            };
        } catch (error) {
            return {
                success: false,
                message: `Failed to purchase number: ${error.message}`
            };
        }
    }

    /**
     * Cancel a number
     */
    async cancelNumber(country, msisdn, targetApiKey = null) {
        if (!this.isConnected()) {
            throw new Error('Not connected to Vonage API');
        }

        try {
            const params = {
                country: country,
                msisdn: msisdn
            };

            if (targetApiKey) {
                params.target_api_key = targetApiKey;
            }

            // SDK v3 uses cancelNumber() instead of cancel()
            const result = await this.vonage.numbers.cancelNumber(params);
            return {
                success: true,
                message: `Successfully cancelled number ${msisdn}`,
                result: result
            };
        } catch (error) {
            return {
                success: false,
                message: `Failed to cancel number: ${error.message}`
            };
        }
    }

    /**
     * Get subaccounts using direct HTTP API call
     */
    async getSubaccounts() {
        if (!this.isConnected()) {
            throw new Error('Not connected to Vonage API');
        }

        try {
            const url = `https://api.nexmo.com/accounts/${this.apiKey}/subaccounts`;
            const authHeader = Buffer.from(`${this.apiKey}:${this.apiSecret}`).toString('base64');

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Basic ${authHeader}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (response.ok) {
                return {
                    success: true,
                    subaccounts: data._embedded?.primary_account?.subaccounts || []
                };
            } else {
                return {
                    success: false,
                    message: `Failed to get subaccounts: ${data.title || response.statusText}`,
                    subaccounts: []
                };
            }
        } catch (error) {
            return {
                success: false,
                message: `Failed to get subaccounts: ${error.message}`,
                subaccounts: []
            };
        }
    }

    /**
     * Get balance for a specific account (can be master or subaccount)
     */
    async getAccountBalanceByKey(targetApiKey = null) {
        if (!this.isConnected()) {
            throw new Error('Not connected to Vonage API');
        }

        try {
            const key = targetApiKey || this.apiKey;
            const url = `https://rest.nexmo.com/account/get-balance?api_key=${key}&api_secret=${this.apiSecret}`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (response.ok) {
                return {
                    success: true,
                    balance: parseFloat(data.value).toFixed(2),
                    autoReload: data.autoReload
                };
            } else {
                return {
                    success: false,
                    message: `Failed to get balance: ${data['error-code-label'] || response.statusText}`
                };
            }
        } catch (error) {
            return {
                success: false,
                message: `Failed to get balance: ${error.message}`
            };
        }
    }

    /**
     * Transfer credit between accounts
     */
    async transferCredit(fromAccount, toAccount, amount, reference = null) {
        if (!this.isConnected()) {
            throw new Error('Not connected to Vonage API');
        }

        try {
            const url = `https://api.nexmo.com/accounts/${this.apiKey}/credit-transfers`;
            const authHeader = Buffer.from(`${this.apiKey}:${this.apiSecret}`).toString('base64');

            const body = {
                from: fromAccount,
                to: toAccount,
                amount: amount.toString()
            };

            if (reference) {
                body.reference = reference;
            }

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${authHeader}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });

            const data = await response.json();

            if (response.ok) {
                return {
                    success: true,
                    message: `Successfully transferred ${amount} credits`,
                    data: data
                };
            } else {
                return {
                    success: false,
                    message: `Failed to transfer credit: ${data.title || response.statusText}`
                };
            }
        } catch (error) {
            return {
                success: false,
                message: `Failed to transfer credit: ${error.message}`
            };
        }
    }

    /**
     * Create a new subaccount
     */
    async createSubaccount(name, secret = null, usePrimaryBalance = true) {
        if (!this.isConnected()) {
            throw new Error('Not connected to Vonage API');
        }

        try {
            const url = `https://api.nexmo.com/accounts/${this.apiKey}/subaccounts`;
            const authHeader = Buffer.from(`${this.apiKey}:${this.apiSecret}`).toString('base64');

            const body = {
                name: name,
                use_primary_account_balance: usePrimaryBalance.toString()
            };

            if (secret) {
                body.secret = secret;
            }

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${authHeader}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });

            const data = await response.json();

            if (response.ok) {
                return {
                    success: true,
                    message: `Successfully created subaccount: ${name}`,
                    subaccount: data
                };
            } else {
                return {
                    success: false,
                    message: `Failed to create subaccount: ${data.title || response.statusText}`
                };
            }
        } catch (error) {
            return {
                success: false,
                message: `Failed to create subaccount: ${error.message}`
            };
        }
    }
}
