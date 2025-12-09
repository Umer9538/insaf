import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useAppTheme } from '../../context/ThemeContext';
import { Text } from './Text';
import { useAuth } from '../../context/AuthContext';
import { followLawyer, unfollowLawyer, isFollowing } from '../../services/follow.service';

interface FollowButtonProps {
    lawyerId: string;
    lawyerName: string;
    onFollowChange?: (isFollowing: boolean) => void;
    isFollowing?: boolean;
    style?: any;
}

export const FollowButton: React.FC<FollowButtonProps> = ({
    lawyerId,
    lawyerName,
    onFollowChange,
    style
}) => {
    const theme = useAppTheme();
    const { user } = useAuth();
    const [following, setFollowing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        checkFollowStatus();
    }, [user, lawyerId]);

    const checkFollowStatus = async () => {
        if (!user) return;
        try {
            const status = await isFollowing(user.uid, lawyerId);
            setFollowing(status);
        } catch (error) {
            console.error('Error checking follow status:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePress = async () => {
        if (!user) {
            Alert.alert('Login Required', 'Please login to follow lawyers');
            return;
        }

        if (user.uid === lawyerId) {
            Alert.alert('Error', 'You cannot follow yourself');
            return;
        }

        // Client cannot be followed - logic handled by only showing button on lawyer profiles
        // but we double check roles here if needed. For now assuming button logic is safe.

        setActionLoading(true);
        try {
            if (following) {
                await unfollowLawyer(user.uid, lawyerId);
                setFollowing(false);
                if (onFollowChange) onFollowChange(false);
            } else {
                await followLawyer(user.uid, lawyerId, user.role === 'LAWYER' ? 'LAWYER' : 'CLIENT');
                setFollowing(true);
                if (onFollowChange) onFollowChange(true);
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to update follow status');
            // Revert optimistic update if we did one (here we didn't do optimistic update separately)
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, style]}>
                <ActivityIndicator size="small" color={theme.colors.brand.primary} />
            </View>
        );
    }

    return (
        <TouchableOpacity
            style={[
                styles.container,
                following ? styles.followingButton : styles.followButton,
                { borderColor: following ? theme.colors.border.medium : theme.colors.brand.primary },
                style
            ]}
            onPress={handlePress}
            disabled={actionLoading}
            activeOpacity={0.7}
        >
            {actionLoading ? (
                <ActivityIndicator size="small" color={following ? theme.colors.text.primary : '#FFFFFF'} />
            ) : (
                <Text
                    variant="labelMedium"
                    style={{
                        color: following ? theme.colors.text.primary : '#FFFFFF',
                        fontWeight: '600'
                    }}
                >
                    {following ? 'Following' : 'Follow'}
                </Text>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 100,
    },
    followButton: {
        backgroundColor: '#d4af37', // Brand primary hardcoded or use theme
        borderColor: '#d4af37',
    },
    followingButton: {
        backgroundColor: 'transparent',
    },
});
