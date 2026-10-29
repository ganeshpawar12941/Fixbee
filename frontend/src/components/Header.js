import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { useComplaints } from '../context/ComplaintsContext';

export default function Header({ onProfilePress, onIntroPress }) {
  const { user } = useAuth();
  const { backendStatus } = useComplaints();

  return (
    <View style={styles.headerContainer}>
      <View style={styles.leftSection}>
        <TouchableOpacity style={styles.logoRow} onPress={onIntroPress} activeOpacity={0.8}>
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
            <Text style={styles.brandTagline}>buzz it  fix it</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.rightSection}>
        {/* Backend Connectivity Badge */}
        <View style={[styles.apiBadge, backendStatus === 'online' ? styles.apiOnline : styles.apiSync]}>
          <View style={[styles.statusDot, backendStatus === 'online' ? styles.dotGreen : styles.dotAmber]} />
          <Text style={styles.apiText}>
            {backendStatus === 'online' ? 'API Online' : 'Local Sync'}
          </Text>
        </View>

        {/* User Profile Avatar */}
        {user ? (
          <TouchableOpacity style={styles.avatarButton} onPress={onProfilePress} activeOpacity={0.8}>
            <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
            <View style={styles.onlineBadge}>
              <Ionicons name="shield-checkmark" size={10} color="#0B0F19" />
            </View>
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
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: Colors.bgDark,
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
  },
  logoCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: Colors.primary,
    marginRight: 10,
    backgroundColor: Colors.bgCard,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  titleColumn: {
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTitleFix: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  brandTitleBee: {
    fontSize: 22,
    fontWeight: '900',
    color: '#F5A623',
    letterSpacing: -0.5,
  },
  brandTagline: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textSecondary,
    letterSpacing: 2.2,
    textTransform: 'lowercase',
    marginTop: 1,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  apiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  apiOnline: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  apiSync: {
    backgroundColor: 'rgba(255, 184, 0, 0.12)',
    borderColor: 'rgba(255, 184, 0, 0.3)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  dotGreen: {
    backgroundColor: Colors.accentSuccess,
  },
  dotAmber: {
    backgroundColor: Colors.primary,
  },
  apiText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  avatarButton: {
    position: 'relative',
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    overflow: 'visible',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
  onlineBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: Colors.primary,
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.bgDark,
  },
});
