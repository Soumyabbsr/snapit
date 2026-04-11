package com.snapit.widget

import com.google.gson.Gson
import com.google.gson.GsonBuilder
import com.google.gson.annotations.SerializedName
import com.google.gson.reflect.TypeToken

data class WidgetPhotoData(
    @SerializedName("photo_url")
    val photoUrl: String,
    
    @SerializedName("uploader_name")
    val uploaderName: String,
    
    @SerializedName("uploader_avatar")
    val uploaderAvatar: String?,
    
    @SerializedName("uploaded_at")
    val uploadedAt: Long, // Unix timestamp in milliseconds
    
    @SerializedName("group_name")
    val groupName: String,
    
    @SerializedName("group_id")
    val groupId: String,
    
    @SerializedName("caption")
    val caption: String? = null
) {
    fun toJson(): String = Gson().toJson(this)
    
    companion object {
        fun fromJson(json: String): WidgetPhotoData? {
            return try {
                Gson().fromJson(json, WidgetPhotoData::class.java)
            } catch (e: Exception) {
                null
            }
        }
    }
}

data class GroupData(
    @SerializedName("id")
    val id: String,
    
    @SerializedName("name")
    val name: String,
    
    @SerializedName("icon")
    val icon: String?,
    
    @SerializedName("member_count")
    val memberCount: Int,
    
    @SerializedName("latest_photo")
    val latestPhoto: String? = null
) {
    fun toJson(): String = Gson().toJson(this)
    
    companion object {
        fun fromJsonList(json: String): List<GroupData> {
            val type = object : TypeToken<List<GroupData>>() {}.type
            return Gson().fromJson(json, type) ?: emptyList()
        }
    }
}

enum class WidgetSize {
    SMALL, MEDIUM, LARGE
}

data class WidgetConfig(
    val widgetId: Int,
    val groupId: String,
    val groupName: String,
    val size: WidgetSize
)
