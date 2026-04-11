const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Group = require('./models/Group');

module.exports = (server, app) => {
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  app.set('io', io);

  io.use(async (socket, next) => {
    try {
      let token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      // Handle "Bearer <token>" format
      if (token.startsWith('Bearer ')) {
        token = token.split(' ')[1];
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      
      if (!user || !user.isActive) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.user = user;
      next();
    } catch (err) {
      console.error('Socket Auth Error:', err.message);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    console.log('Socket connected:', socket.user._id);
    
    // Store socket ID map in app for easy excluding
    app.set(`socketMap:${socket.user._id}`, socket.id);

    // Join personal room
    socket.join(`user:${socket.user._id}`);

    // Fetch user's groupIds from DB
    const user = await User.findById(socket.user._id);
    user.groupIds.forEach(groupId => {
      socket.join(`group:${groupId.toString()}`);
    });

    // Emit connection ready
    socket.emit('connection:ready', { 
      userId: socket.user._id, 
      groupIds: user.groupIds 
    });

    socket.on('group:join', async (data) => {
      const { groupId } = data;
      if (!groupId) return;

      const group = await Group.findById(groupId);
      if (group && group.members.some(m => m.userId.toString() === socket.user._id.toString())) {
        socket.join(`group:${groupId}`);
      }
    });

    socket.on('group:leave', (data) => {
      const { groupId } = data;
      if (groupId) {
        socket.leave(`group:${groupId}`);
      }
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected:', socket.user._id);
      app.set(`socketMap:${socket.user._id}`, null);
    });
  });

  return io;
};
