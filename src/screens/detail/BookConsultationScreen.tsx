/**
 * INSAF - Book Consultation Screen
 *
 * Screen for booking consultations with lawyers
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../context/ThemeContext';
import { Text } from '../../components/common/Text';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { useAuth } from '../../context/AuthContext';
import { getLawyerProfile, LawyerProfile } from '../../services/lawyer.service';
import { bookConsultation, ConsultationType } from '../../services/consultation.service';
import { Input } from '../../components/common/Input';

interface RouteParams {
  lawyerId: string;
  lawyerName?: string;
}

// Generate next 5 weekdays
const generateDates = () => {
  const dates = [];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  let currentDate = new Date();
  let count = 0;

  while (count < 5) {
    currentDate.setDate(currentDate.getDate() + 1);
    // Skip weekends
    if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
      dates.push({
        id: currentDate.toISOString().split('T')[0],
        day: dayNames[currentDate.getDay()],
        date: currentDate.getDate().toString(),
        month: monthNames[currentDate.getMonth()],
        fullDate: new Date(currentDate),
      });
      count++;
    }
  }

  return dates;
};

export const BookConsultationScreen: React.FC = () => {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { user } = useAuth();
  const { lawyerId, lawyerName } = (route.params as RouteParams) || {};

  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);
  const [lawyer, setLawyer] = useState<LawyerProfile | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [consultationType, setConsultationType] = useState<'VIDEO' | 'AUDIO' | 'CHAT'>('VIDEO');
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');

  const dates = generateDates();

  const times = [
    '09:00', '10:00', '11:00',
    '14:00', '15:00', '16:00',
  ];

  const formatTimeDisplay = (time: string) => {
    const [hours] = time.split(':');
    const hour = parseInt(hours);
    return `${hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? 'PM' : 'AM'}`;
  };

  // Fetch lawyer details
  useEffect(() => {
    const fetchLawyer = async () => {
      if (!lawyerId) return;
      try {
        const profile = await getLawyerProfile(lawyerId);
        setLawyer(profile);
      } catch (error) {
        console.error('Error fetching lawyer:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLawyer();
  }, [lawyerId]);

  const handleBooking = async () => {
    if (!selectedDate || !selectedTime) {
      Alert.alert('Select Time', 'Please select a date and time for your consultation.');
      return;
    }

    if (!topic.trim()) {
      Alert.alert('Topic Required', 'Please enter a topic for your consultation.');
      return;
    }

    if (!user || !lawyerId) {
      Alert.alert('Error', 'Unable to book consultation. Please try again.');
      return;
    }

    setIsBooking(true);
    try {
      const selectedDateObj = dates.find(d => d.id === selectedDate);
      if (!selectedDateObj) throw new Error('Invalid date');

      const [hours, minutes] = selectedTime.split(':').map(Number);
      const scheduledDate = new Date(selectedDateObj.fullDate);
      scheduledDate.setHours(hours, minutes, 0, 0);

      const consultationFee = lawyer?.consultationFee || 2000;

      await bookConsultation(
        lawyerId,
        lawyer?.fullName || lawyerName || 'Lawyer',
        user.uid,
        user.displayName || 'Client',
        consultationType as ConsultationType,
        scheduledDate,
        30, // 30 minute duration
        consultationFee,
        topic.trim(),
        description.trim() || undefined
      );

      Alert.alert(
        'Booking Confirmed',
        `Your ${consultationType.toLowerCase()} consultation has been scheduled for ${selectedDateObj.month} ${selectedDateObj.date} at ${formatTimeDisplay(selectedTime)}. The lawyer will confirm shortly.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      console.error('Error booking consultation:', error);
      Alert.alert('Error', error.message || 'Failed to book consultation. Please try again.');
    } finally {
      setIsBooking(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: theme.colors.background.primary }]}>
        <ActivityIndicator size="large" color={theme.colors.brand.primary} />
      </View>
    );
  }

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
          <Text variant="h3" style={styles.headerTitle}>Book Consultation</Text>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Topic */}
        <Input
          label="Consultation Topic *"
          value={topic}
          onChangeText={setTopic}
          placeholder="What do you want to discuss?"
          maxLength={100}
        />

        {/* Consultation Type */}
        <Text variant="h4" color="primary" style={styles.sectionTitle}>Consultation Type</Text>
        <View style={styles.typeContainer}>
          {[
            { type: 'VIDEO', icon: 'videocam', label: 'Video Call' },
            { type: 'AUDIO', icon: 'call', label: 'Audio Call' },
            { type: 'CHAT', icon: 'chatbubbles', label: 'Chat' },
          ].map((item) => (
            <TouchableOpacity
              key={item.type}
              style={[
                styles.typeCard,
                { backgroundColor: theme.colors.surface.secondary },
                consultationType === item.type && { backgroundColor: theme.colors.brand.primary },
              ]}
              onPress={() => setConsultationType(item.type as 'VIDEO' | 'AUDIO' | 'CHAT')}
            >
              <Ionicons
                name={item.icon as any}
                size={24}
                color={consultationType === item.type ? '#FFFFFF' : theme.colors.text.secondary}
              />
              <Text
                variant="labelSmall"
                style={{
                  color: consultationType === item.type ? '#FFFFFF' : theme.colors.text.secondary,
                  marginTop: 8,
                }}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Date Selection */}
        <Text variant="h4" color="primary" style={styles.sectionTitle}>Select Date</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
          {dates.map((date) => (
            <TouchableOpacity
              key={date.id}
              style={[
                styles.dateCard,
                { backgroundColor: theme.colors.surface.secondary },
                selectedDate === date.id && { backgroundColor: theme.colors.brand.primary },
              ]}
              onPress={() => setSelectedDate(date.id)}
            >
              <Text
                variant="caption"
                style={{ color: selectedDate === date.id ? '#FFFFFF' : theme.colors.text.tertiary }}
              >
                {date.day}
              </Text>
              <Text
                variant="h3"
                style={{
                  color: selectedDate === date.id ? '#FFFFFF' : theme.colors.text.primary,
                  marginVertical: 4,
                }}
              >
                {date.date}
              </Text>
              <Text
                variant="caption"
                style={{ color: selectedDate === date.id ? '#FFFFFF' : theme.colors.text.tertiary }}
              >
                {date.month}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Time Selection */}
        <Text variant="h4" color="primary" style={styles.sectionTitle}>Select Time</Text>
        <View style={styles.timeGrid}>
          {times.map((time) => (
            <TouchableOpacity
              key={time}
              style={[
                styles.timeCard,
                { backgroundColor: theme.colors.surface.secondary },
                selectedTime === time && { backgroundColor: theme.colors.brand.primary },
              ]}
              onPress={() => setSelectedTime(time)}
            >
              <Text
                variant="labelMedium"
                style={{ color: selectedTime === time ? '#FFFFFF' : theme.colors.text.primary }}
              >
                {formatTimeDisplay(time)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Summary */}
        <Card style={styles.summaryCard}>
          <Text variant="h4" color="primary" style={{ marginBottom: 16 }}>Booking Summary</Text>
          {lawyer && (
            <View style={styles.summaryRow}>
              <Text variant="bodyMedium" color="secondary">Lawyer</Text>
              <Text variant="labelMedium" color="primary">{lawyer.fullName}</Text>
            </View>
          )}
          <View style={styles.summaryRow}>
            <Text variant="bodyMedium" color="secondary">Consultation Fee</Text>
            <Text variant="labelLarge" color="brand">Rs. {(lawyer?.consultationFee || 2000).toLocaleString()}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text variant="bodyMedium" color="secondary">Type</Text>
            <Text variant="labelMedium" color="primary" style={{ textTransform: 'capitalize' }}>
              {consultationType.toLowerCase()} Call
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text variant="bodyMedium" color="secondary">Duration</Text>
            <Text variant="labelMedium" color="primary">30 minutes</Text>
          </View>
        </Card>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Button */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16, backgroundColor: theme.colors.surface.primary }]}>
        <Button
          title={isBooking ? "Booking..." : "Confirm Booking"}
          variant="gradient"
          size="lg"
          fullWidth
          onPress={handleBooking}
          loading={isBooking}
          disabled={isBooking}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  headerTitle: {
    color: '#FFFFFF',
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    marginBottom: 16,
    marginTop: 8,
  },
  typeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  typeCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 20,
    borderRadius: 16,
  },
  dateScroll: {
    marginBottom: 24,
  },
  dateCard: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    marginRight: 12,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  timeCard: {
    width: '30%',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
  },
  summaryCard: {
    padding: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
});

export default BookConsultationScreen;
