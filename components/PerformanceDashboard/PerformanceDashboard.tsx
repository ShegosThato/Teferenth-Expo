/**
 * Main Performance Dashboard Component
 * 
 * Simplified main component that orchestrates the dashboard tabs
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Switch,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../lib/theme';
import { 
  enhancedPerformanceMonitor,
  usePerformanceMonitor,
  OptimizationStrategy,
} from '../../lib/enhancedPerformance';
import { memoryManager } from '../../lib/memoryManagement';
import { imageOptimizer } from '../../lib/enhancedImageOptimization';
import { codeSplitter } from '../../lib/advancedCodeSplitting';

import { PerformanceOverviewTab } from './PerformanceOverviewTab';
import { PerformanceMemoryTab } from './PerformanceMemoryTab';
import { PerformanceOptimizationTab } from './PerformanceOptimizationTab';
import type { 
  PerformanceDashboardProps, 
  PerformanceTabType, 
  PerformanceStatsData,
  TabConfig 
} from './types';

const { width: screenWidth } = Dimensions.get('window');

export const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({
  visible,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<PerformanceTabType>('overview');
  const [isMonitoring, setIsMonitoring] = useState(true);
  const { metrics, report } = usePerformanceMonitor();
  const [statsData, setStatsData] = useState<PerformanceStatsData>({
    memory: memoryManager.getMemoryStats(),
    images: imageOptimizer.getCacheStats(),
    modules: codeSplitter.getCacheStats(),
    issues: [],
  });

  // Tab configuration
  const tabs: TabConfig[] = [
    { id: 'overview', title: 'Overview', icon: 'speedometer-outline', component: PerformanceOverviewTab },
    { id: 'memory', title: 'Memory', icon: 'hardware-chip-outline', component: PerformanceMemoryTab },
    { id: 'optimization', title: 'Optimize', icon: 'build-outline', component: PerformanceOptimizationTab },
  ];

  // Update stats periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setStatsData({
        memory: memoryManager.getMemoryStats(),
        images: imageOptimizer.getCacheStats(),
        modules: codeSplitter.getCacheStats(),
        issues: enhancedPerformanceMonitor.getActiveIssues(),
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const toggleMonitoring = () => {
    if (isMonitoring) {
      enhancedPerformanceMonitor.stopMonitoring();
    } else {
      enhancedPerformanceMonitor.startMonitoring();
    }
    setIsMonitoring(!isMonitoring);
  };

  const handleOptimization = async (strategy: OptimizationStrategy) => {
    try {
      switch (strategy) {
        case OptimizationStrategy.MEMORY_CLEANUP:
          await memoryManager.forceGC();
          Alert.alert('Success', 'Memory cleanup completed');
          break;
        case OptimizationStrategy.CACHE_OPTIMIZATION:
          await imageOptimizer.clearCache();
          codeSplitter.clearCache();
          Alert.alert('Success', 'Cache optimization completed');
          break;
        default:
          Alert.alert('Info', 'Optimization strategy not implemented');
      }
    } catch (error) {
      Alert.alert('Error', `Optimization failed: ${error}`);
    }
  };

  const renderTabContent = () => {
    const activeTabConfig = tabs.find(tab => tab.id === activeTab);
    if (!activeTabConfig) return null;

    const TabComponent = activeTabConfig.component;
    return (
      <TabComponent
        isActive={true}
        metrics={metrics}
        memoryStats={statsData.memory}
        onOptimization={handleOptimization}
      />
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Performance Dashboard</Text>
          <View style={styles.headerControls}>
            <View style={styles.monitoringToggle}>
              <Text style={styles.toggleLabel}>Monitor</Text>
              <Switch
                value={isMonitoring}
                onValueChange={toggleMonitoring}
                trackColor={{ false: colors.border, true: colors.success }}
                thumbColor={isMonitoring ? colors.background : colors.textMuted}
              />
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tab,
                activeTab === tab.id && styles.activeTab,
              ]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Ionicons
                name={tab.icon as any}
                size={20}
                color={activeTab === tab.id ? colors.primary : colors.textMuted}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab.id && styles.activeTabText,
                ]}
              >
                {tab.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        <View style={styles.content}>
          {renderTabContent()}
        </View>
      </View>
    </Modal>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingTop: 60, // Account for status bar
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  headerControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  monitoringToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  toggleLabel: {
    fontSize: 14,
    color: colors.textMuted,
    marginRight: 8,
  },
  closeButton: {
    padding: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 12,
    color: colors.textMuted,
    marginLeft: 4,
    fontWeight: '500',
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
});