/**
 * Performance Overview Tab
 * 
 * Displays key performance metrics and system health overview
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../lib/theme';
import type { PerformanceTabProps } from './types';

export const PerformanceOverviewTab: React.FC<PerformanceTabProps> = ({
  metrics,
  memoryStats,
}) => {
  const getHealthStatus = () => {
    if (!metrics || !memoryStats) return { status: 'unknown', color: colors.textMuted };
    
    const memoryUsage = (memoryStats.used / memoryStats.total) * 100;
    const avgRenderTime = metrics.renderTimes.reduce((a, b) => a + b, 0) / metrics.renderTimes.length;
    
    if (memoryUsage > 80 || avgRenderTime > 100) {
      return { status: 'poor', color: colors.danger };
    } else if (memoryUsage > 60 || avgRenderTime > 50) {
      return { status: 'fair', color: colors.warning };
    } else {
      return { status: 'good', color: colors.success };
    }
  };

  const healthStatus = getHealthStatus();

  const MetricCard: React.FC<{
    title: string;
    value: string;
    icon: string;
    color?: string;
    subtitle?: string;
  }> = ({ title, value, icon, color = colors.primary, subtitle }) => (
    <View style={styles.metricCard}>
      <View style={styles.metricHeader}>
        <Ionicons name={icon as any} size={20} color={color} />
        <Text style={styles.metricTitle}>{title}</Text>
      </View>
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
      {subtitle && <Text style={styles.metricSubtitle}>{subtitle}</Text>}
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* System Health */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>System Health</Text>
        <View style={[styles.healthCard, { borderLeftColor: healthStatus.color }]}>
          <View style={styles.healthHeader}>
            <Ionicons 
              name="pulse-outline" 
              size={24} 
              color={healthStatus.color} 
            />
            <Text style={[styles.healthStatus, { color: healthStatus.color }]}>
              {healthStatus.status.toUpperCase()}
            </Text>
          </View>
          <Text style={styles.healthDescription}>
            Overall system performance is {healthStatus.status}
          </Text>
        </View>
      </View>

      {/* Key Metrics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Key Metrics</Text>
        <View style={styles.metricsGrid}>
          <MetricCard
            title="Memory Usage"
            value={memoryStats ? `${Math.round((memoryStats.used / memoryStats.total) * 100)}%` : 'N/A'}
            icon="hardware-chip-outline"
            color={memoryStats && (memoryStats.used / memoryStats.total) > 0.8 ? colors.danger : colors.success}
            subtitle={memoryStats ? `${Math.round(memoryStats.used / 1024 / 1024)}MB used` : undefined}
          />
          
          <MetricCard
            title="Avg Render Time"
            value={metrics ? `${Math.round(metrics.renderTimes.reduce((a, b) => a + b, 0) / metrics.renderTimes.length)}ms` : 'N/A'}
            icon="speedometer-outline"
            color={metrics && (metrics.renderTimes.reduce((a, b) => a + b, 0) / metrics.renderTimes.length) > 50 ? colors.warning : colors.success}
          />
          
          <MetricCard
            title="JS Heap Size"
            value={metrics ? `${Math.round(metrics.jsHeapSizeUsed / 1024 / 1024)}MB` : 'N/A'}
            icon="code-outline"
            color={colors.info}
          />
          
          <MetricCard
            title="Bundle Size"
            value={metrics ? `${Math.round(metrics.bundleSize / 1024)}KB` : 'N/A'}
            icon="archive-outline"
            color={colors.primary}
          />
        </View>
      </View>

      {/* Performance Trends */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Performance</Text>
        <View style={styles.trendsCard}>
          <View style={styles.trendItem}>
            <Text style={styles.trendLabel}>Screen Loads</Text>
            <Text style={styles.trendValue}>
              {metrics ? metrics.screenLoads.length : 0} today
            </Text>
          </View>
          <View style={styles.trendItem}>
            <Text style={styles.trendLabel}>API Calls</Text>
            <Text style={styles.trendValue}>
              {metrics ? metrics.apiCalls.length : 0} total
            </Text>
          </View>
          <View style={styles.trendItem}>
            <Text style={styles.trendLabel}>Errors</Text>
            <Text style={[styles.trendValue, { color: colors.danger }]}>
              {metrics ? metrics.errors.length : 0} errors
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
    marginBottom: 12,
  },
  healthCard: {
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
  },
  healthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  healthStatus: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  healthDescription: {
    fontSize: 14,
    color: colors.textMuted,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    flex: 1,
    minWidth: '45%',
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricTitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginLeft: 8,
    fontWeight: '500',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  metricSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
  },
  trendsCard: {
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
  },
  trendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  trendLabel: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  trendValue: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: '600',
  },
});