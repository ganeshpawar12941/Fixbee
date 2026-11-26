import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';

export default function TrendingSpotlight({
  complaint,
  onBuzz,
  onSelect,
  isBuzzed,
  currentUser,
  onDelete,
}) {
  if (!complaint) return null;

  const isMyComplaint = currentUser && complaint.author?.id === currentUser.id;

  const handleDeletePress = () => {
    Alert.alert(
      'Delete Issue',
      'Are you sure you want to delete this issue? This will remove it from campus feeds.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            if (onDelete) onDelete(complaint.id);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.spotlightHeader}>
        <View style={styles.pulseTag}>
          <Ionicons name="flame" size={13} color={Colors.primary} style={{ marginRight: 5 }} />
          <Text style={styles.spotlightTitle} numberOfLines={1} ellipsizeMode="tail">
            CAMPUS SPOTLIGHT
          </Text>
        </View>
        <View style={styles.spotlightHeaderRight}>
          <View style={styles.noticeBadge}>
            <Text style={styles.noticeText}>ESCALATED</Text>
          </View>
          {isMyComplaint && onDelete && (
            <TouchableOpacity
              style={styles.spotlightDeleteBtn}
              onPress={handleDeletePress}
              activeOpacity={0.7}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Ionicons name="trash-outline" size={14} color="#EF4444" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <TouchableOpacity
        style={styles.cardContent}
        onPress={() => onSelect(complaint)}
        activeOpacity={0.88}
      >
        <View style={styles.metaRow}>
          <View style={styles.locationChip}>
            <Ionicons name="location-sharp" size={12} color={Colors.primary} />
            <Text style={styles.locationText} numberOfLines={1}>
              {complaint.location}
            </Text>
          </View>
          <View style={[styles.statusChip, { backgroundColor: 'rgba(251, 146, 60, 0.15)' }]}>
            <Text style={[styles.statusText, { color: complaint.statusColor }]}>
              {complaint.status}
            </Text>
          </View>
        </View>

        <Text style={styles.title} numberOfLines={2}>
          {complaint.title}
        </Text>

        <Text style={styles.description} numberOfLines={2}>
          {complaint.description}
        </Text>

        {complaint.imageUrl && (
          <View style={styles.imageWrapper}>
            <Image source={{ uri: complaint.imageUrl }} style={styles.spotlightImage} />
            <View style={styles.imageOverlay} />
          </View>
        )}

        <View style={styles.footerRow}>
          <View style={styles.authorSection}>
            <Image source={{ uri: complaint.author.avatar }} style={styles.authorAvatar} />
            <Text style={styles.authorName} numberOfLines={1} ellipsizeMode="tail">
              {complaint.author.name}
            </Text>
          </View>

          {/* Interactive Buzz Button */}
          <TouchableOpacity
            style={[styles.buzzButton, isBuzzed && styles.buzzButtonActive]}
            onPress={() => onBuzz(complaint.id)}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isBuzzed ? 'heart' : 'heart-outline'}
              size={16}
              color={isBuzzed ? '#0B0F19' : Colors.primary}
            />
            <Text style={[styles.buzzCount, isBuzzed && styles.buzzCountActive]}>
              {complaint.buzzCount} {complaint.buzzCount === 1 ? 'Buzz' : 'Buzzes'}
            </Text>
            <View style={styles.boostPill}>
              <Ionicons name="flame" size={11} color="#0B0F19" />
              <Text style={styles.boostHint}>Hot</Text>
            </View>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 12,
    backgroundColor: Colors.bgCardElevated,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 184, 0, 0.4)',
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  spotlightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 184, 0, 0.1)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 184, 0, 0.2)',
  },
  pulseTag: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  spotlightTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 0.8,
    flexShrink: 1,
  },
  spotlightHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  noticeBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  spotlightDeleteBtn: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  noticeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#EF4444',
  },
  cardContent: {
    padding: 14,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '70%',
  },
  locationText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: 4,
    fontWeight: '500',
  },
  statusChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    lineHeight: 22,
    marginBottom: 6,
  },
  description: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 10,
  },
  imageWrapper: {
    height: 140,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 12,
    position: 'relative',
  },
  spotlightImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(11, 15, 25, 0.1)',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  authorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    marginRight: 6,
  },
  authorAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 0, 0.4)',
  },
  authorName: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
    flexShrink: 1,
  },
  buzzButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.buzzBg,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.primary,
    gap: 6,
    flexShrink: 0,
  },
  buzzButtonActive: {
    backgroundColor: Colors.primary,
  },
  buzzCount: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  buzzCountActive: {
    color: '#0B0F19',
  },
  boostPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  boostHint: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0B0F19',
    letterSpacing: 0.2,
  },
});
