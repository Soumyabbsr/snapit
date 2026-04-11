import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import UploadQueueManager from '../../services/uploadQueueManager';

const UploadQueueScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [queue, setQueue] = useState([]);

  useEffect(() => {
    // Initial load
    UploadQueueManager.loadQueue();
    // Subscribe to state changes in queue
    const unsubscribe = UploadQueueManager.subscribe((newQueue) => {
      setQueue(newQueue);
    });
    return unsubscribe;
  }, []);

  const getStatusIcon = (status) => {
    switch(status) {
      case 'pending': return <Ionicons name="time-outline" size={24} color="#888" />;
      case 'uploading': return <ActivityIndicator color="#FF6B35" size="small" />;
      case 'completed': return <Ionicons name="checkmark-circle" size={24} color="#4cd964" />;
      case 'failed': return <Ionicons name="warning" size={24} color="#ff3b30" />;
      default: return null;
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.queueItem}>
      <Image source={{ uri: item.imageUri }} style={styles.thumb} />
      <View style={styles.info}>
        <Text style={styles.statusText}>Status: {item.status.toUpperCase()}</Text>
        <Text style={styles.dateText}>{new Date(item.addedAt).toLocaleString()}</Text>
        {item.status === 'failed' && <Text style={styles.errorText}>Retries: {item.retries}/3</Text>}
      </View>
      
      <View style={styles.actions}>
        {getStatusIcon(item.status)}
        {item.status === 'failed' && (
          <TouchableOpacity 
            style={styles.retryBtn} 
            onPress={() => UploadQueueManager.retryFailed()}
          >
            <Ionicons name="refresh" size={18} color="#fff" />
          </TouchableOpacity>
        )}
        <TouchableOpacity 
          style={styles.deleteBtn} 
          onPress={() => UploadQueueManager.removeFromQueue(item.id)}
        >
          <Ionicons name="trash" size={18} color="#ff3b30" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#FF6B35" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Upload Queue</Text>
        <View style={{ width: 70 }} />
      </View>

      <FlatList
        data={queue}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="cloud-done-outline" size={60} color="#333" />
            <Text style={styles.emptyText}>Queue is empty</Text>
            <Text style={styles.emptySub}>All photos have been backed up sync'd.</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#111'
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', width: 70 },
  backText: { color: '#FF6B35', fontSize: 15, fontWeight: '600', marginLeft: 2 },
  title: { fontSize: 18, fontWeight: '800', color: '#fff' },
  
  list: { padding: 16 },
  queueItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#111',
    borderRadius: 12, padding: 12, marginBottom: 12
  },
  thumb: { width: 60, height: 60, borderRadius: 8, backgroundColor: '#222' },
  info: { flex: 1, marginLeft: 12 },
  statusText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  dateText: { color: '#888', fontSize: 12, marginTop: 4 },
  errorText: { color: '#ff3b30', fontSize: 12, marginTop: 2 },
  
  actions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  retryBtn: { padding: 8, backgroundColor: '#FF6B35', borderRadius: 8 },
  deleteBtn: { padding: 8, backgroundColor: 'rgba(255, 59, 48, 0.1)', borderRadius: 8 },
  
  empty: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyText: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginTop: 16 },
  emptySub: { color: '#666', fontSize: 14, marginTop: 8 }
});

export default UploadQueueScreen;
