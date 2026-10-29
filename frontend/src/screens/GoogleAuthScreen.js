import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { useAuth, PRESET_GOOGLE_USERS } from '../context/AuthContext';

export default function GoogleAuthScreen() {
  const { signInWithGoogle, signInWithCustomGoogleEmail, isLoading } = useAuth();
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handlePresetLogin = async (preset) => {
    setErrorMsg('');
    const res = await signInWithGoogle(preset);
    if (!res.success) {
      setErrorMsg(res.error || 'Google Sign-In failed');
    }
  };

  const handleCustomLogin = async () => {
    if (!customEmail.trim()) {
      setErrorMsg('Please enter your Google student email');
      return;
    }
    setErrorMsg('');
    const res = await signInWithCustomGoogleEmail(customName, customEmail);
    if (!res.success) {
      setErrorMsg(res.error || 'Google Sign-In failed');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Fixbee Branding */}
        <View style={styles.brandBadge}>
          <Image
            source={require('../../assets/fixbee_logo.jpg')}
            style={styles.logoImage}
          />
          <View style={styles.appNameRow}>
            <Text style={styles.brandTitleFix}>Fix</Text>
            <Text style={styles.brandTitleBee}>bee</Text>
          </View>
          <Text style={styles.tagline}>buzz it  fix it</Text>
        </View>

        {/* Auth Card */}
        <View style={styles.authCard}>
          <View style={styles.googleIconCircle}>
            <Ionicons name="logo-google" size={28} color="#EA4335" />
          </View>

          <Text style={styles.cardTitle}>Student Google Login</Text>
          <Text style={styles.cardSubtitle}>
            Fixbee uses Google Authentication exclusively to verify active campus students and prevent spam reports.
          </Text>

          {errorMsg ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color="#EF4444" />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          {/* Primary Quick Google Sign In */}
          <TouchableOpacity
            style={styles.primaryGoogleBtn}
            onPress={() => handlePresetLogin(PRESET_GOOGLE_USERS[0])}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator color="#0B0F19" />
            ) : (
              <>
                <Ionicons name="logo-google" size={20} color="#4285F4" style={styles.googleBtnIcon} />
                <Text style={styles.googleBtnText}>Sign in with Google</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR SELECT CAMPUS STUDENT</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Preset Google Student Accounts for instant testing */}
          <View style={styles.presetsList}>
            {PRESET_GOOGLE_USERS.map((preset) => (
              <TouchableOpacity
                key={preset.id}
                style={styles.presetItem}
                onPress={() => handlePresetLogin(preset)}
                activeOpacity={0.8}
              >
                <Image source={{ uri: preset.avatar }} style={styles.presetAvatar} />
                <View style={styles.presetInfo}>
                  <Text style={styles.presetName}>{preset.name}</Text>
                  <Text style={styles.presetEmail}>{preset.email}</Text>
                  <Text style={styles.presetDept}>{preset.department}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            ))}
          </View>

          {/* Custom Google Email Accordion */}
          <TouchableOpacity
            style={styles.toggleCustomBtn}
            onPress={() => setShowCustomInput(!showCustomInput)}
          >
            <Text style={styles.toggleCustomText}>
              {showCustomInput ? '▲ Hide Custom Google ID' : '▼ Enter My Own Google Student Email'}
            </Text>
          </TouchableOpacity>

          {showCustomInput && (
            <View style={styles.customInputContainer}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. John Doe"
                placeholderTextColor={Colors.textMuted}
                value={customName}
                onChangeText={setCustomName}
              />

              <Text style={styles.inputLabel}>Campus Google Email</Text>
              <TextInput
                style={styles.textInput}
                placeholder="your.name@campus.edu"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="none"
                keyboardType="email-address"
                value={customEmail}
                onChangeText={setCustomEmail}
              />

              <TouchableOpacity
                style={styles.submitCustomBtn}
                onPress={handleCustomLogin}
                activeOpacity={0.8}
              >
                <Ionicons name="log-in-outline" size={18} color="#0B0F19" />
                <Text style={styles.submitCustomText}>Sign In with Google</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Security & Verification Note */}
        <View style={styles.securityNote}>
          <Ionicons name="shield-checkmark" size={16} color={Colors.accentSuccess} />
          <Text style={styles.securityText}>
            Verified campus authentication. Your reports are linked to your college Google identity.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgDark,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 40,
    alignItems: 'center',
  },
  brandBadge: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: Colors.primary,
    marginBottom: 8,
  },
  appNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTitleFix: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  brandTitleBee: {
    fontSize: 28,
    fontWeight: '900',
    color: '#F5A623',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    letterSpacing: 2.4,
    textTransform: 'lowercase',
    marginTop: 4,
  },
  authCard: {
    width: '100%',
    backgroundColor: Colors.bgCard,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  googleIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 12,
    gap: 8,
    width: '100%',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    flex: 1,
  },
  primaryGoogleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 4,
  },
  googleBtnIcon: {
    marginRight: 10,
  },
  googleBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#3C4043',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.borderSubtle,
  },
  dividerText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textMuted,
    marginHorizontal: 10,
    letterSpacing: 0.6,
  },
  presetsList: {
    width: '100%',
    gap: 10,
  },
  presetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCardElevated,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  presetAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  presetInfo: {
    flex: 1,
  },
  presetName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  presetEmail: {
    fontSize: 11,
    color: Colors.primary,
  },
  presetDept: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  toggleCustomBtn: {
    marginTop: 16,
    padding: 6,
  },
  toggleCustomText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  customInputContainer: {
    width: '100%',
    marginTop: 12,
    backgroundColor: Colors.bgCardElevated,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 4,
    marginTop: 8,
  },
  textInput: {
    backgroundColor: Colors.bgInput,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    color: Colors.textPrimary,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
  },
  submitCustomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 14,
    gap: 6,
  },
  submitCustomText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0B0F19',
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    gap: 8,
    paddingHorizontal: 10,
  },
  securityText: {
    fontSize: 11,
    color: Colors.textMuted,
    flex: 1,
    lineHeight: 16,
  },
});
