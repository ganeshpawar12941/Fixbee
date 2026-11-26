import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';

export default function BeeAnimation({ size = 48, buzzing = true }) {
  const translateY = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const wingScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!buzzing) return;

    // Up and down hovering
    const hoverAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(translateY, {
          toValue: -10,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 8,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    // Subtle tilting
    const tiltAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(rotate, {
          toValue: 1,
          duration: 600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(rotate, {
          toValue: -1,
          duration: 600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    // Fast wing flutter
    const wingAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(wingScale, {
          toValue: 1.3,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(wingScale, {
          toValue: 0.8,
          duration: 100,
          useNativeDriver: true,
        }),
      ])
    );

    hoverAnimation.start();
    tiltAnimation.start();
    wingAnimation.start();

    return () => {
      hoverAnimation.stop();
      tiltAnimation.stop();
      wingAnimation.stop();
    };
  }, [buzzing]);

  const rotationInterpolate = rotate.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-12deg', '12deg'],
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.beeWrapper,
          {
            transform: [
              { translateY },
              { rotate: rotationInterpolate },
            ],
          },
        ]}
      >
        {/* Glowing aura */}
        <View
          style={[
            styles.glowAura,
            {
              width: size * 1.6,
              height: size * 1.6,
              borderRadius: (size * 1.6) / 2,
            },
          ]}
        />

        {/* Animated wing back */}
        <Animated.View
          style={[
            styles.wing,
            styles.leftWing,
            {
              transform: [{ scaleX: wingScale }, { rotate: '-25deg' }],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.wing,
            styles.rightWing,
            {
              transform: [{ scaleX: wingScale }, { rotate: '25deg' }],
            },
          ]}
        />

        {/* Bee Icon / Mascot */}
        <View
          style={[
            styles.beeBody,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
            },
          ]}
        >
          <Ionicons name="sparkles" size={size * 0.45} color="#0B0F19" />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  beeWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  glowAura: {
    position: 'absolute',
    backgroundColor: Colors.primaryGlow,
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 0, 0.35)',
  },
  beeBody: {
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 8,
  },
  wing: {
    position: 'absolute',
    top: 2,
    width: 14,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderWidth: 1,
    borderColor: '#FFF',
  },
  leftWing: {
    left: -4,
  },
  rightWing: {
    right: -4,
  },
});
