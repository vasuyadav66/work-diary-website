from __future__ import annotations

from dataclasses import asdict, dataclass
from datetime import datetime
import json
from pathlib import Path
from uuid import uuid4

from flask import Flask, redirect, render_template, request, url_for


APP_DIR = Path(__file__).parent
DATA_FILE = APP_DIR / "data" / "diary_entries.json"

app = Flask(__name__)


@dataclass
class DiaryEntry:
    id: str
    title: str
    subject: str
    notes: str
    reminder_at: str
    created_at: str
    completed: bool = False


def now_text() -> str:
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def load_entries() -> list[DiaryEntry]:
    if not DATA_FILE.exists():
        return []

    entries = json.loads(DATA_FILE.read_text(encoding="utf-8"))
    return [DiaryEntry(**entry) for entry in entries]


def save_entries(entries: list[DiaryEntry]) -> None:
    DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
    DATA_FILE.write_text(
        json.dumps([asdict(entry) for entry in entries], indent=2),
        encoding="utf-8",
    )


def parse_reminder(value: str) -> datetime:
    return datetime.strptime(value, "%Y-%m-%dT%H:%M")


def display_datetime(value: str) -> str:
    try:
        return parse_reminder(value).strftime("%d %B %Y, %I:%M %p")
    except ValueError:
        return value


def entry_status(entry: DiaryEntry) -> str:
    if entry.completed:
        return "completed"
    try:
        if parse_reminder(entry.reminder_at) < datetime.now():
            return "due"
    except ValueError:
        return "planned"
    return "planned"


@app.template_filter("display_time")
def display_time(value: str) -> str:
    return display_datetime(value)


@app.template_filter("status")
def status(value: DiaryEntry) -> str:
    return entry_status(value)


@app.route("/")
def index():
    entries = load_entries()
    entries.sort(key=lambda entry: entry.reminder_at)

    today = datetime.now().date()
    total = len(entries)
    completed = sum(1 for entry in entries if entry.completed)
    due = sum(1 for entry in entries if entry_status(entry) == "due")
    today_count = 0
    for entry in entries:
        try:
            if parse_reminder(entry.reminder_at).date() == today:
                today_count += 1
        except ValueError:
            pass

    return render_template(
        "index.html",
        entries=entries,
        total=total,
        completed=completed,
        due=due,
        today_count=today_count,
        current_datetime=datetime.now().strftime("%Y-%m-%dT%H:%M"),
    )


@app.post("/add")
def add_entry():
    title = request.form["title"].strip()
    subject = request.form["subject"].strip() or "General"
    notes = request.form["notes"].strip()
    reminder_at = request.form["reminder_at"].strip()

    if title and reminder_at:
        entries = load_entries()
        entries.append(
            DiaryEntry(
                id=str(uuid4()),
                title=title,
                subject=subject,
                notes=notes,
                reminder_at=reminder_at,
                created_at=now_text(),
            )
        )
        save_entries(entries)

    return redirect(url_for("index"))


@app.post("/complete/<entry_id>")
def complete_entry(entry_id: str):
    entries = load_entries()
    for entry in entries:
        if entry.id == entry_id:
            entry.completed = not entry.completed
            break
    save_entries(entries)
    return redirect(url_for("index"))


@app.post("/delete/<entry_id>")
def delete_entry(entry_id: str):
    entries = [entry for entry in load_entries() if entry.id != entry_id]
    save_entries(entries)
    return redirect(url_for("index"))


if __name__ == "__main__":
    app.run(debug=True)
