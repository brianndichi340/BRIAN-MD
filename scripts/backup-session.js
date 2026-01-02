const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { connectToDatabase, Session } = require('../lib/database');
const config = require('../config');

async function backupSessions() {
    console.log('💾 Starting session backup...');
    
    // Connect to database
    try {
        await connectToDatabase();
    } catch (error) {
        console.error('❌ Database connection failed:', error);
        return;
    }
    
    // Backup local sessions
    const sessionsDir = './sessions';
    const backupDir = './backups';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }
    
    if (fs.existsSync(sessionsDir)) {
        const backupFile = path.join(backupDir, `session-backup-${timestamp}.zip`);
        
        // Create zip backup
        exec(`zip -r ${backupFile} ${sessionsDir}`, (error) => {
            if (error) {
                console.error('❌ Backup creation failed:', error);
            } else {
                console.log(`✅ Local backup created: ${backupFile}`);
                
                // Upload to database
                const backupData = {
                    timestamp: new Date(),
                    filename: `session-backup-${timestamp}.zip`,
                    size: fs.statSync(backupFile).size
                };
                
                // Save backup info to database
                const backupRecord = new Session({
                    sessionId: `backup-${timestamp}`,
                    data: backupData
                });
                
                backupRecord.save()
                    .then(() => {
                        console.log('✅ Backup info saved to database');
                    })
                    .catch(err => {
                        console.error('❌ Failed to save backup info:', err);
                    });
            }
        });
    } else {
        console.log('📭 No local sessions to backup');
    }
    
    // Backup database sessions
    try {
        const sessions = await Session.find({});
        const dbBackupFile = path.join(backupDir, `db-sessions-${timestamp}.json`);
        
        const dbBackup = {
            timestamp: new Date(),
            count: sessions.length,
            sessions: sessions.map(s => ({
                sessionId: s.sessionId,
                lastUpdated: s.lastUpdated
            }))
        };
        
        fs.writeFileSync(dbBackupFile, JSON.stringify(dbBackup, null, 2));
        console.log(`✅ Database sessions backed up: ${dbBackupFile}`);
        
    } catch (error) {
        console.error('❌ Database backup failed:', error);
    }
    
    console.log('✅ Backup completed');
}

// Run backup
backupSessions();

// Schedule regular backups if run directly
if (require.main === module) {
    // Run every 6 hours
    setInterval(backupSessions, 6 * 60 * 60 * 1000);
    
    // Also run on startup
    backupSessions();
    
    console.log('⏰ Scheduled backups every 6 hours');
}
