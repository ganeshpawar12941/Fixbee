import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Categories, LocationTypes, SeverityLevels } from '../theme/colors';
import { useComplaints } from '../context/ComplaintsContext';
import { useFixbeeAlert } from '../context/FixbeeAlertContext';

export default function AddComplaintScreen({ onSuccessNavigation, complaintToEdit }) {
  const showAlert = useFixbeeAlert();
  const { createComplaint, updateComplaint, generateAIDetails, getStudentDashboardData } = useComplaints();
  const isEditing = Boolean(complaintToEdit);
  const monthlyUsage = getStudentDashboardData().monthlyUsage;
  const reachedMonthlyLimit = !isEditing && monthlyUsage.remaining <= 0;

  const [imageUri, setImageUri] = useState(complaintToEdit?.imageUrl || null);
  const [quickPrompt, setQuickPrompt] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  // Form Fields matching backend schema
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(complaintToEdit?.category || 'electrical');
  const [locationType, setLocationType] = useState(complaintToEdit?.locationType || 'campus');
  const [severity, setSeverity] = useState(complaintToEdit?.severity || 'medium');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionNotice, setSubmissionNotice] = useState(null);
  const [imageValidationToken, setImageValidationToken] = useState(null);
  const submissionInProgress = useRef(false);

  useEffect(() => {
    setImageUri(complaintToEdit?.imageUrl || null);
    setTitle(complaintToEdit?.title || '');
    setDescription(complaintToEdit?.description || '');
    setCategory(complaintToEdit?.category || 'electrical');
    setLocationType(complaintToEdit?.locationType || 'campus');
    setSeverity(complaintToEdit?.severity || 'medium');
    setQuickPrompt('');
    setImageValidationToken(null);
  }, [complaintToEdit]);

  // Capture Image with Camera
  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        showAlert('Permission Denied', 'Camera permission is required to photograph campus issues.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
        setImageValidationToken(null);
        setSubmissionNotice(null);
      }
    } catch {
      showAlert('Error', 'Failed to capture photo');
    }
  };

  // AI Auto-Fill Trigger
  const handleAIGenerate = async () => {
    if (!isEditing && !imageUri) {
      showAlert('Photo Required', 'Please attach an issue photo before using FixBee AI assist.');
      return;
    }

    if (!quickPrompt.trim()) {
      showAlert('Quick Clue Required', 'Please type a short clue (e.g., "water dripping from ceiling in Room 204") so AI can generate the report.');
      return;
    }

    setIsGeneratingAI(true);
    setSubmissionNotice(null);
    try {
      const result = await generateAIDetails(imageUri, quickPrompt);
      if (result.success && result.data) {
        setTitle(result.data.title || '');
        setDescription(result.data.description || '');
        if (result.data.category) setCategory(result.data.category);
        if (result.data.locationType) setLocationType(result.data.locationType);
        if (result.data.severity) setSeverity(result.data.severity);
        setImageValidationToken(result.data.validationToken || null);
        showAlert('AI Generated', 'Title, description, category, and severity populated automatically. Review and make any adjustments!');
      }
    } catch (err) {
      setSubmissionNotice({
        title: err.status === 422 ? 'Image Needs a Clearer View' : 'AI Notice',
        message: err.message || 'Unable to auto-generate details. Please fill manually.',
      });
      showAlert('AI Notice', err.message || 'Unable to auto-generate details. Please fill manually.');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Form Validation & Submission
  const handleSubmit = async () => {
    if (submissionInProgress.current) return;

    if (reachedMonthlyLimit) {
      showAlert(
        'Monthly Limit Reached',
        `You have already submitted ${monthlyUsage.limit} complaints this month.`
      );
      return;
    }

    if (!isEditing && !imageUri) {
      showAlert('Photo Evidence Missing', 'A clear photograph of the defect is required to submit a complaint.');
      return;
    }

    if (title.trim().length < 5) {
      showAlert('Title Too Short', 'Complaint title must be at least 5 characters long.');
      return;
    }

    if (title.trim().length > 120) {
      showAlert('Title Too Long', 'Complaint title cannot exceed 120 characters.');
      return;
    }

    if (description.trim().length < 10) {
      showAlert('Description Too Short', 'Please provide a descriptive explanation (minimum 10 characters).');
      return;
    }

    submissionInProgress.current = true;
    setIsSubmitting(true);
    setSubmissionNotice(null);
    try {
      if (isEditing) {
        await updateComplaint(complaintToEdit._id || complaintToEdit.id, {
          title: title.trim(),
          description: description.trim(),
          category,
          severity,
        });
      } else {
        await createComplaint({
          title: title.trim(),
          description: description.trim(),
          category,
          locationType,
          severity,
          imageUrl: imageUri,
          imageValidationToken,
        });
      }

      showAlert(
        isEditing ? 'Complaint Updated' : 'Complaint Submitted',
        isEditing
          ? 'Your complaint details have been updated.'
          : 'Your complaint has been submitted successfully.',
        [
          {
            text: 'View Feed',
            onPress: () => {
              if (onSuccessNavigation) onSuccessNavigation();
            },
          },
        ]
      );
    } catch (err) {
      const message = err.message || 'Failed to submit complaint.';
      setSubmissionNotice({
        title: err.status === 422 ? 'Image Needs Review' : 'Submission Error',
        message,
      });
      showAlert(
        err.status === 422 ? 'Image Needs Review' : 'Submission Error',
        message
      );
    } finally {
      submissionInProgress.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screenContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Screen Header */}
        <View style={styles.headerRow}>
          <View>
            <View style={styles.brandTitleRow}>
              <Text style={styles.screenTitle}>{isEditing ? 'Edit Complaint' : 'Report An Issue'}</Text>
            </View>
            <Text style={styles.screenSubtitle}>
              {isEditing ? 'Update details while your report is submitted' : 'Notify campus authorities & facilities team'}
            </Text>
          </View>
        </View>

        {submissionNotice && (
          <View style={styles.noticeBanner} accessibilityRole="alert">
            <Ionicons name="warning-outline" size={18} color="#F59E0B" />
            <View style={styles.noticeContent}>
              <Text style={styles.noticeTitle}>{submissionNotice.title}</Text>
              <Text style={styles.noticeMessage}>{submissionNotice.message}</Text>
            </View>
            <TouchableOpacity
              style={styles.noticeClose}
              onPress={() => setSubmissionNotice(null)}
              accessibilityLabel="Dismiss message"
            >
              <Ionicons name="close" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
        )}

        {!isEditing && (
          <View style={styles.quotaCard}>
            <View style={styles.quotaItem}>
              <Ionicons name="calendar-outline" size={14} color={Colors.primary} />
              <Text style={styles.quotaText}>
                Monthly reports: {monthlyUsage.submitted}/{monthlyUsage.limit}
              </Text>
            </View>
            <Text style={styles.quotaText}>{monthlyUsage.remaining} remaining</Text>
          </View>
        )}

        {!isEditing && <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>1. Incident Photograph *</Text>
          <Text style={styles.sectionHelper}>
            Take a clear photo of the issue. Gallery uploads are not available.
          </Text>

          {imageUri ? (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
              <TouchableOpacity
                style={styles.changeImageBtn}
                onPress={takePhoto}
                activeOpacity={0.8}
              >
                <Ionicons name="camera" size={14} color="#0A0A0C" />
                <Text style={styles.changeImageText}>Retake Photo</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <TouchableOpacity style={styles.uploadBox} onPress={takePhoto} activeOpacity={0.8}>
                <Ionicons name="camera-outline" size={26} color={Colors.primary} />
                <Text style={styles.uploadBoxTitle}>Snap Photo</Text>
                <Text style={styles.uploadBoxSub}>Use live camera</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>}

        {!isEditing && <View style={styles.aiCard}>
          <View style={styles.aiHeaderRow}>
            <View style={styles.aiBadge}>
              <Ionicons name="sparkles" size={14} color="#0A0A0C" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.aiTitle}>FixBee AI Auto-Fill</Text>
              <Text style={styles.aiDesc}>
                Type a short clue. AI will draft a complete technical report.
              </Text>
            </View>
          </View>

          <TextInput
            style={styles.aiPromptInput}
            placeholder="e.g. broken tap leaking cold water in 2nd floor hostel washroom"
            placeholderTextColor={Colors.textMuted}
            value={quickPrompt}
            onChangeText={setQuickPrompt}
          />

          <TouchableOpacity
            style={[
              styles.aiGenerateButton,
              (!imageUri || !quickPrompt.trim() || isGeneratingAI) && styles.aiButtonDisabled,
            ]}
            onPress={handleAIGenerate}
            disabled={!imageUri || !quickPrompt.trim() || isGeneratingAI}
            activeOpacity={0.85}
          >
            {isGeneratingAI ? (
              <View style={styles.busyButtonContent}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.aiBusyText}>FixBee AI is drafting your report…</Text>
              </View>
            ) : (
              <>
                <Ionicons name="flash" size={15} color="#0A0A0C" />
                <Text style={styles.aiButtonText}>Generate Report with AI</Text>
              </>
            )}
          </TouchableOpacity>
        </View>}

        {/* 3. Report Details Form */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>{isEditing ? 'Complaint Details' : '2. Report Details'}</Text>

          {/* Title */}
          <View style={styles.inputGroup}>
            <View style={styles.inputLabelRow}>
              <Text style={styles.inputLabel}>Title *</Text>
              <Text style={styles.charCount}>{title.length}/120</Text>
            </View>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Main corridor light fixture flickering and sparking"
              placeholderTextColor={Colors.textMuted}
              value={title}
              onChangeText={setTitle}
              maxLength={120}
            />
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <View style={styles.inputLabelRow}>
              <Text style={styles.inputLabel}>Detailed Description *</Text>
              <Text style={styles.charCount}>{description.length}/3000</Text>
            </View>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Provide exact room/block, observed behavior, and urgency details..."
              placeholderTextColor={Colors.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
              maxLength={3000}
            />
          </View>

          {/* Category Picker */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Category *</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsScroll}
            >
              {Categories.filter((c) => c.id !== 'all').map((cat) => {
                const isSelected = category === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.formChip, isSelected && styles.formChipActive]}
                    onPress={() => setCategory(cat.id)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={cat.icon}
                      size={13}
                      color={isSelected ? '#0A0A0C' : Colors.textSecondary}
                    />
                    <Text style={[styles.formChipText, isSelected && styles.formChipTextActive]}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {!isEditing && <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Campus Zone *</Text>
            <View style={styles.locationSelectorRow}>
              {LocationTypes.filter((l) => l.id !== 'all').map((loc) => {
                const isSelected = locationType === loc.id;
                return (
                  <TouchableOpacity
                    key={loc.id}
                    style={[styles.locationOption, isSelected && styles.locationOptionActive]}
                    onPress={() => setLocationType(loc.id)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={loc.icon}
                      size={15}
                      color={isSelected ? Colors.primary : Colors.textMuted}
                    />
                    <Text
                      style={[styles.locationOptionText, isSelected && styles.locationOptionTextActive]}
                    >
                      {loc.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>}

          {/* Urgency / Severity */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Urgency Level *</Text>
            <View style={styles.severityRow}>
              {SeverityLevels.map((sev) => {
                const isSelected = severity === sev.id;
                return (
                  <TouchableOpacity
                    key={sev.id}
                    style={[
                      styles.severityOption,
                      isSelected && {
                        borderColor: sev.color,
                        backgroundColor: `${sev.color}18`,
                      },
                    ]}
                    onPress={() => setSeverity(sev.id)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.severityText,
                        isSelected && { color: sev.color, fontWeight: '800' },
                      ]}
                    >
                      {sev.label}
                    </Text>
                    <Text style={styles.severityDesc} numberOfLines={1}>
                      {sev.desc}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            (isSubmitting || reachedMonthlyLimit) && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={isSubmitting || reachedMonthlyLimit}
          activeOpacity={0.85}
        >
          {isSubmitting ? (
            <View style={styles.busyButtonContent}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.submitBusyText}>
                {isEditing ? 'FixBee is saving your updates…' : 'FixBee is sending your report…'}
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.submitButtonText}>
                {reachedMonthlyLimit
                  ? 'Monthly Report Limit Reached'
                  : isEditing
                  ? 'Save Complaint Changes'
                  : 'Buzz Issue to FixBee Feed'}
              </Text>
              <Ionicons name="arrow-forward" size={18} color="#0A0A0C" />
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: Colors.bgDark,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
  },
  headerRow: {
    marginBottom: 12,
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: -0.4,
  },
  beeEmoji: {
    fontSize: 22,
  },
  screenSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.38)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  noticeContent: {
    flex: 1,
  },
  noticeTitle: {
    color: '#FBBF24',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 3,
  },
  noticeMessage: {
    color: Colors.textPrimary,
    fontSize: 12,
    lineHeight: 18,
  },
  noticeClose: {
    padding: 2,
  },
  quotaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#16161D',
    borderRadius: 10,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: '#242432',
    marginBottom: 16,
  },
  quotaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  quotaText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  sectionCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  sectionHelper: {
    fontSize: 11,
    color: Colors.textMuted,
    marginBottom: 12,
  },
  uploadBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16161E',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#2E2E3E',
    borderRadius: 12,
    paddingVertical: 18,
  },
  uploadBoxTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 6,
  },
  uploadBoxSub: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
  imagePreviewContainer: {
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
    height: 180,
    backgroundColor: '#16161E',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  changeImageBtn: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  changeImageText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0A0A0C',
  },
  aiCard: {
    backgroundColor: 'rgba(255, 193, 7, 0.08)',
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 193, 7, 0.35)',
    padding: 14,
    marginBottom: 16,
  },
  aiHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  aiBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primary,
  },
  aiDesc: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  aiPromptInput: {
    backgroundColor: '#14141A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#262634',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  aiGenerateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 10,
    gap: 6,
  },
  aiButtonDisabled: {
    backgroundColor: '#2A2A36',
  },
  aiButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0A0A0C',
  },
  busyButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  aiBusyText: {
    flexShrink: 1,
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '800',
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  charCount: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  textInput: {
    backgroundColor: '#16161E',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#242432',
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: Colors.textPrimary,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  chipsScroll: {
    gap: 6,
    paddingVertical: 4,
  },
  formChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16161E',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#282836',
    gap: 5,
  },
  formChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  formChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  formChipTextActive: {
    color: '#0A0A0C',
    fontWeight: '800',
  },
  locationSelectorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  locationOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16161E',
    borderRadius: 8,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#242432',
    gap: 4,
  },
  locationOptionActive: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(255, 193, 7, 0.08)',
  },
  locationOptionText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  locationOptionTextActive: {
    color: Colors.primary,
    fontWeight: '800',
  },
  severityRow: {
    flexDirection: 'row',
    gap: 8,
  },
  severityOption: {
    flex: 1,
    backgroundColor: '#16161E',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: '#242432',
  },
  severityText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  severityDesc: {
    fontSize: 9,
    color: Colors.textMuted,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#2A2A38',
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0A0A0C',
    letterSpacing: -0.2,
  },
  submitBusyText: {
    flexShrink: 1,
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '800',
  },
});
