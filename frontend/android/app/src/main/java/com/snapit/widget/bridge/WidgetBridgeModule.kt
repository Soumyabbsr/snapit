package com.snapit.widget.bridge

import android.content.Intent
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.google.gson.Gson
import com.snapit.widget.ImageCacheManager
import com.snapit.widget.PhotoWidgetProvider
import com.snapit.widget.WidgetPhotoData
import com.snapit.widget.WidgetPreferences

class WidgetBridgeModule(reactContext: ReactApplicationContext) : 
    ReactContextBaseJavaModule(reactContext) {
    
    override fun getName() = "WidgetBridge"
    
    @ReactMethod
    fun updateWidget(widgetId: Int, photoDataJson: ReadableMap, promise: Promise) {
        try {
            val photoData = parsePhotoData(photoDataJson)
            
            // Save photo data
            WidgetPreferences.savePhotoData(reactApplicationContext, widgetId, photoData)
            
            // Trigger widget update
            val intent = Intent(reactApplicationContext, PhotoWidgetProvider::class.java)
            intent.action = PhotoWidgetProvider.ACTION_WIDGET_UPDATE
            intent.putExtra(PhotoWidgetProvider.EXTRA_WIDGET_ID, widgetId)
            intent.putExtra(PhotoWidgetProvider.EXTRA_PHOTO_DATA, Gson().toJson(photoData))
            reactApplicationContext.sendBroadcast(intent)
            
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("UPDATE_ERROR", e.message, e)
        }
    }
    
    @ReactMethod
    fun updateAllWidgets(photoDataJson: ReadableMap, groupId: String, promise: Promise) {
        try {
            val photoData = parsePhotoData(photoDataJson)
            val widgets = WidgetPreferences.getAllWidgets(reactApplicationContext)
            
            widgets.forEach { (widgetId, savedGroupId) ->
                if (savedGroupId == groupId) {
                    WidgetPreferences.savePhotoData(reactApplicationContext, widgetId, photoData)
                    
                    val intent = Intent(reactApplicationContext, PhotoWidgetProvider::class.java)
                    intent.action = PhotoWidgetProvider.ACTION_WIDGET_UPDATE
                    intent.putExtra(PhotoWidgetProvider.EXTRA_WIDGET_ID, widgetId)
                    intent.putExtra(PhotoWidgetProvider.EXTRA_PHOTO_DATA, Gson().toJson(photoData))
                    reactApplicationContext.sendBroadcast(intent)
                }
            }
            
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("UPDATE_ALL_ERROR", e.message, e)
        }
    }
    
    @ReactMethod
    fun getActiveWidgets(promise: Promise) {
        try {
            val widgets = WidgetPreferences.getAllWidgets(reactApplicationContext)
            val result = Arguments.createArray()
            
            widgets.forEach { (widgetId, groupId) ->
                val map = Arguments.createMap()
                map.putInt("widgetId", widgetId)
                map.putString("groupId", groupId)
                result.pushMap(map)
            }
            
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("GET_WIDGETS_ERROR", e.message, e)
        }
    }
    
    @ReactMethod
    fun refreshWidget(widgetId: Int, promise: Promise) {
        try {
            val intent = Intent(reactApplicationContext, PhotoWidgetProvider::class.java)
            intent.action = PhotoWidgetProvider.ACTION_WIDGET_REFRESH
            intent.putExtra(PhotoWidgetProvider.EXTRA_WIDGET_ID, widgetId)
            reactApplicationContext.sendBroadcast(intent)
            
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("REFRESH_ERROR", e.message, e)
        }
    }
    
    @ReactMethod
    fun removeWidget(widgetId: Int, promise: Promise) {
        try {
            WidgetPreferences.removeWidget(reactApplicationContext, widgetId)
            ImageCacheManager(reactApplicationContext).clearCache(widgetId)
            
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("REMOVE_ERROR", e.message, e)
        }
    }
    
    @ReactMethod
    fun getUserGroups(promise: Promise) {
        try {
            val groups = Arguments.createArray()
            // Placeholder: React Native will supply actual groups for config screen
            promise.resolve(groups)
        } catch (e: Exception) {
            promise.reject("GET_GROUPS_ERROR", e.message, e)
        }
    }
    
    @ReactMethod
    fun saveUserGroups(groupsJson: String, promise: Promise) {
        try {
            WidgetPreferences.saveUserGroups(reactApplicationContext, groupsJson)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("SAVE_GROUPS_ERROR", e.message, e)
        }
    }
    
    private fun parsePhotoData(map: ReadableMap): WidgetPhotoData {
        return WidgetPhotoData(
            photoUrl = map.getString("photoUrl") ?: "",
            uploaderName = map.getString("uploaderName") ?: "Unknown",
            uploaderAvatar = map.getString("uploaderAvatar"),
            uploadedAt = map.getDouble("uploadedAt").toLong(),
            groupName = map.getString("groupName") ?: "",
            groupId = map.getString("groupId") ?: "",
            caption = map.getString("caption")
        )
    }
}
