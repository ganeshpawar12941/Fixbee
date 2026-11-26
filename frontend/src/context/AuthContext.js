import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '../config/api';

const AuthContext = createContext({});

export const PRESET_USERS = [
  {
    id: 'usr_student_01',
    _id: '670000000000000000000001',
    name: 'Alex Johnson',
    email: 'alex.j@campus.edu',
    role: 'student',
    profilePicture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    department: 'Computer Science & Eng',
    room: 'Hostel Block B - Room 304',
    strikes: 0,
    monthlyLimit: 10,
    submittedThisMonth: 3,
  },
  {
    id: 'usr_warden_01',
    _id: '670000000000000000000002',
    name: 'Major Rajesh Verma',
    email: 'warden.verma@campus.edu',
    role: 'warden',
    profilePicture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    department: 'Chief Hostel Warden',
    jurisdiction: "Boys' & Girls' Hostels",
  },
  {
    id: 'usr_dean_01',
    _id: '670000000000000000000003',
    name: 'Dr. Sunita Deshmukh',
    email: 'dean.infra@campus.edu',
    role: 'infrastructure_dean',
    profilePicture: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    department: 'Dean of Infrastructure & Works',
    jurisdiction: 'Entire Campus Facilities',
  },
  {
    id: 'usr_admin_01',
    _id: '670000000000000000000004',
    name: 'R. K. Saxena (Admin)',
    email: 'admin.fixbee@campus.edu',
    role: 'admin',
    profilePicture: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    department: 'FixBee Campus Administrator',
    jurisdiction: 'Full System Access',
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
      } else {
        // Default to student preset
        const defaultUser = PRESET_USERS[0];
        const defaultToken = `mock_jwt_token_${defaultUser.id}`;
        setUser(defaultUser);
        setToken(defaultToken);
        await AsyncStorage.setItem('@fixbee_user', JSON.stringify(defaultUser));
        await AsyncStorage.setItem('@fixbee_token', defaultToken);
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
      const profile = selectedPresetUser || PRESET_USERS[0];
      const jwtToken = `jwt_${profile.role}_${profile.id}_${Date.now()}`;

      await AsyncStorage.setItem('@fixbee_user', JSON.stringify(profile));
      await AsyncStorage.setItem('@fixbee_token', jwtToken);

      setUser(profile);
      setToken(jwtToken);
      return { success: true, user: profile };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  };

  const switchRole = async (targetRole) => {
    const matched = PRESET_USERS.find((u) => u.role === targetRole) || PRESET_USERS[0];
    await signInWithGoogle(matched);
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
        switchRole,
        signOut,
        presetUsers: PRESET_USERS,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
