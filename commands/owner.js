const PairingCode = require('../lib/pairing'); // We'll create this

module.exports = {
    name: 'owner',
    execute: async (sock, msg, args, from, isOwner) => {
        if (!isOwner) {
            await sock.sendMessage(from, { text: '❌ This command is for the owner only.' });
            return;
        }

        const command = args[0]?.toLowerCase().replace(/[!./?#-]/, '');

        switch(command) {
            case 'bc':
                const broadcastText = args.slice(1).join(' ');
                if (!broadcastText) {
                    await sock.sendMessage(from, { text: 'Usage: *.bc <your message>*' });
                    return;
                }
                const chats = await sock.groupFetchAllParticipating();
                for (const group of Object.values(chats)) {
                    await sock.sendMessage(group.id, { text: `📢 *BROADCAST*\n\n${broadcastText}` });
                }
                await sock.sendMessage(from, { text: `✅ Broadcast sent to ${Object.values(chats).length} groups.` });
                break;

            case 'pairlist':
                try {
                    const codes = await PairingCode.find({});
                    let listText = '🔑 *ACTIVE PAIRING CODES*\n\n';
                    codes.forEach(code => {
                        listText += `Code: *${code.code}*\nUser: ${code.userId || 'Not Used'}\nExpires: ${new Date(code.expiresAt).toLocaleString()}\n\n`;
                    });
                    await sock.sendMessage(from, { text: listText });
                } catch (err) {
                    await sock.sendMessage(from, { text: `❌ Error: ${err.message}` });
                }
                break;

            case 'restart':
                await sock.sendMessage(from, { text: '🔄 Restarting bot...' });
                process.exit(0);
                break;
        }
    }
};
