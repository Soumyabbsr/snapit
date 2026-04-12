import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Network from 'expo-network';
import { uploadPhoto } from '../api/photos';
import * as groupApi from '../api/groups';
import widgetService from './widgetService';

const QUEUE_KEY = '@snapit_upload_queue';

class UploadQueueManager {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
    this.listeners = new Set();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notifyListeners() {
    this.listeners.forEach((l) => l([...this.queue]));
  }

  async loadQueue() {
    try {
      const data = await AsyncStorage.getItem(QUEUE_KEY);
      if (data) {
        this.queue = JSON.parse(data);
        this.notifyListeners();
      }
    } catch (e) {
      console.log('Failed to load queue:', e);
    }
  }

  async saveQueue() {
    try {
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(this.queue));
      this.notifyListeners();
    } catch (e) {
      console.log('Failed to save queue:', e);
    }
  }

  async addToQueue(imageUri, groupId, caption) {
    const item = {
      id: Date.now().toString(),
      imageUri,
      groupId,
      caption,
      status: 'pending', // pending, uploading, failed, completed
      retries: 0,
      addedAt: new Date().toISOString(),
    };
    this.queue.unshift(item);
    await this.saveQueue();
    this.processQueue(); // Attempt to process immediately
    return item.id;
  }

  async removeFromQueue(id) {
    this.queue = this.queue.filter((q) => q.id !== id);
    await this.saveQueue();
  }

  updateItemStatus(id, status) {
    const item = this.queue.find((q) => q.id === id);
    if (item) {
      item.status = status;
      this.saveQueue();
    }
  }

  async retryFailed() {
    this.queue = this.queue.map(item => item.status === 'failed' ? { ...item, status: 'pending', retries: 0 } : item);
    await this.saveQueue();
    this.processQueue();
  }

  async clearQueue() {
    this.queue = [];
    await this.saveQueue();
  }

  async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;

    const netInfo = await Network.getNetworkStateAsync();
    if (!netInfo.isConnected) return; // Offline, abort

    this.isProcessing = true;

    for (let item of this.queue) {
      if (item.status === 'pending' || item.status === 'uploading') {
        this.updateItemStatus(item.id, 'uploading');
        try {
          // Send photo natively via apiClient
          const data = await uploadPhoto(item.imageUri, item.groupId, item.caption);
          this.updateItemStatus(item.id, 'completed');
          try {
            if (data?.success && data.photo && item.groupId) {
              await widgetService.onPhotoPosted(
                String(item.groupId),
                data.photo
              );
            }
            const res = await groupApi.getUserGroups();
            const list = Array.isArray(res?.groups) ? res.groups : [];
            await widgetService.syncGroupsCatalogToNative(list);
            await widgetService.refreshAllWidgets();
          } catch (syncErr) {
            console.warn('Post-upload widget sync:', syncErr?.message || syncErr);
          }
          // Remove completed item from queue safely
          setTimeout(() => this.removeFromQueue(item.id), 2000);
        } catch (error) {
          console.log(`Queue item ${item.id} failed:`, error);
          item.retries += 1;
          this.updateItemStatus(item.id, item.retries > 3 ? 'failed' : 'pending');
        }
      }
    }

    this.isProcessing = false;
  }
}

export default new UploadQueueManager();
