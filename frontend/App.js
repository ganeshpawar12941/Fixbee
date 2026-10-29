import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar as RNStatusBar,
  ActivityIndicator,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ComplaintsProvider } from './src/context/ComplaintsContext';
import { Colors } from './src/theme/colors';
import IntroScreen from './src/screens/IntroScreen';
import GoogleAuthScreen from './src/screens/GoogleAuthScreen';
import HomeScreen from './src/screens/HomeScreen';
import AddComplaintScreen from './src/screens/AddComplaintScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import BeeAnimation from './src/components/BeeAnimation';

function MainApp() {
  const { isAuthenticated, isLoading, hasSeenIntro, resetIntro } = useAuth();
  const insets = useSafeAreaInsets();
  const [currentTab, setCurrentTab] = useState('home'); // 'home' | 'add' | 'profile'
  const [showIntroModal, setShowIntroModal] = useState(false);

  // 1. Initial Loading Splash
  if (isLoading) {
    return (
      <View style={styles.splashContainer}>
        <View style={styles.splashLogoCard}>
          <Image
            source={require('./assets/fixbee_logo.jpg')}
            style={styles.splashLogoImage}
            resizeMode="contain"
          />
        </View>
        <View style={styles.splashTitleRow}>
          <Text style={styles.splashTitleFix}>Fix</Text>
          <Text style={styles.splashTitleBee}>bee</Text>
        </View>
        <Text style={styles.splashTagline}>buzz it  fix it</Text>
        <ActivityIndicator color="#F5A623" style={{ marginTop: 24 }} />
      </View>
    );
  }

  // 2. Intro / Onboarding Screen if first time or triggered from settings
  if (!hasSeenIntro || showIntroModal) {
    return (
      <SafeAreaView style={[styles.safeArea, { paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0 }]}>
        <IntroScreen onProceed={() => setShowIntroModal(false)} />
        <StatusBar style="light" />
      </SafeAreaView>
    );
  }

  // 3. Google Authentication Only Screen
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={[styles.safeArea, { paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0 }]}>
        <GoogleAuthScreen />
        <StatusBar style="light" />
      </SafeAreaView>
    );
  }

  // 4. Authenticated Main View with Custom Bottom Navigation Bar
  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0 }]}>
      <View style={styles.screenContainer}>
        {currentTab === 'home' && (
          <HomeScreen
            onNavigateAdd={() => setCurrentTab('add')}
            onProfilePress={() => setCurrentTab('profile')}
            onIntroPress={() => setShowIntroModal(true)}
          />
        )}

        {currentTab === 'add' && (
          <AddComplaintScreen
            onSuccessNavigation={() => {
              setCurrentTab('home');
            }}
          />
        )}

        {currentTab === 'profile' && (
          <ProfileScreen
            onBack={() => setCurrentTab('home')}
            onReplayIntro={() => setShowIntroModal(true)}
          />
        )}
      </View>

      {/* Modern Custom Bottom Tab Bar */}
      <View style={[styles.bottomNavBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        {/* Tab 1: Feed */}
        <TouchableOpacity
          style={styles.navTab}
          onPress={() => setCurrentTab('home')}
          activeOpacity={0.7}
        >
          <Ionicons
            name={currentTab === 'home' ? 'flash' : 'flash-outline'}
            size={22}
            color={currentTab === 'home' ? Colors.primary : Colors.textMuted}
          />
          <Text style={[styles.navLabel, currentTab === 'home' && styles.navLabelActive]}>
            Feed
          </Text>
        </TouchableOpacity>

        {/* Tab 2 (Center Hero): Buzz An Issue */}
        <TouchableOpacity
          style={styles.centerAddButton}
          onPress={() => setCurrentTab('add')}
          activeOpacity={0.85}
        >
          <View style={[styles.centerAddCircle, currentTab === 'add' && styles.centerAddCircleActive]}>
            <Ionicons name="add" size={28} color="#0B0F19" />
          </View>
          <Text style={[styles.centerLabel, currentTab === 'add' && styles.centerLabelActive]}>
            Report
          </Text>
        </TouchableOpacity>

        {/* Tab 3: Profile */}
        <TouchableOpacity
          style={styles.navTab}
          onPress={() => setCurrentTab('profile')}
          activeOpacity={0.7}
        >
          <Ionicons
            name={currentTab === 'profile' ? 'person' : 'person-outline'}
            size={22}
            color={currentTab === 'profile' ? Colors.primary : Colors.textMuted}
          />
          <Text style={[styles.navLabel, currentTab === 'profile' && styles.navLabelActive]}>
            Profile
          </Text>
        </TouchableOpacity>
      </View>

      <StatusBar style="light" />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ComplaintsProvider>
          <MainApp />
        </ComplaintsProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.bgDark,
  },
  screenContainer: {
    flex: 1,
  },
  splashContainer: {
    flex: 1,
    backgroundColor: Colors.bgDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashLogoCard: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#F5A623',
    marginBottom: 16,
    shadowColor: '#F5A623',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  splashLogoImage: {
    width: '90%',
    height: '90%',
  },
  splashTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  splashTitleFix: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  splashTitleBee: {
    fontSize: 32,
    fontWeight: '900',
    color: '#F5A623',
    letterSpacing: -0.5,
  },
  splashTagline: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 4,
    textTransform: 'lowercase',
    letterSpacing: 2.6,
  },
  bottomNavBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: Colors.bgCardElevated,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
    paddingTop: 8,
  },
  navTab: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 4,
  },
  navLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
    marginTop: 3,
  },
  navLabelActive: {
    color: Colors.primary,
    fontWeight: '800',
  },
  centerAddButton: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    top: -12,
  },
  centerAddCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 3,
    borderColor: Colors.bgDark,
  },
  centerAddCircleActive: {
    backgroundColor: '#FBBF24',
    transform: [{ scale: 1.05 }],
  },
  centerLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  centerLabelActive: {
    color: Colors.primary,
    fontWeight: '800',
  },
});
