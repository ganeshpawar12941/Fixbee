import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { useComplaints } from '../context/ComplaintsContext';

export default function ProfileScreen({ onBack, onReplayIntro, onOpenMyComplaints }) {
  const { user, signOut } = useAuth();
  const { getStudentDashboardData } = useComplaints();

  const isStudent = user?.role === 'student';
  const studentDashboard = isStudent ? getStudentDashboardData() : null;
  const studentStats = studentDashboard?.statistics;
  const monthlyUsage = studentDashboard?.monthlyUsage;

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of FixBee?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'warden':
        return { label: 'Hostel Warden', color: Colors.primary, bg: 'rgba(255, 193, 7, 0.12)' };
      case 'infrastructure_dean':
        return { label: 'Dean Infrastructure', color: Colors.primary, bg: 'rgba(255, 193, 7, 0.12)' };
      case 'admin':
        return { label: 'Campus Admin', color: Colors.primary, bg: 'rgba(255, 193, 7, 0.12)' };
      default:
        return { label: 'Student Resident', color: Colors.primary, bg: 'rgba(255, 193, 7, 0.12)' };
    }
  };

  const badge = getRoleBadge(user?.role);

  return (
    <ScrollView style={styles.screenContainer} contentContainerStyle={styles.scrollContent}>
      {/* Top Header */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Account & Permissions</Text>
        <View style={{ width: 22 }} />
      </View>

      {/* User Hero Card */}
      <View style={styles.userHeroCard}>
        <View style={styles.avatarWrapper}>
          <Image
            source={user?.profilePicture ? { uri: user.profilePicture } : require('../../assets/fixbee_bee_logo.png')}
            style={styles.avatarImg}
          />
          <View style={styles.verifiedTick}>
            <Ionicons name="checkmark-sharp" size={12} color="#0A0A0C" />
          </View>
        </View>

        <Text style={styles.userName}>{user?.name}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>

        <View style={[styles.roleBadgeBox, { backgroundColor: badge.bg }]}>
          <Ionicons name="shield-checkmark" size={13} color={badge.color} />
          <Text style={[styles.roleBadgeText, { color: badge.color }]}>{badge.label}</Text>
        </View>

        <View style={styles.detailsDivider} />

        <View style={styles.deptRow}>
          <View style={styles.deptItem}>
            <Text style={styles.deptLabel}>Department / Unit</Text>
            <Text style={styles.deptValue}>{user?.department || 'Campus Community'}</Text>
          </View>
          <View style={styles.deptItem}>
            <Text style={styles.deptLabel}>Jurisdiction / Location</Text>
            <Text style={styles.deptValue}>{user?.room || user?.jurisdiction || 'Campus Grounds'}</Text>
          </View>
        </View>
      </View>

      {/* My Complaints Entry (Moved from Bottom Nav into Profile for Students) */}
      {isStudent && (
        <TouchableOpacity
          style={styles.myComplaintsCard}
          onPress={onOpenMyComplaints}
          activeOpacity={0.85}
        >
          <View style={styles.myComplaintsLeft}>
            <View style={styles.myComplaintsIconBox}>
              <Ionicons name="folder-open" size={20} color="#0A0A0C" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.myComplaintsTitle}>My Complaints</Text>
              <Text style={styles.myComplaintsSub}>
                {studentStats?.totalComplaints || 0} total • {studentStats?.pending || 0} pending review • {studentStats?.resolved || 0} resolved
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.primary} />
        </TouchableOpacity>
      )}

      {/* Complaint rules */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeaderRow}>
          <Ionicons name="information-circle-outline" size={18} color={Colors.primary} />
          <Text style={styles.sectionHeaderTitle}>Complaint Rules</Text>
        </View>

        <View style={styles.ruleCard}>
          <View style={styles.ruleItem}>
            <Ionicons name="calendar-outline" size={16} color={Colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.ruleTitle}>Monthly Submission Cap</Text>
              <Text style={styles.ruleDesc}>
                {monthlyUsage
                  ? `Students can submit up to ${monthlyUsage.limit} complaints each month. You have used ${monthlyUsage.submitted} of ${monthlyUsage.limit}.`
                  : 'Students can submit up to 3 complaints each month.'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Action Buttons: Replay Intro & Sign Out */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.secondaryActionBtn} onPress={onReplayIntro} activeOpacity={0.8}>
          <Ionicons name="play-circle-outline" size={18} color={Colors.textSecondary} />
          <Text style={styles.secondaryActionText}>Replay Intro Walkthrough</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={18} color={Colors.accentDanger} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: Colors.bgDark,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backBtn: {
    padding: 4,
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  userHeroCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    alignItems: 'center',
    padding: 20,
    marginBottom: 18,
  },
  avatarWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2.5,
    borderColor: Colors.primary,
    position: 'relative',
    marginBottom: 10,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 36,
  },
  verifiedTick: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.bgDark,
  },
  userName: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  userEmail: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
    marginBottom: 8,
  },
  roleBadgeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    gap: 5,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  detailsDivider: {
    width: '100%',
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: 14,
  },
  deptRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  deptItem: {
    flex: 1,
  },
  deptLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  deptValue: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  sectionContainer: {
    marginBottom: 18,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  sectionHeaderTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  ruleCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    padding: 14,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  ruleTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  ruleDesc: {
    fontSize: 11,
    color: Colors.textMuted,
    lineHeight: 16,
    marginTop: 2,
  },
  ruleDivider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: 12,
  },
  actionsContainer: {
    gap: 10,
    marginTop: 6,
  },
  secondaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16161E',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#262634',
    paddingVertical: 12,
    gap: 8,
  },
  secondaryActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    paddingVertical: 12,
    gap: 8,
  },
  signOutText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.accentDanger,
  },
  myComplaintsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.bgCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.primary,
    padding: 14,
    marginBottom: 18,
  },
  myComplaintsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  myComplaintsIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  myComplaintsTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  myComplaintsSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
