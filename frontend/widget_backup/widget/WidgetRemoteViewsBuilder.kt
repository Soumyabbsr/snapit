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
import com.snapit.app.MainActivity
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class WidgetRemoteViewsBuilder(private val context: Context) {
    
    fun buildSmallWidget(widgetId: Int, photoData: WidgetPhotoData?): RemoteViews {
        val views = RemoteViews(context.packageName, R.layout.widget_small)
        
        if (photoData != null) {
            loadImage(views, R.id.widget_image, photoData.photoUrl, widgetId)
            views.setTextViewText(R.id.widget_group_name, photoData.groupName)
            views.setViewVisibility(R.id.widget_loading, View.GONE)
        } else {
            views.setImageViewResource(R.id.widget_image, R.drawable.ic_widget_placeholder)
            views.setTextViewText(R.id.widget_group_name, "No photo yet")
            views.setViewVisibility(R.id.widget_loading, View.GONE)
        }
        
        setClickIntent(views, photoData?.groupId ?: "")
        return views
    }
    
    fun buildMediumWidget(widgetId: Int, photoData: WidgetPhotoData?): RemoteViews {
        val views = RemoteViews(context.packageName, R.layout.widget_medium)
        
        if (photoData != null) {
            loadImage(views, R.id.widget_image, photoData.photoUrl, widgetId)
            views.setTextViewText(R.id.widget_group_name, photoData.groupName)
            views.setTextViewText(R.id.widget_uploader_name, photoData.uploaderName)
            views.setTextViewText(R.id.widget_time_ago, 
                TimeFormatter.getTimeAgo(photoData.uploadedAt))
            views.setViewVisibility(R.id.widget_loading, View.GONE)
        } else {
            views.setImageViewResource(R.id.widget_image, R.drawable.ic_widget_placeholder)
            views.setTextViewText(R.id.widget_group_name, "No photo yet")
            views.setViewVisibility(R.id.widget_loading, View.GONE)
        }
        
        setClickIntent(views, photoData?.groupId ?: "")
        return views
    }
    
    fun buildLargeWidget(widgetId: Int, photoData: WidgetPhotoData?): RemoteViews {
        val views = RemoteViews(context.packageName, R.layout.widget_large)
        
        if (photoData != null) {
            loadImage(views, R.id.widget_image, photoData.photoUrl, widgetId)
            views.setTextViewText(R.id.widget_group_name, photoData.groupName)
            views.setTextViewText(R.id.widget_uploader_name, photoData.uploaderName)
            views.setTextViewText(R.id.widget_time_ago, 
                TimeFormatter.getTimeAgo(photoData.uploadedAt))
            
            if (!photoData.uploaderAvatar.isNullOrEmpty()) {
                loadImage(views, R.id.widget_uploader_avatar, 
                    photoData.uploaderAvatar, widgetId)
            }
            
            views.setViewVisibility(R.id.widget_loading, View.GONE)
        } else {
            views.setImageViewResource(R.id.widget_image, R.drawable.ic_widget_placeholder)
            views.setTextViewText(R.id.widget_group_name, "No photo available")
            views.setViewVisibility(R.id.widget_loading, View.GONE)
        }
        
        setClickIntent(views, photoData?.groupId ?: "")
        return views
    }
    
    fun buildLoadingState(size: WidgetSize): RemoteViews {
        val layoutId = when (size) {
            WidgetSize.SMALL -> R.layout.widget_small
            WidgetSize.MEDIUM -> R.layout.widget_medium
            WidgetSize.LARGE -> R.layout.widget_large
        }
        
        val views = RemoteViews(context.packageName, layoutId)
        views.setViewVisibility(R.id.widget_loading, View.VISIBLE)
        return views
    }
    
    fun buildErrorState(size: WidgetSize, error: String): RemoteViews {
        val layoutId = when (size) {
            WidgetSize.SMALL -> R.layout.widget_small
            WidgetSize.MEDIUM -> R.layout.widget_medium
            WidgetSize.LARGE -> R.layout.widget_large
        }
        
        val views = RemoteViews(context.packageName, layoutId)
        views.setImageViewResource(R.id.widget_image, R.drawable.ic_widget_error)
        views.setTextViewText(R.id.widget_group_name, error)
        views.setViewVisibility(R.id.widget_loading, View.GONE)
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
