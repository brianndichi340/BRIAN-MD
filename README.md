# 🤖 BRIAN-MD WhatsApp Bot

Advanced WhatsApp bot with AI features, created by Brian.

## Features
- 🤖 Multi-functional commands
- 🧠 ChatGPT AI integration
- 🛡️ Anti-delete protection
- 📊 Auto status viewer
- 🌐 Always online
- 📥 Media downloader
- 🎭 Fun commands

## Deployment

### 1. Railway.app
1. Sign up at [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub"
3. Select your repository
4. Add environment variables:
   - `OWNER_NUMBER`
   - `OPENAI_API_KEY`
   - `MONGODB_URI`
5. Deploy!

### 2. Render.com
1. Sign up at [render.com](https://render.com)
2. Click "New+" → "Web Service"
3. Connect GitHub repository
4. Build command: `npm install`
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
