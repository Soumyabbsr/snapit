package com.snapit.widget

import android.appwidget.AppWidgetManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import kotlin.math.max
import kotlin.math.roundToInt
import kotlin.math.sqrt
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
import java.io.File
import java.util.Collections
import androidx.core.content.ContextCompat
import android.graphics.Canvas

class WidgetRemoteViewsBuilder(private val context: Context) {

    companion object {
        private val activeDownloads: MutableSet<String> = Collections.synchronizedSet(mutableSetOf())
    }
    
    fun buildSmallWidget(widgetId: Int, groupData: GroupData?, photoData: WidgetPhotoData?): RemoteViews {
        val views = RemoteViews(context.packageName, R.layout.widget_small)
        val groupId = groupData?.id ?: ""
        
        if (photoData != null && photoData.photoUrl.isNotEmpty()) {
            loadImage(views, R.id.widget_image, photoData.photoUrl, widgetId, hasRealPhotoData = true)
            views.setTextViewText(R.id.widget_group_name, photoData.groupName)
            views.setViewVisibility(R.id.widget_loading, View.GONE)
        } else if (groupData != null && !groupData.latestPhoto.isNullOrEmpty()) {
            loadImage(views, R.id.widget_image, groupData.latestPhoto!!, widgetId, hasRealPhotoData = photoData != null)
            views.setTextViewText(R.id.widget_group_name, groupData.name)
            views.setViewVisibility(R.id.widget_loading, View.GONE)
        } else if (groupData != null) {
            getVectorBitmap(R.drawable.ic_widget_placeholder)?.let { views.setImageViewBitmap(R.id.widget_image, it) }
            views.setTextViewText(R.id.widget_group_name, groupData.name)
            views.setViewVisibility(R.id.widget_loading, View.GONE)
        } else {
            getVectorBitmap(R.drawable.ic_widget_placeholder)?.let { views.setImageViewBitmap(R.id.widget_image, it) }
            views.setTextViewText(R.id.widget_group_name, "Add widget")
            views.setViewVisibility(R.id.widget_loading, View.GONE)
        }
        
        attachRootClickPendingIntent(views, groupId)
        return views
    }
    
    fun buildMediumWidget(widgetId: Int, groupData: GroupData?, photoData: WidgetPhotoData?): RemoteViews {
        val views = RemoteViews(context.packageName, R.layout.widget_medium)
        val groupId = groupData?.id ?: ""
        
        if (photoData != null && photoData.photoUrl.isNotEmpty()) {
            loadImage(views, R.id.widget_image, photoData.photoUrl, widgetId, hasRealPhotoData = true)
            views.setTextViewText(R.id.widget_group_name, photoData.groupName)
            views.setTextViewText(R.id.widget_uploader_name, photoData.uploaderName)
            views.setTextViewText(R.id.widget_time_ago, TimeFormatter.getTimeAgo(photoData.uploadedAt))
            views.setViewVisibility(R.id.widget_loading, View.GONE)
        } else if (groupData != null && !groupData.latestPhoto.isNullOrEmpty()) {
            loadImage(views, R.id.widget_image, groupData.latestPhoto!!, widgetId, hasRealPhotoData = photoData != null)
            views.setTextViewText(R.id.widget_group_name, groupData.name)
            views.setTextViewText(R.id.widget_uploader_name, "${groupData.memberCount} members")
            views.setTextViewText(R.id.widget_time_ago, "")
            views.setViewVisibility(R.id.widget_loading, View.GONE)
        } else if (groupData != null) {
            getVectorBitmap(R.drawable.ic_widget_placeholder)?.let { views.setImageViewBitmap(R.id.widget_image, it) }
            views.setTextViewText(R.id.widget_group_name, groupData.name)
            views.setTextViewText(R.id.widget_uploader_name, "${groupData.memberCount} members")
            views.setTextViewText(R.id.widget_time_ago, "")
            views.setViewVisibility(R.id.widget_loading, View.GONE)
        } else {
            getVectorBitmap(R.drawable.ic_widget_placeholder)?.let { views.setImageViewBitmap(R.id.widget_image, it) }
            views.setTextViewText(R.id.widget_group_name, "Add widget")
            views.setViewVisibility(R.id.widget_loading, View.GONE)
        }
        
        attachRootClickPendingIntent(views, groupId)
        return views
    }
    
