const fs = require('fs');
const path = require('path');

module.exports = {
    // Bot Information
    name: "BRIAN-MD",
    author: "Brian Ndichi",
    version: "3.0.0",
    
    // Session Configuration
    session: process.env.SESSION_ID || "BrianSession",
    
    // Bot Settings
    prefix: process.env.PREFIX || ".",
    mods: (process.env.MODS || "").split(",").map(num => num.trim() + "@s.whatsapp.net"),
    
    // Database
    mongodb: process.env.MONGODB_URI || "",
    
    // Features
    autoReadStatus: process.env.AUTO_READ_STATUS === "true",
    autoTyping: process.env.AUTO_TYPING === "true",
    maxUploadSize: parseInt(process.env.MAX_UPLOAD_SIZE) || 100,
    antiSpam: process.env.ANTI_SPAM === "true",
    
    // API Keys
    openai: process.env.OPENAI_API_KEY,
    deepai: process.env.DEEPAI_API_KEY,
    
    // Paths
    sessionPath: path.join(__dirname, 'sessions', `${process.env.SESSION_ID || 'session'}.json`)
};};
