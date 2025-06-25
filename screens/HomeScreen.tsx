import React, { useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { withObservables } from '@nozbe/with-observables';
import { Q } from '@nozbe/watermelondb';
import { useDatabase } from '../db/DatabaseContext';
import { Project } from '../db/models';
import { Ionicons } from '@expo/vector-icons';
import type { RootStackParamList } from '../App';
import { colors, statusColors, useTheme } from '../lib/theme';
import { OptimizedFlatList } from '../components/OptimizedFlatList';
import { performanceMonitor } from '../lib/performance';
import { ProjectCardSkeleton } from '../components/LoadingStates';
import { EnhancedCard, FloatingActionButton, ThemeToggle } from '../components/EnhancedUI';
import { AnimationComponents } from '../lib/animations';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Library'>;

interface HomeScreenProps {
  projects: Project[];
}

function HomeScreen({ projects }: HomeScreenProps) {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { theme } = useTheme();

  // Performance monitoring
  useEffect(() => {
    performanceMonitor.trackScreenLoad('HomeScreen');
  }, []);

  // Enhanced render item with animations and theming
  const renderItem = useCallback(({ item, index }: { item: any; index: number }) => {
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'draft': return theme.colors.statusDraft;
        case 'storyboard': return theme.colors.statusStoryboard;
        case 'rendering': return theme.colors.statusRendering;
        case 'complete': return theme.colors.statusComplete;
        default: return theme.colors.textMuted;
      }
    };

    return (
      <EnhancedCard
        pressable
        onPress={() => navigation.navigate('Storyboard', { id: item.id })}
        style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
        animated={true}
        elevation="sm"
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: theme.colors.text }]}>{item.title}</Text>
            <Text style={[styles.style, { color: theme.colors.textMuted }]}>Style: {item.style}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>
        {item.status === 'rendering' && (
          <View style={[styles.progressBarContainer, { backgroundColor: theme.colors.border }]}>
            <View
              style={[
                styles.progressBar,
                { 
                  width: `${item.progress * 100}%`,
                  backgroundColor: theme.colors.warning,
                },
              ]}
            />
          </View>
        )}
        <Text style={[styles.scenes, { color: theme.colors.textMuted }]}>
          {item.scenes?.length || 0} scenes
        </Text>
      </EnhancedCard>
    );
  }, [theme, navigation]);

  // Empty state component with theme support
  const EmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="film-outline" size={64} color={theme.colors.textMuted} />
      <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No projects yet</Text>
      <Text style={[styles.emptySubtitle, { color: theme.colors.textMuted }]}>
        Tap the + button to create your first video story
      </Text>
    </View>
  );

  // Loading component
  const LoadingState = () => (
    <View style={{ padding: 16 }}>
      {Array.from({ length: 3 }).map((_, index) => (
        <ProjectCardSkeleton key={index} />
      ))}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header with settings button */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>My Projects</Text>
        <View style={styles.headerActions}>
          <EnhancedButton
            title=""
            icon="settings-outline"
            variant="ghost"
            size="sm"
            onPress={() => navigation.navigate('Settings')}
            style={{ marginRight: 8 }}
          />
          <ThemeToggle />
        </View>
      </View>

      <OptimizedFlatList
        data={projects}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        itemHeight={140} // Approximate height of enhanced project cards
        enableVirtualization={true}
        enableLazyLoading={true}
        enablePerformanceMonitoring={true}
        emptyComponent={EmptyState}
        loadingComponent={LoadingState}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        // Performance optimizations
        removeClippedSubviews={true}
        maxToRenderPerBatch={5}
        initialNumToRender={8}
        windowSize={10}
      />
      
      {/* Enhanced floating action button */}
      <FloatingActionButton
        icon="add"
        onPress={() => navigation.navigate('NewProject')}
        position="bottom-right"
        size="md"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 16,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  card: {
    marginBottom: 16,
  },
  title: { 
    fontSize: 18, 
    fontWeight: 'bold',
    marginBottom: 4,
  },
  style: {
    fontSize: 14,
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
    marginTop: 8,
  },
  progressBarContainer: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 12,
  },
  progressBar: {
    height: '100%',
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
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});

// The 'enhance' HOC subscribes to database changes
const enhance = withObservables([], () => {
  const database = useDatabase();
  return {
    // This query is now an observable.
    // Any change in the 'projects' table will re-render the component.
    projects: database.get<Project>('projects').query(
      Q.sortBy('created_at', Q.desc)
    ).observe(),
  };
});

export default enhance(HomeScreen);