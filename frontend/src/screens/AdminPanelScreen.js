import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, StatusPills } from '../theme/colors';
import { useComplaints } from '../context/ComplaintsContext';

export default function AdminPanelScreen({ onSelectComplaint }) {
  const { getAdminAnalyticsData, checkBackend, complaints } = useComplaints();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('dean'); // 'dean' | 'hostel' | 'all'

  const data = getAdminAnalyticsData();
  const stats = data.complaintStatistics;
  const overview = data.overview;
  const resolution = data.resolutionPerformance;

  const onRefresh = async () => {
    setRefreshing(true);
    await checkBackend();
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleEscalate = (cmp) => {
    Alert.alert('Priority Escalated', `Ticket "${cmp.title}" marked as high urgency for immediate dispatch.`);
  };

  // Filter complaints received by Dean Infra (all buildings in campus, excluding hostels)
  const deanBuildingComplaints = complaints.filter((c) => c.locationType === 'campus');
  // Filter complaints received by Hostel Warden
  const hostelComplaints = complaints.filter(
    (c) => c.locationType === 'boys_hostel' || c.locationType === 'girls_hostel'
  );

  const displayedComplaints =
    activeTab === 'dean'
      ? deanBuildingComplaints
      : activeTab === 'hostel'
      ? hostelComplaints
      : complaints;

  // Graph calculations for Solved vs Overdue vs Rejected
  const total = Math.max(stats.totalComplaints, 1);
  const solvedCount = stats.resolved || 0;
  const overdueCount = stats.overdue || 0;
  const rejectedCount = stats.rejected || 0;
  const inProgressCount = (stats.inProgress || 0) + (stats.underReview || 0);

  const solvedPercent = Math.round((solvedCount / total) * 100);
  const overduePercent = Math.round((overdueCount / total) * 100);
  const rejectedPercent = Math.round((rejectedCount / total) * 100);
  const inProgressPercent = Math.round((inProgressCount / total) * 100);

  return (
    <View style={styles.outerContainer}>
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
        {/* Admin Command Header */}
        <View style={styles.adminHeader}>
          <View style={styles.titleRow}>
            <View style={styles.shieldIconWrapper}>
              <Ionicons name="shield" size={18} color="#0A0A0C" />
            </View>
            <View>
              <Text style={styles.adminTitle}>Campus Admin Dashboard</Text>
              <Text style={styles.adminSubtitle}>Central Oversight & Performance Telemetry</Text>
            </View>
          </View>
          <View style={styles.liveIndicator}>
            <View style={styles.pulseDot} />
            <Text style={styles.liveText}>Live Telemetry</Text>
          </View>
        </View>

        {/* 1. Platform Key Metrics Grid */}
        <View style={styles.kpiGrid}>
          <View style={[styles.kpiCard, { borderColor: Colors.primary }]}>
            <Text style={[styles.kpiValue, { color: Colors.primary }]}>{stats.totalComplaints}</Text>
            <Text style={styles.kpiLabel}>Total Tickets</Text>
            <Ionicons name="receipt" size={14} color={Colors.primary} style={styles.kpiCornerIcon} />
          </View>

          <View style={[styles.kpiCard, { borderColor: Colors.primary }]}>
            <Text style={[styles.kpiValue, { color: Colors.primary }]}>{stats.pending}</Text>
            <Text style={styles.kpiLabel}>In Pipeline</Text>
            <Ionicons name="hourglass" size={14} color={Colors.primary} style={styles.kpiCornerIcon} />
          </View>

          <View style={[styles.kpiCard, { borderColor: '#22C55E' }]}>
            <Text style={[styles.kpiValue, { color: '#22C55E' }]}>{stats.resolved}</Text>
            <Text style={styles.kpiLabel}>Problems Solved</Text>
            <Ionicons name="checkmark-done" size={14} color="#22C55E" style={styles.kpiCornerIcon} />
          </View>

          <View style={[styles.kpiCard, { borderColor: stats.overdue > 0 ? '#EF4444' : Colors.borderSubtle }]}>
            <Text style={[styles.kpiValue, { color: stats.overdue > 0 ? '#EF4444' : Colors.textSecondary }]}>
              {stats.overdue}
            </Text>
            <Text style={styles.kpiLabel}>Overdue (&gt;24h)</Text>
            <Ionicons name="alert-circle" size={14} color={stats.overdue > 0 ? '#EF4444' : Colors.textMuted} style={styles.kpiCornerIcon} />
          </View>
        </View>

        {/* 2. Visual Graph: Problems Solved vs. Overdue vs. Rejected */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="bar-chart" size={16} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Resolution Graph: Solved vs Overdue vs Rejected</Text>
          </View>

          <View style={styles.graphContainer}>
            {/* Visual Comparative Graph Bar */}
            <View style={styles.stackedBar}>
              <View style={[styles.stackedSegment, { flex: Math.max(solvedCount, 0.05), backgroundColor: '#22C55E' }]} />
              <View style={[styles.stackedSegment, { flex: Math.max(inProgressCount, 0.05), backgroundColor: Colors.primary }]} />
              <View style={[styles.stackedSegment, { flex: Math.max(overdueCount, 0.05), backgroundColor: '#EF4444' }]} />
              <View style={[styles.stackedSegment, { flex: Math.max(rejectedCount, 0.05), backgroundColor: '#71717A' }]} />
            </View>

            {/* Detailed Metric Rows with Visual Progress Meters */}
            <View style={styles.metricProgressList}>
              {/* Solved Problems */}
              <View style={styles.metricProgressItem}>
                <View style={styles.metricProgressHeader}>
                  <View style={styles.metricDotRow}>
                    <View style={[styles.legendDot, { backgroundColor: '#22C55E' }]} />
                    <Text style={styles.metricItemTitle}>Problems Solved</Text>
                  </View>
                  <Text style={[styles.metricItemScore, { color: '#22C55E' }]}>
                    {solvedCount} ({solvedPercent}%)
                  </Text>
                </View>
                <View style={styles.progressBarTrack}>
                  <View style={[styles.progressBarFill, { width: `${solvedPercent}%`, backgroundColor: '#22C55E' }]} />
                </View>
              </View>

              {/* Overdue Problems */}
              <View style={styles.metricProgressItem}>
                <View style={styles.metricProgressHeader}>
                  <View style={styles.metricDotRow}>
                    <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
                    <Text style={styles.metricItemTitle}>Problems Overdue (&gt;24h SLA)</Text>
                  </View>
                  <Text style={[styles.metricItemScore, { color: '#EF4444' }]}>
                    {overdueCount} ({overduePercent}%)
                  </Text>
                </View>
                <View style={styles.progressBarTrack}>
                  <View style={[styles.progressBarFill, { width: `${overduePercent}%`, backgroundColor: '#EF4444' }]} />
                </View>
              </View>

              {/* Rejected Problems */}
              <View style={styles.metricProgressItem}>
                <View style={styles.metricProgressHeader}>
                  <View style={styles.metricDotRow}>
                    <View style={[styles.legendDot, { backgroundColor: '#71717A' }]} />
                    <Text style={styles.metricItemTitle}>Problems Rejected (Invalid/Duplicate)</Text>
                  </View>
                  <Text style={[styles.metricItemScore, { color: '#A1A1AA' }]}>
                    {rejectedCount} ({rejectedPercent}%)
                  </Text>
                </View>
                <View style={styles.progressBarTrack}>
                  <View style={[styles.progressBarFill, { width: `${rejectedPercent}%`, backgroundColor: '#71717A' }]} />
                </View>
              </View>

              {/* In Progress / Active */}
              <View style={styles.metricProgressItem}>
                <View style={styles.metricProgressHeader}>
                  <View style={styles.metricDotRow}>
                    <View style={[styles.legendDot, { backgroundColor: Colors.primary }]} />
                    <Text style={styles.metricItemTitle}>In Progress & Review</Text>
                  </View>
                  <Text style={[styles.metricItemScore, { color: Colors.primary }]}>
                    {inProgressCount} ({inProgressPercent}%)
                  </Text>
                </View>
                <View style={styles.progressBarTrack}>
                  <View style={[styles.progressBarFill, { width: `${inProgressPercent}%`, backgroundColor: Colors.primary }]} />
                </View>
              </View>
            </View>

            {/* SLA Summary Footer */}
            <View style={styles.slaFooter}>
              <Text style={styles.slaFooterText}>
                Average Resolution Time: <Text style={styles.slaHighlight}>{resolution.averageResolutionHours} hours</Text> ({resolution.averageResolutionDays} days)
              </Text>
            </View>
          </View>
        </View>

        {/* 3. Dean of Infrastructure: Campus Building Complaints Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="business" size={16} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Departmental Oversight: Dean & Warden</Text>
          </View>

          {/* Tab Selector between Dean Campus Buildings vs Hostel Warden */}
          <View style={styles.departmentTabsRow}>
            <TouchableOpacity
              style={[styles.deptTab, activeTab === 'dean' && styles.deptTabActive]}
              onPress={() => setActiveTab('dean')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="business-outline"
                size={14}
                color={activeTab === 'dean' ? '#0A0A0C' : Colors.textSecondary}
              />
              <Text style={[styles.deptTabText, activeTab === 'dean' && styles.deptTabTextActive]}>
                Dean Infra Buildings ({deanBuildingComplaints.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.deptTab, activeTab === 'hostel' && styles.deptTabActive]}
              onPress={() => setActiveTab('hostel')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="bed-outline"
                size={14}
                color={activeTab === 'hostel' ? '#0A0A0C' : Colors.textSecondary}
              />
              <Text style={[styles.deptTabText, activeTab === 'hostel' && styles.deptTabTextActive]}>
                Hostel Warden ({hostelComplaints.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Department Scope Description */}
          <View style={styles.scopeNotice}>
            <Ionicons name="information-circle-outline" size={14} color={Colors.primary} />
            <Text style={styles.scopeNoticeText}>
              {activeTab === 'dean'
                ? 'Displaying all complaints received by Dean of Infrastructure for academic blocks, labs, library, and campus grounds.'
                : "Displaying complaints assigned to the Hostel Warden for Boys' and Girls' residential hostels."}
            </Text>
          </View>

          {/* List of Complaints for Selected Department */}
          <View style={styles.complaintItemsList}>
            {displayedComplaints.length > 0 ? (
              displayedComplaints.map((item) => {
                const statusInfo = StatusPills[item.status] || StatusPills.submitted;
                return (
                  <View key={item._id || item.id} style={styles.complaintRowCard}>
                    <View style={styles.rowCardHeader}>
                      <View style={styles.categoryPill}>
                        <Text style={styles.categoryPillText}>
                          {(item.category || 'General').toUpperCase()}
                        </Text>
                      </View>
                      <View style={[styles.statusTag, { borderColor: statusInfo.color }]}>
                        <Text style={[styles.statusTagText, { color: statusInfo.color }]}>
                          {statusInfo.label}
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() => onSelectComplaint(item)}
                    >
                      <Text style={styles.rowCardTitle}>{item.title}</Text>
                      <Text style={styles.rowCardDesc} numberOfLines={2}>
                        {item.description}
                      </Text>
                    </TouchableOpacity>

                    <View style={styles.rowCardFooter}>
                      <Text style={styles.rowCardMeta}>
                        Reported by: {item.student?.name || 'Student'} • ▲ {item.likesCount || 0} Upvotes
                      </Text>

                      <TouchableOpacity
                        style={styles.inspectBtn}
                        onPress={() => onSelectComplaint(item)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.inspectBtnText}>Inspect Details</Text>
                        <Ionicons name="chevron-forward" size={13} color={Colors.primary} />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyNoticeBox}>
                <Text style={styles.emptyNoticeText}>No complaints currently registered under this scope.</Text>
              </View>
            )}
          </View>
        </View>

        {/* 4. Overdue Priority Escalation Radar */}
        {data.recentOverdueComplaints && data.recentOverdueComplaints.length > 0 && (
          <View style={[styles.sectionCard, { borderColor: 'rgba(239, 68, 68, 0.4)' }]}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="alert-circle" size={16} color="#EF4444" />
              <Text style={[styles.sectionTitle, { color: '#EF4444' }]}>
                Overdue Complaints Requiring Intervention ({data.recentOverdueComplaints.length})
              </Text>
            </View>

            {data.recentOverdueComplaints.map((item, idx) => (
              <View key={idx} style={styles.overdueItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.overdueTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.overdueMeta}>
                    {item.category?.toUpperCase()} • {item.locationType === 'campus' ? 'Campus Building' : 'Hostel'} • Status: {item.status}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.escalateBtn}
                  onPress={() => handleEscalate(item)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.escalateBtnText}>Escalate</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* 5. User Ecosystem Overview */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="people" size={16} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Campus User Ecosystem</Text>
          </View>

          <View style={styles.userRoleRow}>
            <View style={styles.userRoleBox}>
              <Text style={styles.userRoleVal}>{overview.totalStudents}</Text>
              <Text style={styles.userRoleLbl}>Students</Text>
            </View>
            <View style={styles.userRoleBox}>
              <Text style={styles.userRoleVal}>{overview.totalWardens}</Text>
              <Text style={styles.userRoleLbl}>Wardens</Text>
            </View>
            <View style={styles.userRoleBox}>
              <Text style={styles.userRoleVal}>{overview.totalInfrastructureDeans}</Text>
              <Text style={styles.userRoleLbl}>Deans</Text>
            </View>
            <View style={styles.userRoleBox}>
              <Text style={styles.userRoleVal}>{overview.totalAdmins}</Text>
              <Text style={styles.userRoleLbl}>Admins</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: Colors.bgDark,
    alignItems: 'center',
    width: '100%',
  },
  screenContainer: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
  },
  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 80,
  },
  adminHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.bgCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    padding: 14,
    marginBottom: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  shieldIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  adminSubtitle: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 1,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 5,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
  },
  liveText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#22C55E',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  kpiCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    position: 'relative',
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 2,
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  kpiCornerIcon: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  sectionCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    padding: 14,
    marginBottom: 14,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  graphContainer: {
    paddingTop: 2,
  },
  stackedBar: {
    flexDirection: 'row',
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    backgroundColor: '#1E1E26',
    marginBottom: 14,
  },
  stackedSegment: {
    height: '100%',
  },
  metricProgressList: {
    gap: 10,
    marginBottom: 12,
  },
  metricProgressItem: {
    gap: 4,
  },
  metricProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricDotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  metricItemTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  metricItemScore: {
    fontSize: 11,
    fontWeight: '800',
  },
  progressBarTrack: {
    height: 5,
    backgroundColor: '#181820',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  slaFooter: {
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    paddingTop: 8,
  },
  slaFooterText: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  slaHighlight: {
    color: Colors.primary,
    fontWeight: '800',
  },
  departmentTabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  deptTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#161620',
    borderRadius: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#242434',
    gap: 6,
  },
  deptTabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  deptTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  deptTabTextActive: {
    color: '#0A0A0C',
    fontWeight: '900',
  },
  scopeNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161622',
    borderRadius: 8,
    padding: 8,
    gap: 6,
    marginBottom: 12,
  },
  scopeNoticeText: {
    fontSize: 10,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 14,
  },
  complaintItemsList: {
    gap: 8,
  },
  complaintRowCard: {
    backgroundColor: '#16161E',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#242430',
    padding: 10,
  },
  rowCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  categoryPill: {
    backgroundColor: 'rgba(255, 193, 7, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryPillText: {
    fontSize: 9,
    fontWeight: '900',
    color: Colors.primary,
  },
  statusTag: {
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  statusTagText: {
    fontSize: 9,
    fontWeight: '800',
  },
  rowCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
    lineHeight: 17,
    marginBottom: 2,
  },
  rowCardDesc: {
    fontSize: 11,
    color: Colors.textMuted,
    lineHeight: 15,
    marginBottom: 8,
  },
  rowCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#20202A',
    paddingTop: 6,
  },
  rowCardMeta: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  inspectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  inspectBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
  },
  emptyNoticeBox: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyNoticeText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  overdueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#181418',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    padding: 10,
    marginBottom: 8,
    gap: 8,
  },
  overdueTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  overdueMeta: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
  escalateBtn: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  escalateBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0A0A0C',
  },
  userRoleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  userRoleBox: {
    flex: 1,
    backgroundColor: '#16161E',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#262634',
  },
  userRoleVal: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  userRoleLbl: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
});
