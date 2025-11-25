#ifndef GATE_CONTROLLER_H
#define GATE_CONTROLLER_H

#include <Arduino.h>
#include "config.h"

enum GateState {
  GATE_UNKNOWN,
  GATE_OPEN,
  GATE_CLOSED,
  GATE_OPENING,
  GATE_CLOSING
};

class GateController {
private:
  uint8_t relayPin;
  uint8_t sensorPin;
  String gateName;
  GateState currentState;
  bool sensorEnabled;
  
  unsigned long lastActionTime;
  unsigned long lastSensorReadTime;
  bool lastSensorState;
  
  // Auto-close feature
  unsigned long openTime;
  bool autoCloseArmed;
  
  // Safety: Track relay activation time
  unsigned long relayActivatedTime;
  bool relayActive;

public:
  GateController(uint8_t relay, uint8_t sensor, String name);
  
  void begin();
  void update();
  
  // Gate control methods
  void trigger();
  void open();
  void close();
  void stop();
  
  // State methods
  GateState getState();
  String getStateString();
  bool isOpen();
  bool isClosed();
  
  // Sensor methods
  bool readSensor();
  bool hasSensor();
  
  // Info methods
  String getName();
  unsigned long getLastActionTime();
};

#endif // GATE_CONTROLLER_H

