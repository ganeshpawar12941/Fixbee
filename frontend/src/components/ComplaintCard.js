import React, { useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, StatusPills } from '../theme/colors';
import { useFixbeeAlert } from '../context/FixbeeAlertContext';

export default function ComplaintCard({
  complaint,
  onLike,
  onSelect,
  currentUser,
  onDelete,
}) {
  const showAlert = useFixbeeAlert();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [imgError, setImgError] = useState(false);

  const isLiked = complaint.isLiked;
  const likesCount = complaint.likesCount || 0;
  const isOwner =
    complaint.isOwner ||
    (currentUser &&
      (complaint.student?._id || complaint.student?.id) ===
        (currentUser._id || currentUser.id));
  const statusInfo = StatusPills[complaint.status] || StatusPills.submitted;

  const handleLikePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.3, duration: 90, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 110, useNativeDriver: true }),
    ]).start();
    Promise.resolve(onLike(complaint._id || complaint.id)).catch((error) => {
      showAlert('Unable to update vote', error.message || 'Please try again.');
    });
  };

  const handleDelete = () => {
    showAlert(
      'Delete Complaint',
      'Are you sure you want to delete this issue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await onDelete?.(complaint._id || complaint.id);
            } catch (error) {
              showAlert('Unable to delete complaint', error.message || 'Please try again.');
            }
          },
        },
      ]
    );
  };

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const now = new Date();
    const past = new Date(dateStr);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 5) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'yesterday';
    return `${diffDays}d ago`;
  };

  const locationDisplay =
    complaint.locationType === 'boys_hostel'
      ? "Boys' Hostel"
      : complaint.locationType === 'girls_hostel'
      ? "Girls' Hostel"
      : 'Campus';

  const categoryName = (complaint.category || 'General').replace('_', ' ');

  return (
    <View style={styles.card}>
      {/* 1. Header: Clean Metadata (No r/ prefixes, pure Black & Yellow) */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Text style={styles.categoryBadge}>{categoryName.toUpperCase()}</Text>
          <Text style={styles.dotSeparator}>•</Text>
          <Text style={styles.locationText}>{locationDisplay}</Text>
          <Text style={styles.dotSeparator}>•</Text>
          <Text style={styles.timeText}>{formatTimeAgo(complaint.createdAt)}</Text>
        </View>

        {/* Clean Status Pill */}
        <View style={[styles.statusPill, { borderColor: statusInfo.color }]}>
          <Text style={[styles.statusText, { color: statusInfo.color }]}>
            {statusInfo.label}
          </Text>
        </View>
      </View>

      {/* 2. Title */}
      <TouchableOpacity activeOpacity={0.85} onPress={() => onSelect(complaint)}>
        <Text style={styles.titleText}>{complaint.title}</Text>
      </TouchableOpacity>

      {complaint.description ? (
        <Text style={styles.descriptionText}>{complaint.description}</Text>
      ) : null}

      {/* 3. Image Preview */}
      {complaint.imageUrl && !imgError && (
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => onSelect(complaint)}
          style={styles.imageBox}
        >
          <Image
            source={{ uri: complaint.imageUrl }}
            style={styles.image}
            resizeMode="cover"
            onError={() => setImgError(true)}
          />
          {complaint.status === 'resolved' && (
            <View style={styles.resolvedTag}>
              <Ionicons name="checkmark-circle" size={13} color="#22C55E" />
              <Text style={styles.resolvedTagText}>
                {complaint.resolutionPhoto ? 'Resolved • Photo Proof' : 'Resolved'}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      )}

      {/* 5. Minimal Black & Yellow Action Bar */}
      <View style={styles.actionBar}>
        {/* Upvote Pill */}
        <TouchableOpacity
          style={[styles.upvoteButton, isLiked && styles.upvoteButtonActive]}
          onPress={handleLikePress}
          activeOpacity={0.7}
        >
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <Ionicons
              name={isLiked ? 'arrow-up-circle' : 'arrow-up-circle-outline'}
              size={18}
              color={isLiked ? Colors.primary : Colors.textMuted}
            />
          </Animated.View>
          <Text style={[styles.upvoteCount, isLiked && styles.upvoteCountActive]}>
            {likesCount}
          </Text>
        </TouchableOpacity>

        {/* Owner Delete Button */}
        {isOwner && complaint.status === 'submitted' && (
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={handleDelete}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={15} color={Colors.accentDanger} />
          </TouchableOpacity>
        )}

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    marginHorizontal: 14,
    marginBottom: 10,
    padding: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    flexWrap: 'wrap',
  },
  categoryBadge: {
    fontSize: 10,
    fontWeight: '900',
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  dotSeparator: {
    fontSize: 10,
    color: Colors.textMuted,
    marginHorizontal: 5,
  },
  locationText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  timeText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  titleText: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
    lineHeight: 20,
    marginBottom: 8,
  },
  imageBox: {
    width: '100%',
    height: 180,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#16161C',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  resolvedTag: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(10, 10, 12, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.4)',
  },
  resolvedTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#22C55E',
  },
  descriptionText: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 10,
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    paddingTop: 8,
    gap: 8,
  },
  upvoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16161E',
    borderRadius: 16,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    gap: 5,
  },
  upvoteButtonActive: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(255, 193, 7, 0.12)',
  },
  upvoteCount: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textSecondary,
  },
  upvoteCountActive: {
    color: Colors.primary,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16161E',
    borderRadius: 16,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    gap: 4,
  },
});
