import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { useComplaints } from '../context/ComplaintsContext';

export default function Header({ onProfilePress, onNotificationsPress }) {
  const { user, switchRole } = useAuth();
  const { backendStatus, unreadNotificationsCount } = useComplaints();

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'warden':
        return 'Warden';
      case 'infrastructure_dean':
        return 'Dean Infra';
      case 'admin':
        return 'Admin';
      default:
        return 'Student';
    }
  };

  const getRoleColor = (_role) => {
    return Colors.primary;
  };

  const cycleRole = () => {
    const roles = ['student', 'warden', 'infrastructure_dean', 'admin'];
    const currentIdx = roles.indexOf(user?.role || 'student');
    const nextRole = roles[(currentIdx + 1) % roles.length];
    switchRole(nextRole);
  };

  return (
    <View style={styles.headerContainer}>
      {/* Left: Brand Identity */}
      <View style={styles.leftSection}>
        <View style={styles.logoRow}>
          <View style={styles.logoCircle}>
            <Image
              source={require('../../assets/fixbee_logo.jpg')}
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

      {/* Right: Status Pill, Role Chip, Notifications, Profile */}
      <View style={styles.rightSection}>
        {/* Backend Online / Local Status */}
        <View style={[styles.apiBadge, backendStatus === 'online' ? styles.apiOnline : styles.apiOffline]}>
          <View style={[styles.statusDot, backendStatus === 'online' ? styles.dotGreen : styles.dotYellow]} />
          <Text style={styles.apiText}>
            {backendStatus === 'online' ? 'Live' : 'Sync'}
          </Text>
        </View>

        {/* Quick Role Cycle Chip */}
        <TouchableOpacity
          style={[styles.roleChip, { borderColor: `${getRoleColor(user?.role)}50` }]}
          onPress={cycleRole}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <View style={[styles.roleDot, { backgroundColor: getRoleColor(user?.role) }]} />
          <Text style={[styles.roleText, { color: getRoleColor(user?.role) }]}>
            {getRoleDisplayName(user?.role)}
          </Text>
        </TouchableOpacity>

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
              source={{ uri: user.profilePicture || user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150' }}
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
  apiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  apiOnline: {
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  apiOffline: {
    backgroundColor: 'rgba(255, 193, 7, 0.12)',
    borderColor: 'rgba(255, 193, 7, 0.3)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  dotGreen: {
    backgroundColor: '#22C55E',
  },
  dotYellow: {
    backgroundColor: Colors.primary,
  },
  apiText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16161E',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  roleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '800',
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
