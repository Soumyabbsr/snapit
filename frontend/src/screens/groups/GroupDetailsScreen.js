import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, FlatList, RefreshControl, Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGroup } from '../../context/GroupContext';
import { useAuth } from '../../context/AuthContext';
import * as api from '../../api/groups';
import * as photoApi from '../../api/photos';
import PhotoCard from '../../components/photos/PhotoCard';
import socketService from '../../services/socketService';

const GroupDetailsScreen = ({ navigation, route }) => {
  const { groupId } = route.params || {};
  const insets = useSafeAreaInsets();
  const { leaveGroup } = useGroup();
  const { token } = useAuth();

  const [group, setGroup] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [liveIndicator, setLiveIndicator] = useState(false);

  // Animate live badge
  const livePulse = useRef(new Animated.Value(1)).current;
  const listRef = useRef(null);

  const pulseAnimation = () => {
    Animated.sequence([
      Animated.timing(livePulse, { toValue: 1.3, duration: 200, useNativeDriver: true }),
      Animated.timing(livePulse, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  };

  // ─── Load Group + First Page ─────────────────────────────
  const loadGroupAndFirstPage = useCallback(async () => {
    try {
      const groupRes = await api.getGroupDetails(groupId);
      if (groupRes.success) setGroup(groupRes.group);

      const photoRes = await photoApi.getGroupPhotos(groupId, 1);
      if (photoRes.success) {
        setPhotos(photoRes.photos);
        setHasMore(photoRes.hasMore);
        setPage(2);
      }
    } catch (e) {
      console.log('Load group error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [groupId]);

  useEffect(() => {
    if (groupId) loadGroupAndFirstPage();
  }, [groupId, loadGroupAndFirstPage]);

  // ─── Socket.io Real-time Subscriptions ───────────────────
  useEffect(() => {
    if (!groupId) return;

    // Connect + join group room
    void socketService.connect(token);
    socketService.joinGroup(groupId);

    const unsubNew = socketService.on('photo:new', ({ photo, groupId: incomingGroupId }) => {
      if (incomingGroupId !== groupId) return;
      setPhotos((prev) => {
        // Prevent duplicates
        const exists = prev.some((p) => p._id === photo._id);
        if (exists) return prev;
        return [photo, ...prev];
      });
      // Flash live indicator
      setLiveIndicator(true);
      pulseAnimation();
      setTimeout(() => setLiveIndicator(false), 3000);
      // Scroll to top so user sees the new photo
      listRef.current?.scrollToOffset({ offset: 0, animated: true });
    });

    // Listen: photo deleted by owner
    const unsubDeleted = socketService.on('photo_deleted', ({ photoId, groupId: incomingGroupId }) => {
      if (incomingGroupId !== groupId) return;
      setPhotos((prev) => prev.filter((p) => p._id !== photoId));
    });

    return () => {
      // Cleanup — leave room and remove listeners
      socketService.leaveGroup(groupId);
      unsubNew();
      unsubDeleted();
    };
  }, [groupId, token]);

  // ─── Handlers ─────────────────────────────────────────────
  const handleRefresh = () => {
    setRefreshing(true);
    setPage(1);
    loadGroupAndFirstPage();
  };

  const loadMorePhotos = async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await photoApi.getGroupPhotos(groupId, page);
      if (res.success) {
        setPhotos((prev) => {
          const existingIds = new Set(prev.map((p) => p._id));
          const newPhotos = res.photos.filter((p) => !existingIds.has(p._id));
          return [...prev, ...newPhotos];
        });
        setHasMore(res.hasMore);
        setPage((prev) => prev + 1);
      }
    } finally {
      setLoadingMore(false);
    }
  };

  const handlePhotoDeleted = (photoId) => {
    setPhotos((prev) => prev.filter((p) => p._id !== photoId));
  };

  const openCamera = () => {
    navigation.navigate('Camera', { groupId });
  };

  if (loading || !group) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color="#FF6B35" size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerTitles}>
          <Text style={styles.headerTitle}>{group.name}</Text>
          <Text style={styles.headerSub}>{group.members?.length || 0} members</Text>
        </View>

        {/* Live badge */}
        {liveIndicator && (
          <Animated.View style={[styles.liveBadge, { transform: [{ scale: livePulse }] }]}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </Animated.View>
        )}

        <TouchableOpacity style={styles.cameraBtn} onPress={openCamera}>
          <Ionicons name="camera" size={24} color="#FF6B35" />
        </TouchableOpacity>
      </View>

      {/* ── Invite Code Bar ── */}
      <View style={styles.inviteBar}>
        <Ionicons name="key-outline" size={14} color="#888" />
        <Text style={styles.inviteCode}>Invite Code: </Text>
        <Text style={styles.inviteCodeValue}>{group.inviteCode}</Text>
      </View>

      {/* ── Photo Feed ── */}
      <FlatList
        ref={listRef}
        data={photos}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <PhotoCard
            photo={item}
            onDelete={handlePhotoDeleted}
            onPress={() =>
              navigation.navigate('PhotoDetail', {
                photo: item,
                onPhotoDeleted: handlePhotoDeleted,
              })
            }
          />
        )}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#FF6B35" />
        }
        onEndReached={loadMorePhotos}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator color="#FF6B35" style={{ marginVertical: 20 }} />
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="image-outline" size={60} color="#222" />
            <Text style={styles.emptyTitle}>No photos yet</Text>
            <Text style={styles.emptySub}>Be the first to snap a moment 📸</Text>
            <TouchableOpacity style={styles.snapCta} onPress={openCamera}>
              <Ionicons name="camera" size={18} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.snapCtaText}>Open Camera</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#111',
  },
  backBtn: { paddingRight: 16 },
  headerTitles: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 12, color: '#888' },
  cameraBtn: { padding: 8, backgroundColor: '#1a1a1a', borderRadius: 20 },

  liveBadge: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,59,48,0.15)',
    borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, marginRight: 8,
    borderWidth: 1, borderColor: 'rgba(255,59,48,0.4)',
  },
  liveDot: {
    width: 6, height: 6, borderRadius: 3, backgroundColor: '#FF3B30', marginRight: 5,
  },
  liveText: { color: '#FF3B30', fontSize: 10, fontWeight: '800', letterSpacing: 1 },

  inviteBar: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20,
    paddingVertical: 10, backgroundColor: '#0d0d0d',
  },
  inviteCode: { color: '#888', fontSize: 12, marginLeft: 6 },
  inviteCodeValue: { color: '#FF6B35', fontSize: 12, fontWeight: '800', letterSpacing: 2 },

  emptyContainer: { alignItems: 'center', marginTop: 100, paddingHorizontal: 30 },
  emptyTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginTop: 16 },
  emptySub: { color: '#666', fontSize: 14, marginTop: 8, textAlign: 'center' },
  snapCta: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FF6B35', paddingHorizontal: 24, paddingVertical: 14,
    borderRadius: 12, marginTop: 30,
  },
  snapCtaText: { color: '#fff', fontWeight: 'bold' },
});

export default GroupDetailsScreen;
