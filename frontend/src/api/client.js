import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../config/constants';
import { store } from '../store/store';

const TOKEN_KEY = 'snapit_auth_token';

// ─── Axios instance ────────────────────────────────────────
const apiClient = axios.create({
  baseURL: `${BASE_URL}/api`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    BypassTunnelReminder: 'true',
  },
});

// ─── Request: inject token (Redux → SecureStore → AsyncStorage) ──
apiClient.interceptors.request.use(
  async (config) => {
    try {
      let token = store.getState()?.auth?.accessToken;
      if (!token) {
        token = await SecureStore.getItemAsync(TOKEN_KEY);
      }
      if (!token) {
        token = await AsyncStorage.getItem(TOKEN_KEY);
      }
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {}
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response: normalise errors ───────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response) {
      const { status, data } = error.response;
      const message =
        data?.error?.message ||
        data?.message ||
        data?.errors?.[0]?.message ||
        'An error occurred.';

      const err = new Error(message);
      err.status = status;
      err.errors = data?.errors || null;
      return Promise.reject(err);
    }
    if (error.request) {
      const netErr = new Error('No internet connection. Please try again.');
      netErr.status = 0;
      return Promise.reject(netErr);
    }
    return Promise.reject(error);
  }
);

export default apiClient;
