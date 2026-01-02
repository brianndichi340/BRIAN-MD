module.exports = {
    // Bot Information
    BOT_NAME: "BRIAN-MD",
    OWNER_NAME: "Brian",
    OWNER_NUMBER: "254717276195",
    OWNER_EMAIL: "brianndichi340@gmail.com",
    GITHUB: "https://github.com/brianndichi340",
    
    // Bot Settings
    PREFIX: ".",
    SESSION_NAME: "brian_session",
    
    // Features
    AUTO_READ_STATUS: true,
    AUTO_LIKE_STATUS: true,
    ANTI_DELETE: true,
    ALWAYS_ONLINE: true,
    ANTI_BUG: true,
    
    // API Keys (Add to .env)
    OPENAI_KEY: process.env.OPENAI_KEY || "",
    
    // Database
    MONGODB_URI: process.env.MONGODB_URI || "mongodb://localhost:27017/brian-bot",
    
    // Deployment
    PORT: process.env.PORT || 3000,
    DEPLOYMENT_URL: process.env.DEPLOYMENT_URL || ""
};
