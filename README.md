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
```bash
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
