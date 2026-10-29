import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { useComplaints } from '../context/ComplaintsContext';

export default function ComplaintDetailModal({ complaint, visible, onClose, onDelete }) {
  const { user } = useAuth();
  const { toggleBuzz, addComment } = useComplaints();
  const [commentText, setCommentText] = useState('');

  if (!complaint) return null;

  const isBuzzed = user ? complaint.buzzedBy?.includes(user.id) : false;
  const isMyComplaint = user && complaint.author?.id === user.id;

  const handlePostComment = () => {
    if (!commentText.trim()) return;
    addComment(complaint.id, commentText, user);
    setCommentText('');
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Issue',
      'Are you sure you want to permanently delete this report? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            if (onDelete) {
              onDelete(complaint.id);
            }
          },
        },
      ]
    );
  };

  const getNoticeLevel = (count) => {
    if (count >= 50) return { label: 'Critical Campus Priority', color: '#EF4444', desc: 'Escalated to University Dean & Estate Management' };
    if (count >= 20) return { label: 'High Visibility', color: '#F97316', desc: 'Ranked top priority among active student reports' };
    if (count >= 10) return { label: 'Gaining Traction', color: '#FBBF24', desc: 'Dispatched to campus maintenance supervisor' };
    return { label: 'Standard Campus Report', color: '#94A3B8', desc: 'Awaiting student peer verification' };
  };

  const notice = getNoticeLevel(complaint.buzzCount);

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          {/* Header Bar */}
          <View style={styles.headerBar}>
            <View style={styles.headerTitleRow}>
              <Text style={styles.headerTitle}>Issue Details</Text>
            </View>
            <View style={styles.headerActionsRight}>
              {isMyComplaint && (
                <TouchableOpacity style={styles.headerDeleteBtn} onPress={handleDelete} activeOpacity={0.7}>
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <Ionicons name="close" size={22} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
            {/* Notice Meter Callout */}
            <View style={[styles.noticeBox, { borderColor: notice.color }]}>
              <View style={styles.noticeBoxTop}>
                <Text style={[styles.noticeBoxTag, { color: notice.color }]}>{notice.label}</Text>
                <Text style={styles.noticeBoxCount}>{complaint.buzzCount} Student Buzzes</Text>
              </View>
              <Text style={styles.noticeBoxDesc}>{notice.desc}</Text>
            </View>

            {/* Author & Meta */}
            <View style={styles.authorRow}>
              <Image source={{ uri: complaint.author.avatar }} style={styles.authorAvatar} />
              <View style={styles.authorInfo}>
                <Text style={styles.authorName}>{complaint.author.name}</Text>
                <Text style={styles.authorSub}>{complaint.author.department} · {complaint.author.email}</Text>
              </View>
              <View style={[styles.statusBadge, { borderColor: complaint.statusColor }]}>
                <Text style={[styles.statusText, { color: complaint.statusColor }]}>{complaint.status}</Text>
              </View>
            </View>

            {/* Location & Urgency */}
            <View style={styles.metaChipsRow}>
              <View style={styles.metaChip}>
                <Ionicons name="location-sharp" size={14} color={Colors.primary} />
                <Text style={styles.metaChipText}>{complaint.location}</Text>
              </View>
              <View style={[styles.metaChip, { backgroundColor: 'rgba(255, 184, 0, 0.1)' }]}>
                <Ionicons name="alert-circle" size={14} color={Colors.primary} />
                <Text style={[styles.metaChipText, { color: Colors.primary }]}>
                  {complaint.urgency.toUpperCase()}
                </Text>
              </View>
            </View>

            {/* Title & Description */}
            <Text style={styles.title}>{complaint.title}</Text>
            <Text style={styles.description}>{complaint.description}</Text>

            {/* Attached Photo */}
            {complaint.imageUrl && (
              <View style={styles.photoContainer}>
                <Image source={{ uri: complaint.imageUrl }} style={styles.photo} resizeMode="cover" />
              </View>
            )}

            {/* Timeline Progress Tracker */}
            <View style={styles.timelineSection}>
              <Text style={styles.sectionHeader}>Campus Repair Timeline</Text>
              <View style={styles.timelineStep}>
                <View style={[styles.timelineDot, styles.dotDone]} />
                <View style={styles.timelineContent}>
                  <Text style={styles.stepTitle}>Issue Reported & Logged</Text>
                  <Text style={styles.stepSubtitle}>Submitted by student into campus network</Text>
                </View>
              </View>

              <View style={styles.timelineStep}>
                <View style={[styles.timelineDot, complaint.status !== 'Reported' ? styles.dotDone : styles.dotPending]} />
                <View style={styles.timelineContent}>
                  <Text style={styles.stepTitle}>Administration Review</Text>
                  <Text style={styles.stepSubtitle}>Campus facility manager assessed priority</Text>
                </View>
              </View>

              <View style={styles.timelineStep}>
                <View style={[styles.timelineDot, complaint.status === 'In Progress' || complaint.status === 'Resolved' ? styles.dotDone : styles.dotPending]} />
                <View style={styles.timelineContent}>
                  <Text style={styles.stepTitle}>Work In Progress</Text>
                  <Text style={styles.stepSubtitle}>Technicians and tools dispatched</Text>
                </View>
              </View>

              <View style={styles.timelineStep}>
                <View style={[styles.timelineDot, complaint.status === 'Resolved' ? styles.dotDone : styles.dotPending]} />
                <View style={styles.timelineContent}>
                  <Text style={styles.stepTitle}>Resolved & Verified</Text>
                  <Text style={styles.stepSubtitle}>Inspection completed and signed off</Text>
                </View>
              </View>
            </View>

            {/* Comments & Discussion */}
            <View style={styles.commentsSection}>
              <Text style={styles.sectionHeader}>Campus Community Notes ({complaint.comments?.length || 0})</Text>

              {complaint.comments?.map((c) => (
                <View key={c.id} style={styles.commentItem}>
                  <View style={styles.commentHeader}>
                    <Text style={styles.commentAuthor}>{c.author}</Text>
                    <Text style={styles.commentTime}>{c.time}</Text>
                  </View>
                  <Text style={styles.commentBody}>{c.text}</Text>
                </View>
              ))}

              {/* Add Comment Input */}
              <View style={styles.addCommentRow}>
                <TextInput
                  style={styles.commentInput}
                  placeholder="Add an update or note..."
                  placeholderTextColor={Colors.textMuted}
                  value={commentText}
                  onChangeText={setCommentText}
                />
                <TouchableOpacity style={styles.postCommentBtn} onPress={handlePostComment}>
                  <Ionicons name="send" size={16} color="#0B0F19" />
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          {/* Sticky Bottom Bar with Buzz Action */}
          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={[styles.bigBuzzBtn, isBuzzed && styles.bigBuzzBtnActive]}
              onPress={() => toggleBuzz(complaint.id, user?.id || 'guest')}
              activeOpacity={0.8}
            >
              <Ionicons
                name={isBuzzed ? 'heart' : 'heart-outline'}
                size={22}
                color={isBuzzed ? '#0B0F19' : Colors.primary}
              />
              <Text style={[styles.bigBuzzText, isBuzzed && styles.bigBuzzTextActive]}>
                {isBuzzed ? 'Upvoted by You' : 'Upvote Issue'} ({complaint.buzzCount})
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(11, 15, 25, 0.75)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    height: '90%',
    backgroundColor: Colors.bgCardElevated,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1.5,
    borderTopColor: Colors.borderSubtle,
    overflow: 'hidden',
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  headerActionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerDeleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  closeBtn: {
    padding: 6,
  },
  scrollBody: {
    padding: 20,
    paddingBottom: 80,
  },
  noticeBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    marginBottom: 16,
  },
  noticeBoxTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  noticeBoxTag: {
    fontSize: 13,
    fontWeight: '800',
  },
  noticeBoxCount: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  noticeBoxDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  authorAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginRight: 10,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  authorSub: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  metaChipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  metaChipText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  title: {
    fontSize: 19,
    fontWeight: '800',
    color: Colors.textPrimary,
    lineHeight: 26,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: 16,
  },
  photoContainer: {
    height: 220,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  timelineSection: {
    backgroundColor: Colors.bgCard,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 14,
  },
  timelineStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
    marginRight: 12,
  },
  dotDone: {
    backgroundColor: Colors.accentSuccess,
  },
  dotPending: {
    backgroundColor: Colors.borderSubtle,
  },
  timelineContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  stepSubtitle: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  commentsSection: {
    marginBottom: 20,
  },
  commentItem: {
    backgroundColor: Colors.bgCard,
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  commentAuthor: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  commentTime: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  commentBody: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  addCommentRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  commentInput: {
    flex: 1,
    backgroundColor: Colors.bgInput,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: Colors.textPrimary,
    fontSize: 13,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  postCommentBtn: {
    backgroundColor: Colors.primary,
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: Colors.bgCardElevated,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
  },
  bigBuzzBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.buzzBg,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    gap: 8,
  },
  bigBuzzBtnActive: {
    backgroundColor: Colors.primary,
  },
  bigBuzzText: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.primary,
  },
  bigBuzzTextActive: {
    color: '#0B0F19',
  },
});
