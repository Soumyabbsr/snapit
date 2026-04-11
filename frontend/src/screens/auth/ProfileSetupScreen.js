import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useAuth } from '../../context/AuthContext';
import { updateProfile } from '../../api/user';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * ProfileSetupScreen — shown after successful registration.
 * Lets users set their display name and upload a profile photo.
 * Skippable — users can do this later in EditProfile.
 */
const ProfileSetupScreen = ({ navigation }) => {
  const { user, updateLocalUser } = useAuth();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState(user?.name || '');
  const [avatarUri, setAvatarUri] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const progressAnim = useRef(new Animated.Value(0)).current;

  const pickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (!result.canceled && result.assets?.length > 0) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const handleContinue = async () => {
    if (!name.trim() || name.trim().length < 2) {
      setError('Please enter your name (at least 2 characters).');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const response = await updateProfile(name.trim(), avatarUri, '');
      updateLocalUser(response.user);
      // Navigate into the main app — AppNavigator will see user is set and route correctly
      // (navigation.replace not needed since AppNavigator handles user state transition)
    } catch (err) {
      setError(err.message || 'Failed to save profile. You can update it later.');
      setLoading(false);
    }
  };

  const handleSkip = () => {
    // Skip — user stays logged in, AppNavigator routes to Main automatically
    // We still update the name if it was changed
    if (name.trim().length >= 2 && name.trim() !== user?.name) {
      updateProfile(name.trim(), null, '').catch(() => {});
    }
  };

  const initials = name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || '?';

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 20 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Progress bar ─────────────────────── */}
        <View style={styles.progressBar}>
          <View style={styles.progressFill} />
        </View>
        <Text style={styles.progressLabel}>Step 2 of 2 — Set up your profile</Text>

        {/* ── Header ───────────────────────────── */}
        <View style={styles.header}>
          <Text style={styles.emoji}>✨</Text>
          <Text style={styles.title}>Almost there!</Text>
          <Text style={styles.subtitle}>
            Add your name and a photo so your friends can recognize you.
          </Text>
        </View>

        {/* ── Avatar Picker ─────────────────────── */}
        <TouchableOpacity style={styles.avatarWrapper} onPress={pickAvatar} activeOpacity={0.8}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitial}>{initials}</Text>
            </View>
          )}
          <View style={styles.editBadge}>
            <Ionicons name="camera" size={16} color="#fff" />
          </View>
        </TouchableOpacity>
        <Text style={styles.avatarHint}>Tap to add a profile photo</Text>

        {/* ── Error ─────────────────────────────── */}
        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={15} color="#FF6B6B" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* ── Name Input ────────────────────────── */}
        <View style={styles.field}>
          <Text style={styles.label}>Display Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={(t) => { setName(t); setError(''); }}
            placeholder="Your name"
            placeholderTextColor="#444"
            autoCapitalize="words"
            returnKeyType="done"
            onSubmitEditing={handleContinue}
          />
        </View>

        {/* ── Actions ──────────────────────────── */}
        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleContinue}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.btnText}>Continue to SnapIt</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 8 }} />
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.skipLink} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  scroll: { flexGrow: 1, padding: 24, paddingBottom: 48 },

  progressBar: {
    height: 3,
    backgroundColor: '#1a1a1a',
    borderRadius: 2,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FF6B35',
    borderRadius: 2,
  },
  progressLabel: {
    color: '#555',
    fontSize: 12,
    marginBottom: 32,
    textAlign: 'right',
  },

  header: { alignItems: 'center', marginBottom: 36 },
  emoji: { fontSize: 44, marginBottom: 12 },
  title: { fontSize: 28, fontWeight: '800', color: '#fff', marginBottom: 8 },
  subtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 16,
  },

  avatarWrapper: { alignSelf: 'center', marginBottom: 8 },
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
    position: 'absolute', bottom: 2, right: 2,
    backgroundColor: '#FF6B35',
    borderRadius: 16, width: 32, height: 32,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#0a0a0a',
  },
  avatarHint: { color: '#555', fontSize: 12, textAlign: 'center', marginBottom: 32 },

  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,59,48,0.12)',
    borderRadius: 10, padding: 12, marginBottom: 16,
    borderLeftWidth: 3, borderLeftColor: '#FF3B30',
  },
  errorText: { color: '#FF6B6B', fontSize: 13, flex: 1 },

  field: { marginBottom: 24 },
  label: {
    color: '#888', fontSize: 12, fontWeight: '700',
    letterSpacing: 0.8, marginBottom: 8, textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#161616',
    color: '#fff',
    borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 15,
    fontSize: 16,
    borderWidth: 1, borderColor: '#252525',
  },

  btn: {
    flexDirection: 'row',
    backgroundColor: '#FF6B35',
    borderRadius: 16, paddingVertical: 17,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#FF6B35', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45, shadowRadius: 14, elevation: 10,
  },
  btnDisabled: { opacity: 0.55 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.4 },

  skipLink: { alignItems: 'center', marginTop: 20, padding: 8 },
  skipText: { color: '#555', fontSize: 14 },
});

export default ProfileSetupScreen;
