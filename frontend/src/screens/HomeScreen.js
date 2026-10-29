import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Categories } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { useComplaints } from '../context/ComplaintsContext';
import Header from '../components/Header';
import TrendingSpotlight from '../components/TrendingSpotlight';
import ComplaintCard from '../components/ComplaintCard';
import ComplaintDetailModal from './ComplaintDetailModal';

export default function HomeScreen({ onNavigateAdd, onProfilePress, onIntroPress }) {
  const { user } = useAuth();
  const {
    filteredComplaints,
    complaints,
    activeFilter,
    setActiveFilter,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    toggleBuzz,
    deleteComplaint,
    checkBackend,
  } = useComplaints();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  const onRefresh = async () => {
    setRefreshing(true);
    await checkBackend();
    setTimeout(() => {
      setRefreshing(false);
    }, 600);
  };

  // Find the top most-buzzed complaint on campus for the spotlight banner
  const mostBuzzedComplaint = [...complaints].sort((a, b) => b.buzzCount - a.buzzCount)[0];

  const totalBuzzes = complaints.reduce((sum, c) => sum + c.buzzCount, 0);
  const resolvedCount = complaints.filter((c) => c.status === 'Resolved').length;

  const renderHeader = () => (
    <View>
      {/* Campus Quick Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{complaints.length}</Text>
          <Text style={styles.statLabel}>Active Reports</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={[styles.statNumber, { color: Colors.primary }]}>{totalBuzzes}</Text>
          <Text style={styles.statLabel}>Peer Upvotes</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={[styles.statNumber, { color: Colors.accentSuccess }]}>{resolvedCount}</Text>
          <Text style={styles.statLabel}>Resolved</Text>
        </View>
      </View>

      {/* Campus Spotlight: Most Buzzed Issue */}
      {mostBuzzedComplaint && (
        <TrendingSpotlight
          complaint={mostBuzzedComplaint}
          onBuzz={(id) => toggleBuzz(id, user?.id || 'guest')}
          onSelect={setSelectedComplaint}
          isBuzzed={user ? mostBuzzedComplaint.buzzedBy?.includes(user.id) : false}
          currentUser={user}
          onDelete={deleteComplaint}
        />
      )}

      {/* Search Input Bar */}
      <View style={styles.searchRow}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={16} color={Colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search campus issues, facilities..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchBtn}>
              <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Sort Filter Selector */}
      <View style={styles.sortSection}>
        <Text style={styles.sortTitle}>Sort by:</Text>
        <View style={styles.sortButtonsRow}>
          {[
            { id: 'buzzes', label: 'Most Upvoted' },
            { id: 'recent', label: 'Latest' },
            { id: 'urgent', label: 'Urgent' },
          ].map((sortItem) => {
            const isSelected = sortBy === sortItem.id;
            return (
              <TouchableOpacity
                key={sortItem.id}
                style={[styles.sortButton, isSelected && styles.sortButtonActive]}
                onPress={() => setSortBy(sortItem.id)}
                activeOpacity={0.7}
              >
                <Text style={[styles.sortButtonText, isSelected && styles.sortButtonTextActive]}>
                  {sortItem.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Category Pills Slider */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryScroll}
      >
        {Categories.map((cat) => {
          const isSelected = activeFilter === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              style={[styles.categoryPill, isSelected && styles.categoryPillActive]}
              onPress={() => setActiveFilter(cat.id)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={cat.icon}
                size={13}
                color={isSelected ? '#0B0F19' : Colors.primary}
              />
              <Text style={[styles.categoryText, isSelected && styles.categoryTextActive]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.feedHeadingRow}>
        <Text style={styles.feedHeading}>Campus Feed</Text>
        <Text style={styles.feedSubheading}>
          {sortBy === 'buzzes' ? 'By Momentum' : sortBy === 'recent' ? 'Latest First' : 'Urgency Order'}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header onProfilePress={onProfilePress} onIntroPress={onIntroPress} />

      <FlatList
        data={filteredComplaints}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ComplaintCard
            complaint={item}
            onBuzz={(id) => toggleBuzz(id, user?.id || 'guest')}
            onSelect={setSelectedComplaint}
            isBuzzed={user ? item.buzzedBy?.includes(user.id) : false}
            currentUser={user}
            onDelete={deleteComplaint}
          />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={44} color={Colors.textMuted} style={{ marginBottom: 12 }} />
            <Text style={styles.emptyTitle}>No Campus Reports Found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery
                ? `No issues match "${searchQuery}". Try a different keyword.`
                : 'All clear in this section. Submit a report if you notice an issue.'}
            </Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={onNavigateAdd}>
              <Text style={styles.emptyBtnText}>Report an Issue</Text>
            </TouchableOpacity>
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

      {/* Floating Action Button: Buzz New Issue */}
      <TouchableOpacity
        style={styles.fabButton}
        onPress={onNavigateAdd}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={24} color="#0B0F19" />
        <Text style={styles.fabText}>Buzz Issue</Text>
      </TouchableOpacity>

      {/* Complaint Detail & Updates Modal */}
      <ComplaintDetailModal
        complaint={selectedComplaint}
        visible={!!selectedComplaint}
        onClose={() => setSelectedComplaint(null)}
        onDelete={(id) => {
          deleteComplaint(id);
          setSelectedComplaint(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgDark,
  },
  listContent: {
    paddingBottom: 90,
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: Colors.bgCard,
    marginHorizontal: 18,
    marginTop: 14,
    borderRadius: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  statBox: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '600',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.borderSubtle,
  },
  searchRow: {
    paddingHorizontal: 18,
    marginTop: 14,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgInput,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 42,
    color: Colors.textPrimary,
    fontSize: 13,
  },
  clearSearchBtn: {
    padding: 4,
  },
  sortSection: {
    paddingHorizontal: 18,
    marginTop: 12,
  },
  sortTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sortButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sortButton: {
    backgroundColor: Colors.bgCard,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  sortButtonActive: {
    backgroundColor: 'rgba(255, 184, 0, 0.15)',
    borderColor: Colors.primary,
  },
  sortButtonText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  sortButtonTextActive: {
    color: Colors.primary,
    fontWeight: '800',
  },
  categoryScroll: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    gap: 8,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    gap: 6,
  },
  categoryPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  categoryTextActive: {
    color: '#0B0F19',
    fontWeight: '800',
  },
  feedHeadingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    marginBottom: 10,
    marginTop: 2,
  },
  feedHeading: {
    fontSize: 15,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: 0.2,
  },
  feedSubheading: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 30,
    marginTop: 20,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
    marginBottom: 16,
  },
  emptyBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  emptyBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0B0F19',
  },
  fabButton: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 28,
    gap: 6,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  fabText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0B0F19',
  },
});
