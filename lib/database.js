const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('✅ Connected to MongoDB for BRIAN-MD');
}).catch(err => {
    console.error('❌ MongoDB connection error:', err);
});

module.exports = mongoose;
