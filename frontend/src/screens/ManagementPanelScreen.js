import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Modal,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, StatusPills } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { useComplaints } from '../context/ComplaintsContext';
import ResolveModal from '../components/ResolveModal';

export default function ManagementPanelScreen({ onSelectComplaint }) {
  const { user } = useAuth();
  const {
    complaints,
    updateComplaintStatus,
    resolveComplaint,
    checkBackend,
  } = useComplaints();

  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState('tickets'); // 'tickets' | 'analytics'
  const [activeStatusFilter, setActiveStatusFilter] = useState('all'); // 'all' | 'submitted' | 'under_review' | 'in_progress' | 'resolved'
  const [subZoneFilter, setSubZoneFilter] = useState('all'); // For warden: 'all' | 'boys_hostel' | 'girls_hostel'
  const [selectedActionTarget, setSelectedActionTarget] = useState(null);
  const [actionType, setActionType] = useState('status'); // 'status' | 'resolve'
  const [remarks, setRemarks] = useState('');

  const isWarden = user?.role === 'warden';
  const isDean = user?.role === 'infrastructure_dean';

  const onRefresh = async () => {
    setRefreshing(true);
    await checkBackend();
    setTimeout(() => setRefreshing(false), 600);
  };

  // 1. Strict Role-Specific Location Filtering:
  // - Warden gets ALL and ONLY hostel complaints (Boys' and Girls' hostels)
  // - Infrastructure Dean gets ALL campus buildings and facilities, EXCLUDING all hostels!
  const scopedComplaints = complaints.filter((c) => {
    if (isWarden) {
      // ONLY hostels
      return c.locationType === 'boys_hostel' || c.locationType === 'girls_hostel';
    }
    if (isDean) {
      // ALL campus buildings, EXCLUDING hostels
      return c.locationType === 'campus';
    }
    // Admin or others
    return true;
  });

  // 2. Status & Sub-zone filtering
  const filteredTickets = scopedComplaints.filter((c) => {
    // Status filter
    if (activeStatusFilter !== 'all' && c.status !== activeStatusFilter) {
      return false;
    }
    // Sub-zone filter for Warden
    if (isWarden && subZoneFilter !== 'all') {
      if (c.locationType !== subZoneFilter) return false;
    }
    return true;
  });

  // Calculate stats for this manager's specific jurisdiction
  const totalAssigned = scopedComplaints.length;
  const newSubmitted = scopedComplaints.filter((c) => c.status === 'submitted').length;
  const underReview = scopedComplaints.filter((c) => c.status === 'under_review').length;
  const inProgress = scopedComplaints.filter((c) => c.status === 'in_progress').length;
  const resolved = scopedComplaints.filter((c) => c.status === 'resolved').length;
  const rejected = scopedComplaints.filter((c) => c.status === 'rejected').length;

  // Analytics calculations
  const totalSafe = Math.max(totalAssigned, 1);
  const activePipeline = newSubmitted + underReview + inProgress;
  const overdueCutoff = Date.now() - 24 * 60 * 60 * 1000;
  const overdueList = scopedComplaints.filter(
    (c) =>
      ['submitted', 'under_review', 'in_progress'].includes(c.status) &&
      new Date(c.createdAt).getTime() < overdueCutoff
  );
  const overdueCount = overdueList.length;

  const solvedPct = Math.round((resolved / totalSafe) * 100);
  const activePct = Math.round((activePipeline / totalSafe) * 100);
  const overduePct = Math.round((overdueCount / totalSafe) * 100);
  const rejectedPct = Math.round((rejected / totalSafe) * 100);

  // Category Breakdown
  const catMap = {};
  scopedComplaints.forEach((c) => {
    const key = c.category || 'other';
    catMap[key] = (catMap[key] || 0) + 1;
  });
  const categoryBreakdown = Object.entries(catMap)
    .map(([id, count]) => ({ id, count }))
    .sort((a, b) => b.count - a.count);

  // Severity Breakdown
  const highCount = scopedComplaints.filter((c) => c.severity === 'high').length;
  const mediumCount = scopedComplaints.filter((c) => c.severity === 'medium').length;
  const lowCount = scopedComplaints.filter((c) => c.severity === 'low').length;

  // Warden Hostel Split
  const boysHostelCount = scopedComplaints.filter((c) => c.locationType === 'boys_hostel').length;
  const girlsHostelCount = scopedComplaints.filter((c) => c.locationType === 'girls_hostel').length;

  const handleUpdateStatus = async (newStatus) => {
    if (!selectedActionTarget) return;
    await updateComplaintStatus(
      selectedActionTarget._id || selectedActionTarget.id,
      newStatus,
      remarks || `Status updated to ${newStatus} by ${user?.name || 'Management'}`
    );
    setRemarks('');
    setSelectedActionTarget(null);
  };

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
        {/* Role-Specific Desk Banner */}
        <View style={styles.deskBanner}>
          <View style={styles.badgeRow}>
            <View style={[styles.iconCircle, { backgroundColor: Colors.primary }]}>
              <Ionicons
                name={isDean ? 'business' : 'bed'}
                size={18}
                color="#0A0A0C"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.deskTitle}>
                {isDean
                  ? 'Dean of Infrastructure Desk'
                  : isWarden
                  ? 'Chief Hostel Warden Desk'
                  : 'Management Command Desk'}
              </Text>
              <Text style={styles.deskOfficer}>
                {user?.name} • {user?.department || (isDean ? 'Campus Works' : 'Hostel Administration')}
              </Text>
            </View>
          </View>

          {/* Jurisdiction Pill */}
          <View style={styles.jurisdictionPill}>
            <Ionicons
              name={isDean ? 'information-circle' : 'home'}
              size={13}
              color={Colors.primary}
            />
            <Text style={[styles.jurisdictionText, { color: Colors.primary }]}>
              {isDean
                ? 'Jurisdiction: Academic & Campus Buildings (Excluding Hostels)'
                : isWarden
                ? "Jurisdiction: Student Hostels (Boys' & Girls' Blocks Only)"
                : 'All Facilities'}
            </Text>
          </View>

          {/* KPI Summary Tiles */}
          <View style={styles.kpiRow}>
            <View style={styles.kpiBox}>
              <Text style={styles.kpiNum}>{totalAssigned}</Text>
              <Text style={styles.kpiLbl}>Total In Scope</Text>
            </View>
            <View style={styles.kpiDivider} />
            <View style={styles.kpiBox}>
              <Text style={[styles.kpiNum, { color: Colors.primary }]}>{newSubmitted}</Text>
              <Text style={styles.kpiLbl}>New</Text>
            </View>
            <View style={styles.kpiDivider} />
            <View style={styles.kpiBox}>
              <Text style={[styles.kpiNum, { color: Colors.primary }]}>{inProgress}</Text>
              <Text style={styles.kpiLbl}>Active</Text>
            </View>
            <View style={styles.kpiDivider} />
            <View style={styles.kpiBox}>
              <Text style={[styles.kpiNum, { color: '#22C55E' }]}>{resolved}</Text>
              <Text style={styles.kpiLbl}>Resolved</Text>
            </View>
          </View>
        </View>

        {/* Segmented Mode Toggle: Tickets Queue vs Data & Analytics */}
        <View style={styles.modeToggleRow}>
          <TouchableOpacity
            style={[styles.modeToggleBtn, viewMode === 'tickets' && styles.modeToggleBtnActive]}
            onPress={() => setViewMode('tickets')}
            activeOpacity={0.85}
          >
            <Ionicons
              name="list"
              size={14}
              color={viewMode === 'tickets' ? '#0A0A0C' : Colors.textSecondary}
            />
            <Text style={[styles.modeToggleText, viewMode === 'tickets' && styles.modeToggleTextActive]}>
              Tickets Queue ({totalAssigned})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeToggleBtn, viewMode === 'analytics' && styles.modeToggleBtnActive]}
            onPress={() => setViewMode('analytics')}
            activeOpacity={0.85}
          >
            <Ionicons
              name="bar-chart"
              size={14}
              color={viewMode === 'analytics' ? '#0A0A0C' : Colors.textSecondary}
            />
            <Text style={[styles.modeToggleText, viewMode === 'analytics' && styles.modeToggleTextActive]}>
              Data &amp; Analytics
            </Text>
          </TouchableOpacity>
        </View>

        {viewMode === 'analytics' ? (
          <View style={styles.analyticsSection}>
            {/* 1. Resolution & Status Graph */}
            <View style={styles.analyticsCard}>
              <View style={styles.analyticsHeaderRow}>
                <Ionicons name="pie-chart" size={16} color={Colors.primary} />
                <Text style={styles.analyticsCardTitle}>Resolution &amp; SLA Performance</Text>
              </View>

              {/* Stacked Comparative Bar */}
              <View style={styles.stackedBar}>
                <View style={[styles.stackedSegment, { flex: Math.max(resolved, 0.05), backgroundColor: '#22C55E' }]} />
                <View style={[styles.stackedSegment, { flex: Math.max(activePipeline, 0.05), backgroundColor: Colors.primary }]} />
                <View style={[styles.stackedSegment, { flex: Math.max(overdueCount, 0.05), backgroundColor: '#EF4444' }]} />
                <View style={[styles.stackedSegment, { flex: Math.max(rejected, 0.05), backgroundColor: '#71717A' }]} />
              </View>

              {/* Metric Bars */}
              <View style={styles.metricBarsList}>
                <View style={styles.metricBarRow}>
                  <View style={styles.metricBarHeader}>
                    <Text style={styles.metricBarLabel}>Solved / Resolved</Text>
                    <Text style={[styles.metricBarVal, { color: '#22C55E' }]}>{resolved} ({solvedPct}%)</Text>
                  </View>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: `${solvedPct}%`, backgroundColor: '#22C55E' }]} />
                  </View>
                </View>

                <View style={styles.metricBarRow}>
                  <View style={styles.metricBarHeader}>
                    <Text style={styles.metricBarLabel}>Active Pipeline</Text>
                    <Text style={[styles.metricBarVal, { color: Colors.primary }]}>{activePipeline} ({activePct}%)</Text>
                  </View>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: `${activePct}%`, backgroundColor: Colors.primary }]} />
                  </View>
                </View>

                <View style={styles.metricBarRow}>
                  <View style={styles.metricBarHeader}>
                    <Text style={styles.metricBarLabel}>Overdue (&gt;24h SLA)</Text>
                    <Text style={[styles.metricBarVal, { color: '#EF4444' }]}>{overdueCount} ({overduePct}%)</Text>
                  </View>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: `${overduePct}%`, backgroundColor: '#EF4444' }]} />
                  </View>
                </View>

                <View style={styles.metricBarRow}>
                  <View style={styles.metricBarHeader}>
                    <Text style={styles.metricBarLabel}>Rejected</Text>
                    <Text style={[styles.metricBarVal, { color: Colors.textSecondary }]}>{rejected} ({rejectedPct}%)</Text>
                  </View>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: `${rejectedPct}%`, backgroundColor: '#71717A' }]} />
                  </View>
                </View>
              </View>
            </View>

            {/* 2. Category Breakdown Graph */}
            <View style={styles.analyticsCard}>
              <View style={styles.analyticsHeaderRow}>
                <Ionicons name="stats-chart" size={16} color={Colors.primary} />
                <Text style={styles.analyticsCardTitle}>
                  {isDean ? 'Campus Building Categories' : 'Hostel Issue Categories'}
                </Text>
              </View>

              {categoryBreakdown.length > 0 ? (
                <View style={styles.metricBarsList}>
                  {categoryBreakdown.map((cat) => {
                    const pct = Math.round((cat.count / totalSafe) * 100);
                    return (
                      <View key={cat.id} style={styles.metricBarRow}>
                        <View style={styles.metricBarHeader}>
                          <Text style={styles.metricBarLabel}>
                            {cat.id.replace('_', ' ').toUpperCase()}
                          </Text>
                          <Text style={[styles.metricBarVal, { color: Colors.primary }]}>
                            {cat.count} ({pct}%)
                          </Text>
                        </View>
                        <View style={styles.barTrack}>
                          <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: Colors.primary }]} />
                        </View>
                      </View>
                    );
                  })}
                </View>
              ) : (
                <Text style={styles.emptyAnalyticsText}>No category data available yet.</Text>
              )}
            </View>

            {/* 3. Severity & Urgency Distribution */}
            <View style={styles.analyticsCard}>
              <View style={styles.analyticsHeaderRow}>
                <Ionicons name="alert-circle" size={16} color={Colors.primary} />
                <Text style={styles.analyticsCardTitle}>Urgency / Severity Split</Text>
              </View>

              <View style={styles.severityGrid}>
                <View style={[styles.severityBox, { borderColor: '#EF4444' }]}>
                  <Text style={[styles.severityNum, { color: '#EF4444' }]}>{highCount}</Text>
                  <Text style={styles.severityLbl}>High Urgency</Text>
                </View>
                <View style={[styles.severityBox, { borderColor: Colors.primary }]}>
                  <Text style={[styles.severityNum, { color: Colors.primary }]}>{mediumCount}</Text>
                  <Text style={styles.severityLbl}>Medium</Text>
                </View>
                <View style={[styles.severityBox, { borderColor: Colors.borderSubtle }]}>
                  <Text style={[styles.severityNum, { color: Colors.textSecondary }]}>{lowCount}</Text>
                  <Text style={styles.severityLbl}>Low</Text>
                </View>
              </View>
            </View>

            {/* 4. Warden Hostel Split (Boys vs Girls Hostel) */}
            {isWarden && (
              <View style={styles.analyticsCard}>
                <View style={styles.analyticsHeaderRow}>
                  <Ionicons name="bed" size={16} color={Colors.primary} />
                  <Text style={styles.analyticsCardTitle}>Hostel Wing Distribution</Text>
                </View>

                <View style={styles.severityGrid}>
                  <View style={[styles.severityBox, { borderColor: Colors.primary }]}>
                    <Text style={[styles.severityNum, { color: Colors.primary }]}>{boysHostelCount}</Text>
                    <Text style={styles.severityLbl}>Boys&apos; Hostel</Text>
                  </View>
                  <View style={[styles.severityBox, { borderColor: Colors.primary }]}>
                    <Text style={[styles.severityNum, { color: Colors.primary }]}>{girlsHostelCount}</Text>
                    <Text style={styles.severityLbl}>Girls&apos; Hostel</Text>
                  </View>
                </View>
              </View>
            )}

            {/* 5. Overdue Escalation List */}
            {overdueList.length > 0 && (
              <View style={[styles.analyticsCard, { borderColor: 'rgba(239, 68, 68, 0.45)' }]}>
                <View style={styles.analyticsHeaderRow}>
                  <Ionicons name="warning" size={16} color="#EF4444" />
                  <Text style={[styles.analyticsCardTitle, { color: '#EF4444' }]}>
                    Overdue Tickets (&gt;24h) — Action Needed
                  </Text>
                </View>

                {overdueList.map((item) => (
                  <TouchableOpacity
                    key={item._id || item.id}
                    style={styles.overdueRow}
                    onPress={() => onSelectComplaint(item)}
                    activeOpacity={0.8}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.overdueRowTitle} numberOfLines={1}>{item.title}</Text>
                      <Text style={styles.overdueRowMeta}>
                        {item.category?.toUpperCase()} • Status: {item.status.replace('_', ' ')}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#EF4444" />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        ) : (
          <>

        {/* Sub-zone Selector for Warden (Boys vs Girls Hostel) */}
        {isWarden && (
          <View style={styles.subZoneRow}>
            {[
              { id: 'all', label: 'All Hostels', icon: 'apps' },
              { id: 'boys_hostel', label: "Boys' Hostel", icon: 'man' },
              { id: 'girls_hostel', label: "Girls' Hostel", icon: 'woman' },
            ].map((zone) => {
              const active = subZoneFilter === zone.id;
              return (
                <TouchableOpacity
                  key={zone.id}
                  style={[styles.zoneBtn, active && styles.zoneBtnActive]}
                  onPress={() => setSubZoneFilter(zone.id)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={zone.icon}
                    size={12}
                    color={active ? '#0A0A0C' : Colors.textSecondary}
                  />
                  <Text style={[styles.zoneBtnText, active && styles.zoneBtnTextActive]}>
                    {zone.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Status Pipeline Filter Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScroll}
        >
          {[
            { id: 'all', label: `All (${scopedComplaints.length})` },
            { id: 'submitted', label: `Submitted (${newSubmitted})` },
            { id: 'under_review', label: `Under Review (${underReview})` },
            { id: 'in_progress', label: `In Progress (${inProgress})` },
            { id: 'resolved', label: `Resolved (${resolved})` },
          ].map((tab) => {
            const isSelected = activeStatusFilter === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.filterTab, isSelected && styles.filterTabActive]}
                onPress={() => setActiveStatusFilter(tab.id)}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterTabText, isSelected && styles.filterTabTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Complaints List */}
        <View style={styles.ticketList}>
          {filteredTickets.length > 0 ? (
            filteredTickets.map((item) => {
              const statusInfo = StatusPills[item.status] || StatusPills.submitted;
              const locationDisplay =
                item.locationType === 'boys_hostel'
                  ? "Boys' Hostel"
                  : item.locationType === 'girls_hostel'
                  ? "Girls' Hostel"
                  : 'Campus & Academic';

              return (
                <View key={item._id || item.id} style={styles.ticketCard}>
                  {/* Card Header */}
                  <View style={styles.ticketTopRow}>
                    <View style={[styles.statusTag, { backgroundColor: statusInfo.bg, borderColor: `${statusInfo.color}40` }]}>
                      <Ionicons name={statusInfo.icon} size={11} color={statusInfo.color} style={{ marginRight: 4 }} />
                      <Text style={[styles.statusTagText, { color: statusInfo.color }]}>
                        {statusInfo.label}
                      </Text>
                    </View>

                    <View style={styles.zoneTag}>
                      <Ionicons name="location" size={10} color={Colors.primary} style={{ marginRight: 3 }} />
                      <Text style={styles.zoneTagText}>{locationDisplay}</Text>
                    </View>
                  </View>

                  {/* Title & Desc */}
                  <TouchableOpacity activeOpacity={0.85} onPress={() => onSelectComplaint(item)}>
                    <Text style={styles.ticketTitle}>{item.title}</Text>
                    <Text style={styles.ticketDescription} numberOfLines={2}>
                      {item.description}
                    </Text>
                  </TouchableOpacity>

                  {/* Student author & upvotes */}
                  <View style={styles.studentInfoRow}>
                    <Ionicons name="person-circle-outline" size={13} color={Colors.textMuted} />
                    <Text style={styles.studentNameText} numberOfLines={1}>
                      Reported by: {item.student?.name || 'Student'}
                    </Text>
                    <Text style={styles.ticketUpvotes}>▲ {item.likesCount || 0} Upvotes</Text>
                  </View>

                  {/* Management Action Bar */}
                  <View style={styles.ticketActionRow}>
                    <TouchableOpacity
                      style={styles.actionBtnSecondary}
                      onPress={() => {
                        setSelectedActionTarget(item);
                        setActionType('status');
                      }}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="git-branch-outline" size={13} color={Colors.primary} />
                      <Text style={styles.actionBtnSecondaryText}>Update Status</Text>
                    </TouchableOpacity>

                    {item.status !== 'resolved' && (
                      <TouchableOpacity
                        style={styles.actionBtnResolve}
                        onPress={() => {
                          setSelectedActionTarget(item);
                          setActionType('resolve');
                        }}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="checkmark-done" size={13} color="#0A0A0C" />
                        <Text style={styles.actionBtnResolveText}>Resolve with Proof</Text>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      style={styles.actionBtnDiscuss}
                      onPress={() => onSelectComplaint(item)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="chatbubbles-outline" size={14} color={Colors.textSecondary} />
                      <Text style={styles.discussCountText}>{item.additionalInfo?.length || 0}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons
                name={isDean ? 'business-outline' : 'bed-outline'}
                size={40}
                color={Colors.textMuted}
              />
              <Text style={styles.emptyTitle}>
                {isDean
                  ? 'No Academic Campus Issues Found'
                  : 'No Hostel Issues Found'}
              </Text>
              <Text style={styles.emptySub}>
                {isDean
                  ? 'All campus academic buildings, labs, and pathways are currently in good order.'
                  : 'All hostel dormitories and facilities are running with no active complaints.'}
              </Text>
            </View>
          )}
        </View>
        </>
        )}

        {/* Resolve Modal (Mandatory Photo Verification) */}
        {selectedActionTarget && actionType === 'resolve' && (
          <ResolveModal
            visible={true}
            complaint={selectedActionTarget}
            onClose={() => setSelectedActionTarget(null)}
            onConfirmResolve={resolveComplaint}
          />
        )}

        {/* Status Update Modal */}
        {selectedActionTarget && actionType === 'status' && (
          <Modal
            visible={true}
            transparent
            animationType="fade"
            onRequestClose={() => setSelectedActionTarget(null)}
          >
            <View style={styles.modalBackdrop}>
              <View style={styles.modalContentCard}>
                <View style={styles.modalHeaderRow}>
                  <Text style={styles.modalActionTitle}>Advance Workflow Status</Text>
                  <TouchableOpacity onPress={() => setSelectedActionTarget(null)}>
                    <Ionicons name="close" size={20} color={Colors.textMuted} />
                  </TouchableOpacity>
                </View>

                <Text style={styles.modalTargetTitle} numberOfLines={2}>
                  {selectedActionTarget.title}
                </Text>

                <View>
                  <Text style={styles.modalFieldLabel}>Official Action Remarks (Dispatched details)</Text>
                  <TextInput
                    style={[styles.modalInput, styles.modalTextArea]}
                    placeholder="e.g. Electrician team dispatched, circuit isolated..."
                    placeholderTextColor={Colors.textMuted}
                    value={remarks}
                    onChangeText={setRemarks}
                    multiline
                  />

                  <View style={styles.modalStatusButtonsRow}>
                    <TouchableOpacity
                      style={[styles.mStatusBtn, { borderColor: Colors.primary }]}
                      onPress={() => handleUpdateStatus('under_review')}
                    >
                      <Text style={[styles.mStatusBtnText, { color: Colors.primary }]}>Under Review</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.mStatusBtn, { borderColor: Colors.primary }]}
                      onPress={() => handleUpdateStatus('in_progress')}
                    >
                      <Text style={[styles.mStatusBtnText, { color: Colors.primary }]}>In Progress</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.mStatusBtn, { borderColor: '#EF4444' }]}
                      onPress={() => handleUpdateStatus('rejected')}
                    >
                      <Text style={[styles.mStatusBtnText, { color: '#EF4444' }]}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          </Modal>
        )}
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
  deskBanner: {
    backgroundColor: Colors.bgCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    padding: 14,
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deskTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  deskOfficer: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },
  jurisdictionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161622',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 6,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#242436',
  },
  jurisdictionText: {
    fontSize: 10,
    fontWeight: '700',
    flex: 1,
  },
  kpiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#16161E',
    borderRadius: 10,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#242432',
  },
  kpiBox: {
    alignItems: 'center',
  },
  kpiNum: {
    fontSize: 15,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  kpiLbl: {
    fontSize: 9,
    fontWeight: '600',
    color: Colors.textMuted,
    marginTop: 2,
  },
  kpiDivider: {
    width: 1,
    height: 22,
    backgroundColor: '#2A2A38',
  },
  subZoneRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  zoneBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#161620',
    borderRadius: 10,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#242434',
    gap: 4,
  },
  zoneBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  zoneBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  zoneBtnTextActive: {
    color: '#0A0A0C',
    fontWeight: '900',
  },
  tabsScroll: {
    gap: 6,
    marginBottom: 12,
  },
  filterTab: {
    backgroundColor: '#16161E',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#262634',
  },
  filterTabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  filterTabTextActive: {
    color: '#0A0A0C',
    fontWeight: '800',
  },
  ticketList: {
    gap: 10,
  },
  ticketCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    padding: 12,
  },
  ticketTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statusTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 14,
    borderWidth: 1,
  },
  statusTagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  zoneTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#181822',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 12,
  },
  zoneTagText: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  ticketTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
    lineHeight: 18,
    marginBottom: 4,
  },
  ticketDescription: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
    marginBottom: 8,
  },
  studentInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 10,
  },
  studentNameText: {
    fontSize: 11,
    color: Colors.textMuted,
    flex: 1,
  },
  ticketUpvotes: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
  },
  ticketActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    paddingTop: 8,
  },
  actionBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A24',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#282836',
    gap: 4,
  },
  actionBtnSecondaryText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  actionBtnResolve: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22C55E',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  actionBtnResolveText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0A0A0C',
  },
  actionBtnDiscuss: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#181822',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  discussCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    backgroundColor: Colors.bgCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  emptySub: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  modalContentCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: Colors.bgCardElevated,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.primary,
    padding: 16,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalActionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primary,
  },
  modalTargetTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  modalFieldLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 5,
    fontWeight: '600',
  },
  modalInput: {
    backgroundColor: Colors.bgInput,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  modalTextArea: {
    minHeight: 55,
    textAlignVertical: 'top',
  },
  confirmResolveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#22C55E',
    borderRadius: 8,
    paddingVertical: 10,
    gap: 6,
  },
  confirmResolveBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0A0A0C',
  },
  modalStatusButtonsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  mStatusBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    backgroundColor: '#16161E',
  },
  mStatusBtnText: {
    fontSize: 11,
    fontWeight: '800',
  },
  modeToggleRow: {
    flexDirection: 'row',
    backgroundColor: '#14141A',
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: '#22222C',
    marginBottom: 14,
    gap: 4,
  },
  modeToggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  modeToggleBtnActive: {
    backgroundColor: Colors.primary,
  },
  modeToggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  modeToggleTextActive: {
    color: '#0A0A0C',
    fontWeight: '900',
  },
  analyticsSection: {
    gap: 12,
  },
  analyticsCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    padding: 14,
  },
  analyticsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  analyticsCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
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
  metricBarsList: {
    gap: 10,
  },
  metricBarRow: {
    gap: 4,
  },
  metricBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricBarLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  metricBarVal: {
    fontSize: 11,
    fontWeight: '800',
  },
  barTrack: {
    height: 6,
    backgroundColor: '#181820',
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  emptyAnalyticsText: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingVertical: 12,
  },
  severityGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  severityBox: {
    flex: 1,
    backgroundColor: '#16161E',
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  severityNum: {
    fontSize: 18,
    fontWeight: '900',
  },
  severityLbl: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textMuted,
    marginTop: 2,
  },
  overdueRow: {
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
  overdueRowTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  overdueRowMeta: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
});
