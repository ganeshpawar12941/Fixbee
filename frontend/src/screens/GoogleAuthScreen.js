import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import GoogleSignInButton from '../components/GoogleSignInButton';

export default function GoogleAuthScreen() {
  const { signInWithGoogle, isLoading } = useAuth();
  const [authenticating, setAuthenticating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const pulse = useRef(new Animated.Value(0)).current;

  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
  const expoClientId = process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID;
  const hasGoogleConfiguration = Platform.OS === 'web'
    ? Boolean(webClientId)
    : Boolean(webClientId && (Platform.OS !== 'ios' || iosClientId));

  const handleGoogleSignIn = useCallback(
    (idToken) => signInWithGoogle(idToken),
    [signInWithGoogle]
  );

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1400,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1400,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [pulse]);

  const logoScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.035] });
  const setupError = !hasGoogleConfiguration
    ? 'Google sign-in is not configured for this app. Please contact your campus administrator.'
    : '';
  const logoOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.96, 1],
  });

  return (
    <View style={styles.container}>
      <View style={styles.ambientTop} />
      <View style={styles.ambientBottom} />

      <ScrollView
        style={styles.loginScroll}
        contentContainerStyle={styles.loginScrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentCard}>
          <View style={styles.logoSection}>
            <Animated.View
              style={[
                styles.logoCircle,
                { transform: [{ scale: logoScale }], opacity: logoOpacity },
              ]}
            >
              <Image
                source={require('../../assets/fixbee_bee_logo.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </Animated.View>
            <View style={styles.appNameRow}>
              <Text style={styles.brandTitleFix}>Fix</Text>
              <Text style={styles.brandTitleBee}>bee</Text>
            </View>
            <Text style={styles.tagline}>buzz it • fix it</Text>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.welcomeHeadline}>Campus Service Portal</Text>
            <Text style={styles.welcomeDescription}>
              Sign in with an authorized college Google account to report campus issues and track repairs.
            </Text>
          </View>

          {errorMsg || setupError ? (
            <View style={styles.errorBanner} accessibilityRole="alert">
              <Ionicons name="alert-circle" size={15} color={Colors.accentDanger} />
              <Text style={styles.errorText}>{errorMsg || setupError}</Text>
            </View>
          ) : null}

          <View style={styles.buttonContainer}>
            <GoogleSignInButton
              oauthConfig={{
                clientId: expoClientId,
                webClientId,
                iosClientId,
                androidClientId,
              }}
              configured={hasGoogleConfiguration}
              disabled={authenticating || isLoading}
              onSignIn={handleGoogleSignIn}
              onBusyChange={setAuthenticating}
              onError={setErrorMsg}
              styles={styles}
            />

            <Text style={styles.campusDomainNote}>
              Authorized college account required
            </Text>
          </View>

          <View style={styles.securityFooter}>
            <Ionicons name="shield-checkmark" size={14} color="#22C55E" />
            <Text style={styles.securityText}>Secure Google authentication</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    alignSelf: 'stretch',
    backgroundColor: Colors.bgDark,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  loginScroll: {
    flex: 1,
    width: '100%',
  },
  loginScrollContent: {
    flexGrow: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  ambientTop: {
    position: 'absolute',
    top: -100,
    alignSelf: 'center',
    width: 380,
    height: 380,
    borderRadius: 190,
    backgroundColor: 'rgba(255, 193, 7, 0.08)',
  },
  ambientBottom: {
    position: 'absolute',
    bottom: -120,
    alignSelf: 'center',
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: 'rgba(20, 20, 30, 0.5)',
  },
  contentCard: {
    width: '100%',
    maxWidth: 390,
    alignSelf: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8,
  },
  logoImage: {
    width: '92%',
    height: '92%',
  },
  appNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTitleFix: {
    fontSize: 34,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  brandTitleBee: {
    fontSize: 34,
    fontWeight: '900',
    color: Colors.primary,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
    marginTop: 2,
    letterSpacing: 2,
  },
  infoSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  welcomeHeadline: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
    gap: 8,
    width: '100%',
  },
  errorText: {
    fontSize: 12,
    color: Colors.accentDanger,
    fontWeight: '600',
    flex: 1,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  googleButton: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  googleBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  googleGContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F1F1F',
    letterSpacing: -0.2,
    textAlign: 'center',
    flexShrink: 1,
  },
  campusDomainNote: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 10,
    textAlign: 'center',
  },
  securityFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    width: '100%',
    justifyContent: 'center',
  },
  securityText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
  },
});
