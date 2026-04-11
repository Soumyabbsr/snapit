import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, ScrollView, Switch
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGroup } from '../../context/GroupContext';
import { sendInvite } from '../../api/invites';
import apiClient from '../../api/client';

/**
 * SendInviteScreen — allows group admin to invite a user by email.
 * Also accessible as "Invite Members" from group details (future).
 */
const SendInviteScreen = ({ navigation, route }) => {
  const { groupId } = route.params || {};
  const insets = useSafeAreaInsets();
  const { groups } = useGroup();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const group = groups.find((g) => g._id === groupId);

  const validate = () => {
    if (!email.trim()) return 'Email is required.';
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return 'Please enter a valid email address.';
    return null;
  };

  const handleSend = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    if (!groupId) {
      setError('No group selected.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await sendInvite(groupId, email.trim().toLowerCase());
      setSuccess(true);
      setEmail('');
    } catch (err) {
      setError(err.message || 'Failed to send invite. Please try again.');
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
          <Text style={styles.title}>Invite Members</Text>
          <View style={{ width: 70 }} />
        </View>

        {/* ── Group Display ── */}
        {group && (
          <View style={styles.groupBadge}>
            <View style={styles.groupIcon}>
              <Text style={styles.groupIconText}>{group.name.charAt(0)}</Text>
            </View>
            <View>
              <Text style={styles.groupName}>{group.name}</Text>
              <Text style={styles.groupSub}>{group.memberCount} member{group.memberCount !== 1 ? 's' : ''}</Text>
            </View>
          </View>
        )}

        {/* ── Success State ── */}
        {success && (
          <View style={styles.successBox}>
            <Ionicons name="checkmark-circle" size={20} color="#30D158" />
            <Text style={styles.successText}>
              Invite sent to <Text style={{ fontWeight: '800' }}>{email || 'the user'}</Text>
            </Text>
          </View>
        )}

        {/* ── Error ── */}
        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={15} color="#FF6B6B" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* ── Email Input ── */}
        <View style={styles.field}>
          <Text style={styles.label}>Friend's Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={(t) => { setEmail(t); setError(''); setSuccess(false); }}
            placeholder="friend@example.com"
            placeholderTextColor="#444"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="send"
            onSubmitEditing={handleSend}
          />
        </View>

        <Text style={styles.hint}>
          Your friend will receive an in-app notification to join "{group?.name || 'the group'}".
        </Text>

        {/* ── Send Button ── */}
        <TouchableOpacity
          style={[styles.sendBtn, (!email || loading) && styles.disabled]}
          onPress={handleSend}
          disabled={!email || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="paper-plane" size={18} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.sendBtnText}>Send Invite</Text>
            </>
          )}
        </TouchableOpacity>

        {/* ── Alternatively: Share Invite Code ── */}
        {group?.inviteCode && (
          <View style={styles.inviteCodeSection}>
            <Text style={styles.orDivider}>— or share the invite code —</Text>
            <View style={styles.codeBox}>
              <Text style={styles.code}>{group.inviteCode}</Text>
            </View>
            <Text style={styles.codeHint}>
              Anyone with this code can join "{group.name}" via "Join with Code"
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  scroll: { padding: 20, paddingBottom: 48 },

  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 24,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', width: 70 },
  backText: { color: '#FF6B35', fontSize: 15, fontWeight: '600', marginLeft: 2 },
  title: { fontSize: 20, fontWeight: '800', color: '#fff' },

  groupBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#111', borderRadius: 16, padding: 16,
    marginBottom: 24, borderWidth: 1, borderColor: '#1f1f1f',
  },
  groupIcon: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#FF6B35',
    justifyContent: 'center', alignItems: 'center',
    marginRight: 14,
  },
  groupIconText: { color: '#fff', fontSize: 20, fontWeight: '800' },
  groupName: { color: '#fff', fontWeight: '700', fontSize: 16 },
  groupSub: { color: '#888', fontSize: 12, marginTop: 3 },

  successBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(48,209,88,0.12)',
    borderRadius: 10, padding: 12, marginBottom: 16,
    borderLeftWidth: 3, borderLeftColor: '#30D158',
  },
  successText: { color: '#30D158', fontSize: 13, flex: 1 },

  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,59,48,0.12)',
    borderRadius: 10, padding: 12, marginBottom: 16,
    borderLeftWidth: 3, borderLeftColor: '#FF3B30',
  },
  errorText: { color: '#FF6B6B', fontSize: 13, flex: 1 },

  field: { marginBottom: 12 },
  label: {
    color: '#888', fontSize: 12, fontWeight: '700',
    letterSpacing: 0.8, marginBottom: 8, textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#161616', color: '#fff',
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 15,
    fontSize: 15, borderWidth: 1, borderColor: '#252525',
  },
  hint: { color: '#666', fontSize: 12, lineHeight: 18, marginBottom: 24 },

  sendBtn: {
    flexDirection: 'row',
    backgroundColor: '#FF6B35',
    borderRadius: 16, paddingVertical: 17,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#FF6B35', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45, shadowRadius: 14, elevation: 10,
    marginBottom: 32,
  },
  disabled: { opacity: 0.45 },
  sendBtnText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.4 },

  inviteCodeSection: { alignItems: 'center' },
  orDivider: { color: '#333', fontSize: 12, marginBottom: 16 },
  codeBox: {
    backgroundColor: '#1a1a1a',
    borderRadius: 14, paddingHorizontal: 32, paddingVertical: 18,
    borderWidth: 1, borderColor: '#2a2a2a',
    marginBottom: 10,
  },
  code: {
    color: '#FF6B35', fontSize: 26, fontWeight: '800',
    letterSpacing: 6, textAlign: 'center',
  },
  codeHint: { color: '#555', fontSize: 12, textAlign: 'center', lineHeight: 18 },
});

export default SendInviteScreen;
