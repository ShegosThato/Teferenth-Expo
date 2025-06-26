/**
 * Performance Dashboard Types
 */

import { EnhancedPerformanceMetrics, PerformanceIssue, OptimizationStrategy } from '../../lib/enhancedPerformance';
import { MemoryStats } from '../../lib/memoryManagement';

export interface PerformanceDashboardProps {
  visible: boolean;
  onClose: () => void;
}

export type PerformanceTabType = 'overview' | 'memory' | 'images' | 'modules' | 'issues' | 'optimization';

export interface PerformanceTabProps {
  isActive: boolean;
  metrics?: EnhancedPerformanceMetrics;
  memoryStats?: MemoryStats;
  onOptimization?: (strategy: OptimizationStrategy) => Promise<void>;
}

export interface PerformanceStatsData {
  memory: MemoryStats;
  images: any; // TODO: Define proper ImageStats type
  modules: any; // TODO: Define proper ModuleStats type
  issues: PerformanceIssue[];
}

export interface TabConfig {
  id: PerformanceTabType;
  title: string;
  icon: string;
  component: React.ComponentType<PerformanceTabProps>;
}