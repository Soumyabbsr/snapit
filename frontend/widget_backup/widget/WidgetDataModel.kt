package com.snapit.widget

import com.google.gson.Gson
import com.google.gson.annotations.SerializedName

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
)

enum class WidgetSize {
    SMALL, MEDIUM, LARGE
}

data class WidgetConfig(
    val widgetId: Int,
    val groupId: String,
    val groupName: String,
    val size: WidgetSize
)
