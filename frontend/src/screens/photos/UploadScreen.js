import React, { useState, useEffect } from 'react';
import {
  View, Text, Image, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import UploadQueueManager from '../../services/uploadQueueManager';
import { compressImage } from '../../utils/imageCompression';

const UploadScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const passedUri = route.params?.photoUri || null;
  const groupId = route.params?.groupId || null;

  const [photoUri, setPhotoUri] = useState(passedUri);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [success, setSuccess] = useState(false);

  // If no photo was passed in, open gallery immediately
  useEffect(() => {
    if (!passedUri) pickFromGallery();
  }, []);

  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Gallery access is needed to select a photo.');
      navigation.goBack();
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.9,
      allowsEditing: false,
    });

    if (!result.canceled && result.assets?.length > 0) {
      setPhotoUri(result.assets[0].uri);
    } else if (!photoUri) {
      navigation.goBack();
    }
  };

  const handleUpload = async () => {
    if (!photoUri) {
      Alert.alert('No Photo', 'Please select a photo first.');
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      // Compress the image before queuing to save local space
      const compressedUri = await compressImage(photoUri, { maxWidth: 1080, quality: 0.8 });

      // Add to robust Offline Queue (Handles network drops automatically)
      await UploadQueueManager.addToQueue(compressedUri, groupId, caption.trim());

      setSuccess(true);
      setTimeout(() => navigation.navigate('HomeMain'), 1500);
    } catch (err) {
      setUploading(false);
      Alert.alert('Processing Failed', 'Could not queue the photo for upload.');
    }
  };

  // ── Success screen ────────────────────────────────────
  if (success) {
    return (
      <View style={styles.successScreen}>
        <View style={styles.successIconCircle}>
          <Ionicons name="checkmark" size={52} color="#fff" />
        </View>
        <Text style={styles.successTitle}>Photo Uploaded!</Text>
        <Text style={styles.successSub}>Going back to home...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#FF6B35" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>New Photo</Text>
          <View style={{ width: 70 }} />
        </View>

        {/* ── Photo preview ── */}
        {photoUri ? (
          <TouchableOpacity
            onPress={pickFromGallery}
            activeOpacity={0.92}
            style={styles.previewWrapper}
          >
            <Image source={{ uri: photoUri }} style={styles.preview} resizeMode="cover" />
            <View style={styles.changeChip}>
              <Ionicons name="camera-outline" size={13} color="#fff" />
              <Text style={styles.changeChipText}>Change</Text>
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.placeholder} onPress={pickFromGallery}>
            <Ionicons name="image-outline" size={44} color="#333" />
            <Text style={styles.placeholderText}>Tap to select a photo</Text>
          </TouchableOpacity>
        )}

        {/* ── Caption ── */}
        <View style={styles.captionSection}>
          <Text style={styles.label}>Caption</Text>
          <TextInput
            style={styles.captionInput}
            value={caption}
            onChangeText={setCaption}
            placeholder="Add a caption..."
            placeholderTextColor="#444"
            multiline
            maxLength={300}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{caption.length}/300</Text>
        </View>

        {/* ── Progress bar ── */}
        {uploading && (
          <View style={styles.progressSection}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressLabel}>
              {progress < 100 ? `Uploading… ${progress}%` : 'Processing…'}
            </Text>
          </View>
        )}

        {/* ── Upload Button ── */}
        <TouchableOpacity
          style={[styles.uploadBtn, (!photoUri || uploading) && styles.uploadBtnDisabled]}
          onPress={handleUpload}
          disabled={!photoUri || uploading}
        >
          {uploading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
              <Text style={styles.uploadBtnText}>Upload Photo</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  scroll: { padding: 20, paddingBottom: 48 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 20,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', width: 70 },
  backText: { color: '#FF6B35', fontSize: 15, fontWeight: '600', marginLeft: 2 },
  title: { fontSize: 20, fontWeight: '800', color: '#fff' },

  previewWrapper: {
    borderRadius: 18, overflow: 'hidden', marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 14, elevation: 8,
  },
  preview: { width: '100%', height: 320, backgroundColor: '#1a1a1a' },
  changeChip: {
    position: 'absolute', bottom: 12, right: 12,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5,
  },
  changeChipText: { color: '#fff', fontSize: 12, fontWeight: '600' },

  placeholder: {
    width: '100%', height: 240, borderRadius: 18,
    backgroundColor: '#111', borderWidth: 1.5,
    borderColor: '#222', borderStyle: 'dashed',
    justifyContent: 'center', alignItems: 'center',
    gap: 8, marginBottom: 20,
  },
  placeholderText: { color: '#555', fontSize: 14 },

  captionSection: { marginBottom: 20 },
  label: {
    color: '#888', fontSize: 12, fontWeight: '700',
    letterSpacing: 0.8, marginBottom: 7, textTransform: 'uppercase',
  },
  captionInput: {
    backgroundColor: '#161616', color: '#fff',
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13,
    fontSize: 15, borderWidth: 1, borderColor: '#252525',
    height: 90,
  },
  charCount: { color: '#444', fontSize: 11, textAlign: 'right', marginTop: 5 },

  progressSection: { marginBottom: 16 },
  progressTrack: { height: 5, backgroundColor: '#1a1a1a', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#FF6B35', borderRadius: 3 },
  progressLabel: { color: '#888', fontSize: 12, marginTop: 5, textAlign: 'right' },

  uploadBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#FF6B35',
    borderRadius: 16, paddingVertical: 17, marginTop: 4,
    shadowColor: '#FF6B35', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45, shadowRadius: 14, elevation: 10,
  },
  uploadBtnDisabled: { opacity: 0.45 },
  uploadBtnText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.4 },

  successScreen: {
    flex: 1, backgroundColor: '#0a0a0a',
    justifyContent: 'center', alignItems: 'center', gap: 14,
  },
  successIconCircle: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: '#FF6B35',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#FF6B35', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5, shadowRadius: 20, elevation: 14,
  },
  successTitle: { fontSize: 26, fontWeight: '800', color: '#fff' },
  successSub: { fontSize: 14, color: '#666' },
});

export default UploadScreen;
