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
        return try {
            val widgets = WidgetPreferences.getAllWidgets(applicationContext)
            
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
        // Here we ideally fetch from API or react native logic.
        // For baseline offline support or background, you would integrate a native network call if applicable.
        val photoData = fetchLatestPhoto(groupId) ?: return
        
        val imageFile = ImageCacheManager(applicationContext)
            .downloadAndCacheImage(photoData.photoUrl, widgetId)
        
        if (imageFile != null) {
            WidgetPreferences.savePhotoData(applicationContext, widgetId, photoData)
            WidgetPreferences.saveLastUpdate(applicationContext, widgetId, System.currentTimeMillis())
            val intent = Intent(applicationContext, PhotoWidgetProvider::class.java)
            intent.action = PhotoWidgetProvider.ACTION_WIDGET_UPDATE
            intent.putExtra(PhotoWidgetProvider.EXTRA_WIDGET_ID, widgetId)
            intent.putExtra(PhotoWidgetProvider.EXTRA_PHOTO_DATA, Gson().toJson(photoData))
            applicationContext.sendBroadcast(intent)
        }
    }
    
    private suspend fun fetchLatestPhoto(groupId: String): WidgetPhotoData? {
        // Return existing for now unless headless JS is executed.
        // Usually fetching directly inside background worker requires an API call implementation here.
        return null
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
