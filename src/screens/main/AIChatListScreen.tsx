import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Text } from '../../components/common/Text';
import { Card } from '../../components/common/Card';
import { getUserChatSessions, createChatSession, AIChatSession } from '../../services/ai.service';
import { formatDistanceToNow } from 'date-fns';

export const AIChatListScreen: React.FC = ({ route }: any) => {
    const theme = useAppTheme();
    const navigation = useNavigation<any>();
    const { chatType = 'LAW_COACH', targetScreen = 'LawCoach' } = route.params || {};
    const { user } = useAuth();
    const [sessions, setSessions] = useState<AIChatSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadSessions = useCallback(async () => {
        if (!user) return;
        try {
            const userSessions = await getUserChatSessions(user.uid, chatType);
            setSessions(userSessions);
        } catch (error) {
            console.error('Error loading chat sessions:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user]);

    useFocusEffect(
        useCallback(() => {
            loadSessions();
        }, [loadSessions])
    );

    const onRefresh = () => {
        setRefreshing(true);
        loadSessions();
    };

    const handleCreateSession = async () => {
        if (!user) return;
        try {
            setLoading(true);
            const title = chatType === 'LAW_COACH' ? 'New Consultation' : 'New Case Analysis';
            const sessionId = await createChatSession(user.uid, chatType, title);
            navigation.navigate(targetScreen, { sessionId });
        } catch (error) {
            console.error('Error creating chat session:', error);
            setLoading(false);
        }
    };

    const handleSessionPress = (sessionId: string) => {
        navigation.navigate(targetScreen, { sessionId });
    };

    const renderItem = ({ item }: { item: AIChatSession }) => (
        <TouchableOpacity onPress={() => handleSessionPress(item.id!)} activeOpacity={0.7}>
            <Card variant="elevated" style={styles.sessionCard}>
                <View style={styles.cardHeader}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="chatbubbles" size={24} color={theme.colors.brand.primary} />
                    </View>
                    <View style={styles.headerText}>
                        <Text variant="h4" numberOfLines={1} style={styles.title}>
                            {item.title}
                        </Text>
                        <Text variant="caption" color="secondary">
                            {item.updatedAt ? formatDistanceToNow(item.updatedAt.toDate(), { addSuffix: true }) : 'Just now'}
                        </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={theme.colors.text.tertiary} />
                </View>
                <Text variant="bodySmall" color="secondary" numberOfLines={2} style={styles.preview}>
                    {item.lastMessage || 'No messages yet'}
                </Text>
            </Card>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
            <View style={[styles.header, { backgroundColor: theme.colors.surface.primary }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
                </TouchableOpacity>
                <Text variant="h3">
                    {chatType === 'LAW_COACH' ? 'AI Law Coach' : 'AI Law Assistant'}
                </Text>
                <View style={{ width: 24 }} />
            </View>

            {loading && !refreshing ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.brand.primary} />
                </View>
            ) : (
                <FlatList
                    data={sessions}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id!}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="chatbubbles-outline" size={64} color={theme.colors.text.tertiary} />
                            <Text variant="h4" color="secondary" style={styles.emptyText}>
                                No conversations yet
                            </Text>
                            <Text variant="bodySmall" color="tertiary" style={styles.emptySubtext}>
                                Start a new chat to get legal advice
                            </Text>
                        </View>
                    }
                />
            )}

            <TouchableOpacity
                style={[styles.fab, { backgroundColor: theme.colors.brand.primary }]}
                onPress={handleCreateSession}
            >
                <Ionicons name="add" size={32} color="#FFFFFF" />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 60,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    backButton: {
        padding: 8,
    },
    listContent: {
        padding: 16,
        paddingBottom: 100,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sessionCard: {
        marginBottom: 12,
        padding: 16,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(212, 175, 55, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    headerText: {
        flex: 1,
    },
    title: {
        marginBottom: 2,
    },
    preview: {
        marginLeft: 52,
    },
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 6,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
    },
    emptyText: {
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtext: {
        textAlign: 'center',
    },
});
