import apiClient from './client';
import { Platform } from 'react-native';

export const registerDeviceToken = async (token) => {
  try {
    const res = await apiClient.post('/notifications/token', {
      token,
      platform: Platform.OS
    });
    return res.data;
  } catch (error) {
    console.error('API Error registering device token:', error.message);
    throw error;
  }
};
