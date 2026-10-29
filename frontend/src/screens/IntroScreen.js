import React, { useRef, useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  Dimensions,
  Animated,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');

const PILLARS = [
  {
    icon: 'megaphone-outline',
    title: 'Direct Accountability',
    description: 'Instant campus facility reporting with photo evidence. No bureaucratic delays or lost complaints.',
    tag: 'STEP 01',
  },
  {
    icon: 'trending-up-outline',
    title: 'Community Momentum',
    description: 'Student upvotes directly influence maintenance urgency. Issues gaining peer traction get expedited dispatch.',
    tag: 'STEP 02',
  },
  {
    icon: 'checkmark-done-circle-outline',
    title: 'Transparent Resolution',
    description: 'Track repair lifecycles from submission to facility verification with photographic sign-off.',
    tag: 'STEP 03',
  },
];

export default function IntroScreen({ onProceed }) {
  const { completeIntro } = useAuth();
  const [activePillar, setActivePillar] = useState(0);

  // Logo Intro Animation values
  const logoScale = useRef(new Animated.Value(0.75)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoTranslateY = useRef(new Animated.Value(20)).current;
  const brandOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const contentFade = useRef(new Animated.Value(0)).current;
  const pulseRing = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 1. Logo fluid spring reveal
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.spring(logoTranslateY, {
          toValue: 0,
          friction: 6,
          useNativeDriver: true,
        }),
      ]),
      // 2. Brand Name reveal
      Animated.timing(brandOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      // 3. Tagline reveal
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      // 4. Content fade in
      Animated.timing(contentFade, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // Subtle pulsing ring around logo
    const ringLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseRing, {
          toValue: 1.15,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseRing, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
        }),
      ])
    );
    ringLoop.start();

    return () => ringLoop.stop();
  }, []);

  const handleNext = () => {
    if (activePillar < PILLARS.length - 1) {
      setActivePillar(activePillar + 1);
    } else {
      completeIntro();
      if (onProceed) onProceed();
    }
  };

  return (
    <View style={styles.container}>
      {/* Background ambient lighting */}
      <View style={styles.ambientTop} />
      <View style={styles.ambientBottom} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Animated Official Logo Hero Reveal */}
        <View style={styles.logoIntroSection}>
          <Animated.View
            style={[
              styles.logoRingWrapper,
              {
                transform: [
                  { scale: logoScale },
                  { translateY: logoTranslateY },
                ],
                opacity: logoOpacity,
              },
            ]}
          >
            {/* Outer subtle glow */}
            <Animated.View
              style={[
                styles.pulseHalo,
                { transform: [{ scale: pulseRing }] },
              ]}
            />

            {/* Official Clean Fixbee Logo */}
            <View style={styles.logoCard}>
              <Image
                source={require('../../assets/fixbee_logo.jpg')}
                style={styles.officialLogoImage}
                resizeMode="contain"
              />
            </View>
          </Animated.View>

          {/* Typography matching logo: Fix in white/charcoal, bee in golden amber */}
          <Animated.View style={[styles.brandTitleRow, { opacity: brandOpacity }]}>
            <Text style={styles.titleFix}>Fix</Text>
            <Text style={styles.titleBee}>bee</Text>
          </Animated.View>

          {/* Tagline matching logo lowercase spaced font */}
          <Animated.View style={[styles.taglineBox, { opacity: taglineOpacity }]}>
            <Text style={styles.taglineText}>buzz it  fix it</Text>
          </Animated.View>
        </View>

        {/* Captivating Professional Copy Section */}
        <Animated.View style={[styles.mainNarrativeSection, { opacity: contentFade }]}>
          <View style={styles.platformBadge}>
            <Ionicons name="shield-checkmark-outline" size={13} color={Colors.primary} />
            <Text style={styles.platformBadgeText}>CAMPUS FACILITY INTELLIGENCE</Text>
          </View>

          <Text style={styles.heroHeadline}>
            When issues get noticed, administration takes action.
          </Text>

          <Text style={styles.heroSubhead}>
            Fixbee transforms campus facility maintenance by uniting student voices through verified peer momentum and direct administrative accountability.
          </Text>

          {/* Interactive Pillars Carousel */}
          <View style={styles.pillarCard}>
            <View style={styles.pillarTopRow}>
              <View style={styles.pillarTagPill}>
                <Text style={styles.pillarTagText}>{PILLARS[activePillar].tag}</Text>
              </View>
              <View style={styles.pillarDots}>
                {PILLARS.map((_, i) => (
                  <TouchableOpacity
                    key={i}
                    onPress={() => setActivePillar(i)}
                    style={[
                      styles.dot,
                      activePillar === i ? styles.activeDot : styles.inactiveDot,
                    ]}
                  />
                ))}
              </View>
            </View>

            <View style={styles.pillarIconCircle}>
              <Ionicons
                name={PILLARS[activePillar].icon}
                size={24}
                color={Colors.primary}
              />
            </View>

            <Text style={styles.pillarTitle}>{PILLARS[activePillar].title}</Text>
            <Text style={styles.pillarDesc}>{PILLARS[activePillar].description}</Text>
          </View>

          {/* Institutional Value Metrics */}
          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricVal}>100%</Text>
              <Text style={styles.metricLbl}>Peer Verified</Text>
            </View>
            <View style={styles.metricSeparator} />
            <View style={styles.metricItem}>
              <Text style={styles.metricVal}>3x</Text>
              <Text style={styles.metricLbl}>Faster Dispatch</Text>
            </View>
            <View style={styles.metricSeparator} />
            <View style={styles.metricItem}>
              <Text style={styles.metricVal}>Zero</Text>
              <Text style={styles.metricLbl}>Bureaucracy</Text>
            </View>
          </View>

          {/* Call to Action Button */}
          <TouchableOpacity style={styles.primaryBtn} onPress={handleNext} activeOpacity={0.85}>
            <Text style={styles.primaryBtnText}>
              {activePillar < PILLARS.length - 1 ? 'Explore Platform' : 'Access Student Portal'}
            </Text>
            <Ionicons
              name={activePillar < PILLARS.length - 1 ? 'chevron-forward' : 'arrow-forward'}
              size={18}
              color="#0B0F19"
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skipBtn}
            onPress={() => {
              completeIntro();
              if (onProceed) onProceed();
            }}
          >
            <Text style={styles.skipBtnText}>Skip to Login</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F19',
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 40,
    paddingBottom: 40,
    alignItems: 'center',
  },
  ambientTop: {
    position: 'absolute',
    top: -120,
    width: width * 1.2,
    height: width * 1.2,
    borderRadius: (width * 1.2) / 2,
    backgroundColor: 'rgba(245, 166, 35, 0.08)',
  },
  ambientBottom: {
    position: 'absolute',
    bottom: -150,
    width: width * 1.4,
    height: width * 1.4,
    borderRadius: (width * 1.4) / 2,
    backgroundColor: 'rgba(30, 41, 59, 0.3)',
  },
  logoIntroSection: {
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  logoRingWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  pulseHalo: {
    position: 'absolute',
    width: 144,
    height: 144,
    borderRadius: 72,
    backgroundColor: 'rgba(245, 166, 35, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 166, 35, 0.3)',
  },
  logoCard: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#F5A623',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
    borderWidth: 3,
    borderColor: '#F5A623',
  },
  officialLogoImage: {
    width: '92%',
    height: '92%',
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleFix: {
    fontSize: 34,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  titleBee: {
    fontSize: 34,
    fontWeight: '900',
    color: '#F5A623',
    letterSpacing: -1,
  },
  taglineBox: {
    marginTop: 3,
  },
  taglineText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
    letterSpacing: 3.2,
    textTransform: 'lowercase',
  },
  mainNarrativeSection: {
    width: '100%',
    alignItems: 'center',
  },
  platformBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 166, 35, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(245, 166, 35, 0.25)',
    gap: 6,
    marginBottom: 14,
  },
  platformBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 0.8,
  },
  heroHeadline: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F8FAFC',
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  heroSubhead: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 22,
    paddingHorizontal: 6,
  },
  pillarCard: {
    width: '100%',
    backgroundColor: '#131B2E',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#222F4C',
    marginBottom: 20,
    alignItems: 'center',
  },
  pillarTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 14,
  },
  pillarTagPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pillarTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 0.6,
  },
  pillarDots: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    height: 5,
    borderRadius: 3,
  },
  activeDot: {
    width: 20,
    backgroundColor: Colors.primary,
  },
  inactiveDot: {
    width: 6,
    backgroundColor: '#334155',
  },
  pillarIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(245, 166, 35, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 166, 35, 0.3)',
  },
  pillarTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#F8FAFC',
    textAlign: 'center',
    marginBottom: 6,
  },
  pillarDesc: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 19,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#222F4C',
    marginBottom: 22,
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricVal: {
    fontSize: 17,
    fontWeight: '900',
    color: '#F5A623',
  },
  metricLbl: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '700',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  metricSeparator: {
    width: 1,
    height: 22,
    backgroundColor: '#222F4C',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    backgroundColor: '#F5A623',
    paddingVertical: 15,
    borderRadius: 14,
    gap: 8,
    shadowColor: '#F5A623',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0B0F19',
    letterSpacing: 0.4,
  },
  skipBtn: {
    marginTop: 14,
    padding: 6,
  },
  skipBtnText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
});
