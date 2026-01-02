const fs = require('fs');
const path = require('path');
const config = require('../config');

module.exports = {
    command: 'session',
    description: 'Session management commands',
    category: 'Admin',
    
    async execute(sock, msg, args, options) {
        const { isOwner, sender } = options;
        
        if (!isOwner) {
            return sock.sendMessage(sender, {
                text: '❌ This command is for owner only!'
            });
        }
        
        const subCmd = args[0]?.toLowerCase();
        
        switch(subCmd) {
            case 'info':
                const sessionInfo = {
                    '🆔 Session ID': config.SESSION_ID,
                    '📱 Phone Number': sock.user?.id?.split(':')[0] || 'Not connected',
                    '👤 Push Name': sock.user?.name || 'Unknown',
                    '📊 Status': sock.user ? 'Authenticated' : 'Not authenticated',
                    '⏰ Uptime': `${Math.floor(process.uptime() / 60)} minutes`,
                    '💾 Session Path': './sessions',
                    '🔗 Pair Code': config.PAIR_CODE_ENABLED ? 'Enabled' : 'Disabled'
                };
                
                let infoText = '🔐 *SESSION INFORMATION*\n\n';
                for (const [key, value] of Object.entries(sessionInfo)) {
                    infoText += `${key}: ${value}\n`;
                }
                
                await sock.sendMessage(sender, { text: infoText });
                break;
                
            case 'restart':
                await sock.sendMessage(sender, {
                    text: '🔄 Restarting session...'
                });
                
                // Clear session and restart
                if (fs.existsSync('./sessions')) {
                    fs.rmSync('./sessions', { recursive: true, force: true });
                    fs.mkdirSync('./sessions', { recursive: true });
                }
                
                await sock.sendMessage(sender, {
                    text: '✅ Session cleared. Please restart the bot manually.'
                });
                break;
                
            case 'pair':
                if (!config.PAIR_CODE_ENABLED) {
                    return sock.sendMessage(sender, {
                        text: '❌ Pair code feature is disabled'
                    });
                }
                
                // Generate new pair code
                const pairCode = Math.floor(100000 + Math.random() * 900000).toString();
                
                await sock.sendMessage(sender, {
                    text: `🔢 *NEW PAIR CODE*\n\n` +
                          `Code: \`${pairCode}\`\n` +
                          `⏰ Valid for: 5 minutes\n\n` +
                          `Use this code to pair remotely.\n` +
                          `Or scan QR at: ${config.DEPLOYMENT_URL}/qr`
                });
                break;
                
            case 'save':
                await sock.sendMessage(sender, {
                    text: '💾 Saving session to database...'
                });
                
                // Trigger session save
                if (global.saveSessionCallback) {
                    await global.saveSessionCallback();
                    await sock.sendMessage(sender, {
                        text: '✅ Session saved successfully!'
                    });
                } else {
                    await sock.sendMessage(sender, {
                        text: '❌ Save function not available'
                    });
                }
                break;
                
            default:
                await sock.sendMessage(sender, {
                    text: `🔐 *SESSION MANAGEMENT*\n\n` +
                          `Available commands:\n` +
                          `• ${config.PREFIX}session info - Show session info\n` +
                          `• ${config.PREFIX}session pair - Generate pair code\n` +
                          `• ${config.PREFIX}session save - Save session to DB\n` +
                          `• ${config.PREFIX}session restart - Clear and restart\n\n` +
                          `🆔 Session ID: ${config.SESSION_ID}\n` +
                          `🔗 Remote Pair: ${config.DEPLOYMENT_URL || 'Not set'}`
                });
        }
    }
};
