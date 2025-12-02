/**
 * INSAF - Notifications Screen
 *
 * View all notifications
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../context/ThemeContext';
import { Text } from '../../components/common/Text';

// Sample Notifications Data
const NOTIFICATIONS = [
  {
    id: '1',
    type: 'bid',
    title: 'New Bid Received',
    message: 'Adv. Fatima Zahra has placed a bid on your Property Dispute case.',
    time: '5 min ago',
    read: false,
    icon: 'hand-left',
    color: '#2196F3',
  },
  {
    id: '2',
    type: 'message',
    title: 'New Message',
    message: 'Adv. Ahmad Khan sent you a message regarding your case.',
    time: '1 hour ago',
    read: false,
    icon: 'chatbubble',
    color: '#9C27B0',
  },
  {
    id: '3',
    type: 'case',
    title: 'Case Update',
    message: 'Your case #INS-2024-001 status has been updated to "In Progress".',
    time: '3 hours ago',
    read: false,
    icon: 'briefcase',
    color: '#4CAF50',
  },
  {
    id: '4',
    type: 'payment',
    title: 'Payment Successful',
    message: 'Rs. 10,000 has been released to Adv. Ahmad Khan for milestone completion.',
    time: '1 day ago',
    read: true,
    icon: 'cash',
    color: '#d4af37',
  },
  {
    id: '5',
    type: 'reminder',
    title: 'Hearing Reminder',
    message: 'Your court hearing is scheduled for tomorrow at 10:00 AM.',
    time: '1 day ago',
    read: true,
    icon: 'calendar',
    color: '#FF9800',
  },
  {
    id: '6',
    type: 'bid',
    title: 'Bid Accepted',
    message: 'You accepted the bid from Adv. Imran Shah for your Corporate Contract case.',
    time: '2 days ago',
    read: true,
    icon: 'checkmark-circle',
    color: '#4CAF50',
  },
  {
    id: '7',
    type: 'system',
    title: 'Welcome to INSAF!',
    message: 'Your account has been verified. Start exploring legal services now.',
    time: '1 week ago',
    read: true,
    icon: 'shield-checkmark',
    color: '#1a365d',
  },
];

export const NotificationsScreen: React.FC = () => {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState(NOTIFICATIONS);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const renderNotification = ({ item, index }: { item: typeof NOTIFICATIONS[0]; index: number }) => (
    <View>
      <TouchableOpacity
        style={[
          styles.notificationCard,
          {
            backgroundColor: item.read ? theme.colors.surface.primary : `${theme.colors.brand.primary}08`,
            borderLeftColor: item.read ? 'transparent' : item.color,
            borderLeftWidth: item.read ? 0 : 3,
          },
        ]}
        onPress={() => markAsRead(item.id)}
        activeOpacity={0.7}
      >
        <View style={[styles.iconContainer, { backgroundColor: `${item.color}15` }]}>
          <Ionicons name={item.icon as any} size={22} color={item.color} />
        </View>
        <View style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <Text
              variant="labelMedium"
              color="primary"
              style={!item.read && { fontWeight: '700' }}
            >
              {item.title}
            </Text>
            <Text variant="caption" color="tertiary">{item.time}</Text>
          </View>
          <Text variant="bodySmall" color="secondary" numberOfLines={2} style={styles.notificationMessage}>
            {item.message}
          </Text>
        </View>
        {!item.read && <View style={[styles.unreadDot, { backgroundColor: item.color }]} />}
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      {/* Header */}
      <LinearGradient
        colors={theme.colors.gradient.primary as [string, string]}
        style={[styles.header, { paddingTop: insets.top }]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text variant="h3" style={styles.headerTitle}>Notifications</Text>
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text variant="caption" style={styles.unreadText}>{unreadCount}</Text>
              </View>
            )}
          </View>
          {unreadCount > 0 && (
            <TouchableOpacity onPress={markAllAsRead}>
              <Text variant="labelSmall" style={styles.markAllText}>Mark all read</Text>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <TouchableOpacity style={[styles.filterChip, { backgroundColor: theme.colors.brand.primary }]}>
          <Text variant="labelSmall" style={{ color: '#FFFFFF' }}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.filterChip, { backgroundColor: theme.colors.surface.secondary }]}>
          <Text variant="labelSmall" color="secondary">Bids</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.filterChip, { backgroundColor: theme.colors.surface.secondary }]}>
          <Text variant="labelSmall" color="secondary">Messages</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.filterChip, { backgroundColor: theme.colors.surface.secondary }]}>
          <Text variant="labelSmall" color="secondary">Cases</Text>
        </TouchableOpacity>
      </View>

      {/* Notifications List */}
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderNotification}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={64} color={theme.colors.text.tertiary} />
            <Text variant="h4" color="secondary" style={styles.emptyTitle}>
              No notifications
            </Text>
            <Text variant="bodySmall" color="tertiary" style={styles.emptyText}>
              You're all caught up! Check back later for updates.
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
  },
  headerTitle: {
    color: '#FFFFFF',
  },
  unreadBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  unreadText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  markAllText: {
    color: 'rgba(255,255,255,0.8)',
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 10,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationContent: {
    flex: 1,
    marginLeft: 12,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  notificationMessage: {
    marginTop: 4,
    lineHeight: 18,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    marginTop: 16,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 8,
  },
});

export default NotificationsScreen;
