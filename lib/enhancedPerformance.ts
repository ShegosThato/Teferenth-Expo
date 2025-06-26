/**
 * Enhanced Performance Monitoring and Optimization
 * 
 * Comprehensive performance system that builds upon the existing foundation
 * with advanced monitoring, optimization strategies, and real-time analysis.
 */

import { InteractionManager, Platform, Dimensions } from 'react-native';
import { 
  PerformanceMetrics as BasePerformanceMetrics,
  PerformanceEvent as BasePerformanceEvent 
} from './performance';
import { CONFIG } from '../config/enhancedEnv';
import { errorReporter } from './enhancedErrorHandling';

// Enhanced performance metrics interface
export interface EnhancedPerformanceMetrics extends BasePerformanceMetrics {
  // Core metrics
  fps?: number;
  jsHeapSize?: number;
  nativeHeapSize?: number;
  
  // React-specific metrics
  componentRenderCount?: number;
  componentUpdateTime?: number;
  reconciliationTime?: number;
  
  // Network metrics
  networkLatency?: number;
  networkThroughput?: number;
  activeConnections?: number;
  
  // Storage metrics
  storageReadTime?: number;
  storageWriteTime?: number;
  cacheHitRatio?: number;
  
  // User interaction metrics
  touchResponseTime?: number;
  scrollPerformance?: number;
  animationFrameDrops?: number;
  
  // Bundle metrics
  chunkLoadTime?: number;
  moduleInitTime?: number;
  
  // Device metrics
  batteryLevel?: number;
  thermalState?: 'nominal' | 'fair' | 'serious' | 'critical';
  availableMemory?: number;
}

// Performance thresholds configuration
export interface PerformanceThresholds {
  memory: {
    warning: number;    // 80%
    critical: number;   // 95%
  };
  renderTime: {
    warning: number;    // 16ms (60fps)
    critical: number;   // 33ms (30fps)
  };
  fps: {
    warning: number;    // 45fps
    critical: number;   // 30fps
  };
  networkLatency: {
    warning: number;    // 1000ms
    critical: number;   // 3000ms
  };
  bundleSize: {
    warning: number;    // 5MB
    critical: number;   // 10MB
  };
}

// Performance optimization strategies
export enum OptimizationStrategy {
  REDUCE_RENDERS = 'reduce_renders',
  OPTIMIZE_IMAGES = 'optimize_images',
  LAZY_LOAD = 'lazy_load',
  CACHE_OPTIMIZATION = 'cache_optimization',
  BUNDLE_SPLITTING = 'bundle_splitting',
  MEMORY_CLEANUP = 'memory_cleanup',
  NETWORK_OPTIMIZATION = 'network_optimization',
}

// Performance issue classification
export interface PerformanceIssue {
  id: string;
  type: 'memory' | 'render' | 'network' | 'bundle' | 'user_interaction';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  metrics: Partial<EnhancedPerformanceMetrics>;
  suggestedStrategies: OptimizationStrategy[];
  timestamp: number;
  resolved: boolean;
}

// Enhanced performance monitor class
export class EnhancedPerformanceMonitor {
  private metrics: EnhancedPerformanceMetrics[] = [];
  private issues: PerformanceIssue[] = [];
  private thresholds: PerformanceThresholds;
  private listeners: Array<(metrics: EnhancedPerformanceMetrics) => void> = [];
  private timers: Map<string, { start: number; context?: Record<string, unknown> }> = new Map();
  private frameDropCounter = 0;
  private lastFrameTime = 0;
  private isMonitoring = false;

  constructor() {
    this.thresholds = this.getDefaultThresholds();
    this.initialize();
  }

  private getDefaultThresholds(): PerformanceThresholds {
    return {
      memory: { warning: 80, critical: 95 },
      renderTime: { warning: 16, critical: 33 },
      fps: { warning: 45, critical: 30 },
      networkLatency: { warning: 1000, critical: 3000 },
      bundleSize: { warning: 5 * 1024 * 1024, critical: 10 * 1024 * 1024 },
    };
  }

