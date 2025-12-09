import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../context/ThemeContext';
import { Text } from '../../components/common/Text';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { RootStackParamList } from '../../navigation/types';

type BookConsultationRouteProp = RouteProp<RootStackParamList, 'BookConsultation'>;

export const BookConsultationScreen: React.FC = () => {
    const theme = useAppTheme();
    const navigation = useNavigation();
    const route = useRoute<BookConsultationRouteProp>();
    const { lawyerId } = route.params;

    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);

    // Mock dates - in real app, fetch availability
    const availableDates = [
        { id: '1', day: 'Mon', date: '12' },
        { id: '2', day: 'Tue', date: '13' },
        { id: '3', day: 'Wed', date: '14' },
        { id: '4', day: 'Thu', date: '15' },
        { id: '5', day: 'Fri', date: '16' },
    ];

    // Mock times
    const availableTimes = ['10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM'];

    const handleBooking = () => {
        // Booking logic would go here
        console.log(`Booking for lawyer ${lawyerId} on ${selectedDate} at ${selectedTime}`);
        navigation.goBack();
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="close" size={24} color={theme.colors.text.primary} />
                </TouchableOpacity>
                <Text variant="h3" style={styles.title}>Book Consultation</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text variant="h4" color="primary" style={styles.sectionTitle}>Select Date</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
                    {availableDates.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            style={[
                                styles.dateCard,
                                {
                                    backgroundColor: selectedDate === item.id
                                        ? theme.colors.brand.primary
                                        : theme.colors.surface.secondary
                                }
                            ]}
                            onPress={() => setSelectedDate(item.id)}
                        >
                            <Text
                                variant="bodySmall"
                                style={{ color: selectedDate === item.id ? '#FFF' : theme.colors.text.secondary }}
                            >
                                {item.day}
                            </Text>
                            <Text
                                variant="h4"
                                style={{ color: selectedDate === item.id ? '#FFF' : theme.colors.text.primary }}
                            >
                                {item.date}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <Text variant="h4" color="primary" style={styles.sectionTitle}>Select Time</Text>
                <View style={styles.timeGrid}>
                    {availableTimes.map((time) => (
                        <TouchableOpacity
                            key={time}
                            style={[
                                styles.timeChip,
                                {
                                    borderColor: selectedTime === time ? theme.colors.brand.primary : theme.colors.border.light,
                                    backgroundColor: selectedTime === time ? `${theme.colors.brand.primary}15` : 'transparent'
                                }
                            ]}
                            onPress={() => setSelectedTime(time)}
                        >
                            <Text
                                variant="bodyMedium"
                                color={selectedTime === time ? 'primary' : 'secondary'}
                            >
                                {time}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Card variant="outlined" style={styles.summaryCard}>
                    <Text variant="h4" color="primary">Consultation Fee</Text>
                    <Text variant="h3" color="primary" style={{ marginTop: 8 }}>PKR 5,000</Text>
                    <Text variant="caption" color="secondary" style={{ marginTop: 4 }}>
                        30 minute video consultation
                    </Text>
                </Card>
            </ScrollView>

            <View style={[styles.footer, { borderTopColor: theme.colors.border.light }]}>
                <Button
                    title="Confirm Booking"
                    onPress={handleBooking}
                    disabled={!selectedDate || !selectedTime}
                    fullWidth
                />
            </View>
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
        padding: 16,
        paddingTop: 60,
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.05)',
    },
    title: {
        textAlign: 'center',
    },
    content: {
        padding: 20,
    },
    sectionTitle: {
        marginBottom: 16,
        marginTop: 8,
    },
    dateScroll: {
        marginBottom: 24,
    },
    dateCard: {
        width: 70,
        height: 90,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    timeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 32,
    },
    timeChip: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 24,
        borderWidth: 1,
    },
    summaryCard: {
        padding: 20,
        alignItems: 'center',
    },
    footer: {
        padding: 20,
        paddingBottom: 40,
        borderTopWidth: 1,
    },
});
