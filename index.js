const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason, 
    fetchLatestBaileysVersion, 
    makeCacheableSignalKeyStore,
    Browsers
} = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');
const express = require('express');
const axios = require('axios');
const config = require('./config.js');
require('dotenv').config();

// Import Handlers
const { handleMessages, loadCommands } = require('./lib/handlers');
const { connectToDatabase, saveSession, getSession } = require('./lib/database');
const functions = require('./lib/functions');

class BRIANMD {
    constructor() {
        this.sock = null;
        this.commands = new Map();
        this.sessionPath = './sessions';
        this.sessionId = process.env.SESSION_ID || 'brian-session-01';
        this.qrCode = null;
        this.pairCode = null;
        this.pairCodeExpiry = null;
        this.isAuthenticated = false;
        this.init();
    }

    async init() {
        console.log(`🚀 Starting ${config.BOT_NAME}...`);
        console.log(`👤 Owner: ${config.OWNER_NAME}`);
        console.log(`📞 Contact: ${config.OWNER_NUMBER}`);
        console.log(`🆔 Session ID: ${this.sessionId}`);
        
        // Ensure session directory exists
        if (!fs.existsSync(this.sessionPath)) {
            fs.mkdirSync(this.sessionPath, { recursive: true });
        }
        
        // Connect to Database
        await connectToDatabase();
        
        // Load Commands
        await loadCommands(this.commands);
        
        // Try to load saved session from database
        await this.loadRemoteSession();
        
        // Start Bot
        await this.startBot();
        
        // Start Web Server for Deployment
        this.startWebServer();
    }

    async loadRemoteSession() {
        console.log('🔄 Checking for saved session...');
        const savedSession = await getSession(this.sessionId);
        
        if (savedSession && savedSession.creds) {
            console.log('✅ Found saved session in database');
            
            // Save session to local files
            const sessionFiles = {
                'creds.json': JSON.stringify(savedSession.creds, null, 2)
            };
            
            for (const [filename, content] of Object.entries(savedSession.keys || {})) {
                sessionFiles[filename] = content;
            }
            
            for (const [filename, content] of Object.entries(sessionFiles)) {
                fs.writeFileSync(path.join(this.sessionPath, filename), content);
            }
            
            return true;
        }
        
        console.log('📭 No saved session found');
        return false;
    }

    async saveRemoteSession(state) {
        try {
            const sessionData = {
                creds: state.creds,
                keys: state.keys
            };
            
            await saveSession(this.sessionId, sessionData);
            console.log('💾 Session saved to database');
            return true;
        } catch (error) {
            console.error('❌ Failed to save session:', error);
            return false;
        }
    }

    async startBot() {
        try {
            const { state, saveCreds } = await useMultiFileAuthState(this.sessionPath);
            const { version } = await fetchLatestBaileysVersion();
            
            this.sock = makeWASocket({
                version,
                printQRInTerminal: false, // We'll handle QR display ourselves
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, { log: console.log }),
                },
                generateHighQualityLinkPreview: true,
                browser: Browsers.macOS('Desktop'),
                markOnlineOnConnect: config.ALWAYS_ONLINE,
            });

            // Save credentials on update
            this.sock.ev.on('creds.update', async (creds) => {
                await saveCreds();
                await this.saveRemoteSession(state);
            });

