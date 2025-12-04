/**
 * INSAF - Law Assistant Screen (AI Chatbot for Lawyers)
 * 
 * Helps lawyers with case analysis, legal research, and strategic recommendations
 */

import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import {
    sendAIMessage,
    getAIChatHistory,
    subscribeToAIChat,
    AIMessage,
    generateCaseSummary,
} from '../../services/ai.service';
import { COLORS } from '../../theme/colorConstants';
import { TYPOGRAPHY } from '../../theme/typographyConstants';
import { spacing } from '../../theme/spacing';

const colors = COLORS;
const typography = TYPOGRAPHY;

export const LawAssistantScreen = ({ navigation, route }: any) => {
    const { user } = useAuth();
    const { sessionId } = route.params || {};
    const [messages, setMessages] = useState<AIMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const flatListRef = useRef<FlatList>(null);

    // Optional: Pre-load case context if passed from case detail screen
    const caseContext = route?.params?.caseContext;

    // Load chat history on mount
    useEffect(() => {
        if (!user) return;

        const loadHistory = async () => {
            try {
                const history = await getAIChatHistory(user.uid, 'LAW_ASSISTANT', 50, sessionId);
                setMessages(history);

                // If no history, send welcome message
                if (history.length === 0) {
                    const welcomeMessage: AIMessage = {
                        userId: 'system',
                        chatType: 'LAW_ASSISTANT',
                        role: 'assistant',
                        content: `Welcome, Advocate! 👨‍⚖️\n\nI'm your AI Law Assistant, here to help you with:\n\n• Case analysis and summarization\n• Legal research and precedents\n• Document review\n• Strategic recommendations\n• Deadline tracking\n• Risk assessment\n\nHow can I assist you with your legal work today?`,
                        timestamp: new Date(),
                    };
                    setMessages([welcomeMessage]);
                }

                // If case context provided, analyze it
                if (caseContext) {
                    handleAnalyzeCase(caseContext);
                }
            } catch (error) {
                console.error('Error loading chat history:', error);
            } finally {
                setIsInitialLoading(false);
            }
        };

        loadHistory();

        // Subscribe to real-time updates
        const unsubscribe = subscribeToAIChat(user.uid, 'LAW_ASSISTANT', (updatedMessages) => {
            setMessages(updatedMessages);
        }, sessionId);

        return () => unsubscribe();
    }, [user]);

    // Scroll to bottom when new messages arrive
    useEffect(() => {
        if (messages.length > 0) {
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    }, [messages]);

    const handleAnalyzeCase = async (caseDetails: string) => {
        setIsLoading(true);
        try {
            const summary = await generateCaseSummary(caseDetails);
            // Summary will be added via real-time subscription
        } catch (error: any) {
            Alert.alert('Error', 'Failed to analyze case');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendMessage = async () => {
        if (!inputText.trim() || !user) return;

        const userMessage = inputText.trim();
        setInputText('');
        setIsLoading(true);

        try {
            // Add user message to UI immediately
            const tempUserMessage: AIMessage = {
                userId: user.uid,
                chatType: 'LAW_ASSISTANT',
                role: 'user',
                content: userMessage,
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, tempUserMessage]);

            // Get conversation history (last 10 messages for context)
            const conversationHistory = messages.slice(-10);

            // Send to AI and get response
            await sendAIMessage(
                user.uid,
                'LAW_ASSISTANT',
                userMessage,
                conversationHistory,
                sessionId
            );

            // AI response will be added via real-time subscription
        } catch (error: any) {
            console.error('Error sending message:', error);
            Alert.alert(
                'Error',
                error.message || 'Failed to send message. Please check your API configuration.'
            );
            // Remove the temporary user message on error
            setMessages((prev) => prev.slice(0, -1));
        } finally {
            setIsLoading(false);
        }
    };

    const renderMessage = ({ item }: { item: AIMessage }) => {
        const isUser = item.role === 'user';

        return (
            <View
                style={[
                    styles.messageContainer,
                    isUser ? styles.userMessageContainer : styles.aiMessageContainer,
                ]}
            >
                {!isUser && (
                    <View style={styles.aiAvatar}>
                        <Ionicons name="briefcase" size={20} color={colors.primary[500]} />
                    </View>
                )}
                <View
                    style={[
                        styles.messageBubble,
                        isUser ? styles.userBubble : styles.aiBubble,
                    ]}
                >
                    <Text
                        style={[
                            styles.messageText,
                            isUser ? styles.userMessageText : styles.aiMessageText,
                        ]}
                    >
                        {item.content}
                    </Text>
                    {item.metadata?.suggestedActions && (
                        <View style={styles.actionsContainer}>
                            <Text style={styles.actionsTitle}>Suggested Actions:</Text>
                            {item.metadata.suggestedActions.map((action, index) => (
                                <Text key={index} style={styles.actionItem}>
                                    • {action}
                                </Text>
                            ))}
                        </View>
                    )}
                </View>
                {isUser && (
                    <View style={styles.userAvatar}>
                        <Ionicons name="person" size={20} color={colors.white} />
                    </View>
                )}
            </View>
        );
    };

    const renderQuickActions = () => (
        <View style={styles.quickActionsContainer}>
            <Text style={styles.quickActionsTitle}>Quick Actions:</Text>
            <View style={styles.quickActionsButtons}>
                <TouchableOpacity
                    style={styles.quickActionButton}
                    onPress={() => setInputText('Summarize the key points of this case for me')}
                >
                    <Ionicons name="document-text-outline" size={18} color={colors.primary[700]} />
                    <Text style={styles.quickActionText}>Summarize Case</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.quickActionButton}
                    onPress={() => setInputText('What are the relevant legal precedents for this case?')}
                >
                    <Ionicons name="book-outline" size={18} color={colors.primary[700]} />
                    <Text style={styles.quickActionText}>Find Precedents</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.quickActionButton}
                    onPress={() => setInputText('What are the potential risks in this case?')}
                >
                    <Ionicons name="alert-circle-outline" size={18} color={colors.primary[700]} />
                    <Text style={styles.quickActionText}>Risk Assessment</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.quickActionButton}
                    onPress={() => setInputText('Suggest a legal strategy for this case')}
                >
                    <Ionicons name="bulb-outline" size={18} color={colors.primary[700]} />
                    <Text style={styles.quickActionText}>Legal Strategy</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    if (isInitialLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary[500]} />
                    <Text style={styles.loadingText}>Loading Law Assistant...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={colors.gray[900]} />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>AI Law Assistant</Text>
                    <Text style={styles.headerSubtitle}>Professional Legal Support</Text>
                </View>
                <TouchableOpacity onPress={() => Alert.alert('Info', 'AI Law Assistant helps you with case analysis, legal research, and strategic recommendations.')}>
                    <Ionicons name="information-circle-outline" size={24} color={colors.gray[600]} />
                </TouchableOpacity>
            </View>

            {/* Messages List */}
            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item, index) => item.id || `msg-${index}`}
                contentContainerStyle={styles.messagesList}
                ListFooterComponent={
                    isLoading ? (
                        <View style={styles.typingIndicator}>
                            <ActivityIndicator size="small" color={colors.primary[500]} />
                            <Text style={styles.typingText}>Analyzing...</Text>
                        </View>
                    ) : null
                }
            />

            {/* Quick Actions (show when no messages) */}
            {messages.length <= 1 && renderQuickActions()}

            {/* Input Area */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Ask for case analysis, legal research, or strategy..."
                        placeholderTextColor={colors.gray[400]}
                        value={inputText}
                        onChangeText={setInputText}
                        multiline
                        maxLength={1000}
                        editable={!isLoading}
                    />
                    <TouchableOpacity
                        style={[
                            styles.sendButton,
                            (!inputText.trim() || isLoading) && styles.sendButtonDisabled,
                        ]}
                        onPress={handleSendMessage}
                        disabled={!inputText.trim() || isLoading}
                    >
                        <Ionicons
                            name="send"
                            size={20}
                            color={inputText.trim() && !isLoading ? colors.white : colors.gray[400]}
                        />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.white,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        ...typography.body.medium,
        color: colors.gray[600],
        marginTop: spacing.md,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.gray[200],
        backgroundColor: colors.white,
    },
    headerContent: {
        flex: 1,
        marginLeft: spacing.md,
    },
    headerTitle: {
        ...typography.h3,
        color: colors.gray[900],
    },
    headerSubtitle: {
        ...typography.caption,
        color: colors.gray[600],
    },
    messagesList: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
    },
    messageContainer: {
        flexDirection: 'row',
        marginBottom: spacing.md,
        alignItems: 'flex-end',
    },
    userMessageContainer: {
        justifyContent: 'flex-end',
    },
    aiMessageContainer: {
        justifyContent: 'flex-start',
    },
    messageBubble: {
        maxWidth: '75%',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: 16,
    },
    userBubble: {
        backgroundColor: colors.primary[500],
        borderBottomRightRadius: 4,
    },
    aiBubble: {
        backgroundColor: colors.gray[100],
        borderBottomLeftRadius: 4,
    },
    messageText: {
        ...typography.body.medium,
    },
    userMessageText: {
        color: colors.white,
    },
    aiMessageText: {
        color: colors.gray[900],
    },
    aiAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.primary[50],
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.sm,
    },
    userAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.primary[500],
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: spacing.sm,
    },
    actionsContainer: {
        marginTop: spacing.sm,
        paddingTop: spacing.sm,
        borderTopWidth: 1,
        borderTopColor: colors.gray[200],
    },
    actionsTitle: {
        ...typography.caption.semibold,
        color: colors.gray[700],
        marginBottom: spacing.xs,
    },
    actionItem: {
        ...typography.caption,
        color: colors.gray[600],
        marginBottom: spacing.xs,
    },
    typingIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.sm,
    },
    typingText: {
        ...typography.caption,
        color: colors.gray[600],
        marginLeft: spacing.sm,
    },
    quickActionsContainer: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
    },
    quickActionsTitle: {
        ...typography.body.semibold,
        color: colors.gray[700],
        marginBottom: spacing.sm,
    },
    quickActionsButtons: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
    },
    quickActionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        backgroundColor: colors.primary[50],
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.primary[200],
        gap: spacing.xs,
    },
    quickActionText: {
        ...typography.body.medium,
        color: colors.primary[700],
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.gray[200],
        backgroundColor: colors.white,
    },
    input: {
        flex: 1,
        ...typography.body.medium,
        color: colors.gray[900],
        backgroundColor: colors.gray[50],
        borderRadius: 20,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        maxHeight: 100,
        marginRight: spacing.sm,
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.primary[500],
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        backgroundColor: colors.gray[200],
    },
});
