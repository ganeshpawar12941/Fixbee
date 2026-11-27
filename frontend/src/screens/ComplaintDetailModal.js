import React, { useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, StatusPills } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { useComplaints } from '../context/ComplaintsContext';
import { useFixbeeAlert } from '../context/FixbeeAlertContext';

export default function ComplaintDetailModal({
  visible,
  complaint,
  onClose,
  onLike,
}) {
  const showAlert = useFixbeeAlert();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { complaints, addAdditionalInfo, getComplaintDetails } = useComplaints();
  const [additionalInfoText, setAdditionalInfoText] = React.useState('');
  const [savingInfo, setSavingInfo] = React.useState(false);
  const complaintId = complaint?._id || complaint?.id;
  const currentUserId = user?._id || user?.id;
  const getId = (value) => (
    value && typeof value === 'object' ? value._id || value.id : value
  );
  const canLoadDetails = user?.role === 'admin'
    || (user?.role === 'student' && String(getId(complaint?.student)) === String(currentUserId))
    || (['warden', 'infrastructure_dean'].includes(user?.role)
      && String(getId(complaint?.assignedManagement)) === String(currentUserId));

  useEffect(() => {
    if (!visible || !complaintId || !canLoadDetails) return undefined;
    let active = true;
    getComplaintDetails(complaintId).catch((error) => {
      if (active) {
        showAlert('Unable to load complaint details', error.message || 'Please try again.');
      }
    });
    return () => {
      active = false;
    };
  }, [visible, complaintId, canLoadDetails, getComplaintDetails]);

  if (!complaint) return null;

  // Retrieve latest state of this complaint from context
  const currentComplaint =
    complaints.find((c) => (c._id || c.id) === (complaint._id || complaint.id)) || complaint;

  const statusInfo = StatusPills[currentComplaint.status] || StatusPills.submitted;
  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' • ' + d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  const locationLabel =
    currentComplaint.locationType === 'boys_hostel'
      ? "Boys' Hostel"
      : currentComplaint.locationType === 'girls_hostel'
      ? "Girls' Hostel"
      : 'Campus Grounds';

  const categoryLabel = (currentComplaint.category || 'General').replace('_', ' ').toUpperCase();
  const isStudentOwner = user?.role === 'student' && getId(currentComplaint.student) === currentUserId;
  const isAssignedManager = ['warden', 'infrastructure_dean'].includes(user?.role) &&
    getId(currentComplaint.assignedManagement) === currentUserId;
  const canAddInformation = isStudentOwner || isAssignedManager;
  const additionalInfo = currentComplaint.additionalInfo || [];

  const submitAdditionalInfo = async () => {
    if (!additionalInfoText.trim() || savingInfo) return;
    setSavingInfo(true);
    try {
      await addAdditionalInfo(currentComplaint._id || currentComplaint.id, additionalInfoText);
      setAdditionalInfoText('');
    } catch (error) {
      showAlert('Unable to add information', error.message || 'Please try again.');
    } finally {
      setSavingInfo(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={[styles.modalContainer, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
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

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
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

          {(additionalInfo.length > 0 || canAddInformation) && (
            <View style={styles.additionalInfoSection}>
              <View style={styles.sectionHeaderRow}>
                <Ionicons name="information-circle-outline" size={17} color={Colors.primary} />
                <Text style={styles.sectionTitle}>Additional Information</Text>
              </View>
              <Text style={styles.additionalInfoHint}>
                Official updates shared by the reporting student and assigned management.
              </Text>
              {additionalInfo.length > 0 ? additionalInfo.map((entry, index) => (
                <View key={entry._id || `${entry.createdAt}-${index}`} style={styles.additionalInfoCard}>
                  <View style={styles.additionalInfoHeader}>
                    <Text style={styles.additionalInfoSender}>{entry.senderName || 'Campus user'}</Text>
                    <Text style={styles.additionalInfoTime}>{formatTime(entry.createdAt)}</Text>
                  </View>
                  <Text style={styles.additionalInfoMessage}>{entry.message}</Text>
                </View>
              )) : (
                <Text style={styles.noAdditionalInfo}>No additional information has been shared yet.</Text>
              )}
              {canAddInformation && (
                <View style={styles.additionalInfoComposer}>
                  <TextInput
                    style={styles.additionalInfoInput}
                    value={additionalInfoText}
                    onChangeText={setAdditionalInfoText}
                    placeholder="Add an official update..."
                    placeholderTextColor={Colors.textMuted}
                    multiline
                    maxLength={500}
                  />
                  <TouchableOpacity
                    style={[
                      styles.additionalInfoSendButton,
                      (!additionalInfoText.trim() || savingInfo) && styles.additionalInfoSendButtonDisabled,
                    ]}
                    onPress={submitAdditionalInfo}
                    disabled={!additionalInfoText.trim() || savingInfo}
                    activeOpacity={0.8}
                    accessibilityLabel="Submit additional information"
                  >
                    <Ionicons name="send" size={16} color={Colors.textInverse} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </View>
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
  additionalInfoSection: {
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    padding: 14,
    marginBottom: 18,
  },
  additionalInfoHint: {
    color: Colors.textMuted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: -5,
    marginBottom: 10,
  },
  additionalInfoCard: {
    backgroundColor: Colors.bgCardElevated,
    borderRadius: 9,
    padding: 10,
    marginBottom: 8,
  },
  additionalInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 5,
  },
  additionalInfoSender: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 11,
    fontWeight: '800',
  },
  additionalInfoTime: {
    color: Colors.textMuted,
    fontSize: 9,
  },
  additionalInfoMessage: {
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  noAdditionalInfo: {
    color: Colors.textMuted,
    fontSize: 11,
    marginBottom: 10,
  },
  additionalInfoComposer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginTop: 6,
  },
  additionalInfoInput: {
    flex: 1,
    minHeight: 42,
    maxHeight: 100,
    color: Colors.textPrimary,
    backgroundColor: Colors.bgCardElevated,
    borderColor: Colors.borderSubtle,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
    fontSize: 12,
  },
  additionalInfoSendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
  },
  additionalInfoSendButtonDisabled: {
    opacity: 0.45,
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
});
