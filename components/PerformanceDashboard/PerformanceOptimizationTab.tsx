/**
 * Performance Optimization Tab
 * 
 * Tools and controls for performance optimization
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../lib/theme';
import { OptimizationStrategy } from '../../lib/enhancedPerformance';
import type { PerformanceTabProps } from './types';

export const PerformanceOptimizationTab: React.FC<PerformanceTabProps> = ({
  onOptimization,
}) => {
  const optimizationActions = [
    {
      id: OptimizationStrategy.MEMORY_CLEANUP,
      title: 'Memory Cleanup',
      description: 'Force garbage collection and clear unused memory',
      icon: 'refresh-outline',
      color: colors.primary,
      impact: 'High',
    },
    {
      id: OptimizationStrategy.CACHE_OPTIMIZATION,
      title: 'Cache Optimization',
      description: 'Clear image and module caches to free storage',
      icon: 'archive-outline',
      color: colors.warning,
      impact: 'Medium',
    },
    {
      id: OptimizationStrategy.BUNDLE_OPTIMIZATION,
      title: 'Bundle Optimization',
      description: 'Optimize JavaScript bundle size and loading',
      icon: 'code-outline',
      color: colors.info,
      impact: 'Low',
    },
  ];

  const handleOptimization = async (strategy: OptimizationStrategy, title: string) => {
    Alert.alert(
      'Confirm Optimization',
      `Are you sure you want to run ${title}? This may temporarily affect performance.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Optimize',
          onPress: () => onOptimization?.(strategy),
        },
      ]
    );
  };

  const OptimizationCard: React.FC<{
    action: typeof optimizationActions[0];
  }> = ({ action }) => (
    <TouchableOpacity
      style={styles.optimizationCard}
      onPress={() => handleOptimization(action.id, action.title)}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.iconContainer, { backgroundColor: action.color + '20' }]}>
          <Ionicons name={action.icon as any} size={24} color={action.color} />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle}>{action.title}</Text>
          <Text style={styles.cardDescription}>{action.description}</Text>
        </View>
        <View style={styles.impactBadge}>
          <Text style={[styles.impactText, { color: action.color }]}>
            {action.impact}
          </Text>
        </View>
      </View>
      <View style={styles.cardFooter}>
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Optimizations</Text>
        <Text style={styles.sectionSubtitle}>
          Run these optimizations to improve app performance
        </Text>
        
        {optimizationActions.map((action) => (
          <OptimizationCard key={action.id} action={action} />
        ))}
      </View>

      {/* Performance Tips */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Performance Best Practices</Text>
        
        <View style={styles.tipsContainer}>
          <View style={styles.tipCategory}>
            <Text style={styles.tipCategoryTitle}>Memory Management</Text>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle-outline" size={16} color={colors.success} />
              <Text style={styles.tipText}>
                Regularly clear unused images and data
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle-outline" size={16} color={colors.success} />
              <Text style={styles.tipText}>
                Close background screens when not needed
              </Text>
            </View>
          </View>

          <View style={styles.tipCategory}>
            <Text style={styles.tipCategoryTitle}>Rendering Performance</Text>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle-outline" size={16} color={colors.success} />
              <Text style={styles.tipText}>
                Avoid complex animations on low-end devices
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle-outline" size={16} color={colors.success} />
              <Text style={styles.tipText}>
                Use optimized images and lazy loading
              </Text>
            </View>
          </View>

          <View style={styles.tipCategory}>
            <Text style={styles.tipCategoryTitle}>Network Optimization</Text>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle-outline" size={16} color={colors.success} />
              <Text style={styles.tipText}>
                Enable offline mode for better performance
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle-outline" size={16} color={colors.success} />
              <Text style={styles.tipText}>
                Cache frequently used data locally
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* System Recommendations */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>System Recommendations</Text>
        
        <View style={styles.recommendationCard}>
          <Ionicons name="information-circle-outline" size={20} color={colors.info} />
          <View style={styles.recommendationContent}>
            <Text style={styles.recommendationTitle}>
              Performance monitoring is active
            </Text>
            <Text style={styles.recommendationText}>
              The app is continuously monitoring performance. You can disable this in settings if needed.
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 16,
  },
  optimizationCard: {
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  cardDescription: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 18,
  },
  impactBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: colors.border,
  },
  impactText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardFooter: {
    alignItems: 'flex-end',
  },
  tipsContainer: {
    backgroundColor: colors.card,
    borderRadius: 12,
    overflow: 'hidden',
  },
  tipCategory: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tipCategoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: colors.text,
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  recommendationCard: {
    backgroundColor: colors.card,
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.info,
  },
  recommendationContent: {
    marginLeft: 12,
    flex: 1,
  },
  recommendationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  recommendationText: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 16,
  },
});