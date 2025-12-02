/**
 * INSAF - Chat/Messages Screen
 *
 * View and manage conversations with lawyers
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../context/ThemeContext';
import { Text } from '../../components/common/Text';

// Sample Conversations Data
const CONVERSATIONS = [
  {
    id: '1',
    name: 'Adv. Ahmad Khan',
    avatar: null,
    lastMessage: 'I have reviewed your case documents. Let me share my thoughts...',
    time: '2 min ago',
    unread: 3,
    online: true,
    caseTitle: 'Property Dispute',
  },
  {
    id: '2',
    name: 'Adv. Sara Ali',
    avatar: null,
    lastMessage: 'The hearing has been scheduled for next Monday.',
    time: '1 hour ago',
    unread: 0,
    online: true,
    caseTitle: 'Family Custody',
  },
  {
    id: '3',
    name: 'Adv. Imran Shah',
    avatar: null,
    lastMessage: 'Please send me the updated contract draft.',
    time: '3 hours ago',
    unread: 1,
    online: false,
    caseTitle: 'Corporate Contract',
  },
  {
    id: '4',
    name: 'Adv. Fatima Zahra',
    avatar: null,
    lastMessage: 'Thank you for your prompt payment. Case closed successfully.',
    time: 'Yesterday',
    unread: 0,
    online: false,
    caseTitle: 'Land Transfer',
  },
  {
    id: '5',
    name: 'INSAF Support',
    avatar: null,
    lastMessage: 'Welcome to INSAF! How can we help you today?',
    time: '2 days ago',
    unread: 0,
    online: true,
    caseTitle: null,
  },
];

export const ChatScreen: React.FC = () => {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const [searchQuery, setSearchQuery] = useState('');

  // Animated values
  const headerAnim = useRef(new Animated.Value(0)).current;
  const searchAnim = useRef(new Animated.Value(0)).current;
  const filtersAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(100, [
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(searchAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(filtersAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const filteredConversations = CONVERSATIONS.filter(conv =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalUnread = CONVERSATIONS.reduce((sum, conv) => sum + conv.unread, 0);

  const renderConversation = ({ item, index }: { item: typeof CONVERSATIONS[0]; index: number }) => (
    <View>
      <TouchableOpacity
        style={[styles.conversationCard, { backgroundColor: theme.colors.surface.primary }]}
        onPress={() => navigation.navigate('ChatDetail', { conversationId: item.id })}
        activeOpacity={0.7}
      >
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <LinearGradient
            colors={item.name === 'INSAF Support' ? ['#d4af37', '#f4d03f'] : ['#1a365d', '#2d4a7c']}
            style={styles.avatar}
          >
            <Ionicons
              name={item.name === 'INSAF Support' ? 'headset' : 'person'}
              size={24}
              color={item.name === 'INSAF Support' ? '#1a365d' : '#d4af37'}
            />
          </LinearGradient>
          {item.online && <View style={styles.onlineIndicator} />}
        </View>

        {/* Content */}
        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text
              variant="labelLarge"
              color="primary"
              numberOfLines={1}
              style={styles.conversationName}
            >
              {item.name}
            </Text>
            <Text variant="caption" color="tertiary">{item.time}</Text>
          </View>

          {item.caseTitle && (
            <View style={styles.caseBadge}>
              <Ionicons name="briefcase-outline" size={10} color={theme.colors.brand.primary} />
              <Text variant="caption" color="brand" style={{ marginLeft: 4 }}>
                {item.caseTitle}
              </Text>
            </View>
          )}

          <View style={styles.messageRow}>
            <Text
              variant="bodySmall"
              color={item.unread > 0 ? 'primary' : 'secondary'}
              numberOfLines={1}
              style={[
                styles.lastMessage,
                item.unread > 0 && { fontWeight: '600' },
              ]}
            >
              {item.lastMessage}
            </Text>
            {item.unread > 0 && (
              <View style={styles.unreadBadge}>
                <Text variant="caption" style={styles.unreadText}>{item.unread}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      {/* Header */}
      <LinearGradient
        colors={theme.colors.gradient.primary as [string, string]}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <Animated.View
          style={[
            styles.headerContent,
            {
              opacity: headerAnim,
              transform: [{
                translateY: headerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              }],
            }
          ]}
        >
          <View>
            <Text variant="h2" style={styles.headerTitle}>Messages</Text>
            <Text variant="bodySmall" style={styles.headerSubtitle}>
              {totalUnread > 0 ? `${totalUnread} unread messages` : 'All caught up!'}
            </Text>
          </View>
          <TouchableOpacity style={styles.composeButton}>
            <Ionicons name="create-outline" size={24} color="#1a365d" />
          </TouchableOpacity>
        </Animated.View>

        {/* Search Bar */}
        <Animated.View
          style={[
            styles.searchBar,
            {
              backgroundColor: 'rgba(255,255,255,0.15)',
              opacity: searchAnim,
              transform: [{
                translateY: searchAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              }],
            }
          ]}
        >
          <Ionicons name="search" size={20} color="rgba(255,255,255,0.7)" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search conversations..."
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </Animated.View>
      </LinearGradient>

      {/* Quick Filters */}
      <Animated.View
        style={[
          styles.filtersRow,
          {
            opacity: filtersAnim,
            transform: [{
              translateY: filtersAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            }],
          }
        ]}
      >
        <TouchableOpacity style={[styles.filterChip, { backgroundColor: theme.colors.brand.primary }]}>
          <Text variant="labelSmall" style={{ color: '#FFFFFF' }}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.filterChip, { backgroundColor: theme.colors.surface.secondary }]}>
          <Text variant="labelSmall" color="secondary">Unread</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.filterChip, { backgroundColor: theme.colors.surface.secondary }]}>
          <Text variant="labelSmall" color="secondary">Lawyers</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.filterChip, { backgroundColor: theme.colors.surface.secondary }]}>
          <Text variant="labelSmall" color="secondary">Support</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Conversations List */}
      <FlatList
        data={filteredConversations}
        keyExtractor={(item) => item.id}
        renderItem={renderConversation}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={64} color={theme.colors.text.tertiary} />
            <Text variant="h4" color="secondary" style={styles.emptyTitle}>
              No conversations yet
            </Text>
            <Text variant="bodySmall" color="tertiary" style={styles.emptyText}>
              Start by finding a lawyer or creating a case
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
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  composeButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#d4af37',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#FFFFFF',
  },
  filtersRow: {
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
  conversationCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  conversationContent: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  conversationName: {
    flex: 1,
    marginRight: 8,
  },
  caseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  lastMessage: {
    flex: 1,
    marginRight: 8,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#d4af37',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: '#1a365d',
    fontSize: 11,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
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

export default ChatScreen;
