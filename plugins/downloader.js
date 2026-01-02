const ytdl = require('ytdl-core');
const axios = require('axios');

module.exports = [
    {
        command: 'yt',
        description: 'YouTube downloader',
        category: 'Downloader',
        
        async execute(sock, msg, args, options) {
            const { sender } = options;
            
            if (args.length === 0) {
                return sock.sendMessage(sender, {
                    text: `Usage: ${config.PREFIX}yt <YouTube URL>\nExample: ${config.PREFIX}yt https://youtu.be/dQw4w9WgXcQ`
                });
            }
            
            const url = args[0];
            
            if (!ytdl.validateURL(url)) {
                return sock.sendMessage(sender, {
                    text: '❌ Invalid YouTube URL'
                });
            }
            
            await sock.sendMessage(sender, {
                text: '📥 Fetching video info...'
            });
            
            try {
                const info = await ytdl.getInfo(url);
                const video = info.videoDetails;
                
                const optionsText = `🎬 *${video.title}*\n\n` +
                                  `👁️ Views: ${video.viewCount}\n` +
                                  `👍 Likes: ${video.likes || 'N/A'}\n` +
                                  `⏱️ Duration: ${video.lengthSeconds}s\n\n` +
                                  `Choose quality:\n` +
                                  `1. ${config.PREFIX}ytmp3 ${url} (Audio)\n` +
                                  `2. ${config.PREFIX}ytmp4 ${url} (360p)\n` +
                                  `3. ${config.PREFIX}ytmp4hd ${url} (720p)`;
                
                await sock.sendMessage(sender, { text: optionsText });
            } catch (error) {
                await sock.sendMessage(sender, {
                    text: `❌ Download error: ${error.message}`
                });
            }
        }
    },
    
    {
        command: 'instagram',
        description: 'Instagram downloader',
        category: 'Downloader',
        
        async execute(sock, msg, args, options) {
            const { sender } = options;
            
            if (args.length === 0) {
                return sock.sendMessage(sender, {
                    text: `Usage: ${config.PREFIX}instagram <URL>\nExample: ${config.PREFIX}instagram https://www.instagram.com/p/...`
                });
            }
            
            // Implement Instagram downloader using external API
            await sock.sendMessage(sender, {
                text: '⚠️ This feature requires API key. Implement using services like rapidapi.com'
            });
        }
    }
];
