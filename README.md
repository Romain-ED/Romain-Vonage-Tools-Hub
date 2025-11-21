# Romain's Vonage Tools Hub

**Version:** v1.5.1
**Author:** Romain EDIN

A unified web-based hub for managing multiple Vonage telecommunications tools and utilities.

![Version](https://img.shields.io/badge/version-1.5.1-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green.svg)
![License](https://img.shields.io/badge/license-ISC-yellow.svg)

---

## 🌟 Overview

This hub provides a centralized interface for various Vonage management tools, all harmonized with a consistent dark-themed design using Tailwind CSS and Alpine.js. Each tool is accessible through a clean landing page with easy navigation.

---

## 🛠️ Available Tools

### 1. CSV Analysis Suite (v3.1.1)
**Status:** ✅ Fully Functional

**Purpose:** Unified CSV processing powerhouse combining advanced filtering and Rakuten security analysis. Two specialized tools in one tabbed interface.

**Features:**
- **Report Filtering Tab:**
  - Advanced CSV filtering with regex support
  - Multiple export formats (CSV, JSON, Excel)
  - Enhanced column analysis with vibrant gradient visualizations
  - Beautiful 8-color palette for data distribution charts
  - Improved File Information cards with clear visual hierarchy
  - Modern Tailwind CSS styling throughout
  - Internal fields removal
  - Real-time preview
- **Rakuten Analysis Tab:**
  - FC (Foreign Carrier) analysis with sub-navigation
  - DID/FC Mapping management page
  - Documentation page with field reference
  - Call duration matrices (Originate × Terminate)
  - Interactive charts with Chart.js
  - Spreadsheet paste functionality
  - CSV export capabilities
- Tabbed interface with deep linking (#filtering, #rakuten)
- Consistent dark theme with Tailwind CSS
- Unified Alpine.js state management
- Professional footer with version information

**Access:** `/csv-suite`

**Legacy URLs:** `/rakuten-report` and `/report-filtering` redirect to respective tabs

---

### 2. Vonage Management Suite (v1.3.0)
**Status:** ✅ Fully Functional

**Purpose:** Unified interface for managing Vonage phone numbers and subaccounts.

**Features:**
- **Numbers Management Tab:**
  - View owned numbers with bulk selection
  - Search available numbers by country, type, and features
  - Purchase numbers with confirmation
  - Cancel numbers with safety warnings
- **Subaccounts Management Tab:**
  - List all subaccounts
  - Create new subaccounts
  - View subaccount balances
  - Transfer credits between master and subaccounts
- **Unified Features:**
  - Credential management (save/load/delete)
  - Real-time account balance display
  - WebSocket-powered activity logging
  - Tabbed interface for easy navigation

**Tech Stack:**
- Backend: Node.js + Express.js
- Frontend: Alpine.js + Tailwind CSS
- Real-time: WebSocket
- API: Vonage Server SDK v3 + Auth

**Access:** `/management-suite`

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
│   └── managementSuite.mjs  # Management Suite endpoints
├── data/                     # Local data storage (gitignored)
│   └── vonage_credentials.json
└── public/                   # Static frontend files
    ├── index.html           # Landing page
    ├── changelog.html       # Version history
    ├── csv-suite/           # CSV Analysis Suite (unified)
    │   ├── index.html       # Tabbed interface (Filtering + Rakuten)
    │   ├── scripts/         # JavaScript modules
    │   │   └── filter-tool.js
    │   └── assets/          # Example files
    ├── rakuten-report/      # Legacy redirect → /csv-suite#rakuten
    ├── report-filtering/    # Legacy redirect → /csv-suite#filtering
    └── management-suite/    # Management Suite
        ├── index.html       # Frontend UI
        └── app.js           # Alpine.js component
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

### Management Suite API
All endpoints are prefixed with `/management-suite/api/`

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
- `GET /subaccounts` - List all subaccounts
- `POST /subaccounts/create` - Create new subaccount
- `GET /subaccounts/balance/:apiKey` - Get subaccount balance
- `POST /subaccounts/transfer` - Transfer credits between accounts

### WebSocket
- `WS /management-suite/ws/logs` - Real-time activity logging

---

## 🧪 Testing

### Manual Testing Checklist

#### Management Suite
- [ ] Load/save/delete credentials
- [ ] Connect to Vonage API with valid credentials
- [ ] View account balance
- [ ] **Numbers Tab:**
  - [ ] List owned numbers
  - [ ] Search available numbers (various filters)
  - [ ] Purchase a number (use test account!)
  - [ ] Cancel a number (use test number!)
- [ ] **Subaccounts Tab:**
  - [ ] List subaccounts
  - [ ] Create new subaccount
  - [ ] View subaccount balance
  - [ ] Transfer credits between accounts
- [ ] WebSocket logging displays messages
- [ ] All error states handled gracefully
- [ ] Responsive design on mobile/tablet

### API Testing with cURL

**Load credentials:**
```bash
curl http://localhost:3000/management-suite/api/credentials/load
```

**Connect:**
```bash
curl -X POST http://localhost:3000/management-suite/api/connect \
  -H "Content-Type: application/json" \
  -d '{"api_key":"YOUR_KEY","api_secret":"YOUR_SECRET"}'
```

**Get balance:**
```bash
curl http://localhost:3000/management-suite/api/account/balance?session_id=default
```

**Search numbers:**
```bash
curl -X POST http://localhost:3000/management-suite/api/numbers/search \
  -H "Content-Type: application/json" \
  -d '{"country":"US","features":"SMS,VOICE","session_id":"default"}'
```

**List subaccounts:**
```bash
curl http://localhost:3000/management-suite/api/subaccounts?session_id=default
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. "Cannot read properties of undefined (reading 'getBalance')" ✅ FIXED in v1.3.0
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
**Status:** Fixed in v1.3.0 - restart server to apply fix

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
**Verify:** Should connect to `ws://localhost:3000/management-suite/ws/logs`

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

**Current Status:** 100% Complete - All Tools Operational! 🎉

### Completed (v1.4.0)
- ✅ Hub infrastructure and landing page
- ✅ **CSV Analysis Suite (v3.0.0)** - Unified CSV Processing
  - ✅ Consolidated Rakuten Report Builder + Report Filtering Tool
  - ✅ Tabbed interface with deep linking (#filtering, #rakuten)
  - ✅ Migrated to unified Tailwind CSS theme
  - ✅ Alpine.js state management
  - ✅ Legacy URL redirects for backward compatibility
- ✅ **Vonage Management Suite (v1.3.0)** - Complete Numbers & Subaccounts Management
  - ✅ All API endpoints (Numbers + Subaccounts)
  - ✅ Tabbed interface (Numbers + Subaccounts)
  - ✅ Harmonized UI with dark theme
  - ✅ WebSocket logging
  - ✅ Full testing completed
  - ✅ SDK v3 fixes applied

### Future Enhancements
- Additional tool integrations as needed
- Advanced analytics dashboards
- Multi-user authentication system
- Automated testing suite

---

## 🔗 Resources

- **GitHub Repository:** https://github.com/Romain-ED/Romain-Vonage-Tools-Hub
- **Vonage Developer Portal:** https://developer.vonage.com/
- **Vonage Server SDK (Node.js):** https://developer.vonage.com/en/sdk/server-sdk/node
- **Alpine.js Documentation:** https://alpinejs.dev/
- **Tailwind CSS Documentation:** https://tailwindcss.com/

---

## 📝 Changelog

### v1.5.1 (2025-11-21)
**Update: UX Improvements & Click-to-Filter**
- ✨ **NEW:** Click-to-filter feature in Analysis Results
- ✨ Click any value in analysis charts to instantly create a filter
- ✨ Improved Results table with horizontal/vertical scrolling
- ✨ Reduced default pagination to 20 rows for better overview
- ✨ Enhanced pagination with row count display and navigation
- ✨ Sticky table header and first column when scrolling
- ✨ Added whitespace-nowrap to prevent text wrapping in cells
- 🎯 Better visual feedback on hover (cursor, colors, plus icon)
- 📝 CSV Suite bumped to v3.1.1

### v1.5.0 (2025-11-21)
**Major Update: CSV Suite Visualization Enhancements**
- 🎨 **ENHANCED:** CSV Analysis Suite upgraded to v3.1.0
- ✨ Removed Auto-Suggested Filters feature (streamlined UX)
- ✨ Migrated Analysis Results to beautiful Tailwind CSS cards
- ✨ Added vibrant 8-color gradient palette for data visualizations
- ✨ Enhanced File Information section with bold labels and better hierarchy
- ✨ Improved Filter Options with modern grid layout and labels
- ✨ Added Rakuten sub-navigation (Upload, Mappings, Documentation pages)
- ✨ Added DID/FC Mapping management page
- ✨ Added comprehensive Documentation page with field reference
- ✨ Added professional footer with version and links
- 🎯 All gradient bar charts now with hover effects and smooth transitions
- 📝 Updated all version numbers across documentation

### v1.4.0 (2025-11-21)
**Major Update: CSV Tools Consolidation**
- 🎉 **NEW:** CSV Analysis Suite v3.0.0 - Unified CSV processing powerhouse
- ✨ Consolidated Rakuten Security Report Builder + Report Filtering Tool
- ✨ Tabbed interface with deep linking (#filtering, #rakuten)
- ✨ Migrated Report Filtering UI from custom CSS to Tailwind CSS
- ✨ Unified Alpine.js state management for both tools
- ✨ Created redirect pages for old URLs (/rakuten-report → /csv-suite#rakuten)
- ✨ Created redirect pages for old URLs (/report-filtering → /csv-suite#filtering)
- ✅ Hub now features 2 streamlined tools (down from 3)
- 📝 Updated all documentation to reflect consolidated structure

### v1.3.0 (2025-11-21)
**Major Update: Removed Redundant Number Manager**
- 🗑️ **REMOVED:** Standalone Vonage Numbers Manager (redundant)
- 📝 All number management features now available in Management Suite
- 📝 Management Suite provides identical functionality plus subaccount management
- 🧹 Cleaned up codebase - removed duplicate API endpoints and frontend files
- 📝 Updated all documentation to reflect unified tool structure
- ✅ Hub now features 3 streamlined tools (down from 4)

### v1.2.0 (2025-11-20)
**Major Update: Management Suite Complete + Critical SDK Fixes**
- 🎉 **NEW:** Vonage Management Suite (v1.3.0) - Unified Numbers & Subaccounts Management
- ✨ Complete backend API for subaccounts (create, list, balance, transfer)
- ✨ Tabbed frontend interface (Numbers + Subaccounts tabs)
- ✨ Credit transfer functionality between master and subaccounts
- ✨ Dual WebSocket logging for Management Suite
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
- ✨ Management Suite backend complete

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

**Need Help?** Check the Troubleshooting section or review the activity logs in the Management Suite for detailed error messages.

**Ready to Start?** Run `npm start` and visit `http://localhost:3000`

**Made with ❤️ by Romain EDIN | Version 1.4.0**
