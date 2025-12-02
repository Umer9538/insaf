/**
 * INSAF - Notification Settings Screen
 *
 * Manage push notification preferences
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Text } from '../../components/common/Text';
import { Card } from '../../components/common/Card';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface NotificationSetting {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  enabled: boolean;
}

const NOTIFICATION_SETTINGS_KEY = '@notification_settings';

const DEFAULT_SETTINGS: NotificationSetting[] = [
  {
    id: 'new_cases',
    title: 'New Case Matches',
    description: 'Get notified when new cases match your expertise',
    icon: 'briefcase-outline',
    enabled: true,
  },
  {
    id: 'bid_updates',
    title: 'Bid Updates',
    description: 'Notifications when your bids are accepted or rejected',
    icon: 'document-text-outline',
    enabled: true,
  },
  {
    id: 'messages',
    title: 'New Messages',
    description: 'Get notified when you receive new messages',
    icon: 'chatbubble-outline',
    enabled: true,
  },
  {
    id: 'consultations',
    title: 'Consultation Reminders',
    description: 'Reminders for upcoming consultations',
    icon: 'calendar-outline',
    enabled: true,
  },
  {
    id: 'payments',
    title: 'Payment Updates',
    description: 'Notifications for payments and earnings',
    icon: 'wallet-outline',
    enabled: true,
  },
  {
    id: 'case_updates',
    title: 'Case Updates',
    description: 'Status changes and updates for your cases',
    icon: 'folder-outline',
    enabled: true,
  },
  {
    id: 'reviews',
    title: 'New Reviews',
    description: 'Get notified when clients leave reviews',
    icon: 'star-outline',
    enabled: true,
  },
  {
    id: 'marketing',
    title: 'Tips & Promotions',
    description: 'Platform updates, tips, and promotional offers',
    icon: 'megaphone-outline',
    enabled: false,
  },
];

export const NotificationSettingsScreen: React.FC = () => {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<NotificationSetting[]>(DEFAULT_SETTINGS);
  const [masterEnabled, setMasterEnabled] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const saved = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setSettings(parsed.settings || DEFAULT_SETTINGS);
        setMasterEnabled(parsed.masterEnabled ?? true);
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (newSettings: NotificationSetting[], master: boolean) => {
    try {
      await AsyncStorage.setItem(
        NOTIFICATION_SETTINGS_KEY,
        JSON.stringify({ settings: newSettings, masterEnabled: master })
      );
    } catch (error) {
      console.error('Error saving notification settings:', error);
    }
  };

  const handleToggleMaster = (value: boolean) => {
    setMasterEnabled(value);
    saveSettings(settings, value);
    if (!value) {
      Alert.alert(
        'Notifications Disabled',
        'You will not receive any push notifications. You can still view updates in the app.'
      );
    }
  };

  const handleToggleSetting = (id: string, value: boolean) => {
    const newSettings = settings.map(setting =>
      setting.id === id ? { ...setting, enabled: value } : setting
    );
    setSettings(newSettings);
    saveSettings(newSettings, masterEnabled);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: theme.colors.background.primary }]}>
        <ActivityIndicator size="large" color={theme.colors.brand.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text variant="h3" color="primary">Notifications</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Master Toggle */}
        <Card variant="elevated" style={styles.masterCard}>
          <View style={styles.settingRow}>
            <View style={[styles.settingIcon, { backgroundColor: theme.colors.brand.primary }]}>
              <Ionicons name="notifications" size={24} color="#FFFFFF" />
            </View>
            <View style={styles.settingInfo}>
              <Text variant="labelLarge" color="primary">Push Notifications</Text>
              <Text variant="bodySmall" color="secondary">
                Enable or disable all notifications
              </Text>
            </View>
            <Switch
              value={masterEnabled}
              onValueChange={handleToggleMaster}
              trackColor={{ false: theme.colors.background.secondary, true: theme.colors.brand.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </Card>

        {/* Individual Settings */}
        <Text variant="labelMedium" color="tertiary" style={styles.sectionLabel}>
          Notification Types
        </Text>

        {settings.map(setting => (
          <Card key={setting.id} variant="elevated" style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={[styles.settingIcon, { backgroundColor: theme.colors.background.secondary }]}>
                <Ionicons
                  name={setting.icon}
                  size={20}
                  color={masterEnabled && setting.enabled ? theme.colors.brand.primary : theme.colors.text.tertiary}
                />
              </View>
              <View style={styles.settingInfo}>
                <Text
                  variant="labelMedium"
                  color={masterEnabled ? 'primary' : 'tertiary'}
                >
                  {setting.title}
                </Text>
                <Text variant="caption" color="tertiary">
                  {setting.description}
                </Text>
              </View>
              <Switch
                value={setting.enabled}
                onValueChange={(value) => handleToggleSetting(setting.id, value)}
                disabled={!masterEnabled}
                trackColor={{ false: theme.colors.background.secondary, true: theme.colors.brand.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          </Card>
        ))}

        {/* Info */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color={theme.colors.text.tertiary} />
          <Text variant="caption" color="tertiary" style={{ marginLeft: 8, flex: 1 }}>
            You can also manage notifications from your device settings. Some critical notifications like security alerts cannot be disabled.
          </Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  masterCard: {
    marginBottom: 24,
  },
  settingCard: {
    marginBottom: 8,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  settingIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingInfo: {
    flex: 1,
    marginHorizontal: 12,
  },
  sectionLabel: {
    marginBottom: 12,
  },
  infoBox: {
    flexDirection: 'row',
    padding: 16,
    marginTop: 24,
  },
});

export default NotificationSettingsScreen;
