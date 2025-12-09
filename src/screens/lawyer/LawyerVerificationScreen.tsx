/**
 * INSAF - Lawyer Verification Screen
 * 
 * Screen for lawyers to verify their credentials against the Bar Council database.
 */

import React, { useState } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../context/ThemeContext';
import { Text } from '../../components/common/Text';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import { verifyLawyerCredentials } from '../../services/lawyer.service';

export const LawyerVerificationScreen = () => {
    const theme = useAppTheme();
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();
    const { user } = useAuth();

    const [licenseNumber, setLicenseNumber] = useState('');
    const [cnic, setCnic] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [verifiedDetails, setVerifiedDetails] = useState<any>(null);

    const handleVerify = async () => {
        if (!licenseNumber.trim() || !cnic.trim()) {
            setError('Please fill in all fields');
            return;
        }

        if (!user?.uid) return;

        setLoading(true);
        setError('');

        try {
            // Pass user's name for verification (fallback to empty string if undefined)
            const result = await verifyLawyerCredentials(
                user.uid,
                licenseNumber,
                cnic,
                user.displayName || ''
            );

            if (result.success) {
                setSuccess(true);
                setVerifiedDetails(result.record);
            } else {
                setError(result.message);
            }
        } catch (err: any) {
            setError(err.message || 'Verification failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleFinish = () => {
        navigation.navigate('LawyerTabs', { screen: 'DashboardTab' });
    };

    if (success) {
        return (
            <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
                <View style={[styles.successContent, { marginTop: insets.top + 60 }]}>
                    <View style={[styles.iconCircle, { backgroundColor: '#E8F5E9' }]}>
                        <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
                    </View>

                    <Text variant="h2" color="primary" style={styles.successTitle}>
                        Verification Successful!
                    </Text>

                    <Text variant="bodyMedium" color="secondary" style={styles.successDesc}>
                        Your identity has been verified against the Bar Council records.
                    </Text>

                    <View style={[styles.verifiedCard, { backgroundColor: theme.colors.surface.primary }]}>
                        <View style={styles.verifiedRow}>
                            <Text variant="labelMedium" color="secondary">Name:</Text>
                            <Text variant="h4" color="primary">{verifiedDetails?.fullName}</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.verifiedRow}>
                            <Text variant="labelMedium" color="secondary">License:</Text>
                            <Text variant="bodyLarge" color="primary">{verifiedDetails?.licenseNumber}</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.verifiedRow}>
                            <Text variant="labelMedium" color="secondary">Bar ID:</Text>
                            <Text variant="bodyLarge" color="primary">{verifiedDetails?.barId}</Text>
                        </View>
                    </View>

                    <Button
                        title="Go to Dashboard"
                        onPress={handleFinish}
                        style={styles.finishButton}
                    />
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
            <View style={[styles.header, { paddingTop: insets.top }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
                </TouchableOpacity>
                <Text variant="h3" color="primary">Verify Account</Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.heroSection}>
                        <Image
                            source={{ uri: 'https://cdn-icons-png.flaticon.com/512/942/942748.png' }}
                            style={styles.heroImage}
                        />
                        <Text variant="h4" color="primary" style={{ marginTop: 20 }}>
                            Get Verified Badge
                        </Text>
                        <Text variant="bodyMedium" color="secondary" style={styles.heroText}>
                            Verified lawyers get 3x more clients. Verify your Bar Council license to unlock full features.
                        </Text>

                        <View style={{
                            marginTop: 16,
                            padding: 12,
                            backgroundColor: '#EBF5FF',
                            borderRadius: 12,
                            width: '100%'
                        }}>
                            <Text variant="bodySmall" color="primary" style={{ textAlign: 'center' }}>
                                Verification will verify your Name: <Text style={{ fontWeight: 'bold' }}>{user?.displayName}</Text>
                            </Text>
                        </View>
                    </View>

                    <View style={[styles.formCard, { backgroundColor: theme.colors.surface.primary }]}>
                        <View style={styles.inputGroup}>
                            <Text variant="labelMedium" color="primary" style={styles.label}>
                                Bar Council License No.
                            </Text>
                            <TextInput
                                style={[styles.input, {
                                    borderColor: theme.colors.border.light,
                                    color: theme.colors.text.primary
                                }]}
                                placeholder="e.g. LHR12345"
                                placeholderTextColor={theme.colors.text.tertiary}
                                value={licenseNumber}
                                onChangeText={setLicenseNumber}
                                autoCapitalize="characters"
                            />
                            <Text variant="caption" color="tertiary" style={{ marginTop: 4 }}>
                                Enter the 8-digit alphanumeric code on your card
                            </Text>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text variant="labelMedium" color="primary" style={styles.label}>
                                CNIC Number
                            </Text>
                            <TextInput
                                style={[styles.input, {
                                    borderColor: theme.colors.border.light,
                                    color: theme.colors.text.primary
                                }]}
                                placeholder="35202-xxxxxxx-x"
                                placeholderTextColor={theme.colors.text.tertiary}
                                value={cnic}
                                onChangeText={setCnic}
                                keyboardType="numeric"
                            />
                        </View>

                        {error ? (
                            <View style={styles.errorContainer}>
                                <Ionicons name="alert-circle" size={20} color="#EF4444" />
                                <Text variant="bodySmall" style={styles.errorText}>
                                    {error}
                                </Text>
                            </View>
                        ) : null}

                        <Button
                            title="Verify Now"
                            onPress={handleVerify}
                            loading={loading}
                            style={{ marginTop: 16 }}
                        />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
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
        paddingBottom: 16,
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    scrollContent: {
        padding: 24,
    },
    heroSection: {
        alignItems: 'center',
        marginBottom: 32,
    },
    heroImage: {
        width: 120,
        height: 120,
        resizeMode: 'contain',
        opacity: 0.9,
    },
    heroText: {
        textAlign: 'center',
        marginTop: 8,
        paddingHorizontal: 20,
        opacity: 0.8,
    },
    formCard: {
        padding: 24,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 3,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        marginBottom: 8,
        fontWeight: '600',
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF2F2',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
    },
    errorText: {
        color: '#EF4444',
        marginLeft: 8,
        flex: 1,
    },
    successContent: {
        alignItems: 'center',
        padding: 32,
        flex: 1,
    },
    iconCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    successTitle: {
        textAlign: 'center',
        marginBottom: 8,
    },
    successDesc: {
        textAlign: 'center',
        marginBottom: 32,
        opacity: 0.8,
    },
    verifiedCard: {
        width: '100%',
        padding: 24,
        borderRadius: 16,
        marginBottom: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    verifiedRow: {
        marginVertical: 8,
    },
    divider: {
        height: 1,
        backgroundColor: '#F0F0F0',
        marginVertical: 4,
    },
    finishButton: {
        width: '100%',
    },
});
