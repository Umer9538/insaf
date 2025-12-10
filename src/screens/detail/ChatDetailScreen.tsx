/**
 * INSAF - Chat Detail Screen
 *
 * Individual chat conversation with a lawyer
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../context/ThemeContext';
import { Text } from '../../components/common/Text';
import { useAuth } from '../../context/AuthContext';
import {
  subscribeToMessages,
  sendMessage as sendChatMessage,
  markMessagesAsRead,
  getConversation,
  Message,
  Conversation,
} from '../../services/chat.service';
import { format } from 'date-fns';

interface DisplayMessage {
  id: string;
  text: string;
  sender: 'user' | 'other';
  time: string;
  date: string;
  status?: string;
}

interface RouteParams {
  conversationId: string;
}

export const ChatDetailScreen: React.FC = () => {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const { conversationId } = (route.params as RouteParams) || {};
  const { user } = useAuth();

  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Get conversation details
  useEffect(() => {
    const fetchConversation = async () => {
      if (!conversationId) return;
      try {
        const conv = await getConversation(conversationId);
        setConversation(conv);
      } catch (error) {
        console.error('Error fetching conversation:', error);
      }
    };
    fetchConversation();
  }, [conversationId]);

  // Transform Firestore message to display format
  const transformMessage = useCallback((msg: Message): DisplayMessage => {
    const isCurrentUser = msg.senderId === user?.uid;

    let timeDisplay = '';
    let dateDisplay = '';
    if (msg.createdAt) {
      try {
        const date = msg.createdAt.toDate();
        timeDisplay = format(date, 'h:mm a');
        dateDisplay = format(date, 'MMM d, yyyy');
      } catch {
        timeDisplay = '';
        dateDisplay = '';
      }
    }

    return {
      id: msg.id,
      text: msg.text,
      sender: isCurrentUser ? 'user' : 'other',
      time: timeDisplay,
      date: dateDisplay,
      status: msg.status,
    };
  }, [user?.uid]);

  // Subscribe to messages
  useFocusEffect(
    useCallback(() => {
      if (!conversationId || !user?.uid) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const unsubscribe = subscribeToMessages(conversationId, (msgs) => {
        const displayMsgs = msgs.map(transformMessage);
        setMessages(displayMsgs);
        setIsLoading(false);
      });

      // Mark messages as read when opening the chat
      markMessagesAsRead(conversationId, user.uid).catch(console.error);

      return () => unsubscribe();
    }, [conversationId, user?.uid, transformMessage])
  );

  // Get other participant info for header
  const otherParticipant = conversation?.participants.find(p => p.userId !== user?.uid);
  const chatInfo = {
    name: otherParticipant?.userName || 'Chat',
    role: otherParticipant?.userRole || '',
    online: false, // TODO: Implement presence
    caseTitle: conversation?.caseId ? 'Case Discussion' : null,
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !conversationId || !user) return;

    const messageText = message.trim();
    setMessage('');
    setIsSending(true);

    try {
      await sendChatMessage(
        conversationId,
        user.uid,
        user.displayName || 'User',
        messageText,
        undefined, // attachments
        undefined, // avatar
        undefined  // replyTo
      );
      // Scroll to bottom after sending
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
      setMessage(messageText); // Restore the message
    } finally {
      setIsSending(false);
    }
  };

  const renderMessage = ({ item, index }: { item: DisplayMessage; index: number }) => {
    const isUser = item.sender === 'user';

    return (
      <View style={[styles.messageContainer, isUser && styles.userMessageContainer]}>
        {!isUser && (
          <View style={styles.lawyerAvatarSmall}>
            <Ionicons name="person" size={16} color="#d4af37" />
          </View>
        )}
        <View
          style={[
            styles.messageBubble,
            isUser
              ? { backgroundColor: theme.colors.brand.primary }
              : { backgroundColor: theme.colors.surface.secondary },
          ]}
        >
          <Text
            variant="bodyMedium"
            style={{ color: isUser ? '#FFFFFF' : theme.colors.text.primary }}
          >
            {item.text}
          </Text>
          <View style={styles.messageFooter}>
            <Text
              variant="caption"
              style={[
                styles.messageTime,
                { color: isUser ? 'rgba(255,255,255,0.7)' : theme.colors.text.tertiary },
              ]}
            >
              {item.time}
            </Text>
            {isUser && item.status && (
              <Ionicons
                name={item.status === 'read' ? 'checkmark-done' : 'checkmark'}
                size={14}
                color={isUser ? 'rgba(255,255,255,0.7)' : theme.colors.text.tertiary}
                style={{ marginLeft: 4 }}
              />
            )}
          </View>
        </View>
      </View>
    );
  };

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

          <View style={styles.headerInfo}>
            <View style={styles.headerRow}>
              <Text variant="labelLarge" style={styles.headerName}>
                {chatInfo.name}
              </Text>
              {chatInfo.online && (
                <View style={styles.onlineIndicator} />
              )}
            </View>
            <Text variant="caption" style={styles.headerSubtitle}>
              {chatInfo.caseTitle ? `${chatInfo.caseTitle} • ` : ''}{chatInfo.online ? 'Online' : 'Offline'}
            </Text>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerButton}>
              <Ionicons name="call" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton}>
              <Ionicons name="videocam" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* Messages */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.brand.primary} />
          <Text variant="bodySmall" color="secondary" style={{ marginTop: 16 }}>
            Loading messages...
          </Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={[
            styles.messagesContainer,
            messages.length === 0 && styles.emptyMessagesContainer,
          ]}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubble-outline" size={64} color={theme.colors.text.tertiary} />
              <Text variant="h4" color="secondary" style={{ marginTop: 16 }}>
                No messages yet
              </Text>
              <Text variant="bodySmall" color="tertiary" style={{ textAlign: 'center', marginTop: 8 }}>
                Start the conversation by sending a message
              </Text>
            </View>
          }
        />
      )}

      {/* Quick Actions */}
      <View style={[styles.quickActions, { backgroundColor: theme.colors.surface.primary }]}>
        <TouchableOpacity style={styles.quickAction}>
          <Ionicons name="document-attach" size={18} color={theme.colors.brand.primary} />
          <Text variant="caption" color="brand">Send Document</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickAction}>
          <Ionicons name="calendar" size={18} color={theme.colors.brand.primary} />
          <Text variant="caption" color="brand">Schedule Call</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickAction}>
          <Ionicons name="cash" size={18} color={theme.colors.brand.primary} />
          <Text variant="caption" color="brand">Make Payment</Text>
        </TouchableOpacity>
      </View>

      {/* Input Bar */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <View style={[styles.inputContainer, { paddingBottom: insets.bottom + 8, backgroundColor: theme.colors.surface.primary }]}>
          <TouchableOpacity style={styles.attachButton}>
            <Ionicons name="add-circle" size={28} color={theme.colors.brand.primary} />
          </TouchableOpacity>

          <View style={[styles.inputWrapper, { backgroundColor: theme.colors.background.secondary }]}>
            <TextInput
              style={[styles.input, { color: theme.colors.text.primary }]}
              placeholder="Type a message..."
              placeholderTextColor={theme.colors.text.tertiary}
              value={message}
              onChangeText={setMessage}
              multiline
              maxLength={500}
            />
            <TouchableOpacity>
              <Ionicons name="happy-outline" size={24} color={theme.colors.text.tertiary} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleSendMessage}
            disabled={isSending || !message.trim()}
          >
            <LinearGradient
              colors={['#d4af37', '#f4d03f']}
              style={[styles.sendButtonGradient, (isSending || !message.trim()) && { opacity: 0.5 }]}
            >
              {isSending ? (
                <ActivityIndicator size="small" color="#1a365d" />
              ) : (
                <Ionicons name="send" size={20} color="#1a365d" />
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    paddingHorizontal: 16,
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
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerName: {
    color: '#FFFFFF',
  },
  onlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginLeft: 8,
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messagesContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  emptyMessagesContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  lawyerAvatarSmall: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#1a365d',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    alignSelf: 'flex-end',
  },
  messageTime: {
    alignSelf: 'flex-end',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  quickAction: {
    alignItems: 'center',
    gap: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  attachButton: {
    marginRight: 8,
    marginBottom: 4,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 48,
    maxHeight: 120,
  },
  input: {
    flex: 1,
    fontSize: 16,
    marginRight: 8,
    maxHeight: 100,
  },
  sendButton: {
    marginLeft: 8,
    marginBottom: 4,
  },
  sendButtonGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ChatDetailScreen;
