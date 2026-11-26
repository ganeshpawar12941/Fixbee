import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  Modal,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { useAuth, PRESET_USERS } from '../context/AuthContext';

export default function GoogleAuthScreen() {
  const { signInWithGoogle, isLoading } = useAuth();
  const [showAccountChooser, setShowAccountChooser] = useState(false);
  const [authenticating, setAuthenticating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleGoogleClick = () => {
    // Opens official Google account selector modal
    setErrorMsg('');
    setShowAccountChooser(true);
  };

  const handleSelectAccount = async (preset) => {
    setShowAccountChooser(false);
    setAuthenticating(true);
    setErrorMsg('');
    try {
      const res = await signInWithGoogle(preset);
      if (!res.success) {
        setErrorMsg(res.error || 'Google Authentication failed. Please try again.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Google Sign-In failed');
    } finally {
      setAuthenticating(false);
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'warden':
        return { label: 'Hostel Warden', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)' };
      case 'infrastructure_dean':
        return { label: 'Dean Infra', color: '#A855F7', bg: 'rgba(168, 85, 247, 0.15)' };
      case 'admin':
        return { label: 'Campus Admin', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.15)' };
      default:
        return { label: 'Student', color: '#38BDF8', bg: 'rgba(56, 189, 248, 0.15)' };
    }
  };

  return (
    <View style={styles.container}>
      {/* Background ambient lighting */}
      <View style={styles.ambientTop} />
      <View style={styles.ambientBottom} />

      <View style={styles.contentCard}>
        {/* FixBee Brand Logo */}
        <View style={styles.logoSection}>
          <View style={styles.logoCircle}>
            <Image
              source={require('../../assets/fixbee_logo.jpg')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <View style={styles.appNameRow}>
            <Text style={styles.brandTitleFix}>Fix</Text>
            <Text style={styles.brandTitleBee}>bee</Text>
          </View>
          <Text style={styles.tagline}>buzz it • fix it</Text>
        </View>

        {/* Headline & Campus Portal Description */}
        <View style={styles.infoSection}>
          <Text style={styles.welcomeHeadline}>Campus Service Portal</Text>
          <Text style={styles.welcomeDescription}>
            Sign in with your authorized college Google account to report campus issues, track repair SLAs, and manage facilities.
          </Text>
        </View>

        {errorMsg ? (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={15} color={Colors.accentDanger} />
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        ) : null}

        {/* ONLY Login Through Google Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.googleButton}
            onPress={handleGoogleClick}
            disabled={authenticating || isLoading}
            activeOpacity={0.88}
          >
            {authenticating || isLoading ? (
              <ActivityIndicator size="small" color="#0A0A0C" />
            ) : (
              <View style={styles.googleBtnInner}>
                <View style={styles.googleGContainer}>
                  <Ionicons name="logo-google" size={20} color="#EA4335" />
                </View>
                <Text style={styles.googleBtnText}>Continue with Google</Text>
              </View>
            )}
          </TouchableOpacity>

          <Text style={styles.campusDomainNote}>
            Use your official <Text style={styles.highlightText}>@campus.edu</Text> Google email
          </Text>
        </View>

        {/* Security Badge Footer */}
        <View style={styles.securityFooter}>
          <Ionicons name="shield-checkmark" size={14} color="#22C55E" />
          <Text style={styles.securityText}>Verified Google OAuth 2.0 Security</Text>
        </View>
      </View>

      {/* Google Account Selector Dialog */}
      <Modal
        visible={showAccountChooser}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAccountChooser(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.accountCard}>
            <View style={styles.modalHeaderRow}>
              <View style={styles.gLogoRow}>
                <Ionicons name="logo-google" size={18} color="#EA4335" />
                <Text style={styles.modalHeaderTitle}>Choose a Google Account</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowAccountChooser(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalHeaderSub}>
              to continue to <Text style={{ color: Colors.primary, fontWeight: '800' }}>FixBee Campus</Text>
            </Text>

            <View style={styles.accountList}>
              {PRESET_USERS.map((preset) => {
                const badge = getRoleBadge(preset.role);
                return (
                  <TouchableOpacity
                    key={preset.id}
                    style={styles.accountItem}
                    onPress={() => handleSelectAccount(preset)}
                    activeOpacity={0.7}
                  >
                    <Image source={{ uri: preset.profilePicture }} style={styles.accountAvatar} />
                    <View style={styles.accountDetails}>
                      <View style={styles.accountNameRow}>
                        <Text style={styles.accountName}>{preset.name}</Text>
                        <View style={[styles.roleTag, { backgroundColor: badge.bg }]}>
                          <Text style={[styles.roleTagText, { color: badge.color }]}>
                            {badge.label}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.accountEmail}>{preset.email}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgDark,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    position: 'relative',
    overflow: 'hidden',
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
    backgroundColor: Colors.bgCard,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    paddingVertical: 32,
    paddingHorizontal: 24,
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
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
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
    fontSize: 11,
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
  googleBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
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
  },
  campusDomainNote: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 10,
    textAlign: 'center',
  },
  highlightText: {
    color: Colors.primary,
    fontWeight: '700',
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
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  accountCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: Colors.bgCardElevated,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    padding: 18,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  gLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  modalHeaderSub: {
    fontSize: 11,
    color: Colors.textMuted,
    marginBottom: 14,
  },
  accountList: {
    gap: 8,
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161620',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#242432',
    padding: 10,
    gap: 10,
  },
  accountAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  accountDetails: {
    flex: 1,
  },
  accountNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  accountName: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  roleTag: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  roleTagText: {
    fontSize: 9,
    fontWeight: '800',
  },
  accountEmail: {
    fontSize: 11,
    color: Colors.textMuted,
  },
});
