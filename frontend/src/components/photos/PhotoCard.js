import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Alert, TouchableWithoutFeedback } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { timeAgo, expiresIn } from '../../utils/timeUtils';
import { deletePhoto } from '../../api/photos';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

const PhotoCard = ({ photo, onDelete }) => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [isDeleting, setIsDeleting] = useState(false);

  const uploadedBy = typeof photo.uploadedBy === 'object' ? photo.uploadedBy : { _id: photo.uploadedBy };
  const isOwner = uploadedBy._id === user?.id || uploadedBy._id === user?._id;

  const handleDelete = () => {
    Alert.alert('Delete Photo', 'Are you sure you want to permanently delete this photo?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', 
        style: 'destructive',
        onPress: async () => {
          setIsDeleting(true);
          try {
            await deletePhoto(photo._id);
            if (onDelete) onDelete(photo._id);
          } catch (e) {
            Alert.alert('Error', 'Failed to delete photo.');
            setIsDeleting(false);
          }
        }
      }
    ]);
  };

  if (isDeleting) return null; // Immediately hide from feed

  return (
    <View style={styles.card}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.uploaderInfo}>
          {uploadedBy.profilePicture?.url ? (
            <Image source={{ uri: uploadedBy.profilePicture.url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarText}>{uploadedBy.name?.charAt(0) || '?'}</Text>
            </View>
          )}
          <View>
            <Text style={styles.name}>{uploadedBy.name || 'Unknown'}</Text>
            <Text style={styles.time}>{timeAgo(photo.createdAt)}</Text>
          </View>
        </View>

        {isOwner && (
          <TouchableOpacity onPress={handleDelete} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="ellipsis-horizontal" size={20} color="#888" />
          </TouchableOpacity>
        )}
      </View>

      {/* ── Image ── */}
      <TouchableWithoutFeedback onPress={() => navigation.navigate('PhotoDetail', { photo: { ...photo, uploadedBy }, onPhotoDeleted: onDelete })}>
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: photo.imageUrl || photo.thumbnailUrl }} 
            style={styles.image}
            contentFit="cover"
            transition={200}
          />
          <View style={styles.expirationBadge}>
            <Ionicons name="timer-outline" size={12} color="#fff" style={{ marginRight: 4 }} />
            <Text style={styles.expirationText}>{expiresIn(photo.expiresAt)}</Text>
          </View>
        </View>
      </TouchableWithoutFeedback>

      {/* ── Caption ── */}
      {photo.caption ? (
        <View style={styles.footer}>
          <Text style={styles.caption}>
            <Text style={styles.captionName}>{photo.uploadedBy.name} </Text>
            {photo.caption}
          </Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: { backgroundColor: '#0a0a0a', marginBottom: 24 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12
  },
  uploaderInfo: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 36, height: 36, borderRadius: 18, marginRight: 10 },
  avatarFallback: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#FF6B35',
    justifyContent: 'center', alignItems: 'center', marginRight: 10
  },
  avatarText: { color: '#fff', fontWeight: 'bold' },
  name: { color: '#fff', fontWeight: '600', fontSize: 13 },
  time: { color: '#666', fontSize: 11, marginTop: 2 },
  
  imageContainer: { position: 'relative' },
  image: { width: width, height: width * 1.25, backgroundColor: '#111' },
  
  expirationBadge: {
    position: 'absolute', top: 12, right: 12,
    backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 12, flexDirection: 'row', alignItems: 'center'
  },
  expirationText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  
  footer: { paddingHorizontal: 16, paddingTop: 12 },
  caption: { color: '#fff', fontSize: 13, lineHeight: 18 },
  captionName: { fontWeight: '700' },
});

export default PhotoCard;
