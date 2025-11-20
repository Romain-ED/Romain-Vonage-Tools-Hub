# Romain's Vonage Tools Hub

A unified hub for managing Vonage services - A collection of powerful web-based utilities for telecommunications data processing, reporting, and number management.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green.svg)
![License](https://img.shields.io/badge/license-ISC-yellow.svg)

## 🚀 Overview

This project provides a unified landing page and harmonized interface for four powerful Vonage tools:

1. **Rakuten Security Report Builder** (v2.2.0) - Process and analyze call data with FC analysis
2. **Vonage Reports API Filter Tool** (v2.0.0) - Advanced CSV filtering and analysis
3. **Vonage Numbers Manager** (v2.2.2) - Manage phone numbers and accounts
4. **Vonage Management Suite** (v1.3.0) - Unified numbers and subaccount management

## 📋 Features

### 🎨 Unified Design System
- Consistent dark theme across all tools
- Modern UI with Tailwind CSS and Alpine.js
- Responsive design for all devices
- Smooth animations and transitions

### 🔧 Tool Integration
- Single landing page for easy navigation
- Consistent navigation with "Back to Hub" buttons
- Unified health check endpoint
- VCR deployment ready

### 🛡️ Security & Privacy
- Client-side processing for data tools
- No data transmission to external servers
- Session-based authentication where needed
- Secure credential handling

## 🏗️ Project Structure

```
Romain-Vonage-Tools-Hub/
├── public/
│   ├── index.html                    # Landing page
│   ├── rakuten-report/               # Rakuten Report Builder
│   │   └── index.html
│   ├── report-filtering/             # CSV Filter Tool
│   │   ├── index.html
│   │   ├── script.js
│   │   ├── style.css
│   │   └── docs.html
│   ├── number-manager/               # Numbers Manager
│   │   └── index.html
│   ├── management-suite/             # Management Suite
│   │   └── index.html
│   └── shared/                       # Shared assets
├── server.mjs                        # Express server
├── vcr.yml                           # VCR deployment config
├── package.json
├── .gitignore
└── README.md                         # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18.0.0 or higher
- npm or yarn

### Installation

1. **Clone or navigate to the project**
   ```bash
   cd Romain-Vonage-Tools-Hub
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   npm start
   ```

4. **Access the hub**
   Open your browser to: http://localhost:3000

### Development Mode

For development with auto-restart:
```bash
npm run dev
```

## 📊 Available Tools

### 1. Rakuten Security Report Builder
**Route:** `/rakuten-report`

Process and analyze call data reports from Rakuten services with:
- FC (Feature Code) analysis
- Call duration matrices
- Interactive charts and visualizations
- Real-time progress tracking

### 2. Vonage Reports API Filter Tool
**Route:** `/report-filtering`

Advanced CSV filtering and analysis with:
- Multiple filter operators including regex
- Column analysis with top values
- Export to CSV, JSON, and Excel
- Internal fields removal

### 3. Vonage Numbers Manager
**Route:** `/number-manager`

Manage Vonage phone numbers with:
- View owned numbers inventory
- Search and purchase available numbers
- Bulk operations
- Account balance monitoring

### 4. Vonage Management Suite
**Route:** `/management-suite`

Unified management interface with:
- Number management
- Subaccount management
- Balance transfers
- Real-time activity logging

## 🔧 Configuration

### Environment Variables

- `VCR_PORT` - Server port (default: 3000)
- `VCR_HOST` - Server host (default: 0.0.0.0)
- `NODE_ENV` - Environment mode (development/production)
- `VCR_INSTANCE_PUBLIC_URL` - Public URL for VCR deployment

### VCR Deployment

The project is configured for VCR deployment with `vcr.yml`. To deploy:

```bash
vcr deploy
```

## 🏥 Health Check

The server provides health check endpoints:

- `/_/health` - VCR required health endpoint
- `/health` - Detailed health status with tool information

## 🎯 Usage

### Accessing Tools

1. **Landing Page**: Navigate to root URL (`/`) to see all available tools
2. **Direct Access**: Use specific routes to access tools directly
3. **Navigation**: Use "Back to Hub" button to return to landing page

### Keyboard Shortcuts

Most tools support keyboard shortcuts:
- `Ctrl+H` - Toggle help/documentation
- `Ctrl+?` - Show keyboard shortcuts
- Tool-specific shortcuts available within each tool

## 🛠️ Development

### Adding New Tools

1. Create a new directory under `public/`
2. Add your tool's HTML, CSS, and JavaScript files
3. Update `server.mjs` to add routing
4. Update landing page (`public/index.html`) with new tool card

### Harmonization Guidelines

When adding or updating tools:
- Use Tailwind CSS for styling
- Include Alpine.js for reactive components
- Add Font Awesome icons
- Maintain dark theme (#1f2937, #111827 backgrounds)
- Include "Back to Hub" navigation button
- Add health check support if applicable

## 📈 Performance

- **File Size Limits**: Varies by tool (typically up to 100MB for CSV tools)
- **Processing Speed**: Client-side processing ~1,000 records/second
- **Browser Support**: Chrome 80+, Firefox 75+, Safari 13+, Edge 80+

## 🔒 Security

### Data Privacy
- CSV filtering and analysis happen entirely in browser
- No data is transmitted to external servers
- Credentials are session-based only (not persisted)

### API Security
- Base64 encoding for API credentials
- Session-based authentication
- No credential storage in localStorage (for multi-user tools)

## 🐛 Troubleshooting

### Server Won't Start
```bash
# Check if port is already in use
lsof -i :3000

# Kill existing process if needed
kill -9 <PID>

# Try different port
VCR_PORT=3001 npm start
```

### Tools Not Loading
- Ensure all files are properly copied to `public/` directory
- Check browser console for JavaScript errors
- Verify file paths in `server.mjs`

### Health Check Fails
- Ensure server is running
- Check `/_/health` endpoint directly
- Review server logs for errors

## 📦 Deployment

### Local Deployment
```bash
npm install
npm start
```

### VCR Deployment
```bash
vcr deploy
```

### Docker (Optional)
```bash
# Build image
docker build -t romain-vonage-tools-hub .

# Run container
docker run -p 3000:3000 romain-vonage-tools-hub
```

## 🔄 Version History

### v1.0.0 (Current)
- Initial unified hub release
- Landing page with 4 tools
- Harmonized navigation
- VCR deployment configuration
- Health check endpoints

## 🤝 Contributing

This is a personal project by Romain EDIN. When making changes:

1. Test all tools individually
2. Verify landing page links
3. Check health endpoints
4. Test VCR deployment configuration
5. Update this README with changes

## ⚠️ Disclaimer

**These tools are NOT official Vonage products.**

- Created by **Romain EDIN** as independent projects
- No warranties or guarantees provided
- Not affiliated with or endorsed by Vonage Communications, Inc.
- Users are responsible for data privacy and compliance
- Use at your own risk

## 📄 License

ISC License - See individual tool documentation for specific license information.

## 💡 Support

For issues or questions:
- Review individual tool documentation
- Check browser developer console (F12)
- Verify input file formats
- Test with sample data first

## 🔗 Links

- **Health Status**: http://localhost:3000/health
- **Landing Page**: http://localhost:3000/
- **Rakuten Report Builder**: http://localhost:3000/rakuten-report
- **Report Filtering Tool**: http://localhost:3000/report-filtering
- **Numbers Manager**: http://localhost:3000/number-manager
- **Management Suite**: http://localhost:3000/management-suite

---

**Made with ❤️ by Romain EDIN | Version 1.0.0**
