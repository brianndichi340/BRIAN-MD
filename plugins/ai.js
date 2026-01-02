const { OpenAI } = require('openai');
const config = require('../config');

const openai = new OpenAI({
    apiKey: config.OPENAI_KEY
});

module.exports = {
    command: 'ai',
    description: 'ChatGPT AI Assistant',
    category: 'AI',
    
    async execute(sock, msg, args, options) {
        const { sender } = options;
        
        if (!config.OPENAI_KEY) {
            return sock.sendMessage(sender, {
                text: '❌ AI feature is not configured. Please add OpenAI API key.'
            });
        }
        
        if (args.length === 0) {
            return sock.sendMessage(sender, {
                text: `Usage: ${config.PREFIX}ai <your question>\nExample: ${config.PREFIX}ai What is quantum computing?`
            });
        }
        
        const question = args.join(' ');
        
        await sock.sendMessage(sender, {
            text: '🤔 Thinking...'
        });
        
        try {
            const response = await openai.chat.completions.create({
                model: "gpt-4",
                messages: [
                    {
                        role: "system",
                        content: "You are BRIAN-MD, a helpful WhatsApp assistant created by Brian. Keep responses concise and friendly."
                    },
                    {
                        role: "user",
                        content: question
                    }
                ],
                max_tokens: 500
            });
            
            const answer = response.choices[0].message.content;
            
            await sock.sendMessage(sender, {
                text: `🧠 *AI Response*\n\n${answer}\n\n_Powered by OpenAI GPT-4_`
            });
            
        } catch (error) {
            await sock.sendMessage(sender, {
                text: `❌ AI Error: ${error.message}`
            });
        }
    }
};
