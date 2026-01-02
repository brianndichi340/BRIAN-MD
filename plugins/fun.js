const axios = require('axios');

module.exports = [
    {
        command: 'sticker',
        description: 'Create sticker from image',
        category: 'Fun',
        
        async execute(sock, msg, args, options) {
            const { sender } = options;
            
            if (msg.message.imageMessage) {
                await sock.sendMessage(sender, {
                    text: '⏳ Converting to sticker...'
                });
                
                // Implement sticker creation logic
                await sock.sendMessage(sender, {
                    sticker: { url: 'path/to/sticker.webp' }
                });
            } else {
                await sock.sendMessage(sender, {
                    text: '❌ Please send an image with caption .sticker'
                });
            }
        }
    },
    
    {
        command: 'meme',
        description: 'Get random meme',
        category: 'Fun',
        
        async execute(sock, msg, args, options) {
            const { sender } = options;
            
            try {
                const response = await axios.get('https://meme-api.com/gimme');
                const meme = response.data;
                
                await sock.sendMessage(sender, {
                    image: { url: meme.url },
                    caption: `📛 ${meme.title}\n👤 ${meme.author}\n⬆️ ${meme.ups} upvotes`
                });
            } catch (error) {
                await sock.sendMessage(sender, {
                    text: '❌ Failed to fetch meme'
                });
            }
        }
    },
    
    {
        command: 'joke',
        description: 'Get a random joke',
        category: 'Fun',
        
        async execute(sock, msg, args, options) {
            const { sender } = options;
            
            try {
                const response = await axios.get('https://v2.jokeapi.dev/joke/Any');
                const joke = response.data;
                
                let jokeText = '';
                if (joke.type === 'single') {
                    jokeText = joke.joke;
                } else {
                    jokeText = `${joke.setup}\n\n${joke.delivery}`;
                }
                
                await sock.sendMessage(sender, {
                    text: `😂 *JOKE*\n\n${jokeText}\n\nCategory: ${joke.category}`
                });
            } catch (error) {
                await sock.sendMessage(sender, {
                    text: '❌ Failed to fetch joke'
                });
            }
        }
    }
];
