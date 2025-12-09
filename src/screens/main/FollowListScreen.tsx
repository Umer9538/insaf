/**
 * INSAF - Follow List Screen
 * 
 * Displays list of followers and following users
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../context/ThemeContext';
import { Text } from '../../components/common/Text';
import { Follow, getFollowers, getFollowing } from '../../services/follow.service';
import { getLawyerProfile } from '../../services/lawyer.service';
import { getUserProfile } from '../../services/auth.service';

interface UserListItem {
    id: string; // userId
    name: string;
    role: string;
    image?: string;
    details?: string;
}

export const FollowListScreen: React.FC = () => {
    const theme = useAppTheme();
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();
    const route = useRoute<any>();

    const { userId, initialTab = 'followers', userName } = route.params || {};

    const [activeTab, setActiveTab] = useState<'followers' | 'following'>(initialTab);
    const [data, setData] = useState<UserListItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [activeTab, userId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            let follows: Follow[] = [];
            if (activeTab === 'followers') {
                follows = await getFollowers(userId);
            } else {
                follows = await getFollowing(userId);
            }

            // Enhance with user details
            const enhancedData = await Promise.all(
                follows.map(async (follow) => {
                    const targetId = activeTab === 'followers' ? follow.followerId : follow.followingId;

                    // Try fetching lawyer profile first (since most followed are lawyers)
                    const lawyerProfile = await getLawyerProfile(targetId);
                    if (lawyerProfile) {
                        return {
                            id: targetId,
                            name: lawyerProfile.fullName,
                            role: 'Lawyer',
                            details: lawyerProfile.specializations[0]?.replace('_', ' '),
                            image: lawyerProfile.profileImage
                        };
                    }

                    // Fallback to user profile
                    const userProfile = await getUserProfile(targetId);
                    return {
                        id: targetId,
                        name: userProfile?.displayName || 'Unknown User',
                        role: userProfile?.role || 'User',
                        details: userProfile?.email
                    };
                })
            );

            setData(enhancedData);
        } catch (error) {
            console.error('Error fetching follow list:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }: { item: UserListItem }) => (
        <TouchableOpacity
            style={[styles.userCard, { backgroundColor: theme.colors.surface.primary }]}
            onPress={() => {
                if (item.role === 'LAWYER' || item.role === 'Lawyer') {
                    navigation.push('LawyerDetail', { lawyerId: item.id });
                }
            }}
            disabled={item.role !== 'LAWYER' && item.role !== 'Lawyer'}
            activeOpacity={0.7}
        >
            <View style={styles.avatarContainer}>
                <View style={[styles.avatar, { backgroundColor: theme.colors.surface.secondary }]}>
                    <Ionicons name="person" size={24} color={theme.colors.text.secondary} />
                </View>
            </View>

            <View style={styles.userInfo}>
                <Text variant="labelLarge" color="primary">{item.name}</Text>
                <Text variant="bodySmall" color="secondary">{item.details}</Text>
            </View>

            {(item.role === 'LAWYER' || item.role === 'Lawyer') && (
                <Ionicons name="chevron-forward" size={20} color={theme.colors.text.tertiary} />
            )}
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top }]}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                >
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
                </TouchableOpacity>
                <Text variant="h3" color="primary" style={styles.headerTitle}>
                    {userName || 'User'}
                </Text>
            </View>

            {/* Tabs */}
            <View style={styles.tabsContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'followers' && styles.activeTab]}
                    onPress={() => setActiveTab('followers')}
                >
                    <Text
                        variant="labelLarge"
                        style={{
                            color: activeTab === 'followers' ? theme.colors.brand.primary : theme.colors.text.secondary
                        }}
                    >
                        Followers
                    </Text>
                    {activeTab === 'followers' && (
                        <View style={[styles.activeIndicator, { backgroundColor: theme.colors.brand.primary }]} />
                    )}
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'following' && styles.activeTab]}
                    onPress={() => setActiveTab('following')}
                >
                    <Text
                        variant="labelLarge"
                        style={{
                            color: activeTab === 'following' ? theme.colors.brand.primary : theme.colors.text.secondary
                        }}
                    >
                        Following
                    </Text>
                    {activeTab === 'following' && (
                        <View style={[styles.activeIndicator, { backgroundColor: theme.colors.brand.primary }]} />
                    )}
                </TouchableOpacity>
            </View>

            {/* List */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.brand.primary} />
                </View>
            ) : (
                <FlatList
                    data={data}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContainer}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="people-outline" size={48} color={theme.colors.text.tertiary} />
                            <Text variant="bodyMedium" color="secondary" style={styles.emptyText}>
                                No {activeTab} yet
                            </Text>
                        </View>
                    }
                />
            )}
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
        paddingHorizontal: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    backButton: {
        padding: 8,
        marginRight: 8,
    },
    headerTitle: {
        flex: 1,
    },
    tabsContainer: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 16,
    },
    activeTab: {
        // Style for active container if needed
    },
    activeIndicator: {
        position: 'absolute',
        bottom: 0,
        height: 2,
        width: '100%',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContainer: {
        padding: 16,
    },
    userCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    avatarContainer: {
        marginRight: 12,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    userInfo: {
        flex: 1,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
    },
    emptyText: {
        marginTop: 12,
    },
});
