package com.snapit.widget

import com.google.gson.Gson
import com.google.gson.GsonBuilder
import com.google.gson.annotations.SerializedName
import com.google.gson.reflect.TypeToken

data class WidgetPhotoData(
    @SerializedName(value = "photo_url", alternate = ["photoUrl"])
    val photoUrl: String,

    @SerializedName(value = "uploader_name", alternate = ["uploaderName"])
    val uploaderName: String,

    @SerializedName(value = "uploader_avatar", alternate = ["uploaderAvatar"])
    val uploaderAvatar: String?,

    @SerializedName(value = "uploaded_at", alternate = ["uploadedAt"])
    val uploadedAt: Long, // Unix timestamp in milliseconds

    @SerializedName(value = "group_name", alternate = ["groupName"])
    val groupName: String,

    @SerializedName(value = "group_id", alternate = ["groupId"])
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
