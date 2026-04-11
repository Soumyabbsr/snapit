import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authReducer from './authSlice';
import groupsReducer from './groupsSlice';
import photosReducer from './photosSlice';
import widgetsReducer from './widgetsSlice';

const persistConfig = {
  key: 'auth',
  storage: AsyncStorage,
  whitelist: ['accessToken', 'refreshToken'] // only persist these fields
};

const persistedAuthReducer = persistReducer(persistConfig, authReducer);

const rootReducer = combineReducers({
  auth: persistedAuthReducer,
  groups: groupsReducer,
  photos: photosReducer,
  widgets: widgetsReducer,
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // Ignore serialization warnings for persist actions
    }),
});

export const persistor = persistStore(store);
