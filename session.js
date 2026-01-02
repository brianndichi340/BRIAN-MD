const { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, makeCacheableSignalKeyStore } = require('@whiskeysockets/baileys');
const pino = require('pino');
const NodeCache = require('node-cache');
const config = require('./config');

class SessionManager {
    constructor() {
        this.sessions = new Map();
        this.messageCache = new NodeCache({ stdTTL: 100, checkperiod: 120 });
    }

    async createSession(sessionId = config.session) {
        try {
            const { state, saveCreds } = await useMultiFileAuthState(`./sessions/${sessionId}`);
            
            const { version, isLatest } = await fetchLatestBaileysVersion();
            
            const sock = makeWASocket({
                version,
                logger: pino({ level: 'silent' }),
                printQRInTerminal: true,
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'fatal' }))
                },
                generateHighQualityLinkPreview: true,
                browser: ['BRIAN-MD', 'Chrome', '3.0'],
                markOnlineOnConnect: true,
                getMessage: async (key) => {
                    return this.messageCache.get(key.id) || null;
                }
            });

            // Save message cache
            sock.ev.on('messages.upsert', ({ messages }) => {
                const message = messages[0];
                if (message.key) {
                    this.messageCache.set(message.key.id, message);
                }
            });

            // Handle credentials update
            sock.ev.on('creds.update', saveCreds);

            // Handle connection
            sock.ev.on('connection.update', (update) => {
                const { connection, lastDisconnect, qr } = update;
                
                if (qr) {
                    console.log('Scan QR Code to connect');
                }
                
                if (connection === 'close') {
                    const shouldReconnect = (lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut);
                    if (shouldReconnect) {
                        this.createSession(sessionId);
                    }
                } else if (connection === 'open') {
                    console.log('✅ Connected to WhatsApp!');
                }
            });

            this.sessions.set(sessionId, { sock, state, saveCreds });
            return sock;
            
        } catch (error) {
            console.error('Session creation error:', error);
            throw error;
        }
    }

    // 8-digit pairing code generation
    generatePairingCode() {
        const code = Math.floor(10000000 + Math.random() * 90000000).toString();
        const expiry = Date.now() + (5 * 60 * 1000); // 5 minutes expiry
        
        return {
            code,
            expiry,
            createdAt: new Date().toISOString()
        };
    }

    // Validate pairing code
    validatePairingCode(code, storedCode) {
        if (!storedCode) return false;
        
        const now = Date.now();
        if (now > storedCode.expiry) {
            return { valid: false, reason: 'Code expired' };
        }
        
        if (code !== storedCode.code) {
            return { valid: false, reason: 'Invalid code' };
        }
        
        return { valid: true };
    }
}

module.exports = new SessionManager();
