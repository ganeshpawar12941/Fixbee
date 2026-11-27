import React, { useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
  Modal,
  PanResponder,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Categories, LocationTypes, StatusPills, SeverityLevels } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { useComplaints } from '../context/ComplaintsContext';
import Header from '../components/Header';
import ComplaintCard from '../components/ComplaintCard';
import ComplaintDetailModal from './ComplaintDetailModal';

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
    activeCategory,
    setActiveCategory,
    activeLocation,
    setActiveLocation,
    activeStatus,
    setActiveStatus,
    activeSeverity,
    setActiveSeverity,
    searchQuery,
    setSearchQuery,
    toggleLike,
    deleteComplaint,
    refreshLocalData,
  } = useComplaints();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [draftFilters, setDraftFilters] = useState(null);
  const filterDismissResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderRelease: (_event, gestureState) => {
      const isTap = Math.abs(gestureState.dx) < 8 && Math.abs(gestureState.dy) < 8;
      const isDownwardSwipe = gestureState.dy > 36
        && gestureState.dy > Math.abs(gestureState.dx);
      if (isTap || isDownwardSwipe) setFiltersVisible(false);
    },
  }), []);

  const isStudent = user?.role === 'student';
  const statusOptions = [
    { id: 'all', label: 'All' },
    ...Object.entries(StatusPills).map(([id, status]) => ({ id, label: status.label })),
  ];
  const severityOptions = [{ id: 'all', label: 'All' }, ...SeverityLevels];
  const activeFilterCount = [
    activeCategory,
    activeLocation,
    activeStatus,
    activeSeverity,
  ].filter((value) => value !== 'all').length;
  const sortLabels = {
    most_liked: 'Most Liked',
    newest: 'Latest',
    oldest: 'Oldest',
  };

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

  const openFilters = () => {
    setDraftFilters({
      category: activeCategory,
      location: activeLocation,
      status: activeStatus,
      severity: activeSeverity,
      sortBy,
    });
    setFiltersVisible(true);
  };

  const applyFilters = () => {
    if (!draftFilters) return;
    setActiveCategory(draftFilters.category);
    setActiveLocation(draftFilters.location);
    setActiveStatus(draftFilters.status);
    setActiveSeverity(draftFilters.severity);
    setSortBy(draftFilters.sortBy);
    setFiltersVisible(false);
  };

  const renderFilterGroup = (label, options, selected, onSelect) => (
    <View style={styles.filterGroup}>
      <Text style={styles.filterGroupTitle}>{label}</Text>
      <View style={styles.filterOptions}>
        {options.map((option) => {
          const isActive = selected === option.id;
          return (
            <TouchableOpacity
              key={option.id}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
              onPress={() => onSelect(option.id)}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  // Keep the search and controls in a reconciled header element.
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

      <View style={styles.filterBar}>
        <TouchableOpacity
          style={styles.filterAction}
          onPress={openFilters}
          activeOpacity={0.8}
        >
          <Ionicons name="options-outline" size={15} color={Colors.textPrimary} />
          <Text style={styles.filterActionText}>Filters</Text>
          {activeFilterCount > 0 && (
            <View style={styles.filterCountBadge}>
              <Text style={styles.filterCountText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.filterAction}
          onPress={openFilters}
          activeOpacity={0.8}
        >
          <Ionicons name="swap-vertical-outline" size={15} color={Colors.textPrimary} />
          <Text style={styles.filterActionText}>Sort: {sortLabels[sortBy] || 'Latest'}</Text>
          <Ionicons name="chevron-down" size={13} color={Colors.textMuted} />
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
          />
        )}
        ListHeaderComponent={renderHeader()}
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

      {/* Complaint Details */}
      {selectedComplaint && (
        <ComplaintDetailModal
          visible={!!selectedComplaint}
          complaint={selectedComplaint}
          onClose={() => setSelectedComplaint(null)}
          onLike={toggleLike}
        />
      )}

      <Modal
        visible={filtersVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFiltersVisible(false)}
      >
        <View style={styles.filterModalOverlay}>
          <TouchableOpacity
            style={styles.filterBackdrop}
            onPress={() => setFiltersVisible(false)}
            activeOpacity={1}
            accessibilityLabel="Close filters"
          />
          <View style={styles.filterSheet}>
            <View
              style={styles.sheetHandleArea}
              accessibilityRole="button"
              accessibilityLabel="Close filters"
              {...filterDismissResponder.panHandlers}
            >
              <View style={styles.sheetHandle} />
            </View>
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetTitle}>Filter complaints</Text>
                <Text style={styles.sheetSubtitle}>Choose what you want to see</Text>
              </View>
              <TouchableOpacity
                onPress={() => setDraftFilters({
                  category: 'all',
                  location: 'all',
                  status: 'all',
                  severity: 'all',
                  sortBy: 'newest',
                })}
                activeOpacity={0.8}
              >
                <Text style={styles.resetFiltersText}>Reset</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.filterSheetScroll}
              contentContainerStyle={styles.filterSheetContent}
              showsVerticalScrollIndicator={false}
            >
              {draftFilters && (
                <>
                  {renderFilterGroup('Category', Categories, draftFilters.category, (value) => (
                    setDraftFilters((current) => ({ ...current, category: value }))
                  ))}
                  {renderFilterGroup('Location', LocationTypes, draftFilters.location, (value) => (
                    setDraftFilters((current) => ({ ...current, location: value }))
                  ))}
                  {renderFilterGroup('Status', statusOptions, draftFilters.status, (value) => (
                    setDraftFilters((current) => ({ ...current, status: value }))
                  ))}
                  {renderFilterGroup('Severity', severityOptions, draftFilters.severity, (value) => (
                    setDraftFilters((current) => ({ ...current, severity: value }))
                  ))}
                  {renderFilterGroup('Sort by', [
                    { id: 'newest', label: 'Latest' },
                    { id: 'oldest', label: 'Oldest' },
                    { id: 'most_liked', label: 'Most Liked' },
                  ], draftFilters.sortBy, (value) => (
                    setDraftFilters((current) => ({ ...current, sortBy: value }))
                  ))}
                </>
              )}
            </ScrollView>
            <TouchableOpacity
              style={styles.applyFiltersButton}
              onPress={applyFilters}
              activeOpacity={0.85}
            >
              <Text style={styles.applyFiltersText}>Show complaints</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  filterAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: Colors.bgCard,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  filterActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  filterCountBadge: {
    width: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterCountText: {
    color: Colors.textInverse,
    fontSize: 10,
    fontWeight: '800',
  },
  filterModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  filterBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  filterSheet: {
    maxHeight: '86%',
    backgroundColor: Colors.bgCardElevated,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 24,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.textPrimary,
  },
  sheetHandleArea: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
    marginBottom: 8,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sheetTitle: {
    color: Colors.textPrimary,
    fontSize: 17,
    fontWeight: '800',
  },
  sheetSubtitle: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 3,
  },
  resetFiltersText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  filterSheetScroll: {
    flexShrink: 1,
  },
  filterSheetContent: {
    paddingBottom: 10,
  },
  filterGroup: {
    marginBottom: 16,
  },
  filterGroupTitle: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    backgroundColor: Colors.bgCard,
  },
  filterChipActive: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(255, 193, 7, 0.12)',
  },
  filterChipText: {
    color: Colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
  },
  filterChipTextActive: {
    color: Colors.primary,
  },
  applyFiltersButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 8,
  },
  applyFiltersText: {
    color: Colors.textInverse,
    fontSize: 13,
    fontWeight: '900',
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
});
