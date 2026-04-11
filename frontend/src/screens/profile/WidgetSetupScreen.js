import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Switch,
  FlatList,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import apiClient from '../../api/client';
import widgetService from '../../services/widgetService';

const SkeletonRow = () => (
  <View style={styles.skeletonRow}>
    <View style={styles.skeletonAvatar} />
    <View style={styles.skeletonTextCol}>
      <View style={styles.skeletonLineLg} />
      <View style={styles.skeletonLineSm} />
    </View>
  </View>
);

/**
 * WidgetSetupScreen — pick a real group for the Android home screen widget.
 */
const WidgetSetupScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listRefreshing, setListRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [displayCount, setDisplayCount] = useState(5);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchGroups = useCallback(async (isPull = false) => {
    try {
      setError(null);
      if (isPull) setListRefreshing(true);
      else setLoading(true);
      const { data } = await apiClient.get('/widgets/groups');
      setGroups(data.data?.groups || []);
    } catch {
      setError('Failed to load groups. Pull down to retry.');
    } finally {
      setLoading(false);
      setListRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const displayOptions = [3, 5, 10];

  const goToGroupsTab = () => {
    navigation.getParent()?.navigate('Home', { screen: 'HomeMain' });
  };

  const handleSave = async () => {
    if (!selectedGroupId) {
      Alert.alert('Select a Group', 'Please select which group to show on your widget.');
      return;
    }

    setSaving(true);
    try {
      await apiClient.post('/widgets', { groupId: selectedGroupId, size: 'medium' });
      await widgetService.saveWidgetConfig({
        groupId: selectedGroupId,
        displayCount,
        autoRefresh,
      });
      await widgetService.refreshAllWidgets();
      Alert.alert(
        '✅ Widget Configured!',
        'Your home screen widget has been updated. Add the SnapIt widget to your home screen if you haven\'t already.',
        [{ text: 'Done', onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to save widget settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleRefreshNow = async () => {
    try {
      await widgetService.refreshAllWidgets();
      Alert.alert('Refreshed ✓', 'Your home screen widget has been refreshed.');
    } catch {
      Alert.alert('Error', 'Could not refresh widget.');
    }
  };

  const selectedGroup = groups.find((g) => String(g._id) === String(selectedGroupId));

  const renderGroupItem = ({ item }) => {
    const selected = String(selectedGroupId) === String(item._id);
    return (
      <TouchableOpacity
        style={[styles.groupItem, selected && styles.groupItemSelected]}
        onPress={() => setSelectedGroupId(item._id)}
      >
        <View style={styles.groupIcon}>
          <Text style={styles.groupEmoji}>{item.emoji || '💛'}</Text>
        </View>
        <View style={styles.groupInfo}>
          <Text style={styles.groupName}>{item.name}</Text>
          <Text style={styles.groupSub}>
            {item.memberCount} member{item.memberCount !== 1 ? 's' : ''}
          </Text>
        </View>
        {selected && <Ionicons name="checkmark-circle" size={24} color="#FF6B35" />}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <FlatList
        data={loading ? [] : groups}
        keyExtractor={(item) => String(item._id)}
        renderItem={renderGroupItem}
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                <Ionicons name="chevron-back" size={24} color="#FF6B35" />
                <Text style={styles.backText}>Back</Text>
              </TouchableOpacity>
              <Text style={styles.title}>Widget Setup</Text>
              <View style={{ width: 70 }} />
            </View>

            <View style={styles.widgetPreview}>
              <View style={styles.widgetPreviewInner}>
                <Ionicons name="images-outline" size={36} color="#FF6B35" />
                <Text style={styles.widgetPreviewTitle}>SnapIt Widget</Text>
                <Text style={styles.widgetPreviewSub}>
                  {selectedGroupId
                    ? `Showing ${displayCount} photos from "${selectedGroup?.name || 'group'}"`
                    : 'Select a group below'}
                </Text>
              </View>
            </View>

            <Text style={styles.sectionLabel}>Display Group</Text>

            {loading ? (
              <View style={{ marginBottom: 12 }}>
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </View>
            ) : null}

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={fetchGroups}>
                  <Text style={styles.retryBtnText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {!loading && !error && groups.length === 0 ? (
              <View style={styles.emptyGroups}>
                <Text style={styles.emptyGroupsText}>
                  You have no groups yet. Create or join a group first.
                </Text>
                <TouchableOpacity style={styles.createGroupBtn} onPress={goToGroupsTab}>
                  <Text style={styles.createGroupBtnText}>Open Groups</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </>
        }
        ListEmptyComponent={
          loading || error || groups.length === 0 ? null : (
            <View style={{ height: 8 }} />
          )
        }
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={listRefreshing}
            onRefresh={() => fetchGroups(true)}
            tintColor="#FF6B35"
          />
        }
        ListFooterComponent={
          <>
            {selectedGroupId && !loading && groups.length > 0 ? (
              <TouchableOpacity
                style={styles.previewBtn}
                onPress={async () => {
                  try {
                    await apiClient.post('/widgets', {
                      groupId: selectedGroupId,
                      size: 'medium',
                    });
                    navigation.navigate('WidgetDisplay', { groupId: selectedGroupId });
                  } catch (err) {
                    Alert.alert(
                      'Preview unavailable',
                      err.message || 'Could not load widget preview. Try again.'
                    );
                  }
                }}
              >
                <Ionicons name="eye-outline" size={18} color="#FF6B35" style={{ marginRight: 8 }} />
                <Text style={[styles.previewBtnText, { flex: 1 }]}>Preview in app</Text>
                <Ionicons name="chevron-forward" size={18} color="#555" />
              </TouchableOpacity>
            ) : null}

            <Text style={[styles.sectionLabel, { marginTop: 24 }]}>Photos to Display</Text>
            <View style={styles.countOptions}>
              {displayOptions.map((count) => (
                <TouchableOpacity
                  key={count}
                  style={[styles.countOption, displayCount === count && styles.countOptionSelected]}
                  onPress={() => setDisplayCount(count)}
                >
                  <Text
                    style={[
                      styles.countOptionText,
                      displayCount === count && styles.countOptionTextSelected,
                    ]}
                  >
                    {count}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.switchRow}>
              <View>
                <Text style={styles.switchLabel}>Auto Refresh</Text>
                <Text style={styles.switchSub}>Keep widget updated with latest photos</Text>
              </View>
              <Switch
                value={autoRefresh}
                onValueChange={setAutoRefresh}
                trackColor={{ false: '#2a2a2a', true: '#FF6B35' }}
                thumbColor={autoRefresh ? '#fff' : '#888'}
              />
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.disabled]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="save-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.saveBtnText}>Save Widget Settings</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.refreshBtn} onPress={handleRefreshNow}>
              <Ionicons name="refresh" size={16} color="#FF6B35" style={{ marginRight: 6 }} />
              <Text style={styles.refreshBtnText}>Refresh Widget Now</Text>
            </TouchableOpacity>

            <Text style={styles.disclaimer}>
              After saving, long-press your Android home screen → Widgets → SnapIt to add the widget.
            </Text>
          </>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  scroll: { padding: 20, paddingBottom: 48 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', width: 70 },
  backText: { color: '#FF6B35', fontSize: 15, fontWeight: '600', marginLeft: 2 },
  title: { fontSize: 20, fontWeight: '800', color: '#fff' },

  widgetPreview: {
    backgroundColor: '#111',
    borderRadius: 20,
    padding: 4,
    marginBottom: 28,
    borderWidth: 1.5,
    borderColor: '#FF6B35',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  widgetPreviewInner: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  widgetPreviewTitle: { color: '#fff', fontWeight: '800', fontSize: 16, marginTop: 10 },
  widgetPreviewSub: {
    color: '#888',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },

  sectionLabel: {
    color: '#888',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 12,
  },

  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1f1f1f',
  },
  skeletonAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2a2a2a',
    marginRight: 14,
  },
  skeletonTextCol: { flex: 1 },
  skeletonLineLg: { height: 14, borderRadius: 6, backgroundColor: '#2a2a2a', width: '70%' },
  skeletonLineSm: {
    height: 10,
    borderRadius: 5,
    backgroundColor: '#222',
    width: '40%',
    marginTop: 8,
  },

  errorBox: {
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#332222',
  },
  errorText: { color: '#c77', fontSize: 14, textAlign: 'center', marginBottom: 12 },
  retryBtn: {
    alignSelf: 'center',
    backgroundColor: '#FF6B35',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryBtnText: { color: '#fff', fontWeight: '700' },

  groupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1f1f1f',
    marginBottom: 10,
  },
  groupItemSelected: {
    borderColor: '#FF6B35',
    backgroundColor: 'rgba(255, 107, 53, 0.08)',
  },
  groupIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  groupEmoji: { fontSize: 22 },
  groupInfo: { flex: 1 },
  groupName: { color: '#fff', fontWeight: '700', fontSize: 15 },
  groupSub: { color: '#888', fontSize: 12, marginTop: 2 },

  previewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#FF6B35',
  },
  previewBtnText: { color: '#FF6B35', fontWeight: '700', fontSize: 15 },

  emptyGroups: {
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyGroupsText: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  createGroupBtn: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  createGroupBtnText: { color: '#fff', fontWeight: '700' },

  countOptions: { flexDirection: 'row', gap: 12, marginBottom: 28 },
  countOption: {
    flex: 1,
    backgroundColor: '#111',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  countOptionSelected: {
    backgroundColor: 'rgba(255,107,53,0.1)',
    borderColor: '#FF6B35',
  },
  countOptionText: { color: '#888', fontSize: 18, fontWeight: '700' },
  countOptionTextSelected: { color: '#FF6B35' },

  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 16,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: '#1f1f1f',
  },
  switchLabel: { color: '#fff', fontWeight: '600', fontSize: 15, marginBottom: 2 },
  switchSub: { color: '#666', fontSize: 12 },

  saveBtn: {
    flexDirection: 'row',
    backgroundColor: '#FF6B35',
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 10,
    marginBottom: 14,
  },
  disabled: { opacity: 0.55 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.4 },

  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#252525',
    marginBottom: 20,
  },
  refreshBtnText: { color: '#FF6B35', fontWeight: '700', fontSize: 14 },

  disclaimer: { color: '#444', fontSize: 12, textAlign: 'center', lineHeight: 18 },
});

export default WidgetSetupScreen;
