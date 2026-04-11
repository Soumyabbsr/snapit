package com.snapit.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.util.Log

class PhotoWidgetProvider : AppWidgetProvider() {

    companion object {
        const val ACTION_WIDGET_UPDATE = "com.snapit.WIDGET_UPDATE"
        const val ACTION_WIDGET_REFRESH = "com.snapit.WIDGET_REFRESH"
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
        updateAppWidget(context, appWidgetManager, appWidgetId)
    }

    override fun onDeleted(context: Context, appWidgetIds: IntArray) {
        for (widgetId in appWidgetIds) {
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
        super.onReceive(context, intent)
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
        }
    }

    private fun updateAppWidget(context: Context, appWidgetManager: AppWidgetManager, widgetId: Int) {
        val groupId = WidgetPreferences.getWidgetGroup(context, widgetId)
        if (groupId == null) {
            return
        }

        val groupData = findGroupById(context, groupId)
        val photoData = WidgetPreferences.getPhotoData(context, widgetId)
        val size = getWidgetSize(context, appWidgetManager, widgetId)
        
        val builder = WidgetRemoteViewsBuilder(context)
        val views = when (size) {
            WidgetSize.SMALL -> builder.buildSmallWidget(widgetId, groupData, photoData)
            WidgetSize.MEDIUM -> builder.buildMediumWidget(widgetId, groupData, photoData)
            WidgetSize.LARGE -> builder.buildLargeWidget(widgetId, groupData, photoData)
        }

        appWidgetManager.updateAppWidget(widgetId, views)
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

        return when {
            minHeight >= 200 && minWidth >= 200 -> WidgetSize.LARGE
            minWidth >= 200 && minHeight < 200 -> WidgetSize.MEDIUM
            else -> WidgetSize.SMALL
        }
    }
}
