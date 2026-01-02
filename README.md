// README.md - BRIAN-MD WhatsApp Bot Documentation
// ====================================================

console.log(`
# 🤖 BRIAN-MD WhatsApp Bot v3.1

Advanced WhatsApp bot with Session Management, AI features, and Katabump deployment support.

## ✨ Features

### 🔐 Session Management
- **Session ID Support**: Multiple bot instances with unique IDs
- **Pair Code System**: 6-digit codes for remote authentication
- **Remote Session Storage**: MongoDB-backed session persistence
- **Auto Session Backup**: Regular backups to prevent data loss

### 🤖 Core Features
- ✅ Anti-delete message protection
- ✅ Auto status viewer & liker
- ✅ Always online 24/7
- ✅ 50+ commands across categories
- ✅ ChatGPT AI integration
- ✅ Media downloaders (YouTube, Instagram)
- ✅ Group management tools

### ☁️ Deployment Features
- **Multi-platform Support**: Katabump, Railway, Render, Heroku, Koyeb
- **Health Monitoring**: Built-in health checks
- **Auto-scaling**: Horizontal scaling support
- **Session Persistence**: Survives server restarts

## 🚀 Quick Deployment

### Option 1: Katabump (Recommended)
\`\`\`bash
# 1. Clone repository
git clone https://github.com/brianndichi340/BRIAN-MD.git
cd BRIAN-MD

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your credentials

# 4. Create deployment package
npm run katabump:deploy

# 5. Upload 'deploy' folder to Katabump
# 6. Set environment variables in Katabump dashboard
# 7. Deploy and get your bot URL
\`\`\`

### Option 2: Railway
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https://github.com/brianndichi340/BRIAN-MD)

**Deployment Steps:**
1. Sign up at [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub"
3. Select your repository
4. Add environment variables:
   - \`OWNER_NUMBER\`
   - \`OPENAI_API_KEY\`
   - \`MONGODB_URI\`
5. Deploy!

### Option 3: Render
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/brianndichi340/BRIAN-MD)

**Deployment Steps:**
1. Sign up at [render.com](https://render.com)
2. Click "New+" → "Web Service"
3. Connect GitHub repository
4. Configure:
   - Build command: \`npm install\`
   - Start command: \`npm start\`
5. Add environment variables
6. Deploy!

### Option 4: Heroku
**Deployment Steps:**
1. Sign up at [heroku.com](https://heroku.com)
2. Create new app
3. Connect GitHub repository
4. Add buildpacks:
   - \`heroku/nodejs\`
5. Add config vars in Settings
6. Deploy branch

### Option 5: Koyeb
**Deployment Steps:**
1. Sign up at [koyeb.com](https://koyeb.com)
2. Click "Create App"
3. Select "GitHub" deployment
4. Choose repository
5. Configure environment
6. Deploy!

## Environment Variables
Create \`.env\` file:
\`\`\`env
# Required Variables
OWNER_NUMBER=254717276195
OPENAI_API_KEY=your_key_here
MONGODB_URI=your_mongodb_uri_here

# Optional Features
SESSION_ID=brian-md-01
ADMIN_TOKEN=your_secure_token
DEPLOYMENT_URL=your_app_url

# Feature Toggles
AUTO_READ_STATUS=true
ANTI_DELETE=true
ALWAYS_ONLINE=true
PAIR_CODE_ENABLED=true
AUTO_LIKE_STATUS=true
\`\`\`

## 📱 Authentication Methods

### Method 1: QR Code
1. Deploy bot
2. Visit: \`https://your-app.katabump.app/qr\`
3. Scan QR with WhatsApp

### Method 2: Pair Code
1. Visit: \`https://your-app.katabump.app\`
2. Get pair code from logs or use \`.session pair\` command
3. Use code to authenticate

### Method 3: Session ID
1. Set \`SESSION_ID\` in environment
2. Previously authenticated sessions auto-restore

## 🎮 Available Commands

### 🔐 Session Management
- \`.session info\` - Show session information
- \`.session pair\` - Generate new pair code
- \`.session save\` - Force save session
- \`.session restart\` - Clear and restart session

### 🤖 AI Commands
- \`.ai <question>\` - Ask ChatGPT
- \`.gpt <prompt>\` - Alternative AI command
- \`.dalle <prompt>\` - Generate images with DALL-E

### 🛠️ Utility Commands
- \`.ping\` - Check bot latency
- \`.info\` - Bot information
- \`.status\` - System status
- \`.help\` - Show all commands

### 📥 Downloaders
- \`.yt <url>\` - YouTube downloader
- \`.ig <url>\` - Instagram downloader
- \`.tt <url>\` - TikTok downloader
- \`.fb <url>\` - Facebook downloader

### 🎭 Fun Commands
- \`.sticker\` - Create sticker from image
- \`.meme\` - Get random meme
- \`.joke\` - Tell a joke
- \`.quote\` - Inspirational quote

### 👑 Admin Commands
- \`.broadcast <msg>\` - Broadcast to all users
- \`.ban @user\` - Ban user from bot
- \`.eval <code>\` - Execute JavaScript code
- \`.stats\` - Detailed bot statistics

## 📊 Session Management Flow

\`\`\`mermaid
graph TD
    A[Bot Start] --> B{Session in DB?}
    B -->|Yes| C[Restore Session]
    B -->|No| D[Generate QR Code]
    C --> E[Connected]
    D --> F[Scan QR / Use Pair Code]
    F --> G[Authenticate]
    G --> H[Save to DB]
    H --> E
    E --> I[Bot Ready]
\`\`\`

## 🔧 Advanced Configuration

### Multiple Bot Instances
\`\`\`bash
# Bot 1
SESSION_ID=brian-md-01
OWNER_NUMBER=254717276195

# Bot 2  
SESSION_ID=brian-md-02
OWNER_NUMBER=254712345678
\`\`\`

### Custom Command Prefix
\`\`\`javascript
// config.js
PREFIX: "!", // Change from "." to "!"
\`\`\`

### Enable/Disable Features
\`\`\`javascript
// config.js
ANTI_DELETE: true,    // Enable anti-delete
AUTO_LIKE_STATUS: false, // Disable auto-like
PAIR_CODE_ENABLED: true, // Enable pair codes
\`\`\`

## 🚨 Troubleshooting

### Common Issues:

**QR Code Not Showing:**
1. Check if port 3000 is accessible
2. Verify environment variables
3. Clear sessions folder and restart

**Session Not Saving:**
1. Check MongoDB connection
2. Verify SESSION_ID is set
3. Check write permissions

**Bot Disconnects Frequently:**
1. Enable ALWAYS_ONLINE in config
2. Use PM2 for process management
3. Check deployment platform's sleep policy

**Commands Not Working:**
1. Verify command prefix in config.js
2. Check if plugin files exist
3. Restart bot to reload plugins

### Monitoring:
\`\`\`bash
# Check logs
pm2 logs BRIAN-MD

# Monitor status
pm2 status

# Health check
curl https://your-app.katabump.app/health
\`\`\`

## 📁 Project Structure
\`\`\`
BRIAN-MD/
├── index.js              # Main bot file with session support
├── config.js             # Configuration
├── package.json          # Dependencies
├── katabump.json         # Katabump deployment config
├── scripts/              # Deployment scripts
│   ├── katabump-deploy.js
│   ├── backup-session.js
│   └── restore-session.js
├── lib/                  # Core libraries
│   ├── database.js       # MongoDB session storage
│   ├── functions.js      # Utility functions
│   └── handlers.js       # Message handlers
├── plugins/              # Command plugins
│   ├── session.js        # Session management
│   ├── ai.js             # AI commands
│   └── ...              # Other plugins
└── public/              # Web assets
\`\`\`

## 🔐 Security Notes

1. **Never commit** \`.env\` file to GitHub
2. Use strong \`ADMIN_TOKEN\` for API endpoints
3. Regular session backups
4. Monitor bot activity logs
5. Update dependencies regularly

## 📞 Support

- **Developer**: Brian
- **Email**: brianndichi340@gmail.com
- **WhatsApp**: +254717276195
- **GitHub**: https://github.com/brianndichi340
- **Issues**: GitHub Issues page

## 📄 License

MIT License - See LICENSE file

## 🙏 Credits

- **Baileys Library**: @WhiskeySockets
- **Session Management**: Custom implementation
- **Deployment Scripts**: Brian
- **Inspiration**: Keith-MD, other WhatsApp bots

---

**⭐ Star this repo if you found it helpful!**

**🚀 Happy Bot Building!**
`);# 6. Set environment variables in Katabump dashboard
# 7. Deploy and get your bot URL4. Build command: `npm install`
5. Start command: `npm start`
6. Add environment variables
7. Deploy!

### 3. Heroku
1. Sign up at [heroku.com](https://heroku.com)
2. Create new app
3. Connect GitHub repository
4. Add buildpacks:
   - `heroku/nodejs`
5. Add config vars in Settings
6. Deploy branch

### 4. Koyeb
1. Sign up at [koyeb.com](https://koyeb.com)
2. Click "Create App"
3. Select "GitHub" deployment
4. Choose repository
5. Configure environment
6. Deploy!

## Environment Variables
Create `.env` file:
```env
OWNER_NUMBER=254717276195
OPENAI_API_KEY=your_key
MONGODB_URI=your_mongodb_uri
