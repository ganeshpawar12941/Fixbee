import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { apiService } from '../config/api';

const AuthContext = createContext({});
const isSignedAccessToken = (value) => (
  typeof value === 'string' && value.split('.').length === 3
);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasSeenIntro, setHasSeenIntro] = useState(false);

  useEffect(() => {
    loadStoredSession();
  }, []);

  const loadStoredSession = async () => {
    try {
      const storedIntro = await AsyncStorage.getItem('@fixbee_intro_seen');
      if (storedIntro === 'true') {
        setHasSeenIntro(true);
      }

      const storedUser = await AsyncStorage.getItem('@fixbee_user');
      const storedToken = await AsyncStorage.getItem('@fixbee_token');

      if (storedUser && isSignedAccessToken(storedToken)) {
        const parsedUser = JSON.parse(storedUser);
        if (!parsedUser?.id || !parsedUser?.role) {
          throw new Error('Stored account is missing required profile data.');
        }
        try {
          const response = await apiService.get('/auth/me');
          const currentToken = await AsyncStorage.getItem('@fixbee_token');
          const verifiedUser = response?.data?.user;
          if (!verifiedUser?.id || !verifiedUser?.role) {
            throw new Error('The server did not return a valid user profile.');
          }
          const currentUser = { ...parsedUser, ...verifiedUser };
          await AsyncStorage.setItem('@fixbee_user', JSON.stringify(currentUser));
          setUser(currentUser);
          setToken(currentToken || storedToken);
        } catch (error) {
          if (error.status === 401 || error.status === 403) {
            await AsyncStorage.multiRemove([
              '@fixbee_user',
              '@fixbee_token',
              '@fixbee_refresh_token',
            ]);
          } else {
            setUser(parsedUser);
            setToken(storedToken);
            console.warn('Could not verify the stored session with the server.', error);
          }
        }
      } else if (storedUser || storedToken) {
        await AsyncStorage.multiRemove([
          '@fixbee_user',
          '@fixbee_token',
          '@fixbee_refresh_token',
        ]);
      }
    } catch (e) {
      console.error('Failed to restore session', e);
    } finally {
      setIsLoading(false);
    }
  };

  const completeIntro = async () => {
    setHasSeenIntro(true);
    await AsyncStorage.setItem('@fixbee_intro_seen', 'true');
  };

  const resetIntro = async () => {
    setHasSeenIntro(false);
    await AsyncStorage.removeItem('@fixbee_intro_seen');
  };

  const signInWithGoogle = async (idToken) => {
    try {
      if (!idToken) {
        throw new Error('Google did not return an ID token.');
      }

      const payload = await apiService.post('/auth/google', { idToken });
      const data = payload?.data;
      if (!data?.user || !data?.accessToken || !data?.refreshToken) {
        throw new Error('The server did not return a valid authenticated session.');
      }

      await AsyncStorage.multiSet([
        ['@fixbee_user', JSON.stringify(data.user)],
        ['@fixbee_token', data.accessToken],
        ['@fixbee_refresh_token', data.refreshToken],
      ]);

      setUser(data.user);
      setToken(data.accessToken);
      return { success: true, user: data.user };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const signOut = async () => {
    try {
      const accessToken = token || await AsyncStorage.getItem('@fixbee_token');

      if (accessToken) {
        try {
          const pushToken = await AsyncStorage.getItem('@fixbee_push_token');
          if (pushToken) {
            await apiService.delete('/notifications/push-token', { token: pushToken });
          }
        } catch (err) {
          console.warn('Could not unregister the push token during sign out.', err);
        }

        try {
          await apiService.post('/auth/logout', {});
        } catch (err) {
          console.warn('Could not revoke the server session during sign out.', err);
        }
      }
    } catch (err) {
      console.warn('Could not read the stored session during sign out.', err);
    } finally {
      if (Platform.OS !== 'web') {
        try {
          const { GoogleSignin } = await import('@react-native-google-signin/google-signin');
          const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
          const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

          if (webClientId) {
            GoogleSignin.configure({
              webClientId,
              ...(Platform.OS === 'ios' && iosClientId ? { iosClientId } : {}),
            });
            await GoogleSignin.signOut();
          }
        } catch (err) {
          console.warn('Could not clear the native Google account session.', err);
        }
      }

      try {
        await AsyncStorage.multiRemove([
          '@fixbee_user',
          '@fixbee_token',
          '@fixbee_refresh_token',
          '@fixbee_push_token',
        ]);
      } catch (err) {
        console.error('Could not clear the stored session.', err);
      }
      setUser(null);
      setToken(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user,
        hasSeenIntro,
        completeIntro,
        resetIntro,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
