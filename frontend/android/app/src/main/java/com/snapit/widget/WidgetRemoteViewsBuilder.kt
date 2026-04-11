package com.snapit.widget

import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.graphics.BitmapFactory
import android.net.Uri
import android.util.Log
import android.view.View
import android.widget.RemoteViews
import com.snapit.R
import com.snapit.MainActivity
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class WidgetRemoteViewsBuilder(private val context: Context) {
    
    fun buildSmallWidget(widgetId: Int, groupData: GroupData?, photoData: WidgetPhotoData?): RemoteViews {
        val views = RemoteViews(context.packageName, R.layout.widget_small)
        val groupId = groupData?.id ?: ""
        
        if (photoData != null && photoData.photoUrl.isNotEmpty()) {
            loadImage(views, R.id.widget_image, photoData.photoUrl, widgetId)
            views.setTextViewText(R.id.widget_group_name, photoData.groupName)
            views.setViewVisibility(R.id.widget_loading, View.GONE)
        } else if (groupData != null && !groupData.latestPhoto.isNullOrEmpty()) {
            loadImage(views, R.id.widget_image, groupData.latestPhoto, widgetId)
            views.setTextViewText(R.id.widget_group_name, groupData.name)
            views.setViewVisibility(R.id.widget_loading, View.GONE)
        } else if (groupData != null) {
            views.setImageViewResource(R.id.widget_image, R.drawable.ic_widget_placeholder)
            views.setTextViewText(R.id.widget_group_name, groupData.name)
            views.setViewVisibility(R.id.widget_loading, View.GONE)
        } else {
            views.setImageViewResource(R.id.widget_image, R.drawable.ic_widget_placeholder)
            views.setTextViewText(R.id.widget_group_name, "Add widget")
            views.setViewVisibility(R.id.widget_loading, View.GONE)
        }
        
        setClickIntent(views, groupId)
        return views
    }
    
    fun buildMediumWidget(widgetId: Int, groupData: GroupData?, photoData: WidgetPhotoData?): RemoteViews {
        val views = RemoteViews(context.packageName, R.layout.widget_medium)
        val groupId = groupData?.id ?: ""
        
        if (photoData != null && photoData.photoUrl.isNotEmpty()) {
            loadImage(views, R.id.widget_image, photoData.photoUrl, widgetId)
            views.setTextViewText(R.id.widget_group_name, photoData.groupName)
            views.setTextViewText(R.id.widget_uploader_name, photoData.uploaderName)
            views.setTextViewText(R.id.widget_time_ago, TimeFormatter.getTimeAgo(photoData.uploadedAt))
            views.setViewVisibility(R.id.widget_loading, View.GONE)
        } else if (groupData != null && !groupData.latestPhoto.isNullOrEmpty()) {
            loadImage(views, R.id.widget_image, groupData.latestPhoto, widgetId)
            views.setTextViewText(R.id.widget_group_name, groupData.name)
            views.setTextViewText(R.id.widget_uploader_name, "${groupData.memberCount} members")
            views.setTextViewText(R.id.widget_time_ago, "")
            views.setViewVisibility(R.id.widget_loading, View.GONE)
        } else if (groupData != null) {
            views.setImageViewResource(R.id.widget_image, R.drawable.ic_widget_placeholder)
            views.setTextViewText(R.id.widget_group_name, groupData.name)
            views.setTextViewText(R.id.widget_uploader_name, "${groupData.memberCount} members")
            views.setTextViewText(R.id.widget_time_ago, "")
            views.setViewVisibility(R.id.widget_loading, View.GONE)
        } else {
            views.setImageViewResource(R.id.widget_image, R.drawable.ic_widget_placeholder)
            views.setTextViewText(R.id.widget_group_name, "Add widget")
            views.setViewVisibility(R.id.widget_loading, View.GONE)
        }
        
        setClickIntent(views, groupId)
        return views
    }
    
    fun buildLargeWidget(widgetId: Int, groupData: GroupData?, photoData: WidgetPhotoData?): RemoteViews {
        val views = RemoteViews(context.packageName, R.layout.widget_large)
        val groupId = groupData?.id ?: ""
        
        if (photoData != null && photoData.photoUrl.isNotEmpty()) {
            loadImage(views, R.id.widget_image, photoData.photoUrl, widgetId)
            views.setTextViewText(R.id.widget_group_name, photoData.groupName)
            views.setTextViewText(R.id.widget_uploader_name, photoData.uploaderName)
            views.setTextViewText(R.id.widget_time_ago, TimeFormatter.getTimeAgo(photoData.uploadedAt))
            
            if (!photoData.uploaderAvatar.isNullOrEmpty()) {
                loadImage(views, R.id.widget_uploader_avatar, photoData.uploaderAvatar, widgetId)
            }
            
            views.setViewVisibility(R.id.widget_loading, View.GONE)
        } else if (groupData != null && !groupData.latestPhoto.isNullOrEmpty()) {
            loadImage(views, R.id.widget_image, groupData.latestPhoto, widgetId)
            views.setTextViewText(R.id.widget_group_name, groupData.name)
            views.setTextViewText(R.id.widget_uploader_name, "${groupData.memberCount} members")
            views.setTextViewText(R.id.widget_time_ago, "")
            views.setImageViewResource(R.id.widget_uploader_avatar, R.mipmap.ic_launcher)
            views.setViewVisibility(R.id.widget_loading, View.GONE)
        } else if (groupData != null) {
            views.setImageViewResource(R.id.widget_image, R.drawable.ic_widget_placeholder)
            views.setTextViewText(R.id.widget_group_name, groupData.name)
            views.setTextViewText(R.id.widget_uploader_name, "${groupData.memberCount} members")
            views.setTextViewText(R.id.widget_time_ago, "")
            views.setImageViewResource(R.id.widget_uploader_avatar, R.mipmap.ic_launcher)
            views.setViewVisibility(R.id.widget_loading, View.GONE)
        } else {
            views.setImageViewResource(R.id.widget_image, R.drawable.ic_widget_placeholder)
            views.setTextViewText(R.id.widget_group_name, "Add widget")
            views.setViewVisibility(R.id.widget_loading, View.GONE)
        }
        
        setClickIntent(views, groupId)
        return views
    }
    
    private fun loadImage(views: RemoteViews, imageViewId: Int, url: String, widgetId: Int) {
        val cachedFile = ImageCacheManager(context).getCachedImage(widgetId)
        
        if (cachedFile?.exists() == true) {
            val bitmap = BitmapFactory.decodeFile(cachedFile.absolutePath)
            if (bitmap != null) {
                views.setImageViewBitmap(imageViewId, bitmap)
                return
            }
        }
        
        views.setImageViewResource(imageViewId, R.drawable.ic_widget_placeholder)
        downloadImageAsync(url, widgetId)
    }
    
    private fun downloadImageAsync(url: String, widgetId: Int) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                ImageCacheManager(context).downloadAndCacheImage(url, widgetId)
                withContext(Dispatchers.Main) {
                    val intent = Intent(context, PhotoWidgetProvider::class.java)
                    intent.action = PhotoWidgetProvider.ACTION_WIDGET_UPDATE
                    intent.putExtra(PhotoWidgetProvider.EXTRA_WIDGET_ID, widgetId)
                    context.sendBroadcast(intent)
                }
            } catch (e: Exception) {
                Log.e("WidgetRemoteViews", "Image download failed", e)
            }
        }
    }
    
    private fun setClickIntent(views: RemoteViews, groupId: String) {
        if (groupId.isEmpty()) {
            return
        }
        
        val intent = Intent(context, MainActivity::class.java)
        intent.action = Intent.ACTION_VIEW
        intent.data = Uri.parse("snapit://group/$groupId")
        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        
        val pendingIntent = PendingIntent.getActivity(
            context,
            groupId.hashCode(),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        
        views.setOnClickPendingIntent(R.id.widget_root, pendingIntent)
    }
}
