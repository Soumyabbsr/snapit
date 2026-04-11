import * as ImageManipulator from 'expo-image-manipulator';

/**
 * Compresses an image dynamically before uploading.
 * @param {string} uri Local URI of the file
 * @param {object} options Compression options ({ maxWidth: 1080, quality: 0.8 })
 * @returns {Promise<string>} The compressed image URI
 */
export const compressImage = async (uri, { maxWidth = 1080, quality = 0.8 } = {}) => {
  try {
    const manipResult = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: maxWidth } }],
      { compress: quality, format: ImageManipulator.SaveFormat.JPEG }
    );
    return manipResult.uri;
  } catch (error) {
    console.log('Image compression failed, returning original:', error);
    return uri;
  }
};
