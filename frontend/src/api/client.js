import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { BASE_URL } from '../config/constants';

const TOKEN_KEY = 'snapit_auth_token';

// ─── Axios instance ────────────────────────────────────────
const apiClient = axios.create({
  baseURL: `${BASE_URL}/api`,
  timeout: 30000,
  headers: { 
    'Content-Type': 'application/json',
    'Bypass-Tunnel-Reminder': 'true' // Bypasses LocalTunnel's warning page
  },
});

// ─── Request: inject token ─────────────────────────────────
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (token) config.headers.Authorization = `Bearer ${token}`;
    } catch {}
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response: normalise errors ────────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      const message =
        data?.message || data?.errors?.[0]?.message || 'An error occurred.';
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
