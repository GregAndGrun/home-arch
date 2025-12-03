#include "Logger.h"
#include "config.h"
#include <time.h>

struct LogEntry {
  unsigned long millisStamp; // czas od startu (ms)
  time_t unixStamp;          // czas Unix (sekundy), 0 jeśli brak NTP
  String level;
  String message;
};

static LogEntry logBuffer[LOG_BUFFER_SIZE];
static size_t logIndex = 0;
static bool logWrapped = false;

static void appendLog(const String &level, const String &msg) {
  // Zachowaj krótki, żeby nie zjadać za dużo RAM
  String trimmed = msg;
  if (trimmed.length() > LOG_MESSAGE_MAX_LEN) {
    trimmed = trimmed.substring(0, LOG_MESSAGE_MAX_LEN - 3) + "...";
  }

  logBuffer[logIndex].millisStamp = millis();

  time_t now = 0;
  time(&now);
  logBuffer[logIndex].unixStamp = now;
  logBuffer[logIndex].level = level;
  logBuffer[logIndex].message = trimmed;

  logIndex++;
  if (logIndex >= LOG_BUFFER_SIZE) {
    logIndex = 0;
    logWrapped = true;
  }

  // Opcjonalnie loguj także na Serial
  #if ENABLE_SERIAL_LOG
  Serial.print("[");
  Serial.print(level);
  Serial.print("] ");
  Serial.println(trimmed);
  #endif
}

void logInfo(const String &msg) {
  appendLog("INFO", msg);
}

void logWarn(const String &msg) {
  appendLog("WARN", msg);
}

void logError(const String &msg) {
  appendLog("ERROR", msg);
}

String getLogText() {
  String out;
  out.reserve(LOG_BUFFER_SIZE * 40); // przybliżenie

  auto appendLine = [&out](const LogEntry &entry) {
    if (entry.message.length() == 0) {
      return;
    }

    // Format czasu: jeśli mamy NTP, to YYYY-MM-DD HH:MM:SS, w przeciwnym razie sekundy od startu
    if (entry.unixStamp > 1609459200) { // po 2021-01-01
      struct tm timeinfo;
      localtime_r(&entry.unixStamp, &timeinfo);
      char buf[20]; // "YYYY-MM-DD HH:MM:SS"
      strftime(buf, sizeof(buf), "%Y-%m-%d %H:%M:%S", &timeinfo);
      out += buf;
    } else {
      unsigned long seconds = entry.millisStamp / 1000;
      out += String(seconds);
    }

    out += " [";
    out += entry.level;
    out += "] ";
    out += entry.message;
    out += "\n";
  };

  if (logWrapped) {
    // najpierw od aktualnego indeksu do końca
    for (size_t i = logIndex; i < LOG_BUFFER_SIZE; i++) {
      appendLine(logBuffer[i]);
    }
  }

  // potem od początku do aktualnego indeksu
  for (size_t i = 0; i < logIndex; i++) {
    appendLine(logBuffer[i]);
  }

  return out;
}


