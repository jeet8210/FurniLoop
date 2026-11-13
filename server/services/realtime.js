import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Conversation from '../models/Conversation.js';

let ioInstance;
export function setRealtime(io) { ioInstance = io; }
export function emitToUser(userId, event, payload) { ioInstance?.to(`user:${userId}`).emit(event, payload); }
export function emitToConversation(conversationId, event, payload) { ioInstance?.to(`conversation:${conversationId}`).emit(event, payload); }

export function authenticateRealtime(io) {
  io.use(async (socket, next) => {
    try {
      const cookie = socket.handshake.headers.cookie || '';
      const token = cookie.split(';').map((item) => item.trim()).find((item) => item.startsWith('furniloop_token='))?.slice('furniloop_token='.length);
      if (!token) return next(new Error('Sign in to use live updates.'));
      const payload = jwt.verify(decodeURIComponent(token), process.env.JWT_SECRET);
      const user = await User.findById(payload.sub).select('_id status');
      if (!user || user.status !== 'ACTIVE') return next(new Error('This account cannot use live updates.'));
      socket.data.userId = user._id.toString();
      next();
    } catch { next(new Error('Sign in to use live updates.')); }
  });
  io.on('connection', (socket) => {
    socket.join(`user:${socket.data.userId}`);
    socket.on('conversation:join', async (conversationId) => {
      try {
        const conversation = await Conversation.exists({ _id: conversationId, participants: socket.data.userId });
        if (conversation) socket.join(`conversation:${conversationId}`);
      } catch { /* ignore invalid conversation room requests */ }
    });
    socket.on('conversation:leave', (conversationId) => socket.leave(`conversation:${conversationId}`));
  });
}
