import React from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

const PhotoPreviewScreen = ({ navigation, route }) => {
  const { photoPath, groupId = null } = route.params;
  const insets = useSafeAreaInsets();

  const handleUsePhoto = () => {
    navigation.navigate('Upload', { photoUri: photoPath, groupId });
  };

  const handleRetake = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      {/* ── Full-screen image ── */}
      <Image source={{ uri: photoPath }} style={styles.image} resizeMode="cover" />

      {/* ── Dark overlay at bottom ── */}
      <View style={[styles.overlay, { paddingBottom: insets.bottom + 16 }]}>
        <Text style={styles.previewLabel}>Preview</Text>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.retakeBtn} onPress={handleRetake}>
            <Text style={styles.retakeBtnText}>Retake</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.useBtn} onPress={handleUsePhoto}>
            <Text style={styles.useBtnText}>Use Photo →</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  image: { width, height },
  overlay: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    paddingTop: 24,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  previewLabel: {
    color: '#aaa',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  retakeBtn: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  retakeBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  useBtn: {
    flex: 2,
    backgroundColor: '#FF6B35',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  useBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});

export default PhotoPreviewScreen;
