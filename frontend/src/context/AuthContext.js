import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext({});

export const PRESET_GOOGLE_USERS = [
  {
    id: 'google_user_01',
    name: 'Alex Johnson',
    email: 'alex.j@campus.edu',
    collegeDomain: 'campus.edu',
    department: 'Computer Science & Eng',
    room: 'Hostel Block B - 304',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    campusPoints: 140,
    role: 'Student',
  },
  {
    id: 'google_user_02',
    name: 'Maya Patel',
    email: 'maya.p@campus.edu',
    collegeDomain: 'campus.edu',
    department: 'Electrical Engineering',
    room: 'Hostel Block A - 112',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    campusPoints: 210,
    role: 'Student',
  },
  {
    id: 'google_user_03',
    name: 'Dev Sharma',
    email: 'dev.sharma@campus.edu',
    collegeDomain: 'campus.edu',
    department: 'Mechanical Engineering',
    room: 'Hostel Block C - 205',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    campusPoints: 95,
    role: 'Student',
  },
];

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

      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
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

  const signInWithGoogle = async (selectedPresetUser = null) => {
    setIsLoading(true);
    try {
      // Use preset or default Google campus profile
      const profile = selectedPresetUser || PRESET_GOOGLE_USERS[0];
      const fakeGoogleToken = `google_oauth2_${profile.id}_${Date.now()}`;

      await AsyncStorage.setItem('@fixbee_user', JSON.stringify(profile));
      await AsyncStorage.setItem('@fixbee_token', fakeGoogleToken);

      setUser(profile);
      setToken(fakeGoogleToken);
      return { success: true, user: profile };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithCustomGoogleEmail = async (name, email) => {
    setIsLoading(true);
    try {
      const customUser = {
        id: `google_${Date.now()}`,
        name: name || 'Campus Student',
        email: email || 'student@campus.edu',
        collegeDomain: email.includes('@') ? email.split('@')[1] : 'campus.edu',
        department: 'General Engineering',
        room: 'Campus Resident',
        avatar: `https://api.dicebear.com/7.x/bottts/png?seed=${encodeURIComponent(name || 'fixbee')}`,
        campusPoints: 50,
        role: 'Student',
      };
      const token = `google_oauth2_${customUser.id}`;

      await AsyncStorage.setItem('@fixbee_user', JSON.stringify(customUser));
      await AsyncStorage.setItem('@fixbee_token', token);

      setUser(customUser);
      setToken(token);
      return { success: true, user: customUser };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await AsyncStorage.removeItem('@fixbee_user');
      await AsyncStorage.removeItem('@fixbee_token');
      setUser(null);
      setToken(null);
    } catch (err) {
      console.error('Error signing out', err);
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
        signInWithCustomGoogleEmail,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