  private initialize(): void {
    if (CONFIG.isDevelopment) {
      this.startMonitoring();
    }
  }

  // Start comprehensive monitoring
  public startMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    
    // Monitor frame rate
    this.startFrameRateMonitoring();
    
    // Monitor memory usage
    this.startMemoryMonitoring();
    
    // Monitor network performance
    this.startNetworkMonitoring();
    
    // Monitor user interactions
    this.startInteractionMonitoring();
    
    console.log('🚀 Enhanced performance monitoring started');
  }

  public stopMonitoring(): void {
    this.isMonitoring = false;
    console.log('⏹️ Enhanced performance monitoring stopped');
  }

  // Frame rate monitoring
  private startFrameRateMonitoring(): void {
    const monitorFrame = () => {
      if (!this.isMonitoring) return;
      
      const currentTime = performance.now();
      
      if (this.lastFrameTime > 0) {
        const frameDuration = currentTime - this.lastFrameTime;
        const fps = 1000 / frameDuration;
        
        // Detect frame drops
        if (frameDuration > 16.67) { // 60fps threshold
          this.frameDropCounter++;
        }
        
        // Update metrics every 60 frames
        if (this.frameDropCounter % 60 === 0) {
          this.updateMetrics({
            fps: Math.round(fps),
            animationFrameDrops: this.frameDropCounter,
          });
        }
      }
      
      this.lastFrameTime = currentTime;
      requestAnimationFrame(monitorFrame);
    };
    
    requestAnimationFrame(monitorFrame);
  }

  // Memory monitoring
  private startMemoryMonitoring(): void {
    const checkMemory = () => {
      if (!this.isMonitoring) return;
      
      // Get memory info (platform-specific)
      const memoryInfo = this.getMemoryInfo();
      
      this.updateMetrics({
        memoryUsage: memoryInfo.memoryUsage,
        jsHeapSize: memoryInfo.jsHeapSize,
        nativeHeapSize: memoryInfo.nativeHeapSize,
        availableMemory: memoryInfo.availableMemory,
      });
      
      setTimeout(checkMemory, 5000); // Check every 5 seconds
    };
    
    checkMemory();
  }

  // Network performance monitoring
  private startNetworkMonitoring(): void {
    // Monitor network requests
    const originalFetch = global.fetch;
    
    global.fetch = async (...args) => {
      const startTime = performance.now();
      
      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();
        const latency = endTime - startTime;
        
        this.updateMetrics({
          networkLatency: latency,
          activeConnections: this.getActiveConnectionCount(),
        });
        
        return response;
      } catch (error) {
        const endTime = performance.now();
        const latency = endTime - startTime;
        
        this.updateMetrics({
          networkLatency: latency,
        });
        
        throw error;
      }
    };
  }

  // User interaction monitoring
  private startInteractionMonitoring(): void {
    // This would be implemented with gesture handlers
    // For now, we'll simulate touch response monitoring
    InteractionManager.runAfterInteractions(() => {
      this.updateMetrics({
        touchResponseTime: performance.now() % 50, // Simulated
      });
    });
  }

  // Get platform-specific memory information
  private getMemoryInfo(): {
    memoryUsage?: { used: number; total: number; percentage: number };
    jsHeapSize?: number;
    nativeHeapSize?: number;
    availableMemory?: number;
  } {
    const result: any = {};
    
    // Web platform memory API
    if (Platform.OS === 'web' && 'memory' in performance) {
      const memory = (performance as any).memory;
      result.jsHeapSize = memory.usedJSHeapSize;
      result.memoryUsage = {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        percentage: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100,
      };
    }
    
    // For React Native, we'd use native modules
    // This is a simulation for demonstration
    if (Platform.OS !== 'web') {
      const simulatedUsed = Math.random() * 100 * 1024 * 1024; // 0-100MB
      const simulatedTotal = 200 * 1024 * 1024; // 200MB
      
      result.memoryUsage = {
        used: simulatedUsed,
        total: simulatedTotal,
        percentage: (simulatedUsed / simulatedTotal) * 100,
      };
      result.nativeHeapSize = simulatedUsed * 0.7;
      result.availableMemory = simulatedTotal - simulatedUsed;
    }
    
    return result;
  }

  // Get active network connection count
  private getActiveConnectionCount(): number {
    // This would be implemented with native modules
    // Simulation for demonstration
    return Math.floor(Math.random() * 5) + 1;
  }

  // Update metrics and check for issues
  private updateMetrics(newMetrics: Partial<EnhancedPerformanceMetrics>): void {
    const metrics: EnhancedPerformanceMetrics = {
      timestamp: Date.now(),
      ...newMetrics,
    };
    
    this.metrics.push(metrics);
    
    // Keep only recent metrics
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
    
    // Check for performance issues
    this.analyzePerformanceIssues(metrics);
    
    // Notify listeners
    this.listeners.forEach(listener => listener(metrics));
  }

  // Analyze performance issues
  private analyzePerformanceIssues(metrics: EnhancedPerformanceMetrics): void {
    const issues: PerformanceIssue[] = [];
    
    // Memory issues
    if (metrics.memoryUsage) {
      if (metrics.memoryUsage.percentage > this.thresholds.memory.critical) {
        issues.push(this.createIssue(
          'memory',
          'critical',
          `Critical memory usage: ${metrics.memoryUsage.percentage.toFixed(1)}%`,
          metrics,
          [OptimizationStrategy.MEMORY_CLEANUP, OptimizationStrategy.CACHE_OPTIMIZATION]
        ));
      } else if (metrics.memoryUsage.percentage > this.thresholds.memory.warning) {
        issues.push(this.createIssue(
          'memory',
          'high',
          `High memory usage: ${metrics.memoryUsage.percentage.toFixed(1)}%`,
          metrics,
          [OptimizationStrategy.MEMORY_CLEANUP]
        ));
      }
    }
    
    // Render performance issues
    if (metrics.renderTime && metrics.renderTime > this.thresholds.renderTime.critical) {
      issues.push(this.createIssue(
        'render',
        'critical',
        `Slow render time: ${metrics.renderTime}ms`,
        metrics,
        [OptimizationStrategy.REDUCE_RENDERS, OptimizationStrategy.LAZY_LOAD]
      ));
    }
    
    // FPS issues
    if (metrics.fps && metrics.fps < this.thresholds.fps.critical) {
      issues.push(this.createIssue(
        'render',
        'critical',
        `Low FPS: ${metrics.fps}`,
        metrics,
        [OptimizationStrategy.REDUCE_RENDERS, OptimizationStrategy.OPTIMIZE_IMAGES]
      ));
    }
    
    // Network issues
    if (metrics.networkLatency && metrics.networkLatency > this.thresholds.networkLatency.critical) {
      issues.push(this.createIssue(
        'network',
        'high',
        `High network latency: ${metrics.networkLatency}ms`,
        metrics,
        [OptimizationStrategy.NETWORK_OPTIMIZATION, OptimizationStrategy.CACHE_OPTIMIZATION]
      ));
    }
    
    // Add issues to the list
    this.issues.push(...issues);
    
    // Report critical issues
    issues.forEach(issue => {
      if (issue.severity === 'critical') {
        this.reportCriticalIssue(issue);
      }
    });
  }

  // Create performance issue
  private createIssue(
    type: PerformanceIssue['type'],
    severity: PerformanceIssue['severity'],
    description: string,
    metrics: Partial<EnhancedPerformanceMetrics>,
    strategies: OptimizationStrategy[]
  ): PerformanceIssue {
    return {
      id: `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      severity,
      description,
      metrics,
      suggestedStrategies: strategies,
      timestamp: Date.now(),
      resolved: false,
    };
  }

  // Report critical performance issues
  private reportCriticalIssue(issue: PerformanceIssue): void {
    console.error('🚨 Critical Performance Issue:', issue);
    
    // Report to error tracking
    errorReporter.report({
      name: 'PerformanceIssue',
      type: 'UNKNOWN_ERROR',
      message: issue.description,
      timestamp: issue.timestamp,
      retryable: false,
      severity: 'critical',
      context: {
        performanceIssue: issue,
        metrics: issue.metrics,
      },
    });
  }

  // Public API methods
  public trackOperation(name: string, duration: number, context?: Record<string, unknown>): void {
    this.updateMetrics({
      componentUpdateTime: duration,
    });
    
    if (CONFIG.isDevelopment) {
      console.log(`⏱️ Operation "${name}" took ${duration}ms`, context);
    }
  }

  public trackScreenLoad(screenName: string): void {
    const startTime = performance.now();
    
    InteractionManager.runAfterInteractions(() => {
      const loadTime = performance.now() - startTime;
      this.updateMetrics({
        componentRenderCount: 1,
        componentUpdateTime: loadTime,
      });
      
      console.log(`📱 Screen "${screenName}" loaded in ${loadTime}ms`);
    });
  }

  public trackError(operation: string, error: Error): void {
    this.updateMetrics({
      timestamp: Date.now(),
    });
    
    console.error(`❌ Error in operation "${operation}":`, error);
  }

  public getPerformanceReport(): {
    summary: {
      averageFPS: number;
      averageMemoryUsage: number;
      averageRenderTime: number;
      totalIssues: number;
      criticalIssues: number;
    };
    recentMetrics: EnhancedPerformanceMetrics[];
    activeIssues: PerformanceIssue[];
    recommendations: string[];
  } {
    const recentMetrics = this.metrics.slice(-100);
    const activeIssues = this.issues.filter(issue => !issue.resolved);
    
    // Calculate averages
    const averageFPS = this.calculateAverage(recentMetrics, 'fps') || 60;
    const averageMemoryUsage = this.calculateAverage(
      recentMetrics.filter(m => m.memoryUsage),
      m => m.memoryUsage?.percentage
    ) || 0;
    const averageRenderTime = this.calculateAverage(recentMetrics, 'renderTime') || 0;
    
    const criticalIssues = activeIssues.filter(issue => issue.severity === 'critical');
    
    return {
      summary: {
        averageFPS,
        averageMemoryUsage,
        averageRenderTime,
        totalIssues: activeIssues.length,
        criticalIssues: criticalIssues.length,
      },
      recentMetrics,
      activeIssues,
      recommendations: this.generateRecommendations(activeIssues),
    };
  }

  private calculateAverage<T>(
    items: T[],
    accessor: keyof T | ((item: T) => number | undefined)
  ): number | undefined {
    const values = items
      .map(item => typeof accessor === 'function' ? accessor(item) : item[accessor])
      .filter((value): value is number => typeof value === 'number');
    
    return values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : undefined;
  }

  private generateRecommendations(issues: PerformanceIssue[]): string[] {
    const recommendations = new Set<string>();
    
    issues.forEach(issue => {
      issue.suggestedStrategies.forEach(strategy => {
        switch (strategy) {
          case OptimizationStrategy.REDUCE_RENDERS:
            recommendations.add('Use React.memo() and useMemo() to reduce unnecessary re-renders');
            break;
          case OptimizationStrategy.OPTIMIZE_IMAGES:
            recommendations.add('Optimize images with compression and appropriate formats');
            break;
          case OptimizationStrategy.LAZY_LOAD:
            recommendations.add('Implement lazy loading for screens and components');
            break;
          case OptimizationStrategy.MEMORY_CLEANUP:
            recommendations.add('Clean up unused objects and implement proper memory management');
            break;
          case OptimizationStrategy.CACHE_OPTIMIZATION:
            recommendations.add('Optimize caching strategies and clear unused cache entries');
            break;
          case OptimizationStrategy.BUNDLE_SPLITTING:
            recommendations.add('Implement code splitting to reduce initial bundle size');
            break;
          case OptimizationStrategy.NETWORK_OPTIMIZATION:
            recommendations.add('Optimize network requests with caching and compression');
            break;
        }
      });
    });
    
    return Array.from(recommendations);
  }

  public subscribe(listener: (metrics: EnhancedPerformanceMetrics) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  public clearMetrics(): void {
    this.metrics = [];
    this.issues = [];
  }

  public resolveIssue(issueId: string): void {
    const issue = this.issues.find(i => i.id === issueId);
    if (issue) {
      issue.resolved = true;
      console.log(`✅ Performance issue resolved: ${issue.description}`);
    }
  }
}

// Global enhanced performance monitor instance
export const enhancedPerformanceMonitor = new EnhancedPerformanceMonitor();

// Performance optimization utilities
export class AdvancedPerformanceOptimizer {
  // Intelligent debouncing based on performance metrics
  static smartDebounce<T extends (...args: any[]) => any>(
    func: T,
    baseWait: number = 300
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      
      // Adjust wait time based on current performance
      const report = enhancedPerformanceMonitor.getPerformanceReport();
      const performanceMultiplier = report.summary.averageFPS < 30 ? 2 : 1;
      const adjustedWait = baseWait * performanceMultiplier;
      
      timeout = setTimeout(() => func(...args), adjustedWait);
    };
  }

  // Adaptive throttling based on device performance
  static adaptiveThrottle<T extends (...args: any[]) => any>(
    func: T,
    baseWait: number = 100
  ): (...args: Parameters<T>) => void {
    let lastCall = 0;
    
    return (...args: Parameters<T>) => {
      const now = Date.now();
      const report = enhancedPerformanceMonitor.getPerformanceReport();
      
      // Adjust throttle based on memory usage and FPS
      const memoryMultiplier = report.summary.averageMemoryUsage > 80 ? 2 : 1;
      const fpsMultiplier = report.summary.averageFPS < 45 ? 1.5 : 1;
      const adjustedWait = baseWait * memoryMultiplier * fpsMultiplier;
      
      if (now - lastCall >= adjustedWait) {
        lastCall = now;
        func(...args);
      }
    };
  }

  // Performance-aware component wrapper
  static withPerformanceTracking<P extends object>(
    Component: React.ComponentType<P>,
    componentName: string
  ): React.ComponentType<P> {
    return React.memo((props: P) => {
      const renderStart = performance.now();
      
      React.useEffect(() => {
        const renderTime = performance.now() - renderStart;
        enhancedPerformanceMonitor.trackOperation(`render_${componentName}`, renderTime);
      });
      
      return React.createElement(Component, props);
    });
  }

  // Memory-efficient list rendering
  static createVirtualizedRenderer<T>(
    itemHeight: number,
    containerHeight: number
  ) {
    return {
      getVisibleRange: (scrollOffset: number): { start: number; end: number } => {
        const start = Math.floor(scrollOffset / itemHeight);
        const visibleCount = Math.ceil(containerHeight / itemHeight);
        const end = start + visibleCount + 1; // Add buffer
        
        return { start: Math.max(0, start), end };
      },
      
      getItemStyle: (index: number): { position: 'absolute'; top: number; height: number } => ({
        position: 'absolute',
        top: index * itemHeight,
        height: itemHeight,
      }),
    };
  }
}

// React hooks for performance monitoring
export function usePerformanceMonitor() {
  const [metrics, setMetrics] = React.useState<EnhancedPerformanceMetrics | null>(null);
  const [report, setReport] = React.useState(enhancedPerformanceMonitor.getPerformanceReport());
  
  React.useEffect(() => {
    const unsubscribe = enhancedPerformanceMonitor.subscribe(setMetrics);
    
    const updateReport = () => {
      setReport(enhancedPerformanceMonitor.getPerformanceReport());
    };
    
    const interval = setInterval(updateReport, 5000); // Update every 5 seconds
    
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);
  
  return { metrics, report };
}

export function useRenderTracking(componentName: string) {
  const renderCount = React.useRef(0);
  const lastRenderTime = React.useRef(0);
  
  React.useEffect(() => {
    renderCount.current++;
    const renderTime = performance.now() - lastRenderTime.current;
    
    if (lastRenderTime.current > 0) {
      enhancedPerformanceMonitor.trackOperation(
        `render_${componentName}`,
        renderTime,
        { renderCount: renderCount.current }
      );
    }
    
    lastRenderTime.current = performance.now();
  });
  
  return { renderCount: renderCount.current };
}