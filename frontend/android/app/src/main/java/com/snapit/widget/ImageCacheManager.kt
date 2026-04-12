package com.snapit.widget

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import com.bumptech.glide.Glide
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileOutputStream

class ImageCacheManager(private val context: Context) {
    
    private val cacheDir: File = File(context.cacheDir, "widget_images")
    
    init {
        if (!cacheDir.exists()) {
            cacheDir.mkdirs()
        }
    }
    
    // File per widget + image URL so we never show a stale bitmap after the URL changes
    private fun getCacheFilePath(widgetId: Int, imageUrl: String): File {
        val safe = imageUrl.hashCode().toString().replace('-', 'n')
        return File(cacheDir, "widget_${widgetId}_$safe.jpg")
    }

    // Download image from URL and cache it
    suspend fun downloadAndCacheImage(url: String, widgetId: Int): File? = withContext(Dispatchers.IO) {
        if (url.isBlank()) return@withContext null
        try {
            val appCtx = context.applicationContext
            val bitmap = Glide.with(appCtx)
                .asBitmap()
                .load(url)
                .submit(512, 512) // Max size for widget
                .get()
            return@withContext saveBitmapToCache(bitmap, widgetId, url)
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }
    
    // Get cached image file for this widget + URL
    fun getCachedImage(widgetId: Int, imageUrl: String): File? {
        if (imageUrl.isBlank()) return null
        val file = getCacheFilePath(widgetId, imageUrl)
        return if (file.exists()) file else null
    }
    
    // Load image as Bitmap
    fun loadCachedBitmap(widgetId: Int, imageUrl: String): Bitmap? {
        val file = getCachedImage(widgetId, imageUrl) ?: return null
        return BitmapFactory.decodeFile(file.absolutePath)
    }
    
    // Save bitmap to cache
    fun saveBitmapToCache(bitmap: Bitmap, widgetId: Int, imageUrl: String): File? {
        return try {
            val file = getCacheFilePath(widgetId, imageUrl)
            val outputStream = FileOutputStream(file)
            bitmap.compress(Bitmap.CompressFormat.JPEG, 85, outputStream)
            outputStream.flush()
            outputStream.close()
            file
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }
    
    // Clear all cached files for this widget (any URL)
    fun clearCache(widgetId: Int) {
        val prefix = "widget_${widgetId}_"
        cacheDir.listFiles()?.forEach { file ->
            if (file.name.startsWith(prefix) && file.name.endsWith(".jpg")) {
                file.delete()
            }
        }
    }
    
    // Clear all old cached images (older than 7 days)
    fun clearOldCache() {
        val threshold = System.currentTimeMillis() - (7 * 24 * 60 * 60 * 1000)
        cacheDir.listFiles()?.forEach { file ->
            if (file.lastModified() < threshold) {
                file.delete()
            }
        }
    }
    
    // Get total cache size
    fun getCacheSize(): Long {
        var size: Long = 0
        cacheDir.listFiles()?.forEach { file ->
            size += file.length()
        }
        return size
    }
    
    // Check if cache size exceeds limit (100MB)
    fun isCacheFull(): Boolean {
        return getCacheSize() > 100 * 1024 * 1024
    }
    
    // Clean cache if full (remove oldest files)
    fun cleanCacheIfNeeded() {
        if (!isCacheFull()) return
        
        val files = cacheDir.listFiles()?.sortedBy { it.lastModified() } ?: return
        for (file in files) {
            if (!isCacheFull()) break
            file.delete()
        }
    }
}
