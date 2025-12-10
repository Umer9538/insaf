/**
 * INSAF - Chat/Messages Screen
 *
 * View and manage conversations with lawyers
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Animated,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../context/ThemeContext';
import { Text } from '../../components/common/Text';
import { useAuth } from '../../context/AuthContext';
import {
  subscribeToConversations,
  Conversation,
} from '../../services/chat.service';
import { formatDistanceToNow } from 'date-fns';

type FilterType = 'all' | 'unread' | 'lawyers' | 'support';

interface DisplayConversation {
  id: string;
  name: string;
  avatar: string | null;
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
  caseTitle: string | null;
  otherParticipantRole: 'client' | 'lawyer' | 'corporate' | null;
  conversationType: 'direct' | 'group' | 'case';
  isSupport: boolean;
}

export const ChatScreen: React.FC = () => {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [conversations, setConversations] = useState<DisplayConversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  // Animated values
  const headerAnim = useRef(new Animated.Value(0)).current;
  const searchAnim = useRef(new Animated.Value(0)).current;
  const filtersAnim = useRef(new Animated.Value(0)).current;

  // Transform Firestore conversation to display format
  const transformConversation = useCallback((conv: Conversation): DisplayConversation => {
    // Find the other participant (not the current user)
    const otherParticipant = conv.participants.find(p => p.userId !== user?.uid);
    const currentUserParticipant = conv.participants.find(p => p.userId === user?.uid);

    // Format the time
    let timeDisplay = '';
    if (conv.lastMessage?.createdAt) {
      try {
        const date = conv.lastMessage.createdAt.toDate();
        timeDisplay = formatDistanceToNow(date, { addSuffix: true });
      } catch {
        timeDisplay = '';
      }
    }

    // Check if this is a support conversation
    const isSupport = otherParticipant?.userName?.toLowerCase().includes('support') ||
                      conv.title?.toLowerCase().includes('support') ||
                      otherParticipant?.userName === 'INSAF Support';

    return {
      id: conv.id,
      name: otherParticipant?.userName || conv.title || 'Unknown',
      avatar: otherParticipant?.userAvatar || null,
      lastMessage: conv.lastMessage?.text || 'No messages yet',
      time: timeDisplay,
      unread: currentUserParticipant?.unreadCount || 0,
      online: false, // TODO: Implement presence system
      caseTitle: conv.caseId ? 'Case Discussion' : null,
      otherParticipantRole: otherParticipant?.userRole || null,
      conversationType: conv.type,
      isSupport,
    };
  }, [user?.uid]);

  // Subscribe to conversations
  useFocusEffect(
    useCallback(() => {
      if (!user?.uid) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const unsubscribe = subscribeToConversations(user.uid, (convs) => {
        const displayConvs = convs.map(transformConversation);
        setConversations(displayConvs);
        setIsLoading(false);
      });

      return () => unsubscribe();
    }, [user?.uid, transformConversation])
  );

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

  // Apply filters
  const filteredConversations = conversations.filter(conv => {
    // Apply search filter first
    const matchesSearch = searchQuery === '' ||
      conv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    // Apply category filter
    switch (activeFilter) {
      case 'unread':
        return conv.unread > 0;
      case 'lawyers':
        return conv.otherParticipantRole === 'lawyer' && !conv.isSupport;
      case 'support':
        return conv.isSupport;
      case 'all':
      default:
        return true;
    }
  });

  // Handle compose button press
  const handleCompose = () => {
    Alert.alert(
      'New Conversation',
      'Who would you like to message?',
      [
        {
          text: 'Find a Lawyer',
          onPress: () => navigation.navigate('LawyersTab'),
        },
        {
          text: 'Contact Support',
          onPress: () => {
            // Could create a support conversation here
            Alert.alert('Support', 'Support chat will be available soon.');
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const totalUnread = conversations.reduce((sum, conv) => sum + conv.unread, 0);

  const renderConversation = ({ item, index }: { item: DisplayConversation; index: number }) => (
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
          <TouchableOpacity style={styles.composeButton} onPress={handleCompose}>
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
        {([
          { key: 'all', label: 'All' },
          { key: 'unread', label: 'Unread' },
          { key: 'lawyers', label: 'Lawyers' },
          { key: 'support', label: 'Support' },
        ] as { key: FilterType; label: string }[]).map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterChip,
              {
                backgroundColor: activeFilter === filter.key
                  ? theme.colors.brand.primary
                  : theme.colors.surface.secondary,
              },
            ]}
            onPress={() => setActiveFilter(filter.key)}
          >
            <Text
              variant="labelSmall"
              style={{
                color: activeFilter === filter.key ? '#FFFFFF' : theme.colors.text.secondary,
              }}
            >
              {filter.label}
              {filter.key === 'unread' && totalUnread > 0 && ` (${totalUnread})`}
            </Text>
          </TouchableOpacity>
        ))}
      </Animated.View>

      {/* Conversations List */}
      <FlatList
        data={filteredConversations}
        keyExtractor={(item) => item.id}
        renderItem={renderConversation}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.emptyContainer}>
              <ActivityIndicator size="large" color={theme.colors.brand.primary} />
              <Text variant="bodySmall" color="secondary" style={{ marginTop: 16 }}>
                Loading conversations...
              </Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons
                name={activeFilter === 'unread' ? 'checkmark-done-outline' : 'chatbubbles-outline'}
                size={64}
                color={theme.colors.text.tertiary}
              />
              <Text variant="h4" color="secondary" style={styles.emptyTitle}>
                {activeFilter === 'all' && 'No conversations yet'}
                {activeFilter === 'unread' && 'All caught up!'}
                {activeFilter === 'lawyers' && 'No lawyer conversations'}
                {activeFilter === 'support' && 'No support conversations'}
              </Text>
              <Text variant="bodySmall" color="tertiary" style={styles.emptyText}>
                {activeFilter === 'all' && 'Start by finding a lawyer or creating a case'}
                {activeFilter === 'unread' && 'You have no unread messages'}
                {activeFilter === 'lawyers' && 'Find a lawyer to start a conversation'}
                {activeFilter === 'support' && 'Contact support if you need help'}
              </Text>
              {activeFilter === 'all' && (
                <TouchableOpacity
                  style={[styles.emptyButton, { backgroundColor: theme.colors.brand.primary }]}
                  onPress={() => navigation.navigate('LawyersTab')}
                >
                  <Text variant="labelMedium" style={{ color: '#FFFFFF' }}>Find a Lawyer</Text>
                </TouchableOpacity>
              )}
            </View>
          )
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
  emptyButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
});

export default ChatScreen;
