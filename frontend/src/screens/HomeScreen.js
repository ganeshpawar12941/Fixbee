import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { useComplaints } from '../context/ComplaintsContext';
import Header from '../components/Header';
import ComplaintCard from '../components/ComplaintCard';
import ComplaintDetailModal from './ComplaintDetailModal';
import ResolveModal from '../components/ResolveModal';

export default function HomeScreen({
  onNavigateAdd,
  onProfilePress,
  onNotificationsPress,
}) {
  const { user } = useAuth();
  const {
    feedComplaints,
    sortBy,
    setSortBy,
    searchQuery,
    setSearchQuery,
    toggleLike,
    deleteComplaint,
    updateComplaintStatus,
    resolveComplaint,
    checkBackend,
  } = useComplaints();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [managementTargetComplaint, setManagementTargetComplaint] = useState(null);
  const [resolveTargetComplaint, setResolveTargetComplaint] = useState(null);
  const [statusRemarks, setStatusRemarks] = useState('');

  const isStudent = user?.role === 'student';

  const onRefresh = async () => {
    setRefreshing(true);
    await checkBackend();
    setTimeout(() => {
      setRefreshing(false);
    }, 500);
  };

  const handleStatusUpdate = async (newStatus) => {
    if (!managementTargetComplaint) return;
    await updateComplaintStatus(
      managementTargetComplaint._id || managementTargetComplaint.id,
      newStatus,
      statusRemarks || `Updated to ${newStatus}`
    );
    setStatusRemarks('');
    setManagementTargetComplaint(null);
  };

  const handleOpenResolveModal = () => {
    if (!managementTargetComplaint) return;
    const target = managementTargetComplaint;
    setManagementTargetComplaint(null);
    setStatusRemarks('');
    setResolveTargetComplaint(target);
  };

  // Clean, Minimal Header: Just clean search & clean sorting tabs, no clutter
  const renderHeader = () => (
    <View style={styles.cleanHeaderContainer}>
      {/* Clean Search Input */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={16} color={Colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search campus issues..."
          placeholderTextColor={Colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Simple Black & Yellow Sort Controls */}
      <View style={styles.sortRow}>
        <TouchableOpacity
          style={[styles.sortButton, sortBy === 'trending' && styles.sortButtonActive]}
          onPress={() => setSortBy('trending')}
          activeOpacity={0.8}
        >
          <Text style={[styles.sortButtonText, sortBy === 'trending' && styles.sortButtonTextActive]}>
            Top Buzz
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.sortButton, sortBy === 'newest' && styles.sortButtonActive]}
          onPress={() => setSortBy('newest')}
          activeOpacity={0.8}
        >
          <Text style={[styles.sortButtonText, sortBy === 'newest' && styles.sortButtonTextActive]}>
            Latest
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.sortButton, sortBy === 'oldest' && styles.sortButtonActive]}
          onPress={() => setSortBy('oldest')}
          activeOpacity={0.8}
        >
          <Text style={[styles.sortButtonText, sortBy === 'oldest' && styles.sortButtonTextActive]}>
            Oldest
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header
        onProfilePress={onProfilePress}
        onNotificationsPress={onNotificationsPress}
      />

      <FlatList
        data={feedComplaints}
        keyExtractor={(item) => (item._id || item.id).toString()}
        renderItem={({ item }) => (
          <ComplaintCard
            complaint={item}
            currentUser={user}
            onLike={toggleLike}
            onSelect={(c) => setSelectedComplaint(c)}
            onDelete={deleteComplaint}
            onStatusChange={(c) => setManagementTargetComplaint(c)}
          />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="folder-open-outline" size={40} color={Colors.textMuted} style={{ marginBottom: 8 }} />
            <Text style={styles.emptyTitle}>No Complaints Found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery
                ? `No issues found matching "${searchQuery}".`
                : 'There are no active complaints reported at this time.'}
            </Text>
            {isStudent && (
              <TouchableOpacity
                style={styles.emptyAddButton}
                onPress={onNavigateAdd}
                activeOpacity={0.85}
              >
                <Ionicons name="add" size={16} color="#0A0A0C" />
                <Text style={styles.emptyAddButtonText}>Report An Issue</Text>
              </TouchableOpacity>
            )}
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
        contentContainerStyle={styles.listContent}
      />

      {/* Complaint Detail & Discussion Modal */}
      {selectedComplaint && (
        <ComplaintDetailModal
          visible={!!selectedComplaint}
          complaint={selectedComplaint}
          onClose={() => setSelectedComplaint(null)}
          onLike={toggleLike}
        />
      )}

      {/* Management Quick Workflow Modal */}
      {managementTargetComplaint && (
        <Modal
          visible={!!managementTargetComplaint}
          transparent
          animationType="fade"
          onRequestClose={() => setManagementTargetComplaint(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.managementModalCard}>
              <View style={styles.managementModalHeader}>
                <Text style={styles.managementModalTitle}>Management Status Update</Text>
                <TouchableOpacity onPress={() => setManagementTargetComplaint(null)}>
                  <Ionicons name="close" size={20} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>

              <Text style={styles.managementTargetTitle} numberOfLines={2}>
                {managementTargetComplaint.title}
              </Text>

              <TextInput
                style={styles.modalRemarksInput}
                placeholder="Official notes or dispatch remarks..."
                placeholderTextColor={Colors.textMuted}
                value={statusRemarks}
                onChangeText={setStatusRemarks}
                multiline
              />

              <View style={styles.statusActionButtons}>
                <TouchableOpacity
                  style={[styles.statusBtn, styles.statusBtnUnderReview]}
                  onPress={() => handleStatusUpdate('under_review')}
                >
                  <Text style={styles.statusBtnTextYellow}>Under Review</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.statusBtn, styles.statusBtnInProgress]}
                  onPress={() => handleStatusUpdate('in_progress')}
                >
                  <Text style={styles.statusBtnTextYellow}>In Progress</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.statusBtn, styles.statusBtnResolved]}
                  onPress={handleOpenResolveModal}
                >
                  <Text style={styles.statusBtnTextGreen}>Resolve (Photo)</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.statusBtn, styles.statusBtnReject]}
                  onPress={() => handleStatusUpdate('rejected')}
                >
                  <Text style={styles.statusBtnTextRed}>Reject</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Mandatory Photo Resolution Modal */}
      {resolveTargetComplaint && (
        <ResolveModal
          visible={!!resolveTargetComplaint}
          complaint={resolveTargetComplaint}
          onClose={() => setResolveTargetComplaint(null)}
          onConfirmResolve={resolveComplaint}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgDark,
  },
  listContent: {
    paddingBottom: 80,
  },
  cleanHeaderContainer: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 6,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    marginBottom: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: Colors.textPrimary,
  },
  sortRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  sortButton: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  sortButtonActive: {
    backgroundColor: 'rgba(255, 193, 7, 0.12)',
    borderColor: Colors.primary,
  },
  sortButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  sortButtonTextActive: {
    color: Colors.primary,
    fontWeight: '800',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18,
  },
  emptyAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    gap: 6,
  },
  emptyAddButtonText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0A0A0C',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  managementModalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: Colors.bgCardElevated,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  managementModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  managementModalTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: Colors.primary,
  },
  managementTargetTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  modalRemarksInput: {
    backgroundColor: Colors.bgInput,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    color: Colors.textPrimary,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    minHeight: 55,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  statusActionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  statusBtn: {
    flex: 1,
    minWidth: '47%',
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgCard,
  },
  statusBtnUnderReview: {
    borderColor: Colors.primary,
  },
  statusBtnInProgress: {
    borderColor: Colors.primary,
  },
  statusBtnResolved: {
    borderColor: '#22C55E',
  },
  statusBtnReject: {
    borderColor: '#EF4444',
  },
  statusBtnTextYellow: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
  },
  statusBtnTextGreen: {
    fontSize: 11,
    fontWeight: '800',
    color: '#22C55E',
  },
  statusBtnTextRed: {
    fontSize: 11,
    fontWeight: '800',
    color: '#EF4444',
  },
});
