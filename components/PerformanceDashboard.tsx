/**
 * Performance Dashboard Component
 * 
 * Provides real-time performance monitoring and metrics display
 * for development and debugging purposes.
 * 
 * Phase 2 Task 2: Performance Optimizations
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  Switch,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../lib/theme';
import { 
  performanceMonitor, 
  usePerformanceMonitor,
  PerformanceMetrics 
} from '../lib/performance';
import { 
  BundleAnalyzer, 
  AssetOptimizer, 
  TreeShaker,
  PerformanceBudget 
} from '../lib/bundleOptimization';
import { imageCache } from '../lib/imageCache';

interface PerformanceDashboardProps {
  visible: boolean;
  onClose: () => void;
}

export const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({
  visible,
  onClose
}) => {
  const { metrics, averageMetrics } = usePerformanceMonitor();
  const [activeTab, setActiveTab] = useState<'overview' | 'memory' | 'bundle' | 'cache'>('overview');
  const [bundleAnalysis, setBundleAnalysis] = useState<any>(null);
  const [cacheStats, setCacheStats] = useState<any>(null);
  const [budgetCheck, setBudgetCheck] = useState<any>(null);

  useEffect(() => {
    if (visible) {
      loadPerformanceData();
    }
  }, [visible]);

  const loadPerformanceData = async () => {
    try {
      // Load bundle analysis
      const analysis = await BundleAnalyzer.analyzeBundleSize();
      setBundleAnalysis(analysis);

      // Load cache statistics
      const imageCacheStats = imageCache.getPerformanceMetrics();
      const assetOptimizerStats = AssetOptimizer.getOptimizationStats();
      setCacheStats({ imageCacheStats, assetOptimizerStats });

      // Check performance budget
      const budget = await PerformanceBudget.checkBudget();
      setBudgetCheck(budget);
    } catch (error) {
      console.error('Failed to load performance data:', error);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (ms: number): string => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const clearCaches = () => {
    Alert.alert(
      'Clear Caches',
      'This will clear all cached data. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            imageCache.clearCache();
            performanceMonitor.clearMetrics();
            loadPerformanceData();
          }
        }
      ]
    );
  };

  const renderOverviewTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Performance Overview</Text>
        
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Average Render Time</Text>
          <Text style={styles.metricValue}>
            {averageMetrics.renderTime ? formatTime(averageMetrics.renderTime) : 'N/A'}
          </Text>
        </View>

        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Memory Usage</Text>
          <Text style={styles.metricValue}>
            {averageMetrics.memoryUsage ? 
              `${averageMetrics.memoryUsage.percentage.toFixed(1)}%` : 'N/A'}
          </Text>
        </View>

        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Total Metrics Collected</Text>
          <Text style={styles.metricValue}>{metrics.length}</Text>
        </View>
      </View>

      {budgetCheck && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance Budget</Text>
          <View style={[styles.budgetStatus, { 
            backgroundColor: budgetCheck.passed ? colors.success : colors.danger 
          }]}>
            <Text style={styles.budgetStatusText}>
              {budgetCheck.passed ? '✅ Budget Passed' : '❌ Budget Exceeded'}
            </Text>
          </View>
          
          {budgetCheck.violations.map((violation: string, index: number) => (
            <Text key={index} style={styles.violation}>• {violation}</Text>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <Pressable style={styles.actionButton} onPress={clearCaches}>
          <Ionicons name="trash-outline" size={20} color={colors.danger} />
          <Text style={styles.actionButtonText}>Clear All Caches</Text>
        </Pressable>
        
        <Pressable style={styles.actionButton} onPress={loadPerformanceData}>
          <Ionicons name="refresh-outline" size={20} color={colors.primary} />
          <Text style={styles.actionButtonText}>Refresh Data</Text>
        </Pressable>
      </View>
    </ScrollView>
  );

  const renderMemoryTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Memory Usage</Text>
        
        {metrics.slice(0, 10).map((metric, index) => (
          <View key={index} style={styles.metricRow}>
            <Text style={styles.metricLabel}>
              {new Date(metric.timestamp).toLocaleTimeString()}
            </Text>
            <Text style={styles.metricValue}>
              {metric.memoryUsage ? 
                `${metric.memoryUsage.percentage.toFixed(1)}%` : 'N/A'}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  const renderBundleTab = () => (
    <ScrollView style={styles.tabContent}>
      {bundleAnalysis && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bundle Analysis</Text>
          
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Total Size</Text>
            <Text style={styles.metricValue}>{formatBytes(bundleAnalysis.totalSize)}</Text>
          </View>

          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>JavaScript</Text>
            <Text style={styles.metricValue}>{formatBytes(bundleAnalysis.jsSize)}</Text>
          </View>

          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Images</Text>
            <Text style={styles.metricValue}>{formatBytes(bundleAnalysis.imageSize)}</Text>
          </View>

          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Other Assets</Text>
            <Text style={styles.metricValue}>{formatBytes(bundleAnalysis.assetSize)}</Text>
          </View>
        </View>
      )}

      {bundleAnalysis?.recommendations && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommendations</Text>
          {bundleAnalysis.recommendations.map((rec: string, index: number) => (
            <Text key={index} style={styles.recommendation}>• {rec}</Text>
          ))}
        </View>
      )}
    </ScrollView>
  );

  const renderCacheTab = () => (
    <ScrollView style={styles.tabContent}>
      {cacheStats && (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Image Cache</Text>
            
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Total Images</Text>
              <Text style={styles.metricValue}>{cacheStats.imageCacheStats.totalImages}</Text>
            </View>

            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Cache Hit Rate</Text>
              <Text style={styles.metricValue}>
                {cacheStats.imageCacheStats.hitRate.toFixed(1)}%
              </Text>
            </View>

            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Average Load Time</Text>
              <Text style={styles.metricValue}>
                {formatTime(cacheStats.imageCacheStats.averageLoadTime)}
              </Text>
            </View>

            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Memory Cache Size</Text>
              <Text style={styles.metricValue}>{cacheStats.imageCacheStats.memoryCacheSize}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Asset Optimization</Text>
            
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Cached Images</Text>
              <Text style={styles.metricValue}>{cacheStats.assetOptimizerStats.cachedImages}</Text>
            </View>

            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Optimized Assets</Text>
              <Text style={styles.metricValue}>{cacheStats.assetOptimizerStats.optimizedAssets}</Text>
            </View>

            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Cache Hit Rate</Text>
              <Text style={styles.metricValue}>
                {cacheStats.assetOptimizerStats.cacheHitRate.toFixed(1)}%
              </Text>
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview': return renderOverviewTab();
      case 'memory': return renderMemoryTab();
      case 'bundle': return renderBundleTab();
      case 'cache': return renderCacheTab();
      default: return renderOverviewTab();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Performance Dashboard</Text>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.text} />
          </Pressable>
        </View>

        <View style={styles.tabs}>
          {[
            { key: 'overview', label: 'Overview', icon: 'speedometer-outline' },
            { key: 'memory', label: 'Memory', icon: 'hardware-chip-outline' },
            { key: 'bundle', label: 'Bundle', icon: 'cube-outline' },
            { key: 'cache', label: 'Cache', icon: 'layers-outline' }
          ].map(tab => (
            <Pressable
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.activeTab]}
              onPress={() => setActiveTab(tab.key as any)}
            >
              <Ionicons 
                name={tab.icon as any} 
                size={16} 
                color={activeTab === tab.key ? colors.primary : colors.mutedText} 
              />
              <Text style={[
                styles.tabText,
                activeTab === tab.key && styles.activeTabText
              ]}>
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {renderTabContent()}
      </View>
    </Modal>
  );
};

// Performance monitoring toggle for development
export const PerformanceMonitorToggle: React.FC = () => {
  const [showDashboard, setShowDashboard] = useState(false);

  if (!__DEV__) {
    return null; // Only show in development
  }

  return (
    <>
      <Pressable
        style={styles.floatingButton}
        onPress={() => setShowDashboard(true)}
      >
        <Ionicons name="speedometer-outline" size={20} color="white" />
      </Pressable>

      <PerformanceDashboard
        visible={showDashboard}
        onClose={() => setShowDashboard(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  closeButton: {
    padding: 8,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 4,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 12,
    color: colors.mutedText,
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  metricLabel: {
    fontSize: 14,
    color: colors.mutedText,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  budgetStatus: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  budgetStatusText: {
    color: 'white',
    fontWeight: '600',
    textAlign: 'center',
  },
  violation: {
    fontSize: 12,
    color: colors.danger,
    marginBottom: 4,
  },
  recommendation: {
    fontSize: 12,
    color: colors.warning,
    marginBottom: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: colors.card,
    borderRadius: 8,
    marginBottom: 8,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    color: colors.text,
  },
  floatingButton: {
    position: 'absolute',
    top: 100,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
    zIndex: 1000,
  },
});