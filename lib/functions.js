const fs = require('fs');
const path = require('path');
const config = require('../config');

// Message cache for anti-delete
const messageCache = new Map();

class BotFunctions {
    // Anti-Delete Feature
    static async handleAntiDelete(sock, deleteData) {
        if (!config.ANTI_DELETE) return;
        
        for (const item of deleteData.keys) {
            const cachedMsg = messageCache.get(item.id);
            if (cachedMsg) {
                const ownerJid = `${config.OWNER_NUMBER}@s.whatsapp.net`;
                await sock.sendMessage(ownerJid, {
                    text: `🚨 *DELETED MESSAGE DETECTED*\n\n👤 From: ${cachedMsg.sender}\n⏰ Time: ${new Date(cachedMsg.timestamp).toLocaleString()}\n📝 Message: ${cachedMsg.message}\n\n🔍 Message was deleted at: ${new Date().toLocaleString()}`
                });
                messageCache.delete(item.id);
            }
        }
    }
    
    // Cache messages
    static cacheMessage(msg) {
        if (msg.key && msg.message) {
            const messageText = msg.message.conversation || 
                               msg.message.extendedTextMessage?.text ||
                               msg.message.imageMessage?.caption ||
                               'Media Message';
            
            messageCache.set(msg.key.id, {
                sender: msg.key.remoteJid,
                message: messageText,
                timestamp: Date.now()
            });
            
            // Limit cache size
            if (messageCache.size > 1000) {
                const firstKey = messageCache.keys().next().value;
                messageCache.delete(firstKey);
            }
        }
    }
    
    // Auto View Status
    static async autoViewStatus(sock, update) {
        if (!config.AUTO_READ_STATUS || !update.status) return;
        
        try {
            await sock.readMessages([{ key: update.key }]);
            console.log(`📊 Auto-viewed status from ${update.jid}`);
        } catch (error) {
            console.error('Auto-view error:', error);
        }
    }
    
    // Auto Like Status
    static async autoLikeStatus(sock, update) {
        if (!config.AUTO_LIKE_STATUS || !update.status) return;
        
        try {
            // Send reaction (heart) to status
            const reaction = {
                react: {
                    text: "❤️",
                    key: update.key
                }
            };
            await sock.sendMessage(update.jid, reaction);
        } catch (error) {
            console.error('Auto-like error:', error);
        }
    }
    
    // Download media
    static async downloadMedia(sock, msg, type = 'image') {
        try {
            const media = msg.message[`${type}Message`];
            if (!media) return null;
            
            const buffer = await sock.downloadMediaMessage(msg);
            const fileName = `${Date.now()}_${type}.${type === 'image' ? 'jpg' : 'mp4'}`;
            const filePath = path.join(__dirname, '../assets/downloads', fileName);
            
            fs.writeFileSync(filePath, buffer);
            return filePath;
        } catch (error) {
            console.error('Download error:', error);
            return null;
        }
    }
    
    // Check if user is admin
    static async isAdmin(sock, groupJid, userJid) {
        try {
            const metadata = await sock.groupMetadata(groupJid);
            const participants = metadata.participants;
            const user = participants.find(p => p.id === userJid);
            return user?.admin === 'admin' || user?.admin === 'superadmin';
        } catch {
            return false;
        }
    }
    
    // Format bytes
    static formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }
    
    // Get bot uptime
    static getUptime() {
        const uptime = process.uptime();
        const days = Math.floor(uptime / 86400);
        const hours = Math.floor((uptime % 86400) / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);
        
        return `${days}d ${hours}h ${minutes}m ${seconds}s`;
    }
}

module.exports = BotFunctions;
