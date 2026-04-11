package com.snapit.widget

import android.app.Activity
import android.appwidget.AppWidgetManager
import android.content.Intent
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.CheckBox
import android.widget.ImageView
import android.widget.ProgressBar
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.snapit.R

class WidgetConfigActivity : AppCompatActivity() {

    private var widgetId = AppWidgetManager.INVALID_APPWIDGET_ID
    private var selectedGroupId: String? = null
    private lateinit var adapter: GroupAdapter

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // Set result to CANCELED in case the user backs out
        setResult(Activity.RESULT_CANCELED)
        setContentView(R.layout.activity_widget_config)

        // Find the widget ID from the intent
        widgetId = intent?.extras?.getInt(
            AppWidgetManager.EXTRA_APPWIDGET_ID,
            AppWidgetManager.INVALID_APPWIDGET_ID
        ) ?: AppWidgetManager.INVALID_APPWIDGET_ID

        // If this activity was started with an invalid widget ID, finish with an error
        if (widgetId == AppWidgetManager.INVALID_APPWIDGET_ID) {
            finish()
            return
        }

        findViewById<Button>(R.id.btn_cancel).setOnClickListener {
            finish()
        }

        val btnAdd = findViewById<Button>(R.id.btn_add)
        btnAdd.setOnClickListener {
            selectedGroupId?.let { groupId ->
                saveWidgetConfiguration(groupId)
            }
        }
        btnAdd.isEnabled = false

        setupRecyclerView()
        fetchUserGroups()
    }

    private fun setupRecyclerView() {
        val recycler = findViewById<RecyclerView>(R.id.recycler_groups)
        recycler.layoutManager = LinearLayoutManager(this)
        adapter = GroupAdapter { group ->
            selectedGroupId = group.id
            findViewById<Button>(R.id.btn_add).isEnabled = true
        }
        recycler.adapter = adapter
    }

    private fun fetchUserGroups() {
        val pb = findViewById<ProgressBar>(R.id.progress_loading)
        pb.visibility = View.VISIBLE
        
        val groups = WidgetPreferences.getUserGroups(this)
        
        pb.visibility = View.GONE
        adapter.setGroups(groups)
        
        if (groups.isEmpty()) {
            findViewById<TextView>(R.id.text_empty).visibility = View.VISIBLE
            findViewById<TextView>(R.id.text_empty).text = "No groups found.\nJoin a group in the app first."
        } else {
            findViewById<TextView>(R.id.text_empty).visibility = View.GONE
        }
    }

    private fun saveWidgetConfiguration(groupId: String) {
        // Save to preferences
        WidgetPreferences.saveWidgetGroup(this, widgetId, groupId)

        // Push initial update
        val intent = Intent(this, PhotoWidgetProvider::class.java)
        intent.action = PhotoWidgetProvider.ACTION_WIDGET_UPDATE
        intent.putExtra(PhotoWidgetProvider.EXTRA_WIDGET_ID, widgetId)
        sendBroadcast(intent)

        // Return OK
        val resultValue = Intent()
        resultValue.putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, widgetId)
        setResult(Activity.RESULT_OK, resultValue)
        finish()
    }

    inner class GroupAdapter(private val onClick: (GroupData) -> Unit) : 
        RecyclerView.Adapter<GroupAdapter.ViewHolder>() {
        
        private var items: List<GroupData> = emptyList()
        private var selectedPosition = -1

        fun setGroups(groups: List<GroupData>) {
            items = groups
            notifyDataSetChanged()
        }

        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
            val v = LayoutInflater.from(parent.context).inflate(R.layout.item_group_selector, parent, false)
            return ViewHolder(v)
        }

        override fun onBindViewHolder(holder: ViewHolder, position: Int) {
            val group = items[position]
            holder.bind(group, position == selectedPosition)
            holder.itemView.setOnClickListener {
                val oldPos = selectedPosition
                selectedPosition = holder.adapterPosition
                if (oldPos != -1) notifyItemChanged(oldPos)
                notifyItemChanged(selectedPosition)
                onClick(group)
            }
        }

        override fun getItemCount() = items.size

        inner class ViewHolder(view: View) : RecyclerView.ViewHolder(view) {
            private val icon = view.findViewById<ImageView>(R.id.group_icon)
            private val name = view.findViewById<TextView>(R.id.group_name)
            private val members = view.findViewById<TextView>(R.id.member_count)
            private val check = view.findViewById<CheckBox>(R.id.group_check)

            fun bind(group: GroupData, isSelected: Boolean) {
                name.text = group.name
                members.text = "${group.memberCount} members"
                check.isChecked = isSelected
                
                if (!group.icon.isNullOrEmpty()) {
                    Glide.with(itemView.context)
                        .load(group.icon)
                        .placeholder(R.mipmap.ic_launcher)
                        .into(icon)
                } else {
                    icon.setImageResource(R.mipmap.ic_launcher)
                }
            }
        }
    }
}
