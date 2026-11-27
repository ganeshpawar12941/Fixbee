import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { useComplaints } from '../context/ComplaintsContext';

export default function Header({ onProfilePress, onNotificationsPress }) {
  const { user } = useAuth();
  const { unreadNotificationsCount } = useComplaints();

  return (
    <View style={styles.headerContainer}>
      {/* Left: Brand Identity */}
      <View style={styles.leftSection}>
        <View style={styles.logoRow}>
          <View style={styles.logoCircle}>
            <Image
              source={require('../../assets/fixbee_bee_logo.png')}
              style={styles.logoImage}
            />
          </View>
          <View style={styles.titleColumn}>
            <View style={styles.titleRow}>
              <Text style={styles.brandTitleFix}>Fix</Text>
              <Text style={styles.brandTitleBee}>bee</Text>
            </View>
            <Text style={styles.brandTagline}>buzz it • fix it</Text>
          </View>
        </View>
      </View>

      {/* Right: Notifications and authenticated profile */}
      <View style={styles.rightSection}>
        {/* Notifications Bell */}
        <TouchableOpacity
          style={styles.bellButton}
          onPress={onNotificationsPress}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="notifications-outline" size={20} color={Colors.textPrimary} />
          {unreadNotificationsCount > 0 && (
            <View style={styles.badgeCount}>
              <Text style={styles.badgeText}>{unreadNotificationsCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* User Profile Avatar */}
        {user ? (
          <TouchableOpacity style={styles.avatarButton} onPress={onProfilePress} activeOpacity={0.8}>
            <Image
              source={user.profilePicture ? { uri: user.profilePicture } : require('../../assets/fixbee_bee_logo.png')}
              style={styles.avatarImage}
            />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: Colors.bgCardElevated,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
    overflow: 'hidden',
  },
  logoImage: {
    width: '94%',
    height: '94%',
    borderRadius: 17,
  },
  titleColumn: {
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTitleFix: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  brandTitleBee: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.primary,
    letterSpacing: -0.4,
  },
  brandTagline: {
    fontSize: 9,
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 0.8,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bellButton: {
    padding: 6,
    position: 'relative',
  },
  badgeCount: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#0A0A0C',
  },
  avatarButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
});
