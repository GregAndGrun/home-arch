import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Animated, PanResponder, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/useTheme';
import { typography } from '../theme/typography';
import { GateType } from '../types';
import { generateGradient, hexToRgba } from '../theme/colors';

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
  gateType?: GateType; // Gate type to determine window style (fix vs taras)
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
  gateType,
}) => {
  const { colors, accentColor } = useTheme();
  const [sliderValue, setSliderValue] = useState(currentPosition >= 0 ? currentPosition : 50);
  const [mockPosition, setMockPosition] = useState(currentPosition >= 0 ? currentPosition : 50);
  const [isMoving, setIsMoving] = useState(direction !== 0);
  const [actionLoading, setActionLoading] = useState<'open' | 'close' | 'stop' | null>(null);
  const positionAnim = React.useRef(new Animated.Value(currentPosition >= 0 ? currentPosition : 50)).current;
  
  // Determine time of day for window background
  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 10) return 'morning'; // 5-10
    if (hour >= 10 && hour < 15) return 'noon'; // 10-15
    if (hour >= 15 && hour < 19) return 'afternoon'; // 15-19
    return 'evening'; // 19-5
  };
  
  const timeOfDay = getTimeOfDay();
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
          {/* Window background - sky, sun/moon, clouds, stars */}
          <View style={styles.windowBackground}>
            {/* Sky gradient - changes based on time of day */}
            <LinearGradient
              colors={
                timeOfDay === 'morning' 
                  ? ['#87CEEB', '#B0E0E6', '#E0F6FF'] // Soft morning blue
                  : timeOfDay === 'noon'
                  ? ['#4A90E2', '#87CEEB', '#DDEEFF'] // Clear bright blue sky
                  : timeOfDay === 'afternoon'
                  ? ['#FF7F50', '#FFA07A', '#FFD4A3'] // Warm coral sunset
                  : ['#0F1419', '#1A2332', '#253447'] // Deep navy night
              }
              style={StyleSheet.absoluteFill}
            />
            
            {/* Sun/Moon - changes based on time of day with better positioning */}
            {timeOfDay === 'morning' ? (
              <View style={[styles.sun, { top: 40, right: 35, backgroundColor: '#FFD700', shadowColor: '#FFD700' }]} />
            ) : timeOfDay === 'noon' ? (
              <View style={[styles.sun, { top: 20, right: '45%', backgroundColor: '#FFA500', shadowColor: '#FFA500' }]} />
            ) : timeOfDay === 'afternoon' ? (
              <View style={[styles.sun, { top: 50, left: 30, backgroundColor: '#FF4500', shadowColor: '#FF4500', opacity: 0.8 }]} />
            ) : (
              <View style={[styles.moon, { top: 30, right: 40 }]}>
                <View style={styles.moonCrater1} />
                <View style={styles.moonCrater2} />
              </View>
            )}
            
            {/* Clouds - only during day, varies by time */}
            {timeOfDay === 'morning' && (
              <>
                <View style={[styles.cloud1, { backgroundColor: 'rgba(255, 182, 193, 0.5)' }]} />
                <View style={[styles.cloud2, { backgroundColor: 'rgba(255, 218, 185, 0.6)' }]} />
              </>
            )}
            {timeOfDay === 'noon' && (
              <>
                <View style={styles.cloud1} />
                <View style={styles.cloud2} />
                <View style={styles.cloud3} />
              </>
            )}
            {timeOfDay === 'afternoon' && (
              <>
                <View style={[styles.cloud1, { backgroundColor: 'rgba(255, 140, 0, 0.3)' }]} />
                <View style={[styles.cloud3, { backgroundColor: 'rgba(255, 165, 0, 0.4)' }]} />
              </>
            )}
            
            {/* Stars - only during evening, more visible */}
            {timeOfDay === 'evening' && (
              <>
                <View style={styles.star1} />
                <View style={styles.star2} />
                <View style={styles.star3} />
                <View style={styles.star4} />
                <View style={styles.star5} />
                <View style={styles.star6} />
              </>
            )}
          </View>
          
          {/* Sunlight effect from top - only on open parts */}
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.08)', 'transparent']}
            style={[StyleSheet.absoluteFill, { height: BLINDS_HEIGHT * 0.4 }]}
            pointerEvents="none"
          />
          
          {/* Double window - vertical divider in the middle */}
          <View style={styles.windowDivider} />
          
          {/* Window frame overlay effect - white frame */}
          <View style={styles.windowFrame} />
          
          {/* Handle for taras (terrace) - only show for LIVING_ROOM_TERRACE, centered */}
          {gateType === GateType.LIVING_ROOM_TERRACE && (
            <View style={styles.windowHandleCentered} />
          )}

          {/* Closed part from top with realistic material gradient */} 
          <Animated.View
            style={[
              styles.blindsClosedArea, 
              {
                height: closedHeight,
              },
            ]}
          >
            <LinearGradient
              colors={[
                colors.accent + 'F0', // Top - more opaque
                colors.accent + 'D8', // Middle
                colors.accent + 'C0', // Bottom - slightly lighter
              ]}
              style={StyleSheet.absoluteFill}
            />
            {/* Material texture overlay for closed area */}
            <View style={styles.materialTexture} />
          </Animated.View>

          {/* Interactive horizontal slats with realistic 3D effect - only show closed slats */}
          {Array.from({ length: SLAT_COUNT }).map((_, index) => {
            const slatHeight = BLINDS_HEIGHT / SLAT_COUNT;
            const slatTop = index * slatHeight;
            const closedHeight = (effectivePosition / 100) * BLINDS_HEIGHT;
            const slatClosed = slatTop < closedHeight;
            
            // Only render slats that are closed (or very close to closed)
            if (!slatClosed) {
              return null;
            }
            
            return (
              <View
                key={index}
                style={[
                  styles.blindSlat,
                  {
                    top: slatTop,
                    backgroundColor: colors.accent + 'E8',
                    borderTopColor: colors.accent + 'FF',
                    borderBottomColor: colors.accent + 'CC',
                    shadowOpacity: 0.2,
                  },
                ]}
                pointerEvents="none"
              >
                {/* Main slat body with 3D effect */}
                <LinearGradient
                  colors={[
                    colors.accent + 'FF', // Top highlight
                    colors.accent + 'E8', // Middle
                    colors.accent + 'D0', // Bottom shadow
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={styles.slatGradient}
                />
                
                {/* Slat highlight for 3D depth */}
                <View style={[
                  styles.slatHighlight,
                  {
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  }
                ]} />
                
                {/* Slat shadow for depth */}
                <View style={[
                  styles.slatShadow,
                  {
                    backgroundColor: 'rgba(0, 0, 0, 0.1)',
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

      {/* Control Buttons - Modern Style */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={[
            styles.button,
            isButtonDisabled && styles.buttonDisabled,
          ]}
          onPress={handleOpen}
          disabled={isButtonDisabled}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={isButtonDisabled 
              ? [hexToRgba(colors.accent, 0.3), hexToRgba(colors.accent, 0.2)]
              : generateGradient(colors.accent)
            }
            style={styles.buttonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {actionLoading === 'open' ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <MaterialIcons name="keyboard-arrow-up" size={22} color="#FFFFFF" />
                <Text style={styles.buttonText}>Otwórz</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            isButtonDisabled && styles.buttonDisabled,
          ]}
          onPress={handleStop}
          disabled={isButtonDisabled}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={isButtonDisabled 
              ? [hexToRgba(colors.textSecondary, 0.3), hexToRgba(colors.textSecondary, 0.2)]
              : [hexToRgba(colors.textSecondary, 0.4), hexToRgba(colors.textSecondary, 0.3)]
            }
            style={styles.buttonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {actionLoading === 'stop' ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <MaterialIcons name="stop" size={22} color="#FFFFFF" />
                <Text style={styles.buttonText}>Stop</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            isButtonDisabled && styles.buttonDisabled,
          ]}
          onPress={handleClose}
          disabled={isButtonDisabled}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={isButtonDisabled 
              ? [hexToRgba(colors.accent, 0.3), hexToRgba(colors.accent, 0.2)]
              : generateGradient(colors.accent)
            }
            style={styles.buttonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {actionLoading === 'close' ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <MaterialIcons name="keyboard-arrow-down" size={22} color="#FFFFFF" />
                <Text style={styles.buttonText}>Zamknij</Text>
              </>
            )}
          </LinearGradient>
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
  windowBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  sun: {
    position: 'absolute',
    top: 20,
    right: 30,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 5,
  },
  cloud1: {
    position: 'absolute',
    top: 25,
    left: 20,
    width: 35,
    height: 20,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  cloud2: {
    position: 'absolute',
    top: 30,
    left: 50,
    width: 45,
    height: 25,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  cloud3: {
    position: 'absolute',
    top: 35,
    right: 20,
    width: 30,
    height: 18,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
  },
  star1: {
    position: 'absolute',
    top: 30,
    left: 30,
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#FFFFFF',
  },
  star2: {
    position: 'absolute',
    top: 40,
    right: 40,
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#FFFFFF',
  },
  star3: {
    position: 'absolute',
    top: 50,
    left: '45%',
    width: 2.5,
    height: 2.5,
    borderRadius: 1.25,
    backgroundColor: '#FFFFFF',
  },
  star4: {
    position: 'absolute',
    top: 60,
    right: 50,
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#FFFFFF',
  },
  star5: {
    position: 'absolute',
    top: 45,
    left: '60%',
    width: 2.5,
    height: 2.5,
    borderRadius: 1.25,
    backgroundColor: '#FFFFFF',
    opacity: 0.8,
  },
  star6: {
    position: 'absolute',
    top: 70,
    left: '25%',
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#FFFFFF',
    opacity: 0.9,
  },
  moon: {
    position: 'absolute',
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: '#F0E68C',
    shadowColor: '#F0E68C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 5,
  },
  moonCrater1: {
    position: 'absolute',
    top: 8,
    left: 10,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E6D68A',
  },
  moonCrater2: {
    position: 'absolute',
    bottom: 10,
    right: 8,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#E6D68A',
  },
  windowFrame: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 8,
    borderColor: '#FFFFFF', // White frame
    borderRadius: 16,
    pointerEvents: 'none',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  windowDivider: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '50%',
    width: 6,
    marginLeft: -3, // Center the divider
    backgroundColor: '#FFFFFF', // White divider
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  windowHandle: {
    position: 'absolute',
    top: '50%',
    right: 8,
    width: 12,
    height: 40,
    marginTop: -20, // Center vertically
    backgroundColor: '#C0C0C0', // Silver handle color
    borderRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
    // Handle grip details
    borderWidth: 1,
    borderColor: '#A0A0A0',
  },
  windowHandleCentered: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 8, // Narrower - handle shape
    height: 50, // Longer - handle shape
    marginTop: -25, // Center vertically
    marginLeft: -4, // Center horizontally
    backgroundColor: '#FFFFFF', // White handle
    borderRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
    // Handle shape - curved ends
    borderWidth: 0,
  },
  blindsClosedArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    width: '100%',
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    overflow: 'hidden',
  },
  materialTexture: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    opacity: 0.15,
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
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    overflow: 'hidden',
  },
  slatGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  slatHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '30%',
    borderTopLeftRadius: 1,
    borderTopRightRadius: 1,
  },
  slatShadow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '20%',
    borderBottomLeftRadius: 1,
    borderBottomRightRadius: 1,
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
    marginBottom: 16,
    gap: 12,
  },
  button: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    minHeight: 64,
  },
  buttonGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    gap: 6,
  },
  buttonDisabled: {
    opacity: 0.6,
    elevation: 1,
    shadowOpacity: 0.1,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: typography.fontFamily.semiBold,
    letterSpacing: 0.3,
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


