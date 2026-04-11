import React, { useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  FlatList, ActivityIndicator, Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useGroup } from '../../context/GroupContext';
import { useFocusEffect } from '@react-navigation/native';

const HomeScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { groups, loading, fetchUserGroups, selectGroup } = useGroup();

  useFocusEffect(
    useCallback(() => {
      fetchUserGroups();
    }, [fetchUserGroups])
  );

  const handleGroupPress = (groupId) => {
    selectGroup(groupId);
    navigation.navigate('GroupStack', { screen: 'GroupFeed', params: { groupId } });
  };

  const firstName = user?.name?.split(' ')[0] || 'there';

  const renderGroup = ({ item }) => (
    <TouchableOpacity
      style={styles.groupCard}
      activeOpacity={0.8}
      onPress={() => handleGroupPress(item._id)}
    >
      <View style={styles.groupIconContainer}>
        {item.icon ? (
          <Image source={{ uri: item.icon }} style={styles.groupIcon} />
        ) : (
          <View style={[styles.groupIcon, styles.groupIconFallback]}>
            <Text style={styles.groupIconText}>{item.name.charAt(0)}</Text>
          </View>
        )}
      </View>
      <View style={styles.groupInfo}>
        <Text style={styles.groupName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.groupSub}>
          {item.memberCount} {item.memberCount === 1 ? 'member' : 'members'}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#444" />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hey, {firstName} 👋</Text>
          <Text style={styles.sub}>Your Groups</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.queueBtn} 
            onPress={() => navigation.navigate('Invites')}
          >
            <Ionicons name="mail-outline" size={24} color="#888" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.queueBtn} 
            onPress={() => navigation.navigate('UploadQueue')}
          >
            <Ionicons name="cloud-upload-outline" size={24} color="#888" />
          </TouchableOpacity>
          <View style={styles.logoCircle}>
            <Text style={styles.logoEmoji}>📸</Text>
          </View>
        </View>
      </View>

      {/* ── Actions ── */}
      <View style={styles.actionsBox}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('CreateGroup')}>
          <Ionicons name="add-circle" size={24} color="#FF6B35" />
          <Text style={styles.actionText}>Create Group</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtnLine} onPress={() => navigation.navigate('JoinGroup')}>
          <Ionicons name="enter-outline" size={24} color="#fff" />
          <Text style={styles.actionTextLine}>Join with Code</Text>
        </TouchableOpacity>
      </View>

      {/* ── List ── */}
      {loading && groups.length === 0 ? (
        <ActivityIndicator color="#FF6B35" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(item) => item._id}
          renderItem={renderGroup}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color="#333" />
              <Text style={styles.emptyTitle}>No groups yet</Text>
              <Text style={styles.emptySub}>Create a group or join one to start sharing photos.</Text>
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
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 22, paddingVertical: 18,
  },
  greeting: { fontSize: 24, fontWeight: '800', color: '#fff' },
  sub: { fontSize: 13, color: '#666', marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  queueBtn: { padding: 4 },
  logoCircle: {
    width: 46, height: 46, borderRadius: 23, backgroundColor: '#1a1a1a',
    borderWidth: 2, borderColor: '#FF6B35', justifyContent: 'center', alignItems: 'center',
  },
  logoEmoji: { fontSize: 22 },

  actionsBox: {
    flexDirection: 'row', gap: 12, paddingHorizontal: 20, marginBottom: 24
  },
  actionBtn: {
    flex: 1, backgroundColor: '#1a1a1a', borderRadius: 16, paddingVertical: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1, borderColor: '#333'
  },
  actionBtnLine: {
    flex: 1, backgroundColor: '#FF6B35', borderRadius: 16, paddingVertical: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  actionText: { color: '#FF6B35', fontWeight: '700', fontSize: 14 },
  actionTextLine: { color: '#fff', fontWeight: '700', fontSize: 14 },

  listContent: { paddingHorizontal: 20, paddingBottom: 40 },
  groupCard: {
    flexDirection: 'row', alignItems: 'center', padding: 16,
    backgroundColor: '#111', borderRadius: 20, marginBottom: 12,
    borderWidth: 1, borderColor: '#1f1f1f'
  },
  groupIconContainer: { marginRight: 16 },
  groupIcon: { width: 50, height: 50, borderRadius: 25 },
  groupIconFallback: {
    backgroundColor: '#FF6B35', justifyContent: 'center', alignItems: 'center'
  },
  groupIconText: { color: '#fff', fontSize: 20, fontWeight: '800', textTransform: 'uppercase' },
  groupInfo: { flex: 1 },
  groupName: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 4 },
  groupSub: { fontSize: 12, color: '#888' },

  emptyContainer: { alignItems: 'center', marginTop: 80, paddingHorizontal: 30 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#fff', marginTop: 16, marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 22 },
});

export default HomeScreen;
