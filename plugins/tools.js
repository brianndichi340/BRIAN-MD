const axios = require('axios');
const fs = require('fs');
const path = require('path');
const functions = require('../lib/functions');
const config = require('../config');

module.exports = [
    {
        command: 'ping',
        description: 'Check bot response time',
        category: 'Tools',
        
        async execute(sock, msg, args, options) {
            const { sender } = options;
            const start = Date.now();
            
            await sock.sendMessage(sender, {
                text: '🏓 Pong!'
            });
            
            const latency = Date.now() - start;
            
            await sock.sendMessage(sender, {
                text: `⏱️ Response Time: ${latency}ms\n🕐 Server Time: ${new Date().toLocaleTimeString()}\n📊 Uptime: ${functions.getUptime()}`
            });
        }
    },
    
    {
        command: 'info',
        description: 'Bot information',
        category: 'Tools',
        
        async execute(sock, msg, args, options) {
            const { sender, commands } = options;
            
            const infoText = `🤖 *BRIAN-MD BOT INFORMATION*\n\n` +
                           `👤 *Owner:* ${config.OWNER_NAME}\n` +
                           `📞 *Contact:* ${config.OWNER_NUMBER}\n` +
                           `📧 *Email:* ${config.OWNER_EMAIL}\n` +
                           `🌐 *GitHub:* ${config.GITHUB}\n\n` +
                           `⚡ *Features:*\n` +
                           `• Auto Status View: ${config.AUTO_READ_STATUS ? '✅' : '❌'}\n` +
                           `• Anti Delete: ${config.ANTI_DELETE ? '✅' : '❌'}\n` +
                           `• Always Online: ${config.ALWAYS_ONLINE ? '✅' : '❌'}\n` +
                           `• AI Integration: ${config.OPENAI_KEY ? '✅' : '❌'}\n\n` +
                           `📊 *Statistics:*\n` +
                           `• Commands: ${commands.size}\n` +
                           `• Uptime: ${functions.getUptime()}\n` +
                           `• Memory: ${functions.formatBytes(process.memoryUsage().rss)}\n\n` +
                           `💡 *Use ${config.PREFIX}help to see all commands*`;
            
            await sock.sendMessage(sender, { text: infoText });
        }
    },
    
    {
        command: 'weather',
        description: 'Get weather information',
        category: 'Tools',
        
        async execute(sock, msg, args, options) {
            const { sender } = options;
            
            if (args.length === 0) {
                return sock.sendMessage(sender, {
                    text: `Usage: ${config.PREFIX}weather <city>\nExample: ${config.PREFIX}weather Nairobi`
                });
            }
            
            const city = args.join(' ');
            
            try {
                const response = await axios.get(
                    `http://api.openweathermap.org/data/2.5/weather?q=${city}&appid=your_api_key&units=metric`
                );
                
                const weather = response.data;
                const weatherText = `🌤️ *WEATHER FOR ${weather.name}*\n\n` +
                                  `🌡️ Temperature: ${weather.main.temp}°C\n` +
                                  `💨 Humidity: ${weather.main.humidity}%\n` +
                                  `🌬️ Wind: ${weather.wind.speed} m/s\n` +
                                  `☁️ Condition: ${weather.weather[0].description}\n` +
                                  `🌡️ Feels like: ${weather.main.feels_like}°C\n` +
                                  `📊 Pressure: ${weather.main.pressure} hPa`;
                
                await sock.sendMessage(sender, { text: weatherText });
            } catch (error) {
                await sock.sendMessage(sender, {
                    text: `❌ Failed to get weather: ${error.response?.data?.message || error.message}`
                });
            }
        }
    },
    
    {
        command: 'tts',
        description: 'Text to speech',
        category: 'Tools',
        
        async execute(sock, msg, args, options) {
            const { sender } = options;
            
            if (args.length < 2) {
                return sock.sendMessage(sender, {
                    text: `Usage: ${config.PREFIX}tts <language> <text>\nExample: ${config.PREFIX}tts en Hello World`
                });
            }
            
            const lang = args[0];
            const text = args.slice(1).join(' ');
            
            try {
                const response = await axios.get(
                    `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${lang}&q=${encodeURIComponent(text)}`,
                    { responseType: 'arraybuffer' }
                );
                
                const audioPath = path.join(__dirname, '../assets/tts', `${Date.now()}.mp3`);
                fs.writeFileSync(audioPath, response.data);
                
                await sock.sendMessage(sender, {
                    audio: { url: audioPath },
                    mimetype: 'audio/mpeg'
                });
                
                // Clean up
                setTimeout(() => {
                    if (fs.existsSync(audioPath)) {
                        fs.unlinkSync(audioPath);
                    }
                }, 5000);
            } catch (error) {
                await sock.sendMessage(sender, {
                    text: '❌ Failed to generate TTS'
                });
            }
        }
    }
];
