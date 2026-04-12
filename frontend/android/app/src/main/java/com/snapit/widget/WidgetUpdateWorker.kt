package com.snapit.widget

import android.appwidget.AppWidgetManager
import android.content.Context
import androidx.work.Constraints
import androidx.work.CoroutineWorker
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.NetworkType
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import android.content.Intent
import android.util.Log
import com.google.gson.Gson
import java.util.concurrent.TimeUnit

class WidgetUpdateWorker(context: Context, params: WorkerParameters) : 
    CoroutineWorker(context, params) {
    
    override suspend fun doWork(): Result {
        Log.i("WidgetFinal", "=== WidgetUpdateWorker RUNNING - this may overwrite widget")
        return try {
            val ctx = applicationContext
            val widgets = WidgetPreferences.getAllWidgets(ctx)
            Log.d(
                "WidgetRefreshWorker",
                "prefs path: ${ctx.applicationInfo.dataDir}, widgets found: ${widgets.size}"
            )

            if (widgets.isEmpty()) {
                return Result.success()
            }

            widgets.forEach { (widgetId, groupId) ->
                updateWidgetPhoto(widgetId, groupId)
            }

            Result.success()
        } catch (e: Exception) {
            Log.e("WidgetUpdateWorker", "Update failed", e)
            Result.retry()
        }
    }

    private suspend fun updateWidgetPhoto(widgetId: Int, groupId: String) {
        val photoData = fetchLatestPhoto(widgetId, groupId) ?: return

        if (photoData.photoUrl.isNotBlank()) {
            runCatching {
                ImageCacheManager(applicationContext).downloadAndCacheImage(photoData.photoUrl, widgetId)
            }
        }

        WidgetPreferences.savePhotoData(applicationContext, widgetId, photoData)
        WidgetPreferences.saveLastUpdate(applicationContext, widgetId, System.currentTimeMillis())

        val intent = Intent(applicationContext, PhotoWidgetProvider::class.java).apply {
            action = PhotoWidgetProvider.ACTION_WIDGET_UPDATE
            putExtra(PhotoWidgetProvider.EXTRA_WIDGET_ID, widgetId)
            putExtra(PhotoWidgetProvider.EXTRA_PHOTO_DATA, Gson().toJson(photoData))
        }
        applicationContext.sendBroadcast(intent)
    }

    /**
     * Prefer persisted widget photo (from RN / bridge). Fallback: group catalog latest image URL.
     */
    private fun fetchLatestPhoto(widgetId: Int, groupId: String): WidgetPhotoData? {
        WidgetPreferences.getPhotoData(applicationContext, widgetId)?.let { return it }

        val gid = groupId.trim()
        val group = WidgetPreferences.getUserGroups(applicationContext).find { it.id == gid }
        val latest = group?.latestPhoto?.trim().orEmpty()
        if (latest.isEmpty()) return null

        return WidgetPhotoData(
            photoUrl = latest,
            uploaderName = "",
            uploaderAvatar = null,
            uploadedAt = System.currentTimeMillis(),
            groupName = group?.name ?: "",
            groupId = gid,
            caption = null
        )
    }
    
    companion object {
        const val WORK_NAME = "widget_update_worker"
        
        fun schedulePeriodicUpdate(context: Context) {
            val constraints = Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .setRequiresBatteryNotLow(true)
                .build()
            
            val workRequest = PeriodicWorkRequestBuilder<WidgetUpdateWorker>(
                30, TimeUnit.MINUTES,
                10, TimeUnit.MINUTES
            )
                .setConstraints(constraints)
                .build()
            
            WorkManager.getInstance(context).enqueueUniquePeriodicWork(
                WORK_NAME,
                ExistingPeriodicWorkPolicy.KEEP,
                workRequest
            )
        }
        
        fun cancelPeriodicUpdate(context: Context) {
            WorkManager.getInstance(context).cancelUniqueWork(WORK_NAME)
        }
    }
}
