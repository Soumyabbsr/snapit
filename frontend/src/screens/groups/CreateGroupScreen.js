import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGroup } from '../../context/GroupContext';
import * as Clipboard from 'expo-clipboard';

const CreateGroupScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { createGroup } = useGroup();

  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [createdGroup, setCreatedGroup] = useState(null);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    const result = await createGroup(name.trim(), ''); // No image processing yet to save time
    setLoading(false);

    if (result.success) {
      setCreatedGroup(result.group);
    } else {
      Alert.alert('Error', result.error || 'Failed to create group');
    }
  };

  const copyCode = async () => {
    if (!createdGroup) return;
    await Clipboard.setStringAsync(createdGroup.inviteCode);
    Alert.alert('Copied!', 'Invite code copied to clipboard.');
  };

  if (createdGroup) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.successBox}>
          <Ionicons name="checkmark-circle" size={80} color="#FF6B35" />
          <Text style={styles.successTitle}>Group Created!</Text>
          <Text style={styles.successSub}>Share this invite code with your friends so they can join.</Text>
          
          <TouchableOpacity style={styles.codeBox} onPress={copyCode}>
            <Text style={styles.codeText}>{createdGroup.inviteCode}</Text>
            <Ionicons name="copy-outline" size={20} color="#fff" style={{ marginLeft: 10 }} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btn}
            onPress={() => {
              navigation.replace('HomeMain');
            }}
          >
            <Text style={styles.btnText}>Go to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create New Group</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.iconPlaceholder}>
          <Ionicons name="camera" size={32} color="#888" />
        </View>
        <Text style={styles.iconLabel}>Group Icon (Coming soon)</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>GROUP NAME</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="E.g., Senior Trip 2026"
            placeholderTextColor="#555"
            maxLength={30}
            autoFocus
          />
        </View>

        <TouchableOpacity
          style={[styles.btn, (!name.trim() || loading) && styles.btnDisabled]}
          onPress={handleCreate}
          disabled={!name.trim() || loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Create Group</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20 },
  backBtn: { marginRight: 16 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
  content: { padding: 24, alignItems: 'center' },
  iconPlaceholder: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: '#1a1a1a',
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#333'
  },
  iconLabel: { color: '#666', fontSize: 13, marginTop: 12, marginBottom: 30 },
  inputContainer: { width: '100%', marginBottom: 30 },
  label: { color: '#888', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 1 },
  input: {
    backgroundColor: '#161616', color: '#fff', fontSize: 16,
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1, borderColor: '#222'
  },
  btn: {
    width: '100%', backgroundColor: '#FF6B35', padding: 16, borderRadius: 16,
    alignItems: 'center', shadowColor: '#FF6B35', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  
  successBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  successTitle: { color: '#fff', fontSize: 28, fontWeight: '800', marginTop: 20, marginBottom: 10 },
  successSub: { color: '#888', fontSize: 15, textAlign: 'center', marginBottom: 40, lineHeight: 22 },
  codeBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a',
    paddingHorizontal: 30, paddingVertical: 20, borderRadius: 20, borderWidth: 1, borderColor: '#333', marginBottom: 40
  },
  codeText: { color: '#FF6B35', fontSize: 32, fontWeight: '800', letterSpacing: 6 },
});

export default CreateGroupScreen;
