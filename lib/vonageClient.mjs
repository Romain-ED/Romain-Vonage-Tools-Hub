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
            const balance = await this.vonage.account.getBalance();
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
            const numbers = await this.vonage.numbers.list();
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

            const numbers = await this.vonage.numbers.search(searchParams);
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

            const result = await this.vonage.numbers.buy(params);
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

            const result = await this.vonage.numbers.cancel(params);
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
     * Get subaccounts (Note: This requires API v2 which may not be in the SDK)
     * For now, return a placeholder
     */
    async getSubaccounts() {
        // Note: Subaccounts API might need direct HTTP requests
        // as it may not be fully implemented in the SDK
        return {
            success: false,
            message: 'Subaccounts API not yet implemented',
            subaccounts: []
        };
    }
}
