#include "GateController.h"

GateController::GateController(uint8_t relay, uint8_t sensor, String name) {
  relayPin = relay;
  sensorPin = sensor;
  gateName = name;
  currentState = GATE_UNKNOWN;
  sensorEnabled = (sensor > 0);
  lastActionTime = 0;
  lastSensorReadTime = 0;
  lastSensorState = false;
  openTime = 0;
  autoCloseArmed = false;
  relayActivatedTime = 0;
  relayActive = false;
}

void GateController::begin() {
  // Setup relay pin
  pinMode(relayPin, OUTPUT);
  if (RELAY_ACTIVE_LOW) {
    digitalWrite(relayPin, HIGH); // OFF state for active-low relay
  } else {
    digitalWrite(relayPin, LOW);  // OFF state for active-high relay
  }
  
  // Small delay to ensure relay stabilizes in OFF state
  delay(10);
  
  // Setup sensor pin if enabled
  if (sensorEnabled) {
    pinMode(sensorPin, INPUT_PULLUP);
    lastSensorState = readSensor();
  }
  
  #if ENABLE_SERIAL_LOG
  Serial.print("Gate Controller initialized: ");
  Serial.println(gateName);
  Serial.print("  Relay Pin: ");
  Serial.println(relayPin);
  if (sensorEnabled) {
    Serial.print("  Sensor Pin: ");
    Serial.println(sensorPin);
  } else {
    Serial.println("  Sensor: Disabled");
  }
  #endif
}

void GateController::update() {
  // SAFETY: Check if relay has been active too long (max 2 seconds)
  // This prevents relay from staying on if code crashes or hangs
  if (relayActive && millis() - relayActivatedTime > 2000) {
    #if ENABLE_SERIAL_LOG
    Serial.print("WARNING: Relay for ");
    Serial.print(gateName);
    Serial.println(" has been active too long! Forcing OFF.");
    #endif
    
    // Force relay OFF
    if (RELAY_ACTIVE_LOW) {
      digitalWrite(relayPin, HIGH);
    } else {
      digitalWrite(relayPin, LOW);
    }
    relayActive = false;
    relayActivatedTime = 0;
  }
  
  // Read sensor state with debouncing
  if (sensorEnabled && millis() - lastSensorReadTime > SENSOR_DEBOUNCE_TIME) {
    bool newSensorState = readSensor();
    
    if (newSensorState != lastSensorState) {
      lastSensorState = newSensorState;
      
      // Update state based on sensor
      if (newSensorState) {
        currentState = GATE_CLOSED;
        autoCloseArmed = false;
      } else {
        currentState = GATE_OPEN;
        if (ENABLE_AUTO_CLOSE) {
          openTime = millis();
          autoCloseArmed = true;
        }
      }
      
      #if ENABLE_SERIAL_LOG && LOG_LEVEL >= 3
      Serial.print("Gate ");
      Serial.print(gateName);
      Serial.print(" state changed: ");
      Serial.println(getStateString());
      #endif
    }
    
    lastSensorReadTime = millis();
  }
  
  // Auto-close feature
  if (ENABLE_AUTO_CLOSE && autoCloseArmed && currentState == GATE_OPEN) {
    if (millis() - openTime > AUTO_CLOSE_DELAY) {
      #if ENABLE_SERIAL_LOG
      Serial.print("Auto-closing gate: ");
      Serial.println(gateName);
      #endif
      trigger();
      autoCloseArmed = false;
    }
  }
}

void GateController::trigger() {
  #if ENABLE_SERIAL_LOG && LOG_LEVEL >= 3
  Serial.print("Triggering gate: ");
  Serial.println(gateName);
  #endif
  
  // Activate relay
  if (RELAY_ACTIVE_LOW) {
    digitalWrite(relayPin, LOW);
  } else {
    digitalWrite(relayPin, HIGH);
  }
  
  // Track relay activation for safety
  relayActive = true;
  relayActivatedTime = millis();
  
  // Hold for pulse duration
  delay(RELAY_PULSE_DURATION);
  
  // Deactivate relay
  if (RELAY_ACTIVE_LOW) {
    digitalWrite(relayPin, HIGH);
  } else {
    digitalWrite(relayPin, LOW);
  }
  
  // Mark relay as inactive
  relayActive = false;
  relayActivatedTime = 0;
  
  lastActionTime = millis();
  
  // Update state if no sensor
  if (!sensorEnabled) {
    if (currentState == GATE_CLOSED || currentState == GATE_UNKNOWN) {
      currentState = GATE_OPENING;
    } else {
      currentState = GATE_CLOSING;
    }
  }
}

void GateController::open() {
  if (currentState != GATE_OPEN && currentState != GATE_OPENING) {
    trigger();
  }
}

void GateController::close() {
  if (currentState != GATE_CLOSED && currentState != GATE_CLOSING) {
    trigger();
  }
}

void GateController::stop() {
  // For gates that support stop command (trigger again)
  trigger();
}

GateState GateController::getState() {
  return currentState;
}

String GateController::getStateString() {
  switch (currentState) {
    case GATE_OPEN: return "open";
    case GATE_CLOSED: return "closed";
    case GATE_OPENING: return "opening";
    case GATE_CLOSING: return "closing";
    default: return "unknown";
  }
}

bool GateController::isOpen() {
  return currentState == GATE_OPEN;
}

bool GateController::isClosed() {
  return currentState == GATE_CLOSED;
}

bool GateController::readSensor() {
  if (!sensorEnabled) return false;
  
  bool state = digitalRead(sensorPin);
  
  // Invert if sensor is active-low
  if (SENSOR_ACTIVE_LOW) {
    state = !state;
  }
  
  return state;
}

bool GateController::hasSensor() {
  return sensorEnabled;
}

String GateController::getName() {
  return gateName;
}

unsigned long GateController::getLastActionTime() {
  return lastActionTime;
}

