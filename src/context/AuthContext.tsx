/**
 * INSAF - Auth Context
 *
 * Manages authentication state throughout the app
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChange, getUserProfile, logoutUser, UserProfile } from '../services/auth.service';

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Retry fetching profile with delay to handle race condition during registration
          let userProfile = await getUserProfile(firebaseUser.uid);

          // If profile not found, wait and retry (handles registration race condition)
          if (!userProfile) {
            console.log('Profile not found, retrying in 1 second...');
            await new Promise(resolve => setTimeout(resolve, 1000));
            userProfile = await getUserProfile(firebaseUser.uid);
          }

          // Second retry if still not found
          if (!userProfile) {
            console.log('Profile still not found, retrying in 2 seconds...');
            await new Promise(resolve => setTimeout(resolve, 2000));
            userProfile = await getUserProfile(firebaseUser.uid);
          }

          if (userProfile) {
            console.log('User profile loaded with role:', userProfile.role);
            setUser(userProfile);
          } else {
            // User exists in Firebase Auth but no Firestore profile yet
            // Create a basic profile from Firebase user data
            console.log('No Firestore profile found after retries, using Firebase user data');
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || 'User',
              role: 'CLIENT', // Default role
              status: 'ACTIVE',
              languagePreference: 'EN',
              createdAt: null,
              updatedAt: null,
            });
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          // Still set basic user info on error so they can access the app
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || 'User',
            role: 'CLIENT',
            status: 'ACTIVE',
            languagePreference: 'EN',
            createdAt: null,
            updatedAt: null,
          });
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const logout = async () => {
    try {
      await logoutUser();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const refreshUser = async () => {
    try {
      if (user?.uid) {
        const userProfile = await getUserProfile(user.uid);
        setUser(userProfile);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
