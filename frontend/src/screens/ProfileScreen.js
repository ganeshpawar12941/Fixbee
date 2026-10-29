import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { useAuth, PRESET_GOOGLE_USERS } from '../context/AuthContext';
import { useComplaints } from '../context/ComplaintsContext';

export default function ProfileScreen({ onBack, onReplayIntro }) {
  const { user, signOut, signInWithGoogle } = useAuth();
  const { complaints, deleteComplaint } = useComplaints();

  if (!user) return null;

  const handleDeleteIssue = (id) => {
    Alert.alert(
      'Delete Issue',
      'Are you sure you want to delete this reported issue? This will remove it from campus feeds.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteComplaint(id),
        },
      ]
    );
  };

  const myComplaints = complaints.filter((c) => c.author?.id === user.id);
  const myTotalBuzzes = myComplaints.reduce((sum, c) => sum + c.buzzCount, 0);
  const myResolved = myComplaints.filter((c) => c.status === 'Resolved').length;

  return (
    <View style={styles.container}>
      {/* Header Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Campus Student Profile</Text>
        <TouchableOpacity style={styles.replayBtn} onPress={onReplayIntro}>
          <Ionicons name="help-circle-outline" size={22} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* User Google Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarWrapper}>
            <Image source={{ uri: user.avatar }} style={styles.avatar} />
            <View style={styles.googleBadge}>
              <Ionicons name="logo-google" size={12} color="#FFF" />
            </View>
          </View>

          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>

          <View style={styles.verifiedRow}>
            <Ionicons name="shield-checkmark" size={14} color={Colors.accentSuccess} />
            <Text style={styles.verifiedText}>Verified Campus Student ({user.collegeDomain || 'campus.edu'})</Text>
          </View>

          <View style={styles.detailChipsRow}>
            <View style={styles.detailChip}>
              <Ionicons name="school-outline" size={12} color={Colors.primary} />
              <Text style={styles.detailChipText}>{user.department}</Text>
            </View>
            {user.room ? (
              <View style={styles.detailChip}>
                <Ionicons name="home-outline" size={12} color={Colors.primary} />
                <Text style={styles.detailChipText}>{user.room}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Campus Impact & Stats */}
        <View style={styles.statsCard}>
          <Text style={styles.cardHeader}>Campus Impact Metrics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCell}>
              <Text style={styles.statNum}>{myComplaints.length}</Text>
              <Text style={styles.statLabel}>Issues Buzzed</Text>
            </View>
            <View style={styles.statCell}>
              <Text style={[styles.statNum, { color: Colors.primary }]}>{myTotalBuzzes}</Text>
              <Text style={styles.statLabel}>Peer Upvotes</Text>
            </View>
            <View style={styles.statCell}>
              <Text style={[styles.statNum, { color: Colors.accentSuccess }]}>{myResolved}</Text>
              <Text style={styles.statLabel}>Fixed Issues</Text>
            </View>
          </View>
        </View>

        {/* Persona Switcher for Quick Demo / Testing */}
        <View style={styles.personaCard}>
          <Text style={styles.cardHeader}>Switch Google Account (Demo / Peer Upvote Test)</Text>
          <Text style={styles.cardSub}>
            Switch students to test upvoting each other's complaints and watching them gain priority:
          </Text>

          <View style={styles.personaRow}>
            {PRESET_GOOGLE_USERS.map((preset) => {
              const isCurrent = user.id === preset.id;
              return (
                <TouchableOpacity
                  key={preset.id}
                  style={[styles.personaChip, isCurrent && styles.personaChipActive]}
                  onPress={() => signInWithGoogle(preset)}
                  activeOpacity={0.7}
                >
                  <Image source={{ uri: preset.avatar }} style={styles.personaAvatar} />
                  <Text style={[styles.personaText, isCurrent && styles.personaTextActive]}>
                    {preset.name.split(' ')[0]} {isCurrent ? '(You)' : ''}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* My Reported Complaints Preview */}
        <View style={styles.myIssuesSection}>
          <Text style={styles.cardHeader}>My Reported Issues ({myComplaints.length})</Text>

          {myComplaints.length === 0 ? (
            <Text style={styles.noIssuesText}>You haven't reported any issues yet.</Text>
          ) : (
            myComplaints.map((cmp) => (
              <View key={cmp.id} style={styles.myIssueItem}>
                <View style={styles.myIssueTop}>
                  <Text style={styles.myIssueTitle} numberOfLines={1}>
                    {cmp.title}
                  </Text>
                  <View style={styles.topRightActions}>
                    <View style={[styles.myStatusPill, { borderColor: cmp.statusColor }]}>
                      <Text style={[styles.myStatusText, { color: cmp.statusColor }]}>{cmp.status}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.deleteIssueBtn}
                      onPress={() => handleDeleteIssue(cmp.id)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="trash-outline" size={14} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.myIssueBottom}>
                  <Text style={styles.myIssueLoc} numberOfLines={1}>
                    {cmp.location}
                  </Text>
                  <View style={styles.upvoteTag}>
                    <Ionicons name="heart" size={12} color={Colors.primary} />
                    <Text style={styles.myIssueBuzzes}>
                      {cmp.buzzCount} {cmp.buzzCount === 1 ? 'Buzz' : 'Buzzes'}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={signOut} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={18} color="#EF4444" />
          <Text style={styles.logoutText}>Sign Out of Google</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgDark,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  backBtn: {
    padding: 6,
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  replayBtn: {
    padding: 6,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    marginBottom: 16,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 2.5,
    borderColor: Colors.primary,
  },
  googleBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#4285F4',
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.bgDark,
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
    marginBottom: 8,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
    marginBottom: 12,
  },
  verifiedText: {
    fontSize: 11,
    color: Colors.accentSuccess,
    fontWeight: '700',
  },
  detailChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  detailChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCardElevated,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 6,
  },
  detailChipText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  statsCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    marginBottom: 16,
  },
  cardHeader: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statCell: {
    alignItems: 'center',
  },
  statNum: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '600',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  personaCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    marginBottom: 16,
  },
  cardSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 12,
    lineHeight: 16,
  },
  personaRow: {
    flexDirection: 'row',
    gap: 8,
  },
  personaChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCardElevated,
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    gap: 6,
  },
  personaChipActive: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(255, 184, 0, 0.12)',
  },
  personaAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  personaText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  personaTextActive: {
    color: Colors.primary,
    fontWeight: '800',
  },
  myIssuesSection: {
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    marginBottom: 20,
  },
  noIssuesText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  myIssueItem: {
    backgroundColor: Colors.bgCardElevated,
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  myIssueTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  myIssueTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deleteIssueBtn: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  myStatusPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  myStatusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  myIssueBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  myIssueLoc: {
    fontSize: 11,
    color: Colors.textMuted,
    flex: 1,
    marginRight: 6,
  },
  upvoteTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  myIssueBuzzes: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    gap: 8,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#EF4444',
  },
});
