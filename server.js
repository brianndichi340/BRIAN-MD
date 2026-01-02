const express = require('express');
const cors = require('cors');
const session = require('express-session');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const PairingHandler = require('./pairing-handler');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Session middleware
app.use(session({
    secret: process.env.SESSION_SECRET || 'brian-md-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV === 'production' }
}));

// Pairing endpoint
app.post('/api/pair/generate', async (req, res) => {
    try {
        const { phoneNumber } = req.body;
        
        if (!phoneNumber || phoneNumber.length < 10) {
            return res.status(400).json({
                success: false,
                error: 'Valid phone number required'
            });
        }
        
        const result = await PairingHandler.generatePairingCode(phoneNumber);
        
        if (result.success) {
            res.json({
                success: true,
                code: result.code,
                hash: result.hash,
                expiresIn: '5 minutes'
            });
        } else {
            res.status(500).json(result);
        }
    } catch (error) {
        console.error('Pair generation error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Verification endpoint
app.post('/api/pair/verify', async (req, res) => {
    try {
        const { code, hash } = req.body;
        
        if (!code || !hash) {
            return res.status(400).json({
                success: false,
                error: 'Code and hash required'
            });
        }
        
        const result = await PairingHandler.verifyPairingCode(code, hash);
        
        if (result.success) {
            // Store in session
            req.session.sessionToken = result.sessionToken;
            req.session.sessionId = result.sessionId;
            
            res.json({
                success: true,
                sessionToken: result.sessionToken,
                sessionId: result.sessionId,
                message: result.message
            });
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        console.error('Pair verification error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Session validation endpoint
app.get('/api/session/validate', (req, res) => {
    const { sessionToken } = req.query;
    
    if (!sessionToken) {
        return res.status(400).json({
            success: false,
            error: 'Session token required'
        });
    }
    
    const result = PairingHandler.validateSession(sessionToken);
    
    if (result.valid) {
        res.json({
            success: true,
            session: result.session
        });
    } else {
        res.status(401).json(result);
    }
});

// QR Code endpoint (alternative to pairing)
app.get('/api/qr', async (req, res) => {
    try {
        const SessionManager = require('./session');
        const qr = await SessionManager.generateQR();
        
        res.json({
            success: true,
            qr: qr,
            expiresIn: '2 minutes'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to generate QR'
        });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📱 Pairing API available at http://localhost:${PORT}/api/pair/generate`);
});
