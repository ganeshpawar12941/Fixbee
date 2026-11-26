import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { useComplaints } from '../context/ComplaintsContext';

export default function NotificationsModal({ visible, onClose, onSelectComplaint }) {
  const {
    notifications,
    unreadNotificationsCount,
    markNotificationRead,
    markAllNotificationsRead,
    complaints,
  } = useComplaints();

  const getNotifIcon = (type) => {
    switch (type) {
      case 'complaint_status_updated':
        return { name: 'sync-circle', color: '#38BDF8' };
      case 'complaint_resolved':
        return { name: 'checkmark-circle', color: '#22C55E' };
      case 'complaint_rejected':
        return { name: 'close-circle', color: '#EF4444' };
      case 'additional_info_requested':
        return { name: 'chatbubbles', color: Colors.primary };
      case 'invalid_image_warning':
        return { name: 'warning', color: '#F59E0B' };
      default:
        return { name: 'notifications', color: Colors.primary };
    }
  };

  const handleNotificationPress = (notif) => {
    markNotificationRead(notif._id || notif.id);
    if (notif.relatedComplaint && onSelectComplaint) {
      const target = complaints.find(
        (c) => (c._id || c.id) === notif.relatedComplaint
      );
      if (target) {
        onClose();
        onSelectComplaint(target);
      }
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header Bar */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.headerTitleCol}>
            <Text style={styles.headerTitle}>Campus Alerts & Updates</Text>
            <Text style={styles.headerSub}>
              {unreadNotificationsCount} unread notifications
            </Text>
          </View>

          {unreadNotificationsCount > 0 && (
            <TouchableOpacity onPress={markAllNotificationsRead} style={styles.markAllBtn}>
              <Text style={styles.markAllText}>Read All</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Notifications List */}
        <ScrollView style={styles.scrollList} contentContainerStyle={styles.scrollContent}>
          {notifications && notifications.length > 0 ? (
            notifications.map((notif) => {
              const iconInfo = getNotifIcon(notif.type);
              return (
                <TouchableOpacity
                  key={notif._id || notif.id}
                  style={[styles.notifCard, !notif.isRead && styles.notifCardUnread]}
                  onPress={() => handleNotificationPress(notif)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.iconCircle, { backgroundColor: `${iconInfo.color}20` }]}>
                    <Ionicons name={iconInfo.name} size={18} color={iconInfo.color} />
                  </View>

                  <View style={styles.notifBody}>
                    <View style={styles.notifTitleRow}>
                      <Text style={[styles.notifTitle, !notif.isRead && styles.notifTitleUnread]}>
                        {notif.title}
                      </Text>
                      {!notif.isRead && <View style={styles.unreadDot} />}
                    </View>

                    <Text style={styles.notifMessage}>{notif.message}</Text>

                    <Text style={styles.notifTime}>
                      {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(notif.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="notifications-off-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>All Caught Up</Text>
              <Text style={styles.emptySub}>No campus alerts or notifications at this time.</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgDark,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.bgCardElevated,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  closeBtn: {
    padding: 4,
  },
  headerTitleCol: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  headerSub: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },
  markAllBtn: {
    backgroundColor: '#1E1E28',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A2A38',
  },
  markAllText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  scrollList: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 10,
  },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    padding: 12,
    gap: 12,
  },
  notifCardUnread: {
    backgroundColor: '#181822',
    borderColor: 'rgba(255, 193, 7, 0.4)',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBody: {
    flex: 1,
  },
  notifTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  notifTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    flex: 1,
  },
  notifTitleUnread: {
    color: Colors.textPrimary,
    fontWeight: '900',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginLeft: 6,
  },
  notifMessage: {
    fontSize: 12,
    color: '#D4D4D8',
    lineHeight: 17,
    marginBottom: 6,
  },
  notifTime: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  emptySub: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});
