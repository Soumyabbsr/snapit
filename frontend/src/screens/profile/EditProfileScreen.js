import React, { useState } from 'react';
import {
  View, Text, TextInput, Image, TouchableOpacity,
  StyleSheet, ActivityIndicator, ScrollView, Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { updateProfile } from '../../api/user';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const EditProfileScreen = ({ navigation }) => {
  const { user, updateLocalUser } = useAuth();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [newImageUri, setNewImageUri] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const currentAvatar = newImageUri || user?.profilePicture?.url || null;

  // ── Pick from gallery ─────────────────────────────────
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please allow gallery access in Settings to change your photo.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (!result.canceled && result.assets?.length > 0) {
      setNewImageUri(result.assets[0].uri);
    }
  };

  // ── Save changes ──────────────────────────────────────
  const handleSave = async () => {
    if (!name.trim() || name.trim().length < 2) {
      setError('Name must be at least 2 characters.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const response = await updateProfile(name.trim(), newImageUri, bio.trim());
      updateLocalUser(response.user);
      Alert.alert('Success ✓', 'Profile updated!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      setError(err.message || 'Failed to update. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
          <Text style={styles.title}>Edit Profile</Text>
          <View style={{ width: 70 }} />
        </View>

        {/* ── Avatar ── */}
        <TouchableOpacity style={styles.avatarWrapper} onPress={pickImage}>
          {currentAvatar ? (
            <Image source={{ uri: currentAvatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitial}>
                {user?.name?.charAt(0)?.toUpperCase() || '?'}
              </Text>
            </View>
          )}
          <View style={styles.editBadge}>
            <Ionicons name="camera" size={14} color="#fff" />
          </View>
          <Text style={styles.changePhotoHint}>Tap to change photo</Text>
        </TouchableOpacity>

        {/* ── Errors ── */}
        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={16} color="#FF6B6B" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* ── Fields ── */}
        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={(t) => { setName(t); setError(''); }}
              placeholder="Your name"
              placeholderTextColor="#444"
              autoCapitalize="words"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, styles.bioInput]}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell people about yourself..."
              placeholderTextColor="#444"
              multiline
              maxLength={160}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{bio.length}/160</Text>
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, loading && styles.disabled]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.saveBtnText}>Save Changes</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  scroll: { padding: 20, paddingBottom: 48 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', width: 70 },
  backText: { color: '#FF6B35', fontSize: 15, fontWeight: '600', marginLeft: 2 },
  title: { fontSize: 20, fontWeight: '800', color: '#fff' },

  avatarWrapper: { alignItems: 'center', marginBottom: 32 },
  avatar: {
    width: 110, height: 110, borderRadius: 55,
    borderWidth: 3, borderColor: '#FF6B35',
  },
  avatarFallback: {
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: '#1a1a1a',
    borderWidth: 3, borderColor: '#FF6B35',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarInitial: { fontSize: 44, fontWeight: '800', color: '#FF6B35' },
  editBadge: {
    position: 'absolute',
    bottom: 30, right: '35%',
    backgroundColor: '#FF6B35',
    borderRadius: 14, width: 28, height: 28,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#0a0a0a',
  },
  changePhotoHint: { color: '#666', fontSize: 12, marginTop: 8 },

  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,59,48,0.12)',
    borderRadius: 10, padding: 12, marginBottom: 16,
    borderLeftWidth: 3, borderLeftColor: '#FF3B30',
  },
  errorText: { color: '#FF6B6B', fontSize: 13, flex: 1 },

  form: {},
  field: { marginBottom: 18 },
  label: { color: '#888', fontSize: 12, fontWeight: '700', letterSpacing: 0.8, marginBottom: 7, textTransform: 'uppercase' },
  input: {
    backgroundColor: '#161616',
    color: '#fff',
    borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 15,
    fontSize: 15,
    borderWidth: 1, borderColor: '#252525',
  },
  bioInput: { height: 100, textAlignVertical: 'top' },
  charCount: { color: '#444', fontSize: 11, textAlign: 'right', marginTop: 5 },

  saveBtn: {
    backgroundColor: '#FF6B35',
    borderRadius: 16, paddingVertical: 17,
    alignItems: 'center', marginTop: 12,
    shadowColor: '#FF6B35', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45, shadowRadius: 14, elevation: 10,
  },
  disabled: { opacity: 0.55 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.4 },
});

export default EditProfileScreen;
