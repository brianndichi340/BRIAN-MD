const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const pino = require('pino');
const NodeCache = require("node-cache");
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const msgRetryCounterCache = new NodeCache();
const { state, saveCreds } = await useMultiFileAuthState('./sessions');
const { version } = await fetchLatestBaileysVersion();

const startSock = () => {
    const sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" })),
        },
        msgRetryCounterCache,
        generateHighQualityLinkPreview: true,
    });

    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) {
            console.log('Scan this QR code with WhatsApp:');
            qrcode.generate(qr, { small: true });
        }
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) {
                console.log('Connection closed. Reconnecting...');
                startSock();
            } else {
                console.log('Connection closed. Please remove the session folder and scan the QR again.');
            }
        } else if (connection === 'open') {
            console.log(`${process.env.BOT_NAME || 'BOT'} is online!`);
            await sock.sendMessage(sock.user.id, { text: `✅ *${process.env.BOT_NAME} Activated!*\nHello Master ${process.env.OWNER_NAME}` });
        }
    });

    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.remoteJid === 'status@broadcast') return;

        const from = msg.key.remoteJid;
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
        const isOwner = from === `${process.env.OWNER_NUMBER}@s.whatsapp.net`;
        const args = text.trim().split(/ +/);
        const command = args[0]?.toLowerCase();
        const prefix = /^[!/.?#-]/;

        if (!prefix.test(command)) return;

        try {
            const cmd = command.replace(prefix, '');
            const commandPath = path.join(__dirname, 'commands', `${cmd}.js`);

            if (fs.existsSync(commandPath)) {
                const commandModule = require(commandPath);
                await commandModule.execute(sock, msg, args, from, isOwner);
            } else {
                await sock.sendMessage(from, { text: `❌ Unknown command. Type *.help* for the command list.` });
            }
        } catch (error) {
            console.error('Command Error:', error);
            await sock.sendMessage(from, { text: `⚠️ An error occurred: ${error.message}` });
        }
    });
};

startSock();
