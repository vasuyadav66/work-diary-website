import sqlite3
from datetime import datetime
from flask import Flask, render_template, request, jsonify

app = Flask(__name__)
DB_NAME = "work_diary.db"

def get_db():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS entries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            category TEXT DEFAULT 'General',
            description TEXT,
            priority TEXT DEFAULT 'Normal',
            status TEXT DEFAULT 'pending',
            created_iso TEXT NOT NULL,
            created_date TEXT NOT NULL,
            created_time TEXT NOT NULL,
            created_day TEXT NOT NULL,
            created_year INTEGER NOT NULL,
            created_month TEXT NOT NULL,
            reminder_time TEXT,
            is_reminded INTEGER DEFAULT 0
        )
    """)
    conn.commit()
    conn.close()

# Initialize DB on start
init_db()

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/entries", methods=["GET"])
def get_entries():
    date_filter = request.args.get("date")
    category_filter = request.args.get("category")
    status_filter = request.args.get("status")
    search_query = request.args.get("search")

    query = "SELECT * FROM entries WHERE 1=1"
    params = []

    if date_filter:
        query += " AND created_date = ?"
        params.append(date_filter)

    if category_filter and category_filter != "all":
        query += " AND category = ?"
        params.append(category_filter)

    if status_filter and status_filter != "all":
        query += " AND status = ?"
        params.append(status_filter)

    if search_query:
        query += " AND (title LIKE ? OR description LIKE ?)"
        term = f"%{search_query}%"
        params.extend([term, term])

    query += " ORDER BY id DESC"

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(query, params)
    rows = cursor.fetchall()
    entries = [dict(row) for row in rows]
    conn.close()

    return jsonify({"success": True, "entries": entries})

@app.route("/api/entries", methods=["POST"])
def add_entry():
    data = request.get_json() or {}
    title = data.get("title", "").strip()
    if not title:
        return jsonify({"success": False, "error": "Title is required"}), 400

    category = data.get("category", "General").strip()
    description = data.get("description", "").strip()
    priority = data.get("priority", "Normal").strip()
    reminder_time = data.get("reminder_time", "").strip()

    # Accurate time capture
    now = datetime.now()
    created_iso = now.isoformat()
    created_date = now.strftime("%Y-%m-%d")          # e.g., 2026-10-19
    created_time = now.strftime("%I:%M %p")          # e.g., 09:30 AM
    created_day = now.strftime("%A")                 # e.g., Monday
    created_year = now.year                          # e.g., 2026
    created_month = now.strftime("%B")               # e.g., October

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO entries (
            title, category, description, priority, status,
            created_iso, created_date, created_time, created_day,
            created_year, created_month, reminder_time, is_reminded
        ) VALUES (?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, 0)
    """, (
        title, category, description, priority,
        created_iso, created_date, created_time, created_day,
        created_year, created_month, reminder_time if reminder_time else None
    ))
    conn.commit()
    new_id = cursor.lastrowid
    conn.close()

    return jsonify({
        "success": True,
        "id": new_id,
        "message": "Diary entry recorded successfully!"
    }), 201

@app.route("/api/entries/<int:entry_id>/status", methods=["PATCH"])
def toggle_status(entry_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT status FROM entries WHERE id = ?", (entry_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return jsonify({"success": False, "error": "Entry not found"}), 404

    new_status = "completed" if row["status"] == "pending" else "pending"
    cursor.execute("UPDATE entries SET status = ? WHERE id = ?", (new_status, entry_id))
    conn.commit()
    conn.close()

    return jsonify({"success": True, "status": new_status})

@app.route("/api/entries/<int:entry_id>", methods=["DELETE"])
def delete_entry(entry_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM entries WHERE id = ?", (entry_id,))
    conn.commit()
    conn.close()
    return jsonify({"success": True, "message": "Entry removed"})

@app.route("/api/entries/<int:entry_id>/reminded", methods=["POST"])
def mark_reminded(entry_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("UPDATE entries SET is_reminded = 1 WHERE id = ?", (entry_id,))
    conn.commit()
    conn.close()
    return jsonify({"success": True})

@app.route("/api/stats", methods=["GET"])
def get_stats():
    today_str = datetime.now().strftime("%Y-%m-%d")
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("SELECT COUNT(*) FROM entries")
    total = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM entries WHERE status = 'completed'")
    completed = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM entries WHERE status = 'pending'")
    pending = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM entries WHERE created_date = ?", (today_str,))
    today_count = cursor.fetchone()[0]

    conn.close()
    return jsonify({
        "total": total,
        "completed": completed,
        "pending": pending,
        "today": today_count
    })

if __name__ == "__main__":
    print("=" * 60)
    print("[*] School Work Diary Web App starting on http://127.0.0.1:5000")
    print("=" * 60)
    app.run(debug=True, host="127.0.0.1", port=5000)
