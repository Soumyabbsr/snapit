import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  ToastAndroid,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import { formatDistanceToNow } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import apiClient from '../../api/client';

/**
 * In-app widget preview: latest photo from another group member only.
 * Pass `groupId` via route params when this screen is mounted from navigation.
 */
const WidgetDisplayScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const groupId = route?.params?.groupId;

  const [widgetData, setWidgetData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchWidgetData = useCallback(async () => {
    if (!groupId) {
      setLoading(false);
      setError('Missing group');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const { data } = await apiClient.get(`/widgets/data/${groupId}`);
      setWidgetData(data.data);
    } catch (e) {
      setError(e.message || 'Failed to load widget');
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchWidgetData();
  }, [fetchWidgetData]);

  const showToast = (message) => {
    if (Platform.OS === 'android') ToastAndroid.show(message, ToastAndroid.SHORT);
  };

  if (!groupId) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.muted}>No group selected.</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color="#FF6B35" size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backRow} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color="#FF6B35" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>
          <TouchableOpacity style={styles.retry} onPress={() => { showToast('Retrying…'); fetchWidgetData(); }}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!widgetData?.hasPhoto) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backRow} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color="#FF6B35" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <View style={styles.placeholderWrap}>
          <Text style={styles.placeholderEmoji}>{widgetData?.group?.emoji || '💛'}</Text>
        </View>
        <Text style={styles.waitingText}>
          Waiting for {widgetData?.group?.name || 'your group'} to share a photo
        </Text>
      </View>
    );
  }

  const { photo, group } = widgetData;
  const when = photo.uploadedAt
    ? formatDistanceToNow(new Date(photo.uploadedAt), { addSuffix: true })
    : '';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <TouchableOpacity style={styles.backRow} onPress={() => navigation.goBack()}>
        <Ionicons name="chevron-back" size={22} color="#FF6B35" />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <View style={styles.imageCard}>
        <FastImage
          source={{ uri: photo.url, priority: FastImage.priority.high }}
          style={styles.image}
          resizeMode={FastImage.resizeMode.cover}
        />
        <View style={styles.pill}>
          <Text style={styles.pillText} numberOfLines={1}>
            {photo.uploaderName || 'Friend'} · {when}
          </Text>
        </View>
      </View>

      {photo.caption ? <Text style={styles.caption}>{photo.caption}</Text> : null}
      <Text style={styles.groupHint}>
        {group?.emoji} {group?.name}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', paddingHorizontal: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  backRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, marginTop: 4 },
  backText: { color: '#FF6B35', fontWeight: '600', marginLeft: 2 },
  muted: { color: '#888' },
  error: { color: '#c77', textAlign: 'center', marginBottom: 12 },
  retry: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryText: { color: '#fff', fontWeight: '700' },
  placeholderWrap: {
    flex: 1,
    maxHeight: 280,
    backgroundColor: '#e8e8e8',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  placeholderEmoji: { fontSize: 56 },
  waitingText: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  imageCard: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#111',
    marginBottom: 12,
  },
  image: { width: '100%', aspectRatio: 1 },
  pill: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  pillText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  caption: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'center',
  },
  groupHint: { color: '#555', fontSize: 12, textAlign: 'center' },
});

export default WidgetDisplayScreen;
