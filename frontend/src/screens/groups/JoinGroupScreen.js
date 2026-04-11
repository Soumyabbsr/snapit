import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGroup } from '../../context/GroupContext';

const JoinGroupScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { joinGroup } = useGroup();

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    if (code.length < 6) return;
    setLoading(true);
    const result = await joinGroup(code.trim());
    setLoading(false);

    if (result.success) {
      navigation.replace('HomeMain'); // Go back to dashboard to see new group
    } else {
      Alert.alert('Join Failed', result.error || 'Invalid invite code.');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Join Group</Text>
      </View>

      <View style={styles.content}>
        <Ionicons name="key-outline" size={60} color="#FF6B35" style={{ marginBottom: 20 }} />
        <Text style={styles.title}>Have an invite code?</Text>
        <Text style={styles.subtitle}>Enter the 6-digit code to join your friends.</Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={code}
            onChangeText={(text) => setCode(text.toUpperCase())}
            placeholder="A B C D E F"
            placeholderTextColor="#444"
            maxLength={6}
            autoCapitalize="characters"
            autoCorrect={false}
            autoFocus
          />
        </View>

        <TouchableOpacity
          style={[styles.btn, (code.length < 6 || loading) && styles.btnDisabled]}
          onPress={handleJoin}
          disabled={code.length < 6 || loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Join Group</Text>}
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
  
  content: { padding: 30, alignItems: 'center', marginTop: 20 },
  title: { color: '#fff', fontSize: 24, fontWeight: '800', marginBottom: 10 },
  subtitle: { color: '#888', fontSize: 14, textAlign: 'center', marginBottom: 40 },
  
  inputContainer: { width: '100%', marginBottom: 30 },
  input: {
    backgroundColor: '#161616', color: '#FF6B35', fontSize: 32, fontWeight: '800',
    borderRadius: 20, paddingVertical: 20, textAlign: 'center', letterSpacing: 8,
    borderWidth: 2, borderColor: '#222'
  },
  
  btn: {
    width: '100%', backgroundColor: '#FF6B35', padding: 18, borderRadius: 16,
    alignItems: 'center', shadowColor: '#FF6B35', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }
  },
  btnDisabled: { opacity: 0.4 },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});

export default JoinGroupScreen;
