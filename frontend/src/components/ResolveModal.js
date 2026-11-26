import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';

export default function ResolveModal({
  visible,
  complaint,
  onClose,
  onConfirmResolve,
}) {
  const [photoUri, setPhotoUri] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!complaint) return null;

  const pickFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Gallery access is needed to upload a resolution photo.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.85,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Error', 'Could not select image from gallery.');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera access is needed to take a resolution verification photo.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.85,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Error', 'Could not capture photo from camera.');
    }
  };

  const handleConfirm = async () => {
    if (!photoUri) {
      Alert.alert(
        'Resolution Photo Required',
        'You must capture or upload a verification photo before marking this complaint as resolved.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirmResolve(complaint._id || complaint.id, photoUri, remarks);
      setPhotoUri(null);
      setRemarks('');
      onClose();
    } catch (err) {
      Alert.alert('Resolution Failed', err.message || 'Unable to resolve complaint.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setPhotoUri(null);
    setRemarks('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.iconCircle}>
                <Ionicons name="shield-checkmark" size={16} color="#0A0A0C" />
              </View>
              <Text style={styles.headerTitle}>Resolve Issue with Proof</Text>
            </View>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          <Text style={styles.complaintTitle} numberOfLines={2}>
            {complaint.title}
          </Text>

          {/* Mandatory Photo Notice */}
          <View style={styles.mandatoryNotice}>
            <Ionicons name="camera" size={14} color={Colors.primary} />
            <Text style={styles.mandatoryText}>
              Mandatory: Attach a clear photo of the completed repair. This photo will be shown to the student who submitted the complaint.
            </Text>
          </View>

          {/* Photo Picker / Live Preview */}
          {photoUri ? (
            <View style={styles.previewWrapper}>
              <Image source={{ uri: photoUri }} style={styles.previewImg} resizeMode="cover" />
              <TouchableOpacity
                style={styles.retakeBtn}
                onPress={pickFromGallery}
                activeOpacity={0.85}
              >
                <Ionicons name="refresh" size={13} color="#0A0A0C" />
                <Text style={styles.retakeText}>Replace Photo</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.pickerRow}>
              <TouchableOpacity style={styles.pickerBox} onPress={takePhoto} activeOpacity={0.8}>
                <Ionicons name="camera-outline" size={24} color={Colors.primary} />
                <Text style={styles.pickerTitle}>Take Photo</Text>
                <Text style={styles.pickerSub}>Use camera</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.pickerBox} onPress={pickFromGallery} activeOpacity={0.8}>
                <Ionicons name="images-outline" size={24} color={Colors.primary} />
                <Text style={styles.pickerTitle}>Upload Photo</Text>
                <Text style={styles.pickerSub}>From gallery</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Optional Remarks */}
          <TextInput
            style={styles.remarksInput}
            placeholder="Resolution note for the student (optional)..."
            placeholderTextColor={Colors.textMuted}
            value={remarks}
            onChangeText={setRemarks}
            multiline
          />

          {/* Confirm Button (Disabled until photo is provided) */}
          <TouchableOpacity
            style={[
              styles.confirmBtn,
              (!photoUri || isSubmitting) && styles.confirmBtnDisabled,
            ]}
            onPress={handleConfirm}
            disabled={!photoUri || isSubmitting}
            activeOpacity={0.85}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#0A0A0C" />
            ) : (
              <>
                <Ionicons
                  name="checkmark-done"
                  size={16}
                  color={photoUri ? '#0A0A0C' : Colors.textMuted}
                />
                <Text
                  style={[
                    styles.confirmBtnText,
                    !photoUri && styles.confirmBtnTextDisabled,
                  ]}
                >
                  {photoUri ? 'Confirm Resolution' : 'Photo Required to Resolve'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: Colors.bgCardElevated,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.primary,
    padding: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  complaintTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 12,
    lineHeight: 18,
  },
  mandatoryNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 193, 7, 0.08)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 193, 7, 0.25)',
    padding: 10,
    gap: 8,
    marginBottom: 14,
  },
  mandatoryText: {
    flex: 1,
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 15,
  },
  pickerRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  pickerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgCard,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#30303C',
    borderRadius: 12,
    paddingVertical: 18,
  },
  pickerTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 6,
  },
  pickerSub: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
  previewWrapper: {
    height: 165,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.primary,
    marginBottom: 14,
    position: 'relative',
  },
  previewImg: {
    width: '100%',
    height: '100%',
  },
  retakeBtn: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  retakeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0A0A0C',
  },
  remarksInput: {
    backgroundColor: Colors.bgInput,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    color: Colors.textPrimary,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 12,
    minHeight: 54,
    textAlignVertical: 'top',
    marginBottom: 14,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#22C55E',
    borderRadius: 10,
    paddingVertical: 12,
    gap: 6,
  },
  confirmBtnDisabled: {
    backgroundColor: '#1E1E24',
    borderWidth: 1,
    borderColor: '#2A2A34',
  },
  confirmBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0A0A0C',
  },
  confirmBtnTextDisabled: {
    color: Colors.textMuted,
  },
});
