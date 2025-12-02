/**
 * INSAF - Chat Detail Screen
 *
 * Individual chat conversation with a lawyer
 */

import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../context/ThemeContext';
import { Text } from '../../components/common/Text';

// Sample Messages Data
const MESSAGES = [
  {
    id: '1',
    text: 'Hello! I have reviewed your case documents.',
    sender: 'lawyer',
    time: '10:30 AM',
    date: 'Today',
  },
  {
    id: '2',
    text: 'Based on my initial assessment, you have a strong case for property ownership.',
    sender: 'lawyer',
    time: '10:31 AM',
    date: 'Today',
  },
  {
    id: '3',
    text: 'That sounds promising! What are the next steps?',
    sender: 'user',
    time: '10:35 AM',
    date: 'Today',
  },
  {
    id: '4',
    text: 'We need to gather additional evidence and file a petition in the civil court. I recommend scheduling a consultation to discuss the details.',
    sender: 'lawyer',
    time: '10:40 AM',
    date: 'Today',
  },
  {
    id: '5',
    text: 'How long will the entire process take?',
    sender: 'user',
    time: '10:42 AM',
    date: 'Today',
  },
  {
    id: '6',
    text: 'Property disputes typically take 6-12 months, depending on the complexity and court schedule. However, we can pursue an expedited hearing if needed.',
    sender: 'lawyer',
    time: '10:45 AM',
    date: 'Today',
  },
  {
    id: '7',
    text: 'I understand. Can we schedule a video consultation this week?',
    sender: 'user',
    time: '10:48 AM',
    date: 'Today',
  },
  {
    id: '8',
    text: 'Absolutely! I have availability on Thursday at 3 PM or Friday at 11 AM. Which works better for you?',
    sender: 'lawyer',
    time: '10:50 AM',
    date: 'Today',
  },
];

const LAWYER_INFO = {
  name: 'Adv. Ahmad Khan',
  specialty: 'Property Law',
  online: true,
  caseTitle: 'Property Dispute',
};

export const ChatDetailScreen: React.FC = () => {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [message, setMessage] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const sendMessage = () => {
    if (message.trim()) {
      // TODO: Send message logic
      setMessage('');
    }
  };

  const renderMessage = ({ item, index }: { item: typeof MESSAGES[0]; index: number }) => {
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
          <Text
            variant="caption"
            style={[
              styles.messageTime,
              { color: isUser ? 'rgba(255,255,255,0.7)' : theme.colors.text.tertiary },
            ]}
          >
            {item.time}
          </Text>
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
                {LAWYER_INFO.name}
              </Text>
              {LAWYER_INFO.online && (
                <View style={styles.onlineIndicator} />
              )}
            </View>
            <Text variant="caption" style={styles.headerSubtitle}>
              {LAWYER_INFO.caseTitle} • {LAWYER_INFO.online ? 'Online' : 'Offline'}
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
      <FlatList
        ref={flatListRef}
        data={MESSAGES}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
      />

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
            onPress={sendMessage}
          >
            <LinearGradient
              colors={['#d4af37', '#f4d03f']}
              style={styles.sendButtonGradient}
            >
              <Ionicons name="send" size={20} color="#1a365d" />
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
  messageTime: {
    marginTop: 6,
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
