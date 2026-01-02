const axios = require('axios');
module.exports = {
    name: 'general',
    execute: async (sock, msg, args, from, isOwner) => {
        const command = args[0]?.toLowerCase().replace(/[!./?#-]/, '');
        const sender = from.split('@')[0];

        switch(command) {
            case 'help':
                const helpText = `
📚 *${process.env.BOT_NAME || 'BOT'} COMMANDS*

*General Commands:*
*.help* - Shows this menu
*.ping* - Check bot responsiveness
*.info* - Show bot information
*.owner* - Contact the owner

*Media Commands:*
*.sticker* - Create a sticker from an image
*.ytdl <url>* - Download YouTube audio

*Owner-Only Commands:*
*.bc <text>* - Broadcast a message
*.pairlist* - List active pairing codes
                `;
                await sock.sendMessage(from, { text: helpText });
                break;

            case 'ping':
                const start = Date.now();
                const sentMsg = await sock.sendMessage(from, { text: 'Pinging...' });
                const latency = Date.now() - start;
                await sock.sendMessage(from, { text: `🏓 *PONG!*\nLatency: ${latency}ms` });
                break;

            case 'info':
                const infoText = `
🤖 *${process.env.BOT_NAME || 'BOT'} Information*

🛠 *Creator:* ${process.env.OWNER_NAME}
📞 *Contact:* ${process.env.OWNER_NUMBER}
💻 *GitHub:* ${process.env.GITHUB_USERNAME}
🔗 *Repository:* ${process.env.REPO_URL}
⚙️ *Status:* Fully Operational ✅
📚 *Commands:* 20+ features
                `;
                await sock.sendMessage(from, { text: infoText });
                break;

            case 'owner':
                await sock.sendMessage(from, { text: `👑 *Owner Contact*\nName: ${process.env.OWNER_NAME}\nPhone: ${process.env.OWNER_NUMBER}\nGitHub: ${process.env.GITHUB_USERNAME}\nPlease contact for serious inquiries only.` });
                break;
        }
    }
};
