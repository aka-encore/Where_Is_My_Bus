const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const http = require('http');
const rateLimit = require('express-rate-limit');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const { ensureDefaultAccounts } = require('./controllers/authController');
const authRoutes = require('./routes/authRoutes');
const routeRoutes = require('./routes/routeRoutes');
const tripRoutes = require('./routes/tripRoutes');
const adminRoutes = require('./routes/adminRoutes');
const busRoutes = require('./routes/busRoutes');
const driverRoutes = require('./routes/driverRoutes');
const stopRoutes = require('./routes/stopRoutes');
const studentRoutes = require('./routes/studentRoutes');
const eventRoutes = require('./routes/eventRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const { registerLocationHandlers } = require('./controllers/locationController');
const publicRoutes = require('./routes/publicRoutes');

const app = express();

// Trust proxy on hosted platforms (Render, Heroku, etc.) — required for rate limiting
app.set('trust proxy', 1);

// CORS configuration - use specific origins in production
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? allowedOrigins : '*',
  credentials: true
}));

app.use(express.json());

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 10 : 200, // permissive in development
  message: { message: 'Too many login attempts, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false
});

// Apply rate limiting to auth routes
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: process.env.NODE_ENV === 'production' ? 5 : 100,
  message: { message: 'Too many registration attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
}));

app.use('/api/auth', authRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/buses', busRoutes);
app.use('/api/driver', driverRoutes);
app.use('/api/stops', stopRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/students', studentRoutes); // Alias for frontend compatibility
app.use('/api/events', eventRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/public', publicRoutes);

// Lightweight health check — used by UptimeRobot / cron pings to prevent Render sleep
app.get('/ping', (_req, res) => {
  const uptimeSec = process.uptime();
  const h = Math.floor(uptimeSec / 3600);
  const m = Math.floor((uptimeSec % 3600) / 60);
  const s = Math.floor(uptimeSec % 60);
  const uptime = `${h}h ${m}m ${s}s`;

  res.status(200).send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Where Is My Bus — Status</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#292522;color:#F5F0E8;overflow:hidden}
.bg{position:fixed;inset:0;z-index:0}
.bg span{position:absolute;border-radius:50%;filter:blur(80px);opacity:.18;animation:float 8s ease-in-out infinite alternate}
.bg span:nth-child(1){width:400px;height:400px;background:#690907;top:-10%;left:-5%}
.bg span:nth-child(2){width:350px;height:350px;background:#E8D2B5;bottom:-10%;right:-5%;animation-delay:2s}
.bg span:nth-child(3){width:250px;height:250px;background:#A5A79B;top:50%;left:50%;transform:translate(-50%,-50%);animation-delay:4s}
@keyframes float{0%{transform:translate(0,0) scale(1)}100%{transform:translate(30px,-20px) scale(1.1)}}
.card{position:relative;z-index:1;background:rgba(41,37,34,.75);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border:1px solid rgba(232,210,181,.2);border-radius:24px;padding:2.5rem 3rem;text-align:center;max-width:380px;width:90%;box-shadow:0 25px 60px rgba(0,0,0,.5)}
.logo{font-size:1.5rem;font-weight:800;letter-spacing:-.02em;margin-bottom:1.5rem;background:linear-gradient(135deg,#E8D2B5,#F5F0E8);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.logo span{font-size:.7rem;display:block;font-weight:500;letter-spacing:.15em;text-transform:uppercase;-webkit-text-fill-color:#A5A79B;margin-top:.25rem}
.pulse-wrap{display:flex;align-items:center;justify-content:center;gap:.6rem;margin-bottom:1.75rem}
.pulse{width:12px;height:12px;border-radius:50%;background:#22c55e;box-shadow:0 0 12px #22c55e80;animation:pulse 2s ease-in-out infinite}
@keyframes pulse{0%,100%{box-shadow:0 0 8px #22c55e60}50%{box-shadow:0 0 20px #22c55eaa,0 0 40px #22c55e40}}
.status{font-size:1rem;font-weight:600;color:#22c55e}
.stats{display:grid;grid-template-columns:1fr 1fr;gap:.75rem;margin-bottom:1.5rem}
.stat{background:rgba(255,255,255,.05);border:1px solid rgba(232,210,181,.12);border-radius:14px;padding:.85rem .5rem}
.stat-label{font-size:.6rem;text-transform:uppercase;letter-spacing:.1em;color:#A5A79B;margin-bottom:.35rem}
.stat-value{font-size:.95rem;font-weight:700;color:#F5F0E8}
.stat-value.accent{color:#E8D2B5}
.foot{font-size:.65rem;color:#A5A79B;line-height:1.6}
.foot a{color:#E8D2B5;text-decoration:none}
</style>
</head>
<body>
<div class="bg"><span></span><span></span><span></span></div>
<div class="card">
  <div class="logo">Where Is My Bus<span>System Status</span></div>
  <div class="pulse-wrap"><div class="pulse"></div><div class="status">All Systems Operational</div></div>
  <div class="stats">
    <div class="stat"><div class="stat-label">Uptime</div><div class="stat-value accent">${uptime}</div></div>
    <div class="stat"><div class="stat-label">Status</div><div class="stat-value">Online</div></div>
    <div class="stat"><div class="stat-label">Server</div><div class="stat-value">Active</div></div>
    <div class="stat"><div class="stat-label">Checked</div><div class="stat-value">${new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' })}</div></div>
  </div>
  <div class="foot">Monitored by System Health &middot; <a href="/">Go to Where Is My Bus</a></div>
</div>
</body>
</html>`);
});

app.get('/', (_req, res) => {
  res.json({ message: 'Where Is My Bus backend is running' });
});

// Global error handler - must be last middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack);

  // Don't leak error details in production
  const message = process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : err.message;

  res.status(err.status || 500).json({
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // In production, you might want to gracefully shut down
  // For now, just log the error
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Graceful shutdown
  process.exit(1);
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? allowedOrigins : '*',
    credentials: true
  }
});
app.set('io', io);

// --- Live Visitor Counter ---
let liveVisitorCount = 0;
app.set('getLiveVisitorCount', () => Math.max(1, liveVisitorCount));

io.on('connection', (socket) => {
  liveVisitorCount++;
  io.emit('stats:live_visitors', liveVisitorCount);
  socket.emit('stats:live_visitors', liveVisitorCount);

  socket.on('stats:get_visitors', () => {
    socket.emit('stats:live_visitors', Math.max(1, liveVisitorCount));
  });

  socket.on('disconnect', () => {
    liveVisitorCount = Math.max(0, liveVisitorCount - 1);
    io.emit('stats:live_visitors', liveVisitorCount);
  });
});

registerLocationHandlers(io);

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  await ensureDefaultAccounts();
  server.listen(PORT, '0.0.0.0', () => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`🚍 WhereIsMyBus backend listening on port ${PORT}`);
    }
  });
};

start();
