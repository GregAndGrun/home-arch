import React, { useRef } from 'react';
import { View, PanResponder, Platform, Dimensions } from 'react-native';
import { useTheme } from '../../theme/useTheme';

interface SwipeBackGestureProps {
  onSwipeBack: () => void;
  enabled?: boolean;
  children: React.ReactNode;
}

const SwipeBackGesture: React.FC<SwipeBackGestureProps> = ({
  onSwipeBack,
  enabled = true,
  children,
}) => {
  const { colors } = useTheme();
  const screenWidth = Dimensions.get('window').width;
  const SWIPE_THRESHOLD = screenWidth * 0.25; // 25% of screen width
  const EDGE_THRESHOLD = 20; // 20px from left edge
  const VELOCITY_THRESHOLD = 0.3; // Minimum velocity for swipe
  const startXRef = useRef<number | null>(null);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only respond to gestures starting from the left edge (iOS swipe back gesture)
        if (!enabled || Platform.OS !== 'ios') return false;
        
        const { pageX } = evt.nativeEvent;
        const isFromLeftEdge = pageX <= EDGE_THRESHOLD;
        
        if (isFromLeftEdge) {
          startXRef.current = pageX;
        }
        
        return isFromLeftEdge;
      },
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => {
        if (!enabled || Platform.OS !== 'ios') return false;
        
        const { pageX } = evt.nativeEvent;
        const isFromLeftEdge = pageX <= EDGE_THRESHOLD;
        
        if (isFromLeftEdge) {
          startXRef.current = pageX;
        }
        
        return isFromLeftEdge;
      },
      onPanResponderGrant: (evt) => {
        // Store initial X position when gesture starts
        const { pageX } = evt.nativeEvent;
        startXRef.current = pageX;
      },
      onPanResponderMove: (evt, gestureState) => {
        // Track horizontal movement
        // Positive dx means swiping right (back gesture)
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (!enabled || Platform.OS !== 'ios') {
          startXRef.current = null;
          return;
        }

        const { dx, vx } = gestureState;
        const startedFromLeftEdge = startXRef.current !== null && startXRef.current <= EDGE_THRESHOLD;

        // Check if it's a valid swipe back gesture:
        // 1. Started from left edge
        // 2. Swiped right (positive dx)
        // 3. Swiped far enough (threshold) OR has sufficient velocity
        const isSwipeRight = dx > 0;
        const isSwipeFarEnough = dx >= SWIPE_THRESHOLD;
        const hasEnoughVelocity = vx >= VELOCITY_THRESHOLD;

        if (startedFromLeftEdge && isSwipeRight && (isSwipeFarEnough || hasEnoughVelocity)) {
          onSwipeBack();
        }
        
        startXRef.current = null;
      },
      onPanResponderTerminate: () => {
        // Gesture was cancelled
        startXRef.current = null;
      },
    })
  ).current;

  return (
    <View
      style={{ flex: 1, backgroundColor: colors.background }}
      {...panResponder.panHandlers}
    >
      {children}
    </View>
  );
};

export default SwipeBackGesture;

