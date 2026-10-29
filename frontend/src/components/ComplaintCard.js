import React, { useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  Animated,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';

export default function ComplaintCard({
  complaint,
  onBuzz,
  onSelect,
  isBuzzed,
  currentUser,
  onDelete,
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const isMyComplaint = currentUser && complaint.author?.id === currentUser.id;

  const handleBuzzPress = () => {
    // Punchy scale animation on buzz press
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.25,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start();

    onBuzz(complaint.id);
  };

  const handleDeletePress = () => {
    Alert.alert(
      'Delete Issue',
      'Are you sure you want to delete this issue? This will permanently remove it from campus feeds.',
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

  const getNoticeLevel = (count) => {
    if (count >= 50) return { label: 'Critical Priority', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.15)' };
    if (count >= 20) return { label: 'High Visibility', color: '#F97316', bg: 'rgba(249, 115, 22, 0.15)' };
    if (count >= 10) return { label: 'Gaining Traction', color: '#FBBF24', bg: 'rgba(251, 191, 36, 0.15)' };
    return { label: 'Standard Report', color: '#94A3B8', bg: 'rgba(148, 163, 184, 0.12)' };
  };

  const notice = getNoticeLevel(complaint.buzzCount);

  return (
    <View style={styles.cardContainer}>
      {/* Notice Banner when highly buzzed */}
      {complaint.buzzCount >= 10 && (
        <View style={[styles.noticeBanner, { backgroundColor: notice.bg }]}>
          <Text style={[styles.noticeBannerText, { color: notice.color }]}>
            {notice.label} · Verified by {complaint.buzzCount} campus students
          </Text>
        </View>
      )}

      {/* Author and Metadata Header */}
      <View style={styles.cardHeader}>
        <View style={styles.authorRow}>
          <Image source={{ uri: complaint.author.avatar }} style={styles.avatar} />
          <View style={styles.authorTextContainer}>
            <View style={styles.nameRow}>
              <Text style={styles.authorName} numberOfLines={1} ellipsizeMode="tail">
                {complaint.author.name}
              </Text>
              {isMyComplaint && (
                <View style={styles.myBadge}>
                  <Text style={styles.myBadgeText}>You</Text>
                </View>
              )}
            </View>
            <Text style={styles.authorMeta} numberOfLines={1} ellipsizeMode="tail">
              {complaint.author.department || 'Student'}
            </Text>
          </View>
        </View>

        <View style={styles.headerRightActions}>
          {/* Status Pill */}
          <View style={[styles.statusBadge, { borderColor: complaint.statusColor }]}>
            <View style={[styles.statusIndicator, { backgroundColor: complaint.statusColor }]} />
            <Text style={[styles.statusLabel, { color: complaint.statusColor }]}>
              {complaint.status}
            </Text>
          </View>

          {/* Delete Option for Author */}
          {isMyComplaint && onDelete && (
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={handleDeletePress}
              activeOpacity={0.7}
              accessibilityLabel="Delete issue"
            >
              <Ionicons name="trash-outline" size={15} color="#EF4444" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Main Content Area */}
      <TouchableOpacity
        style={styles.cardBody}
        onPress={() => onSelect(complaint)}
        activeOpacity={0.85}
      >
        <Text style={styles.title}>{complaint.title}</Text>
        <Text style={styles.description} numberOfLines={3}>
          {complaint.description}
        </Text>

        {/* Location chip */}
        <View style={styles.locationContainer}>
          <Ionicons name="location-outline" size={14} color={Colors.primary} />
          <Text style={styles.locationText} numberOfLines={1}>{complaint.location}</Text>
        </View>

        {/* Optional Attached Picture */}
        {complaint.imageUrl && (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: complaint.imageUrl }}
              style={styles.complaintImage}
              resizeMode="cover"
            />
          </View>
        )}
      </TouchableOpacity>

      {/* Card Action Footer */}
      <View style={styles.cardFooter}>
        <View style={styles.actionsLeft}>
          {/* Buzz / Like Button */}
          <TouchableOpacity
            style={[styles.buzzButton, isBuzzed && styles.buzzButtonActive]}
            onPress={handleBuzzPress}
            activeOpacity={0.7}
          >
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <Ionicons
                name={isBuzzed ? 'heart' : 'heart-outline'}
                size={16}
                color={isBuzzed ? '#0B0F19' : Colors.primary}
              />
            </Animated.View>
            <Text style={[styles.buzzCountText, isBuzzed && styles.buzzCountTextActive]}>
              {complaint.buzzCount} {complaint.buzzCount === 1 ? 'Buzz' : 'Buzzes'}
            </Text>
          </TouchableOpacity>

          {/* Comments Button */}
          <TouchableOpacity
            style={styles.commentButton}
            onPress={() => onSelect(complaint)}
            activeOpacity={0.7}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={15} color={Colors.textSecondary} />
            <Text style={styles.commentCountText}>
              {complaint.comments?.length || 0}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Notice Level Pill */}
        <View style={[styles.noticePill, { backgroundColor: notice.bg }]}>
          <Text style={[styles.noticePillText, { color: notice.color }]} numberOfLines={1}>
            {notice.label}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  noticeBanner: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noticeBannerText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 8,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    marginRight: 6,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 184, 0, 0.4)',
  },
  authorTextContainer: {
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  authorName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    flexShrink: 1,
  },
  myBadge: {
    backgroundColor: 'rgba(255, 184, 0, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  myBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.primary,
  },
  authorMeta: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  deleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  statusIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardBody: {
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    lineHeight: 20,
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 12,
    color: Colors.primary,
    marginLeft: 4,
    fontWeight: '500',
  },
  imageContainer: {
    height: 180,
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 4,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  complaintImage: {
    width: '100%',
    height: '100%',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    gap: 8,
  },
  actionsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  buzzButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.buzzBg,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.primary,
    gap: 5,
  },
  buzzButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  buzzCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  buzzCountTextActive: {
    color: '#0B0F19',
  },
  commentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 18,
    gap: 5,
  },
  commentCountText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  noticePill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    maxWidth: '45%',
    flexShrink: 1,
  },
  noticePillText: {
    fontSize: 10,
    fontWeight: '700',
  },
});
