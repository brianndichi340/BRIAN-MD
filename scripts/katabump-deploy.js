#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Starting Katabump Deployment for BRIAN-MD');

// Read configuration
const configPath = path.join(__dirname, '../katabump.json');
const katabumpConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

console.log(`📦 Project: ${katabumpConfig.name}`);
console.log(`📝 Version: ${katabumpConfig.version}`);
console.log(`👤 Author: ${katabumpConfig.author}`);

// Create deployment package
console.log('\n📁 Creating deployment package...');

const deployDir = path.join(__dirname, '../deploy');
if (!fs.existsSync(deployDir)) {
    fs.mkdirSync(deployDir, { recursive: true });
}

// List of files to include in deployment
const includeFiles = [
    'index.js',
    'config.js',
    'package.json',
    'package-lock.json',
    '.env.example',
    '.gitignore',
    'README.md',
    'Procfile',
    'katabump.json',
    'lib/',
    'plugins/',
    'scripts/',
    'public/'
];

// Create deployment manifest
const manifest = {
    timestamp: new Date().toISOString(),
    version: katabumpConfig.version,
    files: includeFiles,
    checksum: {}
};

// Copy files to deploy directory
console.log('\n📋 Copying files...');
for (const file of includeFiles) {
    const src = path.join(__dirname, '..', file);
    const dest = path.join(deployDir, file);
    
    if (fs.existsSync(src)) {
        if (fs.lstatSync(src).isDirectory()) {
            // Copy directory
            copyDir(src, dest);
            console.log(`  📁 ${file}/`);
        } else {
            // Copy file
            fs.copyFileSync(src, dest);
            console.log(`  📄 ${file}`);
        }
    }
}

// Create environment file for deployment
console.log('\n🔧 Creating environment configuration...');
const envVars = katabumpConfig.deploy.environment;
const envContent = Object.entries(envVars)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

fs.writeFileSync(path.join(deployDir, '.env'), envContent);

// Create deployment script
const deployScript = `#!/bin/bash

echo "🚀 Deploying BRIAN-MD to Katabump"
echo "📦 Version: ${katabumpConfig.version}"
echo "⏰ Started at: \$(date)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install --production

# Create necessary directories
mkdir -p sessions
mkdir -p assets/downloads
mkdir -p backups

# Set permissions
chmod +x scripts/*.js

# Start the bot
echo "🤖 Starting BRIAN-MD bot..."
npm start

echo "✅ Deployment script completed"
`;

fs.writeFileSync(path.join(deployDir, 'deploy.sh'), deployScript);
fs.chmodSync(path.join(deployDir, 'deploy.sh'), '755');

// Create README for deployment
const deployReadme = `# BRIAN-MD Deployment

This is the deployment package for BRIAN-MD WhatsApp Bot.

## Quick Start

1. Upload this folder to Katabump
2. Set environment variables in Katabump dashboard
3. Deploy!

## Environment Variables

${Object.entries(envVars).map(([k, v]) => `- \`${k}\`: ${k.includes('KEY') || k.includes('TOKEN') ? '***SECRET***' : v}`).join('\n')}

## Endpoints

- \`/\` - Bot information
- \`/health\` - Health check
- \`/qr\` - QR code for authentication
- \`/verify-pair\` - Pair code verification
- \`/session\` - Session information

## Monitoring

Check Katabump dashboard for:
- CPU/Memory usage
- Request logs
- Error tracking

## Support

Contact: ${katabumpConfig.author}
Repository: ${katabumpConfig.repository}
`;

fs.writeFileSync(path.join(deployDir, 'DEPLOYMENT.md'), deployReadme);

console.log('\n✅ Deployment package created at:', deployDir);
console.log('\n📦 Package size:', getDirectorySize(deployDir), 'bytes');
console.log('\n🚀 Ready to deploy to Katabump!');

// Helper functions
function copyDir(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }
    
    const items = fs.readdirSync(src);
    for (const item of items) {
        const srcPath = path.join(src, item);
        const destPath = path.join(dest, item);
        
        if (fs.lstatSync(srcPath).isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

function getDirectorySize(dir) {
    let size = 0;
    
    function traverse(currentPath) {
        const items = fs.readdirSync(currentPath);
        
        for (const item of items) {
            const itemPath = path.join(currentPath, item);
            const stats = fs.statSync(itemPath);
            
            if (stats.isDirectory()) {
                traverse(itemPath);
            } else {
                size += stats.size;
            }
        }
    }
    
    traverse(dir);
    return size;
}

// Instructions for Katabump deployment
console.log('\n📋 KATABUMP DEPLOYMENT INSTRUCTIONS:');
console.log('====================================');
console.log('1. Go to https://katabump.com');
console.log('2. Create new application');
console.log('3. Upload the "deploy" folder');
console.log('4. Set environment variables:');
for (const [key, value] of Object.entries(envVars)) {
    console.log(`   ${key}=${key.includes('KEY') || key.includes('TOKEN') ? '***SET_YOUR_VALUE***' : value}`);
}
console.log('5. Deploy and monitor logs');
console.log('6. Access your bot at the provided URL');
console.log('7. Go to /qr endpoint to get authentication QR code');
