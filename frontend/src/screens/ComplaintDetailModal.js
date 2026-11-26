import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, StatusPills, Categories } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { useComplaints } from '../context/ComplaintsContext';

export default function ComplaintDetailModal({
  visible,
  complaint,
  onClose,
  onLike,
}) {
  const { user } = useAuth();
  const { addAdditionalInfo, complaints } = useComplaints();
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!complaint) return null;

  // Retrieve latest state of this complaint from context
  const currentComplaint =
    complaints.find((c) => (c._id || c.id) === (complaint._id || complaint.id)) || complaint;

  const statusInfo = StatusPills[currentComplaint.status] || StatusPills.submitted;
  const categoryObj = Categories.find((c) => c.id === currentComplaint.category) || {
    id: currentComplaint.category,
    label: currentComplaint.category || 'General',
    icon: 'cube-outline',
    color: Colors.primary,
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    setIsSubmitting(true);
    try {
      await addAdditionalInfo(currentComplaint._id || currentComplaint.id, commentText.trim());
      setCommentText('');
    } catch {
      Alert.alert('Error', 'Unable to post comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' • ' + d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case 'warden':
        return { label: 'Warden', color: Colors.primary, bg: 'rgba(255, 193, 7, 0.15)' };
      case 'infrastructure_dean':
        return { label: 'Dean Infra', color: Colors.primary, bg: 'rgba(255, 193, 7, 0.15)' };
      case 'admin':
        return { label: 'Admin', color: Colors.primary, bg: 'rgba(255, 193, 7, 0.15)' };
      default:
        return { label: 'Student', color: '#FFFFFF', bg: 'rgba(255, 255, 255, 0.1)' };
    }
  };

  const locationLabel =
    currentComplaint.locationType === 'boys_hostel'
      ? "Boys' Hostel"
      : currentComplaint.locationType === 'girls_hostel'
      ? "Girls' Hostel"
      : 'Campus Grounds';

  const categoryLabel = (currentComplaint.category || 'General').replace('_', ' ').toUpperCase();

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.modalContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Clean Modal Header */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={onClose} style={styles.backButton} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons name="close" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.subredditHeaderInfo}>
            <Text style={styles.subredditTitle}>{categoryLabel}</Text>
            <Text style={styles.postBySubtitle}>
              Reported by {currentComplaint.student?.name || 'Student'}
            </Text>
          </View>

          {/* Upvote Pill in Header */}
          <TouchableOpacity
            style={[styles.headerVotePill, currentComplaint.isLiked && styles.headerVotePillActive]}
            onPress={() => onLike(currentComplaint._id || currentComplaint.id)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={currentComplaint.isLiked ? 'arrow-up-circle' : 'arrow-up-circle-outline'}
              size={18}
              color={currentComplaint.isLiked ? Colors.primary : Colors.textMuted}
            />
            <Text style={[styles.headerVoteScore, currentComplaint.isLiked && styles.headerVoteScoreActive]}>
              {currentComplaint.likesCount || 0}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
          {/* Flairs and Status Badges */}
          <View style={styles.flairsRow}>
            <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg, borderColor: `${statusInfo.color}50` }]}>
              <Ionicons name={statusInfo.icon} size={13} color={statusInfo.color} style={{ marginRight: 4 }} />
              <Text style={[styles.statusBadgeText, { color: statusInfo.color }]}>
                {statusInfo.label}
              </Text>
            </View>

            <View style={styles.infoPill}>
              <Ionicons name="location-sharp" size={12} color={Colors.primary} style={{ marginRight: 4 }} />
              <Text style={styles.infoPillText}>{locationLabel}</Text>
            </View>

            <View style={styles.infoPill}>
              <Ionicons name="alert-circle" size={12} color={Colors.primary} style={{ marginRight: 4 }} />
              <Text style={styles.infoPillText}>{currentComplaint.severity?.toUpperCase()} URGENCY</Text>
            </View>
          </View>

          {/* Post Title */}
          <Text style={styles.detailTitle}>{currentComplaint.title}</Text>

          {/* Post Description */}
          <Text style={styles.detailDescription}>{currentComplaint.description}</Text>

          {/* Main Complaint Image */}
          {currentComplaint.imageUrl && (
            <View style={styles.imageCard}>
              <Image
                source={{ uri: currentComplaint.imageUrl }}
                style={styles.mainImage}
                resizeMode="cover"
              />
              <View style={styles.imageCaptionBar}>
                <Ionicons name="camera" size={12} color={Colors.textMuted} />
                <Text style={styles.imageCaptionText}>Incident Photograph Submitted by Student</Text>
              </View>
            </View>
          )}

          {/* Resolution Photo Card (if resolved) */}
          {currentComplaint.status === 'resolved' && currentComplaint.resolutionPhoto && (
            <View style={styles.resolutionCard}>
              <View style={styles.resolutionHeader}>
                <Ionicons name="checkmark-done-circle" size={18} color="#22C55E" />
                <Text style={styles.resolutionTitle}>Official Repair Verification Evidence</Text>
              </View>
              <Image
                source={{ uri: currentComplaint.resolutionPhoto }}
                style={styles.resolutionImage}
                resizeMode="cover"
              />
              <Text style={styles.resolvedTimestampText}>
                Resolved on {formatTime(currentComplaint.resolvedAt)}
              </Text>
            </View>
          )}

          {/* Status Pipeline Tracking Timeline */}
          <View style={styles.timelineSection}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="git-network-outline" size={16} color={Colors.primary} />
              <Text style={styles.sectionTitle}>FixBee Status Pipeline</Text>
            </View>

            <View style={styles.timelineList}>
              {currentComplaint.statusHistory && currentComplaint.statusHistory.length > 0 ? (
                currentComplaint.statusHistory.map((step, idx) => {
                  const stepStatusInfo = StatusPills[step.toStatus] || StatusPills.submitted;
                  return (
                    <View key={idx} style={styles.timelineStep}>
                      <View style={styles.timelineLeftColumn}>
                        <View style={[styles.timelineNode, { borderColor: stepStatusInfo.color }]}>
                          <Ionicons name={stepStatusInfo.icon} size={12} color={stepStatusInfo.color} />
                        </View>
                        {idx < currentComplaint.statusHistory.length - 1 && (
                          <View style={styles.timelineConnector} />
                        )}
                      </View>
                      <View style={styles.timelineRightContent}>
                        <View style={styles.timelineHeaderRow}>
                          <Text style={[styles.timelineStatusName, { color: stepStatusInfo.color }]}>
                            {stepStatusInfo.label}
                          </Text>
                          <Text style={styles.timelineTime}>{formatTime(step.changedAt)}</Text>
                        </View>
                        {step.remarks ? (
                          <Text style={styles.timelineRemarks}>{step.remarks}</Text>
                        ) : null}
                      </View>
                    </View>
                  );
                })
              ) : (
                <Text style={styles.noHistoryText}>Report registered in system.</Text>
              )}
            </View>
          </View>

          {/* Reddit Comments & Additional Information Discussion Thread */}
          <View style={styles.discussionSection}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="chatbubbles" size={16} color={Colors.primary} />
              <Text style={styles.sectionTitle}>
                Discussion & Official Updates ({currentComplaint.additionalInfo?.length || 0})
              </Text>
            </View>

            {currentComplaint.additionalInfo && currentComplaint.additionalInfo.length > 0 ? (
              currentComplaint.additionalInfo.map((info, idx) => {
                const roleBadge = getRoleBadgeStyle(info.senderRole);
                return (
                  <View key={info._id || idx} style={styles.commentItem}>
                    <View style={styles.commentHeaderRow}>
                      <View style={[styles.commentAvatar, { backgroundColor: `${roleBadge.color}25` }]}>
                        <Text style={[styles.commentAvatarText, { color: roleBadge.color }]}>
                          {(info.senderName || 'U').charAt(0).toUpperCase()}
                        </Text>
                      </View>

                      <View style={styles.commentMeta}>
                        <View style={styles.commentNameRow}>
                          <Text style={styles.commentAuthorName}>
                            {info.senderName || 'Campus User'}
                          </Text>
                          <View style={[styles.roleBadge, { backgroundColor: roleBadge.bg }]}>
                            <Text style={[styles.roleBadgeText, { color: roleBadge.color }]}>
                              {roleBadge.label}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.commentTime}>{formatTime(info.createdAt)}</Text>
                      </View>
                    </View>

                    <Text style={styles.commentMessage}>{info.message}</Text>
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyCommentsCard}>
                <Ionicons name="chatbox-outline" size={24} color={Colors.textMuted} />
                <Text style={styles.emptyCommentsText}>
                  No updates posted yet. Management and students can exchange information here.
                </Text>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Reddit-Style Comment Input Bar */}
        <View style={styles.commentInputBar}>
          <TextInput
            style={styles.commentInput}
            placeholder={`Add an update as ${user?.name?.split(' ')[0] || 'User'} (${user?.role || 'student'})...`}
            placeholderTextColor={Colors.textMuted}
            value={commentText}
            onChangeText={setCommentText}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!commentText.trim() || isSubmitting) && styles.sendButtonDisabled,
            ]}
            onPress={handleAddComment}
            disabled={!commentText.trim() || isSubmitting}
            activeOpacity={0.8}
          >
            <Ionicons
              name="send"
              size={18}
              color={commentText.trim() && !isSubmitting ? '#0A0A0C' : Colors.textMuted}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.bgDark,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.bgCardElevated,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  backButton: {
    padding: 4,
  },
  subredditHeaderInfo: {
    flex: 1,
    marginLeft: 12,
  },
  subredditTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primary,
  },
  postBySubtitle: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  headerVotePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E26',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2A2A36',
    gap: 4,
  },
  headerVotePillActive: {
    backgroundColor: Colors.upvoteBg,
    borderColor: Colors.primary,
  },
  headerVoteScore: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textSecondary,
  },
  headerVoteScoreActive: {
    color: Colors.primary,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  flairsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  infoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#191922',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#282836',
  },
  infoPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.textPrimary,
    lineHeight: 26,
    marginBottom: 10,
  },
  detailDescription: {
    fontSize: 14,
    lineHeight: 22,
    color: '#D4D4D8',
    marginBottom: 16,
  },
  imageCard: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    marginBottom: 18,
  },
  mainImage: {
    width: '100%',
    height: 240,
  },
  imageCaptionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#14141A',
  },
  imageCaptionText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  resolutionCard: {
    backgroundColor: 'rgba(34, 197, 94, 0.08)',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(34, 197, 94, 0.35)',
    padding: 12,
    marginBottom: 18,
  },
  resolutionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  resolutionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#22C55E',
  },
  resolutionImage: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    marginBottom: 6,
  },
  resolvedTimestampText: {
    fontSize: 10,
    color: '#22C55E',
    fontWeight: '600',
    textAlign: 'right',
  },
  timelineSection: {
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    padding: 14,
    marginBottom: 18,
  },
  sectionHeaderRow: {
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
  timelineList: {
    paddingLeft: 4,
  },
  timelineStep: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  timelineLeftColumn: {
    alignItems: 'center',
    width: 24,
    marginRight: 10,
  },
  timelineNode: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#16161E',
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineConnector: {
    width: 2,
    flex: 1,
    backgroundColor: '#2A2A38',
    marginTop: 4,
  },
  timelineRightContent: {
    flex: 1,
    paddingTop: 1,
  },
  timelineHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  timelineStatusName: {
    fontSize: 12,
    fontWeight: '800',
  },
  timelineTime: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  timelineRemarks: {
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  noHistoryText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  discussionSection: {
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    padding: 14,
    marginBottom: 16,
  },
  commentItem: {
    backgroundColor: '#16161E',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#242430',
    padding: 10,
    marginBottom: 10,
  },
  commentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  commentAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  commentAvatarText: {
    fontSize: 12,
    fontWeight: '800',
  },
  commentMeta: {
    flex: 1,
  },
  commentNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  commentAuthorName: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  roleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  roleBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  commentTime: {
    fontSize: 9,
    color: Colors.textMuted,
    marginTop: 1,
  },
  commentMessage: {
    fontSize: 12,
    color: '#E4E4E7',
    lineHeight: 18,
  },
  emptyCommentsCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  emptyCommentsText: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
  },
  commentInputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.bgCardElevated,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
    gap: 8,
  },
  commentInput: {
    flex: 1,
    backgroundColor: Colors.bgInput,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 13,
    color: Colors.textPrimary,
    maxHeight: 80,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#262632',
  },
});
