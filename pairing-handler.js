const crypto = require('crypto');
const config = require('./config');

class PairingHandler {
    constructor() {
        this.pairingCodes = new Map(); // Store pairing codes
        this.activeSessions = new Map(); // Store active sessions
    }

    // Generate 8-digit pairing code with encryption
    async generatePairingCode(phoneNumber) {
        try {
            // Generate random 8-digit code
            const rawCode = Math.floor(10000000 + Math.random() * 90000000).toString();
            
            // Create hash for security
            const hash = crypto
                .createHash('sha256')
                .update(rawCode + phoneNumber + Date.now())
                .digest('hex');
            
            const pairingData = {
                code: rawCode,
                hash: hash,
                phoneNumber: phoneNumber,
                createdAt: new Date(),
                expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
                verified: false,
                sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            };
            
            // Store in memory (in production, use Redis/MongoDB)
            this.pairingCodes.set(hash, pairingData);
            
            // Schedule cleanup
            setTimeout(() => {
                this.pairingCodes.delete(hash);
            }, 5 * 60 * 1000);
            
            return {
                success: true,
                code: rawCode,
                hash: hash,
                message: `Your pairing code is: ${rawCode}\nThis code expires in 5 minutes.`
            };
            
        } catch (error) {
            console.error('Pairing code generation error:', error);
            return { success: false, error: 'Failed to generate pairing code' };
        }
    }

    // Verify pairing code
    async verifyPairingCode(code, hash) {
        try {
            const pairingData = this.pairingCodes.get(hash);
            
            if (!pairingData) {
                return { success: false, error: 'Invalid or expired pairing code' };
            }
            
            // Check expiry
            if (new Date() > pairingData.expiresAt) {
                this.pairingCodes.delete(hash);
                return { success: false, error: 'Pairing code expired' };
            }
            
            // Verify code
            if (pairingData.code !== code) {
                return { success: false, error: 'Invalid pairing code' };
            }
            
            // Mark as verified
            pairingData.verified = true;
            pairingData.verifiedAt = new Date();
            
            // Generate session token
            const sessionToken = crypto
                .randomBytes(32)
                .toString('hex');
            
            // Store active session
            this.activeSessions.set(sessionToken, {
                ...pairingData,
                sessionToken,
                lastActivity: new Date()
            });
            
            // Clean up pairing code
            this.pairingCodes.delete(hash);
            
            return {
                success: true,
                sessionToken,
                sessionId: pairingData.sessionId,
                message: 'Pairing successful! Session created.'
            };
            
        } catch (error) {
            console.error('Pairing verification error:', error);
            return { success: false, error: 'Verification failed' };
        }
    }

    // Validate session token
    validateSession(sessionToken) {
        const session = this.activeSessions.get(sessionToken);
        
        if (!session) {
            return { valid: false, error: 'Invalid session' };
        }
        
        // Update last activity
        session.lastActivity = new Date();
        
        return {
            valid: true,
            session: {
                phoneNumber: session.phoneNumber,
                sessionId: session.sessionId,
                createdAt: session.createdAt
            }
        };
    }
}

module.exports = new PairingHandler();
