import React, { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';

WebBrowser.maybeCompleteAuthSession();

export default function GoogleSignInButton({
  oauthConfig,
  configured,
  disabled,
  onSignIn,
  onBusyChange,
  onError,
  styles,
}) {
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest(oauthConfig);
  const handledResponse = useRef(null);

  useEffect(() => {
    if (!response || response === handledResponse.current) return;
    handledResponse.current = response;

    if (response.type === 'success') {
      const idToken = response.params?.id_token || response.authentication?.idToken;
      if (!idToken) {
        onError('Google did not return an ID token. Please try again.');
        onBusyChange(false);
        return;
      }

      onBusyChange(true);
      onSignIn(idToken)
        .then((result) => {
          if (!result.success) onError(result.error || 'Google sign-in failed.');
        })
        .catch((error) => onError(error.message || 'Google sign-in failed.'))
        .finally(() => onBusyChange(false));
    } else if (response.type === 'cancel' || response.type === 'dismiss') {
      onError('Google sign-in was cancelled.');
      onBusyChange(false);
    } else if (response.type === 'error') {
      onError(response.error?.message || 'Google sign-in failed. Please try again.');
      onBusyChange(false);
    }
  }, [response, onSignIn, onBusyChange, onError]);

  const handlePress = async () => {
    onError('');
    if (!request) {
      onError('Google sign-in is still initializing. Please try again.');
      return;
    }

    onBusyChange(true);
    try {
      await promptAsync();
    } catch (error) {
      onError(error.message || 'Unable to open Google sign-in.');
      onBusyChange(false);
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.googleButton,
        (!configured || !request || disabled) && styles.buttonDisabled,
      ]}
      onPress={handlePress}
      disabled={!configured || !request || disabled}
      activeOpacity={0.88}
      accessibilityRole="button"
      accessibilityState={{ disabled: !configured || !request || disabled }}
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
