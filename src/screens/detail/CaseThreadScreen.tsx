/**
 * INSAF - Case Thread Screen
 *
 * Structured timeline for case management
 * Shows milestones, deadlines, decisions, meetings, and documents
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../context/ThemeContext';
import { Text } from '../../components/common/Text';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { useAuth } from '../../context/AuthContext';
import {
  subscribeToThreadEntries,
  addThreadEntry,
  markEntryCompleted,
  getCaseThreadByCaseId,
  ThreadEntry,
  ThreadEntryType,
  CaseThread,
  getEntryTypeIcon,
  getEntryTypeColor,
} from '../../services/caseThread.service';
import { format, formatDistanceToNow } from 'date-fns';

interface RouteParams {
  caseId: string;
  caseTitle?: string;
}

const ENTRY_TYPES: { type: ThreadEntryType; label: string; icon: string }[] = [
  { type: 'MILESTONE', label: 'Milestone', icon: 'flag' },
  { type: 'DEADLINE', label: 'Deadline', icon: 'time' },
  { type: 'DECISION', label: 'Decision', icon: 'checkmark-circle' },
  { type: 'MEETING', label: 'Meeting', icon: 'people' },
  { type: 'DOCUMENT', label: 'Document', icon: 'document-text' },
  { type: 'NOTE', label: 'Note', icon: 'create' },
];

export const CaseThreadScreen: React.FC = () => {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { caseId, caseTitle } = (route.params as RouteParams) || {};
  const { user } = useAuth();

  const [thread, setThread] = useState<CaseThread | null>(null);
  const [entries, setEntries] = useState<ThreadEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedType, setSelectedType] = useState<ThreadEntryType>('NOTE');
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filter, setFilter] = useState<ThreadEntryType | 'ALL'>('ALL');

  // Fetch thread and subscribe to entries
  useFocusEffect(
    useCallback(() => {
      if (!caseId) {
        setIsLoading(false);
        return;
      }

      const fetchThread = async () => {
        try {
          const threadData = await getCaseThreadByCaseId(caseId);
          setThread(threadData);

          if (threadData) {
            const unsubscribe = subscribeToThreadEntries(threadData.id, (newEntries) => {
              setEntries(newEntries);
              setIsLoading(false);
            });
            return unsubscribe;
          } else {
            setIsLoading(false);
          }
        } catch (error) {
          console.error('Error fetching thread:', error);
          setIsLoading(false);
        }
      };

      let unsubscribe: (() => void) | undefined;
      fetchThread().then(unsub => {
        unsubscribe = unsub;
      });

      return () => {
        if (unsubscribe) unsubscribe();
      };
    }, [caseId])
  );

  const handleAddEntry = async () => {
    if (!newTitle.trim() || !thread || !user) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    setIsSubmitting(true);
    try {
      await addThreadEntry(thread.id, caseId, {
        type: selectedType,
        title: newTitle.trim(),
        description: newDescription.trim() || undefined,
        createdBy: user.uid,
        createdByName: user.displayName || 'User',
        createdByRole: user.role === 'LAWYER' ? 'lawyer' : 'client',
        isCompleted: selectedType === 'NOTE' || selectedType === 'DECISION',
      });

      setShowAddModal(false);
      setNewTitle('');
      setNewDescription('');
      setSelectedType('NOTE');
    } catch (error) {
      console.error('Error adding entry:', error);
      Alert.alert('Error', 'Failed to add entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkComplete = async (entry: ThreadEntry) => {
    try {
      await markEntryCompleted(entry.id);
    } catch (error) {
      Alert.alert('Error', 'Failed to mark as complete');
    }
  };

  const filteredEntries = filter === 'ALL'
    ? entries
    : entries.filter(e => e.type === filter);

  const renderEntry = ({ item, index }: { item: ThreadEntry; index: number }) => {
    const isLast = index === filteredEntries.length - 1;
    const typeColor = getEntryTypeColor(item.type);
    const typeIcon = getEntryTypeIcon(item.type);

    let timeDisplay = '';
    if (item.createdAt) {
      try {
        const date = item.createdAt.toDate();
        timeDisplay = formatDistanceToNow(date, { addSuffix: true });
      } catch {
        timeDisplay = '';
      }
    }

    let dueDateDisplay = '';
    if (item.dueDate) {
      try {
        const date = item.dueDate.toDate();
        dueDateDisplay = format(date, 'MMM d, yyyy');
      } catch {
        dueDateDisplay = '';
      }
    }

    return (
      <View style={styles.entryContainer}>
        {/* Timeline connector */}
        <View style={styles.timelineConnector}>
          <View style={[styles.timelineDot, { backgroundColor: typeColor }]}>
            <Ionicons name={typeIcon as any} size={14} color="#FFFFFF" />
          </View>
          {!isLast && (
            <View style={[styles.timelineLine, { backgroundColor: theme.colors.border.light }]} />
          )}
        </View>

        {/* Entry content */}
        <Card style={[styles.entryCard, item.isCompleted && styles.completedCard]}>
          <View style={styles.entryHeader}>
            <View style={[styles.typeBadge, { backgroundColor: `${typeColor}20` }]}>
              <Text variant="caption" style={{ color: typeColor }}>
                {item.type.replace('_', ' ')}
              </Text>
            </View>
            {item.type === 'DEADLINE' && !item.isCompleted && (
              <TouchableOpacity
                style={styles.completeButton}
                onPress={() => handleMarkComplete(item)}
              >
                <Ionicons name="checkmark-circle-outline" size={22} color={theme.colors.status.success} />
              </TouchableOpacity>
            )}
            {item.isCompleted && (
              <Ionicons name="checkmark-circle" size={20} color={theme.colors.status.success} />
            )}
          </View>

          <Text variant="labelLarge" color="primary" style={styles.entryTitle}>
            {item.title}
          </Text>

          {item.description && (
            <Text variant="bodySmall" color="secondary" style={styles.entryDescription}>
              {item.description}
            </Text>
          )}

          <View style={styles.entryFooter}>
            <View style={styles.entryMeta}>
              <Ionicons name="person-outline" size={12} color={theme.colors.text.tertiary} />
              <Text variant="caption" color="tertiary" style={{ marginLeft: 4 }}>
                {item.createdByName}
              </Text>
            </View>
            <Text variant="caption" color="tertiary">
              {timeDisplay}
            </Text>
          </View>

          {dueDateDisplay && !item.isCompleted && (
            <View style={[styles.dueDate, { backgroundColor: `${theme.colors.status.warning}15` }]}>
              <Ionicons name="calendar-outline" size={14} color={theme.colors.status.warning} />
              <Text variant="caption" style={{ color: theme.colors.status.warning, marginLeft: 4 }}>
                Due: {dueDateDisplay}
              </Text>
            </View>
          )}
        </Card>
      </View>
    );
  };

  if (!thread && !isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
        <LinearGradient
          colors={theme.colors.gradient.primary as [string, string]}
          style={[styles.header, { paddingTop: insets.top }]}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text variant="h3" style={styles.headerTitle}>Case Thread</Text>
            <View style={{ width: 40 }} />
          </View>
        </LinearGradient>

        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={64} color={theme.colors.text.tertiary} />
          <Text variant="h4" color="secondary" style={{ marginTop: 16 }}>
            No Thread Yet
          </Text>
          <Text variant="bodySmall" color="tertiary" style={{ textAlign: 'center', marginTop: 8 }}>
            Case thread will be created when the case moves to IN_PROGRESS status
          </Text>
        </View>
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
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text variant="labelLarge" style={styles.headerTitle}>Case Thread</Text>
            <Text variant="caption" style={styles.headerSubtitle} numberOfLines={1}>
              {caseTitle || thread?.caseTitle || 'Case Timeline'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
          >
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Filter chips */}
        <View style={styles.filterContainer}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={[{ type: 'ALL', label: 'All' }, ...ENTRY_TYPES]}
            keyExtractor={(item) => item.type}
            contentContainerStyle={styles.filterList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  filter === item.type && styles.filterChipActive,
                ]}
                onPress={() => setFilter(item.type as any)}
              >
                <Text
                  variant="caption"
                  style={{
                    color: filter === item.type ? '#1a365d' : 'rgba(255,255,255,0.8)',
                  }}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </LinearGradient>

      {/* Entries List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.brand.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredEntries}
          keyExtractor={(item) => item.id}
          renderItem={renderEntry}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyListContainer}>
              <Text variant="bodyMedium" color="secondary">
                No entries yet. Tap + to add one.
              </Text>
            </View>
          }
        />
      )}

      {/* Add Entry Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface.primary }]}>
            <View style={styles.modalHeader}>
              <Text variant="h4" color="primary">Add Entry</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text.secondary} />
              </TouchableOpacity>
            </View>

            {/* Entry Type Selection */}
            <Text variant="labelMedium" color="secondary" style={styles.modalLabel}>
              Entry Type
            </Text>
            <View style={styles.typeGrid}>
              {ENTRY_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.type}
                  style={[
                    styles.typeOption,
                    { backgroundColor: theme.colors.surface.secondary },
                    selectedType === type.type && {
                      backgroundColor: `${getEntryTypeColor(type.type)}20`,
                      borderColor: getEntryTypeColor(type.type),
                      borderWidth: 2,
                    },
                  ]}
                  onPress={() => setSelectedType(type.type)}
                >
                  <Ionicons
                    name={type.icon as any}
                    size={20}
                    color={selectedType === type.type
                      ? getEntryTypeColor(type.type)
                      : theme.colors.text.secondary
                    }
                  />
                  <Text
                    variant="caption"
                    style={{
                      color: selectedType === type.type
                        ? getEntryTypeColor(type.type)
                        : theme.colors.text.secondary,
                      marginTop: 4,
                    }}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Title Input */}
            <Text variant="labelMedium" color="secondary" style={styles.modalLabel}>
              Title *
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.surface.secondary,
                  color: theme.colors.text.primary,
                },
              ]}
              placeholder="Enter title"
              placeholderTextColor={theme.colors.text.tertiary}
              value={newTitle}
              onChangeText={setNewTitle}
            />

            {/* Description Input */}
            <Text variant="labelMedium" color="secondary" style={styles.modalLabel}>
              Description
            </Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                {
                  backgroundColor: theme.colors.surface.secondary,
                  color: theme.colors.text.primary,
                },
              ]}
              placeholder="Enter description (optional)"
              placeholderTextColor={theme.colors.text.tertiary}
              value={newDescription}
              onChangeText={setNewDescription}
              multiline
              numberOfLines={3}
            />

            <Button
              title={isSubmitting ? 'Adding...' : 'Add Entry'}
              variant="gradient"
              size="lg"
              fullWidth
              onPress={handleAddEntry}
              disabled={isSubmitting || !newTitle.trim()}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterContainer: {
    marginTop: 16,
  },
  filterList: {
    paddingHorizontal: 16,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#d4af37',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  entryContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineConnector: {
    alignItems: 'center',
    width: 36,
  },
  timelineDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginTop: 4,
  },
  entryCard: {
    flex: 1,
    marginLeft: 12,
    padding: 16,
  },
  completedCard: {
    opacity: 0.7,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  completeButton: {
    padding: 4,
  },
  entryTitle: {
    marginBottom: 4,
  },
  entryDescription: {
    marginBottom: 8,
    lineHeight: 20,
  },
  entryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  entryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dueDate: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyListContainer: {
    padding: 40,
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalLabel: {
    marginBottom: 8,
    marginTop: 16,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  typeOption: {
    width: '30%',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  input: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 24,
  },
});

export default CaseThreadScreen;
