import {
    COLLECTIONS,
    createDocument,
    getDocuments,
    deleteDocument,
    where,
    getCount,
    orderBy
} from './firestore.service';

export interface Follow {
    id?: string;
    followerId: string;
    followingId: string;
    followerRole: 'CLIENT' | 'LAWYER';
    createdAt: any;
}

export interface FollowStats {
    followerCount: number;
    followingCount: number;
    isFollowing: boolean;
}

/**
 * Follow a lawyer
 */
export const followLawyer = async (
    followerId: string,
    followingId: string,
    followerRole: 'CLIENT' | 'LAWYER'
): Promise<string> => {
    if (followerId === followingId) throw new Error("You cannot follow yourself");

    // Check if already following
    const isAlreadyFollowing = await isFollowing(followerId, followingId);
    if (isAlreadyFollowing) throw new Error("Already following this lawyer");

    const followData: Follow = {
        followerId,
        followingId,
        followerRole,
        createdAt: new Date(),
    };

    return createDocument(COLLECTIONS.FOLLOWS, followData);
};

/**
 * Unfollow a lawyer
 */
export const unfollowLawyer = async (followerId: string, followingId: string): Promise<void> => {
    const follows = await getDocuments<Follow>(COLLECTIONS.FOLLOWS, [
        where('followerId', '==', followerId),
        where('followingId', '==', followingId)
    ]);

    if (follows.length > 0 && follows[0].id) {
        await deleteDocument(COLLECTIONS.FOLLOWS, follows[0].id);
    }
};

/**
 * Check if user is following a lawyer
 */
export const isFollowing = async (followerId: string, followingId: string): Promise<boolean> => {
    const count = await getCount(COLLECTIONS.FOLLOWS, [
        where('followerId', '==', followerId),
        where('followingId', '==', followingId)
    ]);
    return count > 0;
};

/**
 * Get followers for a lawyer
 */
export const getFollowers = async (lawyerId: string): Promise<Follow[]> => {
    return getDocuments<Follow>(COLLECTIONS.FOLLOWS, [
        where('followingId', '==', lawyerId),
        orderBy('createdAt', 'desc')
    ]);
};

/**
 * Get users a lawyer is following
 */
export const getFollowing = async (userId: string): Promise<Follow[]> => {
    return getDocuments<Follow>(COLLECTIONS.FOLLOWS, [
        where('followerId', '==', userId),
        orderBy('createdAt', 'desc')
    ]);
};

/**
 * Get follower count for a lawyer
 */
export const getFollowerCount = async (lawyerId: string): Promise<number> => {
    return getCount(COLLECTIONS.FOLLOWS, [
        where('followingId', '==', lawyerId)
    ]);
};

/**
 * Get following count for a user
 */
export const getFollowingCount = async (userId: string): Promise<number> => {
    return getCount(COLLECTIONS.FOLLOWS, [
        where('followerId', '==', userId)
    ]);
};

/**
 * Get full follow stats
 */
export const getFollowStats = async (currentUserId: string, targetUserId: string): Promise<FollowStats> => {
    const [followerCount, followingCount, isFollowingStatus] = await Promise.all([
        getFollowerCount(targetUserId),
        getFollowingCount(targetUserId),
        isFollowing(currentUserId, targetUserId)
    ]);

    return {
        followerCount,
        followingCount,
        isFollowing: isFollowingStatus
    };
};
