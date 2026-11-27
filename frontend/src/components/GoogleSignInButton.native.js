import React from 'react';
import {
  ActivityIndicator,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';

export default function GoogleSignInButton({
  oauthConfig,
  configured,
  disabled,
  onSignIn,
  onBusyChange,
  onError,
  styles,
}) {
  const handlePress = async () => {
    onError('');
    if (!configured) {
      onError('Google sign-in is not configured for this app.');
      return;
    }
    if (Constants.executionEnvironment === 'storeClient') {
      onError('Native Google sign-in requires an installed Fixbee development build, not Expo Go.');
      return;
    }

    onBusyChange(true);
    try {
      const {
        GoogleSignin,
        isSuccessResponse,
      } = await import('@react-native-google-signin/google-signin');

      GoogleSignin.configure({
        webClientId: oauthConfig.webClientId,
        ...(Platform.OS === 'ios'
          ? { iosClientId: oauthConfig.iosClientId }
          : {}),
      });

      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      if (!isSuccessResponse(response)) return;

      const idToken = response.data.idToken;
      if (!idToken) {
        throw new Error('Google did not return an ID token. Please try again.');
      }

      const result = await onSignIn(idToken);
      if (!result.success) {
        onError(result.error || 'Google sign-in failed.');
      }
    } catch (error) {
      onError(error.message || 'Google sign-in failed. Please try again.');
    } finally {
      onBusyChange(false);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.googleButton, (!configured || disabled) && styles.buttonDisabled]}
      onPress={handlePress}
      disabled={!configured || disabled}
      activeOpacity={0.88}
      accessibilityRole="button"
      accessibilityState={{ disabled: !configured || disabled }}
    >
      {disabled ? (
        <ActivityIndicator size="small" color="#0A0A0C" />
      ) : (
        <View style={styles.googleBtnInner}>
          <View style={styles.googleGContainer}>
            <Ionicons name="logo-google" size={20} color="#EA4335" />
          </View>
          <Text style={styles.googleBtnText}>
            {configured ? 'Continue with Google' : 'Google sign-in unavailable'}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
