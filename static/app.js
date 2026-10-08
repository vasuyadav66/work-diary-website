function pad(value) {
  return String(value).padStart(2, "0");
}

function toDateTimeInputValue(date) {
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join("-") + "T" + [
    pad(date.getHours()),
    pad(date.getMinutes()),
  ].join(":");
}

function updateTodayDateTime() {
  const now = new Date();
  const todayDateTime = document.querySelector("#todayDateTime");
  const reminderAt = document.querySelector("#reminderAt");

  if (todayDateTime) {
    todayDateTime.textContent = now.toLocaleString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (reminderAt && !reminderAt.dataset.initialized) {
    reminderAt.value = toDateTimeInputValue(now);
    reminderAt.dataset.initialized = "true";
  }
}

updateTodayDateTime();
setInterval(updateTodayDateTime, 60000);
