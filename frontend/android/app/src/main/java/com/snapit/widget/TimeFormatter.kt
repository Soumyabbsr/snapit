package com.snapit.widget

import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

object TimeFormatter {
    
    fun getTimeAgo(timestamp: Long): String {
        val now = System.currentTimeMillis()
        val diff = now - timestamp
        
        return when {
            diff < 60_000 -> "Just now"
            diff < 3600_000 -> "${diff / 60_000}m ago"
            diff < 86400_000 -> "${diff / 3600_000}h ago"
            diff < 604800_000 -> "${diff / 86400_000}d ago"
            diff < 2592000_000 -> "${diff / 604800_000}w ago"
            else -> "${diff / 2592000_000}mo ago"
        }
    }
    
    fun formatTimestamp(timestamp: Long, format: String = "MMM dd, yyyy"): String {
        val sdf = SimpleDateFormat(format, Locale.getDefault())
        return sdf.format(Date(timestamp))
    }
}
