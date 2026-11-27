import React, { useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Animated,
  Dimensions,
  Image,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');

export default function IntroScreen({ onProceed }) {
  const { completeIntro } = useAuth();

  // Animation values
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoRotate = useRef(new Animated.Value(-15)).current;
  const glowScale = useRef(new Animated.Value(0.8)).current;
  const brandOpacity = useRef(new Animated.Value(0)).current;
  const brandTranslateY = useRef(new Animated.Value(25)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const beeFlightX = useRef(new Animated.Value(-width * 0.4)).current;
  const beeFlightY = useRef(new Animated.Value(0)).current;
  const progressWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Logo spring and reveal sequence
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(logoRotate, {
        toValue: 0,
        friction: 6,
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowScale, {
            toValue: 1.25,
            duration: 1100,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(glowScale, {
            toValue: 0.95,
            duration: 1100,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ),
    ]).start();

    // 2. Brand title and tagline slide-up
    Animated.sequence([
      Animated.delay(400),
      Animated.parallel([
        Animated.timing(brandOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(brandTranslateY, {
          toValue: 0,
          friction: 6,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // 3. Bee flight buzzing path across screen
    Animated.sequence([
      Animated.delay(200),
      Animated.parallel([
        Animated.timing(beeFlightX, {
          toValue: width * 0.4,
          duration: 2200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(beeFlightY, {
            toValue: -18,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(beeFlightY, {
            toValue: 14,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(beeFlightY, {
            toValue: -12,
            duration: 550,
            useNativeDriver: true,
          }),
          Animated.timing(beeFlightY, {
            toValue: 0,
            duration: 550,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start();

    // 4. Progress bar fills and then triggers onProceed automatically!
    Animated.timing(progressWidth, {
      toValue: 1,
      duration: 2600,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start(async () => {
      // Auto-advance once the animation completes!
      await completeIntro();
      if (onProceed) onProceed();
    });
  }, []);

  const rotateInterpolation = logoRotate.interpolate({
    inputRange: [-15, 0],
    outputRange: ['-15deg', '0deg'],
  });

  return (
    <View style={styles.container}>
      {/* Background ambient glowing orbs */}
      <View style={styles.ambientTop} />
      <View style={styles.ambientBottom} />

      {/* Center Cinematic Card */}
      <View style={styles.centerContainer}>
        {/* Pulsing Honey Glow behind logo */}
        <Animated.View
          style={[
            styles.pulseHalo,
            {
              transform: [{ scale: glowScale }],
            },
          ]}
        />

        {/* FixBee Brand Logo */}
        <Animated.View
          style={[
            styles.logoCard,
            {
              opacity: logoOpacity,
              transform: [
                { scale: logoScale },
                { rotate: rotateInterpolation },
              ],
            },
          ]}
        >
          <Image
            source={require('../../assets/fixbee_bee_logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Title & Tagline with slide-up reveal */}
        <Animated.View
          style={[
            styles.titleContainer,
            {
              opacity: brandOpacity,
              transform: [{ translateY: brandTranslateY }],
            },
          ]}
        >
          <View style={styles.brandTitleRow}>
            <Text style={styles.brandTitleFix}>Fix</Text>
            <Text style={styles.brandTitleBee}>bee</Text>
          </View>
        </Animated.View>

        <Animated.View style={[styles.taglineBox, { opacity: taglineOpacity }]}>
          <Text style={styles.taglineText}>buzz it • fix it</Text>
          <Text style={styles.campusSubtitle}>Campus Maintenance & Repair Network</Text>
        </Animated.View>
      </View>

      {/* Auto-advance Progress Line at bottom */}
      <View style={styles.bottomLoaderContainer}>
        <View style={styles.progressBarTrack}>
          <Animated.View
            style={[
              styles.progressBarFill,
              {
                width: progressWidth.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
        <Text style={styles.connectingText}>Launching FixBee Platform...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgDark,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  ambientTop: {
    position: 'absolute',
    top: -120,
    width: width * 1.3,
    height: width * 1.3,
    borderRadius: (width * 1.3) / 2,
    backgroundColor: 'rgba(255, 193, 7, 0.08)',
  },
  ambientBottom: {
    position: 'absolute',
    bottom: -150,
    width: width * 1.3,
    height: width * 1.3,
    borderRadius: (width * 1.3) / 2,
    backgroundColor: 'rgba(25, 25, 35, 0.4)',
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    width: '100%',
    paddingHorizontal: 20,
  },
  beeDrone: {
    position: 'absolute',
    top: -45,
    zIndex: 10,
  },
  beeEmoji: {
    fontSize: 32,
  },
  pulseHalo: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: 'rgba(255, 193, 7, 0.16)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 193, 7, 0.35)',
  },
  logoCard: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3.5,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.55,
    shadowRadius: 18,
    elevation: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  logoImage: {
    width: '92%',
    height: '92%',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 6,
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTitleFix: {
    fontSize: 44,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  brandTitleBee: {
    fontSize: 44,
    fontWeight: '900',
    color: Colors.primary,
    letterSpacing: -1,
  },
  taglineBox: {
    alignItems: 'center',
  },
  taglineText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 2.8,
    textTransform: 'lowercase',
    marginBottom: 4,
  },
  campusSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textMuted,
  },
  bottomLoaderContainer: {
    position: 'absolute',
    bottom: 45,
    width: '70%',
    maxWidth: 280,
    alignItems: 'center',
  },
  progressBarTrack: {
    width: '100%',
    height: 4,
    backgroundColor: '#1E1E28',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  connectingText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
});
