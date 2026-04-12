import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { normalizeHttpUrl, resolvePhotoImageUri } from '../utils/imageUri';

const WIDGET_CONFIG_KEY = '@snapit_widget_config';

// Safe native module access — WidgetModule may be null in Expo Go
let WidgetModuleNative = null;
try {
  const { WidgetModule } = require('../modules/WidgetModule');
  WidgetModuleNative = WidgetModule;
} catch {
  // Running in Expo Go or on iOS — native widget not available
}

class WidgetService {
  constructor() {
    this.isAndroid = Platform.OS === 'android';
  }

  /**
   * Build JSON for Android `GroupData` (snake_case keys: id, name, icon, member_count, latest_photo).
   * Accepts groups from GET /widgets/groups or GET /groups.
   */
  buildNativeGroupCatalogJson(groupsFromApi) {
    const raw = Array.isArray(groupsFromApi) ? groupsFromApi : [];
    const list = raw
      .map((g) => {
        const id = String(g._id ?? g.id ?? '').trim();
        if (!id) return null;
        const emoji = g.emoji || '';
        const name = (g.name || 'Group').trim();
        const displayName = emoji ? `${emoji} ${name}`.trim() : name;
        const icon =
          (typeof g.icon === 'string' && g.icon.length > 0 ? g.icon : null) ||
          (typeof g.imageUrl === 'string' ? g.imageUrl : null);
        const mc = Number(g.memberCount ?? g.member_count ?? 0) || 0;
        let latestPhoto = null;
        const lp = g.latestPhoto;
        if (lp && typeof lp === 'object') {
          latestPhoto = resolvePhotoImageUri(lp);
        } else if (typeof lp === 'string') {
          latestPhoto = normalizeHttpUrl(lp);
        }
        return {
          id,
          name: displayName,
          icon,
          member_count: mc,
          latest_photo: latestPhoto,
        };
      })
      .filter(Boolean);
    return JSON.stringify(list);
  }

  /**
   * Writes group list to Android SharedPreferences so WidgetConfigActivity can show a picker.
   */
  async syncGroupsCatalogToNative(groupsFromApi) {
    if (!this.isAndroid || !WidgetModuleNative?.saveUserGroups) return;
    try {
      const json = this.buildNativeGroupCatalogJson(groupsFromApi);
      await WidgetModuleNative.saveUserGroups(json);
    } catch (e) {
      console.warn('syncGroupsCatalogToNative:', e?.message || e);
    }
  }

  /**
   * Save widget configuration to AsyncStorage.
   * @param {{ groupId: string, displayCount: number, autoRefresh: boolean }} config
   */
  async saveWidgetConfig(config) {
    try {
      await AsyncStorage.setItem(WIDGET_CONFIG_KEY, JSON.stringify(config));
      console.log('✅ Widget config saved:', config);
    } catch (err) {
      console.error('saveWidgetConfig failed:', err);
      throw err;
    }
  }

  /**
   * Load widget configuration from AsyncStorage.
   * @returns {object|null}
   */
  async loadWidgetConfig() {
    try {
      const raw = await AsyncStorage.getItem(WIDGET_CONFIG_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  /**
   * Update widgets when a new photo is posted.
   * @param {string} groupId - Group ID where photo was posted
   * @param {object} photoData - Photo data from backend
   */
  async onPhotoPosted(groupId, photoData) {
    if (!this.isAndroid || !WidgetModuleNative) return;

    try {
      const gid = String(groupId ?? photoData?.groupId ?? '').trim();
      const normalizedUrl = resolvePhotoImageUri(photoData);

      if (!normalizedUrl) {
        console.warn(
          '[WidgetBridge] skip updateAllWidgets: no valid https URL for widget (Cloudinary fields empty or non-remote)',
          { groupId: gid, keys: photoData && typeof photoData === 'object' ? Object.keys(photoData) : [] }
        );
        return;
      }

      const created = photoData?.createdAt != null ? new Date(photoData.createdAt).getTime() : Date.now();
      const uploadedAt = Number.isFinite(created) ? created : Date.now();

      const uploader = photoData?.uploadedBy;
      const rawAvatar =
        uploader?.profilePicture?.url ||
        uploader?.avatar ||
        (typeof uploader?.profilePicture === 'string' ? uploader.profilePicture : null);
      const avatarHttps = rawAvatar ? normalizeHttpUrl(rawAvatar) : null;

      const widgetPhotoData = {
        photoUrl: normalizedUrl,
        uploaderName: uploader?.name || 'Someone',
        uploaderAvatar: avatarHttps,
        uploadedAt,
        groupName: photoData?.group?.name || 'Group',
        groupId: gid,
        caption: photoData?.caption || null,
      };

      console.log('[WidgetBridge] updateAllWidgets photoUrl:', normalizedUrl, 'groupId:', gid);
      await WidgetModuleNative.updateAllWidgets(widgetPhotoData, gid);
      console.log(`📱 Widgets updated for group ${gid}`);
    } catch (error) {
      console.error('Widget update failed:', error);
    }
  }

  /**
   * Get all active widgets from native module.
   * @returns {Array}
   */
  async getActiveWidgets() {
    if (!this.isAndroid || !WidgetModuleNative) return [];
    try {
      return await WidgetModuleNative.getActiveWidgets();
    } catch {
      return [];
    }
  }

  /**
   * Refresh all active home screen widgets.
   */
  async refreshAllWidgets() {
    if (!this.isAndroid || !WidgetModuleNative) return;

    try {
      const widgets = await this.getActiveWidgets();
      for (const widget of widgets) {
        await WidgetModuleNative.refreshWidget(widget.widgetId);
      }
      console.log(`📱 Refreshed ${widgets.length} widget(s)`);
    } catch (error) {
      console.error('Refresh all widgets failed:', error);
    }
  }
}

export default new WidgetService();