    fun buildLargeWidget(widgetId: Int, groupData: GroupData?, photoData: WidgetPhotoData?): RemoteViews {
        val views = RemoteViews(context.packageName, R.layout.widget_large)
        val groupId = groupData?.id ?: ""
        
        if (photoData != null && photoData.photoUrl.isNotEmpty()) {
            loadImage(views, R.id.widget_image, photoData.photoUrl, widgetId, hasRealPhotoData = true)
            views.setTextViewText(R.id.widget_group_name, photoData.groupName)
            views.setTextViewText(R.id.widget_uploader_name, photoData.uploaderName)
            views.setTextViewText(R.id.widget_time_ago, TimeFormatter.getTimeAgo(photoData.uploadedAt))
            
            if (!photoData.uploaderAvatar.isNullOrEmpty()) {
                loadImage(views, R.id.widget_uploader_avatar, photoData.uploaderAvatar, widgetId, hasRealPhotoData = true)
            }
            
            views.setViewVisibility(R.id.widget_loading, View.GONE)
        } else if (groupData != null && !groupData.latestPhoto.isNullOrEmpty()) {
            loadImage(views, R.id.widget_image, groupData.latestPhoto!!, widgetId, hasRealPhotoData = photoData != null)
            views.setTextViewText(R.id.widget_group_name, groupData.name)
            views.setTextViewText(R.id.widget_uploader_name, "${groupData.memberCount} members")
            views.setTextViewText(R.id.widget_time_ago, "")
            getVectorBitmap(R.mipmap.ic_launcher)?.let { views.setImageViewBitmap(R.id.widget_uploader_avatar, it) }
            views.setViewVisibility(R.id.widget_loading, View.GONE)
        } else if (groupData != null) {
            getVectorBitmap(R.drawable.ic_widget_placeholder)?.let { views.setImageViewBitmap(R.id.widget_image, it) }
            views.setTextViewText(R.id.widget_group_name, groupData.name)
            views.setTextViewText(R.id.widget_uploader_name, "${groupData.memberCount} members")
            views.setTextViewText(R.id.widget_time_ago, "")
            getVectorBitmap(R.mipmap.ic_launcher)?.let { views.setImageViewBitmap(R.id.widget_uploader_avatar, it) }
            views.setViewVisibility(R.id.widget_loading, View.GONE)
        } else {
            getVectorBitmap(R.drawable.ic_widget_placeholder)?.let { views.setImageViewBitmap(R.id.widget_image, it) }
            views.setTextViewText(R.id.widget_group_name, "Add widget")
            views.setViewVisibility(R.id.widget_loading, View.GONE)
        }
        
        attachRootClickPendingIntent(views, groupId)
        return views
    }

    /**
     * After a failed network decode, show error artwork without re-entering Glide.
     */
    fun pushImageLoadFailed(widgetId: Int) {
        Log.i(
            "WidgetFinal",
            "=== pushImageLoadFailed CALLED widgetId=$widgetId - THIS WILL SHOW ERROR SCREEN"
        )
        val appWidgetManager = AppWidgetManager.getInstance(context)
        val groupId = WidgetPreferences.getWidgetGroup(context, widgetId) ?: return
        val groupData = WidgetPreferences.getUserGroups(context).find { it.id == groupId }
        val photoData = WidgetPreferences.getPhotoData(context, widgetId)
        val size = resolveWidgetSize(appWidgetManager, widgetId)
        val layoutRes = when (size) {
            WidgetSize.SMALL -> R.layout.widget_small
            WidgetSize.MEDIUM -> R.layout.widget_medium
            WidgetSize.LARGE -> R.layout.widget_large
        }
        val views = RemoteViews(context.packageName, layoutRes)
        getVectorBitmap(R.drawable.ic_widget_error)?.let { views.setImageViewBitmap(R.id.widget_image, it) }
        val title = when {
            !photoData?.groupName.isNullOrBlank() -> photoData!!.groupName
            groupData != null -> groupData.name
            else -> ""
        }
        views.setTextViewText(R.id.widget_group_name, title.ifEmpty { "SnapIt" })
        views.setViewVisibility(R.id.widget_loading, View.GONE)
        when (size) {
            WidgetSize.MEDIUM -> {
                views.setTextViewText(
                    R.id.widget_uploader_name,
                    photoData?.uploaderName?.ifBlank { null } ?: "Could not load image"
                )
                views.setTextViewText(R.id.widget_time_ago, "")
            }
            WidgetSize.LARGE -> {
                views.setTextViewText(
                    R.id.widget_uploader_name,
                    photoData?.uploaderName?.ifBlank { null } ?: "Could not load image"
                )
                views.setTextViewText(R.id.widget_time_ago, "")
                getVectorBitmap(R.mipmap.ic_launcher)?.let { views.setImageViewBitmap(R.id.widget_uploader_avatar, it) }
            }
            else -> {}
        }
        attachRootClickPendingIntent(views, groupData?.id ?: groupId)
        appWidgetManager.updateAppWidget(widgetId, views)
    }

