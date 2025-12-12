import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Animated, PanResponder, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/useTheme';
import { typography } from '../theme/typography';

interface BlindsControlProps {
  onOpen: () => Promise<void>;
  onClose: () => Promise<void>;
  onStop: () => Promise<void>;
  onPositionChange: (percentage: number) => Promise<void>;
  onPositionRefresh?: () => Promise<number>;
  loading?: boolean;
  disabled?: boolean;
  currentPosition?: number; // 0-100 or -1 if unknown
  direction?: number; // -1 = closing, 0 = stopped, 1 = opening
  onPositionDisplayReady?: (element: React.ReactNode) => void; // Callback to pass position display to header
  onDragStateChange?: (isDragging: boolean) => void; // Callback to notify parent about drag state
  onDragPercentageChange?: (percentage: number) => void; // Callback to notify parent about current percentage during drag
  mockMode?: boolean; // Mock mode for testing design without API calls
}

const BlindsControl: React.FC<BlindsControlProps> = ({
  onOpen,
  onClose,
  onStop,
  onPositionChange,
  onPositionRefresh,
  loading = false,
  disabled = false,
  currentPosition = -1,
  direction = 0,
  onPositionDisplayReady,
  onDragStateChange,
  onDragPercentageChange,
  mockMode = false,
}) => {
  const { colors, accentColor } = useTheme();
  const [sliderValue, setSliderValue] = useState(currentPosition >= 0 ? currentPosition : 50);
  const [mockPosition, setMockPosition] = useState(currentPosition >= 0 ? currentPosition : 50);
  const [isMoving, setIsMoving] = useState(direction !== 0);
  const [actionLoading, setActionLoading] = useState<'open' | 'close' | 'stop' | null>(null);
  const positionAnim = React.useRef(new Animated.Value(currentPosition >= 0 ? currentPosition : 50)).current;
  const [isDragging, setIsDragging] = useState(false);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const blindsFrameRef = React.useRef<View>(null);
  const debounceTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const pendingPositionRef = React.useRef<number | null>(null);
  const animationFrameRef = React.useRef<number | null>(null);
  
  const BLINDS_HEIGHT = 200;
  const SLAT_COUNT = 12; // Liczba pasków żaluzji
  
  // Use mock position in mock mode, otherwise use real position
  const effectivePosition = mockMode ? mockPosition : (currentPosition >= 0 ? currentPosition : 50);

  // Update positionAnim when effectivePosition changes (but not during drag)
  useEffect(() => {
    if (!isDragging) {
      setSliderValue(effectivePosition);
      Animated.timing(positionAnim, {
        toValue: effectivePosition,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [effectivePosition, isDragging]);

  // Synchronize isMoving with direction prop from parent
  useEffect(() => {
    // If direction is provided (not in mock mode), use it to determine isMoving
    if (!mockMode) {
      const shouldBeMoving = direction !== 0;
      if (isMoving !== shouldBeMoving) {
        console.log('[BlindsControl] Syncing isMoving with direction:', {
          direction,
          isMoving,
          shouldBeMoving,
          currentPosition,
        });
        setIsMoving(shouldBeMoving);
      }
    }
  }, [direction, mockMode, currentPosition]);

  // Notify parent about drag state changes
  useEffect(() => {
    if (onDragStateChange) {
      onDragStateChange(isDragging);
    }
  }, [isDragging, onDragStateChange]);

  // Cleanup animation frame on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, []);

  // Create position display for header (empty now - moved to main content)
  useEffect(() => {
    if (onPositionDisplayReady) {
      onPositionDisplayReady(null);
    }
  }, [onPositionDisplayReady]);

  const handleOpen = async () => {
    if (disabled || loading || actionLoading) return;
    
    if (mockMode) {
      // Mock: simulate opening (set to 0% - fully open)
      setIsMoving(true);
      setActionLoading('open');
      const targetPosition = 0; // Fully open
      setMockPosition(targetPosition);
      Animated.timing(positionAnim, {
        toValue: targetPosition,
        duration: 1000,
        useNativeDriver: false,
      }).start(() => {
        setIsMoving(false);
        setActionLoading(null);
      });
      return;
    }
    
    setActionLoading('open');
    // Note: isMoving is now controlled by direction prop
    try {
      await onOpen();
    } finally {
      setActionLoading(null);
      // Refresh position after a delay
      if (onPositionRefresh) {
        setTimeout(async () => {
          const pos = await onPositionRefresh();
          if (pos >= 0) {
            setSliderValue(pos);
          }
        }, 1000);
      }
    }
  };

  const handleClose = async () => {
    if (disabled || loading || actionLoading) return;
    
    if (mockMode) {
      // Mock: simulate closing (set to 100% - fully closed)
      setIsMoving(true);
      setActionLoading('close');
      const targetPosition = 100; // Fully closed
      setMockPosition(targetPosition);
      Animated.timing(positionAnim, {
        toValue: targetPosition,
        duration: 1000,
        useNativeDriver: false,
      }).start(() => {
        setIsMoving(false);
        setActionLoading(null);
      });
      return;
    }
    
    setActionLoading('close');
    // Note: isMoving is now controlled by direction prop
    try {
      await onClose();
    } finally {
      setActionLoading(null);
      // Refresh position after a delay
      if (onPositionRefresh) {
        setTimeout(async () => {
          const pos = await onPositionRefresh();
          if (pos >= 0) {
            setSliderValue(pos);
          }
        }, 1000);
      }
    }
  };

  const handleStop = async () => {
    if (disabled || loading || actionLoading) return;
    
    if (mockMode) {
      // Mock: just stop movement
      setIsMoving(false);
      setActionLoading(null);
      return;
    }
    
    setActionLoading('stop');
    try {
      await onStop();
      setIsMoving(false);
    } finally {
      setActionLoading(null);
      // Refresh position
      if (onPositionRefresh) {
        const pos = await onPositionRefresh();
        if (pos >= 0) {
          setSliderValue(pos);
        }
      }
    }
  };

  const handleSliderChange = async (value: number, immediate: boolean = false) => {
    console.log('[BlindsControl] handleSliderChange START:', { value, immediate, mockMode, disabled, loading, actionLoading });
    setSliderValue(value);
    
    if (mockMode) {
      console.log('[BlindsControl] handleSliderChange MOCK MODE - returning early');
      // Mock: update position immediately
      setMockPosition(value);
      setIsMoving(true);
      setTimeout(() => setIsMoving(false), 500);
      return;
    }
    
    // Store pending position
    pendingPositionRef.current = value;
    console.log('[BlindsControl] handleSliderChange stored pending position:', { value });
    
    // Clear existing debounce timer
    if (debounceTimerRef.current) {
      console.log('[BlindsControl] handleSliderChange clearing existing timer');
      clearTimeout(debounceTimerRef.current);
    }
    
    // If immediate (e.g., button press), send right away
    if (immediate) {
      console.log('[BlindsControl] handleSliderChange IMMEDIATE - setting timeout 100ms');
      debounceTimerRef.current = setTimeout(async () => {
        console.log('[BlindsControl] handleSliderChange IMMEDIATE timeout fired, calling sendPositionChange:', { pendingPosition: pendingPositionRef.current });
        await sendPositionChange(pendingPositionRef.current!);
        pendingPositionRef.current = null;
      }, 100); // Small delay even for immediate
      return;
    }
    
    // Debounce: wait 1.5 seconds after last change before sending request
    console.log('[BlindsControl] handleSliderChange DEBOUNCE - setting timeout 1500ms');
    debounceTimerRef.current = setTimeout(async () => {
      console.log('[BlindsControl] handleSliderChange DEBOUNCE timeout fired, calling sendPositionChange:', { pendingPosition: pendingPositionRef.current });
      if (pendingPositionRef.current !== null) {
        await sendPositionChange(pendingPositionRef.current);
        pendingPositionRef.current = null;
      }
    }, 1500);
  };
  
  const sendPositionChange = async (value: number) => {
    console.log('[BlindsControl] sendPositionChange START:', { value, disabled, loading, actionLoading });
    if (disabled || loading || actionLoading) {
      console.log('[BlindsControl] sendPositionChange BLOCKED:', { disabled, loading, actionLoading });
      return;
    }
    
    try {
      // Note: isMoving is now controlled by direction prop, not manually set
      console.log('[BlindsControl] sendPositionChange calling onPositionChange:', { value });
      await onPositionChange(value);
      console.log('[BlindsControl] sendPositionChange onPositionChange completed');
      
      // Refresh position after movement
      if (onPositionRefresh) {
        setTimeout(async () => {
          const pos = await onPositionRefresh();
          if (pos >= 0) {
            setSliderValue(pos);
          }
          // isMoving is controlled by direction prop
        }, 2000);
      }
    } catch (error) {
      // Revert slider on error
      if (currentPosition >= 0) {
        setSliderValue(currentPosition);
      }
      // isMoving is controlled by direction prop
    }
  };

  // Pan responder for dragging blinds
  const blindsFrameLayout = React.useRef({ pageY: 0, height: BLINDS_HEIGHT });
  const gestureStartTime = React.useRef(0);
  const gestureStartPosition = React.useRef({ x: 0, y: 0 });
  const isDraggingRef = React.useRef(false); // Use ref for immediate access in PanResponder
  
  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled && !loading && !actionLoading,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: () => !disabled && !loading && !actionLoading,
      onMoveShouldSetPanResponderCapture: () => !disabled && !loading && !actionLoading,
      onPanResponderGrant: (evt) => {
        // Store values before async operations to avoid null reference
        // Use optional chaining for iOS compatibility
        if (!evt?.nativeEvent?.pageY || evt.nativeEvent.pageY === undefined) {
          return;
        }
        
        const grantPageY = evt.nativeEvent.pageY;
        const grantPageX = evt.nativeEvent.pageX || 0;
        
        // Store start time and position for tap detection
        gestureStartTime.current = Date.now();
        gestureStartPosition.current = { x: grantPageX, y: grantPageY };
        
        isDraggingRef.current = true;
        setIsDragging(true);
        
        // Prevent parent ScrollView from scrolling immediately
        if (onDragStateChange) {
          onDragStateChange(true);
        }
        
        // Re-measure position on grant to ensure accuracy, then update position
        blindsFrameRef.current?.measureInWindow((x, y, width, height) => {
          blindsFrameLayout.current.pageY = y;
          blindsFrameLayout.current.height = height || BLINDS_HEIGHT;
          
          // Now calculate position with accurate measurements (use stored pageY)
          const framePageY = y;
          const frameHeight = height || BLINDS_HEIGHT;
          const relativeY = grantPageY - framePageY;
          const clampedY = Math.max(0, Math.min(frameHeight, relativeY));
          // Top (0) = 0% closed (open), bottom (frameHeight) = 100% closed
          const percentage = Math.round((clampedY / frameHeight) * 100);
          
          // Notify parent about current percentage during drag
          if (onDragPercentageChange) {
            onDragPercentageChange(percentage);
          }
          
          if (mockMode) {
            setMockPosition(percentage);
          } else {
            setSliderValue(percentage);
          }
          // Set value directly without animation for instant feedback
          positionAnim.setValue(percentage);
        });
      },
      onPanResponderMove: (evt, gestureState) => {
        if (!isDraggingRef.current) {
          // If we're not dragging yet but should be, start dragging
          isDraggingRef.current = true;
          setIsDragging(true);
          if (onDragStateChange) {
            onDragStateChange(true);
          }
        }
        
        // Store values before requestAnimationFrame to avoid null reference
        // Use optional chaining and check multiple times for iOS compatibility
        if (!evt?.nativeEvent?.pageY) {
          return;
        }
        
        const pageY = evt.nativeEvent.pageY;
        if (!pageY && pageY !== 0) {
          return;
        }
        
        const framePageY = blindsFrameLayout.current.pageY;
        const frameHeight = blindsFrameLayout.current.height || BLINDS_HEIGHT;
        const relativeY = pageY - framePageY;
        const clampedY = Math.max(0, Math.min(frameHeight, relativeY));
        // Top (0) = 0% closed (open), bottom (frameHeight) = 100% closed
        const percentage = Math.round((clampedY / frameHeight) * 100);
        
        // Cancel any pending animation frame
        if (animationFrameRef.current !== null) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        
        // Use requestAnimationFrame for smooth updates on Android
        animationFrameRef.current = requestAnimationFrame(() => {
          // Notify parent about current percentage during drag
          if (onDragPercentageChange) {
            onDragPercentageChange(percentage);
          }
          
          console.log('[BlindsControl] onPanResponderMove:', {
            pageY,
            framePageY,
            frameHeight,
            relativeY,
            clampedY,
            percentage,
          });
          
          // Update position immediately during drag (no animation - instant feedback)
          if (mockMode) {
            setMockPosition(percentage);
          } else {
            setSliderValue(percentage);
          }
          // Set value directly without animation for smooth drag
          positionAnim.setValue(percentage);
        });
      },
      onPanResponderRelease: async (evt, gestureState) => {
        // Store values before async operations to avoid null reference
        // Use optional chaining for iOS compatibility
        if (!evt?.nativeEvent?.pageY || evt.nativeEvent.pageY === undefined) {
          // Reset dragging state even if evt is null
          isDraggingRef.current = false;
          setIsDragging(false);
          if (onDragStateChange) {
            onDragStateChange(false);
          }
          return;
        }
        
        const gestureDuration = Date.now() - gestureStartTime.current;
        const totalMovement = Math.sqrt(gestureState.dx ** 2 + gestureState.dy ** 2);
        
        // Detect tap: short duration and minimal movement
        const isTap = gestureDuration < 200 && totalMovement < 10;
        
        // Check if there was actual dragging movement (more than 5px)
        const wasDragging = isDraggingRef.current || totalMovement > 5;
        
        const pageY = evt.nativeEvent.pageY;
        const framePageY = blindsFrameLayout.current.pageY;
        const frameHeight = blindsFrameLayout.current.height || BLINDS_HEIGHT;
        const relativeY = pageY - framePageY;
        const clampedY = Math.max(0, Math.min(frameHeight, relativeY));
        // Top (0) = 0% closed (open), bottom (frameHeight) = 100% closed
        const percentage = Math.round((clampedY / frameHeight) * 100);
        
        console.log('[BlindsControl] onPanResponderRelease:', {
          pageY,
          framePageY,
          frameHeight,
          relativeY,
          clampedY,
          percentage,
          gestureDuration,
          totalMovement,
          isTap,
          wasDragging,
          currentPosition,
        });
        
        // Reset dragging state
        isDraggingRef.current = false;
        setIsDragging(false);
        
        // Cancel any pending animation frame
        if (animationFrameRef.current !== null) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        
        // Re-enable parent ScrollView scrolling
        if (onDragStateChange) {
          onDragStateChange(false);
        }
        
        // Clear any pending debounce timer
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
          debounceTimerRef.current = null;
        }
        
        // If it was a tap (no dragging), send immediately
        if (isTap && !wasDragging) {
          console.log('[BlindsControl] Sending TAP request with percentage:', percentage);
          await handleSliderChange(percentage, true);
          return;
        }
        
        // If there was dragging movement, always send request on release
        if (wasDragging) {
          console.log('[BlindsControl] Sending DRAG request with percentage:', percentage);
          await handleSliderChange(percentage, true);
          return;
        }
      },
      onPanResponderTerminate: () => {
        isDraggingRef.current = false;
        setIsDragging(false);
        
        // Cancel any pending animation frame
        if (animationFrameRef.current !== null) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        
        // Re-enable parent ScrollView scrolling
        if (onDragStateChange) {
          onDragStateChange(false);
        }
      },
    })
  ).current;
  
  const handleBlindsFrameLayout = (event: any) => {
    const { y, height } = event.nativeEvent.layout;
    blindsFrameRef.current?.measureInWindow((x, pageY, width, measuredHeight) => {
      blindsFrameLayout.current.pageY = pageY;
      blindsFrameLayout.current.height = measuredHeight || height || BLINDS_HEIGHT;
      console.log('[BlindsControl] Frame layout updated:', {
        pageY,
        height: measuredHeight || height || BLINDS_HEIGHT,
      });
    });
  };

  const handleSlatPress = async (slatIndex: number) => {
    if (disabled || loading || actionLoading || isDragging) return;
    
    // Calculate position: slatIndex 0 (top) = 0% closed (fully open), last slat (bottom) = 100% closed
    // currentPosition: 0% = fully open, 100% = fully closed
    // Top = open (0%), bottom = closed (100%)
    let closedPercentage: number;
    if (slatIndex === 0) {
      closedPercentage = 0; // Top slat = fully open
    } else if (slatIndex === SLAT_COUNT - 1) {
      closedPercentage = 100; // Bottom slat = fully closed
    } else {
      // Proportional: higher slatIndex = higher percentage (more closed)
      closedPercentage = Math.round((slatIndex / (SLAT_COUNT - 1)) * 100);
    }
    
    console.log('[BlindsControl] handleSlatPress:', { slatIndex, closedPercentage, SLAT_COUNT });
    
    // For tap/click, send immediately (but still with small debounce)
    await handleSliderChange(closedPercentage, true);
  };

  const getPositionText = () => {
    if (currentPosition < 0) return 'Pozycja nieznana';
    return `${Math.round(currentPosition)}%`;
  };

  const isButtonDisabled = disabled || loading || !!actionLoading;
  const closedPercentage = currentPosition >= 0 ? currentPosition : 0;

  const closedHeight = positionAnim.interpolate({
    inputRange: [0, 100],
    outputRange: [0, BLINDS_HEIGHT],
  });

  const getStatusText = () => {
    if (effectivePosition < 0) return 'Stan nieznany';
    if (effectivePosition === 0) return 'Całkowicie otwarte';
    if (effectivePosition === 100) return 'Całkowicie zamknięte';
    if (effectivePosition < 30) return 'Prawie otwarte';
    if (effectivePosition > 70) return 'Prawie zamknięte';
    return 'Pośrednie';
  };

  return (
    <View style={styles.container}>
      {/* Current Status Card - Simplified */}
      <View style={[styles.statusCard, { backgroundColor: colors.card, borderColor: colors.border + '30' }]}>
        <View style={styles.statusCardContent}>
          <MaterialIcons name="blinds" size={20} color={colors.accent} style={{ opacity: 0.9 }} />
          <Text style={[styles.statusCardStatus, { color: colors.textPrimary }]}>{getStatusText()}</Text>
        </View>
      </View>

      {/* Main Control Area - Interactive Blinds */}
      <View style={[styles.mainControlArea, { backgroundColor: colors.card, borderColor: colors.border + '40' }]}>
        <View 
          ref={blindsFrameRef}
          style={[styles.blindsFrame, { backgroundColor: colors.background, borderColor: colors.border }]} 
          onLayout={handleBlindsFrameLayout}
          {...panResponder.panHandlers}
          onTouchStart={(e) => {
            // Store initial touch position
            const { pageY } = e.nativeEvent;
            setTouchStartY(pageY);
          }}
        >
          {/* Closed part from top with gradient */}
          <Animated.View
            style={[
              styles.blindsClosedArea,
              {
                height: closedHeight,
              },
            ]}
          >
            <LinearGradient
              colors={[colors.accent + 'DD', colors.accent + 'AA', colors.accent + '88']}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>

          {/* Interactive horizontal slats */}
          {Array.from({ length: SLAT_COUNT }).map((_, index) => {
            const slatHeight = BLINDS_HEIGHT / SLAT_COUNT;
            const slatTop = index * slatHeight;
            const closedHeight = (effectivePosition / 100) * BLINDS_HEIGHT;
            const slatClosed = slatTop < closedHeight;
            const isNearClosed = Math.abs(slatTop - closedHeight) < slatHeight;
            
            return (
              <View
                key={index}
                style={[
                  styles.blindSlat,
                  {
                    top: slatTop,
                    backgroundColor: slatClosed 
                      ? colors.accent + 'E6' 
                      : isNearClosed 
                        ? colors.accent + '50' 
                        : colors.accent + '25',
                    borderTopColor: slatClosed ? colors.accent + 'FF' : colors.accent + '60',
                    borderBottomColor: slatClosed ? colors.accent + 'CC' : colors.accent + '40',
                  },
                ]}
                pointerEvents="none"
              >
                <View style={[
                  styles.slatContent, 
                  { 
                    backgroundColor: slatClosed 
                      ? colors.accent + 'FF' 
                      : colors.accent + '30',
                    opacity: slatClosed ? 1 : 0.4,
                    borderRadius: 2,
                  }
                ]} />
              </View>
            );
          })}

          {/* Position indicator line */}
          <Animated.View
            style={[
              styles.blindsIndicatorLine,
              {
                top: closedHeight,
                backgroundColor: colors.accent,
              },
            ]}
          />

        </View>

        {/* Position labels on the right - reversed (0% top, 100% bottom) */}
        <View style={styles.positionLabels}>
          <Text style={[styles.positionLabel, { color: colors.textSecondary }]}>0%</Text>
          <View style={styles.positionLabelSpacer} />
          <Text style={[styles.positionLabel, { color: colors.textSecondary }]}>50%</Text>
          <View style={styles.positionLabelSpacer} />
          <Text style={[styles.positionLabel, { color: colors.textSecondary }]}>100%</Text>
        </View>
      </View>

      {/* Control Buttons - Header Style */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={[
            styles.button,
            styles.headerStyleButton,
            { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
            isButtonDisabled && styles.buttonDisabled,
          ]}
          onPress={handleOpen}
          disabled={isButtonDisabled}
          activeOpacity={0.7}
        >
          {actionLoading === 'open' ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <MaterialIcons name="keyboard-arrow-up" size={24} color="#FFFFFF" style={{ opacity: 0.9 }} />
              <Text style={styles.headerButtonText}>Otwórz</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            styles.headerStyleButton,
            { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
            isButtonDisabled && styles.buttonDisabled,
          ]}
          onPress={handleStop}
          disabled={isButtonDisabled}
          activeOpacity={0.7}
        >
          {actionLoading === 'stop' ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <MaterialIcons name="stop" size={24} color="#FFFFFF" style={{ opacity: 0.9 }} />
              <Text style={styles.headerButtonText}>Stop</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            styles.headerStyleButton,
            { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
            isButtonDisabled && styles.buttonDisabled,
          ]}
          onPress={handleClose}
          disabled={isButtonDisabled}
          activeOpacity={0.7}
        >
          {actionLoading === 'close' ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <MaterialIcons name="keyboard-arrow-down" size={24} color="#FFFFFF" style={{ opacity: 0.9 }} />
              <Text style={styles.headerButtonText}>Zamknij</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Status Indicator */}
      {isMoving && (
        <View style={[styles.statusIndicator, { backgroundColor: colors.accent + '20' }]}>
          <ActivityIndicator size="small" color={colors.accent} />
          <Text style={[styles.statusText, { color: colors.accent }]}>
            Ruch w toku...
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 0,
  },
  statusCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  statusCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusCardStatus: {
    fontSize: 14,
    fontFamily: typography.fontFamily.medium,
  },
  mainControlArea: {
    flexDirection: 'row',
    borderRadius: 24,
    padding: 32, // Increased from 24 to 32 for better touch area
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    height: 260,
    borderWidth: 1,
  },
  blindsFrame: {
    flex: 1,
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  blindsClosedArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    width: '100%',
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  blindSlat: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 18, // 200 / 12 + 2
    borderTopWidth: 1.5,
    borderBottomWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 1,
    elevation: 0.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  slatContent: {
    width: '95%',
    height: '55%',
    borderRadius: 2,
  },
  blindsIndicatorLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 5,
    width: '100%',
    borderRadius: 3,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8,
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
    borderBottomColor: 'rgba(0, 0, 0, 0.2)',
  },
  positionLabels: {
    width: 55,
    marginLeft: 20,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingVertical: 8,
  },
  positionLabel: {
    fontSize: 12,
    fontFamily: typography.fontFamily.semiBold,
    opacity: 0.7,
  },
  positionLabelSpacer: {
    flex: 1,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 10,
  },
  button: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 70,
  },
  headerStyleButton: {
    // Styled via backgroundColor prop (rgba(255, 255, 255, 0.2))
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  headerButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginTop: 4,
    fontFamily: typography.fontFamily.semiBold,
    opacity: 0.9,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 10,
    gap: 8,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 13,
    fontFamily: typography.fontFamily.medium,
  },
});

export default BlindsControl;

