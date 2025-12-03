#ifndef LOGGER_H
#define LOGGER_H

#include <Arduino.h>

// Simple in‑memory circular log buffer + Serial wrapper.
// Goal: możliwość podejrzenia ostatnich logów przez HTTP (/api/logs)

// Ile wpisów trzymamy w pamięci (ostatnie N zdarzeń)
#define LOG_BUFFER_SIZE 256

// Maksymalna długość pojedynczej wiadomości (znaków)
#define LOG_MESSAGE_MAX_LEN 160

void logInfo(const String &msg);
void logWarn(const String &msg);
void logError(const String &msg);

// Zwraca wszystkie logi w formie tekstu (po jednej linii na wpis)
// Format: "<uptime_ms> [LEVEL] message"
String getLogText();

#endif // LOGGER_H


