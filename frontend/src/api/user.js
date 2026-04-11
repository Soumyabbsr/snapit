import apiClient from './client';

/**
 * Get the current user's profile.
 */
export const getProfile = async () => {
  const { data } = await apiClient.get('/users/me');
  return data; // { success, user }
};

/**
 * Update the current user's profile.
 * @param {string|null} name   - New display name (optional)
 * @param {string|null} imageUri - Local URI of new avatar image (optional)
 * @param {string|null} bio    - New bio (optional)
 */
export const updateProfile = async (name, imageUri, bio) => {
  const formData = new FormData();
  if (name !== null && name !== undefined) formData.append('name', name);
  if (bio !== null && bio !== undefined) formData.append('bio', bio);

  if (imageUri) {
    // Extract filename and determine type
    const filename = imageUri.split('/').pop();
    const ext = filename.split('.').pop().toLowerCase();
    const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';

    formData.append('image', {
      uri: imageUri,
      type: mimeType,
      name: filename,
    });
  }

  const { data } = await apiClient.put('/users/me', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return data; // { success, user }
};
