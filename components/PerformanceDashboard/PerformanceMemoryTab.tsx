/**
 * Performance Memory Tab
 * 
 * Detailed memory usage monitoring and management
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
import { memoryManager, MemoryPressure } from '../../lib/memoryManagement';
import type { PerformanceTabProps } from './types';

export const PerformanceMemoryTab: React.FC<PerformanceTabProps> = ({
  memoryStats,
}) => {
  const handleMemoryCleanup = async () => {
    try {
      await memoryManager.forceGC();
      Alert.alert('Success', 'Memory cleanup completed');
    } catch (error) {
      Alert.alert('Error', `Memory cleanup failed: ${error}`);
    }
  };

  const getMemoryPressureColor = (pressure: MemoryPressure) => {
    switch (pressure) {
      case MemoryPressure.LOW:
        return colors.success;
      case MemoryPressure.MODERATE:
        return colors.warning;
      case MemoryPressure.HIGH:
        return colors.danger;
      default:
        return colors.textMuted;
    }
  };

  const formatBytes = (bytes: number) => {
    const mb = bytes / 1024 / 1024;
    return `${mb.toFixed(1)} MB`;
  };

  const MemoryBar: React.FC<{
    label: string;
    used: number;
    total: number;
    color: string;
  }> = ({ label, used, total, color }) => {
    const percentage = (used / total) * 100;
    
    return (
      <View style={styles.memoryBarContainer}>
        <View style={styles.memoryBarHeader}>
          <Text style={styles.memoryBarLabel}>{label}</Text>
          <Text style={styles.memoryBarValue}>
            {formatBytes(used)} / {formatBytes(total)} ({percentage.toFixed(1)}%)
          </Text>
        </View>
        <View style={styles.memoryBarTrack}>
          <View
            style={[
              styles.memoryBarFill,
              { width: `${percentage}%`, backgroundColor: color },
            ]}
          />
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Memory Overview */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Memory Overview</Text>
        
        {memoryStats && (
          <>
            <MemoryBar
              label="Total Memory"
              used={memoryStats.used}
              total={memoryStats.total}
              color={getMemoryPressureColor(memoryStats.pressure)}
            />
            
            <View style={styles.memoryDetails}>
              <View style={styles.memoryDetailItem}>
                <Text style={styles.memoryDetailLabel}>Available</Text>
                <Text style={styles.memoryDetailValue}>
                  {formatBytes(memoryStats.available)}
                </Text>
              </View>
              
              <View style={styles.memoryDetailItem}>
                <Text style={styles.memoryDetailLabel}>Pressure Level</Text>
                <Text style={[
                  styles.memoryDetailValue,
                  { color: getMemoryPressureColor(memoryStats.pressure) }
                ]}>
                  {memoryStats.pressure}
                </Text>
              </View>
            </View>
          </>
        )}
      </View>

      {/* Memory Categories */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Memory by Category</Text>
        
        {memoryStats?.categories && Object.entries(memoryStats.categories).map(([category, usage]) => (
          <MemoryBar
            key={category}
            label={category.charAt(0).toUpperCase() + category.slice(1)}
            used={usage}
            total={memoryStats.total}
            color={colors.info}
          />
        ))}
      </View>

      {/* Memory Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Memory Management</Text>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleMemoryCleanup}
        >
          <Ionicons name="refresh-outline" size={20} color={colors.background} />
          <Text style={styles.actionButtonText}>Force Garbage Collection</Text>
        </TouchableOpacity>
        
        <View style={styles.warningCard}>
          <Ionicons name="warning-outline" size={20} color={colors.warning} />
          <Text style={styles.warningText}>
            Memory cleanup may cause temporary performance impact
          </Text>
        </View>
      </View>

      {/* Memory Tips */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Optimization Tips</Text>
        
        <View style={styles.tipsContainer}>
          <View style={styles.tipItem}>
            <Ionicons name="bulb-outline" size={16} color={colors.warning} />
            <Text style={styles.tipText}>
              Close unused screens to free memory
            </Text>
          </View>
          
          <View style={styles.tipItem}>
            <Ionicons name="bulb-outline" size={16} color={colors.warning} />
            <Text style={styles.tipText}>
              Clear image cache if memory usage is high
            </Text>
          </View>
          
          <View style={styles.tipItem}>
            <Ionicons name="bulb-outline" size={16} color={colors.warning} />
            <Text style={styles.tipText}>
              Restart app if memory pressure remains high
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
  memoryBarContainer: {
    marginBottom: 16,
  },
  memoryBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  memoryBarLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  memoryBarValue: {
    fontSize: 12,
    color: colors.textMuted,
  },
  memoryBarTrack: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  memoryBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  memoryDetails: {
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
  },
  memoryDetailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  memoryDetailLabel: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  memoryDetailValue: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: '600',
  },
  actionButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  actionButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  warningCard: {
    backgroundColor: colors.card,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  warningText: {
    fontSize: 12,
    color: colors.textMuted,
    marginLeft: 8,
    flex: 1,
  },
  tipsContainer: {
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    color: colors.text,
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
});