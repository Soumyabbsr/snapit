import { io } from 'socket.io-client';
import * as SecureStore from 'expo-secure-store';
import { BASE_URL } from '../config/constants';

const TOKEN_KEY = 'snapit_auth_token';

/**
 * SnapIt Socket Service
 * Manages a single persistent socket connection with room-based group subscriptions.
 */
class SocketService {
  constructor() {
    this.socket = null;
    this.activeGroupRooms = new Set();
    this.listeners = new Map();
  }

  async connect(token) {
    if (this.socket?.connected) return;
    let authToken = token;
    if (!authToken) {
      try {
        authToken = await SecureStore.getItemAsync(TOKEN_KEY);
      } catch {
        authToken = null;
      }
    }
    if (!authToken) {
      console.warn('⚠️ Socket connection attempted without token');
      return;
    }

    this.socket = io(BASE_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      timeout: 10000,
      auth: {
        token: `Bearer ${authToken}`,
      },
    });

    this.socket.on('connect', () => {
      console.log('🔌 Socket connected:', this.socket.id);
      this.socket.emit('rejoin:rooms');
      this.activeGroupRooms.forEach((groupId) => {
        this.socket.emit('join_group', groupId);
      });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
    });

    this.socket.on('connect_error', (err) => {
      console.warn('⚠️ Socket connect error:', err.message);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.activeGroupRooms.clear();
      console.log('🔌 Socket service disconnected');
    }
  }

  joinGroup(groupId) {
    if (!groupId) return;
    this.activeGroupRooms.add(groupId);
    if (this.socket?.connected) {
      this.socket.emit('join_group', groupId);
      console.log(`📦 Joined group room: group:${groupId}`);
    }
  }

  leaveGroup(groupId) {
    if (!groupId) return;
    this.activeGroupRooms.delete(groupId);
    if (this.socket?.connected) {
      this.socket.emit('leave_group', groupId);
      console.log(`🚪 Left group room: group:${groupId}`);
    }
  }

  on(event, callback) {
    if (!this.socket) return () => {};
    this.socket.on(event, callback);
    return () => this.socket?.off(event, callback);
  }

  off(event, callback) {
    this.socket?.off(event, callback);
  }

  isConnected() {
    return this.socket?.connected ?? false;
  }
}

export default new SocketService();
