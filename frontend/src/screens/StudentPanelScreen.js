import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, StatusPills } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { useComplaints } from '../context/ComplaintsContext';

export default function StudentPanelScreen({
  onSelectComplaint,
  onNavigateAdd,
  onEditComplaint,
}) {
  const { user } = useAuth();
  const {
    complaints,
    getStudentDashboardData,
    deleteComplaint,
    refreshLocalData,
  } = useComplaints();

  const [refreshing, setRefreshing] = useState(false);

  const studentData = getStudentDashboardData();
  const stats = studentData.statistics;
  const usage = studentData.monthlyUsage;

  const currentUserId = user?._id || user?.id || '';
  const myComplaints = complaints.filter(
    (c) => (c.student?._id || c.student?.id || c.student) === currentUserId
  );

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshLocalData();
    } catch (error) {
      Alert.alert('Unable to refresh', error.message || 'Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleDelete = (cmpId) => {
    Alert.alert(
      'Withdraw Complaint',
      'Are you sure you want to withdraw this complaint from the campus queue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Withdraw',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteComplaint(cmpId);
            } catch (error) {
              Alert.alert('Unable to withdraw complaint', error.message || 'Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={styles.screenContainer}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={Colors.primary}
          colors={[Colors.primary]}
        />
      }
    >
      {/* Student Profile Dashboard Banner */}
      <View style={styles.bannerCard}>
        <View style={styles.studentInfoRow}>
          <View style={styles.beeAvatar}>
            <Ionicons name="person" size={20} color={Colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.studentName}>{user?.name || 'Campus Student'}</Text>
            <Text style={styles.studentMeta}>
              {user?.department || 'Student'} • {user?.room || 'Hostel Resident'}
            </Text>
          </View>
        </View>

        {/* Monthly Submission Quota Bar */}
        <View style={styles.quotaBox}>
          <View style={styles.quotaHeader}>
            <Text style={styles.quotaTitle}>Monthly Report Quota</Text>
            <Text style={styles.quotaNumbers}>
              {usage.submitted} / {usage.limit} Used ({usage.remaining} left)
            </Text>
          </View>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${Math.min(100, (usage.submitted / usage.limit) * 100)}%` },
              ]}
            />
          </View>
        </View>

        {/* Quality Guard Status */}
        <View style={styles.safetyStatusRow}>
          <Ionicons name="information-circle-outline" size={15} color={Colors.primary} />
          <Text style={styles.safetyStatusText}>
            Reports are reviewed by campus management after submission.
          </Text>
        </View>
      </View>

      {/* KPI Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{stats.totalComplaints}</Text>
          <Text style={styles.statLabel}>Total Submitted</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNumber, { color: Colors.primary }]}>{stats.pending}</Text>
          <Text style={styles.statLabel}>Pending Review</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNumber, { color: Colors.primary }]}>{stats.inProgress}</Text>
          <Text style={styles.statLabel}>In Progress</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNumber, { color: '#22C55E' }]}>{stats.resolved}</Text>
          <Text style={styles.statLabel}>Resolved</Text>
        </View>
      </View>

      {/* My Complaints Header */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>My Campus Reports ({myComplaints.length})</Text>
        <TouchableOpacity style={styles.addBtn} onPress={onNavigateAdd} activeOpacity={0.8}>
          <Ionicons name="add" size={16} color="#0A0A0C" />
          <Text style={styles.addBtnText}>New Report</Text>
        </TouchableOpacity>
      </View>

      {/* Complaints List */}
      {myComplaints.length > 0 ? (
        myComplaints.map((item) => {
          const statusInfo = StatusPills[item.status] || StatusPills.submitted;
          return (
            <View key={item._id || item.id} style={styles.complaintCard}>
              <View style={styles.cardHeaderRow}>
                <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg, borderColor: `${statusInfo.color}40` }]}>
                  <Ionicons name={statusInfo.icon} size={11} color={statusInfo.color} style={{ marginRight: 4 }} />
                  <Text style={[styles.statusBadgeText, { color: statusInfo.color }]}>
                    {statusInfo.label}
                  </Text>
                </View>

                {item.status === 'submitted' && (
                  <View style={styles.ownerActions}>
                    <TouchableOpacity
                      onPress={() => onEditComplaint?.(item)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      accessibilityLabel="Edit complaint"
                    >
                      <Ionicons name="create-outline" size={16} color={Colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDelete(item._id || item.id)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      accessibilityLabel="Withdraw complaint"
                    >
                      <Ionicons name="trash-outline" size={15} color={Colors.accentDanger} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <TouchableOpacity activeOpacity={0.85} onPress={() => onSelectComplaint(item)}>
                <Text style={styles.complaintTitle}>{item.title}</Text>
                <Text style={styles.complaintDesc} numberOfLines={2}>
                  {item.description}
                </Text>
              </TouchableOpacity>

              {item.additionalInfo?.length > 0 && (
                <TouchableOpacity
                  style={styles.additionalInfoPreview}
                  activeOpacity={0.85}
                  onPress={() => onSelectComplaint(item)}
                >
                  <Ionicons name="information-circle-outline" size={16} color={Colors.primary} />
                  <View style={styles.additionalInfoPreviewContent}>
                    <Text style={styles.additionalInfoPreviewTitle}>Latest official update</Text>
                    <Text style={styles.additionalInfoPreviewText} numberOfLines={2}>
                      {item.additionalInfo[item.additionalInfo.length - 1].message}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}

              {/* Resolution Proof Photo shown directly in Student's account */}
              {item.status === 'resolved' && item.resolutionPhoto && (
                <TouchableOpacity
                  style={styles.resolutionProofBox}
                  activeOpacity={0.9}
                  onPress={() => onSelectComplaint(item)}
                >
                  <View style={styles.resolutionProofHeader}>
                    <Ionicons name="shield-checkmark" size={14} color="#22C55E" />
                    <Text style={styles.resolutionProofLabel}>Official Resolution Photo</Text>
                  </View>
                  <Image
                    source={{ uri: item.resolutionPhoto }}
                    style={styles.resolutionProofImage}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              )}

              <View style={styles.cardFooter}>
                <View style={styles.footerLeft}>
                  <Text style={styles.footerText}>▲ {item.likesCount || 0} upvotes</Text>
                </View>

                <TouchableOpacity
                  style={styles.viewThreadBtn}
                  onPress={() => onSelectComplaint(item)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.viewThreadText}>View Details</Text>
                  <Ionicons name="chevron-forward" size={13} color={Colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
          );
        })
      ) : (
        <View style={styles.emptyStateCard}>
          <Ionicons name="document-text-outline" size={38} color={Colors.textMuted} style={{ marginBottom: 6 }} />
          <Text style={styles.emptyTitle}>You haven't reported any issues yet</Text>
          <Text style={styles.emptySub}>
            Spot broken fixtures, electrical sparks, or water leaks? Buzz the campus team!
          </Text>
          <TouchableOpacity style={styles.emptyAddBtn} onPress={onNavigateAdd} activeOpacity={0.85}>
            <Ionicons name="flash" size={16} color="#0A0A0C" />
            <Text style={styles.emptyAddBtnText}>Report A Problem Now</Text>
          </TouchableOpacity>
        </View>
      )}
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
  bannerCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    padding: 16,
    marginBottom: 16,
  },
  studentInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  beeAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 193, 7, 0.15)',
    borderWidth: 1.5,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  beeAvatarEmoji: {
    fontSize: 22,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  studentMeta: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  quotaBox: {
    backgroundColor: '#16161E',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#242432',
  },
  quotaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  quotaTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  quotaNumbers: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#262634',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  safetyStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  safetyStatusText: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
  },
  statBox: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: Colors.textMuted,
    marginTop: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 4,
  },
  addBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0A0A0C',
  },
  complaintCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    padding: 14,
    marginBottom: 10,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  ownerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 14,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  complaintTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
    lineHeight: 18,
    marginBottom: 4,
  },
  complaintDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
    marginBottom: 10,
  },
  additionalInfoPreview: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(255, 193, 7, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 193, 7, 0.18)',
    borderRadius: 9,
    padding: 9,
    marginBottom: 10,
  },
  additionalInfoPreviewContent: {
    flex: 1,
  },
  additionalInfoPreviewTitle: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 3,
  },
  additionalInfoPreviewText: {
    color: Colors.textSecondary,
    fontSize: 11,
    lineHeight: 15,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    paddingTop: 8,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  footerText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  viewThreadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  viewThreadText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  emptyStateCard: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    padding: 30,
    gap: 6,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 6,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  emptySub: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 12,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    gap: 6,
  },
  emptyAddBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0A0A0C',
  },
  resolutionProofBox: {
    backgroundColor: 'rgba(34, 197, 94, 0.08)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    padding: 10,
    marginBottom: 10,
  },
  resolutionProofHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
  },
  resolutionProofLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#22C55E',
  },
  resolutionProofImage: {
    width: '100%',
    height: 140,
    borderRadius: 8,
  },
});