            // Connection updates
            this.sock.ev.on('connection.update', async (update) => {
                const { connection, lastDisconnect, qr } = update;
                
                if (qr) {
                    console.log('📱 New QR Code Generated');
                    this.qrCode = qr;
                    qrcode.generate(qr, { small: true });
                    
                    // Generate pair code
                    await this.generatePairCode(qr);
                }
                
                if (connection === 'close') {
                    const reason = new DisconnectReason(lastDisconnect?.error);
                    console.log(`⚠️ Connection closed: ${reason}`);
                    
                    if (reason === DisconnectReason.loggedOut) {
                        console.log('❌ Logged out, clearing session...');
                        fs.rmSync(this.sessionPath, { recursive: true, force: true });
                        // Also clear from database
                        // await clearSession(this.sessionId);
                    }
                    
                    console.log('🔄 Reconnecting in 5 seconds...');
                    setTimeout(() => this.startBot(), 5000);
                    
                } else if (connection === 'open') {
                    console.log(`✅ ${config.BOT_NAME} Connected Successfully!`);
                    console.log(`👤 Logged in as: ${this.sock.user?.name || 'Unknown'}`);
                    this.isAuthenticated = true;
                    this.qrCode = null;
                    this.pairCode = null;
                    
                    // Save session immediately
                    await this.saveRemoteSession(state);
                    
                    // Send startup message to owner
                    await this.sendStartupMessage();
                }
            });

            // Message Handler
            this.sock.ev.on('messages.upsert', async ({ messages }) => {
                const msg = messages[0];
                if (!msg.message || msg.key.fromMe) return;
                
                // Cache message for anti-delete
                functions.cacheMessage(msg);
                
                await handleMessages(this.sock, msg, this.commands);
            });

            // Anti-Delete Feature
            if (config.ANTI_DELETE) {
                this.sock.ev.on('messages.delete', async (deleteData) => {
                    await functions.handleAntiDelete(this.sock, deleteData);
                });
            }

            // Auto View Status
            if (config.AUTO_READ_STATUS) {
                this.sock.ev.on('status.update', async (update) => {
                    await functions.autoViewStatus(this.sock, update);
                });
            }

            // Auto Like Status
            if (config.AUTO_LIKE_STATUS) {
                this.sock.ev.on('status.update', async (update) => {
                    await functions.autoLikeStatus(this.sock, update);
                });
            }

            // Always Online Ping
            if (config.ALWAYS_ONLINE) {
                setInterval(async () => {
                    if (this.sock && this.isAuthenticated) {
                        await this.sock.sendPresenceUpdate('available');
                    }
                }, 60000);
            }

