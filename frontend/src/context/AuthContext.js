import React, { createContext, useContext, useEffect, useReducer, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { register as apiRegister, login as apiLogin, getCurrentUser } from '../api/auth';

// ─── Secure token key ──────────────────────────────────────
const TOKEN_KEY = 'snapit_auth_token';

// ─── Context ───────────────────────────────────────────────
const AuthContext = createContext(null);

// ─── Reducer ───────────────────────────────────────────────
const initialState = {
  user: null,
  token: null,
  loading: true,
  error: null,
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOADING':
      return { ...state, loading: true, error: null };
    case 'SET_USER':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        loading: false,
        error: null,
      };
    case 'LOGOUT':
      return { ...initialState, loading: false };
    case 'ERROR':
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
};

// ─── Helpers ───────────────────────────────────────────────
const saveToken = (token) => SecureStore.setItemAsync(TOKEN_KEY, token);
const getToken = () => SecureStore.getItemAsync(TOKEN_KEY);
const deleteToken = () => SecureStore.deleteItemAsync(TOKEN_KEY);

// ─── Provider ──────────────────────────────────────────────
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Auto-login on app start
  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = useCallback(async () => {
    try {
      dispatch({ type: 'LOADING' });
      const token = await getToken();
      if (!token) {
        dispatch({ type: 'LOGOUT' });
        return;
      }
      const { user } = await getCurrentUser();
      dispatch({ type: 'SET_USER', payload: { user, token } });
    } catch {
      await deleteToken();
      dispatch({ type: 'LOGOUT' });
    }
  }, []);

  const register = useCallback(async (name, email, password) => {
    try {
      const response = await apiRegister(name, email, password);
      // Validate backend response
      if (!response || !response.token) {
         throw new Error('Registration succeeded but backend failed to provide an auth token.');
      }
      const { token, user } = response;
      await saveToken(token);
      dispatch({ type: 'SET_USER', payload: { user, token } });
      return { success: true };
    } catch (err) {
      // Don't use global ERROR dispatch here, let local screens handle it beautifully
      return { success: false, error: err.message };
    }
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      const response = await apiLogin(email, password);
      if (!response || !response.token) {
         throw new Error('Login succeeded but backend failed to provide an auth token.');
      }
      const { token, user } = response;
      await saveToken(token);
      dispatch({ type: 'SET_USER', payload: { user, token } });
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, []);

  const logout = useCallback(async () => {
    await deleteToken();
    dispatch({ type: 'LOGOUT' });
  }, []);

  const updateLocalUser = useCallback(
    (updatedUser) => {
      dispatch({ type: 'SET_USER', payload: { user: updatedUser, token: state.token } });
    },
    [state.token]
  );

  return (
    <AuthContext.Provider
      value={{
        user: state.user,
        token: state.token,
        loading: state.loading,
        error: state.error,
        login,
        register,
        logout,
        loadUser,
        updateLocalUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside <AuthProvider>');
  return ctx;
};
