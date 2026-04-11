import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Linking } from 'react-native';

/**
 * Request camera permission using expo-camera.
 * @returns {Promise<boolean>} true if granted
 */
export const requestCameraPermission = async () => {
  const { status } = await Camera.requestCameraPermissionsAsync();
  return status === 'granted';
};

/**
 * Check camera permission status.
 * @returns {Promise<string>} 'granted' | 'denied' | 'undetermined'
 */
export const checkCameraPermission = async () => {
  const { status } = await Camera.getCameraPermissionsAsync();
  return status;
};

/**
 * Request gallery/media library permission using expo-image-picker.
 * @returns {Promise<boolean>} true if granted
 */
export const requestGalleryPermission = async () => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return status === 'granted';
};

/**
 * Show an alert directing the user to app settings when permanently denied.
 * @param {string} permissionName - Human-readable name e.g. "Camera"
 */
export const showPermissionDeniedAlert = (permissionName = 'Permission') => {
  Alert.alert(
    `${permissionName} Required`,
    `Please enable ${permissionName} access in your device Settings to continue.`,
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Open Settings', onPress: () => Linking.openSettings() },
    ]
  );
};
