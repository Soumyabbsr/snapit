package com.snapit.widget.bridge

import android.content.Intent
import android.os.SystemClock
import android.util.Log
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
            Log.i("WidgetBridge", "updateWidget widgetId=$widgetId photoUrl=${photoData.photoUrl}")
            
            // Save photo data
            WidgetPreferences.savePhotoData(reactApplicationContext, widgetId, photoData)
            Log.i("WidgetBridge", "savePhotoData called for widgetId=$widgetId url=${photoData.photoUrl}")
            val checkSingle = WidgetPreferences.getPhotoData(reactApplicationContext, widgetId)
            Log.i("WidgetBridge", "verify saved photoData=${checkSingle?.photoUrl}")

            SystemClock.sleep(100)

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
            Log.i("WidgetBridge", "updateAllWidgets groupId=${groupId.trim()} photoUrl=${photoData.photoUrl}")
            val widgets = WidgetPreferences.getAllWidgets(reactApplicationContext)
            
            val targetGid = groupId.trim()
            widgets.forEach { (widgetId, savedGroupId) ->
                if (savedGroupId.trim() == targetGid) {
                    WidgetPreferences.savePhotoData(reactApplicationContext, widgetId, photoData)
                    Log.i("WidgetBridge", "savePhotoData called for widgetId=$widgetId url=${photoData.photoUrl}")
                    val check = WidgetPreferences.getPhotoData(reactApplicationContext, widgetId)
                    Log.i("WidgetBridge", "verify saved photoData=${check?.photoUrl}")

                    SystemClock.sleep(100)

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
            val list = WidgetPreferences.getUserGroups(reactApplicationContext)
            val groups = Arguments.createArray()
            list.forEach { g ->
                val m = Arguments.createMap()
                m.putString("id", g.id)
                m.putString("name", g.name)
                if (g.icon != null) m.putString("icon", g.icon) else m.putNull("icon")
                m.putInt("member_count", g.memberCount)
                if (g.latestPhoto != null) m.putString("latest_photo", g.latestPhoto) else m.putNull("latest_photo")
                groups.pushMap(m)
            }
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
        val uploadedAtMs = safeReadUploadedAt(map)
        return WidgetPhotoData(
            photoUrl = map.getString("photoUrl") ?: "",
            uploaderName = map.getString("uploaderName") ?: "Unknown",
            uploaderAvatar = map.getString("uploaderAvatar"),
            uploadedAt = uploadedAtMs,
            groupName = map.getString("groupName") ?: "",
            groupId = (map.getString("groupId") ?: "").trim(),
            caption = map.getString("caption")
        )
    }

    private fun safeReadUploadedAt(map: ReadableMap): Long {
        return try {
            if (!map.hasKey("uploadedAt") || map.isNull("uploadedAt")) {
                return System.currentTimeMillis()
            }
            val raw = map.getDouble("uploadedAt")
            if (raw.isNaN() || raw.isInfinite()) System.currentTimeMillis() else raw.toLong()
        } catch (_: Exception) {
            System.currentTimeMillis()
        }
    }
}
