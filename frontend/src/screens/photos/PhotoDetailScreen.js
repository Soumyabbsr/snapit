import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Alert, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { timeAgo, expiresIn } from '../../utils/timeUtils';
import { deletePhoto } from '../../api/photos';
import { useAuth } from '../../context/AuthContext';
import { emitPhotoDeleted } from '../../utils/photoEvents';
import { resolvePhotoImageUri } from '../../utils/imageUri';

const { width, height } = Dimensions.get('window');

const PhotoDetailScreen = ({ route, navigation }) => {
  const { photo } = route.params;
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const imageUri = resolvePhotoImageUri(photo);
  const mainImageSource = useMemo(
    () => (imageUri ? { uri: imageUri } : null),
    [imageUri]
  );

  useEffect(() => {
    setImgFailed(false);
  }, [photo?._id, imageUri]);

  useEffect(() => {
    if (!mainImageSource?.uri) return;
    // eslint-disable-next-line no-console
    console.log('[PhotoDetail] main image source:', JSON.stringify(mainImageSource));
  }, [mainImageSource]);

  useEffect(() => {
    if (imgFailed || !mainImageSource?.uri) {
      let sample = '';
      try {
        sample = JSON.stringify(photo);
        if (sample.length > 1500) sample = `${sample.slice(0, 1500)}…`;
      } catch {
        sample = String(photo);
      }
      // eslint-disable-next-line no-console
      console.warn(
        '[PhotoDetail] fallback. imgFailed=',
        imgFailed,
        'resolvedUri=',
        imageUri,
        'rawPhoto:',
        sample
      );
    }
  }, [imgFailed, mainImageSource, photo]);

  const uploadedBy = typeof photo.uploadedBy === 'object' ? photo.uploadedBy : { _id: photo.uploadedBy };
  const isOwner = uploadedBy._id === user?.id || uploadedBy._id === user?._id;

  const handleBack = () => {
    navigation.goBack();
  };

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
            emitPhotoDeleted(photo._id, photo.groupId != null ? String(photo.groupId) : undefined);
            navigation.goBack();
          } catch (e) {
            Alert.alert('Error', 'Failed to delete photo.');
            setIsDeleting(false);
          }
        }
      }
    ]);
  };

  const handleDownload = () => {
    Alert.alert('Coming Soon', 'Download to gallery feature will be implemented soon.');
  };

  const handleShare = () => {
    Alert.alert('Coming Soon', 'Sharing to other apps will be implemented soon.');
  };

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={[styles.header, { top: insets.top + 10 }]}>
        <TouchableOpacity style={styles.iconBtn} onPress={handleBack}>
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>

        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconBtn} onPress={handleDownload}>
            <Ionicons name="download-outline" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={handleShare}>
            <Ionicons name="share-outline" size={24} color="#fff" />
          </TouchableOpacity>
          {isOwner && (
            <TouchableOpacity style={styles.iconBtn} onPress={handleDelete}>
              <Ionicons name="trash-outline" size={24} color="#FF3B30" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Photo Container ── */}
      <View style={styles.imageWrapper}>
        {isDeleting ? (
          <ActivityIndicator color="#FF6B35" size="large" />
        ) : mainImageSource && !imgFailed ? (
          <Image
            source={mainImageSource}
            style={styles.image}
            contentFit="contain"
            transition={300}
            recyclingKey={photo._id != null ? `${photo._id}:${imageUri}` : imageUri}
            cachePolicy="memory-disk"
            priority="high"
            decodeFormat="rgb"
            allowDownscaling
            onError={(e) => {
              const errMsg = e?.error ?? e?.message ?? String(e);
              // eslint-disable-next-line no-console
              console.warn(
                '[PhotoDetail][expo-image] load error:',
                errMsg,
                'source:',
                JSON.stringify(mainImageSource)
              );
              setImgFailed(true);
            }}
          />
        ) : (
          <View style={[styles.image, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#111' }]}>
            <Text style={{ color: '#888' }}>Could not load image</Text>
          </View>
        )}
      </View>

      {/* ── Footer Overlay ── */}
      <View style={[styles.footer, { paddingBottom: insets.bottom || 24 }]}>
        <View style={styles.uploaderInfo}>
          {uploadedBy.profilePicture?.url || uploadedBy.avatar ? (
            <Image
              source={{ uri: uploadedBy.profilePicture?.url || uploadedBy.avatar }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarText}>{uploadedBy.name?.charAt(0) || 'U'}</Text>
            </View>
          )}
          <View>
            <Text style={styles.name}>{uploadedBy.name || 'Unknown'}</Text>
            <Text style={styles.time}>{timeAgo(photo.createdAt)}</Text>
          </View>
        </View>

        {photo.caption ? (
          <Text style={styles.caption}>{photo.caption}</Text>
        ) : null}

        <View style={styles.badgeRow}>
          <View style={styles.expirationBadge}>
            <Ionicons name="timer-outline" size={12} color="#FF6B35" style={{ marginRight: 4 }} />
            <Text style={styles.expirationText}>Expires in {expiresIn(photo.expiresAt)}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: width,
    height: height,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 40,
    // Add gradient later or just solid background
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  uploaderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  avatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  name: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  time: {
    color: '#aaa',
    fontSize: 12,
    marginTop: 2,
  },
  caption: {
    color: '#eee',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  expirationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 53, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  expirationText: {
    color: '#FF6B35',
    fontSize: 12,
    fontWeight: '700',
  },
});

export default PhotoDetailScreen;
