import React from 'react';
import {
  View, Text, Image, TouchableOpacity,
  StyleSheet, ScrollView, Alert,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ProfileScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: logout },
      ]
    );
  };

  const avatarUri = user?.profilePicture?.url;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.screenTitle}>Profile</Text>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* ── Avatar ── */}
        <View style={styles.avatarSection}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>
                {user?.name?.charAt(0)?.toUpperCase() || '?'}
              </Text>
            </View>
          )}
          <Text style={styles.name}>{user?.name || 'User'}</Text>
          <Text style={styles.email}>{user?.email || ''}</Text>
          {user?.bio ? <Text style={styles.bio}>{user.bio}</Text> : null}
        </View>

        {/* ── Stats placeholder ── */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Photos</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Groups</Text>
          </View>
        </View>

        {/* ── Actions ── */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Text style={styles.actionEmoji}>✏️</Text>
            <Text style={styles.actionText}>Edit Profile</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => navigation.navigate('HomeMain', { screen: 'Invites' })}
          >
            <Text style={styles.actionEmoji}>📨</Text>
            <Text style={styles.actionText}>Group Invites</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => navigation.navigate('WidgetSetup')}
          >
            <Text style={styles.actionEmoji}>🪟</Text>
            <Text style={styles.actionText}>Widget Setup</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionRow, styles.logoutRow]} onPress={handleLogout}>
            <Text style={styles.actionEmoji}>🚪</Text>
            <Text style={[styles.actionText, styles.logoutText]}>Log Out</Text>
            <Text style={[styles.chevron, styles.logoutText]}>›</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  screenTitle: { fontSize: 24, fontWeight: '800', color: '#fff' },
  editBtn: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#FF6B35',
  },
  editBtnText: { color: '#FF6B35', fontWeight: '700', fontSize: 13 },
  avatarSection: { alignItems: 'center', paddingVertical: 24 },
  avatar: {
    width: 100, height: 100, borderRadius: 50,
    borderWidth: 3, borderColor: '#FF6B35',
  },
  avatarPlaceholder: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: '#1a1a1a',
    borderWidth: 3, borderColor: '#FF6B35',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarInitial: { fontSize: 40, fontWeight: '800', color: '#FF6B35' },
  name: { fontSize: 22, fontWeight: '800', color: '#fff', marginTop: 12 },
  email: { fontSize: 14, color: '#888', marginTop: 4 },
  bio: { fontSize: 14, color: '#aaa', marginTop: 8, textAlign: 'center', paddingHorizontal: 32 },
  statsRow: {
    flexDirection: 'row',
    margin: 20,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
  },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '800', color: '#FF6B35' },
  statLabel: { fontSize: 12, color: '#888', marginTop: 2 },
  statDivider: { width: 1, backgroundColor: '#2a2a2a', marginHorizontal: 8 },
  actions: { marginHorizontal: 20 },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
  },
  logoutRow: { marginTop: 8 },
  actionEmoji: { fontSize: 18, marginRight: 12 },
  actionText: { flex: 1, fontSize: 15, color: '#fff', fontWeight: '600' },
  logoutText: { color: '#FF3B30' },
  chevron: { fontSize: 20, color: '#555' },
});

export default ProfileScreen;
