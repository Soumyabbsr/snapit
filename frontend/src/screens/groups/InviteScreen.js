import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  FlatList, ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { getMyInvites, acceptInvite, declineInvite } from '../../api/invites';
import { useGroup } from '../../context/GroupContext';
import { timeAgo } from '../../utils/timeUtils';

/**
 * InviteScreen — shows pending group invites sent to the current user.
 */
const InviteScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { fetchUserGroups } = useGroup();

  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processing, setProcessing] = useState(null); // inviteId being processed

  const loadInvites = useCallback(async () => {
    try {
      const res = await getMyInvites();
      if (res.success) setInvites(res.invites);
    } catch (err) {
      console.log('Load invites error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadInvites();
    }, [loadInvites])
  );

  const handleAccept = async (invite) => {
    setProcessing(invite._id);
    try {
      const res = await acceptInvite(invite._id);
      if (res.success) {
        setInvites((prev) => prev.filter((i) => i._id !== invite._id));
        await fetchUserGroups();
        Alert.alert('🎉 Joined!', `You've joined "${invite.group?.name || 'the group'}".`);
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not accept invite.');
    } finally {
      setProcessing(null);
    }
  };

  const handleDecline = async (invite) => {
    Alert.alert(
      'Decline Invite',
      `Are you sure you want to decline the invite to "${invite.group?.name || 'this group'}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            setProcessing(invite._id);
            try {
              await declineInvite(invite._id);
              setInvites((prev) => prev.filter((i) => i._id !== invite._id));
            } catch (err) {
              Alert.alert('Error', err.message || 'Could not decline invite.');
            } finally {
              setProcessing(null);
            }
          },
        },
      ]
    );
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadInvites();
  };

  const renderInvite = ({ item }) => {
    const isProcessing = processing === item._id;
    return (
      <View style={styles.card}>
        {/* Group Info */}
        <View style={styles.groupInfo}>
          <View style={styles.groupIconCircle}>
            <Text style={styles.groupIconText}>
              {item.group?.name?.charAt(0)?.toUpperCase() || '?'}
            </Text>
          </View>
          <View style={styles.groupDetails}>
            <Text style={styles.groupName}>{item.group?.name || 'Unknown Group'}</Text>
            <Text style={styles.invitedBy}>
              Invited by{' '}
              <Text style={styles.inviterName}>{item.invitedBy?.name || 'someone'}</Text>
            </Text>
            <Text style={styles.time}>{timeAgo(item.createdAt)}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.declineBtn, isProcessing && styles.disabled]}
            onPress={() => handleDecline(item)}
            disabled={isProcessing}
          >
            <Text style={styles.declineBtnText}>Decline</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.acceptBtn, isProcessing && styles.disabled]}
            onPress={() => handleAccept(item)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.acceptBtnText}>Accept</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Invites</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <ActivityIndicator color="#FF6B35" style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={invites}
          keyExtractor={(item) => item._id}
          renderItem={renderInvite}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#FF6B35" />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="mail-open-outline" size={64} color="#222" />
              <Text style={styles.emptyTitle}>No Invites</Text>
              <Text style={styles.emptySub}>
                When someone invites you to a group, it'll appear here.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#111',
  },
  backBtn: { padding: 4 },
  title: { fontSize: 20, fontWeight: '800', color: '#fff' },

  listContent: { padding: 16, paddingBottom: 48 },

  card: {
    backgroundColor: '#111',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#1f1f1f',
  },
  groupInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  groupIconCircle: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: '#FF6B35',
    justifyContent: 'center', alignItems: 'center',
    marginRight: 14,
  },
  groupIconText: { color: '#fff', fontSize: 22, fontWeight: '800' },
  groupDetails: { flex: 1 },
  groupName: { color: '#fff', fontWeight: '700', fontSize: 16, marginBottom: 4 },
  invitedBy: { color: '#888', fontSize: 13 },
  inviterName: { color: '#FF6B35', fontWeight: '700' },
  time: { color: '#555', fontSize: 11, marginTop: 3 },

  actions: { flexDirection: 'row', gap: 10 },
  declineBtn: {
    flex: 1, backgroundColor: '#1a1a1a',
    borderRadius: 12, paddingVertical: 13,
    alignItems: 'center',
    borderWidth: 1, borderColor: '#2a2a2a',
  },
  declineBtnText: { color: '#888', fontWeight: '700', fontSize: 14 },

  acceptBtn: {
    flex: 2, backgroundColor: '#FF6B35',
    borderRadius: 12, paddingVertical: 13,
    alignItems: 'center',
    shadowColor: '#FF6B35', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 10, elevation: 8,
  },
  acceptBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  disabled: { opacity: 0.5 },

  empty: { alignItems: 'center', marginTop: 80, paddingHorizontal: 32 },
  emptyTitle: { color: '#fff', fontSize: 20, fontWeight: '700', marginTop: 16, marginBottom: 8 },
  emptySub: { color: '#666', fontSize: 14, textAlign: 'center', lineHeight: 22 },
});

export default InviteScreen;
