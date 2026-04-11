import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
      const widgetPhotoData = {
        photoUrl: photoData.imageUrl,
        uploaderName: photoData.uploadedBy?.name || 'Someone',
        uploaderAvatar: photoData.uploadedBy?.profilePicture?.url || null,
        uploadedAt: new Date(photoData.createdAt).getTime(),
        groupName: photoData.group?.name || 'Group',
        groupId: groupId,
        caption: photoData.caption || null,
      };

      await WidgetModuleNative.updateAllWidgets(widgetPhotoData, groupId);
      console.log(`📱 Widgets updated for group ${groupId}`);
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
