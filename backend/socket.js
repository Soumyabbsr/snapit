const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const GroupMember = require('./models/GroupMember');

module.exports = (server, app) => {
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    },
  });

  app.set('io', io);

  const joinUserRooms = async (socket) => {
    const memberships = await GroupMember.find({ userId: socket.user._id })
      .select('groupId')
      .lean();

    memberships.forEach(({ groupId }) => {
      socket.join(`group:${groupId.toString()}`);
    });

    return memberships.map(({ groupId }) => groupId.toString());
  };

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

    const groupIds = await joinUserRooms(socket);

    // Emit connection ready
    socket.emit('connection:ready', { 
      userId: socket.user._id, 
      groupIds
    });

    const handleJoinGroup = async (data) => {
      const groupId = typeof data === 'string' ? data : data?.groupId;
      if (!groupId) return;

      const membership = await GroupMember.findOne({ groupId, userId: socket.user._id });
      if (membership) {
        socket.join(`group:${groupId}`);
      }
    };

    socket.on('group:join', handleJoinGroup);
    socket.on('join_group', handleJoinGroup);

    const handleLeaveGroup = (data) => {
      const groupId = typeof data === 'string' ? data : data?.groupId;
      if (groupId) {
        socket.leave(`group:${groupId}`);
      }
    };

    socket.on('group:leave', handleLeaveGroup);
    socket.on('leave_group', handleLeaveGroup);

    socket.on('rejoin:rooms', async () => {
      await joinUserRooms(socket);
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected:', socket.user._id);
      app.set(`socketMap:${socket.user._id}`, null);
    });
  });

  return io;
};
