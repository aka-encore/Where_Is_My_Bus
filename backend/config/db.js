const mongoose = require('mongoose');
const dns = require('dns');

// Configure DNS resolution fallback for Windows/ISP DNS SRV lookup issues
try {
  dns.setDefaultResultOrder('ipv4first');
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (err) {
  // Gracefully fallback if setting custom DNS servers is restricted in environment
}

let connectionCache = null;

const connectDB = async () => {
  if (connectionCache) {
    return connectionCache;
  }

  const uri = process.env.MONGO_URI;
  const dbName = process.env.DB_NAME || 'TrackMatev1';

  if (!uri) {
    throw new Error('MONGO_URI is not defined in the environment variables');
  }

  mongoose.set('strictQuery', true);

  connectionCache = mongoose
    .connect(uri, {
      dbName,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000
    })
    .then((conn) => {
      console.log('✅ MongoDB connected to database:', dbName);
      return conn;
    })
    .catch((error) => {
      connectionCache = null;
      console.error('❌ MongoDB connection error:', error.message);
      if (error.message.includes('querySrv') || error.message.includes('ECONNREFUSED')) {
        console.error('💡 Tip: DNS SRV lookup failed. Try using standard mongodb:// connection string or check DNS settings.');
      } else if (error.message.includes('whitelist') || error.message.includes('Could not connect to any servers') || error.name === 'MongoServerSelectionError') {
        console.error('💡 Tip: IP Whitelist issue. Please add your IP (or 0.0.0.0/0) in MongoDB Atlas Network Access: https://cloud.mongodb.com');
      }
      process.exit(1);
    });

  return connectionCache;
};

module.exports = connectDB;
