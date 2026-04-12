import { NativeModules } from 'react-native';

const { WidgetBridge } = NativeModules;

if (!WidgetBridge) {
  console.warn('WidgetBridge native module not found');
}

export const WidgetModule = {
  /**
   * Update a specific widget with photo data
   */
  updateWidget: async (widgetId, photoData) => {
    if (!WidgetBridge) return false;
    try {
      return await WidgetBridge.updateWidget(widgetId, photoData);
    } catch (error) {
      console.error('Update widget failed:', error);
      throw error;
    }
  },

  /**
   * Update all widgets for a specific group
   */
  updateAllWidgets: async (photoData, groupId) => {
    if (!WidgetBridge) return false;
    try {
      return await WidgetBridge.updateAllWidgets(photoData, groupId);
    } catch (error) {
      console.error('Update all widgets failed:', error);
      throw error;
    }
  },

  /**
   * Get all active widgets
   */
  getActiveWidgets: async () => {
    if (!WidgetBridge) return [];
    try {
      return await WidgetBridge.getActiveWidgets();
    } catch (error) {
      console.error('Get active widgets failed:', error);
      return [];
    }
  },

  /**
   * Refresh a specific widget
   */
  refreshWidget: async (widgetId) => {
    if (!WidgetBridge) return false;
    try {
      return await WidgetBridge.refreshWidget(widgetId);
    } catch (error) {
      console.error('Refresh widget failed:', error);
      throw error;
    }
  },

  /**
   * Remove widget data
   */
  removeWidget: async (widgetId) => {
    if (!WidgetBridge) return false;
    try {
      return await WidgetBridge.removeWidget(widgetId);
    } catch (error) {
      console.error('Remove widget failed:', error);
      throw error;
    }
  },

  /**
   * Get user's groups for widget configuration (legacy; native list uses prefs from saveUserGroups).
   */
  getUserGroups: async () => {
    if (!WidgetBridge) return [];
    try {
      return await WidgetBridge.getUserGroups();
    } catch (error) {
      console.error('Get user groups failed:', error);
      return [];
    }
  },

  /**
   * Persist group catalog for Android widget configuration (WidgetPreferences / WidgetConfigActivity).
   * @param {string} groupsJson JSON array matching native GroupData: id, name, icon, member_count
   */
  saveUserGroups: async (groupsJson) => {
    if (!WidgetBridge?.saveUserGroups) return false;
    try {
      await WidgetBridge.saveUserGroups(groupsJson);
      return true;
    } catch (error) {
      console.error('saveUserGroups failed:', error);
      throw error;
    }
  },
};

export default WidgetModule;