            // Handle pairing requests
            this.sock.ev.on('connection.update', (update) => {
                if (update.receivedPendingNotifications) {
                    console.log('📱 Pairing request received');
                }
            });

        } catch (error) {
            console.error('❌ Bot startup error:', error);
            setTimeout(() => this.startBot(), 10000);
        }
    }

    async generatePairCode(qr) {
        // Generate a 6-digit pair code
        this.pairCode = Math.floor(100000 + Math.random() * 900000).toString();
        this.pairCodeExpiry = Date.now() + 300000; // 5 minutes expiry
        
        console.log(`🔢 Pair Code: ${this.pairCode}`);
        console.log(`⏰ Valid for: 5 minutes`);
        
        return this.pairCode;
    }

    async verifyPairCode(code) {
        if (!this.pairCode || !this.pairCodeExpiry) {
            return { success: false, message: 'No active pair code' };
        }
        
        if (Date.now() > this.pairCodeExpiry) {
            this.pairCode = null;
            this.pairCodeExpiry = null;
            return { success: false, message: 'Pair code expired' };
        }
        
        if (code === this.pairCode) {
            this.pairCode = null;
            this.pairCodeExpiry = null;
            return { success: true, message: 'Pair code verified' };
        }
        
        return { success: false, message: 'Invalid pair code' };
    }

    async sendStartupMessage() {
        const ownerJid = `${config.OWNER_NUMBER}@s.whatsapp.net`;
        
        try {
            await this.sock.sendMessage(ownerJid, {
                text: `🤖 *${config.BOT_NAME} Activated!*\n\n` +
                      `✅ Bot is now online and ready!\n` +
                      `⏰ Time: ${new Date().toLocaleString()}\n` +
                      `🆔 Session ID: ${this.sessionId}\n` +
                      `📊 Status: Operational\n` +
                      `💾 Session Saved: Yes\n\n` +
                      `Use .help to see all commands.\n` +
                      `Use .session to view session info.`
            });
        } catch (error) {
            console.log('⚠️ Could not send startup message to owner');
        }
    }

    startWebServer() {
        const app = express();
        const port = config.PORT || 3000;
        
        app.use(express.json());
        app.use(express.static('public'));
        
        // Home route with bot info
        app.get('/', (req, res) => {
            res.json({
                bot: config.BOT_NAME,
                owner: config.OWNER_NAME,
                status: this.isAuthenticated ? 'authenticated' : 'waiting_for_qr',
                session_id: this.sessionId,
                is_online: this.sock?.user ? 'online' : 'offline',
                uptime: process.uptime(),
                commands: this.commands.size,
                repository: config.GITHUB,
                features: {
                    anti_delete: config.ANTI_DELETE,
                    auto_status: config.AUTO_READ_STATUS,
                    always_online: config.ALWAYS_ONLINE,
                    ai_enabled: !!config.OPENAI_KEY
                }
            });
        });
        
        // Health check endpoint
        app.get('/health', (req, res) => {
            res.status(200).json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                memory: process.memoryUsage(),
                uptime: process.uptime()
            });
        });
        
        // QR Code endpoint
        app.get('/qr', (req, res) => {
            if (this.isAuthenticated) {
                return res.json({ 
                    status: 'authenticated',
                    message: 'Bot is already authenticated',
                    session_id: this.sessionId
                });
            }
            
            if (this.qrCode) {
                return res.json({
                    status: 'qr_available',
                    qr_code: this.qrCode,
                    pair_code: this.pairCode,
                    expires_in: this.pairCodeExpiry ? Math.max(0, this.pairCodeExpiry - Date.now()) : 0
                });
            }
            
            res.json({ 
                status: 'generating_qr',
                message: 'QR code is being generated, please refresh'
            });
        });
        
        // Pair code verification endpoint
        app.post('/verify-pair', async (req, res) => {
            const { code } = req.body;
            
            if (!code) {
                return res.status(400).json({ error: 'Pair code required' });
            }
            
            const result = await this.verifyPairCode(code);
            res.json(result);
        });
        
        // Session management endpoint
        app.get('/session', (req, res) => {
            res.json({
                session_id: this.sessionId,
                is_authenticated: this.isAuthenticated,
                phone_number: this.sock?.user?.id?.split(':')[0] || 'Not connected',
                push_name: this.sock?.user?.name || 'Unknown',
                platform: this.sock?.user?.platform || 'Unknown'
            });
        });
        
        // Katabump deployment webhook
        app.post('/webhook/katabump', (req, res) => {
            console.log('📦 Katabump webhook received:', req.body);
            
            // Handle deployment updates
            const { event, deployment } = req.body;
            
            if (event === 'deployment.success') {
                console.log('🚀 Deployment successful on Katabump');
            }
            
            res.json({ received: true });
        });
        
        // Bot control endpoints
        app.post('/restart', (req, res) => {
            if (req.headers.authorization !== process.env.ADMIN_TOKEN) {
                return res.status(403).json({ error: 'Unauthorized' });
            }
            
            res.json({ message: 'Restart initiated' });
            setTimeout(() => {
                console.log('🔄 Manual restart requested');
                process.exit(0);
            }, 1000);
        });
        
        app.listen(port, () => {
            console.log(`🌐 Web server running on port ${port}`);
            console.log(`🔗 Local: http://localhost:${port}`);
            console.log(`📱 QR Endpoint: http://localhost:${port}/qr`);
            console.log(`🔢 Pair Endpoint: http://localhost:${port}/verify-pair`);
        });
    }
}

// Start the bot
new BRIANMD();

// Handle process termination
process.on('SIGINT', async () => {
    console.log(`\n👋 ${config.BOT_NAME} shutting down gracefully...`);
    
    // Save session before exiting
    if (global.botInstance && global.botInstance.sock) {
        console.log('💾 Saving session before exit...');
    }
    
    process.exit(0);
});

