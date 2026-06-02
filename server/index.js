require('dotenv').config();
const express    = require('express');
const http       = require('http');
const { Server } = require('socket.io');
const cors       = require('cors');
const mongoose   = require('mongoose');

const authRoutes  = require('./routes/auth');
const spRoutes    = require('./routes/sp');
const oaqRoutes   = require('./routes/oaq');
const userRoutes  = require('./routes/user');
const sectionRoutes = require('./routes/sections');
const adminRoutes = require('./routes/admin');
const threadRoutes = require('./routes/threads');
const ragRoutes   = require('./routes/rag');

const app    = express();
const server = http.createServer(app);

// Socket.io — real-time FCFS broadcasts
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_ORIGIN, methods: ['GET', 'POST', 'PATCH'] }
});

// Attach io to app so routes can emit
app.set('io', io);

// Middleware
app.use(cors({ origin: process.env.CLIENT_ORIGIN }));
app.use(express.json());

// Routes
app.use('/api/auth',  authRoutes);
app.use('/api/sp',    spRoutes);
app.use('/api/oaq',   oaqRoutes);
app.use('/api/users', userRoutes);
app.use('/api/sections', sectionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/threads', threadRoutes);
app.use('/api/rag', ragRoutes);

// Socket.io connection
io.on('connection', (socket) => {
  console.log(`[WS] client connected: ${socket.id}`);

  // Mentors join a dedicated room for escalation alerts
  socket.on('join:mentors', () => socket.join('mentors'));

  socket.on('disconnect', () => {
    console.log(`[WS] client disconnected: ${socket.id}`);
  });
});

// MongoDB + server start
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('[DB] MongoDB connected');
    server.listen(process.env.PORT || 5000, () => {
      console.log(`[SERVER] running on port ${process.env.PORT || 5000}`);
    });
  })
  .catch(err => {
    console.error('[DB] connection error:', err.message);
    process.exit(1);
  });

module.exports = { io };
