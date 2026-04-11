require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// ─── Import Routes ─────────────────────────────────────────
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const photoRoutes = require('./routes/photos');
const groupRoutes = require('./routes/groups');
const inviteRoutes = require('./routes/invites');
const widgetRoutes = require('./routes/widgets');

// ─── Import Socket Server ──────────────────────────────────
const setupSocketServer = require('./socket');

// ─── Connect Database ──────────────────────────────────────
connectDB();

const app = express();
app.use(helmet());
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT'] }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Health Check ──────────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'SnapIt MVP Clone API is running 🚀'
  });
});

// ─── API Routes ────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/photos', photoRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/invites', inviteRoutes);
app.use('/api/widgets', widgetRoutes);

// ─── Global Error Handler ──────────────────────────────────
app.use(errorHandler);

// ─── Create HTTP Server + Socket.io ───────────────────────
const server = http.createServer(app);
setupSocketServer(server, app);

// ─── Start Server ──────────────────────────────────────────
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 SnapIt server running on port ${PORT}`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Please kill the process or change the port.`);
    process.exit(1);
  } else {
    console.error('❌ Server error:', err);
    process.exit(1);
  }
});

module.exports = { app, server };
