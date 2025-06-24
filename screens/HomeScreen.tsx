import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useStore } from '../lib/store';
import { Ionicons } from '@expo/vector-icons';
import type { RootStackParamList } from '../App';
import { colors, statusColors } from '../lib/theme';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Library'>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const projects = useStore((s) => s.projects);

  // TODO: Replace 'any' type with proper interface
  // NOTE: Should use proper TypeScript typing for better type safety
  const renderItem = ({ item }: any) => {
    const getStatusColor = (status: string) => statusColors[status] || colors.mutedText;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('Storyboard', { id: item.id })}
        // COMPLETED: Added accessibility labels (Phase 1 Task 4)
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`Open project ${item.title}`}
        accessibilityHint={`Opens the storyboard for ${item.title} project with ${item.scenes.length} scenes`}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.style}>Style: {item.style}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>
        {item.status === 'rendering' && (
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBar,
                { width: `${item.progress * 100}%` },
              ]}
            />
          </View>
        )}
        <Text style={styles.scenes}>{item.scenes.length} scenes</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={projects}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Ionicons name="film-outline" size={64} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>No projects yet</Text>
            <Text style={styles.emptySubtitle}>Tap the + button to create your first video story</Text>
          </View>
        )}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      />
      <Pressable
        style={styles.fab}
        onPress={() => navigation.navigate('NewProject')}
        // COMPLETED: Added accessibility labels (Phase 1 Task 4)
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Create new project"
        accessibilityHint="Opens the new project creation screen"
      >
        <Ionicons name="add" size={32} color="white" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: colors.background
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: { 
    fontSize: 18, 
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  style: {
    fontSize: 14,
    color: colors.mutedText,
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  scenes: {
    fontSize: 12,
    color: colors.mutedText,
    marginTop: 8,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 12,
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.warning,
    borderRadius: 3,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.mutedText,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});