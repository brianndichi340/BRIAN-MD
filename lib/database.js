const mongoose = require('mongoose');
const config = require('../config');

// User Schema
const userSchema = new mongoose.Schema({
    jid: { type: String, required: true, unique: true },
    name: String,
    isBanned: { type: Boolean, default: false },
    isPremium: { type: Boolean, default: false },
    commandsUsed: { type: Number, default: 0 },
    lastSeen: { type: Date, default: Date.now }
});

// Group Schema
const groupSchema = new mongoose.Schema({
    jid: { type: String, required: true, unique: true },
    name: String,
    isEnabled: { type: Boolean, default: true },
    antilink: { type: Boolean, default: false },
    welcome: { type: Boolean, default: true },
    goodbye: { type: Boolean, default: true },
    lastActivity: { type: Date, default: Date.now }
});

// Session Schema (for remote storage)
const sessionSchema = new mongoose.Schema({
    sessionId: { type: String, required: true, unique: true },
    data: { type: Object, required: true },
    lastUpdated: { type: Date, default: Date.now, expires: '30d' }
});

const User = mongoose.model('User', userSchema);
const Group = mongoose.model('Group', groupSchema);
const Session = mongoose.model('Session', sessionSchema);

async function connectToDatabase() {
    try {
        await mongoose.connect(config.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ Connected to MongoDB');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
    }
}

// Remote session storage
async function saveSession(sessionId, data) {
    try {
        await Session.findOneAndUpdate(
            { sessionId },
            { data, lastUpdated: new Date() },
            { upsert: true, new: true }
        );
        return true;
    } catch (error) {
        console.error('Session save error:', error);
        return false;
    }
}

async function getSession(sessionId) {
    try {
        const session = await Session.findOne({ sessionId });
        return session?.data || null;
    } catch (error) {
        console.error('Session get error:', error);
        return null;
    }
}

module.exports = {
    connectToDatabase,
    saveSession,
    getSession,
    User,
    Group,
    Session
};
