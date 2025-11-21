class CSVFilterTool {
    constructor() {
        this.csvData = [];
        this.headers = [];
        this.filteredData = [];
        this.currentPage = 1;
        this.rowsPerPage = 20;
        this.filters = [];
        this.analysisData = {};
        this.logVisible = true;
        this.debugLogs = [];
        this.debugMode = true;
        this.filterPresets = this.loadFilterPresets();
        this.filterHistory = [];
        this.historyIndex = -1;
        this.columnDataTypes = {};
        this.isResultsLimited = false;
        
        // Initialize dark mode with error handling
        try {
            this.darkMode = localStorage.getItem('csvTool_darkMode') === 'true';
        } catch (e) {
            console.warn('Failed to load dark mode setting:', e);
            this.darkMode = false;
        }
        
        this.logBrowserInfo();
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Wait for DOM to be fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.setupEventListeners();
            });
        } else {
            this.setupEventListeners();
        }
    }
    
    setupEventListeners() {
        const uploadArea = document.getElementById('uploadArea');
        const csvFileInput = document.getElementById('csvFile');
        const addFilterBtn = document.getElementById('addFilterBtn');
        const applyFiltersBtn = document.getElementById('applyFiltersBtn');
        const downloadBtn = document.getElementById('downloadBtn');
        const analyzeBtn = document.getElementById('analyzeBtn');
        const clearAnalysisBtn = document.getElementById('clearAnalysisBtn');
        const clearLogBtn = document.getElementById('clearLogBtn');
        const toggleLogBtn = document.getElementById('toggleLogBtn');
        const exportLogBtn = document.getElementById('exportLogBtn');
        const docsBtn = document.getElementById('docsBtn');
        const darkModeBtn = document.getElementById('darkModeBtn');
        const searchWithinResults = document.getElementById('searchWithinResults');
        
        this.log('info', 'Setting up event listeners...');
        this.debugLog(`Elements found: docsBtn=${!!docsBtn}, darkModeBtn=${!!darkModeBtn}`);
        this.debugLog(`All buttons: upload=${!!uploadArea}, docs=${!!docsBtn}, dark=${!!darkModeBtn}`);

        if (uploadArea && csvFileInput) {
            uploadArea.addEventListener('click', () => csvFileInput.click());
            uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
            uploadArea.addEventListener('drop', this.handleDrop.bind(this));
            csvFileInput.addEventListener('change', this.handleFileSelect.bind(this));
            this.log('info', 'Upload area listeners attached');
        } else {
            this.log('warning', 'Upload area or file input not found');
        }
        
        if (addFilterBtn) addFilterBtn.addEventListener('click', this.addFilter.bind(this));
        if (applyFiltersBtn) applyFiltersBtn.addEventListener('click', this.applyFilters.bind(this));
        if (downloadBtn) downloadBtn.addEventListener('click', this.downloadFilteredCSV.bind(this));
        if (analyzeBtn) analyzeBtn.addEventListener('click', this.analyzeSelectedHeaders.bind(this));
        if (clearAnalysisBtn) clearAnalysisBtn.addEventListener('click', this.clearAnalysis.bind(this));
        if (clearLogBtn) clearLogBtn.addEventListener('click', this.clearLog.bind(this));
        if (toggleLogBtn) toggleLogBtn.addEventListener('click', this.toggleLog.bind(this));
        if (exportLogBtn) exportLogBtn.addEventListener('click', this.exportDebugLog.bind(this));
        
        this.log('info', 'Core button listeners attached');
        
        if (docsBtn) {
            docsBtn.addEventListener('click', () => {
                this.log('info', 'Navigating to documentation...');
                window.location.href = 'docs.html';
            });
            this.log('info', 'Documentation button listener attached');
        } else {
            this.log('warning', 'Documentation button not found');
        }
        
        if (darkModeBtn) {
            darkModeBtn.addEventListener('click', this.toggleDarkMode.bind(this));
            this.log('info', 'Dark mode button listener attached');
        } else {
            this.log('warning', 'Dark mode button not found');
        }
        if (searchWithinResults) {
            searchWithinResults.addEventListener('input', this.debounce(this.searchWithinResults.bind(this), 300));
            this.log('info', 'Search within results listener attached');
        }
        
        // Initialize dark mode
        this.initializeDarkMode();
        
        // Keyboard shortcuts
        document.addEventListener('keydown', this.handleKeyboardShortcuts.bind(this));
        
        // Mobile gesture support
        this.initializeMobileGestures();
        
        // Auto-suggest patterns
        this.autoSuggestPatterns = [];
        
        // Final verification that buttons are working
        setTimeout(() => this.testButtonFunctionality(), 1000);
    }

    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        document.getElementById('uploadArea').classList.add('drag-over');
    }

    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        document.getElementById('uploadArea').classList.remove('drag-over');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            if (files[0].type === 'text/csv' || files[0].name.endsWith('.csv')) {
                this.log('info', `File dropped: ${files[0].name} (${this.formatFileSize(files[0].size)})`);
                this.processFile(files[0]);
            } else {
                this.log('error', `Invalid file type: ${files[0].type}. Please upload a CSV file.`);
            }
        }
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
                this.log('info', `File selected: ${file.name} (${this.formatFileSize(file.size)})`);
                this.processFile(file);
            } else {
                this.log('error', `Invalid file type: ${file.type}. Please select a CSV file.`);
            }
        }
    }

    async processFile(file) {
        try {
            // Store the current file for later use
            this.currentFile = file;
            
            // Reset flags for new file processing
                
            this.debugLog('=== FILE PROCESSING START ===');
            this.inspectFileObject(file);
            
            // Log file details first
            this.log('info', `Processing file: ${file.name}`);
            this.log('info', `File size: ${this.formatFileSize(file.size)}`);
            this.log('info', `File type: ${file.type}`);
            this.log('info', `Last modified: ${new Date(file.lastModified).toLocaleString()}`);
            
            // Check if file is empty
            if (file.size === 0) {
                this.log('error', 'File is empty (0 bytes)');
                this.debugLog('ERROR: File size is 0 bytes');
                return;
            }
            
            // Check if file is too large (>100MB)
            if (file.size > 100 * 1024 * 1024) {
                this.log('warning', 'Large file detected. Processing may take some time...');
                
                // For very large files (>500MB), use streaming parser
                if (file.size > 500 * 1024 * 1024) {
                    this.log('info', 'Using streaming parser for very large file...');
                    await this.streamingParseCSV(file);
                    
                    this.log('success', `File processed successfully: ${this.csvData.length} rows, ${this.headers.length} columns`);
                    if (this.headers.length > 0) {
                        this.log('info', `Headers: ${this.headers.slice(0, 10).join(', ')}${this.headers.length > 10 ? '...' : ''}`);
                    }
                    
                    // Complete processing for large files
                    this.completeFileProcessing();
                    return;
                }
            }
            
            this.log('info', 'Reading file content...');
            let text;
            try {
                text = await this.readFileAsText(file);
            } catch (error) {
                this.log('warning', `Primary file reading failed: ${error.message}`);
                this.debugLog(`PRIMARY READ ERROR: ${error.stack}`);
                this.log('info', 'Trying alternative file reading method...');
                try {
                    text = await this.readFileAsTextAlternative(file);
                } catch (altError) {
                    this.log('error', `Alternative file reading also failed: ${altError.message}`);
                    this.debugLog(`ALTERNATIVE READ ERROR: ${altError.stack}`);
                    throw altError;
                }
            }
            
            this.log('info', 'Parsing CSV data...');
            this.showLoadingIndicator('Parsing CSV data...');
            
            // Use setTimeout to allow UI to update
            setTimeout(() => {
                this.parseCSV(text);
                this.hideLoadingIndicator();
                
                this.log('success', `File parsed successfully: ${this.csvData.length} rows, ${this.headers.length} columns`);
                if (this.headers.length > 0) {
                    this.log('info', `Headers: ${this.headers.slice(0, 10).join(', ')}${this.headers.length > 10 ? '...' : ''}`);
                }
                
                // Continue with post-processing
                this.completeFileProcessing();
            }, 100);
            
        } catch (error) {
            this.log('error', `Error processing file: ${error.message}`);
            console.error('Error processing file:', error);
        }
    }

    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            this.debugLog('=== PRIMARY FILE READING START ===');
            
            const reader = new FileReader();
            this.debugLog(`FileReader created: ${reader.constructor.name}`);
            this.debugLog(`FileReader readyState: ${reader.readyState}`);
            
            reader.onloadstart = (e) => {
                this.log('info', 'FileReader started...');
                this.debugLog(`onloadstart fired - readyState: ${reader.readyState}`);
                this.debugLog(`Event details: ${JSON.stringify({type: e.type, loaded: e.loaded, total: e.total})}`);
            };
            
            reader.onprogress = (e) => {
                this.debugLog(`onprogress fired - readyState: ${reader.readyState}`);
                this.debugLog(`Progress event: ${JSON.stringify({loaded: e.loaded, total: e.total, lengthComputable: e.lengthComputable})}`);
                
                if (e.lengthComputable) {
                    const percent = Math.round((e.loaded / e.total) * 100);
                    if (percent % 25 === 0) { // Log every 25%
                        this.log('info', `Reading progress: ${percent}% (${e.loaded}/${e.total} bytes)`);
                    }
                }
            };
            
            reader.onload = e => {
                this.debugLog(`onload fired - readyState: ${reader.readyState}`);
                this.debugLog(`onload event target: ${e.target.constructor.name}`);
                this.debugLog(`onload event result exists: ${e.target.result !== null && e.target.result !== undefined}`);
                
                const result = e.target.result;
                this.log('info', `FileReader onload event fired`);
                this.log('info', `Result type: ${typeof result}`);
                this.log('info', `Result length: ${result ? result.length : 'null/undefined'}`);
                
                this.debugLog(`Detailed result inspection:`);
                this.debugLog(`- result === null: ${result === null}`);
                this.debugLog(`- result === undefined: ${result === undefined}`);
                this.debugLog(`- result === '': ${result === ''}`);
                this.debugLog(`- typeof result: ${typeof result}`);
                this.debugLog(`- result.constructor: ${result ? result.constructor.name : 'N/A'}`);
                this.debugLog(`- result.length: ${result ? result.length : 'N/A'}`);
                
                if (result === null || result === undefined) {
                    this.log('error', 'FileReader returned null/undefined result');
                    this.debugLog('ERROR: FileReader result is null/undefined');
                    resolve('');
                } else if (typeof result !== 'string') {
                    this.log('error', `FileReader returned unexpected type: ${typeof result}`);
                    this.debugLog(`ERROR: Expected string, got ${typeof result}`);
                    resolve('');
                } else {
                    this.log('success', `File read successfully: ${result.length} characters`);
                    if (result.length > 0) {
                        this.log('info', `First 100 chars: "${result.substring(0, 100)}${result.length > 100 ? '...' : ''}"`);
                        this.debugLog(`First 200 chars: "${result.substring(0, 200)}"`);
                    } else {
                        this.debugLog('WARNING: Result is empty string');
                    }
                    resolve(result);
                }
            };
            
            reader.onerror = e => {
                this.log('error', `FileReader error event fired`);
                this.log('error', `Error details: ${JSON.stringify(e.target.error)}`);
                reject(new Error(`File reading failed: ${e.target.error}`));
            };
            
            reader.onabort = () => {
                this.log('error', 'FileReader abort event fired');
                reject(new Error('File reading was aborted'));
            };
            
            try {
                this.log('info', `Starting to read file with readAsText...`);
                this.log('info', `File object valid: ${file instanceof File}`);
                this.log('info', `File size check: ${file.size} bytes`);
                
                // Try different approaches based on file size
                if (file.size < 50 * 1024 * 1024) { // < 50MB
                    reader.readAsText(file, 'UTF-8');
                } else {
                    this.log('warning', 'Large file detected, using UTF-8 encoding...');
                    reader.readAsText(file, 'UTF-8');
                }
            } catch (error) {
                this.log('error', `Exception when calling readAsText: ${error.message}`);
                this.log('error', `Error stack: ${error.stack}`);
                reject(error);
            }
        });
    }

    readFileAsTextAlternative(file) {
        return new Promise((resolve, reject) => {
            this.log('info', 'Using alternative file reading method...');
            
            const reader = new FileReader();
            
            reader.onload = e => {
                const arrayBuffer = e.target.result;
                this.log('info', `ArrayBuffer received: ${arrayBuffer.byteLength} bytes`);
                
                try {
                    // Convert ArrayBuffer to string using TextDecoder
                    const decoder = new TextDecoder('utf-8');
                    const text = decoder.decode(arrayBuffer);
                    this.log('success', `Alternative reading successful: ${text.length} characters`);
                    resolve(text);
                } catch (decodeError) {
                    this.log('error', `Text decoding failed: ${decodeError.message}`);
                    // Try with different encoding
                    try {
                        const decoder2 = new TextDecoder('iso-8859-1');
                        const text2 = decoder2.decode(arrayBuffer);
                        this.log('warning', `Used ISO-8859-1 encoding: ${text2.length} characters`);
                        resolve(text2);
                    } catch (decode2Error) {
                        this.log('error', `All decoding attempts failed: ${decode2Error.message}`);
                        reject(decode2Error);
                    }
                }
            };
            
            reader.onerror = e => {
                this.log('error', `Alternative file reading failed: ${e.target.error}`);
                reject(new Error(`Alternative file reading failed: ${e.target.error}`));
            };
            
            try {
                reader.readAsArrayBuffer(file);
            } catch (error) {
                this.log('error', `Exception in alternative reading: ${error.message}`);
                reject(error);
            }
        });
    }

    async readLargeFileInChunks(file) {
        this.debugLog('=== CHUNKED FILE READING START ===');
        const chunkSize = 50 * 1024 * 1024; // 50MB chunks
        const totalChunks = Math.ceil(file.size / chunkSize);
        let result = '';
        
        this.log('info', `Reading file in ${totalChunks} chunks of ${this.formatFileSize(chunkSize)} each`);
        
        for (let i = 0; i < totalChunks; i++) {
            const start = i * chunkSize;
            const end = Math.min(start + chunkSize, file.size);
            const chunk = file.slice(start, end);
            
            this.debugLog(`Reading chunk ${i + 1}/${totalChunks}: ${start}-${end} (${end - start} bytes)`);
            this.log('info', `Processing chunk ${i + 1}/${totalChunks} (${Math.round((i + 1) / totalChunks * 100)}%)`);
            
            try {
                const chunkText = await this.readChunkAsText(chunk);
                result += chunkText;
                this.debugLog(`Chunk ${i + 1} added ${chunkText.length} characters, total: ${result.length}`);
                
                // Memory monitoring
                if (performance.memory) {
                    const memUsed = this.formatFileSize(performance.memory.usedJSHeapSize);
                    this.debugLog(`Memory after chunk ${i + 1}: ${memUsed}`);
                    
                    // Warning if memory usage is getting high
                    if (performance.memory.usedJSHeapSize > performance.memory.jsHeapSizeLimit * 0.8) {
                        this.log('warning', `High memory usage detected: ${memUsed}`);
                    }
                }
                
            } catch (error) {
                this.log('error', `Failed to read chunk ${i + 1}: ${error.message}`);
                this.debugLog(`CHUNK READ ERROR ${i + 1}: ${error.stack}`);
                throw error;
            }
        }
        
        this.log('success', `All chunks read successfully. Total content: ${this.formatFileSize(result.length)} characters`);
        this.debugLog(`Final result length: ${result.length} characters`);
        
        return result;
    }

    readChunkAsText(chunk) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = e => {
                const result = e.target.result;
                if (result === null || result === undefined) {
                    reject(new Error('Chunk reading returned null/undefined'));
                } else if (typeof result !== 'string') {
                    reject(new Error(`Chunk reading returned ${typeof result}, expected string`));
                } else {
                    resolve(result);
                }
            };
            
            reader.onerror = e => {
                reject(new Error(`Chunk reading failed: ${e.target.error}`));
            };
            
            reader.readAsText(chunk, 'UTF-8');
        });
    }

    async streamingParseCSV(file) {
        this.debugLog('=== STREAMING CSV PARSING START ===');
        const chunkSize = 10 * 1024 * 1024; // 10MB chunks for streaming
        const totalChunks = Math.ceil(file.size / chunkSize);
        
        this.csvData = [];
        this.headers = [];
        let buffer = '';
        let headersParsed = false;
        let rowCount = 0;
        let skippedRows = 0;
        
        this.log('info', `Streaming parse: ${totalChunks} chunks of ${this.formatFileSize(chunkSize)} each`);
        
        for (let i = 0; i < totalChunks; i++) {
            const start = i * chunkSize;
            const end = Math.min(start + chunkSize, file.size);
            const chunk = file.slice(start, end);
            
            this.log('info', `Processing chunk ${i + 1}/${totalChunks} (${Math.round((i + 1) / totalChunks * 100)}%)`);
            
            try {
                const chunkText = await this.readChunkAsText(chunk);
                buffer += chunkText;
                
                // Process complete lines in buffer
                const lines = buffer.split('\n');
                
                // Keep the last incomplete line for next chunk (unless it's the last chunk)
                if (i < totalChunks - 1) {
                    buffer = lines.pop() || '';
                } else {
                    buffer = '';
                }
                
                // Process complete lines
                for (const line of lines) {
                    if (line.trim().length === 0) continue;
                    
                    if (!headersParsed) {
                        this.headers = this.parseCSVLine(line);
                        this.log('info', `Headers parsed: ${this.headers.length} columns`);
                        this.debugLog(`Headers: ${this.headers.join(', ')}`);
                        headersParsed = true;
                        continue;
                    }
                    
                    const row = this.parseCSVLine(line);
                    if (row.length === this.headers.length) {
                        const rowObject = {};
                        this.headers.forEach((header, index) => {
                            rowObject[header] = row[index] || '';
                        });
                        this.csvData.push(rowObject);
                        rowCount++;
                        
                        // Progress update every 10,000 rows
                        if (rowCount % 10000 === 0) {
                            this.log('info', `Parsed ${rowCount} rows...`);
                            
                            // Memory check
                            if (performance.memory) {
                                const memUsed = this.formatFileSize(performance.memory.usedJSHeapSize);
                                this.debugLog(`Memory at ${rowCount} rows: ${memUsed}`);
                                
                                if (performance.memory.usedJSHeapSize > performance.memory.jsHeapSizeLimit * 0.9) {
                                    this.log('warning', `High memory usage: ${memUsed}. Consider processing smaller chunks.`);
                                }
                            }
                        }
                    } else if (row.length > 0) {
                        skippedRows++;
                        if (skippedRows <= 5) {
                            this.debugLog(`Skipped row: expected ${this.headers.length} columns, got ${row.length}`);
                        }
                    }
                }
                
            } catch (error) {
                this.log('error', `Failed to process chunk ${i + 1}: ${error.message}`);
                this.debugLog(`STREAMING PARSE ERROR ${i + 1}: ${error.stack}`);
                throw error;
            }
        }
        
        // Process any remaining buffer
        if (buffer.trim().length > 0) {
            const row = this.parseCSVLine(buffer);
            if (row.length === this.headers.length) {
                const rowObject = {};
                this.headers.forEach((header, index) => {
                    rowObject[header] = row[index] || '';
                });
                this.csvData.push(rowObject);
                rowCount++;
            }
        }
        
        if (skippedRows > 0) {
            this.log('warning', `Skipped ${skippedRows} rows due to column count mismatch`);
        }
        
        this.log('success', `Streaming parse completed: ${rowCount} rows processed`);
        this.filteredData = [...this.csvData];
    }

    parseCSV(text) {
        // Debug: Log text length and first few characters
        this.log('info', `File content length: ${text.length} characters`);
        
        if (!text || text.trim().length === 0) {
            this.log('error', 'CSV file is empty or contains only whitespace');
            return;
        }

        // Handle different line endings (Windows \r\n, Unix \n, Mac \r)
        const normalizedText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        const lines = normalizedText.split('\n').filter(line => line.trim().length > 0);
        
        this.log('info', `Found ${lines.length} non-empty lines`);
        
        if (lines.length === 0) {
            this.log('error', 'No valid lines found in CSV file');
            return;
        }

        // Debug: Log first line
        this.log('info', `First line: "${lines[0].substring(0, 100)}${lines[0].length > 100 ? '...' : ''}"`);

        this.headers = this.parseCSVLine(lines[0]);
        this.log('info', `Parsed ${this.headers.length} headers: ${this.headers.slice(0, 5).join(', ')}${this.headers.length > 5 ? '...' : ''}`);
        
        // If header parsing failed, try simple comma split as fallback
        if (this.headers.length === 0) {
            this.log('warning', 'Complex CSV parsing failed, trying simple comma split...');
            this.headers = lines[0].split(',').map(h => h.trim().replace(/^"(.*)"$/, '$1'));
            this.log('info', `Fallback parsing found ${this.headers.length} headers`);
        }
        
        if (this.headers.length === 0) {
            this.log('error', 'No headers found in first line');
            return;
        }

        this.csvData = [];
        let skippedRows = 0;
        let processedRows = 0;
        
        // For large files, process in chunks to prevent UI blocking
        if (lines.length > 5000) {
            this.log('info', 'Large file detected - using chunked processing');
            this.parseCSVInChunks(lines, 1, skippedRows, processedRows);
            return;
        }

        // Process normally for smaller files
        for (let i = 1; i < lines.length; i++) {
            let row = this.parseCSVLine(lines[i]);
            
            // If parsing failed or column count doesn't match, try fallback parsing
            if (row.length !== this.headers.length && row.length > 0) {
                const fallbackRow = lines[i].split(',').map(cell => cell.trim().replace(/^"(.*)"$/, '$1'));
                if (fallbackRow.length === this.headers.length) {
                    row = fallbackRow;
                }
            }
            
            if (row.length === this.headers.length) {
                const rowObject = {};
                this.headers.forEach((header, index) => {
                    rowObject[header] = row[index] || '';
                });
                this.csvData.push(rowObject);
                processedRows++;
            } else if (row.length > 0) {
                // Only count as skipped if the row has content but wrong column count
                skippedRows++;
                if (skippedRows <= 3) {
                    this.log('warning', `Row ${i + 1}: Expected ${this.headers.length} columns, got ${row.length} - Line: "${lines[i].substring(0, 50)}..."`);
                }
            }
        }

        if (skippedRows > 0) {
            this.log('warning', `Skipped ${skippedRows} rows due to column count mismatch`);
        }
        
        this.log('info', `Successfully processed ${processedRows} data rows`);
        this.filteredData = [...this.csvData];
    }
    
    // Chunked CSV parsing for large files
    parseCSVInChunks(lines, startIndex, skippedRows, processedRows, chunkSize = 1000) {
        const endIndex = Math.min(startIndex + chunkSize, lines.length);
        
        // Process chunk
        for (let i = startIndex; i < endIndex; i++) {
            let row = this.parseCSVLine(lines[i]);
            
            // If parsing failed or column count doesn't match, try fallback parsing
            if (row.length !== this.headers.length && row.length > 0) {
                const fallbackRow = lines[i].split(',').map(cell => cell.trim().replace(/^"(.*)"$/, '$1'));
                if (fallbackRow.length === this.headers.length) {
                    row = fallbackRow;
                }
            }
            
            if (row.length === this.headers.length) {
                const rowObject = {};
                this.headers.forEach((header, index) => {
                    rowObject[header] = row[index] || '';
                });
                this.csvData.push(rowObject);
                processedRows++;
            } else if (row.length > 0) {
                skippedRows++;
                if (skippedRows <= 3) {
                    this.log('warning', `Row ${i + 1}: Expected ${this.headers.length} columns, got ${row.length}`);
                }
            }
        }
        
        // Log progress
        const progress = Math.round((endIndex / lines.length) * 100);
        this.log('info', `Processed ${endIndex - 1}/${lines.length - 1} rows (${progress}%)`);
        
        // Continue with next chunk or finish
        if (endIndex < lines.length) {
            setTimeout(() => {
                this.parseCSVInChunks(lines, endIndex, skippedRows, processedRows, chunkSize);
            }, 10); // Small delay to prevent UI blocking
        } else {
            // Parsing complete
            if (skippedRows > 0) {
                this.log('warning', `Skipped ${skippedRows} rows due to column count mismatch`);
            }
            
            this.log('info', `Successfully processed ${processedRows} data rows`);
            this.filteredData = [...this.csvData];
            
            // Complete file processing after chunked parsing is done
            this.hideLoadingIndicator();
            this.log('success', `File parsed successfully: ${this.csvData.length} rows, ${this.headers.length} columns`);
            if (this.headers.length > 0) {
                this.log('info', `Headers: ${this.headers.slice(0, 10).join(', ')}${this.headers.length > 10 ? '...' : ''}`);
            }
            
            // Continue with post-processing
            this.completeFileProcessing();
        }
    }

    parseCSVLine(line) {
        if (!line || line.trim().length === 0) {
            return [];
        }

        const result = [];
        let current = '';
        let inQuotes = false;
        let i = 0;
        
        while (i < line.length) {
            const char = line[i];
            
            if (char === '"') {
                if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
                    // Handle escaped quotes ("")
                    current += '"';
                    i += 2;
                } else {
                    // Toggle quote state
                    inQuotes = !inQuotes;
                    i++;
                }
            } else if (char === ',' && !inQuotes) {
                // Field separator found outside quotes
                result.push(current);
                current = '';
                i++;
            } else {
                current += char;
                i++;
            }
        }
        
        // Add the last field
        result.push(current);
        
        // Clean up fields (remove surrounding quotes and trim whitespace)
        return result.map(field => {
            let cleaned = field.trim();
            // Remove surrounding quotes if present
            if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
                cleaned = cleaned.slice(1, -1);
            }
            return cleaned;
        });
    }

    showFileInfoSection() {
        try {
            const fileInfoSection = document.getElementById('fileInfoSection');
            const fileInfoGrid = document.getElementById('fileInfoGrid');
            
            if (!fileInfoSection || !fileInfoGrid) {
                this.log('warning', 'File info section elements not found');
                return;
            }
            
            // Format file size
            const formatFileSize = (bytes) => {
                if (bytes === 0) return '0 Bytes';
                const k = 1024;
                const sizes = ['Bytes', 'KB', 'MB', 'GB'];
                const i = Math.floor(Math.log(bytes) / Math.log(k));
                return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
            };
            
            // Format date
            const formatDate = (date) => {
                return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
            };
            
            // Get file info
            const fileSize = this.currentFile ? this.currentFile.size : 0;
            const fileName = this.currentFile ? this.currentFile.name : 'Unknown';
            const lastModified = this.currentFile ? new Date(this.currentFile.lastModified) : new Date();
            const rowCount = this.csvData ? this.csvData.length : 0;
            const columnCount = this.headers ? this.headers.length : 0;
            
            // Create file info items
            const fileInfoItems = [
                { label: 'File Name', value: fileName },
                { label: 'File Size', value: formatFileSize(fileSize) },
                { label: 'Last Modified', value: formatDate(lastModified) },
                { label: 'Rows', value: rowCount.toLocaleString() },
                { label: 'Columns', value: columnCount.toLocaleString() }
            ];
            
            // Generate HTML with Tailwind CSS
            fileInfoGrid.innerHTML = fileInfoItems.map(item => `
                <div class="bg-gray-700 rounded-lg p-4 border border-gray-600">
                    <div class="text-xs font-bold text-blue-400 uppercase tracking-wide mb-1">${this.escapeHtml(item.label)}</div>
                    <div class="text-lg font-semibold text-white">${this.escapeHtml(item.value)}</div>
                </div>
            `).join('');
            
            fileInfoSection.style.display = 'block';
            this.log('info', 'File information displayed');
            
        } catch (error) {
            this.log('error', `Error showing file info section: ${error.message}`);
            console.error('Show file info section error:', error);
        }
    }

    showAnalysisSection() {
        try {
            const analysisSection = document.getElementById('analysisSection');
            if (analysisSection) {
                analysisSection.style.display = 'block';
                this.renderHeaderCheckboxes();
                this.log('info', 'Analysis section displayed');
            } else {
                this.log('warning', 'Analysis section element not found');
            }
        } catch (error) {
            this.log('error', `Error showing analysis section: ${error.message}`);
            console.error('Show analysis section error:', error);
        }
    }

    showFilterSection() {
        try {
            const filterSection = document.getElementById('filterSection');
            if (filterSection) {
                filterSection.style.display = 'block';
                
                // Set up event listener for remove internal fields checkbox
                const removeInternalFieldsCheckbox = document.getElementById('removeInternalFieldsCheckbox');
                if (removeInternalFieldsCheckbox) {
                    removeInternalFieldsCheckbox.addEventListener('change', () => {
                        if (this.filteredData && this.filteredData.length > 0) {
                            this.showResultsFileInfo(); // Update file info first
                            this.renderTable();
                            this.log('info', removeInternalFieldsCheckbox.checked ? 
                                'Internal fields hidden from results' : 
                                'All fields shown in results');
                        }
                    });
                }
                
                this.log('info', 'Filter section displayed');
            } else {
                this.log('warning', 'Filter section element not found');
            }
        } catch (error) {
            this.log('error', `Error showing filter section: ${error.message}`);
            console.error('Show filter section error:', error);
        }
    }

    addFilter() {
        const filterId = 'filter-' + Date.now();
        const filterHtml = `
            <div class="filter-row bg-gray-700 rounded-lg p-4 border border-gray-600 hover:border-blue-400 transition-all duration-200" data-filter-id="${filterId}">
                <div class="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                    <!-- Column Select -->
                    <div class="md:col-span-3">
                        <label class="block text-xs text-gray-400 mb-1 font-medium">Column</label>
                        <select class="filter-column w-full bg-gray-800 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all">
                            <option value="">Select Column</option>
                            ${this.headers.map(header => `<option value="${this.escapeHtml(header)}">${this.escapeHtml(header)}</option>`).join('')}
                        </select>
                    </div>

                    <!-- Operator Select -->
                    <div class="md:col-span-3">
                        <label class="block text-xs text-gray-400 mb-1 font-medium">Operator</label>
                        <select class="filter-operator w-full bg-gray-800 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all">
                            <option value="contains">Contains</option>
                            <option value="equals">Equals</option>
                            <option value="starts_with">Starts with</option>
                            <option value="ends_with">Ends with</option>
                            <option value="not_contains">Does not contain</option>
                            <option value="not_equals">Does not equal</option>
                            <option value="is_empty">Is empty</option>
                            <option value="is_not_empty">Is not empty</option>
                            <option value="regex">Regex pattern</option>
                        </select>
                    </div>

                    <!-- Value Input -->
                    <div class="md:col-span-5">
                        <label class="block text-xs text-gray-400 mb-1 font-medium">Value</label>
                        <div class="filter-value-container space-y-2">
                            <input type="text" class="filter-value w-full bg-gray-800 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" placeholder="Enter value...">
                            <select class="filter-suggestions w-full bg-gray-800 text-gray-400 border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all" style="display: none;">
                                <option value="">💡 Select from common values</option>
                            </select>
                        </div>
                    </div>

                    <!-- Remove Button -->
                    <div class="md:col-span-1 flex items-end">
                        <button class="remove-filter w-full bg-red-600 hover:bg-red-700 text-white font-medium px-3 py-2 rounded transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 flex items-center justify-center"
                                onclick="csvTool.removeFilter('${filterId}')"
                                title="Remove this filter">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('filtersContainer').insertAdjacentHTML('beforeend', filterHtml);

        // Add event listener for column selection to show/hide suggestions
        const newFilterRow = document.querySelector(`[data-filter-id="${filterId}"]`);
        const columnSelect = newFilterRow.querySelector('.filter-column');
        const suggestionsSelect = newFilterRow.querySelector('.filter-suggestions');

        columnSelect.addEventListener('change', (e) => {
            this.updateFilterSuggestions(e.target.value, suggestionsSelect);
        });

        suggestionsSelect.addEventListener('change', (e) => {
            if (e.target.value) {
                const textInput = newFilterRow.querySelector('.filter-value');
                textInput.value = e.target.value;
            }
        });
    }

    addFilterFromAnalysis(column, value) {
        try {
            // Show filter section if hidden
            const filterSection = document.getElementById('filterSection');
            if (filterSection.style.display === 'none') {
                this.showFilterSection();
            }

            // Add a new filter
            this.addFilter();

            // Get the last added filter row
            const lastFilter = document.querySelector('.filter-row:last-child');
            if (lastFilter) {
                // Set the column
                const columnSelect = lastFilter.querySelector('.filter-column');
                if (columnSelect) {
                    columnSelect.value = column;
                }

                // Set the operator to 'equals'
                const operatorSelect = lastFilter.querySelector('.filter-operator');
                if (operatorSelect) {
                    operatorSelect.value = 'equals';
                }

                // Set the value
                const valueInput = lastFilter.querySelector('.filter-value');
                if (valueInput) {
                    valueInput.value = value;
                }

                // Scroll to filter section
                filterSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

                // Log success
                this.log('success', `Added filter: ${column} equals "${value}"`);
            }
        } catch (error) {
            this.log('error', `Error adding filter from analysis: ${error.message}`);
            console.error('Add filter from analysis error:', error);
        }
    }

    removeFilter(filterId) {
        const filterElement = document.querySelector(`[data-filter-id="${filterId}"]`);
        if (filterElement) {
            filterElement.remove();
        }
    }

    clearFilters() {
        this.saveFilterState();
        document.getElementById('filtersContainer').innerHTML = '';
        this.filters = [];
        this.filteredData = [...this.csvData];
        this.hideResultsSection();
    }

    applyFilters() {
        // Use the regular apply filters without limit
        this.applyFiltersWithoutLimit();
    }
    
    applyFiltersWithoutLimit() {
        this.saveFilterState();
        const filterRows = document.querySelectorAll('.filter-row');
        this.filters = [];

        filterRows.forEach(row => {
            const column = row.querySelector('.filter-column').value;
            const operator = row.querySelector('.filter-operator').value;
            const value = row.querySelector('.filter-value').value;

            if (column && (value || operator === 'is_empty' || operator === 'is_not_empty')) {
                this.filters.push({ column, operator, value });
            }
        });

        if (this.filters.length === 0) {
            this.log('warning', 'No filters applied - showing all data');
            this.filteredData = [...this.csvData];
        } else {
            this.log('info', `Applying ${this.filters.length} filter(s)...`);
            
            const originalCount = this.csvData.length;
            this.filteredData = this.csvData.filter(row => {
                return this.filters.every(filter => {
                    const cellValue = (row[filter.column] || '').toString().toLowerCase();
                    const filterValue = filter.value ? filter.value.toLowerCase() : '';

                    switch (filter.operator) {
                        case 'contains':
                            return cellValue.includes(filterValue);
                        case 'equals':
                            return cellValue === filterValue;
                        case 'starts_with':
                            return cellValue.startsWith(filterValue);
                        case 'ends_with':
                            return cellValue.endsWith(filterValue);
                        case 'not_contains':
                            return !cellValue.includes(filterValue);
                        case 'not_equals':
                            return cellValue !== filterValue;
                        case 'is_empty':
                            return cellValue === '';
                        case 'is_not_empty':
                            return cellValue !== '';
                        case 'regex':
                            try {
                                const regex = new RegExp(filter.value, 'i');
                                return regex.test(cellValue);
                            } catch (e) {
                                console.warn('Invalid regex pattern:', filter.value);
                                return false;
                            }
                        default:
                            return true;
                    }
                });
            });

            this.log('success', `Filters applied: ${this.filteredData.length} of ${originalCount} rows match criteria`);
            
            // Mark results as not limited for regular filter application
            this.isResultsLimited = false;
        }

        this.showResults();
    }
    
    applyFiltersWithLimit(limit = 50) {
        this.saveFilterState();
        const filterRows = document.querySelectorAll('.filter-row');
        this.filters = [];

        filterRows.forEach(row => {
            const column = row.querySelector('.filter-column').value;
            const operator = row.querySelector('.filter-operator').value;
            const value = row.querySelector('.filter-value').value;

            if (column && (value || operator === 'is_empty' || operator === 'is_not_empty')) {
                this.filters.push({ column, operator, value });
            }
        });

        if (this.filters.length === 0) {
            this.log('warning', 'No filters applied - showing first 50 rows of all data');
            this.filteredData = this.csvData.slice(0, limit);
            this.isResultsLimited = this.csvData.length > limit;
        } else {
            this.log('info', `Applying ${this.filters.length} filter(s) with ${limit} row limit...`);
            
            const originalCount = this.csvData.length;
            let matchingRows = 0;
            this.filteredData = [];
            
            // Process rows until we have enough matches or run out of data
            for (let i = 0; i < this.csvData.length && this.filteredData.length < limit; i++) {
                const row = this.csvData[i];
                const matches = this.filters.every(filter => {
                    const cellValue = (row[filter.column] || '').toString().toLowerCase();
                    const filterValue = filter.value ? filter.value.toLowerCase() : '';

                    switch (filter.operator) {
                        case 'contains':
                            return cellValue.includes(filterValue);
                        case 'equals':
                            return cellValue === filterValue;
                        case 'starts_with':
                            return cellValue.startsWith(filterValue);
                        case 'ends_with':
                            return cellValue.endsWith(filterValue);
                        case 'not_contains':
                            return !cellValue.includes(filterValue);
                        case 'not_equals':
                            return cellValue !== filterValue;
                        case 'is_empty':
                            return cellValue === '';
                        case 'is_not_empty':
                            return cellValue !== '';
                        case 'regex':
                            try {
                                const regex = new RegExp(filter.value, 'i');
                                return regex.test(cellValue);
                            } catch (e) {
                                console.warn('Invalid regex pattern:', filter.value);
                                return false;
                            }
                        default:
                            return true;
                    }
                });
                
                if (matches) {
                    this.filteredData.push(row);
                    matchingRows++;
                }
            }

            this.log('success', `Filters applied: showing first ${this.filteredData.length} of ${matchingRows >= limit ? `${limit}+` : matchingRows} matching rows (${originalCount} total rows)`);
            
            // Mark results as limited if we hit the limit
            this.isResultsLimited = this.filteredData.length >= limit;
        }

        this.showResults();
    }

    showResults() {
        document.getElementById('resultsSection').style.display = 'block';
        
        // Check if results were limited
        const totalRowsElement = document.getElementById('totalRows');
        const showAllBtn = document.getElementById('showAllResultsBtn');
        
        if (this.isResultsLimited) {
            totalRowsElement.textContent = `${this.filteredData.length} (limited)`;
            totalRowsElement.title = 'Results limited to first 50 matching rows';
            totalRowsElement.style.color = '#f59e0b';
            
            // Show the "Show All" button
            if (showAllBtn) {
                showAllBtn.style.display = 'inline-block';
            }
        } else {
            totalRowsElement.textContent = this.filteredData.length;
            totalRowsElement.title = '';
            totalRowsElement.style.color = '';
            
            // Hide the "Show All" button
            if (showAllBtn) {
                showAllBtn.style.display = 'none';
            }
        }
        
        // Show results file info
        this.showResultsFileInfo();
        
        // Use virtual scrolling for large datasets
        if (!this.initializeVirtualScrolling()) {
            this.renderTable();
            this.renderPagination();
        }
    }

    hideResultsSection() {
        document.getElementById('resultsSection').style.display = 'none';
        const resultsFileInfo = document.getElementById('resultsFileInfo');
        if (resultsFileInfo) {
            resultsFileInfo.style.display = 'none';
        }
    }

    showResultsFileInfo() {
        try {
            const resultsFileInfoSection = document.getElementById('resultsFileInfo');
            const resultsFileInfoGrid = document.getElementById('resultsFileInfoGrid');
            
            if (!resultsFileInfoSection || !resultsFileInfoGrid) {
                this.log('warning', 'Results file info section elements not found');
                return;
            }
            
            if (!this.filteredData || this.filteredData.length === 0) {
                resultsFileInfoSection.style.display = 'none';
                return;
            }
            
            // Format file size estimation
            const formatFileSize = (bytes) => {
                if (bytes === 0) return '0 Bytes';
                const k = 1024;
                const sizes = ['Bytes', 'KB', 'MB', 'GB'];
                const i = Math.floor(Math.log(bytes) / Math.log(k));
                return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
            };
            
            // Calculate estimated CSV file size
            const estimateCSVSize = () => {
                const visibleHeaders = this.getVisibleHeaders();
                const headerSize = visibleHeaders.join(',').length + 1; // +1 for newline
                
                let dataSize = 0;
                const sampleSize = Math.min(this.filteredData.length, 100); // Sample first 100 rows for estimation
                
                for (let i = 0; i < sampleSize; i++) {
                    const row = this.filteredData[i];
                    const rowData = visibleHeaders.map(header => {
                        const value = row[header] || '';
                        // Account for potential CSV escaping (quotes around values with commas)
                        return value.toString().includes(',') ? `"${value}"` : value.toString();
                    }).join(',') + '\n';
                    dataSize += rowData.length;
                }
                
                // Estimate total size based on sample
                const avgRowSize = sampleSize > 0 ? dataSize / sampleSize : 0;
                const totalEstimatedSize = headerSize + (avgRowSize * this.filteredData.length);
                
                return Math.ceil(totalEstimatedSize);
            };
            
            // Get results info
            const visibleHeaders = this.getVisibleHeaders();
            const rowCount = this.filteredData.length;
            const columnCount = visibleHeaders.length;
            const estimatedSize = estimateCSVSize();
            
            // Create results file info items
            const resultsFileInfoItems = [
                { label: 'Filtered Rows', value: rowCount.toLocaleString() },
                { label: 'Visible Columns', value: columnCount.toLocaleString() },
                { label: 'Est. CSV Size', value: formatFileSize(estimatedSize) }
            ];
            
            // Generate HTML
            resultsFileInfoGrid.innerHTML = resultsFileInfoItems.map(item => `
                <div class="results-file-info-item">
                    <div class="results-file-info-label">${this.escapeHtml(item.label)}</div>
                    <div class="results-file-info-value">${this.escapeHtml(item.value)}</div>
                </div>
            `).join('');
            
            resultsFileInfoSection.style.display = 'block';
            this.log('info', 'Results file information displayed');
            
        } catch (error) {
            this.log('error', `Error showing results file info: ${error.message}`);
            console.error('Show results file info error:', error);
        }
    }

    getVisibleHeaders() {
        const removeInternalFields = document.getElementById('removeInternalFieldsCheckbox')?.checked || false;
        
        if (!removeInternalFields) {
            return this.headers;
        }
        
        // List of internal fields to remove
        const internalFields = [
            'route_cost',
            'hlr_lookup_cost', 
            'gateway',
            'gateway_id',
            'gateway_error_code',
            'routing_rule_seq',
            'channel',
            'srr',
            'date_submitted'
        ];
        
        return this.headers.filter(header => !internalFields.includes(header));
    }

    renderTable() {
        const tableHead = document.getElementById('tableHead');
        const tableBody = document.getElementById('tableBody');
        const visibleHeaders = this.getVisibleHeaders();

        tableHead.innerHTML = `
            <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap sticky left-0 bg-gray-800 z-10 border-r border-gray-600">
                    <input type="checkbox" id="selectAllRows" class="rounded">
                </th>
                ${visibleHeaders.map(header => `
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap cursor-pointer hover:text-blue-400 transition-colors"
                        onclick="csvTool.sortColumn('${this.escapeHtml(header)}')">
                        ${this.escapeHtml(header)}
                    </th>
                `).join('')}
            </tr>
        `;

        // Add select all functionality
        const selectAllCheckbox = document.getElementById('selectAllRows');
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', this.toggleSelectAll.bind(this));
        }

        const startIndex = (this.currentPage - 1) * this.rowsPerPage;
        const endIndex = Math.min(startIndex + this.rowsPerPage, this.filteredData.length);
        const pageData = this.filteredData.slice(startIndex, endIndex);

        tableBody.innerHTML = pageData.map((row, index) => {
            const globalIndex = startIndex + index;
            return `
                <tr class="hover:bg-gray-600 transition-colors">
                    <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-300 sticky left-0 bg-gray-700 group-hover:bg-gray-600 z-10 border-r border-gray-600">
                        <input type="checkbox" class="row-checkbox rounded" data-row-index="${globalIndex}">
                    </td>
                    ${visibleHeaders.map(header => `
                        <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                            ${this.escapeHtml(row[header] || '')}
                        </td>
                    `).join('')}
                </tr>
            `;
        }).join('');

        // Add row selection listeners
        document.querySelectorAll('.row-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', this.updateBulkActions.bind(this));
        });
    }

    renderPagination() {
        const totalPages = Math.ceil(this.filteredData.length / this.rowsPerPage);
        const pagination = document.getElementById('pagination');

        if (totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }

        const startIndex = (this.currentPage - 1) * this.rowsPerPage + 1;
        const endIndex = Math.min(this.currentPage * this.rowsPerPage, this.filteredData.length);

        let paginationHtml = `
            <div class="flex flex-col sm:flex-row items-center justify-between gap-4 w-full">
                <div class="text-sm text-gray-400">
                    Showing <span class="font-medium text-white">${startIndex.toLocaleString()}</span> to
                    <span class="font-medium text-white">${endIndex.toLocaleString()}</span> of
                    <span class="font-medium text-white">${this.filteredData.length.toLocaleString()}</span> rows
                </div>
                <div class="flex items-center gap-2">
        `;

        if (this.currentPage > 1) {
            paginationHtml += `
                <button onclick="csvTool.goToPage(${this.currentPage - 1})"
                        class="px-3 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors">
                    <i class="fas fa-chevron-left"></i>
                </button>
            `;
        }

        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(totalPages, this.currentPage + 2);

        if (startPage > 1) {
            paginationHtml += `
                <button onclick="csvTool.goToPage(1)"
                        class="px-3 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors">
                    1
                </button>
            `;
            if (startPage > 2) {
                paginationHtml += `<span class="text-gray-400 px-2">...</span>`;
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            const activeClass = i === this.currentPage
                ? 'bg-blue-600 text-white font-bold'
                : 'bg-gray-700 text-white hover:bg-gray-600';
            paginationHtml += `
                <button onclick="csvTool.goToPage(${i})"
                        class="px-3 py-2 ${activeClass} rounded transition-colors">
                    ${i}
                </button>
            `;
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                paginationHtml += `<span class="text-gray-400 px-2">...</span>`;
            }
            paginationHtml += `
                <button onclick="csvTool.goToPage(${totalPages})"
                        class="px-3 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors">
                    ${totalPages}
                </button>
            `;
        }

        if (this.currentPage < totalPages) {
            paginationHtml += `
                <button onclick="csvTool.goToPage(${this.currentPage + 1})"
                        class="px-3 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors">
                    <i class="fas fa-chevron-right"></i>
                </button>
            `;
        }

        paginationHtml += `
                </div>
            </div>
        `;

        pagination.innerHTML = paginationHtml;
    }

    goToPage(page) {
        this.currentPage = page;
        this.renderTable();
        this.renderPagination();
    }

    downloadFilteredCSV() {
        this.downloadData('csv');
    }

    formatCSVCell(value) {
        const stringValue = value.toString();
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    renderHeaderCheckboxes() {
        const headerCheckboxes = document.getElementById('headerCheckboxes');
        headerCheckboxes.innerHTML = this.headers.map(header => `
            <label class="header-checkbox">
                <input type="checkbox" value="${header}" name="headerAnalysis">
                <span class="checkbox-label">${header}</span>
            </label>
        `).join('');
    }

    analyzeSelectedHeaders() {
        const selectedHeaders = Array.from(document.querySelectorAll('input[name="headerAnalysis"]:checked'))
            .map(checkbox => checkbox.value);

        if (selectedHeaders.length === 0) {
            this.log('warning', 'Please select at least one header to analyze.');
            return;
        }

        this.log('info', `Starting analysis for ${selectedHeaders.length} header(s): ${selectedHeaders.join(', ')}`);

        // Show loading state
        const analyzeBtn = document.getElementById('analyzeBtn');
        const originalText = analyzeBtn.textContent;
        analyzeBtn.textContent = 'Analyzing...';
        analyzeBtn.disabled = true;

        // Perform analysis
        setTimeout(() => {
            this.performAnalysis(selectedHeaders);
            this.displayAnalysisResults(selectedHeaders);
            
            this.log('success', `Analysis completed for ${selectedHeaders.length} header(s)`);
            
            // Reset button
            analyzeBtn.textContent = originalText;
            analyzeBtn.disabled = false;
        }, 100);
    }

    performAnalysis(headers) {
        this.analysisData = {};

        headers.forEach(header => {
            const valueCounts = {};
            
            this.csvData.forEach(row => {
                const value = row[header] || '';
                const cleanValue = value.toString().trim();
                if (cleanValue !== '') {
                    valueCounts[cleanValue] = (valueCounts[cleanValue] || 0) + 1;
                }
            });

            // Sort by frequency and get top 10
            const sortedValues = Object.entries(valueCounts)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 10);

            this.analysisData[header] = sortedValues;
        });
    }

    displayAnalysisResults(headers) {
        const analysisGrid = document.getElementById('analysisGrid');
        const analysisResults = document.getElementById('analysisResults');

        // Vibrant color palette for better visualization
        const colorPalette = [
            { from: '#3b82f6', to: '#60a5fa', text: '#dbeafe' }, // Blue
            { from: '#8b5cf6', to: '#a78bfa', text: '#ede9fe' }, // Purple
            { from: '#ec4899', to: '#f472b6', text: '#fce7f3' }, // Pink
            { from: '#f59e0b', to: '#fbbf24', text: '#fef3c7' }, // Amber
            { from: '#10b981', to: '#34d399', text: '#d1fae5' }, // Green
            { from: '#06b6d4', to: '#22d3ee', text: '#cffafe' }, // Cyan
            { from: '#ef4444', to: '#f87171', text: '#fee2e2' }, // Red
            { from: '#6366f1', to: '#818cf8', text: '#e0e7ff' }  // Indigo
        ];

        analysisGrid.innerHTML = headers.map((header, headerIndex) => {
            const values = this.analysisData[header];
            const totalCount = this.csvData.length;

            // Find the maximum count for scaling the bars
            const maxCount = Math.max(...values.map(([, count]) => count));

            return `
                <div class="bg-gray-800 border border-gray-700 rounded-lg p-6 shadow-lg hover:border-blue-500 transition-all duration-300">
                    <h4 class="text-lg font-bold text-white mb-4 pb-2 border-b border-gray-700 flex items-center">
                        <i class="fas fa-chart-bar mr-2 text-blue-400"></i>
                        ${this.escapeHtml(header)}
                        <span class="ml-auto text-sm text-gray-400 font-normal">${values.length} unique values</span>
                    </h4>
                    <div class="space-y-3">
                        ${values.map(([value, count], index) => {
                            const percentage = ((count / totalCount) * 100).toFixed(1);
                            const barWidth = (count / maxCount) * 100;
                            const color = colorPalette[index % colorPalette.length];

                            return `
                                <div class="group cursor-pointer hover:bg-gray-750 rounded p-2 -m-2 transition-all duration-200"
                                     onclick="csvTool.addFilterFromAnalysis('${this.escapeHtml(header).replace(/'/g, "\\'")}', '${this.escapeHtml(value).replace(/'/g, "\\'")}')">
                                    <div class="flex items-center justify-between mb-1">
                                        <span class="text-sm font-medium text-gray-300 truncate flex-1 mr-2 group-hover:text-blue-400 transition-colors" title="${this.escapeHtml(value)} - Click to add as filter">
                                            ${this.escapeHtml(value) || '<em class="text-gray-500">Empty</em>'}
                                        </span>
                                        <div class="flex items-center space-x-2">
                                            <span class="text-sm font-bold text-white bg-gray-700 px-2 py-0.5 rounded group-hover:bg-blue-600 transition-colors">${count}</span>
                                            <span class="text-xs text-gray-400 w-12 text-right">${percentage}%</span>
                                            <i class="fas fa-plus-circle text-gray-600 group-hover:text-blue-400 transition-colors text-xs opacity-0 group-hover:opacity-100"></i>
                                        </div>
                                    </div>
                                    <div class="w-full bg-gray-700 rounded-full h-3 overflow-hidden shadow-inner">
                                        <div class="h-full rounded-full transition-all duration-500 ease-out group-hover:shadow-lg relative"
                                             style="width: ${barWidth}%; background: linear-gradient(90deg, ${color.from} 0%, ${color.to} 100%);">
                                            <div class="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity"></div>
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        }).join('');

        analysisResults.style.display = 'block';
    }

    clearAnalysis() {
        this.analysisData = {};
        document.getElementById('analysisResults').style.display = 'none';
        document.querySelectorAll('input[name="headerAnalysis"]').forEach(checkbox => {
            checkbox.checked = false;
        });
    }

    updateFilterSuggestions(columnName, suggestionsSelect) {
        if (!columnName || !this.analysisData[columnName]) {
            suggestionsSelect.style.display = 'none';
            return;
        }

        const values = this.analysisData[columnName];
        suggestionsSelect.innerHTML = `
            <option value="">Select from common values</option>
            ${values.map(([value]) => `<option value="${this.escapeHtml(value)}">${this.escapeHtml(value)}</option>`).join('')}
        `;
        suggestionsSelect.style.display = 'block';
    }

    log(type, message) {
        const logContainer = document.getElementById('logContainer');
        const timestamp = new Date().toLocaleTimeString();
        
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${type}`;
        
        logEntry.innerHTML = `
            <span class="log-time">${timestamp}</span>
            <span class="log-message">${this.escapeHtml(message)}</span>
        `;
        
        logContainer.appendChild(logEntry);
        
        // Auto-scroll to bottom
        logContainer.scrollTop = logContainer.scrollHeight;
        
        // Limit log entries to prevent memory issues
        const logEntries = logContainer.querySelectorAll('.log-entry');
        if (logEntries.length > 100) {
            logEntries[0].remove();
        }
    }

    clearLog() {
        const logContainer = document.getElementById('logContainer');
        logContainer.innerHTML = `
            <div class="log-entry info">
                <span class="log-time">${new Date().toLocaleTimeString()}</span>
                <span class="log-message">Log cleared</span>
            </div>
        `;
    }

    toggleLog() {
        const logContainer = document.getElementById('logContainer');
        const toggleBtn = document.getElementById('toggleLogBtn');
        
        this.logVisible = !this.logVisible;
        
        if (this.logVisible) {
            logContainer.style.display = 'block';
            toggleBtn.textContent = 'Hide Log';
        } else {
            logContainer.style.display = 'none';
            toggleBtn.textContent = 'Show Log';
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Debug functions
    debugLog(message) {
        const timestamp = new Date().toISOString();
        const debugEntry = {
            timestamp,
            message,
            stack: new Error().stack
        };
        this.debugLogs.push(debugEntry);
        
        if (this.debugMode) {
            console.log(`[DEBUG ${timestamp}] ${message}`);
        }
    }

    logBrowserInfo() {
        this.debugLog('=== BROWSER ENVIRONMENT INFO ===');
        this.debugLog(`User Agent: ${navigator.userAgent}`);
        this.debugLog(`Platform: ${navigator.platform}`);
        this.debugLog(`Language: ${navigator.language}`);
        this.debugLog(`Cookie Enabled: ${navigator.cookieEnabled}`);
        this.debugLog(`Online: ${navigator.onLine}`);
        this.debugLog(`Screen: ${screen.width}x${screen.height}`);
        this.debugLog(`Window: ${window.innerWidth}x${window.innerHeight}`);
        this.debugLog(`URL: ${window.location.href}`);
        this.debugLog(`Protocol: ${window.location.protocol}`);
        
        // FileReader support check
        this.debugLog(`FileReader supported: ${typeof FileReader !== 'undefined'}`);
        this.debugLog(`File API supported: ${typeof File !== 'undefined'}`);
        this.debugLog(`TextDecoder supported: ${typeof TextDecoder !== 'undefined'}`);
        
        // Memory info (if available)
        if (performance.memory) {
            this.debugLog(`Memory - Used: ${this.formatFileSize(performance.memory.usedJSHeapSize)}`);
            this.debugLog(`Memory - Total: ${this.formatFileSize(performance.memory.totalJSHeapSize)}`);
            this.debugLog(`Memory - Limit: ${this.formatFileSize(performance.memory.jsHeapSizeLimit)}`);
        }
    }

    inspectFileObject(file) {
        this.debugLog('=== FILE OBJECT INSPECTION ===');
        this.debugLog(`File constructor: ${file.constructor.name}`);
        this.debugLog(`File instanceof File: ${file instanceof File}`);
        this.debugLog(`File instanceof Blob: ${file instanceof Blob}`);
        
        // Enumerate all properties
        const props = [];
        for (let prop in file) {
            try {
                const value = file[prop];
                const type = typeof value;
                props.push(`${prop}: ${type} = ${type === 'function' ? '[Function]' : value}`);
            } catch (e) {
                props.push(`${prop}: [Error accessing property: ${e.message}]`);
            }
        }
        this.debugLog(`File properties: ${props.join(', ')}`);
        
        // Check specific properties
        this.debugLog(`File.name: ${JSON.stringify(file.name)}`);
        this.debugLog(`File.size: ${file.size} (${typeof file.size})`);
        this.debugLog(`File.type: ${JSON.stringify(file.type)}`);
        this.debugLog(`File.lastModified: ${file.lastModified} (${typeof file.lastModified})`);
        
        // Try to access prototype
        try {
            this.debugLog(`File.prototype: ${Object.getPrototypeOf(file).constructor.name}`);
        } catch (e) {
            this.debugLog(`File.prototype error: ${e.message}`);
        }
    }

    exportDebugLog() {
        const debugData = {
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            debugLogs: this.debugLogs,
            visibleLogs: Array.from(document.querySelectorAll('.log-entry')).map(entry => ({
                type: entry.className.split(' ').find(c => ['info', 'success', 'warning', 'error'].includes(c)),
                time: entry.querySelector('.log-time')?.textContent,
                message: entry.querySelector('.log-message')?.textContent
            }))
        };
        
        const jsonString = JSON.stringify(debugData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `vonage-csv-debug-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
        
        this.log('success', 'Debug log exported successfully');
    }

    // Filter Preset Management
    loadFilterPresets() {
        try {
            const presets = localStorage.getItem('csvTool_filterPresets');
            return presets ? JSON.parse(presets) : {};
        } catch (e) {
            console.warn('Failed to load filter presets:', e);
            return {};
        }
    }

    saveFilterPresets() {
        try {
            localStorage.setItem('csvTool_filterPresets', JSON.stringify(this.filterPresets));
        } catch (e) {
            console.warn('Failed to save filter presets:', e);
        }
    }

    saveFilterPreset() {
        const presetName = prompt('Enter a name for this filter preset:');
        if (!presetName) return;

        const filters = this.getCurrentFilters();
        if (filters.length === 0) {
            alert('No filters to save!');
            return;
        }

        this.filterPresets[presetName] = filters;
        this.saveFilterPresets();
        this.log('success', `Filter preset '${presetName}' saved successfully`);
    }

    getCurrentFilters() {
        const filterRows = document.querySelectorAll('.filter-row');
        const filters = [];

        filterRows.forEach(row => {
            const column = row.querySelector('.filter-column').value;
            const operator = row.querySelector('.filter-operator').value;
            const value = row.querySelector('.filter-value').value;

            if (column && (value || operator === 'is_empty' || operator === 'is_not_empty')) {
                filters.push({ column, operator, value });
            }
        });

        return filters;
    }

    showLoadPresetDialog() {
        const presetNames = Object.keys(this.filterPresets);
        if (presetNames.length === 0) {
            alert('No saved filter presets found.');
            return;
        }

        const selectedPreset = prompt(`Available presets:\n${presetNames.join('\n')}\n\nNote: Preset results will be limited to first 50 matching rows.\n\nEnter preset name to load:`);
        if (!selectedPreset || !this.filterPresets[selectedPreset]) {
            if (selectedPreset) alert('Preset not found!');
            return;
        }

        this.loadFilterPreset(selectedPreset);
    }

    loadFilterPreset(presetName) {
        const preset = this.filterPresets[presetName];
        if (!preset) return;

        // Clear existing filters
        document.getElementById('filtersContainer').innerHTML = '';

        // Load preset filters
        preset.forEach(filter => {
            this.addFilter();
            const lastFilter = document.querySelector('.filter-row:last-child');
            lastFilter.querySelector('.filter-column').value = filter.column;
            lastFilter.querySelector('.filter-operator').value = filter.operator;
            lastFilter.querySelector('.filter-value').value = filter.value || '';
            
            // Update suggestions if column has analysis data
            this.updateFilterSuggestions(filter.column, lastFilter.querySelector('.filter-suggestions'));
        });

        this.log('success', `Filter preset '${presetName}' loaded successfully`);
        
        // Automatically apply the filters and limit to first 50 results
        setTimeout(() => {
            this.applyFiltersWithLimit(50);
        }, 100);
    }

    // Filter History Management
    saveFilterState() {
        const currentState = {
            filters: this.getCurrentFilters(),
            timestamp: Date.now()
        };

        // Remove any future history if we're not at the end
        if (this.historyIndex < this.filterHistory.length - 1) {
            this.filterHistory = this.filterHistory.slice(0, this.historyIndex + 1);
        }

        this.filterHistory.push(currentState);
        this.historyIndex = this.filterHistory.length - 1;

        // Limit history to 50 entries
        if (this.filterHistory.length > 50) {
            this.filterHistory.shift();
            this.historyIndex--;
        }

        this.updateHistoryButtons();
    }

    undoFilter() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.restoreFilterState(this.filterHistory[this.historyIndex]);
            this.log('info', 'Filter state restored (undo)');
        }
    }

    redoFilter() {
        if (this.historyIndex < this.filterHistory.length - 1) {
            this.historyIndex++;
            this.restoreFilterState(this.filterHistory[this.historyIndex]);
            this.log('info', 'Filter state restored (redo)');
        }
    }

    restoreFilterState(state) {
        // Clear existing filters
        document.getElementById('filtersContainer').innerHTML = '';

        // Restore filters
        state.filters.forEach(filter => {
            this.addFilter();
            const lastFilter = document.querySelector('.filter-row:last-child');
            lastFilter.querySelector('.filter-column').value = filter.column;
            lastFilter.querySelector('.filter-operator').value = filter.operator;
            lastFilter.querySelector('.filter-value').value = filter.value || '';
        });

        this.updateHistoryButtons();
    }

    updateHistoryButtons() {
        const undoBtn = document.getElementById('undoFilterBtn');
        const redoBtn = document.getElementById('redoFilterBtn');
        
        if (undoBtn) undoBtn.disabled = this.historyIndex <= 0;
        if (redoBtn) redoBtn.disabled = this.historyIndex >= this.filterHistory.length - 1;
    }

    // Data Type Detection
    detectColumnDataTypes() {
        try {
            this.columnDataTypes = {};
            
            if (!this.headers || this.headers.length === 0) {
                this.log('warning', 'No headers found for data type detection');
                return;
            }
            
            if (!this.csvData || this.csvData.length === 0) {
                this.log('warning', 'No data found for data type detection');
                return;
            }
            
            this.headers.forEach((header, index) => {
                try {
                    // Add progress logging for large datasets
                    if (this.csvData.length > 5000 && index % 10 === 0) {
                        this.log('info', `Detecting data types for column ${index + 1}/${this.headers.length}`);
                    }
                    
                    // Use a reasonable sample size based on dataset size
                    const sampleSize = Math.min(this.csvData.length, this.csvData.length > 10000 ? 200 : 500);
                    const sampleValues = this.csvData.slice(0, sampleSize).map(row => row[header] || '').filter(val => val && val.toString().trim());
            
            let numericCount = 0;
            let dateCount = 0;
            let totalSamples = sampleValues.length;
            
            if (totalSamples === 0) {
                this.columnDataTypes[header] = 'text';
                return;
            }
            
            sampleValues.forEach(value => {
                const cleanValue = value.toString().trim();
                
                // Check if numeric
                if (!isNaN(cleanValue) && !isNaN(parseFloat(cleanValue))) {
                    numericCount++;
                }
                
                // Check if date
                const dateValue = new Date(cleanValue);
                if (!isNaN(dateValue.getTime()) && cleanValue.length > 5) {
                    dateCount++;
                }
            });
            
                    // Determine type based on majority
                    if (numericCount / totalSamples >= 0.8) {
                        this.columnDataTypes[header] = 'number';
                    } else if (dateCount / totalSamples >= 0.8) {
                        this.columnDataTypes[header] = 'date';
                    } else {
                        this.columnDataTypes[header] = 'text';
                    }
                } catch (headerError) {
                    this.log('warning', `Error detecting type for column '${header}': ${headerError.message}`);
                    this.columnDataTypes[header] = 'text'; // Default to text
                }
            });
            
            this.log('info', 'Column data types detected: ' + Object.entries(this.columnDataTypes).map(([col, type]) => `${col}(${type})`).slice(0, 10).join(', ') + (Object.keys(this.columnDataTypes).length > 10 ? '...' : ''));
        } catch (error) {
            this.log('error', `Error in data type detection: ${error.message}`);
            console.error('Data type detection error:', error);
            // Set all columns to text as fallback
            this.columnDataTypes = {};
            if (this.headers) {
                this.headers.forEach(header => {
                    this.columnDataTypes[header] = 'text';
                });
            }
        }
    }





    // Search within results
    searchWithinResults(event) {
        const searchTerm = event.target.value.toLowerCase();
        
        if (!searchTerm) {
            this.filteredData = [...this.csvData].filter(row => {
                return this.filters.every(filter => {
                    const cellValue = (row[filter.column] || '').toString().toLowerCase();
                    const filterValue = filter.value ? filter.value.toLowerCase() : '';
                    
                    switch (filter.operator) {
                        case 'contains': return cellValue.includes(filterValue);
                        case 'equals': return cellValue === filterValue;
                        case 'starts_with': return cellValue.startsWith(filterValue);
                        case 'ends_with': return cellValue.endsWith(filterValue);
                        case 'not_contains': return !cellValue.includes(filterValue);
                        case 'not_equals': return cellValue !== filterValue;
                        case 'is_empty': return cellValue === '';
                        case 'is_not_empty': return cellValue !== '';
                        case 'regex':
                            try {
                                const regex = new RegExp(filter.value, 'i');
                                return regex.test(cellValue);
                            } catch (e) {
                                return false;
                            }
                        default: return true;
                    }
                });
            });
        } else {
            this.filteredData = this.filteredData.filter(row => {
                return this.headers.some(header => {
                    const cellValue = (row[header] || '').toString().toLowerCase();
                    return cellValue.includes(searchTerm);
                });
            });
        }
        
        this.currentPage = 1;
        this.renderTable();
        this.renderPagination();
        document.getElementById('totalRows').textContent = this.filteredData.length;
    }

    // Bulk selection methods
    toggleSelectAll(event) {
        const isChecked = event.target.checked;
        document.querySelectorAll('.row-checkbox').forEach(checkbox => {
            checkbox.checked = isChecked;
        });
        this.updateBulkActions();
    }

    updateBulkActions() {
        const selectedRows = document.querySelectorAll('.row-checkbox:checked');
        const bulkActions = document.querySelector('.bulk-actions');
        
        if (!bulkActions) {
            // Create bulk actions bar if it doesn't exist
            const bulkActionsHtml = `
                <div class="bulk-actions" id="bulkActions">
                    <span class="bulk-count">0 rows selected</span>
                    <button class="btn btn-secondary" onclick="csvTool.exportSelectedRows()">Export Selected</button>
                    <button class="btn btn-danger" onclick="csvTool.deleteSelectedRows()">Delete Selected</button>
                    <button class="btn btn-secondary" onclick="csvTool.clearSelection()">Clear Selection</button>
                </div>
            `;
            document.querySelector('.results-header').insertAdjacentHTML('afterend', bulkActionsHtml);
        }
        
        const bulkActionsElement = document.getElementById('bulkActions');
        const bulkCount = bulkActionsElement.querySelector('.bulk-count');
        
        if (selectedRows.length > 0) {
            bulkActionsElement.classList.add('show');
            bulkCount.textContent = `${selectedRows.length} row${selectedRows.length !== 1 ? 's' : ''} selected`;
        } else {
            bulkActionsElement.classList.remove('show');
        }
    }

    exportSelectedRows() {
        const selectedIndices = Array.from(document.querySelectorAll('.row-checkbox:checked'))
            .map(cb => parseInt(cb.dataset.rowIndex));
        
        if (selectedIndices.length === 0) {
            alert('No rows selected');
            return;
        }
        
        const selectedData = selectedIndices.map(index => this.filteredData[index]);
        const originalFilteredData = this.filteredData;
        this.filteredData = selectedData;
        
        this.downloadData('csv');
        
        this.filteredData = originalFilteredData;
        this.log('success', `Exported ${selectedData.length} selected rows`);
    }

    deleteSelectedRows() {
        const selectedIndices = Array.from(document.querySelectorAll('.row-checkbox:checked'))
            .map(cb => parseInt(cb.dataset.rowIndex))
            .sort((a, b) => b - a); // Sort in descending order for safe deletion
        
        if (selectedIndices.length === 0) {
            alert('No rows selected');
            return;
        }
        
        if (!confirm(`Delete ${selectedIndices.length} selected rows?`)) {
            return;
        }
        
        selectedIndices.forEach(index => {
            this.filteredData.splice(index, 1);
        });
        
        this.currentPage = 1;
        this.renderTable();
        this.renderPagination();
        document.getElementById('totalRows').textContent = this.filteredData.length;
        this.clearSelection();
        
        this.log('success', `Deleted ${selectedIndices.length} rows`);
    }

    clearSelection() {
        document.querySelectorAll('.row-checkbox').forEach(checkbox => {
            checkbox.checked = false;
        });
        document.getElementById('selectAllRows').checked = false;
        this.updateBulkActions();
    }

    // Utility method for debouncing
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    // Show all results without limit
    showAllResults() {
        this.log('info', 'Removing 50-row limit and showing all matching results...');
        
        // Re-apply filters without limit
        this.applyFiltersWithoutLimit();
        
        this.log('success', 'Now showing all matching results');
    }
    
    // File Processing Completion
    completeFileProcessing() {
        try {
            this.showLoadingIndicator('Processing data analysis...');
            
            // Step 1: Detect column data types
            setTimeout(() => {
                try {
                    this.log('info', 'Detecting column data types...');
                    this.detectColumnDataTypes();
                    this.log('info', 'Column data types detected successfully');
                    
                    // Step 2: Generate auto-suggested filters
                    setTimeout(() => {
                        try {
                            this.log('info', 'Generating auto-suggested filters...');
                            this.generateAutoSuggestedFilters();
                            this.log('info', 'Auto-suggested filters generated successfully');
                            
                            // Step 3: Set up UI sections
                            setTimeout(() => {
                                try {
                                    this.log('info', 'Setting up user interface sections...');
                                    this.showFileInfoSection();
                                    this.showAnalysisSection();
                                    this.showFilterSection();
                                    this.addFilter(); // Add initial filter
                                    
                                    this.hideLoadingIndicator();
                                    this.log('success', 'File processing completed successfully!');
                                } catch (error) {
                                    this.log('error', `Error setting up UI: ${error.message}`);
                                    this.hideLoadingIndicator();
                                    this.handleProcessingError(error, 'UI setup');
                                }
                            }, 100);
                        } catch (error) {
                            this.log('error', `Error generating suggestions: ${error.message}`);
                            this.hideLoadingIndicator();
                            this.handleProcessingError(error, 'auto-suggestions');
                        }
                    }, 100);
                } catch (error) {
                    this.log('error', `Error detecting data types: ${error.message}`);
                    this.hideLoadingIndicator();
                    this.handleProcessingError(error, 'data type detection');
                }
            }, 100);
            
            // Timeout protection - if processing takes too long, force completion
            setTimeout(() => {
                if (document.getElementById('loadingIndicator')?.classList.contains('show')) {
                    this.log('warning', 'Processing timeout - forcing completion');
                    this.hideLoadingIndicator();
                    this.forceProcessingCompletion();
                }
            }, 30000); // 30 second timeout
            
        } catch (error) {
            this.log('error', `Critical error in file processing: ${error.message}`);
            this.hideLoadingIndicator();
            this.handleProcessingError(error, 'complete file processing');
        }
    }
    
    // Handle processing errors gracefully
    handleProcessingError(error, stage) {
        console.error(`Error in ${stage}:`, error);
        this.log('error', `Processing failed at ${stage}. Continuing with basic functionality...`);
        
        // Still show basic sections even if advanced features fail
        this.forceProcessingCompletion();
    }
    
    // Force completion with minimal functionality
    forceProcessingCompletion() {
        try {
            this.log('info', 'Setting up basic interface...');
            this.showAnalysisSection();
            this.showFilterSection();
            this.addFilter();
            this.log('warning', 'File loaded with basic functionality only');
        } catch (error) {
            this.log('error', 'Failed to load basic interface. Please refresh and try again.');
            console.error('Force completion error:', error);
        }
    }
    
    // Loading Indicator Management
    showLoadingIndicator(message = 'Processing...') {
        let indicator = document.getElementById('loadingIndicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'loadingIndicator';
            indicator.className = 'loading-indicator show';
            indicator.innerHTML = `
                <div class="loading-spinner"></div>
                <div class="loading-message">${message}</div>
            `;
            document.body.appendChild(indicator);
        } else {
            indicator.querySelector('.loading-message').textContent = message;
            indicator.classList.add('show');
        }
    }
    
    hideLoadingIndicator() {
        const indicator = document.getElementById('loadingIndicator');
        if (indicator) {
            indicator.classList.remove('show');
        }
    }
    
    // Test button functionality
    testButtonFunctionality() {
        const darkModeBtn = document.getElementById('darkModeBtn');
        const docsBtn = document.getElementById('docsBtn');
        
        this.log('info', 'Testing button functionality...');
        
        if (darkModeBtn) {
            this.log('success', 'Dark mode button found and ready');
            // Ensure the button text is correct
            this.updateDarkModeButton();
        } else {
            this.log('error', 'Dark mode button not found in DOM');
        }
        
        if (docsBtn) {
            this.log('success', 'Documentation button found and ready');
        } else {
            this.log('error', 'Documentation button not found in DOM');
        }
        
        // Log all available buttons for debugging
        const allButtons = document.querySelectorAll('button');
        this.debugLog(`Total buttons found: ${allButtons.length}`);
        allButtons.forEach((btn, index) => {
            this.debugLog(`Button ${index}: id='${btn.id}', text='${btn.textContent.trim()}'`);
        });
    }

    // Mobile Gesture Support
    initializeMobileGestures() {
        let startX, startY, currentX, currentY;
        let isSwipingTable = false;
        
        const tableContainer = document.querySelector('.table-container');
        if (!tableContainer) return;
        
        tableContainer.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            isSwipingTable = true;
        }, { passive: true });
        
        tableContainer.addEventListener('touchmove', (e) => {
            if (!isSwipingTable) return;
            
            currentX = e.touches[0].clientX;
            currentY = e.touches[0].clientY;
            
            const deltaX = startX - currentX;
            const deltaY = startY - currentY;
            
            // Horizontal swipe for pagination
            if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
                e.preventDefault();
                
                if (deltaX > 0 && this.currentPage < Math.ceil(this.filteredData.length / this.rowsPerPage)) {
                    // Swipe left - next page
                    this.goToPage(this.currentPage + 1);
                    this.log('info', 'Swiped to next page');
                } else if (deltaX < 0 && this.currentPage > 1) {
                    // Swipe right - previous page
                    this.goToPage(this.currentPage - 1);
                    this.log('info', 'Swiped to previous page');
                }
                
                isSwipingTable = false;
            }
        }, { passive: false });
        
        tableContainer.addEventListener('touchend', () => {
            isSwipingTable = false;
        });
        
        // Pull to refresh on upload area
        const uploadArea = document.getElementById('uploadArea');
        if (uploadArea) {
            let pullDistance = 0;
            
            uploadArea.addEventListener('touchstart', (e) => {
                startY = e.touches[0].clientY;
            }, { passive: true });
            
            uploadArea.addEventListener('touchmove', (e) => {
                currentY = e.touches[0].clientY;
                pullDistance = currentY - startY;
                
                if (pullDistance > 100 && window.scrollY === 0) {
                    uploadArea.style.transform = `translateY(${Math.min(pullDistance - 100, 50)}px)`;
                    uploadArea.style.opacity = Math.max(0.5, 1 - (pullDistance - 100) / 200);
                }
            }, { passive: true });
            
            uploadArea.addEventListener('touchend', () => {
                if (pullDistance > 150 && window.scrollY === 0) {
                    this.log('info', 'Pull to refresh triggered');
                    location.reload();
                }
                
                uploadArea.style.transform = '';
                uploadArea.style.opacity = '';
                pullDistance = 0;
            });
        }
    }

    // Virtual Scrolling Implementation
    initializeVirtualScrolling() {
        if (this.filteredData.length < 1000) {
            // Use regular pagination for smaller datasets
            return false;
        }
        
        const tableContainer = document.querySelector('.table-container');
        if (!tableContainer) return false;
        
        // Create virtual scroll container
        const virtualContainer = document.createElement('div');
        virtualContainer.className = 'virtual-scroll-container';
        virtualContainer.innerHTML = `
            <div class="virtual-spacer-top"></div>
            <div class="virtual-viewport"></div>
            <div class="virtual-spacer-bottom"></div>
        `;
        
        tableContainer.parentNode.replaceChild(virtualContainer, tableContainer);
        
        this.virtualScroll = {
            container: virtualContainer,
            viewport: virtualContainer.querySelector('.virtual-viewport'),
            spacerTop: virtualContainer.querySelector('.virtual-spacer-top'),
            spacerBottom: virtualContainer.querySelector('.virtual-spacer-bottom'),
            rowHeight: 40,
            visibleRows: Math.ceil(400 / 40),
            startIndex: 0,
            endIndex: 0
        };
        
        this.updateVirtualScroll();
        
        virtualContainer.addEventListener('scroll', this.debounce(() => {
            this.updateVirtualScroll();
        }, 16)); // 60fps
        
        this.log('info', `Virtual scrolling enabled for ${this.filteredData.length} rows`);
        return true;
    }
    
    updateVirtualScroll() {
        if (!this.virtualScroll) return;
        
        const scrollTop = this.virtualScroll.container.scrollTop;
        const containerHeight = this.virtualScroll.container.clientHeight;
        
        this.virtualScroll.startIndex = Math.floor(scrollTop / this.virtualScroll.rowHeight);
        this.virtualScroll.endIndex = Math.min(
            this.virtualScroll.startIndex + this.virtualScroll.visibleRows + 5, // Buffer rows
            this.filteredData.length
        );
        
        // Update spacers
        this.virtualScroll.spacerTop.style.height = 
            `${this.virtualScroll.startIndex * this.virtualScroll.rowHeight}px`;
        this.virtualScroll.spacerBottom.style.height = 
            `${(this.filteredData.length - this.virtualScroll.endIndex) * this.virtualScroll.rowHeight}px`;
        
        // Render visible rows
        const visibleData = this.filteredData.slice(this.virtualScroll.startIndex, this.virtualScroll.endIndex);
        
        this.virtualScroll.viewport.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th class="bulk-select-cell"><input type="checkbox" id="selectAllRows" class="bulk-select-checkbox"></th>
                        ${this.headers.map(header => `<th class="sortable" onclick="csvTool.sortColumn('${header}')">${header}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${visibleData.map((row, index) => {
                        const globalIndex = this.virtualScroll.startIndex + index;
                        return `
                            <tr class="virtual-row">
                                <td class="bulk-select-cell"><input type="checkbox" class="bulk-select-checkbox row-checkbox" data-row-index="${globalIndex}"></td>
                                ${this.headers.map(header => `<td>${this.escapeHtml(row[header] || '')}</td>`).join('')}
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
        
        // Re-attach event listeners
        document.querySelectorAll('.row-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', this.updateBulkActions.bind(this));
        });
        
        const selectAllCheckbox = document.getElementById('selectAllRows');
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', this.toggleSelectAll.bind(this));
        }
    }

    // Auto-suggested Filters
    generateAutoSuggestedFilters() {
        try {
            this.autoSuggestPatterns = [];
            
            if (!this.headers || this.headers.length === 0) {
                this.log('warning', 'No headers found for auto-suggestion generation');
                return;
            }
            
            if (!this.csvData || this.csvData.length === 0) {
                this.log('warning', 'No data found for auto-suggestion generation');
                return;
            }
            
            // Skip auto-suggestions for very large datasets to prevent performance issues
            if (this.csvData.length > 50000) {
                this.log('info', 'Skipping auto-suggestions for large dataset (>50k rows)');
                return;
            }
        
        this.headers.forEach((header, headerIndex) => {
            // Add progress logging for large datasets
            if (this.csvData.length > 5000 && headerIndex % 5 === 0) {
                this.log('info', `Processing suggestions for column ${headerIndex + 1}/${this.headers.length}: ${header}`);
            }
            
            // Sample data for large datasets instead of processing all rows
            const sampleSize = Math.min(this.csvData.length, 1000);
            const sampleData = this.csvData.slice(0, sampleSize);
            const values = sampleData.map(row => row[header]).filter(val => val && val.trim());
            const type = this.columnDataTypes[header];
            
            // Suggest filters for common patterns
            if (type === 'text') {
                // Find common prefixes/suffixes
                const prefixes = new Map();
                const suffixes = new Map();
                
                // Process only first 500 values for performance
                const valuesToProcess = values.slice(0, 500);
                valuesToProcess.forEach(value => {
                    const str = value.toString().trim();
                    if (str.length > 3) {
                        const prefix = str.substring(0, 3);
                        const suffix = str.substring(str.length - 3);
                        
                        prefixes.set(prefix, (prefixes.get(prefix) || 0) + 1);
                        suffixes.set(suffix, (suffixes.get(suffix) || 0) + 1);
                    }
                });
                
                // Suggest patterns that appear in >10% of sampled values
                const threshold = Math.max(2, values.length * 0.1);
                
                prefixes.forEach((count, prefix) => {
                    if (count > threshold) {
                        this.autoSuggestPatterns.push({
                            column: header,
                            operator: 'starts_with',
                            value: prefix,
                            reason: `${count} values start with "${prefix}"`,
                            confidence: (count / values.length * 100).toFixed(1)
                        });
                    }
                });
                
                suffixes.forEach((count, suffix) => {
                    if (count > threshold) {
                        this.autoSuggestPatterns.push({
                            column: header,
                            operator: 'ends_with',
                            value: suffix,
                            reason: `${count} values end with "${suffix}"`,
                            confidence: (count / values.length * 100).toFixed(1)
                        });
                    }
                });
            }
            
            if (type === 'number') {
                const numericValues = values.map(v => parseFloat(v)).filter(v => !isNaN(v));
                if (numericValues.length > 0) {
                    const avg = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
                    const aboveAvg = numericValues.filter(v => v > avg).length;
                    
                    if (aboveAvg > numericValues.length * 0.3) {
                        this.autoSuggestPatterns.push({
                            column: header,
                            operator: 'regex',
                            value: `^[${Math.floor(avg)}-9]`,
                            reason: `${aboveAvg} values above average (${avg.toFixed(2)})`,
                            confidence: (aboveAvg / numericValues.length * 100).toFixed(1)
                        });
                    }
                }
            }
            
            // Detect empty values (use sample data for large datasets)
            const totalSampleSize = Math.min(this.csvData.length, 1000);
            const emptyCount = totalSampleSize - values.length;
            if (emptyCount > totalSampleSize * 0.05) {
                this.autoSuggestPatterns.push({
                    column: header,
                    operator: 'is_empty',
                    value: '',
                    reason: `${emptyCount} empty values detected (sampled)`,
                    confidence: (emptyCount / totalSampleSize * 100).toFixed(1)
                });
            }
        });
        
        // Sort by confidence
        this.autoSuggestPatterns.sort((a, b) => parseFloat(b.confidence) - parseFloat(a.confidence));
        
            // Auto-suggested filters feature disabled per user request
            // if (this.autoSuggestPatterns.length > 0) {
            //     this.log('info', `Generated ${this.autoSuggestPatterns.length} auto-suggested filters`);
            //     setTimeout(() => {
            //         try {
            //             this.showAutoSuggestedFilters();
            //         } catch (showError) {
            //             this.log('warning', `Error showing auto-suggestions: ${showError.message}`);
            //         }
            //     }, 10);
            // } else {
            //     this.log('info', 'No auto-suggestions generated');
            // }
        } catch (error) {
            this.log('error', `Error generating auto-suggestions: ${error.message}`);
            console.error('Auto-suggestion generation error:', error);
            this.autoSuggestPatterns = [];
        }
    }
    
    showAutoSuggestedFilters() {
        try {
            const analysisSection = document.getElementById('analysisSection');
            if (!analysisSection) {
                this.log('warning', 'Analysis section not found for auto-suggestions');
                return;
            }
            
            if (!this.autoSuggestPatterns || this.autoSuggestPatterns.length === 0) {
                this.log('info', 'No auto-suggestions to display');
                return;
            }
            
            // Check if suggestions already exist
            if (document.getElementById('autoSuggestionsSection')) {
                this.log('info', 'Auto-suggestions already displayed');
                return;
            }
            
            const suggestionsHtml = `
                <div class="bg-gray-700 rounded-lg p-6 border border-gray-600 mt-6" id="autoSuggestionsSection">
                    <h3 class="text-xl font-bold text-white mb-3">
                        <i class="fas fa-magic mr-2 text-purple-400"></i>Auto-Suggested Filters
                    </h3>
                    <p class="text-gray-400 mb-4">Based on data analysis, here are some recommended filters:</p>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        ${this.autoSuggestPatterns.slice(0, 6).map((pattern, index) => `
                            <div class="bg-gray-800 border border-gray-600 rounded-lg p-4 cursor-pointer hover:border-purple-400 hover:shadow-lg transition-all duration-200" onclick="if(window.csvTool) csvTool.applyAutoSuggestedFilter(${index})">
                                <div class="flex justify-between items-start mb-2">
                                    <strong class="text-blue-400 text-sm font-semibold">${this.escapeHtml(pattern.column || '')}</strong>
                                    <span class="bg-purple-500 bg-opacity-20 text-purple-400 text-xs px-2 py-1 rounded-full">${pattern.confidence || '0'}%</span>
                                </div>
                                <div class="text-gray-300 text-sm mb-2 font-mono">
                                    ${(pattern.operator || '').replace('_', ' ')} "${this.escapeHtml(pattern.value || '')}"
                                </div>
                                <div class="text-gray-500 text-xs">${this.escapeHtml(pattern.reason || '')}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
            
            analysisSection.insertAdjacentHTML('beforeend', suggestionsHtml);
            this.log('info', `Displayed ${Math.min(this.autoSuggestPatterns.length, 6)} auto-suggested filters`);
        } catch (error) {
            this.log('error', `Error showing auto-suggestions: ${error.message}`);
            console.error('Show auto-suggestions error:', error);
        }
    }
    
    applyAutoSuggestedFilter(index) {
        const pattern = this.autoSuggestPatterns[index];
        if (!pattern) return;
        
        // Add a new filter with the suggested pattern
        this.addFilter();
        const lastFilter = document.querySelector('.filter-row:last-child');
        
        lastFilter.querySelector('.filter-column').value = pattern.column;
        lastFilter.querySelector('.filter-operator').value = pattern.operator;
        lastFilter.querySelector('.filter-value').value = pattern.value;
        
        this.log('success', `Applied auto-suggested filter: ${pattern.column} ${pattern.operator} "${pattern.value}"`);
        
        // Scroll to filter section
        document.getElementById('filterSection').scrollIntoView({ behavior: 'smooth' });
    }

    // Dark Mode Toggle
    initializeDarkMode() {
        this.log('info', `Initializing dark mode. Current setting: ${this.darkMode}`);
        if (this.darkMode) {
            document.body.classList.add('dark-mode');
        }
        this.updateDarkModeButton();
    }
    
    toggleDarkMode() {
        try {
            this.darkMode = !this.darkMode;
            document.body.classList.toggle('dark-mode', this.darkMode);
            localStorage.setItem('csvTool_darkMode', this.darkMode.toString());
            this.updateDarkModeButton();
            this.log('info', `Dark mode ${this.darkMode ? 'enabled' : 'disabled'}`);
        } catch (e) {
            console.error('Error toggling dark mode:', e);
            this.log('error', 'Failed to toggle dark mode');
        }
    }
    
    updateDarkModeButton() {
        try {
            const darkModeBtn = document.getElementById('darkModeBtn');
            if (darkModeBtn) {
                darkModeBtn.innerHTML = this.darkMode ? '☀️ Light Mode' : '🌙 Dark Mode';
                this.debugLog(`Dark mode button updated: ${darkModeBtn.innerHTML}`);
            } else {
                this.debugLog('Dark mode button not found in DOM');
            }
        } catch (e) {
            console.error('Error updating dark mode button:', e);
        }
    }

    // Keyboard Shortcuts
    handleKeyboardShortcuts(e) {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 'f':
                    e.preventDefault();
                    this.addFilter();
                    break;
                case 'Enter':
                    e.preventDefault();
                    this.applyFilters();
                    break;
            }
        }
    }

    // Enhanced Download with Multiple Formats
    downloadData(format = 'csv') {
        if (this.filteredData.length === 0) {
            alert('No data to download');
            return;
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const visibleHeaders = this.getVisibleHeaders();
        let content, mimeType, filename;

        switch (format) {
            case 'json':
                // For JSON, only include visible fields
                const jsonData = this.filteredData.map(row => {
                    const filteredRow = {};
                    visibleHeaders.forEach(header => {
                        filteredRow[header] = row[header];
                    });
                    return filteredRow;
                });
                content = JSON.stringify(jsonData, null, 2);
                mimeType = 'application/json';
                filename = `filtered_data_${timestamp}.json`;
                break;
            case 'excel':
                // Simple Excel format (CSV with .xlsx extension)
                content = [visibleHeaders.join(','), ...this.filteredData.map(row => 
                    visibleHeaders.map(header => this.formatCSVCell(row[header] || '')).join(',')
                )].join('\n');
                mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
                filename = `filtered_data_${timestamp}.xlsx`;
                break;
            default: // csv
                content = [visibleHeaders.join(','), ...this.filteredData.map(row => 
                    visibleHeaders.map(header => this.formatCSVCell(row[header] || '')).join(',')
                )].join('\n');
                mimeType = 'text/csv;charset=utf-8;';
                filename = `filtered_data_${timestamp}.csv`;
        }

        const blob = new Blob([content], { type: mimeType });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.log('success', `Data exported as ${format.toUpperCase()}: ${filename}`);
    }

    // Column Sorting
    sortColumn(columnName, direction = 'asc') {
        const type = this.columnDataTypes[columnName] || 'text';
        
        this.filteredData.sort((a, b) => {
            let aVal = a[columnName] || '';
            let bVal = b[columnName] || '';
            
            if (type === 'number') {
                aVal = parseFloat(aVal) || 0;
                bVal = parseFloat(bVal) || 0;
            } else if (type === 'date') {
                aVal = new Date(aVal);
                bVal = new Date(bVal);
            } else {
                aVal = aVal.toString().toLowerCase();
                bVal = bVal.toString().toLowerCase();
            }
            
            if (aVal < bVal) return direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return direction === 'asc' ? 1 : -1;
            return 0;
        });
        
        this.currentPage = 1;
        this.renderTable();
        this.renderPagination();
        this.log('info', `Sorted by ${columnName} (${direction})`);
    }

}

// Standalone dark mode function for fallback
function toggleDarkModeStandalone() {
    try {
        const currentDarkMode = document.body.classList.contains('dark-mode');
        const newDarkMode = !currentDarkMode;
        
        document.body.classList.toggle('dark-mode', newDarkMode);
        localStorage.setItem('csvTool_darkMode', newDarkMode.toString());
        
        // Update button text
        const darkModeBtn = document.getElementById('darkModeBtn');
        if (darkModeBtn) {
            darkModeBtn.innerHTML = newDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode';
        }
        
        console.log(`Dark mode ${newDarkMode ? 'enabled' : 'disabled'} (standalone)`);
    } catch (e) {
        console.error('Error toggling dark mode:', e);
    }
}

// Initialize dark mode from localStorage on page load
function initializeDarkModeStandalone() {
    try {
        const darkMode = localStorage.getItem('csvTool_darkMode') === 'true';
        if (darkMode) {
            document.body.classList.add('dark-mode');
        }
        
        // Update button text
        const darkModeBtn = document.getElementById('darkModeBtn');
        if (darkModeBtn) {
            darkModeBtn.innerHTML = darkMode ? '☀️ Light Mode' : '🌙 Dark Mode';
        }
    } catch (e) {
        console.warn('Failed to initialize dark mode:', e);
    }
}

// Initialize standalone dark mode immediately
initializeDarkModeStandalone();

// Initialize the tool when DOM is ready
let csvTool;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        csvTool = new CSVFilterTool();
    });
} else {
    csvTool = new CSVFilterTool();
}