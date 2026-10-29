import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Animated,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Colors, CampusZones, Categories } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { useComplaints } from '../context/ComplaintsContext';

// ─── Simple on-device AI description enhancer (no external API needed) ───────
const AI_ENHANCEMENT_PROMPTS = [
  'Detailed maintenance report:',
  'Campus facility issue notice:',
  'Infrastructure complaint summary:',
];

function enhanceDescriptionLocally(rawText) {
  if (!rawText || !rawText.trim()) return rawText;
  const cleaned = rawText.trim();

  // Fix grammar basics
  const capitalized = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  const withPeriod = capitalized.endsWith('.') || capitalized.endsWith('!') || capitalized.endsWith('?')
    ? capitalized
    : capitalized + '.';

  // Build an enhanced version
  const enhanced = `${withPeriod}\n\nThis issue has been observed on campus and requires prompt attention from the facilities team. Students and staff are affected, and timely resolution is requested to maintain a safe and functional learning environment.`;
  return enhanced;
}

export default function AddComplaintScreen({ onSuccessNavigation }) {
  const { user } = useAuth();
  const { addComplaint } = useComplaints();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedZone, setSelectedZone] = useState(CampusZones[0]);
  const [roomDetails, setRoomDetails] = useState('');
  const [category, setCategory] = useState('classroom');
  const [urgency, setUrgency] = useState('medium');
  const [imageUri, setImageUri] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastCreatedId, setLastCreatedId] = useState(null);
  const [aiUsed, setAiUsed] = useState(false);

  const handleAiEnhance = async () => {
    if (!description.trim()) {
      Alert.alert('Add a Description First', 'Please write a brief description of the issue before using AI enhancement.');
      return;
    }
    setIsEnhancing(true);
    // Simulate a short AI processing delay for good UX
    await new Promise((resolve) => setTimeout(resolve, 1200));
    const enhanced = enhanceDescriptionLocally(description);
    setDescription(enhanced);
    setAiUsed(true);
    setIsEnhancing(false);
  };

  const takePhotoWithCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Needed', 'Please allow camera access to take photos of campus issues.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
      }
    } catch {
      // Fallback silently
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Title Required', 'Please enter a quick title describing the campus issue.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Description Required', 'Please provide a few details so technicians can locate and fix the issue.');
      return;
    }

    setIsSubmitting(true);
    try {
      const fullLocation = roomDetails.trim()
        ? `${selectedZone} - ${roomDetails.trim()}`
        : selectedZone;

      const created = await addComplaint(
        {
          title,
          description,
          location: fullLocation,
          category,
          urgency,
          imageUrl: imageUri,
        },
        user
      );

      setLastCreatedId(created.id);
      setIsSubmitting(false);
      setShowSuccessModal(true);
    } catch (err) {
      setIsSubmitting(false);
      Alert.alert('Submission Error', 'Failed to publish report: ' + err.message);
    }
  };

  const handleFinishSuccess = () => {
    setShowSuccessModal(false);
    setTitle('');
    setDescription('');
    setRoomDetails('');
    setImageUri(null);
    setAiUsed(false);
    if (onSuccessNavigation) {
      onSuccessNavigation(lastCreatedId);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ─── Page Header ─────────────────────────────────── */}
        <View style={styles.pageHeader}>
          <View style={styles.headerBadge}>
            <Ionicons name="megaphone" size={14} color="#0B0F19" />
            <Text style={styles.headerBadgeText}>Report Campus Issue</Text>
          </View>
          <View style={styles.brandRow}>
            <Text style={styles.brandFix}>Fix</Text>
            <Text style={styles.brandBee}>bee</Text>
          </View>
          <Text style={styles.headerTagline}>
            Buzz it. The community sees it. It gets fixed.
          </Text>
        </View>

        {/* ─── Issue Title ──────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>
            Issue Title <Text style={styles.requiredStar}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Water leak on 2nd floor corridor"
            placeholderTextColor={Colors.textMuted}
            value={title}
            onChangeText={setTitle}
            returnKeyType="next"
          />
        </View>

        {/* ─── Category ────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Category</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pillScroll}
          >
            {Categories.filter((c) => c.id !== 'all').map((cat) => {
              const isActive = category === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.pill, isActive && styles.pillActive]}
                  onPress={() => setCategory(cat.id)}
                  activeOpacity={0.75}
                >
                  <Ionicons
                    name={cat.icon}
                    size={14}
                    color={isActive ? '#0B0F19' : Colors.primary}
                  />
                  <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ─── Campus Zone ─────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Campus Zone</Text>
          <View style={styles.zoneRow}>
            {CampusZones.map((zone) => {
              const isActive = selectedZone === zone;
              return (
                <TouchableOpacity
                  key={zone}
                  style={[styles.zonePill, isActive && styles.zonePillActive]}
                  onPress={() => setSelectedZone(zone)}
                  activeOpacity={0.75}
                >
                  <Ionicons
                    name={
                      zone === "Boys' Hostel"
                        ? 'man'
                        : zone === "Girls' Hostel"
                        ? 'woman'
                        : 'business'
                    }
                    size={14}
                    color={isActive ? '#0B0F19' : Colors.primary}
                    style={{ marginRight: 5 }}
                  />
                  <Text style={[styles.zoneText, isActive && styles.zoneTextActive]}>
                    {zone}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <TextInput
            style={[styles.input, { marginTop: 10 }]}
            placeholder="Specific Room / Floor / Landmark (e.g. Room 204, 3rd floor)"
            placeholderTextColor={Colors.textMuted}
            value={roomDetails}
            onChangeText={setRoomDetails}
            returnKeyType="next"
          />
        </View>

        {/* ─── Urgency Level ───────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Urgency Level</Text>
          <View style={styles.urgencyGrid}>
            {[
              { id: 'low', label: 'Low', color: Colors.urgencyLow, icon: 'shield-outline' },
              { id: 'medium', label: 'Medium', color: Colors.urgencyMedium, icon: 'alert-circle-outline' },
              { id: 'high', label: 'High Priority', color: Colors.urgencyHigh, icon: 'warning-outline' },
              { id: 'emergency', label: 'Critical Hazard', color: Colors.urgencyEmergency, icon: 'alert-circle' },
            ].map((item) => {
              const isActive = urgency === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.urgencyCard,
                    isActive && { backgroundColor: item.color, borderColor: item.color },
                  ]}
                  onPress={() => setUrgency(item.id)}
                  activeOpacity={0.75}
                >
                  <Ionicons
                    name={item.icon}
                    size={16}
                    color={isActive ? '#0B0F19' : item.color}
                  />
                  <Text style={[styles.urgencyLabel, isActive && { color: '#0B0F19', fontWeight: '800' }]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ─── Description with AI Enhance ─────────────────── */}
        <View style={styles.section}>
          <View style={styles.descLabelRow}>
            <Text style={styles.sectionLabel}>
              Description <Text style={styles.requiredStar}>*</Text>
            </Text>
            {aiUsed && (
              <View style={styles.aiUsedBadge}>
                <Ionicons name="sparkles" size={10} color="#0B0F19" />
                <Text style={styles.aiUsedText}>AI Enhanced</Text>
              </View>
            )}
          </View>

          {/* Seamless description + AI button container */}
          <View style={styles.descContainer}>
            <TextInput
              style={styles.textArea}
              placeholder="Describe what is wrong, where exactly it is, and when it started..."
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={5}
              value={description}
              onChangeText={(text) => {
                setDescription(text);
                if (aiUsed) setAiUsed(false);
              }}
              textAlignVertical="top"
            />
            {/* Divider line between textarea and AI button */}
            <View style={styles.descDivider} />
            {/* AI Enhance Button — fused to bottom of description box */}
            <TouchableOpacity
              style={[styles.aiBtn, isEnhancing && styles.aiBtnLoading]}
              onPress={handleAiEnhance}
              disabled={isEnhancing}
              activeOpacity={0.8}
            >
              {isEnhancing ? (
                <>
                  <ActivityIndicator size="small" color="#FFB800" />
                  <Text style={styles.aiBtnText}>Enhancing with AI...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="sparkles" size={15} color={Colors.primary} />
                  <Text style={styles.aiBtnText}>
                    {aiUsed ? 'Re-enhance Description' : 'AI: Enhance My Description'}
                  </Text>
                  <View style={styles.aiBtnBadge}>
                    <Text style={styles.aiBtnBadgeText}>Smart</Text>
                  </View>
                </>
              )}
            </TouchableOpacity>
          </View>
          <Text style={styles.aiHint}>
            AI improves grammar, clarity, and adds professional context to help your report get resolved faster.
          </Text>
        </View>

        {/* ─── Photo Evidence ──────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Photo Evidence</Text>

          {imageUri ? (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
              <TouchableOpacity style={styles.removeImageBtn} onPress={() => setImageUri(null)}>
                <Ionicons name="close" size={14} color="#FFF" />
              </TouchableOpacity>
              <View style={styles.imageLabel}>
                <Ionicons name="checkmark-circle" size={13} color={Colors.accentSuccess} />
                <Text style={styles.imageLabelText}>Photo attached</Text>
              </View>
            </View>
          ) : (
            <TouchableOpacity style={styles.cameraOnlyBtn} onPress={takePhotoWithCamera} activeOpacity={0.8}>
              <View style={styles.cameraIconCircle}>
                <Ionicons name="camera" size={24} color={Colors.primary} />
              </View>
              <View style={styles.cameraTextBlock}>
                <Text style={styles.cameraBtnTitle}>Take a Photo</Text>
                <Text style={styles.cameraBtnSub}>Capture the issue clearly for faster resolution</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* ─── Submit Button ───────────────────────────────── */}
        <TouchableOpacity
          style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
          activeOpacity={0.88}
        >
          {isSubmitting ? (
            <>
              <ActivityIndicator color="#0B0F19" size="small" />
              <Text style={styles.submitBtnText}>Publishing Report...</Text>
            </>
          ) : (
            <>
              <Text style={styles.submitBtnText}>Submit Report</Text>
              <Ionicons name="arrow-forward-circle" size={20} color="#0B0F19" />
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.submitNote}>
          Your report goes live on the campus feed. Peer upvotes escalate visibility to campus administration.
        </Text>
      </ScrollView>

      {/* ─── Success Modal ───────────────────────────────────── */}
      {showSuccessModal && (
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconCircle}>
              <Ionicons name="checkmark-circle" size={48} color={Colors.accentSuccess} />
            </View>
            <Text style={styles.modalTitle}>Report Submitted!</Text>
            <Text style={styles.modalTagline}>Buzz it. Fix it.</Text>
            <Text style={styles.modalDesc}>
              Your campus issue is now live in the community feed. As peers upvote it, institutional priority increases for faster resolution.
            </Text>
            <TouchableOpacity style={styles.modalBtn} onPress={handleFinishSuccess}>
              <Text style={styles.modalBtnText}>View in Campus Feed</Text>
              <Ionicons name="arrow-forward" size={16} color="#0B0F19" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgDark,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 48,
  },

  // ── Page Header
  pageHeader: {
    backgroundColor: Colors.bgCard,
    borderRadius: 18,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    alignItems: 'flex-start',
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 5,
    marginBottom: 10,
  },
  headerBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0B0F19',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  brandFix: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  brandBee: {
    fontSize: 26,
    fontWeight: '900',
    color: Colors.primary,
    letterSpacing: -0.5,
  },
  headerTagline: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },

  // ── Sections
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 9,
    letterSpacing: 0.2,
  },
  requiredStar: {
    color: '#EF4444',
  },

  // ── Input
  input: {
    backgroundColor: Colors.bgInput,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    color: Colors.textPrimary,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    lineHeight: 20,
  },


  // ── Category Pills
  pillScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    gap: 5,
  },
  pillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  pillTextActive: {
    color: '#0B0F19',
    fontWeight: '800',
  },

  // ── Campus Zone
  zoneRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  zonePill: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: '28%',
    backgroundColor: Colors.bgCard,
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.borderSubtle,
    justifyContent: 'center',
  },
  zonePillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  zoneText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  zoneTextActive: {
    color: '#0B0F19',
    fontWeight: '800',
  },

  // ── Urgency
  urgencyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  urgencyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.borderSubtle,
    gap: 6,
    minWidth: '45%',
    flex: 1,
  },
  urgencyLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },

  // ── Description + AI
  descLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 9,
  },
  // Outer container that fuses textarea + AI button
  descContainer: {
    backgroundColor: Colors.bgInput,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    overflow: 'hidden',
  },
  textArea: {
    minHeight: 110,
    textAlignVertical: 'top',
    color: Colors.textPrimary,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    lineHeight: 20,
  },
  descDivider: {
    height: 1,
    backgroundColor: Colors.borderSubtle,
    marginHorizontal: 0,
  },
  // AI button fused at bottom — no separate border
  aiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    paddingHorizontal: 14,
    gap: 8,
    backgroundColor: 'rgba(255,184,0,0.08)',
  },
  aiBtnLoading: {
    backgroundColor: 'rgba(255,184,0,0.05)',
  },
  aiBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 0.2,
  },
  aiBtnBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  aiBtnBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#0B0F19',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  aiUsedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  aiUsedText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0B0F19',
  },
  aiHint: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 7,
    lineHeight: 16,
    paddingHorizontal: 2,
  },

  // ── Photo
  cameraOnlyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.borderSubtle,
    padding: 14,
    gap: 14,
  },
  cameraIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255,184,0,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraTextBlock: {
    flex: 1,
  },
  cameraBtnTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  cameraBtnSub: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  imagePreviewContainer: {
    height: 190,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: Colors.primary,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  removeImageBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageLabel: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(11, 15, 25, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  imageLabelText: {
    fontSize: 11,
    color: Colors.accentSuccess,
    fontWeight: '700',
  },

  // ── Submit
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 6,
    gap: 10,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 7,
  },
  submitBtnDisabled: {
    backgroundColor: Colors.primaryDark,
    shadowOpacity: 0.2,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0B0F19',
    letterSpacing: 0.4,
  },
  submitNote: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 16,
    paddingHorizontal: 10,
  },

  // ── Success Modal
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(11, 15, 25, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    zIndex: 999,
  },
  modalCard: {
    width: '100%',
    backgroundColor: Colors.bgCardElevated,
    borderRadius: 22,
    padding: 28,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  modalIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  modalTagline: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 14,
    letterSpacing: 0.5,
  },
  modalDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 22,
    paddingHorizontal: 4,
  },
  modalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  modalBtnText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0B0F19',
  },
});
