/**
 * Enhanced Performance Dashboard
 * 
 * Comprehensive performance monitoring dashboard that displays real-time
 * metrics, optimization suggestions, and system health information.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Switch,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../lib/theme';
import { 
  enhancedPerformanceMonitor,
  usePerformanceMonitor,
  EnhancedPerformanceMetrics,
  PerformanceIssue,
  OptimizationStrategy,
} from '../lib/enhancedPerformance';
import { codeSplitter } from '../lib/advancedCodeSplitting';
import { imageOptimizer } from '../lib/enhancedImageOptimization';
import { memoryManager, MemoryPressure, MemoryCategory } from '../lib/memoryManagement';

interface EnhancedPerformanceDashboardProps {
  visible: boolean;
  onClose: () => void;
}

type TabType = 'overview' | 'memory' | 'images' | 'modules' | 'issues' | 'optimization';

export const EnhancedPerformanceDashboard: React.FC<EnhancedPerformanceDashboardProps> = ({
  visible,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isMonitoring, setIsMonitoring] = useState(true);
  const { metrics, report } = usePerformanceMonitor();
  const [memoryStats, setMemoryStats] = useState(memoryManager.getMemoryStats());
  const [imageStats, setImageStats] = useState(imageOptimizer.getCacheStats());
  const [moduleStats, setModuleStats] = useState(codeSplitter.getCacheStats());

  // Update stats periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setMemoryStats(memoryManager.getMemoryStats());
      setImageStats(imageOptimizer.getCacheStats());
      setModuleStats(codeSplitter.getCacheStats());
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
          Alert.alert('Info', `Optimization strategy: ${strategy}`);
      }
    } catch (error) {
      Alert.alert('Error', 'Optimization failed');
    }
  };

  const renderTabButton = (tab: TabType, icon: string, label: string) => (
    <TouchableOpacity
      key={tab}
      style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
      onPress={() => setActiveTab(tab)}
    >
      <Ionicons 
        name={icon as any} 
        size={20} 
        color={activeTab === tab ? colors.primary : '#666'} 
      />
      <Text style={[styles.tabLabel, activeTab === tab && styles.activeTabLabel]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderOverviewTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>System Overview</Text>
        
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{report.summary.averageFPS.toFixed(0)}</Text>
            <Text style={styles.metricLabel}>FPS</Text>
            <View style={[styles.metricIndicator, { 
              backgroundColor: report.summary.averageFPS > 45 ? '#4CAF50' : '#FF9800' 
            }]} />
          </View>
          
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{report.summary.averageMemoryUsage.toFixed(0)}%</Text>
            <Text style={styles.metricLabel}>Memory</Text>
            <View style={[styles.metricIndicator, { 
              backgroundColor: report.summary.averageMemoryUsage < 80 ? '#4CAF50' : '#F44336' 
            }]} />
          </View>
          
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{report.summary.averageRenderTime.toFixed(0)}ms</Text>
            <Text style={styles.metricLabel}>Render</Text>
            <View style={[styles.metricIndicator, { 
              backgroundColor: report.summary.averageRenderTime < 16 ? '#4CAF50' : '#FF9800' 
            }]} />
          </View>
          
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{report.summary.totalIssues}</Text>
            <Text style={styles.metricLabel}>Issues</Text>
            <View style={[styles.metricIndicator, { 
              backgroundColor: report.summary.totalIssues === 0 ? '#4CAF50' : '#F44336' 
            }]} />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleOptimization(OptimizationStrategy.MEMORY_CLEANUP)}
          >
            <Ionicons name="trash-outline" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Clean Memory</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleOptimization(OptimizationStrategy.CACHE_OPTIMIZATION)}
          >
            <Ionicons name="refresh-outline" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Clear Cache</Text>
          </TouchableOpacity>
        </View>
      </View>

      {report.recommendations.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommendations</Text>
          {report.recommendations.map((recommendation, index) => (
            <View key={index} style={styles.recommendationItem}>
              <Ionicons name="bulb-outline" size={16} color="#FF9800" />
              <Text style={styles.recommendationText}>{recommendation}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );

  const renderMemoryTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Memory Usage</Text>
        
        <View style={styles.memoryOverview}>
          <View style={styles.memoryBar}>
            <View 
              style={[
                styles.memoryBarFill, 
                { 
                  width: `${(memoryStats.totalAllocated / (memoryStats.totalAllocated + memoryStats.availableMemory)) * 100}%`,
                  backgroundColor: memoryStats.memoryPressure === MemoryPressure.CRITICAL ? '#F44336' : 
                                 memoryStats.memoryPressure === MemoryPressure.HIGH ? '#FF9800' : '#4CAF50'
                }
              ]} 
            />
          </View>
          <Text style={styles.memoryText}>
            {(memoryStats.totalAllocated / 1024 / 1024).toFixed(1)}MB / {((memoryStats.totalAllocated + memoryStats.availableMemory) / 1024 / 1024).toFixed(1)}MB
          </Text>
          <Text style={styles.memoryPressure}>
            Pressure: {memoryStats.memoryPressure}
          </Text>
        </View>

        <Text style={styles.subsectionTitle}>Allocations by Category</Text>
        {Object.entries(memoryStats.allocationsByCategory).map(([category, size]) => (
          <View key={category} style={styles.categoryItem}>
            <Text style={styles.categoryName}>{category}</Text>
            <Text style={styles.categorySize}>{(size / 1024 / 1024).toFixed(1)}MB</Text>
          </View>
        ))}

        <Text style={styles.subsectionTitle}>Largest Allocations</Text>
        {memoryStats.largestAllocations.map((allocation, index) => (
          <View key={allocation.id} style={styles.allocationItem}>
            <Text style={styles.allocationId}>{allocation.id}</Text>
            <Text style={styles.allocationSize}>{(allocation.size / 1024).toFixed(0)}KB</Text>
            <Text style={styles.allocationAge}>{(allocation.age / 1000 / 60).toFixed(0)}m</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  const renderImagesTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Image Cache</Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{(imageStats.totalSize / 1024 / 1024).toFixed(1)}MB</Text>
            <Text style={styles.statLabel}>Cache Size</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{imageStats.entryCount}</Text>
            <Text style={styles.statLabel}>Images</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{(imageStats.hitRate * 100).toFixed(0)}%</Text>
            <Text style={styles.statLabel}>Hit Rate</Text>
          </View>
        </View>

        <Text style={styles.subsectionTitle}>Top Images</Text>
        {imageStats.topImages.map((image, index) => (
          <View key={image.key} style={styles.imageItem}>
            <Text style={styles.imageKey} numberOfLines={1}>{image.key}</Text>
            <Text style={styles.imageAccess}>{image.accessCount} hits</Text>
            <Text style={styles.imageSize}>{(image.size / 1024).toFixed(0)}KB</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  const renderModulesTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Module Cache</Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{(moduleStats.totalSize / 1024 / 1024).toFixed(1)}MB</Text>
            <Text style={styles.statLabel}>Cache Size</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{moduleStats.moduleCount}</Text>
            <Text style={styles.statLabel}>Modules</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{(moduleStats.hitRate * 100).toFixed(0)}%</Text>
            <Text style={styles.statLabel}>Hit Rate</Text>
          </View>
        </View>

        <Text style={styles.subsectionTitle}>Top Modules</Text>
        {moduleStats.topModules.map((module, index) => (
          <View key={module.name} style={styles.moduleItem}>
            <Text style={styles.moduleName}>{module.name}</Text>
            <Text style={styles.moduleAccess}>{module.accessCount} hits</Text>
            <Text style={styles.moduleSize}>{(module.size / 1024).toFixed(0)}KB</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  const renderIssuesTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Performance Issues</Text>
        
        {report.activeIssues.length === 0 ? (
          <View style={styles.noIssues}>
            <Ionicons name="checkmark-circle" size={48} color="#4CAF50" />
            <Text style={styles.noIssuesText}>No performance issues detected</Text>
          </View>
        ) : (
          report.activeIssues.map((issue) => (
            <View key={issue.id} style={styles.issueItem}>
              <View style={styles.issueHeader}>
                <Ionicons 
                  name={issue.severity === 'critical' ? 'alert-circle' : 'warning'} 
                  size={20} 
                  color={issue.severity === 'critical' ? '#F44336' : '#FF9800'} 
                />
                <Text style={styles.issueType}>{issue.type}</Text>
                <Text style={styles.issueSeverity}>{issue.severity}</Text>
              </View>
              <Text style={styles.issueDescription}>{issue.description}</Text>
              <View style={styles.issueStrategies}>
                {issue.suggestedStrategies.map((strategy, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.strategyButton}
                    onPress={() => handleOptimization(strategy)}
                  >
                    <Text style={styles.strategyText}>{strategy.replace('_', ' ')}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );

  const renderOptimizationTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Optimization Tools</Text>
        
        <View style={styles.optimizationGrid}>
          {Object.values(OptimizationStrategy).map((strategy) => (
            <TouchableOpacity
              key={strategy}
              style={styles.optimizationCard}
              onPress={() => handleOptimization(strategy)}
            >
              <Ionicons 
                name={this.getStrategyIcon(strategy)} 
                size={24} 
                color={colors.primary} 
              />
              <Text style={styles.optimizationTitle}>
                {strategy.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Text>
              <Text style={styles.optimizationDescription}>
                {this.getStrategyDescription(strategy)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );

  const getStrategyIcon = (strategy: OptimizationStrategy): string => {
    switch (strategy) {
      case OptimizationStrategy.REDUCE_RENDERS: return 'layers-outline';
      case OptimizationStrategy.OPTIMIZE_IMAGES: return 'image-outline';
      case OptimizationStrategy.LAZY_LOAD: return 'time-outline';
      case OptimizationStrategy.CACHE_OPTIMIZATION: return 'archive-outline';
      case OptimizationStrategy.BUNDLE_SPLITTING: return 'git-branch-outline';
      case OptimizationStrategy.MEMORY_CLEANUP: return 'trash-outline';
      case OptimizationStrategy.NETWORK_OPTIMIZATION: return 'wifi-outline';
      default: return 'settings-outline';
    }
  };

  const getStrategyDescription = (strategy: OptimizationStrategy): string => {
    switch (strategy) {
      case OptimizationStrategy.REDUCE_RENDERS: return 'Minimize unnecessary component re-renders';
      case OptimizationStrategy.OPTIMIZE_IMAGES: return 'Compress and optimize image assets';
      case OptimizationStrategy.LAZY_LOAD: return 'Load components and data on demand';
      case OptimizationStrategy.CACHE_OPTIMIZATION: return 'Optimize caching strategies';
      case OptimizationStrategy.BUNDLE_SPLITTING: return 'Split code into smaller chunks';
      case OptimizationStrategy.MEMORY_CLEANUP: return 'Clean up unused memory allocations';
      case OptimizationStrategy.NETWORK_OPTIMIZATION: return 'Optimize network requests';
      default: return 'General optimization strategy';
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview': return renderOverviewTab();
      case 'memory': return renderMemoryTab();
      case 'images': return renderImagesTab();
      case 'modules': return renderModulesTab();
      case 'issues': return renderIssuesTab();
      case 'optimization': return renderOptimizationTab();
      default: return renderOverviewTab();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Performance Dashboard</Text>
          <View style={styles.headerControls}>
            <View style={styles.monitoringToggle}>
              <Text style={styles.toggleLabel}>Monitoring</Text>
              <Switch value={isMonitoring} onValueChange={toggleMonitoring} />
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.tabs}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {renderTabButton('overview', 'speedometer-outline', 'Overview')}
            {renderTabButton('memory', 'hardware-chip-outline', 'Memory')}
            {renderTabButton('images', 'image-outline', 'Images')}
            {renderTabButton('modules', 'cube-outline', 'Modules')}
            {renderTabButton('issues', 'warning-outline', 'Issues')}
            {renderTabButton('optimization', 'build-outline', 'Optimize')}
          </ScrollView>
        </View>

        {renderTabContent()}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  headerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  monitoringToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleLabel: {
    fontSize: 14,
    color: '#666',
  },
  closeButton: {
    padding: 8,
  },
  tabs: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabLabel: {
    fontSize: 14,
    color: '#666',
  },
  activeTabLabel: {
    color: colors.primary,
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
  },
  section: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    minWidth: 80,
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    position: 'relative',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  metricIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: colors.primary,
    borderRadius: 8,
    gap: 8,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  recommendationText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
  },
  memoryOverview: {
    marginBottom: 16,
  },
  memoryBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  memoryBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  memoryText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  memoryPressure: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoryName: {
    fontSize: 14,
    color: '#333',
    textTransform: 'capitalize',
  },
  categorySize: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  allocationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  allocationId: {
    flex: 1,
    fontSize: 12,
    color: '#333',
  },
  allocationSize: {
    fontSize: 12,
    color: '#666',
    width: 60,
    textAlign: 'right',
  },
  allocationAge: {
    fontSize: 12,
    color: '#999',
    width: 40,
    textAlign: 'right',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  imageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  imageKey: {
    flex: 1,
    fontSize: 12,
    color: '#333',
  },
  imageAccess: {
    fontSize: 12,
    color: '#666',
    width: 60,
    textAlign: 'right',
  },
  imageSize: {
    fontSize: 12,
    color: '#999',
    width: 50,
    textAlign: 'right',
  },
  moduleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  moduleName: {
    flex: 1,
    fontSize: 12,
    color: '#333',
  },
  moduleAccess: {
    fontSize: 12,
    color: '#666',
    width: 60,
    textAlign: 'right',
  },
  moduleSize: {
    fontSize: 12,
    color: '#999',
    width: 50,
    textAlign: 'right',
  },
  noIssues: {
    alignItems: 'center',
    padding: 32,
  },
  noIssuesText: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  issueItem: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  issueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  issueType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textTransform: 'capitalize',
  },
  issueSeverity: {
    fontSize: 12,
    color: '#666',
    textTransform: 'uppercase',
    marginLeft: 'auto',
  },
  issueDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  issueStrategies: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  strategyButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  strategyText: {
    fontSize: 12,
    color: 'white',
    textTransform: 'capitalize',
  },
  optimizationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  optimizationCard: {
    flex: 1,
    minWidth: 150,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    alignItems: 'center',
  },
  optimizationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
    textAlign: 'center',
  },
  optimizationDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
});

// Toggle component for easy access
export const PerformanceMonitorToggle: React.FC = () => {
  const [showDashboard, setShowDashboard] = useState(false);

  if (!__DEV__) return null;

  return (
    <>
      <TouchableOpacity
        style={styles.toggleButton}
        onPress={() => setShowDashboard(true)}
      >
        <Ionicons name="speedometer" size={24} color="white" />
      </TouchableOpacity>

      <EnhancedPerformanceDashboard
        visible={showDashboard}
        onClose={() => setShowDashboard(false)}
      />
    </>
  );
};

const toggleStyles = StyleSheet.create({
  toggleButton: {
    position: 'absolute',
    bottom: 80,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
  },
});

Object.assign(styles, toggleStyles);