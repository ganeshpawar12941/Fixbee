import React, { useCallback, useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  BackHandler,
  StatusBar as RNStatusBar,
  ActivityIndicator,
  Image,
  Modal,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ComplaintsProvider, useComplaints } from './src/context/ComplaintsContext';
import { FixbeeAlertProvider } from './src/context/FixbeeAlertContext';
import { Colors } from './src/theme/colors';
import IntroScreen from './src/screens/IntroScreen';
import GoogleAuthScreen from './src/screens/GoogleAuthScreen';
import HomeScreen from './src/screens/HomeScreen';
import AddComplaintScreen from './src/screens/AddComplaintScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import AdminPanelScreen from './src/screens/AdminPanelScreen';
import ManagementPanelScreen from './src/screens/ManagementPanelScreen';
import StudentPanelScreen from './src/screens/StudentPanelScreen';
import ComplaintDetailModal from './src/screens/ComplaintDetailModal';
import NotificationsModal from './src/components/NotificationsModal';
import PushNotificationManager from './src/components/PushNotificationManager';

function MainApp() {
  const { user, isAuthenticated, isLoading, hasSeenIntro } = useAuth();
  const { toggleLike, refreshLocalData } = useComplaints();
  const insets = useSafeAreaInsets();

  const [currentTab, setCurrentTab] = useState('home'); // 'home' | 'center' | 'profile'
  const [showIntroModal, setShowIntroModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showMyComplaintsModal, setShowMyComplaintsModal] = useState(false);
  const [activeComplaintDetail, setActiveComplaintDetail] = useState(null);
  const [complaintToEdit, setComplaintToEdit] = useState(null);
  const [navigationHistory, setNavigationHistory] = useState([]);
  const [returnToMyComplaints, setReturnToMyComplaints] = useState(false);
  const handleNotificationResponse = useCallback(async () => {
    try {
      await refreshLocalData();
    } catch (error) {
      console.error('Could not refresh Fixbee data after opening a push notification.', error);
    }
    setCurrentTab('home');
    setShowNotificationsModal(true);
  }, [refreshLocalData]);

  const handleNotificationReceived = useCallback(() => {
    void refreshLocalData().catch((error) => {
      console.error('Could not refresh Fixbee data after receiving a push notification.', error);
    });
  }, [refreshLocalData]);

  const isStudent = user?.role === 'student';
  const isDean = user?.role === 'infrastructure_dean';
  const isWarden = user?.role === 'warden';
  const isAdmin = user?.role === 'admin';

  const navigateToTab = (nextTab) => {
    if (currentTab === nextTab) return;
    setNavigationHistory((history) => [...history, currentTab].slice(-20));
    setCurrentTab(nextTab);
  };

  const resetNavigationToHome = () => {
    setNavigationHistory([]);
    setReturnToMyComplaints(false);
    setCurrentTab('home');
  };

  const closeComplaintDetails = () => {
    setActiveComplaintDetail(null);
    if (returnToMyComplaints) {
      setShowMyComplaintsModal(true);
      setReturnToMyComplaints(false);
    }
  };

  const goBack = () => {
    if (activeComplaintDetail) {
      closeComplaintDetails();
      return true;
    }
    if (showNotificationsModal) {
      setShowNotificationsModal(false);
      return true;
    }
    if (showMyComplaintsModal) {
      setShowMyComplaintsModal(false);
      return true;
    }
    if (showIntroModal) {
      setShowIntroModal(false);
      return true;
    }
    if (currentTab === 'home') {
      return false;
    }
    if (navigationHistory.length > 0) {
      const previousTab = navigationHistory[navigationHistory.length - 1];
      setNavigationHistory((history) => history.slice(0, -1));
      setCurrentTab(previousTab);
      if (complaintToEdit) setComplaintToEdit(null);
      if (returnToMyComplaints) {
        setShowMyComplaintsModal(true);
        setReturnToMyComplaints(false);
      }
      return true;
    }
    setCurrentTab('home');
    return true;
  };

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', goBack);
    return () => subscription.remove();
  }, [
    activeComplaintDetail,
    showNotificationsModal,
    showMyComplaintsModal,
    showIntroModal,
    navigationHistory,
    complaintToEdit,
    returnToMyComplaints,
    currentTab,
  ]);

  // Reset modal if role changes away from student
  useEffect(() => {
    if (!isStudent && showMyComplaintsModal) {
      setShowMyComplaintsModal(false);
    }
    if (!isStudent && complaintToEdit) {
      setComplaintToEdit(null);
    }
  }, [isStudent, showMyComplaintsModal, complaintToEdit]);

  // 1. Initial Loading Splash
  if (isLoading) {
    return (
      <View style={styles.splashContainer}>
        <View style={styles.splashLogoCard}>
          <Image
            source={require('./assets/fixbee_bee_logo.png')}
            style={styles.splashLogoImage}
            resizeMode="contain"
          />
        </View>
        <View style={styles.splashTitleRow}>
          <Text style={styles.splashTitleFix}>Fix</Text>
          <Text style={styles.splashTitleBee}>bee</Text>
        </View>
        <Text style={styles.splashTagline}>buzz it • fix it</Text>
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 24 }} />
      </View>
    );
  }

  // 2. Intro Screen with auto-advancing animation
  if (!hasSeenIntro || showIntroModal) {
    return (
      <SafeAreaView style={[styles.safeArea, { paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0 }]}>
        <IntroScreen onProceed={() => setShowIntroModal(false)} />
        <StatusBar style="light" />
      </SafeAreaView>
    );
  }

  // 3. Google Authentication Screen (Only Google Login)
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={[styles.safeArea, { paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0 }]}>
        <GoogleAuthScreen />
        <StatusBar style="light" />
      </SafeAreaView>
    );
  }

  // Center Yellow Bump Button config per role
  const getCenterButtonConfig = () => {
    if (isAdmin) {
      return { label: 'Admin', icon: 'speedometer' };
    }
    if (isDean) {
      return { label: 'Campus', icon: 'business' };
    }
    if (isWarden) {
      return { label: 'Hostels', icon: 'bed' };
    }
    return { label: 'Complaints', icon: 'add' };
  };

  const centerConfig = getCenterButtonConfig();

  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0 }]}>
      <PushNotificationManager
        onNotificationReceived={handleNotificationReceived}
        onNotificationResponse={handleNotificationResponse}
      />
      <View style={styles.phoneContainer}>
        {/* Screen Content */}
        <View style={styles.screenContainer}>
          {/* Tab 1: Feed */}
          {currentTab === 'home' && (
            <HomeScreen
              onNavigateAdd={() => {
                if (isStudent) {
                  setComplaintToEdit(null);
                  navigateToTab('center');
                }
              }}
              onProfilePress={() => navigateToTab('profile')}
              onNotificationsPress={() => setShowNotificationsModal(true)}
            />
          )}

          {/* Tab 2 (Center Yellow Bump): Role-Specific Action/Desk */}
          {currentTab === 'center' && (
            <>
              {isStudent ? (
                <AddComplaintScreen
                  complaintToEdit={complaintToEdit}
                  onSuccessNavigation={() => {
                    setComplaintToEdit(null);
                    resetNavigationToHome();
                  }}
                />
              ) : isAdmin ? (
                <AdminPanelScreen
                  onSelectComplaint={(c) => setActiveComplaintDetail(c)}
                />
              ) : (
                <ManagementPanelScreen
                  onSelectComplaint={(c) => setActiveComplaintDetail(c)}
                />
              )}
            </>
          )}

          {/* Tab 3: Profile (includes My Complaints for students) */}
          {currentTab === 'profile' && (
            <ProfileScreen
              onBack={goBack}
              onReplayIntro={() => setShowIntroModal(true)}
              onOpenMyComplaints={() => setShowMyComplaintsModal(true)}
            />
          )}
        </View>

        {/* My Complaints Modal (Moved to Profile for Students) */}
        {showMyComplaintsModal && isStudent && (
          <Modal
            visible={showMyComplaintsModal}
            animationType="slide"
            transparent={false}
            onRequestClose={() => setShowMyComplaintsModal(false)}
          >
            <SafeAreaView style={[styles.safeArea, { paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0 }]}>
              <View style={styles.phoneContainer}>
                <View style={styles.modalTopBar}>
                  <TouchableOpacity
                    onPress={() => setShowMyComplaintsModal(false)}
                    style={styles.modalCloseBtn}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
                  </TouchableOpacity>
                  <Text style={styles.modalTopTitle}>My Complaints</Text>
                  <View style={{ width: 22 }} />
                </View>

                <StudentPanelScreen
                  onSelectComplaint={(c) => {
                    setShowMyComplaintsModal(false);
                    setReturnToMyComplaints(true);
                    setActiveComplaintDetail(c);
                  }}
                  onNavigateAdd={() => {
                    setShowMyComplaintsModal(false);
                    setComplaintToEdit(null);
                    setReturnToMyComplaints(true);
                    navigateToTab('center');
                  }}
                  onEditComplaint={(complaint) => {
                    setShowMyComplaintsModal(false);
                    setComplaintToEdit(complaint);
                    setReturnToMyComplaints(true);
                    navigateToTab('center');
                  }}
                />
              </View>
            </SafeAreaView>
          </Modal>
        )}

        {/* Notifications Modal */}
        {showNotificationsModal && (
          <NotificationsModal
            visible={showNotificationsModal}
            onClose={() => setShowNotificationsModal(false)}
            onSelectComplaint={(c) => setActiveComplaintDetail(c)}
          />
        )}

        {/* Full Complaint Details Modal */}
        {activeComplaintDetail && (
          <ComplaintDetailModal
            visible={!!activeComplaintDetail}
            complaint={activeComplaintDetail}
            onClose={closeComplaintDetails}
            onLike={toggleLike}
          />
        )}

        {/* Unified 3-Tab Bottom Navigation Bar with Yellow Bump Style for ALL Logins */}
        <View style={[styles.bottomNavBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          {/* 1. Left Tab: Feed */}
          <TouchableOpacity
            style={styles.navTab}
            onPress={() => navigateToTab('home')}
            activeOpacity={0.7}
          >
            <Ionicons
              name={currentTab === 'home' ? 'flame' : 'flame-outline'}
              size={22}
              color={currentTab === 'home' ? Colors.primary : Colors.textMuted}
            />
            <Text style={[styles.navLabel, currentTab === 'home' && styles.navLabelActive]}>
              Feed
            </Text>
          </TouchableOpacity>

          {/* 2. Center Hero Yellow Bump Button (All Logins) */}
          <TouchableOpacity
            style={styles.centerAddButton}
            onPress={() => navigateToTab('center')}
            activeOpacity={0.85}
          >
            <View style={[styles.centerAddCircle, currentTab === 'center' && styles.centerAddCircleActive]}>
              <Ionicons
                name={centerConfig.icon}
                size={isStudent ? 28 : 22}
                color="#0A0A0C"
              />
            </View>
            <Text style={[styles.centerLabel, currentTab === 'center' && styles.centerLabelActive]}>
              {centerConfig.label}
            </Text>
          </TouchableOpacity>

          {/* 3. Right Tab: Profile */}
          <TouchableOpacity
            style={styles.navTab}
            onPress={() => navigateToTab('profile')}
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
          <FixbeeAlertProvider>
            <MainApp />
          </FixbeeAlertProvider>
        </ComplaintsProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    width: '100%',
    backgroundColor: Colors.bgDark,
    alignItems: 'center',
  },
  phoneContainer: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    backgroundColor: Colors.bgDark,
  },
  screenContainer: {
    flex: 1,
  },
  modalTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.bgCardElevated,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalTopTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  splashContainer: {
    flex: 1,
    backgroundColor: Colors.bgDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashLogoCard: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.primary,
    marginBottom: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
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
    fontSize: 34,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  splashTitleBee: {
    fontSize: 34,
    fontWeight: '900',
    color: Colors.primary,
    letterSpacing: -0.5,
  },
  splashTagline: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginTop: 4,
    letterSpacing: 2.2,
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
    fontSize: 10,
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
    backgroundColor: '#FDE047',
    transform: [{ scale: 1.06 }],
  },
  centerLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  centerLabelActive: {
    color: Colors.primary,
    fontWeight: '800',
  },
});
