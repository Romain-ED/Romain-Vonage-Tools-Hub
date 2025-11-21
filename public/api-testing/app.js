/**
 * Vonage API Testing Tool - Alpine.js Component
 * Tests Messages API (SMS, WhatsApp), Verify API, Voice API, and Number Insight
 */

function apiTestingTool() {
    return {
        // Credentials
        apiKey: '',
        apiSecret: '',
        accountBalance: null,
        ownedNumbers: [],

        // UI State
        currentTab: 'messages',
        messagesSubTab: 'sms',
        verifySubTab: 'start',
        insightSubTab: 'basic',
        loading: false,
        loadingMessage: 'Processing...',

        // SMS State
        sms: {
            from: '',
            to: '',
            text: '',
            request: null,
            response: null
        },

        // WhatsApp State
        whatsapp: {
            from: '',
            to: '',
            text: '',
            request: null,
            response: null
        },

        // Verify State
        verify: {
            start: {
                number: '',
                brand: '',
                workflow: '',
                request: null,
                response: null
            },
            check: {
                requestId: '',
                code: '',
                request: null,
                response: null
            },
            cancel: {
                requestId: '',
                request: null,
                response: null
            }
        },

        // Voice State
        voice: {
            to: '',
            text: '',
            voiceName: '',
            request: null,
            response: null
        },

        // Number Insight State
        insight: {
            basic: {
                number: '',
                request: null,
                response: null
            },
            standard: {
                number: '',
                request: null,
                response: null
            }
        },

        // History
        history: {
            sms: [],
            whatsapp: [],
            verifyStart: [],
            verifyCheck: [],
            verifyCancel: [],
            voice: [],
            insightBasic: [],
            insightStandard: []
        },

        // Logging
        logs: [],
        autoScroll: true,
        ws: null,

        /**
         * Initialize component
         */
        init() {
            this.addLog('info', 'Welcome to Vonage API Testing Tool v1.0.0');
            this.addLog('info', 'Enter your API credentials to begin testing');
            this.connectWebSocket();

            // Try to load saved credentials
            this.loadSavedCredentials();
        },

        /**
         * Connect to WebSocket for real-time logging
         */
        connectWebSocket() {
            try {
                const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
                const wsUrl = `${protocol}//${window.location.host}/api-testing/ws/logs`;

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
                        if (this.apiKey && this.apiSecret) {
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
            try {
                const response = await fetch('/api-testing/api/credentials/load');
                const data = await response.json();

                if (data.success && data.credentials) {
                    this.apiKey = data.credentials.api_key || '';
                    this.apiSecret = data.credentials.api_secret || '';
                    this.addLog('success', 'Saved credentials loaded successfully');

                    // Create session, then fetch balance and numbers
                    await this.createSession();
                } else {
                    this.addLog('info', 'No saved credentials found');
                }
            } catch (error) {
                this.addLog('error', `Failed to load credentials: ${error.message}`);
            }
        },

        /**
         * Create session with credentials
         */
        async createSession() {
            try {
                const response = await fetch('/api-testing/api/connect', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        api_key: this.apiKey,
                        api_secret: this.apiSecret
                    })
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    this.addLog('success', 'Session created successfully');
                    // Now fetch balance and numbers
                    await this.getBalance();
                    await this.getOwnedNumbers();
                } else {
                    this.addLog('error', `Failed to create session: ${data.error || 'Unknown error'}`);
                }
            } catch (error) {
                this.addLog('error', `Failed to create session: ${error.message}`);
            }
        },

        /**
         * Get account balance
         */
        async getBalance() {
            try {
                const response = await fetch('/api-testing/api/account/balance');

                const data = await response.json();

                if (response.ok && data.success) {
                    this.accountBalance = data.balance;
                    this.addLog('info', `Account balance: €${data.balance}`);
                } else {
                    this.addLog('error', `Failed to fetch balance: ${data.error || 'Unknown error'}`);
                }
            } catch (error) {
                this.addLog('error', `Failed to fetch balance: ${error.message}`);
            }
        },

        /**
         * Get owned numbers
         */
        async getOwnedNumbers() {
            try {
                const response = await fetch('/api-testing/api/numbers/owned');

                const data = await response.json();

                if (response.ok && data.success) {
                    this.ownedNumbers = data.numbers || [];
                    this.addLog('info', `Found ${data.count || 0} owned number(s)`);
                } else {
                    this.addLog('error', `Failed to fetch owned numbers: ${data.error || 'Unknown error'}`);
                }
            } catch (error) {
                this.addLog('error', `Failed to fetch owned numbers: ${error.message}`);
            }
        },

        /**
         * Refresh account balance
         */
        async refreshBalance() {
            try {
                const response = await fetch('/api-testing/api/account/balance');

                const data = await response.json();

                if (response.ok && data.success) {
                    this.accountBalance = data.balance;
                    this.addLog('info', `Balance refreshed: €${data.balance}`);
                }
                // Silently fail - don't log errors on refresh
            } catch (error) {
                // Silently fail
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
                const response = await fetch('/api-testing/api/credentials/save', {
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
         * Send SMS
         */
        async sendSMS() {
            this.loading = true;
            this.loadingMessage = 'Sending SMS...';
            this.addLog('info', `Sending SMS to ${this.sms.to}...`);

            const requestData = {
                api_key: this.apiKey,
                api_secret: this.apiSecret,
                from: this.sms.from,
                to: this.sms.to,
                text: this.sms.text
            };

            this.sms.request = JSON.stringify(requestData, null, 2);

            try {
                const response = await fetch('/api-testing/api/messages/sms', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestData)
                });

                const data = await response.json();
                this.sms.response = JSON.stringify(data, null, 2);

                const success = response.ok && data.success;

                if (success) {
                    this.addLog('success', `SMS sent successfully to ${this.sms.to}`);
                    // Refresh balance after successful send
                    await this.refreshBalance();
                } else {
                    this.addLog('error', `Failed to send SMS: ${data.message || 'Unknown error'}`);
                }

                // Add to history
                this.history.sms.unshift({
                    timestamp: new Date().toLocaleTimeString(),
                    to: this.sms.to,
                    success: success,
                    request: this.sms.request,
                    response: this.sms.response
                });

            } catch (error) {
                this.addLog('error', `SMS send failed: ${error.message}`);
                this.sms.response = JSON.stringify({ error: error.message }, null, 2);

                this.history.sms.unshift({
                    timestamp: new Date().toLocaleTimeString(),
                    to: this.sms.to,
                    success: false,
                    request: this.sms.request,
                    response: this.sms.response
                });
            } finally {
                this.loading = false;
            }
        },

        /**
         * Send WhatsApp message
         */
        async sendWhatsApp() {
            this.loading = true;
            this.loadingMessage = 'Sending WhatsApp message...';
            this.addLog('info', `Sending WhatsApp message to ${this.whatsapp.to}...`);

            const requestData = {
                api_key: this.apiKey,
                api_secret: this.apiSecret,
                from: this.whatsapp.from,
                to: this.whatsapp.to,
                text: this.whatsapp.text
            };

            this.whatsapp.request = JSON.stringify(requestData, null, 2);

            try {
                const response = await fetch('/api-testing/api/messages/whatsapp', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestData)
                });

                const data = await response.json();
                this.whatsapp.response = JSON.stringify(data, null, 2);

                const success = response.ok && data.success;

                if (success) {
                    this.addLog('success', `WhatsApp message sent successfully to ${this.whatsapp.to}`);
                    // Refresh balance after successful send
                    await this.refreshBalance();
                } else {
                    this.addLog('error', `Failed to send WhatsApp: ${data.message || 'Unknown error'}`);
                }

                // Add to history
                this.history.whatsapp.unshift({
                    timestamp: new Date().toLocaleTimeString(),
                    to: this.whatsapp.to,
                    success: success,
                    request: this.whatsapp.request,
                    response: this.whatsapp.response
                });

            } catch (error) {
                this.addLog('error', `WhatsApp send failed: ${error.message}`);
                this.whatsapp.response = JSON.stringify({ error: error.message }, null, 2);

                this.history.whatsapp.unshift({
                    timestamp: new Date().toLocaleTimeString(),
                    to: this.whatsapp.to,
                    success: false,
                    request: this.whatsapp.request,
                    response: this.whatsapp.response
                });
            } finally {
                this.loading = false;
            }
        },

        /**
         * Start verification
         */
        async startVerification() {
            this.loading = true;
            this.loadingMessage = 'Starting verification...';
            this.addLog('info', `Starting verification for ${this.verify.start.number}...`);

            const requestData = {
                api_key: this.apiKey,
                api_secret: this.apiSecret,
                number: this.verify.start.number,
                brand: this.verify.start.brand
            };

            if (this.verify.start.workflow) {
                requestData.workflow_id = this.verify.start.workflow;
            }

            this.verify.start.request = JSON.stringify(requestData, null, 2);

            try {
                const response = await fetch('/api-testing/api/verify/start', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestData)
                });

                const data = await response.json();
                this.verify.start.response = JSON.stringify(data, null, 2);

                const success = response.ok && data.success;

                if (success) {
                    this.addLog('success', `Verification started. Request ID: ${data.request_id || 'N/A'}`);

                    // Auto-fill check request ID
                    if (data.request_id) {
                        this.verify.check.requestId = data.request_id;
                    }

                    // Refresh balance after successful start
                    await this.refreshBalance();
                } else {
                    this.addLog('error', `Failed to start verification: ${data.message || 'Unknown error'}`);
                }

                // Add to history
                this.history.verifyStart.unshift({
                    timestamp: new Date().toLocaleTimeString(),
                    number: this.verify.start.number,
                    requestId: data.request_id || null,
                    success: success,
                    request: this.verify.start.request,
                    response: this.verify.start.response
                });

            } catch (error) {
                this.addLog('error', `Verification start failed: ${error.message}`);
                this.verify.start.response = JSON.stringify({ error: error.message }, null, 2);

                this.history.verifyStart.unshift({
                    timestamp: new Date().toLocaleTimeString(),
                    number: this.verify.start.number,
                    requestId: null,
                    success: false,
                    request: this.verify.start.request,
                    response: this.verify.start.response
                });
            } finally {
                this.loading = false;
            }
        },

        /**
         * Check verification code
         */
        async checkVerification() {
            this.loading = true;
            this.loadingMessage = 'Checking verification code...';
            this.addLog('info', `Checking verification code for request ${this.verify.check.requestId}...`);

            const requestData = {
                api_key: this.apiKey,
                api_secret: this.apiSecret,
                request_id: this.verify.check.requestId,
                code: this.verify.check.code
            };

            this.verify.check.request = JSON.stringify(requestData, null, 2);

            try {
                const response = await fetch('/api-testing/api/verify/check', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestData)
                });

                const data = await response.json();
                this.verify.check.response = JSON.stringify(data, null, 2);

                const success = response.ok && data.success;

                if (success) {
                    this.addLog('success', `Verification check successful: ${data.status || 'verified'}`);
                } else {
                    this.addLog('error', `Verification check failed: ${data.message || 'Unknown error'}`);
                }

                // Add to history
                this.history.verifyCheck.unshift({
                    timestamp: new Date().toLocaleTimeString(),
                    requestId: this.verify.check.requestId,
                    success: success,
                    request: this.verify.check.request,
                    response: this.verify.check.response
                });

            } catch (error) {
                this.addLog('error', `Verification check failed: ${error.message}`);
                this.verify.check.response = JSON.stringify({ error: error.message }, null, 2);

                this.history.verifyCheck.unshift({
                    timestamp: new Date().toLocaleTimeString(),
                    requestId: this.verify.check.requestId,
                    success: false,
                    request: this.verify.check.request,
                    response: this.verify.check.response
                });
            } finally {
                this.loading = false;
            }
        },

        /**
         * Cancel verification
         */
        async cancelVerification() {
            this.loading = true;
            this.loadingMessage = 'Cancelling verification...';
            this.addLog('info', `Cancelling verification for request ${this.verify.cancel.requestId}...`);

            const requestData = {
                api_key: this.apiKey,
                api_secret: this.apiSecret,
                request_id: this.verify.cancel.requestId
            };

            this.verify.cancel.request = JSON.stringify(requestData, null, 2);

            try {
                const response = await fetch('/api-testing/api/verify/cancel', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestData)
                });

                const data = await response.json();
                this.verify.cancel.response = JSON.stringify(data, null, 2);

                const success = response.ok && data.success;

                if (success) {
                    this.addLog('success', 'Verification cancelled successfully');
                } else {
                    this.addLog('error', `Failed to cancel verification: ${data.message || 'Unknown error'}`);
                }

                // Add to history
                this.history.verifyCancel.unshift({
                    timestamp: new Date().toLocaleTimeString(),
                    requestId: this.verify.cancel.requestId,
                    success: success,
                    request: this.verify.cancel.request,
                    response: this.verify.cancel.response
                });

            } catch (error) {
                this.addLog('error', `Verification cancel failed: ${error.message}`);
                this.verify.cancel.response = JSON.stringify({ error: error.message }, null, 2);

                this.history.verifyCancel.unshift({
                    timestamp: new Date().toLocaleTimeString(),
                    requestId: this.verify.cancel.requestId,
                    success: false,
                    request: this.verify.cancel.request,
                    response: this.verify.cancel.response
                });
            } finally {
                this.loading = false;
            }
        },

        /**
         * Make TTS call
         */
        async makeTTSCall() {
            this.loading = true;
            this.loadingMessage = 'Making TTS call...';
            this.addLog('info', `Making TTS call to ${this.voice.to}...`);

            const requestData = {
                api_key: this.apiKey,
                api_secret: this.apiSecret,
                to: this.voice.to,
                text: this.voice.text
            };

            if (this.voice.voiceName) {
                requestData.voice_name = this.voice.voiceName;
            }

            this.voice.request = JSON.stringify(requestData, null, 2);

            try {
                const response = await fetch('/api-testing/api/voice/tts', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestData)
                });

                const data = await response.json();
                this.voice.response = JSON.stringify(data, null, 2);

                const success = response.ok && data.success;

                if (success) {
                    this.addLog('success', `TTS call initiated successfully to ${this.voice.to}`);
                    // Refresh balance after successful call
                    await this.refreshBalance();
                } else {
                    this.addLog('error', `Failed to make TTS call: ${data.message || 'Unknown error'}`);
                }

                // Add to history
                this.history.voice.unshift({
                    timestamp: new Date().toLocaleTimeString(),
                    to: this.voice.to,
                    success: success,
                    request: this.voice.request,
                    response: this.voice.response
                });

            } catch (error) {
                this.addLog('error', `TTS call failed: ${error.message}`);
                this.voice.response = JSON.stringify({ error: error.message }, null, 2);

                this.history.voice.unshift({
                    timestamp: new Date().toLocaleTimeString(),
                    to: this.voice.to,
                    success: false,
                    request: this.voice.request,
                    response: this.voice.response
                });
            } finally {
                this.loading = false;
            }
        },

        /**
         * Get basic number insight
         */
        async getBasicInsight() {
            this.loading = true;
            this.loadingMessage = 'Getting basic insight...';
            this.addLog('info', `Getting basic insight for ${this.insight.basic.number}...`);

            const requestData = {
                api_key: this.apiKey,
                api_secret: this.apiSecret,
                number: this.insight.basic.number
            };

            this.insight.basic.request = JSON.stringify(requestData, null, 2);

            try {
                const response = await fetch('/api-testing/api/insight/basic', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestData)
                });

                const data = await response.json();
                this.insight.basic.response = JSON.stringify(data, null, 2);

                const success = response.ok && data.success;

                if (success) {
                    this.addLog('success', `Basic insight retrieved for ${this.insight.basic.number}`);
                } else {
                    this.addLog('error', `Failed to get basic insight: ${data.message || 'Unknown error'}`);
                }

                // Add to history
                this.history.insightBasic.unshift({
                    timestamp: new Date().toLocaleTimeString(),
                    number: this.insight.basic.number,
                    success: success,
                    request: this.insight.basic.request,
                    response: this.insight.basic.response
                });

            } catch (error) {
                this.addLog('error', `Basic insight failed: ${error.message}`);
                this.insight.basic.response = JSON.stringify({ error: error.message }, null, 2);

                this.history.insightBasic.unshift({
                    timestamp: new Date().toLocaleTimeString(),
                    number: this.insight.basic.number,
                    success: false,
                    request: this.insight.basic.request,
                    response: this.insight.basic.response
                });
            } finally {
                this.loading = false;
            }
        },

        /**
         * Get standard number insight
         */
        async getStandardInsight() {
            this.loading = true;
            this.loadingMessage = 'Getting standard insight...';
            this.addLog('info', `Getting standard insight for ${this.insight.standard.number}...`);

            const requestData = {
                api_key: this.apiKey,
                api_secret: this.apiSecret,
                number: this.insight.standard.number
            };

            this.insight.standard.request = JSON.stringify(requestData, null, 2);

            try {
                const response = await fetch('/api-testing/api/insight/standard', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestData)
                });

                const data = await response.json();
                this.insight.standard.response = JSON.stringify(data, null, 2);

                const success = response.ok && data.success;

                if (success) {
                    this.addLog('success', `Standard insight retrieved for ${this.insight.standard.number}`);
                } else {
                    this.addLog('error', `Failed to get standard insight: ${data.message || 'Unknown error'}`);
                }

                // Add to history
                this.history.insightStandard.unshift({
                    timestamp: new Date().toLocaleTimeString(),
                    number: this.insight.standard.number,
                    success: success,
                    request: this.insight.standard.request,
                    response: this.insight.standard.response
                });

            } catch (error) {
                this.addLog('error', `Standard insight failed: ${error.message}`);
                this.insight.standard.response = JSON.stringify({ error: error.message }, null, 2);

                this.history.insightStandard.unshift({
                    timestamp: new Date().toLocaleTimeString(),
                    number: this.insight.standard.number,
                    success: false,
                    request: this.insight.standard.request,
                    response: this.insight.standard.response
                });
            } finally {
                this.loading = false;
            }
        },

        /**
         * Highlight JSON with syntax highlighting
         */
        highlightJson(jsonString) {
            if (!jsonString) return '';

            try {
                // Use highlight.js if available
                if (typeof hljs !== 'undefined') {
                    return hljs.highlight(jsonString, { language: 'json' }).value;
                }

                // Fallback: basic HTML escaping
                return jsonString
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;');
            } catch (e) {
                return jsonString;
            }
        }
    };
}
