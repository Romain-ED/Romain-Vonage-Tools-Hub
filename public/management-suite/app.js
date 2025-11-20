/**
 * Vonage Management Suite - Alpine.js Component
 * Combines Numbers Management and Subaccounts Management
 */

function managementSuite() {
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

        // Subaccounts state
        subaccounts: [],
        transferFrom: '',
        transferTo: '',
        transferAmount: '',
        transferReference: '',
        newSubaccountName: '',
        newSubaccountSecret: '',
        newSubaccountUsePrimary: false,

        // UI state
        currentTab: 'numbers',
        loading: false,
        loadingMessage: 'Processing...',
        showPurchaseModalFlag: false,
        showCancelModalFlag: false,
        showTransferModalFlag: false,
        showCreateSubaccountModalFlag: false,

        // Logging
        logs: [],
        autoScroll: true,
        ws: null,

        /**
         * Initialize component
         */
        init() {
            this.addLog('info', 'Welcome to Vonage Management Suite v1.0.0');
            this.addLog('info', 'Session-based mode: Enter your Vonage API credentials to begin');
            this.connectWebSocket();
        },

        /**
         * Connect to WebSocket for real-time logging
         */
        connectWebSocket() {
            try {
                const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
                const wsUrl = `${protocol}//${window.location.host}/management-suite/ws/logs`;

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
                const response = await fetch('/management-suite/api/connect', {
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

                    // Automatically fetch account info, numbers, and subaccounts
                    await this.refreshAccountInfo();
                    await this.refreshNumbers();
                    await this.refreshSubaccounts();
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
         * Disconnect from Vonage API
         */
        disconnect() {
            this.connected = false;
            this.connectionMessage = 'Disconnected from Vonage API';
            this.addLog('info', 'Disconnected from Vonage API');

            // Reset data
            this.balance = 'N/A';
            this.ownedNumbers = [];
            this.availableNumbers = [];
            this.subaccounts = [];
            this.selectedOwned = [];
            this.selectedAvailable = [];
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
                const response = await fetch('/management-suite/api/credentials/load');
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
                const response = await fetch('/management-suite/api/credentials/save', {
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
                const response = await fetch(`/management-suite/api/account/balance?session_id=${this.sessionId}`);
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
                const response = await fetch(`/management-suite/api/numbers/owned?session_id=${this.sessionId}`);
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
                const response = await fetch('/management-suite/api/numbers/search', {
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
                    const response = await fetch('/management-suite/api/numbers/buy', {
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
                    const response = await fetch('/management-suite/api/numbers/cancel', {
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
        },

        /**
         * Refresh subaccounts list
         */
        async refreshSubaccounts() {
            if (!this.connected) return;

            this.loading = true;
            this.loadingMessage = 'Fetching subaccounts...';
            this.addLog('info', 'Fetching subaccounts...');

            try {
                const response = await fetch(`/management-suite/api/subaccounts?session_id=${this.sessionId}`);
                const data = await response.json();

                if (response.ok && data.success) {
                    this.subaccounts = data.subaccounts || [];
                    this.addLog('success', `Found ${this.subaccounts.length} subaccount(s)`);
                } else {
                    this.addLog('error', data.message || 'Failed to fetch subaccounts');
                    this.subaccounts = [];
                }
            } catch (error) {
                this.addLog('error', `Failed to fetch subaccounts: ${error.message}`);
                this.subaccounts = [];
            } finally {
                this.loading = false;
            }
        },

        /**
         * Show transfer confirmation modal
         */
        showTransferModal() {
            if (!this.transferFrom || !this.transferTo || !this.transferAmount) {
                this.addLog('warning', 'Please fill in all transfer fields');
                return;
            }

            if (this.transferFrom === this.transferTo) {
                this.addLog('error', 'Cannot transfer to the same account');
                return;
            }

            this.showTransferModalFlag = true;
            this.addLog('info', `Transfer modal opened: €${this.transferAmount} from ${this.transferFrom} to ${this.transferTo}`);
        },

        /**
         * Confirm transfer
         */
        async confirmTransfer() {
            this.showTransferModalFlag = false;
            this.loading = true;
            this.loadingMessage = 'Transferring credits...';
            this.addLog('info', `Transferring €${this.transferAmount} from ${this.transferFrom} to ${this.transferTo}...`);

            try {
                const response = await fetch('/management-suite/api/subaccounts/transfer', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        from: this.transferFrom,
                        to: this.transferTo,
                        amount: this.transferAmount,
                        reference: this.transferReference || null,
                        session_id: this.sessionId
                    }),
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    this.addLog('success', `Transfer successful: €${this.transferAmount} transferred`);

                    // Reset transfer form
                    this.transferFrom = '';
                    this.transferTo = '';
                    this.transferAmount = '';
                    this.transferReference = '';

                    // Refresh subaccounts and balance
                    await this.refreshSubaccounts();
                    await this.refreshAccountInfo();
                } else {
                    this.addLog('error', data.message || 'Transfer failed');
                }
            } catch (error) {
                this.addLog('error', `Transfer failed: ${error.message}`);
            } finally {
                this.loading = false;
            }
        },

        /**
         * Confirm create subaccount
         */
        async confirmCreateSubaccount() {
            if (!this.newSubaccountName || !this.newSubaccountSecret) {
                this.addLog('error', 'Name and secret are required');
                return;
            }

            this.showCreateSubaccountModalFlag = false;
            this.loading = true;
            this.loadingMessage = 'Creating subaccount...';
            this.addLog('info', `Creating subaccount: ${this.newSubaccountName}...`);

            try {
                const response = await fetch('/management-suite/api/subaccounts/create', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        name: this.newSubaccountName,
                        secret: this.newSubaccountSecret,
                        use_primary_account_balance: this.newSubaccountUsePrimary,
                        session_id: this.sessionId
                    }),
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    this.addLog('success', `Subaccount created successfully: ${data.api_key || 'New API key generated'}`);

                    // Reset form
                    this.newSubaccountName = '';
                    this.newSubaccountSecret = '';
                    this.newSubaccountUsePrimary = false;

                    // Refresh subaccounts list
                    await this.refreshSubaccounts();
                } else {
                    this.addLog('error', data.message || 'Failed to create subaccount');
                }
            } catch (error) {
                this.addLog('error', `Failed to create subaccount: ${error.message}`);
            } finally {
                this.loading = false;
            }
        }
    };
}
