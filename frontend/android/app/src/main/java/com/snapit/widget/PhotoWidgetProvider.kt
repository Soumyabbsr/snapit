package com.snapit.widget

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.View
import android.widget.RemoteViews
import com.snapit.R

class PhotoWidgetProvider : AppWidgetProvider() {

    companion object {
        private val widgetOptionsDebounceHandler = Handler(Looper.getMainLooper())
        private val pendingAppWidgetOptionUpdates = mutableMapOf<Int, Runnable>()

        const val ACTION_WIDGET_UPDATE = "com.snapit.WIDGET_UPDATE"
        const val ACTION_WIDGET_REFRESH = "com.snapit.WIDGET_REFRESH"
        const val ACTION_WIDGET_IMAGE_LOAD_FAILED = "com.snapit.WIDGET_IMAGE_LOAD_FAILED"
        const val ACTION_WIDGET_CLICK = "com.snapit.WIDGET_CLICK"
        const val EXTRA_WIDGET_ID = "widget_id"
        const val EXTRA_GROUP_ID = "group_id"
        const val EXTRA_PHOTO_DATA = "photo_data"
    }

    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        for (widgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, widgetId)
        }
    }

    override fun onAppWidgetOptionsChanged(context: Context, appWidgetManager: AppWidgetManager, appWidgetId: Int, newOptions: Bundle?) {
        super.onAppWidgetOptionsChanged(context, appWidgetManager, appWidgetId, newOptions)
        pendingAppWidgetOptionUpdates[appWidgetId]?.let { widgetOptionsDebounceHandler.removeCallbacks(it) }
        val runnable = Runnable { updateAppWidget(context, appWidgetManager, appWidgetId) }
        pendingAppWidgetOptionUpdates[appWidgetId] = runnable
        widgetOptionsDebounceHandler.postDelayed(runnable, 500)
    }

    override fun onDeleted(context: Context, appWidgetIds: IntArray) {
        for (widgetId in appWidgetIds) {
            pendingAppWidgetOptionUpdates[widgetId]?.let { widgetOptionsDebounceHandler.removeCallbacks(it) }
            pendingAppWidgetOptionUpdates.remove(widgetId)
            WidgetPreferences.removeWidget(context, widgetId)
            ImageCacheManager(context).clearCache(widgetId)
        }
    }

    override fun onEnabled(context: Context) {
        WidgetUpdateWorker.schedulePeriodicUpdate(context)
    }

    override fun onDisabled(context: Context) {
        WidgetUpdateWorker.cancelPeriodicUpdate(context)
        WidgetPreferences.clearAll(context)
    }

    override fun onReceive(context: Context, intent: Intent) {
        Log.i("WidgetDiag", "=== onReceive action=${intent.action} extras=${intent.extras?.keySet()?.joinToString()}")
        super.onReceive(context, intent)
        Log.i("PhotoWidgetProvider", "onReceive action=${intent.action}")
        val appWidgetManager = AppWidgetManager.getInstance(context)

        when (intent.action) {
            ACTION_WIDGET_UPDATE -> {
                val widgetId = intent.getIntExtra(EXTRA_WIDGET_ID, AppWidgetManager.INVALID_APPWIDGET_ID)
                if (widgetId != AppWidgetManager.INVALID_APPWIDGET_ID) {
                    val photoDataJson = intent.getStringExtra(EXTRA_PHOTO_DATA)
                    if (photoDataJson != null) {
                        WidgetPhotoData.fromJson(photoDataJson)?.let {
                            WidgetPreferences.savePhotoData(context, widgetId, it)
                        }
                    }
                    updateAppWidget(context, appWidgetManager, widgetId)
                }
            }
            ACTION_WIDGET_REFRESH -> {
                val widgetId = intent.getIntExtra(EXTRA_WIDGET_ID, AppWidgetManager.INVALID_APPWIDGET_ID)
                if (widgetId != AppWidgetManager.INVALID_APPWIDGET_ID) {
                    refreshWidget(context, appWidgetManager, widgetId)
                } else {
                    refreshAllWidgets(context, appWidgetManager)
                }
            }
            ACTION_WIDGET_IMAGE_LOAD_FAILED -> {
                val widgetId = intent.getIntExtra(EXTRA_WIDGET_ID, AppWidgetManager.INVALID_APPWIDGET_ID)
                if (widgetId != AppWidgetManager.INVALID_APPWIDGET_ID) {
                    val photoData = WidgetPreferences.getPhotoData(context, widgetId)
                    val groupId = WidgetPreferences.getWidgetGroup(context, widgetId)
                    val latestFromGroup = groupId?.let { gid ->
                        WidgetPreferences.getUserGroups(context).find { it.id == gid }?.latestPhoto
                    }
                    val cache = ImageCacheManager(context)
                    val hasCachedImage = sequence {
                        photoData?.photoUrl?.takeIf { it.isNotBlank() }?.let { yield(it) }
                        latestFromGroup?.takeIf { it.isNotBlank() }?.let { yield(it) }
                    }.distinct().any { u ->
                        cache.getCachedImage(widgetId, u)?.exists() == true
                    }
                    if (hasCachedImage) {
                        Log.i(
                            "PhotoWidgetProvider",
                            "Ignoring LOAD_FAILED — cached image exists for widgetId=$widgetId"
                        )
                        return
                    }
                    runCatching {
                        WidgetRemoteViewsBuilder(context).pushImageLoadFailed(widgetId)
                    }.onFailure { Log.e("PhotoWidgetProvider", "pushImageLoadFailed", it) }
                }
            }
        }
    }

    private fun updateAppWidget(context: Context, appWidgetManager: AppWidgetManager, widgetId: Int) {
        val groupId = WidgetPreferences.getWidgetGroup(context, widgetId) ?: return
        val photoData = WidgetPreferences.getPhotoData(context, widgetId)
        val groupData = findGroupById(context, groupId)
        val size = getWidgetSize(context, appWidgetManager, widgetId)
        val callerFrame = Thread.currentThread().stackTrace.getOrNull(3)?.toString() ?: "unknown"
        Log.i(
            "WidgetFinal",
            "=== updateAppWidget CALLED widgetId=$widgetId size=$size photoData=${photoData?.photoUrl?.takeLast(20)} - called from $callerFrame"
        )
        Log.i("WidgetDiag", "=== updateAppWidget widgetId=$widgetId groupId=$groupId photoData=${photoData?.photoUrl}")

        if (photoData == null && groupData?.latestPhoto.isNullOrEmpty()) {
            val layoutRes = when (size) {
                WidgetSize.SMALL -> R.layout.widget_small
                WidgetSize.MEDIUM -> R.layout.widget_medium
                WidgetSize.LARGE -> R.layout.widget_large
            }
            val views = RemoteViews(context.packageName, layoutRes)
            val builder = WidgetRemoteViewsBuilder(context)
            builder.getVectorBitmap(R.drawable.ic_widget_placeholder)?.let { views.setImageViewBitmap(R.id.widget_image, it) }
            views.setTextViewText(R.id.widget_group_name, groupData?.name ?: "SnapIt")
            views.setViewVisibility(R.id.widget_loading, View.GONE)
            if (size == WidgetSize.MEDIUM || size == WidgetSize.LARGE) {
                views.setTextViewText(R.id.widget_uploader_name, "")
                views.setTextViewText(R.id.widget_time_ago, "")
            }
            if (size == WidgetSize.LARGE) {
                builder.getVectorBitmap(R.mipmap.ic_launcher)?.let { views.setImageViewBitmap(R.id.widget_uploader_avatar, it) }
            }
            builder.attachRootClickToViews(views, groupId)
            appWidgetManager.updateAppWidget(widgetId, views)
            Log.i("WidgetDiag", "=== appWidgetManager.updateAppWidget DONE for widgetId=$widgetId (placeholder, no photo)")
            return
        }

        try {
            val builder = WidgetRemoteViewsBuilder(context)
            val views = when (size) {
                WidgetSize.SMALL -> builder.buildSmallWidget(widgetId, groupData, photoData)
                WidgetSize.MEDIUM -> builder.buildMediumWidget(widgetId, groupData, photoData)
                WidgetSize.LARGE -> builder.buildLargeWidget(widgetId, groupData, photoData)
            }
            appWidgetManager.updateAppWidget(widgetId, views)
            Log.i("WidgetDiag", "=== appWidgetManager.updateAppWidget DONE for widgetId=$widgetId")
            Log.i("PhotoWidgetProvider", "updateAppWidget ok widgetId=$widgetId size=$size")
        } catch (e: Exception) {
            Log.e("PhotoWidgetProvider", "updateAppWidget failed widgetId=$widgetId", e)
        }
    }
    
    private fun findGroupById(context: Context, groupId: String): GroupData? {
        val groups = WidgetPreferences.getUserGroups(context)
        return groups.find { it.id == groupId }
    }

    private fun refreshWidget(context: Context, appWidgetManager: AppWidgetManager, widgetId: Int) {
        updateAppWidget(context, appWidgetManager, widgetId)
    }

    private fun refreshAllWidgets(context: Context, appWidgetManager: AppWidgetManager) {
        val component = ComponentName(context, PhotoWidgetProvider::class.java)
        val appWidgetIds = appWidgetManager.getAppWidgetIds(component)
        for (widgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, widgetId)
        }
    }

    private fun getWidgetSize(context: Context, appWidgetManager: AppWidgetManager, widgetId: Int): WidgetSize {
        val options = appWidgetManager.getAppWidgetOptions(widgetId)
        val minWidth = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH)
        val minHeight = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT)

        val result = when {
            minHeight >= 200 && minWidth >= 200 -> WidgetSize.LARGE
            minWidth >= 200 && minHeight < 200 -> WidgetSize.MEDIUM
            else -> WidgetSize.SMALL
        }
        Log.i(
            "WidgetFinal",
            "=== getWidgetSize widgetId=$widgetId minWidth=$minWidth minHeight=$minHeight result=$result"
        )
        return result
    }
}
