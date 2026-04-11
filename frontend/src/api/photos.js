import apiClient from './client';

/**
 * Upload a photo to the server.
 * @param {string} imageUri   - Local file URI
 * @param {string|null} groupId  - Optional group ID
 * @param {string} caption    - Optional caption text
 * @param {function} onProgress  - Progress callback (0-100)
 * @returns {{ photo: object }}
 */
export const uploadPhoto = async (imageUri, groupId = null, caption = '', onProgress) => {
  const filename = imageUri.split('/').pop();
  const ext = filename.split('.').pop().toLowerCase();
  const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';

  const formData = new FormData();
  formData.append('photo', {
    uri: imageUri,
    type: mimeType,
    name: filename,
  });
  if (caption) formData.append('caption', caption);
  if (groupId) formData.append('groupId', groupId);

  const { data } = await apiClient.post('/photos/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total && onProgress) {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percent);
      }
    },
  });

  return data; // { success, photo }
};

export const getGroupPhotos = async (groupId, page = 1, limit = 20) => {
  const { data } = await apiClient.get(`/photos/group/${groupId}`, { params: { page, limit } });
  return data; // { success, photos, hasMore }
};

export const deletePhoto = async (photoId) => {
  const { data } = await apiClient.delete(`/photos/${photoId}`);
  return data;
};
