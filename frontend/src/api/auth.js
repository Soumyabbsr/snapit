import apiClient from './client';

/**
 * Register a new user.
 * @param {string} name
 * @param {string} email
 * @param {string} password
 * @returns {{ token: string, user: object }}
 */
export const register = async (name, email, password) => {
  const { data } = await apiClient.post('/auth/register', { name, email, password });
  return data; // { success, token, user }
};

/**
 * Login with email and password.
 * @param {string} email
 * @param {string} password
 * @returns {{ token: string, user: object }}
 */
export const login = async (email, password) => {
  const { data } = await apiClient.post('/auth/login', { email, password });
  return data;
};

/**
 * Get the currently authenticated user.
 * Requires token to be set in apiClient headers.
 * @returns {{ user: object }}
 */
export const getCurrentUser = async () => {
  const { data } = await apiClient.get('/auth/me');
  return data;
};
