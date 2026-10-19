// State variables
let currentFilterDate = getTodayDateString(); // Defaults to today
let activeAlarmEntry = null;
let audioCtx = null;

// Helper: Get today's YYYY-MM-DD
function getTodayDateString() {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

// 1. Web Audio Synthesizer Chime for Reminder Alarm
function playChime() {
    try {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, index) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime + index * 0.15);
            
            gain.gain.setValueAtTime(0, audioCtx.currentTime + index * 0.15);
            gain.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + index * 0.15 + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + index * 0.15 + 0.6);
            
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            
            osc.start(audioCtx.currentTime + index * 0.15);
            osc.stop(audioCtx.currentTime + index * 0.15 + 0.65);
        });
    } catch (e) {
        console.warn("Audio chime couldn't play:", e);
    }
}

// 2. Real-time Clock
function updateClock() {
    const now = new Date();
    
    // Time formatted with seconds
    const timeStr = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });
    
    // Date formatted e.g., "Monday, October 19, 2026"
    const dateStr = now.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });

    const clockEl = document.getElementById('liveClock');
    const dateEl = document.getElementById('liveDate');
    if (clockEl) clockEl.textContent = timeStr;
    if (dateEl) dateEl.textContent = dateStr;
}

setInterval(updateClock, 1000);
updateClock();

// 3. Notification Permissions
const notifBtn = document.getElementById('notifBtn');
const notifIcon = document.getElementById('notifIcon');
const notifText = document.getElementById('notifText');

function updateNotifUI() {
    if (!("Notification" in window)) {
        notifText.textContent = "Notifications Not Supported";
        notifBtn.style.opacity = "0.5";
        return;
    }

    if (Notification.permission === "granted") {
        notifIcon.textContent = "🔔";
        notifText.textContent = "Reminders Active";
        notifBtn.style.background = "rgba(16, 185, 129, 0.25)";
        notifBtn.style.borderColor = "rgba(16, 185, 129, 0.5)";
        notifBtn.style.color = "#a7f3d0";
    } else if (Notification.permission === "denied") {
        notifIcon.textContent = "🔕";
        notifText.textContent = "Blocked";
    } else {
        notifIcon.textContent = "🔔";
        notifText.textContent = "Enable Alerts";
    }
}

notifBtn.addEventListener('click', () => {
    if ("Notification" in window) {
        Notification.requestPermission().then(permission => {
            updateNotifUI();
            if (permission === "granted") {
                new Notification("Daily Work Diary", {
                    body: "Reminders are now enabled! We will notify you when works are due.",
                    icon: "📖"
                });
                playChime();
            }
        });
    }
});

updateNotifUI();

// 4. Quick Reminder Times helper
window.setQuickReminder = function(minutes) {
    const target = new Date(Date.now() + minutes * 60000);
    // Format to YYYY-MM-DDTHH:MM for datetime-local
    const year = target.getFullYear();
    const month = String(target.getMonth() + 1).padStart(2, '0');
    const day = String(target.getDate()).padStart(2, '0');
    const hours = String(target.getHours()).padStart(2, '0');
    const mins = String(target.getMinutes()).padStart(2, '0');

    document.getElementById('workReminder').value = `${year}-${month}-${day}T${hours}:${mins}`;
};

window.clearReminder = function() {
    document.getElementById('workReminder').value = "";
};

// 5. Load Entries from API
async function loadEntries() {
    const search = document.getElementById('searchInput').value;
    const category = document.getElementById('categoryFilter').value;
    const status = document.getElementById('statusFilter').value;

    let url = `/api/entries?`;
    if (currentFilterDate) {
        url += `date=${encodeURIComponent(currentFilterDate)}&`;
    }
    if (category) url += `category=${encodeURIComponent(category)}&`;
    if (status) url += `status=${encodeURIComponent(status)}&`;
    if (search) url += `search=${encodeURIComponent(search)}&`;

    try {
        const res = await fetch(url);
        const data = await res.json();
        if (data.success) {
            renderEntries(data.entries);
        }
    } catch (err) {
        console.error("Failed to load entries:", err);
    }

    loadStats();
}

