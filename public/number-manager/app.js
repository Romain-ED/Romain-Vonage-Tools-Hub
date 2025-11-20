/**
 * Vonage Numbers Manager - Alpine.js Component
 * Handles all API interactions and state management
 */

function numberManager() {
    return {
        // Connection state
        apiKey: '',
        apiSecret: '',
        connected: false,
        connecting: false,
        connectionError: false,
        connectionMessage: 'Enter credentials and click Connect Account',
        sessionId: 'default',

        // Account info
        balance: 'N/A',

        // Numbers state
        ownedNumbers: [],
        availableNumbers: [],
        selectedOwned: [],
        selectedAvailable: [],

        // Search criteria
        searchCountry: '',
        searchType: '',
        searchFeatures: '',
        searchPattern: '',

        // UI state
        loading: false,
        loadingMessage: 'Processing...',
        showPurchaseModalFlag: false,
        showCancelModalFlag: false,

        // Logging
        logs: [],
        autoScroll: true,
        ws: null,

        /**
         * Initialize component
         */
        init() {
            this.addLog('info', 'Welcome to Vonage Numbers Manager v2.2.2');
            this.addLog('info', 'Session-based mode: Enter your Vonage API credentials to begin');
            this.connectWebSocket();
        },

        /**
         * Connect to WebSocket for real-time logging
         */
        connectWebSocket() {
            try {
                const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
                const wsUrl = `${protocol}//${window.location.host}/number-manager/ws/logs`;

                this.ws = new WebSocket(wsUrl);

                this.ws.onopen = () => {
                    console.log('WebSocket connected');
                };

                this.ws.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        this.addLog(data.type || 'info', data.message, data.timestamp);
                    } catch (e) {
                        console.error('WebSocket message parse error:', e);
                    }
                };

                this.ws.onerror = (error) => {
                    console.error('WebSocket error:', error);
                };

                this.ws.onclose = () => {
                    console.log('WebSocket closed');
                    // Attempt to reconnect after 5 seconds
                    setTimeout(() => {
                        if (this.connected) {
                            this.connectWebSocket();
                        }
                    }, 5000);
                };
            } catch (error) {
                console.error('WebSocket connection failed:', error);
                this.addLog('warning', 'Real-time logging unavailable. Using local logs only.');
            }
        },

        /**
         * Add log entry
         */
        addLog(type, message, timestamp = null) {
            const time = timestamp || new Date().toISOString().split('T')[1].split('.')[0];
            this.logs.push({
                type: type,
                message: message,
                timestamp: `[${time}]`
            });

            // Auto-scroll to bottom if enabled
            if (this.autoScroll) {
                this.$nextTick(() => {
                    const container = document.getElementById('logContainer');
                    if (container) {
                        container.scrollTop = container.scrollHeight;
                    }
                });
            }
        },

        /**
         * Connect to Vonage API
         */
        async connect() {
            if (!this.apiKey || !this.apiSecret) {
                this.addLog('error', 'API Key and Secret are required');
                return;
            }

            this.connecting = true;
            this.connectionError = false;
            this.connectionMessage = 'Connecting to Vonage API...';
            this.addLog('info', 'Attempting to connect to Vonage API...');

            try {
                const response = await fetch('/number-manager/api/connect', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        api_key: this.apiKey,
                        api_secret: this.apiSecret,
                        session_id: this.sessionId
                    }),
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    this.connected = true;
                    this.connectionMessage = 'Successfully connected to Vonage API';
                    this.addLog('success', data.message);

                    // Automatically fetch account info and numbers
                    await this.refreshAccountInfo();
                    await this.refreshNumbers();
                } else {
                    this.connectionError = true;
                    this.connectionMessage = data.message || 'Connection failed';
                    this.addLog('error', data.message || 'Connection failed');
                }
            } catch (error) {
                this.connectionError = true;
                this.connectionMessage = `Connection error: ${error.message}`;
                this.addLog('error', `Connection error: ${error.message}`);
            } finally {
                this.connecting = false;
            }
        },

        /**
         * Clear credential fields
         */
        clearCredentials() {
            this.apiKey = '';
            this.apiSecret = '';
            this.addLog('info', 'Credential fields cleared');
        },

        /**
         * Load saved credentials
         */
        async loadSavedCredentials() {
            this.addLog('info', 'Loading saved credentials...');

            try {
                const response = await fetch('/number-manager/api/credentials/load');
                const data = await response.json();

                if (data.has_saved && data.credentials) {
                    this.apiKey = data.credentials.api_key || '';
                    this.apiSecret = data.credentials.api_secret || '';
                    this.addLog('success', 'Saved credentials loaded successfully');
                } else {
                    this.addLog('warning', 'No saved credentials found');
                }
            } catch (error) {
                this.addLog('error', `Failed to load credentials: ${error.message}`);
            }
        },

        /**
         * Save credentials
         */
        async saveCredentials() {
            if (!this.apiKey || !this.apiSecret) {
                this.addLog('error', 'Cannot save empty credentials');
                return;
            }

            this.addLog('info', 'Saving credentials...');

            try {
                const response = await fetch('/number-manager/api/credentials/save', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        api_key: this.apiKey,
                        api_secret: this.apiSecret
                    }),
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    this.addLog('success', 'Credentials saved successfully');
                } else {
                    this.addLog('error', data.message || 'Failed to save credentials');
                }
            } catch (error) {
                this.addLog('error', `Failed to save credentials: ${error.message}`);
            }
        },

        /**
         * Refresh account information
         */
        async refreshAccountInfo() {
            if (!this.connected) return;

            this.loading = true;
            this.loadingMessage = 'Fetching account information...';
            this.addLog('info', 'Fetching account balance...');

            try {
                const response = await fetch(`/number-manager/api/account/balance?session_id=${this.sessionId}`);
                const data = await response.json();

                if (response.ok && data.success) {
                    this.balance = `€${data.balance}`;
                    this.addLog('success', `Account balance: €${data.balance}`);
                } else {
                    this.addLog('error', data.message || 'Failed to fetch balance');
                }
            } catch (error) {
                this.addLog('error', `Failed to fetch balance: ${error.message}`);
            } finally {
                this.loading = false;
            }
        },

        /**
         * Refresh owned numbers list
         */
        async refreshNumbers() {
            if (!this.connected) return;

            this.loading = true;
            this.loadingMessage = 'Fetching your phone numbers...';
            this.addLog('info', 'Fetching owned numbers...');

            try {
                const response = await fetch(`/number-manager/api/numbers/owned?session_id=${this.sessionId}`);
                const data = await response.json();

                if (response.ok && data.success) {
                    this.ownedNumbers = data.numbers || [];
                    this.selectedOwned = [];
                    this.addLog('success', `Found ${data.count} owned number(s)`);
                } else {
                    this.addLog('error', data.message || 'Failed to fetch numbers');
                    this.ownedNumbers = [];
                }
            } catch (error) {
                this.addLog('error', `Failed to fetch numbers: ${error.message}`);
                this.ownedNumbers = [];
            } finally {
                this.loading = false;
            }
        },

        /**
         * Search for available numbers
         */
        async searchNumbers() {
            if (!this.searchCountry) {
                this.addLog('error', 'Country code is required');
                return;
            }

            this.loading = true;
            this.loadingMessage = 'Searching for available numbers...';
            this.addLog('info', `Searching for numbers in ${this.searchCountry.toUpperCase()}...`);

            try {
                const response = await fetch('/number-manager/api/numbers/search', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        country: this.searchCountry.toUpperCase(),
                        type: this.searchType || null,
                        features: this.searchFeatures || null,
                        pattern: this.searchPattern || null,
                        session_id: this.sessionId
                    }),
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    this.availableNumbers = data.numbers || [];
                    this.selectedAvailable = [];
                    this.addLog('success', `Found ${data.count} available number(s)`);
                } else {
                    this.addLog('error', data.message || 'Search failed');
                    this.availableNumbers = [];
                }
            } catch (error) {
                this.addLog('error', `Search failed: ${error.message}`);
                this.availableNumbers = [];
            } finally {
                this.loading = false;
            }
        },

        /**
         * Toggle all owned numbers selection
         */
        toggleAllOwned(checked) {
            if (checked) {
                this.selectedOwned = this.ownedNumbers.map(n => n.msisdn);
            } else {
                this.selectedOwned = [];
            }
        },

        /**
         * Toggle all available numbers selection
         */
        toggleAllAvailable(checked) {
            if (checked) {
                this.selectedAvailable = this.availableNumbers.map(n => n.msisdn);
            } else {
                this.selectedAvailable = [];
            }
        },

        /**
         * Show purchase confirmation modal
         */
        showPurchaseModal() {
            if (this.selectedAvailable.length === 0) {
                this.addLog('warning', 'No numbers selected for purchase');
                return;
            }
            this.showPurchaseModalFlag = true;
            this.addLog('info', `Purchase modal opened for ${this.selectedAvailable.length} number(s)`);
        },

        /**
         * Confirm purchase
         */
        async confirmPurchase() {
            this.showPurchaseModalFlag = false;
            this.loading = true;
            this.loadingMessage = `Purchasing ${this.selectedAvailable.length} number(s)...`;

            let successCount = 0;
            let failureCount = 0;

            for (const msisdn of this.selectedAvailable) {
                const number = this.availableNumbers.find(n => n.msisdn === msisdn);
                if (!number) continue;

                this.addLog('info', `Purchasing ${msisdn}...`);

                try {
                    const response = await fetch('/number-manager/api/numbers/buy', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            country: number.country,
                            msisdn: msisdn,
                            session_id: this.sessionId
                        }),
                    });

                    const data = await response.json();

                    if (response.ok && data.success) {
                        this.addLog('success', `Successfully purchased ${msisdn}`);
                        successCount++;
                    } else {
                        this.addLog('error', `Failed to purchase ${msisdn}: ${data.message}`);
                        failureCount++;
                    }
                } catch (error) {
                    this.addLog('error', `Failed to purchase ${msisdn}: ${error.message}`);
                    failureCount++;
                }
            }

            this.loading = false;
            this.addLog('info', `Purchase complete: ${successCount} succeeded, ${failureCount} failed`);

            // Refresh owned numbers and balance
            await this.refreshNumbers();
            await this.refreshAccountInfo();

            // Clear available numbers and selection
            this.availableNumbers = [];
            this.selectedAvailable = [];
        },

        /**
         * Show cancel confirmation modal
         */
        showCancelModal() {
            if (this.selectedOwned.length === 0) {
                this.addLog('warning', 'No numbers selected for cancellation');
                return;
            }
            this.showCancelModalFlag = true;
            this.addLog('info', `Cancel modal opened for ${this.selectedOwned.length} number(s)`);
        },

        /**
         * Confirm cancellation
         */
        async confirmCancellation() {
            this.showCancelModalFlag = false;
            this.loading = true;
            this.loadingMessage = `Cancelling ${this.selectedOwned.length} number(s)...`;

            let successCount = 0;
            let failureCount = 0;

            for (const msisdn of this.selectedOwned) {
                const number = this.ownedNumbers.find(n => n.msisdn === msisdn);
                if (!number) continue;

                this.addLog('info', `Cancelling ${msisdn}...`);

                try {
                    const response = await fetch('/number-manager/api/numbers/cancel', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            country: number.country,
                            msisdn: msisdn,
                            session_id: this.sessionId
                        }),
                    });

                    const data = await response.json();

                    if (response.ok && data.success) {
                        this.addLog('success', `Successfully cancelled ${msisdn}`);
                        successCount++;
                    } else {
                        this.addLog('error', `Failed to cancel ${msisdn}: ${data.message}`);
                        failureCount++;
                    }
                } catch (error) {
                    this.addLog('error', `Failed to cancel ${msisdn}: ${error.message}`);
                    failureCount++;
                }
            }

            this.loading = false;
            this.addLog('info', `Cancellation complete: ${successCount} succeeded, ${failureCount} failed`);

            // Refresh owned numbers and balance
            await this.refreshNumbers();
            await this.refreshAccountInfo();

            // Clear selection
            this.selectedOwned = [];
        }
    };
}
