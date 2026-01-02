const mongoose = require('./database');

const pairingCodeSchema = new mongoose.Schema({
    code: { 
        type: String, 
        required: true, 
        unique: true,
        match: /^\d{8}$/ // 8-digit code validation
    },
    userId: { type: String, default: null },
    isUsed: { type: Boolean, default: false },
    expiresAt: { 
        type: Date, 
        default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) // Expires in 24 hours
    },
    createdAt: { type: Date, default: Date.now }
});

pairingCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const PairingCode = mongoose.model('PairingCode', pairingCodeSchema);

// Function to generate a unique 8-digit code
const generatePairingCode = async () => {
    let code;
    let isUnique = false;
    
    while (!isUnique) {
        code = Math.floor(10000000 + Math.random() * 90000000).toString();
        const existingCode = await PairingCode.findOne({ code });
        if (!existingCode) {
            isUnique = true;
        }
    }
    
    const newCode = new PairingCode({ code });
    await newCode.save();
    return code;
};

module.exports = { PairingCode, generatePairingCode };