// 6. Render Entries
function renderEntries(entries) {
    const container = document.getElementById('entriesContainer');
    const counter = document.getElementById('entriesCount');
    counter.textContent = `Showing ${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}`;

    if (!entries || entries.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-emoji">📝</div>
                <h3>No diary entries found for this view</h3>
                <p>Add a task or homework using the left form, or change your filter.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = entries.map(entry => {
        const isDone = entry.status === 'completed';
        const priorityClass = `priority-${(entry.priority || 'normal').toLowerCase()}`;
        
        let reminderBadge = '';
        if (entry.reminder_time) {
            const remDate = new Date(entry.reminder_time);
            const timeLabel = remDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const dateLabel = remDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
            const isTriggered = entry.is_reminded ? 'alarm-triggered' : '';
            reminderBadge = `
                <div class="timestamp-reminder ${isTriggered}" title="Reminder Target">
                    ⏰ Remind: ${dateLabel}, ${timeLabel} ${entry.is_reminded ? '(Alerted)' : ''}
                </div>
            `;
        }

        return `
            <div class="diary-item-card ${isDone ? 'completed' : ''}" id="entry-${entry.id}">
                <div class="check-col">
                    <div class="custom-checkbox ${isDone ? 'checked' : ''}" onclick="toggleStatus(${entry.id})" title="${isDone ? 'Mark as Pending' : 'Mark as Done'}">
                        ${isDone ? '✓' : ''}
                    </div>
                </div>

                <div class="item-main">
                    <div class="item-top-meta">
                        <span class="badge-category">${escapeHtml(entry.category)}</span>
                        <span class="badge-priority ${priorityClass}">${escapeHtml(entry.priority)}</span>
                    </div>

                    <div class="item-title">${escapeHtml(entry.title)}</div>

                    ${entry.description ? `<div class="item-desc">${escapeHtml(entry.description)}</div>` : ''}

                    <div class="item-timestamps">
                        <div class="timestamp-entry" title="Exact time this work was entered into the diary">
                            🗓️ <strong>Logged:</strong> ${entry.created_day}, ${entry.created_date} at ${entry.created_time}
                        </div>
                        ${reminderBadge}
                    </div>
                </div>

                <div class="item-actions">
                    <button class="btn-action-delete" onclick="deleteEntry(${entry.id})" title="Delete work entry">
                        🗑️
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Escape HTML helper
function escapeHtml(text) {
    if (!text) return "";
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// 7. Load Stats
async function loadStats() {
    try {
        const res = await fetch('/api/stats');
        const stats = await res.json();
        document.getElementById('statToday').textContent = stats.today || 0;
        document.getElementById('statPending').textContent = stats.pending || 0;
        document.getElementById('statCompleted').textContent = stats.completed || 0;
        document.getElementById('statTotal').textContent = stats.total || 0;
    } catch (e) {
        console.error("Failed to load stats:", e);
    }
}

// 8. Form Submission (Add Entry)
document.getElementById('entryForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = document.getElementById('workTitle').value.trim();
    const category = document.getElementById('workCategory').value;
    const priority = document.getElementById('workPriority').value;
    const description = document.getElementById('workDesc').value.trim();
    const reminder_time = document.getElementById('workReminder').value;

    if (!title) return;

    try {
        const res = await fetch('/api/entries', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title,
                category,
                priority,
                description,
                reminder_time
            })
        });

        const data = await res.json();
        if (data.success) {
            // Clear inputs
            document.getElementById('workTitle').value = "";
            document.getElementById('workDesc').value = "";
            document.getElementById('workReminder').value = "";

            // Switch to today's view to see the freshly logged item
            setTodayView();
        }
    } catch (err) {
        alert("Error saving diary entry. Please try again.");
    }
});

// 9. Toggle Status (Completed/Pending)
window.toggleStatus = async function(id) {
    try {
        const res = await fetch(`/api/entries/${id}/status`, { method: 'PATCH' });
        const data = await res.json();
        if (data.success) {
            loadEntries();
        }
    } catch (err) {
        console.error("Error toggling status:", err);
    }
};

// 10. Delete Entry
window.deleteEntry = async function(id) {
    if (!confirm("Are you sure you want to remove this work entry from your diary?")) {
        return;
    }
    try {
        const res = await fetch(`/api/entries/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
            loadEntries();
        }
    } catch (err) {
        console.error("Error deleting entry:", err);
    }
};

// 11. Reminder Alarm Checker Loop
async function checkReminders() {
    try {
        // Fetch all pending entries to inspect reminder times
        const res = await fetch('/api/entries?status=pending');
        const data = await res.json();
        if (!data.success || !data.entries) return;

        const now = new Date();

        for (const entry of data.entries) {
            if (entry.reminder_time && !entry.is_reminded) {
                const targetTime = new Date(entry.reminder_time);
                // If current time is within or past the reminder time
                if (now >= targetTime) {
                    triggerAlarm(entry);
                    break; // Trigger one modal at a time
                }
            }
        }
    } catch (e) {
        console.warn("Reminder check error:", e);
    }
}

// Trigger Alarm (Modal, Browser Notification, Sound)
function triggerAlarm(entry) {
    activeAlarmEntry = entry;

    // 1. Play sweet chime
    playChime();

    // 2. Browser Desktop Notification
    if ("Notification" in window && Notification.permission === "granted") {
        new Notification(`⏰ Work Reminder: ${entry.title}`, {
            body: `${entry.category} • ${entry.description || 'Time to complete your scheduled work!'}`,
            icon: "📖"
        });
    }

    // 3. In-App Modal Dialog
    const modal = document.getElementById('alarmModal');
    document.getElementById('modalTaskTitle').textContent = entry.title;
    document.getElementById('modalTaskCategory').textContent = `${entry.category} • Priority: ${entry.priority}`;
    document.getElementById('modalTaskDesc').textContent = entry.description || "No extra instructions provided.";
    
    const remDate = new Date(entry.reminder_time);
    document.getElementById('modalTaskTime').textContent = `Scheduled For: ${remDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    modal.classList.add('active');

    // Mark as reminded on server so it doesn't repeat infinitely
    fetch(`/api/entries/${entry.id}/reminded`, { method: 'POST' });
}

// Modal Buttons
document.getElementById('modalDismissBtn').addEventListener('click', () => {
    document.getElementById('alarmModal').classList.remove('active');
    activeAlarmEntry = null;
    loadEntries();
});

document.getElementById('modalDoneBtn').addEventListener('click', async () => {
    if (activeAlarmEntry) {
        await toggleStatus(activeAlarmEntry.id);
    }
    document.getElementById('alarmModal').classList.remove('active');
    activeAlarmEntry = null;
});

// Run reminder checker every 5 seconds
setInterval(checkReminders, 5000);

// 12. Filters & Views
function setTodayView() {
    currentFilterDate = getTodayDateString();
    document.getElementById('btnFilterToday').classList.add('active');
    document.getElementById('btnFilterAll').classList.remove('active');
    document.getElementById('datePickerFilter').value = "";
    document.getElementById('currentViewTitle').textContent = "Today's Works Ledger";
    loadEntries();
}

function setAllView() {
    currentFilterDate = "";
    document.getElementById('btnFilterAll').classList.add('active');
    document.getElementById('btnFilterToday').classList.remove('active');
    document.getElementById('datePickerFilter').value = "";
    document.getElementById('currentViewTitle').textContent = "All Diary Entries (Full History)";
    loadEntries();
}

document.getElementById('btnFilterToday').addEventListener('click', setTodayView);
document.getElementById('btnFilterAll').addEventListener('click', setAllView);

document.getElementById('datePickerFilter').addEventListener('change', (e) => {
    const val = e.target.value;
    if (val) {
        currentFilterDate = val;
        document.getElementById('btnFilterToday').classList.remove('active');
        document.getElementById('btnFilterAll').classList.remove('active');
        const [y, m, d] = val.split('-');
        document.getElementById('currentViewTitle').textContent = `Diary Ledger for ${d}/${m}/${y}`;
        loadEntries();
    }
});

document.getElementById('categoryFilter').addEventListener('change', loadEntries);
document.getElementById('statusFilter').addEventListener('change', loadEntries);

// Debounced search
let searchTimer = null;
document.getElementById('searchInput').addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(loadEntries, 250);
});

// Initialize on page load
setTodayView();
