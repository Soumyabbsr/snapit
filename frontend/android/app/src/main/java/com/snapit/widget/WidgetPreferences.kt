package com.snapit.widget

import android.content.Context
import android.content.SharedPreferences

object WidgetPreferences {
    private const val PREFS_NAME = "WidgetPreferences"
    private const val KEY_WIDGET_GROUP = "widget_group_"
    private const val KEY_PHOTO_DATA = "photo_data_"
    private const val KEY_LAST_UPDATE = "last_update_"
    private const val KEY_USER_GROUPS = "user_groups"
    
    private fun getPrefs(context: Context): SharedPreferences {
        return context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    }

    fun saveUserGroups(context: Context, groupsJson: String) {
        getPrefs(context).edit().putString(KEY_USER_GROUPS, groupsJson).apply()
    }

    fun getUserGroups(context: Context): List<GroupData> {
        val json = getPrefs(context).getString(KEY_USER_GROUPS, null) ?: return emptyList()
        return try {
            GroupData.fromJsonList(json)
        } catch (e: Exception) {
            emptyList()
        }
    }
    
    fun getGroupById(context: Context, groupId: String): GroupData? {
        return getUserGroups(context).find { it.id == groupId }
    }

    // Save which group is assigned to which widget
    fun saveWidgetGroup(context: Context, widgetId: Int, groupId: String) {
        getPrefs(context).edit().putString(KEY_WIDGET_GROUP + widgetId, groupId).apply()
    }
    
    // Get group ID for widget
    fun getWidgetGroup(context: Context, widgetId: Int): String? {
        return getPrefs(context).getString(KEY_WIDGET_GROUP + widgetId, null)
    }
    
    // Remove widget configuration
    fun removeWidget(context: Context, widgetId: Int) {
        getPrefs(context).edit()
            .remove(KEY_WIDGET_GROUP + widgetId)
            .remove(KEY_PHOTO_DATA + widgetId)
            .remove(KEY_LAST_UPDATE + widgetId)
            .apply()
    }
    
    // Get all active widgets with their groups
    fun getAllWidgets(context: Context): Map<Int, String> {
        val prefs = getPrefs(context)
        val allEntries = prefs.all
        val widgets = mutableMapOf<Int, String>()
        
        for ((key, value) in allEntries) {
            if (key.startsWith(KEY_WIDGET_GROUP) && value is String) {
                try {
                    val widgetId = key.substring(KEY_WIDGET_GROUP.length).toInt()
                    widgets[widgetId] = value
                } catch (e: NumberFormatException) {
                    // Ignore malformed keys
                }
            }
        }
        return widgets
    }
    
    // Save photo data for widget (for caching)
    fun savePhotoData(context: Context, widgetId: Int, photoData: WidgetPhotoData) {
        getPrefs(context).edit().putString(KEY_PHOTO_DATA + widgetId, photoData.toJson()).commit()
    }
    
    // Get cached photo data
    fun getPhotoData(context: Context, widgetId: Int): WidgetPhotoData? {
        val json = getPrefs(context).getString(KEY_PHOTO_DATA + widgetId, null)
        return json?.let { WidgetPhotoData.fromJson(it) }
    }
    
    // Save last update timestamp
    fun saveLastUpdate(context: Context, widgetId: Int, timestamp: Long) {
        getPrefs(context).edit().putLong(KEY_LAST_UPDATE + widgetId, timestamp).apply()
    }
    
    // Get last update timestamp
    fun getLastUpdate(context: Context, widgetId: Int): Long {
        return getPrefs(context).getLong(KEY_LAST_UPDATE + widgetId, 0L)
    }
    
    // Clear all preferences
    fun clearAll(context: Context) {
        getPrefs(context).edit().clear().apply()
    }
}
