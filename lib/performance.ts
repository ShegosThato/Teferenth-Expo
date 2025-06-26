/**
 * Performance Monitoring and Optimization
 * 
 * Provides comprehensive performance monitoring, memory tracking,
 * and optimization utilities for React Native applications.
 * 
 * Phase 2 Task 2: Performance Optimizations
 */

import { InteractionManager, Platform } from 'react-native';
import { ENV } from '../config/env';

// Performance metrics interface
export interface PerformanceMetrics {
  timestamp: number;
  memoryUsage?: {
    used: number;
    total: number;
    percentage: number;
  };
  renderTime?: number;
  bundleSize?: number;
  imagesCached?: number;
  networkRequests?: number;
}

// Performance event types
export enum PerformanceEvent {
  SCREEN_LOAD = 'screen_load',
  API_REQUEST = 'api_request',
  IMAGE_LOAD = 'image_load',
  COMPONENT_RENDER = 'component_render',
  MEMORY_WARNING = 'memory_warning',
  BUNDLE_LOAD = 'bundle_load'
}

// Performance monitoring class
class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private maxMetrics = 100;
  private listeners: Array<(metrics: PerformanceMetrics) => void> = [];
  private timers: Map<string, number> = new Map();

  constructor() {
    this.initialize();
  }

  private initialize() {
    // Monitor memory warnings on iOS
    if (Platform.OS === 'ios') {
      // Note: In a real app, you'd use react-native-device-info or similar
      // for actual memory monitoring
    }

    // Start periodic monitoring
    this.startPeriodicMonitoring();
  }

  private startPeriodicMonitoring() {
    setInterval(() => {
      this.collectMetrics();
    }, 30000); // Every 30 seconds
  }

  private async collectMetrics() {
    const metrics: PerformanceMetrics = {
      timestamp: Date.now(),
    };

    // Collect memory usage (simulated for now)
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      metrics.memoryUsage = await this.getMemoryUsage();
    }

    this.addMetrics(metrics);
  }

  private async getMemoryUsage(): Promise<{ used: number; total: number; percentage: number }> {
    // In a real implementation, you'd use:
    // - react-native-device-info for device memory
    // - Performance API for JS heap
    // - Native modules for platform-specific memory info
    
    // Simulated memory usage for demonstration
    const used = Math.random() * 100; // MB
    const total = 200; // MB
    const percentage = (used / total) * 100;

    return { used, total, percentage };
  }

  private addMetrics(metrics: PerformanceMetrics) {
    this.metrics.unshift(metrics);
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(0, this.maxMetrics);
    }

    // Notify listeners
    this.listeners.forEach(listener => listener(metrics));

    // Check for performance issues
    this.checkPerformanceThresholds(metrics);
  }

  private checkPerformanceThresholds(metrics: PerformanceMetrics) {
    // Memory usage warning
    if (metrics.memoryUsage && metrics.memoryUsage.percentage > 80) {
      this.reportPerformanceIssue(PerformanceEvent.MEMORY_WARNING, {
        memoryPercentage: metrics.memoryUsage.percentage,
        memoryUsed: metrics.memoryUsage.used
      });
    }

    // Render time warning
    if (metrics.renderTime && metrics.renderTime > 100) {
      this.reportPerformanceIssue(PerformanceEvent.COMPONENT_RENDER, {
        renderTime: metrics.renderTime
      });
    }
  }

  private reportPerformanceIssue(event: PerformanceEvent, data: Record<string, unknown>) {
    if (ENV.DEBUG_MODE) {
      console.warn(`Performance Issue - ${event}:`, data);
    }

    // In production, send to analytics
    // if (ENV.ENABLE_ANALYTICS) {
    //   analytics.track(event, data);
    // }
  }

  // Public API
  public startTimer(name: string) {
    this.timers.set(name, Date.now());
  }

  public endTimer(name: string): number {
    const startTime = this.timers.get(name);
    if (!startTime) {
      console.warn(`Timer "${name}" was not started`);
      return 0;
    }

    const duration = Date.now() - startTime;
    this.timers.delete(name);
    return duration;
  }

  public measureRenderTime<T>(name: string, fn: () => T): T {
    this.startTimer(name);
    const result = fn();
    const renderTime = this.endTimer(name);
    
    this.addMetrics({
      timestamp: Date.now(),
      renderTime
    });

    return result;
  }

  public async measureAsyncOperation<T>(name: string, fn: () => Promise<T>): Promise<T> {
    this.startTimer(name);
    try {
      const result = await fn();
      const duration = this.endTimer(name);
      
      this.addMetrics({
        timestamp: Date.now(),
        renderTime: duration
      });

      return result;
    } catch (error) {
      this.endTimer(name);
      throw error;
    }
  }

  public trackScreenLoad(screenName: string) {
    InteractionManager.runAfterInteractions(() => {
      this.addMetrics({
        timestamp: Date.now(),
        renderTime: Date.now() % 1000 // Simulated screen load time
      });

      if (ENV.DEBUG_MODE) {
        console.log(`Screen loaded: ${screenName}`);
      }
    });
  }

  public getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  public getAverageMetrics(): Partial<PerformanceMetrics> {
    if (this.metrics.length === 0) return {};

    const totals = this.metrics.reduce((acc, metric) => {
      if (metric.memoryUsage) {
        acc.memoryUsage = (acc.memoryUsage || 0) + metric.memoryUsage.percentage;
        acc.memoryCount = (acc.memoryCount || 0) + 1;
      }
      if (metric.renderTime) {
        acc.renderTime = (acc.renderTime || 0) + metric.renderTime;
        acc.renderCount = (acc.renderCount || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return {
      memoryUsage: totals.memoryCount ? {
        used: 0,
        total: 0,
        percentage: totals.memoryUsage / totals.memoryCount
      } : undefined,
      renderTime: totals.renderCount ? totals.renderTime / totals.renderCount : undefined
    };
  }

  public subscribe(listener: (metrics: PerformanceMetrics) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  public clearMetrics() {
    this.metrics = [];
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Performance optimization utilities
export class PerformanceOptimizer {
  // Debounce function for performance
  static debounce<T extends (...args: unknown[]) => unknown>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }

  // Throttle function for performance
  static throttle<T extends (...args: unknown[]) => unknown>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  // Memoization for expensive calculations
  static memoize<T extends (...args: unknown[]) => unknown>(fn: T): T {
    const cache = new Map();
    return ((...args: unknown[]) => {
      const key = JSON.stringify(args);
      if (cache.has(key)) {
        return cache.get(key);
      }
      const result = fn(...args);
      cache.set(key, result);
      return result;
    }) as T;
  }

  // Batch operations for better performance
  static batchOperations<T>(
    operations: Array<() => T>,
    batchSize: number = 10
  ): Promise<T[]> {
    return new Promise((resolve) => {
      const results: T[] = [];
      let currentIndex = 0;

      const processBatch = () => {
        const endIndex = Math.min(currentIndex + batchSize, operations.length);
        
        for (let i = currentIndex; i < endIndex; i++) {
          results.push(operations[i]());
        }

        currentIndex = endIndex;

        if (currentIndex < operations.length) {
          // Use setTimeout to yield control back to the main thread
          setTimeout(processBatch, 0);
        } else {
          resolve(results);
        }
      };

      processBatch();
    });
  }

  // Lazy execution with InteractionManager
  static runAfterInteractions<T>(fn: () => T): Promise<T> {
    return new Promise((resolve) => {
      InteractionManager.runAfterInteractions(() => {
        resolve(fn());
      });
    });
  }
}

// React hooks for performance monitoring
export function usePerformanceMonitor() {
  const [metrics, setMetrics] = React.useState<PerformanceMetrics[]>([]);

  React.useEffect(() => {
    const unsubscribe = performanceMonitor.subscribe((newMetrics) => {
      setMetrics(performanceMonitor.getMetrics());
    });

    return unsubscribe;
  }, []);

  return {
    metrics,
    averageMetrics: performanceMonitor.getAverageMetrics(),
    startTimer: performanceMonitor.startTimer.bind(performanceMonitor),
    endTimer: performanceMonitor.endTimer.bind(performanceMonitor),
    trackScreenLoad: performanceMonitor.trackScreenLoad.bind(performanceMonitor)
  };
}

// Performance measurement decorator
export function measurePerformance(name: string) {
  return function (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: unknown[]) {
      return performanceMonitor.measureRenderTime(
        `${target.constructor.name}.${propertyKey}`,
        () => originalMethod.apply(this, args)
      );
    };

    return descriptor;
  };
}

// Memory management utilities
export class MemoryManager {
  private static imageCache = new Map<string, unknown>();
  private static maxCacheSize = 50; // Maximum cached items

  static cacheImage(key: string, image: unknown) {
    if (this.imageCache.size >= this.maxCacheSize) {
      // Remove oldest entry
      const firstKey = this.imageCache.keys().next().value;
      this.imageCache.delete(firstKey);
    }
    this.imageCache.set(key, image);
  }

  static getCachedImage(key: string) {
    return this.imageCache.get(key);
  }

  static clearImageCache() {
    this.imageCache.clear();
  }

  static getMemoryUsage() {
    return {
      imageCacheSize: this.imageCache.size,
      maxCacheSize: this.maxCacheSize
    };
  }
}

// Add React import for hooks
import React from 'react';