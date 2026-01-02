module.exports = {
    // Bot Information
    BOT_NAME: "BRIAN-MD",
    OWNER_NAME: "Brian",
    OWNER_NUMBER: "254717276195",
    OWNER_EMAIL: "brianndichi340@gmail.com",
    GITHUB: "https://github.com/brianndichi340",
    
    // Bot Settings
    PREFIX: ".",
    SESSION_ID: process.env.SESSION_ID || "brian-md-session-01",
    
    // Features
    AUTO_READ_STATUS: true,
    AUTO_LIKE_STATUS: true,
    ANTI_DELETE: true,
    ALWAYS_ONLINE: true,
    ANTI_BUG: true,
    PAIR_CODE_ENABLED: true,
    
    // API Keys
    OPENAI_KEY: process.env.OPENAI_KEY || "",
    
    // Database
    MONGODB_URI: process.env.MONGODB_URI || "mongodb://localhost:27017/brian-bot",
    
    // Deployment
    PORT: process.env.PORT || 3000,
    DEPLOYMENT_URL: process.env.DEPLOYMENT_URL || "",
    
    // Security
    ADMIN_TOKEN: process.env.ADMIN_TOKEN || "brian-md-secret-token-2024",
    
    // Session Settings
    SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
    PAIR_CODE_TIMEOUT: 5 * 60 * 1000, // 5 minutes
};
