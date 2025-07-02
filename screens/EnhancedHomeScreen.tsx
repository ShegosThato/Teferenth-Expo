/**
 * Enhanced Home Screen with UX Improvements
 * 
 * Features:
 * - Interactive onboarding and tutorials
 * - Haptic feedback and enhanced animations
 * - Pull-to-refresh functionality
 * - Contextual help and tooltips
 * - Adaptive UI based on user behavior
 * - Enhanced empty states and loading
 */

import React, { useEffect, useMemo, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  RefreshControl,
  Animated,
  Dimensions,
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
import { EnhancedCard, FloatingActionButton, ThemeToggle, EnhancedButton } from '../components/EnhancedUI';
import { AnimationComponents } from '../lib/animations';
import { uxManager, useUXAdaptation, useUserBehavior, HapticPattern } from '../lib/enhancedUX';
import { EnhancedToast, EmptyStateFeedback, ContextualHelp } from '../components/EnhancedUserFeedback';
import { OnboardingTrigger, FeatureDiscovery } from '../components/OnboardingSystem';
import { TutorialManager, defaultTutorialFlows } from '../components/InteractiveTutorial';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Library'>;

interface EnhancedHomeScreenProps {
  projects: Project[];
}

function EnhancedHomeScreen({ projects }: EnhancedHomeScreenProps) {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { theme } = useTheme();
  const adaptation = useUXAdaptation();
  const { trackInteraction, hapticFeedback } = useUserBehavior();
  
  // Enhanced state management
  const [refreshing, setRefreshing] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastConfig, setToastConfig] = useState<any>(null);
  const [showContextualHelp, setShowContextualHelp] = useState(false);
  const [helpPosition, setHelpPosition] = useState({ x: 0, y: 0 });
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);
  
  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;
  const headerAnim = React.useRef(new Animated.Value(-100)).current;

  // Get adaptive spacing and fonts
  const spacing = uxManager.getAdaptiveSpacing();
  const fontSizes = uxManager.getAdaptiveFontSizes();

  // Performance monitoring and UX tracking
  useEffect(() => {
    const startTime = performance.now();
    performanceMonitor.trackScreenLoad('EnhancedHomeScreen');
    
    // Track user interaction
    trackInteraction('home_screen_viewed', {
      projectCount: projects.length,
      userPattern: uxManager.getUserPattern(),
    });

    // Animate screen entrance
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: adaptation.animationDuration,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: adaptation.animationDuration,
        useNativeDriver: true,
      }),
      Animated.timing(headerAnim, {
        toValue: 0,
        duration: adaptation.animationDuration,
        useNativeDriver: true,
      }),
    ]).start();

    // Show welcome toast for new users
    if (uxManager.getUserPattern() === 'first_time_user' && projects.length === 0) {
      setTimeout(() => {
        showWelcomeToast();
      }, 1000);
    }

    performanceMonitor.trackOperation('enhanced_home_screen_init', performance.now() - startTime);
  }, [projects.length, adaptation.animationDuration]);

  // Enhanced refresh functionality with haptic feedback
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    hapticFeedback(HapticPattern.LIGHT);
    trackInteraction('home_screen_refresh');
    
    try {
      // Simulate refresh delay for better UX
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      showToastMessage({
        type: 'success',
        title: 'Projects updated',
        duration: 2000,
        haptic: HapticPattern.SUCCESS,
      });
    } catch (error) {
      showToastMessage({
        type: 'error',
        title: 'Failed to refresh',
        message: 'Please try again',
        duration: 3000,
        haptic: HapticPattern.ERROR,
      });
    } finally {
      setRefreshing(false);
    }
  }, [hapticFeedback, trackInteraction]);

  // Toast management
  const showToastMessage = (config: any) => {
    setToastConfig(config);
    setShowToast(true);
  };

  const showWelcomeToast = () => {
    showToastMessage({
      type: 'info',
      title: 'Welcome to Tefereth Scripts!',
      message: 'Create your first video storyboard by tapping the + button',
      duration: 5000,
      action: {
        label: 'Get Started',
        onPress: () => {
          hapticFeedback(HapticPattern.SELECTION);
          navigation.navigate('NewProject');
        },
      },
      haptic: HapticPattern.LIGHT,
    });
  };

  // Enhanced project interaction with haptic feedback
  const handleProjectPress = useCallback((project: Project) => {
    hapticFeedback(HapticPattern.SELECTION);
    trackInteraction('project_opened', {
      projectId: project.id,
      projectStatus: project.status,
    });
    
    setSelectedProject(project.id);
    navigation.navigate('Storyboard', { id: project.id });
  }, [hapticFeedback, trackInteraction, navigation]);

  // Long press for contextual actions
  const handleProjectLongPress = useCallback((project: Project, event: any) => {
    hapticFeedback(HapticPattern.MEDIUM);
    trackInteraction('project_long_press', { projectId: project.id });
    
    // Show contextual help
    setHelpPosition({ x: event.nativeEvent.pageX, y: event.nativeEvent.pageY });
    setShowContextualHelp(true);
  }, [hapticFeedback, trackInteraction]);

  // Enhanced render item with animations and improved interactions
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

    const getStatusIcon = (status: string) => {
      switch (status) {
        case 'draft': return 'document-text-outline';
        case 'storyboard': return 'film-outline';
        case 'rendering': return 'hourglass-outline';
        case 'complete': return 'checkmark-circle-outline';
        default: return 'ellipse-outline';
      }
    };

    return (
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        <OnboardingTrigger
          stepId={`project_card_${index}`}
          onLayout={(event) => {
            // Store layout for potential onboarding highlights
          }}
        >
          <EnhancedCard
            pressable
            onPress={() => handleProjectPress(item)}
            onLongPress={(event) => handleProjectLongPress(item, event)}
            style={[
              styles.card,
              {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
                padding: spacing.md,
                marginBottom: spacing.md,
              },
              selectedProject === item.id && styles.selectedCard,
            ]}
            animated={true}
            elevation="sm"
          >
            <View style={styles.cardHeader}>
              <View style={styles.cardContent}>
                <Text style={[styles.title, { color: theme.colors.text, fontSize: fontSizes.lg }]}>
                  {item.title}
                </Text>
                <Text style={[styles.style, { color: theme.colors.textMuted, fontSize: fontSizes.sm }]}>
                  Style: {item.style}
                </Text>
              </View>
              
              <View style={styles.cardStatus}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                  <Ionicons
                    name={getStatusIcon(item.status)}
                    size={12}
                    color="white"
                    style={{ marginRight: 4 }}
                  />
                  <Text style={[styles.statusText, { fontSize: fontSizes.xs }]}>
                    {item.status}
                  </Text>
                </View>
              </View>
            </View>

            {/* Progress bar for rendering projects */}
            {item.status === 'rendering' && (
              <View style={[styles.progressBarContainer, { backgroundColor: theme.colors.border, marginTop: spacing.sm }]}>
                <Animated.View
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

            {/* Project metadata */}
            <View style={[styles.cardFooter, { marginTop: spacing.sm }]}>
              <View style={styles.metadataItem}>
                <Ionicons name="film-outline" size={14} color={theme.colors.textMuted} />
                <Text style={[styles.metadataText, { color: theme.colors.textMuted, fontSize: fontSizes.xs }]}>
                  {item.scenes?.length || 0} scenes
                </Text>
              </View>
              
              <View style={styles.metadataItem}>
                <Ionicons name="time-outline" size={14} color={theme.colors.textMuted} />
                <Text style={[styles.metadataText, { color: theme.colors.textMuted, fontSize: fontSizes.xs }]}>
                  {formatDate(item.updatedAt)}
                </Text>
              </View>
            </View>
          </EnhancedCard>
        </OnboardingTrigger>
      </Animated.View>
    );
  }, [theme, navigation, selectedProject, spacing, fontSizes, fadeAnim, slideAnim, handleProjectPress, handleProjectLongPress]);

  // Enhanced empty state with better guidance
  const EnhancedEmptyState = () => (
    <EmptyStateFeedback
      icon="film-outline"
      title="No projects yet"
      description="Create your first video storyboard and bring your stories to life with AI-powered scene generation."
      action={{
        label: "Create First Project",
        onPress: () => {
          hapticFeedback(HapticPattern.SELECTION);
          trackInteraction('empty_state_create_project');
          navigation.navigate('NewProject');
        },
      }}
      style={{ flex: 1 }}
    />
  );

  // Enhanced loading state
  const EnhancedLoadingState = () => (
    <Animated.View style={{ opacity: fadeAnim, padding: spacing.md }}>
      {Array.from({ length: 3 }).map((_, index) => (
        <ProjectCardSkeleton key={index} />
      ))}
    </Animated.View>
  );

  // Format date helper
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Enhanced header with animations */}
      <Animated.View
        style={[
          styles.header,
          {
            transform: [{ translateY: headerAnim }],
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
          },
        ]}
      >
        <Text style={[styles.headerTitle, { color: theme.colors.text, fontSize: fontSizes.xl }]}>
          My Projects
        </Text>
        
        <View style={styles.headerActions}>
          <FeatureDiscovery
            featureId="performance_dashboard"
            title="Performance Dashboard"
            description="Monitor app performance and optimize your experience"
          >
            <EnhancedButton
              title=""
              icon="speedometer-outline"
              variant="ghost"
              size="sm"
              onPress={() => {
                hapticFeedback(HapticPattern.LIGHT);
                trackInteraction('performance_dashboard_opened');
                // Toggle performance dashboard
              }}
              style={{ marginRight: spacing.xs }}
            />
          </FeatureDiscovery>

          <OnboardingTrigger stepId="settings_button">
            <EnhancedButton
              title=""
              icon="settings-outline"
              variant="ghost"
              size="sm"
              onPress={() => {
                hapticFeedback(HapticPattern.SELECTION);
                navigation.navigate('Settings');
              }}
              style={{ marginRight: spacing.xs }}
            />
          </OnboardingTrigger>
          
          <ThemeToggle />
        </View>
      </Animated.View>

      {/* Enhanced project list with pull-to-refresh */}
      <OptimizedFlatList
        data={projects}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        itemHeight={140}
        enableVirtualization={true}
        enableLazyLoading={true}
        enablePerformanceMonitoring={true}
        emptyComponent={EnhancedEmptyState}
        loadingComponent={EnhancedLoadingState}
        contentContainerStyle={{ 
          padding: spacing.md, 
          flexGrow: 1,
          paddingBottom: spacing.xl + 60, // Extra space for FAB
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
        // Performance optimizations
        removeClippedSubviews={true}
        maxToRenderPerBatch={5}
        initialNumToRender={8}
        windowSize={10}
      />
      
      {/* Enhanced floating action button with onboarding */}
      <OnboardingTrigger stepId="new_project_button">
        <FloatingActionButton
          icon="add"
          onPress={() => {
            hapticFeedback(HapticPattern.SELECTION);
            trackInteraction('new_project_button_pressed');
            navigation.navigate('NewProject');
          }}
          position="bottom-right"
          size="md"
          style={{ bottom: spacing.lg, right: spacing.lg }}
        />
      </OnboardingTrigger>

      {/* Toast notifications */}
      {showToast && toastConfig && (
        <EnhancedToast
          {...toastConfig}
          onDismiss={() => setShowToast(false)}
        />
      )}

      {/* Contextual help */}
      <ContextualHelp
        visible={showContextualHelp}
        title="Project Actions"
        content="Long press any project to see available actions like duplicate, delete, or export."
        position={helpPosition}
        onDismiss={() => setShowContextualHelp(false)}
      />

      {/* Tutorial system */}
      <TutorialManager
        flows={defaultTutorialFlows}
        autoStart={uxManager.getUserPattern() === 'first_time_user'}
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
    paddingTop: 16,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontWeight: 'bold',
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardContent: {
    flex: 1,
  },
  cardStatus: {
    alignItems: 'flex-end',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { 
    fontWeight: 'bold',
    marginBottom: 4,
  },
  style: {
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  progressBarContainer: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metadataText: {
    marginLeft: 4,
    fontWeight: '500',
  },
});

// Enhanced HOC with database observables
const enhance = withObservables([], () => {
  const database = useDatabase();
  return {
    projects: database.get<Project>('projects').query(
      Q.sortBy('updated_at', Q.desc)
    ).observe(),
  };
});

export default enhance(EnhancedHomeScreen);