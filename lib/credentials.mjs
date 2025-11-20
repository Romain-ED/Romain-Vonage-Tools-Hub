import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Manages saving and loading of API credentials with basic security (base64 encoding)
 */
export class CredentialManager {
    constructor() {
        this.configFile = path.join(__dirname, '..', 'data', 'vonage_credentials.json');
        this.ensureDataDirectory();
    }

    /**
     * Ensure data directory exists
     */
    ensureDataDirectory() {
        const dataDir = path.dirname(this.configFile);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
    }

    /**
     * Encode credential with base64 for basic obfuscation
     */
    encodeCredential(credential) {
        return Buffer.from(credential).toString('base64');
    }

    /**
     * Decode credential from base64
     */
    decodeCredential(encodedCredential) {
        try {
            return Buffer.from(encodedCredential, 'base64').toString('utf-8');
        } catch (error) {
            return '';
        }
    }

    /**
     * Save credentials to local file with basic encoding
     */
    saveCredentials(apiKey, apiSecret) {
        try {
            const credentials = {
                api_key: this.encodeCredential(apiKey),
                api_secret: this.encodeCredential(apiSecret),
                saved_at: new Date().toISOString()
            };

            fs.writeFileSync(this.configFile, JSON.stringify(credentials, null, 2));
            return true;
        } catch (error) {
            console.error('Error saving credentials:', error);
            return false;
        }
    }

    /**
     * Load credentials from local file
     */
    loadCredentials() {
        try {
            if (!fs.existsSync(this.configFile)) {
                return {};
            }

            const data = fs.readFileSync(this.configFile, 'utf-8');
            const credentials = JSON.parse(data);

            return {
                api_key: this.decodeCredential(credentials.api_key || ''),
                api_secret: this.decodeCredential(credentials.api_secret || ''),
                saved_at: credentials.saved_at || ''
            };
        } catch (error) {
            console.error('Error loading credentials:', error);
            return {};
        }
    }

    /**
     * Delete saved credentials
     */
    deleteCredentials() {
        try {
            if (fs.existsSync(this.configFile)) {
                fs.unlinkSync(this.configFile);
            }
            return true;
        } catch (error) {
            console.error('Error deleting credentials:', error);
            return false;
        }
    }

    /**
     * Check if credentials are saved
     */
    hasSavedCredentials() {
        return fs.existsSync(this.configFile);
    }
}
