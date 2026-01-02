const fs = require('fs');
const path = require('path');
const config = require('../config');

// Load all plugins
async function loadCommands(commands) {
    const pluginsDir = path.join(__dirname, '../plugins');
    const pluginFiles = fs.readdirSync(pluginsDir).filter(file => file.endsWith('.js'));
    
    for (const file of pluginFiles) {
        const plugin = require(path.join(pluginsDir, file));
        if (plugin.command && plugin.execute) {
            commands.set(plugin.command, plugin);
            console.log(`✅ Loaded command: ${plugin.command}`);
        }
    }
    
    console.log(`📦 Total commands loaded: ${commands.size}`);
}

// Message handler
async function handleMessages(sock, msg, commands) {
    const message = msg.message.conversation || 
                   msg.message.extendedTextMessage?.text ||
                   msg.message.imageMessage?.caption ||
                   '';
    
    const sender = msg.key.remoteJid;
    const isGroup = sender.endsWith('@g.us');
    const isOwner = sender.includes(config.OWNER_NUMBER);
    const isCmd = message.startsWith(config.PREFIX);
    
    if (!isCmd) return;
    
    const args = message.slice(config.PREFIX.length).trim().split(/ +/);
    const cmd = args.shift().toLowerCase();
    const fullCmd = commands.get(cmd);
    
    if (fullCmd) {
        try {
            await fullCmd.execute(sock, msg, args, {
                isGroup,
                isOwner,
                sender,
                commands
            });
        } catch (error) {
            console.error(`Command error (${cmd}):`, error);
            await sock.sendMessage(sender, {
                text: `❌ Error executing command: ${error.message}`
            });
        }
    } else {
        // Help command
        if (cmd === 'help') {
            await showHelp(sock, sender, commands);
        }
    }
}

// Show help menu
async function showHelp(sock, sender, commands) {
    let helpText = `🤖 *${config.BOT_NAME} HELP MENU*\n\n`;
    helpText += `👤 Owner: ${config.OWNER_NAME}\n`;
    helpText += `📞 Support: ${config.OWNER_NUMBER}\n\n`;
    helpText += `*📋 AVAILABLE COMMANDS:*\n`;
    
    const categories = {};
    
    for (const [cmd, plugin] of commands) {
        const category = plugin.category || 'General';
        if (!categories[category]) categories[category] = [];
        categories[category].push(`• ${config.PREFIX}${cmd} - ${plugin.description || 'No description'}`);
    }
    
    for (const [category, cmds] of Object.entries(categories)) {
        helpText += `\n*${category.toUpperCase()}*\n`;
        helpText += cmds.join('\n');
    }
    
    helpText += `\n\n📚 *Usage:* ${config.PREFIX}<command>\n`;
    helpText += `🌐 *GitHub:* ${config.GITHUB}\n`;
    helpText += `⚡ *Total Commands:* ${commands.size}`;
    
    await sock.sendMessage(sender, { text: helpText });
}

module.exports = { loadCommands, handleMessages };
