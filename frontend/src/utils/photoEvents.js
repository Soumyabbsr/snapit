import { DeviceEventEmitter } from 'react-native';

export const PHOTO_DELETED_EVENT = 'snapit:photoDeleted';

/**
 * Notify listeners (e.g. Group feed) that a photo was deleted — avoids passing functions in navigation params.
 * @param {string} photoId
 * @param {string} [groupId]
 */
export function emitPhotoDeleted(photoId, groupId) {
  DeviceEventEmitter.emit(PHOTO_DELETED_EVENT, { photoId, groupId });
}
