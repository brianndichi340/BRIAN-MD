const { exec } = require('child_process');
const crypto = require('crypto');
require('dotenv').config();

const KATABUMP_SECRET = process.env.KATABUMP_SECRET; // Set this in your .env

const verifySignature = (payload, signature) => {
    const hmac = crypto.createHmac('sha256', KATABUMP_SECRET);
    const digest = hmac.update(payload).digest('hex');
    return `sha256=${digest}` === signature;
};

module.exports.handleWebhook = async (req, res) => {
    const payload = JSON.stringify(req.body);
    const signature = req.headers['x-hub-signature-256'];
    
    if (!verifySignature(payload, signature)) {
        return res.status(401).send('Invalid signature');
    }
    
    if (req.body.ref === 'refs/heads/main') {
        console.log('🚀 Katabump triggered for main branch');
        exec('git pull && npm install && pm2 restart all', (error) => {
            if (error) {
                console.error('Katabump error:', error);
                return res.status(500).send('Deployment failed');
            }
            console.log('✅ BRIAN-MD successfully updated via Katabump');
            res.status(200).send('Deployment successful');
        });
    } else {
        res.status(200).send('Not main branch, ignoring');
    }
};
