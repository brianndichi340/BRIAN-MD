const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { connectToDatabase, Session } = require('../lib/database');

async function restoreSession(sessionId = null) {
    console.log('🔄 Starting session restoration...');
    
    await connectToDatabase();
    
    if (sessionId) {
        // Restore specific session
        console.log(`🔍 Looking for session: ${sessionId}`);
        
        const session = await Session.findOne({ sessionId });
        if (session && session.data) {
            console.log('✅ Found session in database');
            
            // Save to local files
            const sessionsDir = './sessions';
            if (!fs.existsSync(sessionsDir)) {
                fs.mkdirSync(sessionsDir, { recursive: true });
            }
            
            // Write session files
            for (const [filename, content] of Object.entries(session.data)) {
                const filePath = path.join(sessionsDir, filename);
                fs.writeFileSync(filePath, JSON.stringify(content, null, 2));
                console.log(`💾 Restored: ${filename}`);
            }
            
            console.log('✅ Session restored successfully');
            return true;
        } else {
            console.log('❌ Session not found');
            return false;
        }
    } else {
        // List available sessions
        console.log('📋 Available sessions in database:');
        
        const sessions = await Session.find({}).sort({ lastUpdated: -1 }).limit(10);
        
        if (sessions.length === 0) {
            console.log('📭 No sessions found in database');
            return false;
        }
        
        sessions.forEach((session, index) => {
            console.log(`${index + 1}. ${session.sessionId} - ${new Date(session.lastUpdated).toLocaleString()}`);
        });
        
        return sessions;
    }
}

// Command line interface
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.includes('--list') || args.includes('-l')) {
        restoreSession();
    } else if (args[0]) {
        restoreSession(args[0]);
    } else {
        console.log('Usage:');
        console.log('  node restore-session.js [session-id]');
        console.log('  node restore-session.js --list');
        console.log('\nExample:');
        console.log('  node restore-session.js brian-md-production-01');
    }
}

module.exports = { restoreSession };
