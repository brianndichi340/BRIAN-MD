const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, makeCacheableSignalKeyStore } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');
const config = require('./config.js');
require('dotenv').config();

// Import Handlers
const { handleMessages, loadCommands } = require('./lib/handlers');
const { connectToDatabase } = require('./lib/database');
const functions = require('./lib/functions');

class BRIANMD {
    constructor() {
        this.sock = null;
        this.commands = new Map();
        this.sessionPath = './sessions';
        this.init();
    }

    async init() {
        console.log(`🚀 Starting ${config.BOT_NAME}...`);
        console.log(`👤 Owner: ${config.OWNER_NAME}`);
        console.log(`📞 Contact: ${config.OWNER_NUMBER}`);
        
        // Ensure session directory exists
        if (!fs.existsSync(this.sessionPath)) {
            fs.mkdirSync(this.sessionPath, { recursive: true });
        }
        
        // Connect to Database
        await connectToDatabase();
        
        // Load Commands
        await loadCommands(this.commands);
        
        // Start Bot
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
