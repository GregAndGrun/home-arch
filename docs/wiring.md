# Wiring Diagrams - Smart Gate Control System

## Table of Contents

1. [Component Overview](#component-overview)
2. [Basic Wiring Diagram](#basic-wiring-diagram)
3. [Detailed Connection Guide](#detailed-connection-guide)
4. [Multiple Gate Setup](#multiple-gate-setup)
5. [Optional Sensors](#optional-sensors)
6. [Safety Considerations](#safety-considerations)

## Component Overview

### ESP32 DevKit Pinout

```
                    ┌─────────────┐
                    │     USB     │
                    └─────────────┘
     ┌──────────────────┬┴┬──────────────────┐
     │                  │ │                  │
EN   │1              ┌──┘ └──┐           36│ VP
VP   │2              │  ESP  │           39│ VN
VN   │3              │  32   │           34│
D34  │4              │       │           35│
D35  │5              └───────┘           32│ D32
D32  │6                                  33│ D33
D33  │7                                  25│ D25
D25  │8                                  26│ D26
D26  │9                                  27│ D27
D27  │10                                 14│ D14
D14  │11                                 12│ D12
D12  │12                                 13│ D13
GND  │13                                  9│ RX
D13  │14                                 10│ TX
D9   │15                                 11│ D11
D10  │16                                  8│ D8
D11  │17                                  7│ D7
VIN  │18                                  6│ D6
GND  │19                                  5│ D5
3V3  │20                                  4│ D4
D22  │21                                  0│ D0
D19  │22                                  2│ D2 (LED)
D18  │23                                 15│ D15
D5   │24                                  8│ D8
D17  │25                                 16│ D16 (RX2)
D16  │26                                 17│ D17 (TX2)
D4   │27                                 21│ D21
D0   │28                                  3│ RX0
D2   │29                                  1│ TX0
D15  │30                                GND│
     └──────────────────────────────────────┘
```

### 2-Channel Relay Module

```
┌──────────────────────────┐
│   2-Channel Relay Module  │
├──────────────────────────┤
│  VCC  GND  IN1  IN2      │  ← Control Pins
│                          │
│  ┌────┐        ┌────┐   │
│  │ K1 │        │ K2 │   │  ← Relays
│  └────┘        └────┘   │
│                          │
│  NO1 COM1 NC1           │  ← Relay 1 Outputs
│  NO2 COM2 NC2           │  ← Relay 2 Outputs
└──────────────────────────┘
```

## Basic Wiring Diagram

### Single Gate Setup

```
┌──────────────┐
│   ESP32      │
│  DevKit      │
│              │
│   GPIO16 ────┼─────→ IN1 (Relay Module)
│   GPIO17 ────┼─────→ Reed Switch
│   5V     ────┼─────→ VCC (Relay)
│   GND    ────┼─────→ GND (Relay, Reed Switch)
└──────────────┘

┌──────────────────┐
│  Relay Module    │
│                  │
│  NO1 ──┐         │
│        ├─────────┼────→ To Gate Control (Button +)
│  COM1 ─┘         │
│                  │
│  GND ────────────┼────→ To Gate Control (Button -)
└──────────────────┘

Existing Gate Controller:
┌─────────────────────┐
│  Gate Control Box   │
│                     │
│  Button + ──┬──     │
│             │       │
│  Button - ──┴──     │
│                     │
│  Motor Control      │
└─────────────────────┘
```

### Power Supply Connections

```
┌────────────┐
│  5V/2A     │
│  Power     │
│  Supply    │
│            │
│  +5V  ─────┼─────→ ESP32 VIN or 5V
│            │
│  GND  ─────┼─────→ ESP32 GND
└────────────┘
```

## Detailed Connection Guide

### ESP32 to Relay Module

**Connection Table:**

| ESP32 Pin | Wire Color | Relay Pin | Notes |
|-----------|------------|-----------|-------|
| GPIO 16   | Yellow     | IN1       | Gate 1 control signal |
| GPIO 18   | Orange     | IN2       | Gate 2 control signal |
| 5V        | Red        | VCC       | Power to relay module |
| GND       | Black      | GND       | Common ground |

**Important Notes:**
- Use 20-22 AWG wire for control signals
- Keep wire runs under 1 meter if possible
- Use shielded cable for outdoor runs
- Secure connections with heat shrink or electrical tape

### Relay to Gate Control

**For Most Gates (Momentary Contact):**

```
Existing Setup:          After Installation:

Button                   Button + ESP32 (Parallel)
   ↓                            ↓
┌──┴──┐                   ┌────┴────┐
│     │                   │         │
│  +  │────→ Controller   │  +  ────┼──→ Controller
│     │                   │    │    │
│  -  │────→ GND          │  - ─┼───┼──→ GND
│     │                   │     │   │
└─────┘                   └─────┘   │
                                    │
                          Relay NO ──┘
                          Relay COM ───→ Controller
```

**Step-by-Step:**
1. Identify existing button terminals (usually 2 wires)
2. Connect Relay COM to one terminal (usually positive)
3. Connect Relay NO to the other terminal
4. Existing button remains connected
5. Test existing button still works

### Reed Switch Installation

```
Gate Post (Fixed)           Gate (Moving)
      ↓                           ↓
┌─────────┐                 ┌─────────┐
│  Reed   │                 │         │
│  Switch │← <1cm gap →     │  Magnet │
│         │                 │         │
│  Pin1 ──┼────→ ESP32 GPIO │         │
│  Pin2 ──┼────→ ESP32 GND  │         │
└─────────┘                 └─────────┘

When gate is CLOSED: Reed switch CLOSED (LOW signal)
When gate is OPEN:   Reed switch OPEN (HIGH signal with pull-up)
```

**Mounting Tips:**
- Use strong permanent magnets
- Align reed switch with magnet center
- Test with multimeter before permanent mounting
- Secure with zip ties or mounting screws
- Weatherproof with heat shrink tube

## Multiple Gate Setup

### Two Gates with Single ESP32

```
                     ┌──────────────┐
                     │   ESP32      │
                     │              │
  Gate 1 Relay  ←────┤ GPIO16       │
  Gate 1 Sensor ←────┤ GPIO17       │
  Gate 2 Relay  ←────┤ GPIO18       │
  Gate 2 Sensor ←────┤ GPIO19       │
                     │ 5V      ─────┼───→ Relay VCC
                     │ GND     ─────┼───→ Common GND
                     └──────────────┘
                            │
                            │
              ┌─────────────┴─────────────┐
              │                           │
              ↓                           ↓
    ┌──────────────────┐        ┌──────────────────┐
    │ Relay Module CH1 │        │ Relay Module CH2 │
    │                  │        │                  │
    │ NO1 ─┐           │        │ NO2 ─┐           │
    │      ├───→ Gate1 │        │      ├───→ Gate2 │
    │ COM1 ┘           │        │ COM2 ┘           │
    └──────────────────┘        └──────────────────┘
```

### Two Separate ESP32 Units (One Per Gate)

**Advantages:**
- Independent operation
- Better fault tolerance
- Easier troubleshooting
- Can use different WiFi networks

**Setup:**
```
Home Network (WiFi)
        │
        ├──────────────┬──────────────┐
        │              │              │
   ESP32 #1       ESP32 #2       Mobile App
   (Entrance)     (Garage)       (Controls both)
        │              │
   Gate 1         Gate 2
```

**Configuration:**
- Assign different IP addresses
- Use same authentication credentials
- Configure mobile app with both IPs

## Optional Sensors

### Adding Multiple Reed Switches Per Gate

For gates that need precise position detection:

```
┌─────────────────────────────────────┐
│          Gate Positions             │
├─────────────────────────────────────┤
│                                     │
│  Closed ──┬── Half Open ─┬── Open  │
│           │              │          │
│        Sensor1       Sensor2        │
│           │              │          │
│           └──────┬───────┘          │
│                  │                  │
│             ESP32 GPIO              │
└─────────────────────────────────────┘
```

### PIR Motion Sensor (Optional)

Add motion detection for automatic gate opening:

```
┌──────────────┐
│  PIR Sensor  │
│              │
│  VCC ────────┼──→ ESP32 3.3V
│  OUT ────────┼──→ ESP32 GPIO (e.g., GPIO23)
│  GND ────────┼──→ ESP32 GND
└──────────────┘
```

### Current Sensor (Advanced)

Monitor motor current to detect obstructions:

```
┌────────────────┐
│ ACS712 Current │
│ Sensor Module  │
│                │
│ VCC ──────────┼──→ ESP32 5V
│ OUT ──────────┼──→ ESP32 ADC (GPIO34-39)
│ GND ──────────┼──→ ESP32 GND
│                │
│ Gate Motor ────┼──→ Through sensor
└────────────────┘
```

## Safety Considerations

### Protection Circuits

**Recommended additions for reliability:**

1. **Flyback Diode on Relay Coil:**
```
      Relay Coil
         ┌──┐
    ┌────┤  ├────┐
    │    └──┘    │
    │      │     │
   VCC    ──     GND
          │
        Diode
      (1N4007)
```

2. **Optoisolator for Relay Control:**
```
ESP32 GPIO ───→ Optoisolator ───→ Relay IN
                    │
ESP32 GND  ────────→┘
```

3. **Pull-Down Resistor (CRITICAL for Active-High Relays):**
```
ESP32 GPIO ───→ Relay IN
     │
     └──→ 10kΩ Resistor ───→ GND
```

**Why this is needed:**
- When ESP32 is powered off, GPIO pins are in floating state (undefined)
- For active-HIGH relays, floating can be read as HIGH, activating the relay
- Pull-down resistor (10kΩ) ensures GPIO stays LOW when ESP32 is off
- This prevents relay from blocking gate operation when ESP32 is disconnected

**Installation:**
- Connect 10kΩ resistor between GPIO pin and GND
- Use 1/4W or 1/2W resistor
- Can be soldered directly on relay module or on breadboard

### Grounding

**Proper grounding is essential:**

```
┌─────────────────────────────────────┐
│        Grounding Scheme             │
├─────────────────────────────────────┤
│                                     │
│  Earth Ground                       │
│       │                             │
│       ├──→ Power Supply GND         │
│       ├──→ ESP32 GND                │
│       ├──→ Relay Module GND         │
│       └──→ Gate Controller GND      │
│                                     │
└─────────────────────────────────────┘
```

### Fusing

**Add fuses for protection:**

- 2A fuse on ESP32 power supply
- 10A fuse on gate motor circuit (if adding current sensor)
- Use automotive blade fuses for easy replacement

### Weatherproofing

**For outdoor installations:**

1. IP65 or better enclosures
2. Cable glands for wire entry
3. Silicone sealant on joints
4. Mount enclosure upside-down (prevent water entry)
5. Use outdoor-rated cables

### Cable Management

```
┌──────────────────────────┐
│   Cable Entry Points     │
├──────────────────────────┤
│                          │
│  Top of enclosure:       │
│  ┌────────────────┐      │
│  │ ╱╲  ╱╲  ╱╲  ╱╲ │      │  ← Drip loops
│  │/  \/  \/  \/  \│      │
│  │   Cable glands │      │
│  └────────────────┘      │
│         ││││             │
│      Enclosure           │
│                          │
└──────────────────────────┘
```

## Testing Procedure

### Continuity Testing

Before powering on:

1. **Test relay connections:**
   ```
   Multimeter on continuity mode
   - NO to COM: Open (no beep)
   - COM to NC: Closed (beep)
   - Trigger relay manually
   - NO to COM: Closed (beep)
   ```

2. **Test reed switch:**
   ```
   With magnet far: Open circuit
   With magnet near: Closed circuit
   ```

3. **Test power supply:**
   ```
   Measure output: 5V ±0.25V
   Measure under load: Should not drop below 4.75V
   ```

### Functional Testing

With power on:

1. Upload firmware with `ENABLE_SERIAL_LOG = true`
2. Monitor serial output
3. Verify GPIO states change when triggering
4. Verify relay clicks
5. Test gate movement (STAND CLEAR!)

## Troubleshooting

### Relay Not Switching

**Check:**
- IN signal voltage (should be 3.3V or 5V)
- VCC power to relay (should be 5V)
- Ground connection
- Relay LED indicator (if present)

### Gate Not Responding

**Check:**
- Relay output connections to gate controller
- Existing remote still works
- Parallel connection (not series)
- Gate controller fuses

### Intermittent Operation

**Check:**
- Loose connections
- Voltage drops under load
- WiFi signal strength
- Power supply capacity

## Reference Materials

### Wire Gauge Reference

| Distance | Current | Min Wire Gauge |
|----------|---------|----------------|
| < 1m     | < 1A    | 22 AWG         |
| 1-3m     | < 1A    | 20 AWG         |
| 3-5m     | < 1A    | 18 AWG         |
| < 1m     | 1-2A    | 18 AWG         |

### Component Ratings

- ESP32 GPIO: 40mA max per pin
- ESP32 Total current: 1.2A max
- Relay contacts: Check module specs (usually 10A @ 250VAC)
- Reed switches: Usually 0.5-1A @ 200VDC

## Conclusion

Always prioritize safety:
- Double-check all connections
- Test with multimeter before powering
- Keep backup control methods
- Document your specific setup
- Take photos during installation

For questions, refer to the [Installation Guide](installation.md).

