# Romain's Vonage Tools Hub

**Version:** v1.2.0
**Author:** Romain EDIN

A unified web-based hub for managing multiple Vonage telecommunications tools and utilities.

![Version](https://img.shields.io/badge/version-1.2.0-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green.svg)
![License](https://img.shields.io/badge/license-ISC-yellow.svg)

---

## 🌟 Overview

This hub provides a centralized interface for various Vonage management tools, all harmonized with a consistent dark-themed design using Tailwind CSS and Alpine.js. Each tool is accessible through a clean landing page with easy navigation.

---

## 🛠️ Available Tools

### 1. Rakuten Security Report Builder (v2.2.0)
**Status:** ✅ Fully Functional

**Purpose:** Generate comprehensive security reports for Rakuten with call analysis and duration matrices.

**Features:**
- FC (Foreign Carrier) analysis
- Call duration matrices (Originate × Terminate)
- Interactive charts with Chart.js
- Spreadsheet paste functionality
- CSV export capabilities

**Access:** `/rakuten-report`

---

### 2. Vonage Reports API Filter Tool (v2.0.0)
**Status:** ✅ Fully Functional

**Purpose:** Advanced filtering and processing of Vonage Reports API CSV data.

**Features:**
- Advanced CSV filtering with regex support
- Multiple export formats (CSV, JSON, Excel)
- Column analysis and statistics
- Internal fields removal
- Real-time preview

**Access:** `/report-filtering`

---

### 3. Vonage Numbers Manager (v2.2.2)
**Status:** ✅ Fully Functional

**Purpose:** Comprehensive management interface for Vonage phone numbers.

**Features:**
- **Credential Management:** Save, load, and delete API credentials locally
- **Account Information:** Real-time balance display
- **View Owned Numbers:** Complete listing with bulk selection
- **Search Available Numbers:** Filter by country, type, features, and pattern
- **Purchase Numbers:** Buy numbers with confirmation modal
- **Cancel Numbers:** Remove numbers with safety warnings
- **Real-time Logging:** WebSocket-powered activity monitoring

**Tech Stack:**
- Backend: Node.js + Express.js
- Frontend: Alpine.js + Tailwind CSS
- Real-time: WebSocket
- API: Vonage Server SDK v3 + Auth

**Access:** `/number-manager`

#### Usage Instructions

##### 1. Connect to Vonage API
1. Enter your Vonage API Key and API Secret
2. Click "Connect Account"
3. Upon successful connection, your account balance and owned numbers will load automatically

##### 2. Manage Credentials
- **Save Credentials:** Click "Save Credentials" to store them locally (base64 encoded)
- **Load Saved:** Click "Load Saved" to retrieve previously saved credentials
- **Clear Fields:** Click "Clear Fields" to remove credentials from input fields

##### 3. View Your Numbers
- All owned numbers appear in the "Your Phone Numbers" section
- Select numbers using checkboxes for bulk operations
- Click "Refresh" to update the list

##### 4. Search for Available Numbers
1. Enter a 2-letter country code (e.g., US, GB, FR)
2. Optionally select number type (Landline, Mobile, Toll-free)
3. Choose required features (SMS, VOICE, MMS, or combinations)
4. Add a pattern if searching for specific number sequences (e.g., 555*)
5. Click "Search Available Numbers"

##### 5. Purchase Numbers
1. Select numbers from the search results using checkboxes
2. Click "Buy Selected (X)" button
3. Review the purchase confirmation modal
4. Click "Confirm Purchase" to proceed
5. Monitor the activity log for purchase status

##### 6. Cancel Numbers
1. Select numbers from your owned numbers using checkboxes
2. Click "Cancel Selected (X)" button
3. **Read the warning carefully** - this action is irreversible
4. Confirm cancellation if you're certain
5. Monitor the activity log for cancellation status

##### 7. Activity Log
- View real-time logs of all operations
- Color-coded messages:
  - 🟢 Green: Success/Info
  - 🟡 Yellow: Warnings
  - 🔴 Red: Errors
- Toggle auto-scroll on/off
- Clear log when needed

#### Security Notes
- Credentials are stored with base64 encoding (basic obfuscation)
- Session-based architecture (no credentials stored on server)
- All operations use secure HTTPS in production
- Purchase and cancel operations require explicit confirmation

---

### 4. Vonage Management Suite (v1.3.0)
**Status:** ⏳ Coming Soon

**Purpose:** Combined interface for numbers and subaccount balance management.

**Planned Features:**
- All Number Manager features
- Subaccount balance viewing
- Balance transfer between subaccounts
- Balance history charts
- Dual WebSocket logging

**Tech Stack:** Node.js + Express + Alpine.js + Tailwind CSS + WebSocket

**Access:** `/management-suite` (placeholder)

---

## 🚀 Installation & Setup

### Prerequisites
- Node.js >= 18.0.0
- npm (comes with Node.js)
- Vonage API credentials (API Key and Secret)

### Installation Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Romain-ED/Romain-Vonage-Tools-Hub.git
   cd Romain-Vonage-Tools-Hub
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the server:**
   ```bash
   npm start
   ```

4. **Access the hub:**
   - Open your browser to: `http://localhost:3000`
   - Navigate to the tool you want to use

### Development Mode
For auto-restart on file changes:
```bash
npm run dev
```

---

## 📁 Project Structure

```
Romain-Vonage-Tools-Hub/
├── server.mjs                 # Main Express server
├── package.json              # Dependencies and scripts
├── vcr.yml                   # VCR deployment config
├── README.md                 # This file
├── PROGRESS.md              # Development progress tracker
├── lib/                      # Backend libraries
│   ├── credentials.mjs      # Credential management
│   └── vonageClient.mjs     # Vonage API client wrapper
├── api/                      # API route handlers
│   └── numberManager.mjs    # Number Manager endpoints
├── data/                     # Local data storage (gitignored)
│   └── vonage_credentials.json
└── public/                   # Static frontend files
    ├── index.html           # Landing page
    ├── changelog.html       # Version history
    ├── rakuten-report/      # Rakuten tool
    ├── report-filtering/    # Filtering tool
    ├── number-manager/      # Number Manager
    │   ├── index.html       # Frontend UI
    │   └── app.js           # Alpine.js component
    └── management-suite/    # Management Suite (WIP)
```

---

## 🔧 Configuration

### Environment Variables
- `PORT` or `VCR_PORT`: Server port (default: 3000)
- `HOST` or `VCR_HOST`: Server host (default: 0.0.0.0)
- `NODE_ENV`: Environment mode (development/production)
- `VCR_INSTANCE_PUBLIC_URL`: Public URL for VCR deployment

### VCR Deployment
The hub is configured for Vonage Cloud Runtime (VCR) deployment:
```yaml
project:
  name: romain-vonage-tools-hub
instance:
  name: production
  runtime: nodejs22
  region: aws.apse1
  entrypoint: [node, server.mjs]
```

---

## 🌐 API Endpoints

### Health Check
- `GET /_/health` - VCR health check endpoint
- `GET /health` - Detailed health status JSON

### Number Manager API
All endpoints are prefixed with `/number-manager/api/`

#### Credentials
- `GET /credentials/load` - Load saved credentials
- `POST /credentials/save` - Save credentials locally
- `DELETE /credentials` - Delete saved credentials

#### Connection
- `POST /connect` - Connect to Vonage API

#### Account
- `GET /account/balance` - Get account balance

#### Numbers
- `GET /numbers/owned` - List owned numbers
- `POST /numbers/search` - Search available numbers
- `POST /numbers/buy` - Purchase a number
- `POST /numbers/cancel` - Cancel a number

#### Subaccounts
- `GET /subaccounts` - List subaccounts (placeholder)

### WebSocket
- `WS /number-manager/ws/logs` - Real-time activity logging

---

## 🧪 Testing

### Manual Testing Checklist

#### Number Manager
- [ ] Load/save/delete credentials
- [ ] Connect to Vonage API with valid credentials
- [ ] View account balance
- [ ] List owned numbers
- [ ] Search available numbers (various filters)
- [ ] Purchase a number (use test account!)
- [ ] Cancel a number (use test number!)
- [ ] WebSocket logging displays messages
- [ ] All error states handled gracefully
- [ ] Responsive design on mobile/tablet

### API Testing with cURL

**Load credentials:**
```bash
curl http://localhost:3000/number-manager/api/credentials/load
```

**Connect:**
```bash
curl -X POST http://localhost:3000/number-manager/api/connect \
  -H "Content-Type: application/json" \
  -d '{"api_key":"YOUR_KEY","api_secret":"YOUR_SECRET"}'
```

**Get balance:**
```bash
curl http://localhost:3000/number-manager/api/account/balance?session_id=default
```

**Search numbers:**
```bash
curl -X POST http://localhost:3000/number-manager/api/numbers/search \
  -H "Content-Type: application/json" \
  -d '{"country":"US","features":"SMS,VOICE","session_id":"default"}'
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. "Cannot read properties of undefined (reading 'getBalance')" ✅ FIXED in v1.2.0
**Symptom:** Balance shows "N/A" after connecting, error in logs
**Cause:** Vonage SDK v3 requires proper Auth class initialization
**Solution:** The SDK client now uses correct initialization:
```javascript
import { Auth } from '@vonage/auth';
import { Vonage } from '@vonage/server-sdk';

const credentials = new Auth({
    apiKey: apiKey,
    apiSecret: apiSecret
});
const vonage = new Vonage(credentials);
```
**Status:** Fixed in v1.2.0 - restart server to apply fix

#### 2. Port Already in Use
**Symptom:** Server fails to start
**Solution:** Kill existing process or change port
```bash
# Find process
lsof -i :3000
# Kill process
kill -9 <PID>
```

#### 3. WebSocket Connection Failed
**Symptom:** Real-time logs not working
**Solution:** Check browser console, ensure WebSocket URL is correct
**Verify:** Should connect to `ws://localhost:3000/number-manager/ws/logs`

#### 4. Credentials Not Saving
**Symptom:** Saved credentials not persisting
**Solution:** Check `data/` directory exists and is writable
```bash
mkdir -p data
chmod 755 data
```

#### 5. Numbers Not Loading
**Symptom:** Empty numbers list after connection
**Possible Causes:**
- No numbers on account
- API credentials incorrect
- Network/firewall issues
**Solution:** Check activity log for specific error messages

#### 6. Server Restart Required
**When to restart:**
- After installing new dependencies (`npm install`)
- After modifying backend code (`lib/`, `api/`, `server.mjs`)
- When SDK errors occur
**How to restart:**
```bash
# Stop server (Ctrl+C)
# Start again
npm start
```

---

## 📊 Progress & Roadmap

**Current Status:** ~60% Complete

### Completed (v1.2.0)
- ✅ Hub infrastructure and landing page
- ✅ Rakuten Security Report Builder
- ✅ Vonage Reports API Filter Tool
- ✅ **Vonage Numbers Manager** (Backend + Frontend)
  - ✅ All API endpoints
  - ✅ Harmonized UI
  - ✅ WebSocket logging
  - ✅ Full testing completed
  - ✅ SDK v3 fix applied

### In Progress
- None currently

### Upcoming
- ⏳ Vonage Management Suite (Backend + Frontend)
  - Estimated: 6-8 hours
  - Combined Numbers + Subaccounts management
- ⏳ Final testing and polish
- ⏳ Additional documentation

---

## 🔗 Resources

- **GitHub Repository:** https://github.com/Romain-ED/Romain-Vonage-Tools-Hub
- **Vonage Developer Portal:** https://developer.vonage.com/
- **Vonage Server SDK (Node.js):** https://developer.vonage.com/en/sdk/server-sdk/node
- **Alpine.js Documentation:** https://alpinejs.dev/
- **Tailwind CSS Documentation:** https://tailwindcss.com/

---

## 📝 Changelog

### v1.2.0 (2025-11-20)
**Major Update: Management Suite Complete + Critical SDK Fixes**
- 🎉 **NEW:** Vonage Management Suite (v1.3.0) - Unified Numbers & Subaccounts Management
- ✨ Complete backend API for subaccounts (create, list, balance, transfer)
- ✨ Tabbed frontend interface (Numbers + Subaccounts tabs)
- ✨ Credit transfer functionality between master and subaccounts
- ✨ Dual WebSocket logging for both Number Manager and Management Suite
- 🐛 **CRITICAL FIX:** Vonage SDK v3 API method names corrected
  - `account.getBalance()` → `accounts.getBalance()` (plural!)
  - `numbers.list()` → `numbers.getOwnedNumbers()`
  - `numbers.search()` → `numbers.getAvailableNumbers()`
  - `numbers.buy()` → `numbers.buyNumber()`
  - `numbers.cancel()` → `numbers.cancelNumber()`
- ✅ All tools now fully operational with Vonage SDK v3.25.1
- 📝 Updated documentation across all tools

### v1.0.1 (2025-11-20)
- ✨ Added comprehensive changelog page
- ✨ Added changelog navigation link
- 🔧 Simplified landing page (removed Quick Start Guide)
- 🔧 Simplified landing page (removed Features Section)
- 🔧 Reduced hero section size

### v1.0.0 (2025-11-19)
- 🎉 Initial release
- ✨ Hub infrastructure with Express.js
- ✨ Landing page with tool cards
- ✨ Rakuten Report Builder integration
- ✨ Report Filtering Tool integration
- ✨ VCR deployment configuration
- ✨ Number Manager backend complete

---

## ⚠️ Important Notes

### Security
- **Never commit credentials:** The `data/` directory is gitignored
- **Use test accounts:** When testing purchase/cancel operations
- **HTTPS in production:** Always use secure connections in production
- **Rate limiting:** Be aware of Vonage API rate limits

### Best Practices
- **Test operations:** Use a test Vonage account for development
- **Backup data:** Export important data before operations
- **Monitor balance:** Keep track of account balance when purchasing numbers
- **Read warnings:** All destructive operations show confirmation dialogs

### Limitations
- **Session-based:** Credentials not shared between browser sessions
- **Client-side processing:** Some tools process data entirely in browser
- **API dependencies:** Requires active Vonage account and credits

---

## 🤝 Contributing

This is a personal project by Romain EDIN. If you have suggestions or find bugs:

1. Open an issue on GitHub
2. Describe the problem or enhancement
3. Include steps to reproduce (for bugs)
4. Include screenshots if applicable

---

## 📄 License

ISC License

Copyright (c) 2025 Romain EDIN

---

## 👤 Author

**Romain EDIN**
- Vonage Solutions Architect
- GitHub: [@Romain-ED](https://github.com/Romain-ED)

---

## 🙏 Acknowledgments

- Vonage API Team for excellent documentation
- Alpine.js team for lightweight reactivity
- Tailwind CSS team for utility-first CSS
- Chart.js for beautiful visualizations
- Papa Parse for CSV processing

---

## ⚠️ Disclaimer

**These tools are NOT official Vonage products.**

- Created by **Romain EDIN** as independent projects
- No warranties or guarantees provided
- Not affiliated with or endorsed by Vonage Communications, Inc.
- Users are responsible for data privacy and compliance
- Use at your own risk

---

**Need Help?** Check the Troubleshooting section or review the activity logs in the Number Manager for detailed error messages.

**Ready to Start?** Run `npm start` and visit `http://localhost:3000`

**Made with ❤️ by Romain EDIN | Version 1.2.0**
