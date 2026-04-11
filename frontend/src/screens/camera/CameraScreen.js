import React, { useRef, useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Dimensions,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const CameraScreen = ({ navigation, route }) => {
  const { groupId = null } = route.params || {};
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();

  const [facing, setFacing] = useState('back'); // 'back' | 'front'
  const [flash, setFlash] = useState('off');    // 'off' | 'on' | 'auto'
  const [capturing, setCapturing] = useState(false);

  const cameraRef = useRef(null);

  // ── Permission not yet determined ────────────────────
  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#FF6B35" size="large" />
      </View>
    );
  }

  // ── Permission denied / not granted ──────────────────
  if (!permission.granted) {
    return (
      <View style={styles.permissionScreen}>
        <Ionicons name="camera-outline" size={64} color="#FF6B35" />
        <Text style={styles.permTitle}>Camera Permission</Text>
        <Text style={styles.permSubtitle}>
          SnapIt needs camera access to capture photos.
        </Text>
        <TouchableOpacity style={styles.permButton} onPress={requestPermission}>
          <Text style={styles.permButtonText}>Allow Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.cancelLink}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Capture photo ─────────────────────────────────────
  const takePhoto = async () => {
    if (!cameraRef.current || capturing) return;
    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
        exif: false,
        skipProcessing: false,
      });
      navigation.navigate('PhotoPreview', { photoPath: photo.uri, groupId });
    } catch (err) {
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
    } finally {
      setCapturing(false);
    }
  };

  // ── Flash cycle ───────────────────────────────────────
  const cycleFlash = () =>
    setFlash((prev) => ({ off: 'on', on: 'auto', auto: 'off' }[prev]));

  const flashIcon = { off: 'flash-off', on: 'flash', auto: 'flash-outline' }[flash];

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing={facing}
        flash={flash}
      />

      {/* ── Top controls ── */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.circleBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={22} color="#fff" />
        </TouchableOpacity>

        <View style={styles.topRight}>
          <TouchableOpacity style={styles.circleBtn} onPress={cycleFlash}>
            <Ionicons name={flashIcon} size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Bottom controls ── */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 20 }]}>

        {/* Gallery shortcut */}
        <TouchableOpacity
          style={styles.sideBtn}
          onPress={() => navigation.navigate('Upload', { groupId })}
        >
          <Ionicons name="images-outline" size={28} color="#fff" />
          <Text style={styles.sideBtnLabel}>Gallery</Text>
        </TouchableOpacity>

        {/* Shutter */}
        <TouchableOpacity
          style={[styles.shutter, capturing && styles.shutterActive]}
          onPress={takePhoto}
          disabled={capturing}
          activeOpacity={0.85}
        >
          {capturing
            ? <ActivityIndicator color="#FF6B35" size="small" />
            : <View style={styles.shutterInner} />}
        </TouchableOpacity>

        {/* Flip */}
        <TouchableOpacity
          style={styles.sideBtn}
          onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))}
        >
          <Ionicons name="camera-reverse-outline" size={28} color="#fff" />
          <Text style={styles.sideBtnLabel}>Flip</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0a' },

  // Permission screen
  permissionScreen: {
    flex: 1, backgroundColor: '#0a0a0a',
    justifyContent: 'center', alignItems: 'center', padding: 32,
  },
  permTitle: { fontSize: 24, fontWeight: '800', color: '#fff', marginTop: 20 },
  permSubtitle: { fontSize: 14, color: '#888', textAlign: 'center', marginTop: 8, lineHeight: 22 },
  permButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 14, paddingVertical: 16, paddingHorizontal: 40,
    marginTop: 28,
    shadowColor: '#FF6B35', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
  },
  permButtonText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  cancelLink: { marginTop: 16 },
  cancelText: { color: '#666', fontSize: 14 },

  // Camera UI
  topBar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 16,
  },
  topRight: { flexDirection: 'row', gap: 10 },
  circleBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center', alignItems: 'center',
  },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    paddingHorizontal: 24,
  },
  sideBtn: { alignItems: 'center', width: 60 },
  sideBtnLabel: { color: '#ccc', fontSize: 11, marginTop: 4 },
  shutter: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#fff',
    borderWidth: 5, borderColor: '#FF6B35',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#FF6B35', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5, shadowRadius: 12, elevation: 10,
  },
  shutterActive: { backgroundColor: '#f0f0f0' },
  shutterInner: {
    width: 58, height: 58, borderRadius: 29, backgroundColor: '#fff',
  },
});

export default CameraScreen;
