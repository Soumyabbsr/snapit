import React from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet, Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

/**
 * Reusable ImagePicker component built on expo-image-picker.
 *
 * Props:
 *  imageUri        {string|null}   - currently selected image URI
 *  onImageSelected {func}          - callback(uri: string)
 *  placeholder     {string}        - text shown when empty
 *  style           {object}        - optional container style override
 *  imageStyle      {object}        - optional image style override
 *  aspectRatio     {[w,h]}         - crop aspect ratio, default [4,3]
 *  disabled        {bool}
 */
const ImagePickerComponent = ({
  imageUri,
  onImageSelected,
  placeholder = 'Select Photo',
  style,
  imageStyle,
  aspectRatio = [4, 3],
  disabled = false,
}) => {
  const handlePick = async () => {
    if (disabled) return;

    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please allow gallery access in your device Settings.',
        [{ text: 'OK' }]
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: aspectRatio,
      quality: 0.9,
    });

    if (!result.canceled && result.assets?.length > 0) {
      onImageSelected(result.assets[0].uri);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.container, style, disabled && styles.disabled]}
      onPress={handlePick}
      activeOpacity={0.8}
      disabled={disabled}
    >
      {imageUri ? (
        <>
          <Image
            source={{ uri: imageUri }}
            style={[styles.image, imageStyle]}
            resizeMode="cover"
          />
          <View style={styles.changeChip}>
            <Ionicons name="camera-outline" size={13} color="#fff" />
            <Text style={styles.changeChipText}>Change</Text>
          </View>
        </>
      ) : (
        <View style={styles.placeholderContent}>
          <Ionicons name="image-outline" size={40} color="#444" />
          <Text style={styles.placeholderText}>{placeholder}</Text>
          <Text style={styles.placeholderHint}>Tap to select from gallery</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%', height: 200,
    borderRadius: 16,
    backgroundColor: '#161616',
    borderWidth: 1.5, borderColor: '#252525',
    borderStyle: 'dashed',
    overflow: 'hidden',
    justifyContent: 'center', alignItems: 'center',
  },
  disabled: { opacity: 0.5 },
  image: { width: '100%', height: '100%' },
  changeChip: {
    position: 'absolute', bottom: 10, right: 10,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5,
  },
  changeChipText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  placeholderContent: { alignItems: 'center', gap: 6 },
  placeholderText: { color: '#888', fontSize: 15, fontWeight: '600' },
  placeholderHint: { color: '#444', fontSize: 12 },
});

export default ImagePickerComponent;
