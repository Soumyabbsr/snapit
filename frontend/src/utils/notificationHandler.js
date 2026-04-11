import widgetService from '../services/widgetService';
import { Platform } from 'react-native';
import { registerDeviceToken } from '../api/notifications';

// Lazy-load Firebase messaging so the app builds even without google-services.json configured yet
let messagingModule = null;
const getMessaging = () => {
  if (!messagingModule) {
    try {
      messagingModule = require('@react-native-firebase/messaging').default;
    } catch (e) {
      console.warn('Firebase messaging not available:', e.message);
    }
  }
  return messagingModule;
};

// Handle background FCM messages — only if Firebase is available
// ⚠️ MUST be wrapped in try/catch — runs at module-evaluation time (before App mounts).
// If the Firebase native bridge isn't ready, this would crash the entire JS runtime
// and freeze the splash screen permanently.
try {
  const messagingInstance = getMessaging();
  if (messagingInstance) {
    messagingInstance().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('Background message received:', remoteMessage);

      if (remoteMessage.data?.type === 'new_photo' && Platform.OS === 'android') {
        const photoData = {
          photoUrl: remoteMessage.data.photoUrl,
          uploaderName: remoteMessage.data.uploaderName,
          uploaderAvatar: remoteMessage.data.uploaderAvatar || null,
          uploadedAt: parseInt(remoteMessage.data.uploadedAt),
          groupName: remoteMessage.data.groupName,
          groupId: remoteMessage.data.groupId,
          caption: remoteMessage.data.caption || null
        };

        await widgetService.onPhotoPosted(
          remoteMessage.data.groupId,
          photoData
        );
      }
    });
  }
} catch (e) {
  console.warn('Firebase background handler setup failed (native module not ready):', e.message);
}


// Handle foreground FCM messages
export const setupNotificationHandler = async () => {
  const messagingInstance = getMessaging();
  if (!messagingInstance) return;

  try {
    // Request permission (iOS + Android 13+)
    const authStatus = await messagingInstance().requestPermission();
    const enabled =
      authStatus === messagingInstance.AuthorizationStatus.AUTHORIZED ||
      authStatus === messagingInstance.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log('Authorization status:', authStatus);
      const token = await messagingInstance().getToken();
      console.log('FCM Token:', token);
      
      // Upload this token to your backend
      await registerDeviceToken(token);
    }
  } catch (error) {
    console.error('Failed to get FCM permission or token:', error);
  }

  messagingInstance().onMessage(async (remoteMessage) => {
    console.log('Foreground message received:', remoteMessage);

    if (remoteMessage.data?.type === 'new_photo' && Platform.OS === 'android') {
      const photoData = {
        photoUrl: remoteMessage.data.photoUrl,
        uploaderName: remoteMessage.data.uploaderName,
        uploaderAvatar: remoteMessage.data.uploaderAvatar || null,
        uploadedAt: parseInt(remoteMessage.data.uploadedAt),
        groupName: remoteMessage.data.groupName,
        groupId: remoteMessage.data.groupId,
        caption: remoteMessage.data.caption || null
      };

      await widgetService.onPhotoPosted(
        remoteMessage.data.groupId,
        photoData
      );
    }
  });
};

// Handle notification tap (widget click)
export const handleNotificationOpen = async () => {
  const messagingInstance = getMessaging();
  if (!messagingInstance) return null;

  const initialNotification = await messagingInstance().getInitialNotification();
  if (initialNotification) {
    return initialNotification.data;
  }
  return null;
};