// Global error handling
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});        // Start Bot
        await this.startBot();
        
        // Start Web Server for Deployment
        this.startWebServer();
    }

    async startBot() {
        try {
            const { state, saveCreds } = await useMultiFileAuthState(this.sessionPath);
            const { version } = await fetchLatestBaileysVersion();
            
            this.sock = makeWASocket({
                version,
                printQRInTerminal: true,
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, { log: console.log }),
                },
                generateHighQualityLinkPreview: true,
                browser: ['BRIAN-MD', 'Chrome', '3.0'],
                markOnlineOnConnect: config.ALWAYS_ONLINE,
            });

            // Save credentials on update
            this.sock.ev.on('creds.update', saveCreds);

            // Connection updates
            this.sock.ev.on('connection.update', async (update) => {
                const { connection, lastDisconnect, qr } = update;
                
                if (qr) {
                    console.log('📱 Scan QR Code:');
                    qrcode.generate(qr, { small: true });
                }
                
                if (connection === 'close') {
                    const reason = new DisconnectReason(lastDisconnect?.error);
                    console.log(`⚠️ Connection closed: ${reason}`);
                    if (reason === DisconnectReason.loggedOut) {
                        console.log('❌ Logged out, deleting session...');
                        fs.rmSync(this.sessionPath, { recursive: true, force: true });
                    }
                    console.log('🔄 Reconnecting...');
                    setTimeout(() => this.startBot(), 5000);
                } else if (connection === 'open') {
                    console.log(`✅ ${config.BOT_NAME} Connected Successfully!`);
                    console.log(`👤 Logged in as: ${this.sock.user?.name || 'Unknown'}`);
                    
                    // Send startup message to owner
                    const ownerJid = `${config.OWNER_NUMBER}@s.whatsapp.net`;
                    await this.sock.sendMessage(ownerJid, {
                        text: `🤖 *${config.BOT_NAME} Activated!*\n\n✅ Bot is now online and ready!\n⏰ Time: ${new Date().toLocaleString()}\n📊 Status: Operational\n\nUse .help to see all commands.`
                    });
                }
            });

            // Message Handler
            this.sock.ev.on('messages.upsert', async ({ messages }) => {
                const msg = messages[0];
                if (!msg.message || msg.key.fromMe) return;
                
                await handleMessages(this.sock, msg, this.commands);
            });

            // Anti-Delete Feature
            if (config.ANTI_DELETE) {
                this.sock.ev.on('messages.delete', async (deleteData) => {
                    await functions.handleAntiDelete(this.sock, deleteData);
                });
            }

            // Auto View Status
            if (config.AUTO_READ_STATUS) {
                this.sock.ev.on('status.update', async (update) => {
                    await functions.autoViewStatus(this.sock, update);
                });
            }

            // Always Online Ping
            if (config.ALWAYS_ONLINE) {
                setInterval(async () => {
                    await this.sock.sendPresenceUpdate('available');
                }, 60000); // Every minute
            }

        } catch (error) {
            console.error('❌ Bot startup error:', error);
            setTimeout(() => this.startBot(), 10000);
        }
    }

    startWebServer() {
        const express = require('express');
        const app = express();
        const port = config.PORT || 3000;
        
        app.use(express.json());
        
        app.get('/', (req, res) => {
            res.json({
                bot: config.BOT_NAME,
                owner: config.OWNER_NAME,
                status: this.sock?.user ? 'online' : 'offline',
                uptime: process.uptime(),
                commands: this.commands.size,
                repository: config.GITHUB
            });
        });
        
        app.get('/health', (req, res) => {
            res.status(200).send('OK');
        });
        
        app.get('/qr', (req, res) => {
            if (this.sock?.user) {
                res.json({ status: 'already_authenticated' });
            } else {
                // QR generation logic here
                res.json({ status: 'need_auth' });
            }
        });
        
        app.listen(port, () => {
            console.log(`🌐 Web server running on port ${port}`);
        });
    }
}

// Start the bot
new BRIANMD();

// Handle process termination
process.on('SIGINT', () => {
    console.log(`\n👋 ${config.BOT_NAME} shutting down...`);
    process.exit(0);
});