    private fun resolveWidgetSize(appWidgetManager: AppWidgetManager, widgetId: Int): WidgetSize {
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
            "=== resolveWidgetSize widgetId=$widgetId minWidth=$minWidth minHeight=$minHeight result=$result"
        )
        return result
    }

    private fun isRemoteHttpUrl(url: String): Boolean {
        val t = url.trim()
        return t.startsWith("https://", ignoreCase = true) ||
            t.startsWith("http://", ignoreCase = true)
    }
    
    private fun loadImage(
        views: RemoteViews,
        imageViewId: Int,
        url: String,
        widgetId: Int,
        hasRealPhotoData: Boolean = true
    ) {
        if (url.isBlank() || !hasRealPhotoData) {
            getVectorBitmap(R.drawable.ic_widget_placeholder)?.let { views.setImageViewBitmap(imageViewId, it) }
            return
        }
        Log.i(
            "WidgetDiag",
            "=== loadImage url=${url.take(80)} widgetId=$widgetId cached=${ImageCacheManager(context).getCachedImage(widgetId, url)?.exists()}"
        )
        if (!isRemoteHttpUrl(url)) {
            Log.w("WidgetRemoteViews", "Skipping non-remote image URL for widget: ${url.take(80)}")
            getVectorBitmap(R.drawable.ic_widget_error)?.let { views.setImageViewBitmap(imageViewId, it) }
            return
        }

        val cachedFile = ImageCacheManager(context).getCachedImage(widgetId, url)

        if (cachedFile?.exists() == true) {
            val bitmap = decodeBitmapForWidget(cachedFile.absolutePath)
            if (bitmap != null) {
                val ready = prepareBitmapForRemoteViews(bitmap, widgetId)
                if (ready == null) {
                    getVectorBitmap(R.drawable.ic_widget_error)?.let { views.setImageViewBitmap(imageViewId, it) }
                    return
                }
                views.setImageViewBitmap(imageViewId, ready)
                return
            }
        }

        getVectorBitmap(R.drawable.ic_widget_placeholder)?.let { views.setImageViewBitmap(imageViewId, it) }
        downloadImageAsync(url, widgetId)
    }
    
    /**
     * RemoteViews has strict Binder limits; large bitmaps cause "Problem loading widget".
     * Decode with subsampling, then cap the longest side.
     */
    private fun decodeBitmapForWidget(path: String, maxSide: Int = 320): Bitmap? {
        val pathFile = File(path)
        Log.i(
            "WidgetDiag",
            "=== decodeBitmapForWidget path=$path exists=${pathFile.exists()} size=${pathFile.length()}"
        )
        val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        BitmapFactory.decodeFile(path, bounds)
        if (bounds.outWidth <= 0 || bounds.outHeight <= 0) {
            Log.i("WidgetDiag", "=== decodeBitmapForWidget result=null (invalid bounds) isNull=true")
            return null
        }

        val opts = BitmapFactory.Options().apply {
            inSampleSize = calculateInSampleSize(bounds.outWidth, bounds.outHeight, maxSide, maxSide)
        }
        var decoded = BitmapFactory.decodeFile(path, opts)
        if (decoded == null) {
            Log.i("WidgetDiag", "=== decodeBitmapForWidget result=null (decodeFile) isNull=true")
            return null
        }
        decoded = scaleBitmapToMaxSide(decoded, maxSide)
        Log.i(
            "WidgetDiag",
            "=== decodeBitmapForWidget result=${decoded.width}x${decoded.height} isNull=${decoded == null}"
        )
        return decoded
    }

    /**
     * Binder / RemoteViews payload budget (~1MB). Re-scale if needed; recycles the input when replaced.
     * @return bitmap safe to pass to [RemoteViews.setImageViewBitmap], or null (input recycled on failure).
     */
    private fun prepareBitmapForRemoteViews(source: Bitmap, widgetId: Int): Bitmap? {
        Log.i(
            "WidgetDiag",
            "=== prepareBitmapForRemoteViews input=${source.width}x${source.height} bytes=${source.byteCount}"
        )
        var bmp = source
        var bytes = bmp.byteCount
        Log.i("WidgetRemoteViews", "bitmap byteCount=$bytes widgetId=$widgetId")
        if (bytes > 800_000) {
            Log.w("WidgetRemoteViews", "Bitmap too large ($bytes bytes), re-scaling")
            val scale = sqrt(800_000.0 / bytes).toFloat()
            val nw = (bmp.width * scale).toInt().coerceAtLeast(1)
            val nh = (bmp.height * scale).toInt().coerceAtLeast(1)
            val scaled = Bitmap.createScaledBitmap(bmp, nw, nh, true)
            if (scaled != bmp) bmp.recycle()
            bmp = scaled
            bytes = bmp.byteCount
            Log.i("WidgetRemoteViews", "after rescale byteCount=$bytes widgetId=$widgetId")
        }
        val result = bmp
        Log.i(
            "WidgetDiag",
            "=== prepareBitmapForRemoteViews output=${result.width}x${result.height} bytes=${result.byteCount} isNull=${result == null}"
        )
        if (bytes > 900_000) {
            Log.e("WidgetRemoteViews", "Bitmap still too large after rescale: $bytes")
            bmp.recycle()
            return null
        }
        return bmp
    }

    private fun calculateInSampleSize(width: Int, height: Int, reqW: Int, reqH: Int): Int {
        var inSampleSize = 1
        if (height > reqH || width > reqW) {
            var halfH = height / 2
            var halfW = width / 2
            while (halfH / inSampleSize >= reqH && halfW / inSampleSize >= reqW) {
                inSampleSize *= 2
            }
        }
        return max(1, inSampleSize)
    }

    private fun scaleBitmapToMaxSide(bitmap: Bitmap, maxSide: Int): Bitmap {
        val w = bitmap.width
        val h = bitmap.height
        if (w <= maxSide && h <= maxSide) return bitmap
        val ratio = maxSide.toFloat() / max(w, h)
        val nw = max(1, (w * ratio).roundToInt())
        val nh = max(1, (h * ratio).roundToInt())
        val scaled = Bitmap.createScaledBitmap(bitmap, nw, nh, true)
        if (scaled != bitmap) {
            bitmap.recycle()
        }
        return scaled
    }

    private fun sendImageLoadFailedBroadcast(widgetId: Int) {
        runCatching {
            val failIntent = Intent(context, PhotoWidgetProvider::class.java).apply {
                action = PhotoWidgetProvider.ACTION_WIDGET_IMAGE_LOAD_FAILED
                putExtra(PhotoWidgetProvider.EXTRA_WIDGET_ID, widgetId)
            }
            context.sendBroadcast(failIntent)
        }
    }

    private suspend fun applyDirectWidgetAfterDownload(widgetId: Int, bitmap: Bitmap) {
        withContext(Dispatchers.Main) {
            try {
                val appWidgetManager = AppWidgetManager.getInstance(context)
                val groupId = WidgetPreferences.getWidgetGroup(context, widgetId)
                if (groupId == null) {
                    Log.e("WidgetRemoteViews", "direct update: no group for widgetId=$widgetId")
                    return@withContext
                }
                val groupData = WidgetPreferences.getUserGroups(context).find { it.id == groupId }
                val photoData = WidgetPreferences.getPhotoData(context, widgetId)
                val size = resolveWidgetSize(appWidgetManager, widgetId)
                val layoutRes = when (size) {
                    WidgetSize.SMALL -> R.layout.widget_small
                    WidgetSize.MEDIUM -> R.layout.widget_medium
                    WidgetSize.LARGE -> R.layout.widget_large
                }
                Log.i(
                    "WidgetFinal",
                    "=== applyDirectWidgetAfterDownload START widgetId=$widgetId size=$size layoutRes=$layoutRes"
                )
                val views = RemoteViews(context.packageName, layoutRes)
                views.setImageViewBitmap(R.id.widget_image, bitmap)
                val title = photoData?.groupName ?: groupData?.name ?: "SnapIt"
                views.setTextViewText(R.id.widget_group_name, title)
                views.setViewVisibility(R.id.widget_loading, View.GONE)
                when (size) {
                    WidgetSize.MEDIUM, WidgetSize.LARGE -> {
                        views.setTextViewText(R.id.widget_uploader_name, photoData?.uploaderName ?: "")
                        views.setTextViewText(
                            R.id.widget_time_ago,
                            if (photoData != null) TimeFormatter.getTimeAgo(photoData.uploadedAt) else ""
                        )
                    }
                    else -> {}
                }
                if (size == WidgetSize.LARGE) {
                    getVectorBitmap(R.mipmap.ic_launcher)?.let { views.setImageViewBitmap(R.id.widget_uploader_avatar, it) }
                }
                attachRootClickPendingIntent(views, groupId)
                appWidgetManager.updateAppWidget(widgetId, views)
                Log.i(
                    "WidgetFinal",
                    "=== applyDirectWidgetAfterDownload END widgetId=$widgetId - this should be the LAST update"
                )
                Log.i("WidgetRemoteViews", "updateAppWidget called for widgetId=$widgetId")
                Log.i("WidgetDiag", "=== applyDirectWidgetAfterDownload SUCCESS widgetId=$widgetId")
            } catch (e: Exception) {
                Log.e("WidgetDiag", "=== applyDirectWidgetAfterDownload FAILED widgetId=$widgetId", e)
            }
        }
    }

    private fun downloadImageAsync(url: String, widgetId: Int) {
        if (!isRemoteHttpUrl(url)) return
        val trimmedUrl = url.trim()
        val key = "$widgetId:$trimmedUrl"
        if (!activeDownloads.add(key)) {
            Log.d("WidgetRemoteViews", "Download already in progress for $key, skipping")
            return
        }
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val file = ImageCacheManager(context).downloadAndCacheImage(trimmedUrl, widgetId)
                if (file == null) {
                    withContext(Dispatchers.Main) { sendImageLoadFailedBroadcast(widgetId) }
                    return@launch
                }
                val decoded = decodeBitmapForWidget(file.absolutePath)
                if (decoded == null) {
                    Log.e("WidgetRemoteViews", "decode failed for ${file.absolutePath}")
                    withContext(Dispatchers.Main) { sendImageLoadFailedBroadcast(widgetId) }
                    return@launch
                }
                Log.i(
                    "WidgetRemoteViews",
                    "decoded bitmap: ${decoded.width}x${decoded.height} bytes=${decoded.byteCount}"
                )
                val ready = prepareBitmapForRemoteViews(decoded, widgetId)
                if (ready == null) {
                    withContext(Dispatchers.Main) { sendImageLoadFailedBroadcast(widgetId) }
                    return@launch
                }
                applyDirectWidgetAfterDownload(widgetId, ready)
            } catch (e: Exception) {
                Log.e("WidgetRemoteViews", "Image download failed url=$trimmedUrl", e)
                withContext(Dispatchers.Main) { sendImageLoadFailedBroadcast(widgetId) }
            } finally {
                activeDownloads.remove(key)
            }
        }
    }
    
    private fun attachRootClickPendingIntent(views: RemoteViews, groupId: String) {
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

    fun attachRootClickToViews(views: RemoteViews, groupId: String) {
        attachRootClickPendingIntent(views, groupId)
    }

    fun getVectorBitmap(drawableResId: Int): Bitmap? {
        try {
            val drawable = ContextCompat.getDrawable(context, drawableResId) ?: return null
            val bitmap = Bitmap.createBitmap(
                if (drawable.intrinsicWidth > 0) drawable.intrinsicWidth else 200,
                if (drawable.intrinsicHeight > 0) drawable.intrinsicHeight else 200,
                Bitmap.Config.ARGB_8888
            )
            val canvas = Canvas(bitmap)
            drawable.setBounds(0, 0, canvas.width, canvas.height)
            drawable.draw(canvas)
            return bitmap
        } catch (e: Exception) {
            Log.e("WidgetRemoteViews", "Failed to rasterize vector", e)
            return null
        }
    }
}
