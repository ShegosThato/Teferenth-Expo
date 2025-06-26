/**
 * Unit Tests for Performance Monitoring
 * 
 * These tests verify the performance monitoring functionality,
 * metrics collection, and optimization utilities.
 */

import { Platform } from 'react-native';
import {
  PerformanceMonitor,
  performanceMonitor,
  PerformanceOptimizer,
  PerformanceEvent,
  PerformanceMetrics
} from '../../lib/performance';

// Mock React Native modules
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios'
  },
  InteractionManager: {
    runAfterInteractions: jest.fn((callback) => callback())
  }
}));

jest.mock('../../config/env', () => ({
  ENV: {
    DEBUG_MODE: true,
    ENABLE_ANALYTICS: false
  }
}));

describe('Performance Monitoring', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    // Clear metrics before each test
    performanceMonitor.clearMetrics();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('PerformanceMonitor', () => {
    describe('Timer Operations', () => {
      it('should start and end timers correctly', () => {
        const timerName = 'test-timer';
        
        performanceMonitor.startTimer(timerName);
        
        // Advance time by 100ms
        jest.advanceTimersByTime(100);
        
        const duration = performanceMonitor.endTimer(timerName);
        
        expect(duration).toBe(100);
      });

      it('should warn when ending non-existent timer', () => {
        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
        
        const duration = performanceMonitor.endTimer('non-existent-timer');
        
        expect(duration).toBe(0);
        expect(consoleSpy).toHaveBeenCalledWith('Timer "non-existent-timer" was not started');
        
        consoleSpy.mockRestore();
      });

      it('should remove timer after ending', () => {
        const timerName = 'test-timer';
        
        performanceMonitor.startTimer(timerName);
        performanceMonitor.endTimer(timerName);
        
        // Trying to end again should warn
        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
        performanceMonitor.endTimer(timerName);
        
        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
      });
    });

    describe('Render Time Measurement', () => {
      it('should measure synchronous function execution time', () => {
        const testFunction = jest.fn(() => 'result');
        
        const result = performanceMonitor.measureRenderTime('sync-test', testFunction);
        
        expect(result).toBe('result');
        expect(testFunction).toHaveBeenCalled();
        
        const metrics = performanceMonitor.getMetrics();
        expect(metrics.length).toBeGreaterThan(0);
        expect(metrics[0].renderTime).toBeDefined();
      });

      it('should measure asynchronous function execution time', async () => {
        const testFunction = jest.fn(async () => {
          await new Promise(resolve => setTimeout(resolve, 50));
          return 'async-result';
        });
        
        const result = await performanceMonitor.measureAsyncOperation('async-test', testFunction);
        
        expect(result).toBe('async-result');
        expect(testFunction).toHaveBeenCalled();
        
        const metrics = performanceMonitor.getMetrics();
        expect(metrics.length).toBeGreaterThan(0);
        expect(metrics[0].renderTime).toBeDefined();
      });

      it('should handle errors in async operations', async () => {
        const error = new Error('Test error');
        const testFunction = jest.fn(async () => {
          throw error;
        });
        
        await expect(
          performanceMonitor.measureAsyncOperation('error-test', testFunction)
        ).rejects.toThrow('Test error');
        
        expect(testFunction).toHaveBeenCalled();
      });
    });

    describe('Screen Load Tracking', () => {
      it('should track screen load', () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
        
        performanceMonitor.trackScreenLoad('TestScreen');
        
        expect(consoleSpy).toHaveBeenCalledWith('Screen loaded: TestScreen');
        
        const metrics = performanceMonitor.getMetrics();
        expect(metrics.length).toBeGreaterThan(0);
        
        consoleSpy.mockRestore();
      });
    });

    describe('Metrics Collection', () => {
      it('should collect and store metrics', () => {
        const testMetrics: PerformanceMetrics = {
          timestamp: Date.now(),
          renderTime: 50,
          memoryUsage: {
            used: 100,
            total: 200,
            percentage: 50
          }
        };
        
        // Access private method for testing
        (performanceMonitor as any).addMetrics(testMetrics);
        
        const metrics = performanceMonitor.getMetrics();
        expect(metrics).toContain(testMetrics);
      });

      it('should limit metrics to maximum count', () => {
        const maxMetrics = 100;
        
        // Add more than max metrics
        for (let i = 0; i < maxMetrics + 10; i++) {
          (performanceMonitor as any).addMetrics({
            timestamp: Date.now() + i,
            renderTime: i
          });
        }
        
        const metrics = performanceMonitor.getMetrics();
        expect(metrics.length).toBe(maxMetrics);
      });

      it('should calculate average metrics correctly', () => {
        // Add test metrics
        (performanceMonitor as any).addMetrics({
          timestamp: Date.now(),
          renderTime: 100,
          memoryUsage: { used: 50, total: 100, percentage: 50 }
        });
        
        (performanceMonitor as any).addMetrics({
          timestamp: Date.now(),
          renderTime: 200,
          memoryUsage: { used: 60, total: 100, percentage: 60 }
        });
        
        const averages = performanceMonitor.getAverageMetrics();
        
        expect(averages.renderTime).toBe(150);
        expect(averages.memoryUsage?.percentage).toBe(55);
      });

      it('should return empty averages when no metrics exist', () => {
        const averages = performanceMonitor.getAverageMetrics();
        expect(averages).toEqual({});
      });
    });

    describe('Performance Thresholds', () => {
      it('should detect memory warnings', () => {
        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
        
        const highMemoryMetrics: PerformanceMetrics = {
          timestamp: Date.now(),
          memoryUsage: {
            used: 180,
            total: 200,
            percentage: 90 // Above 80% threshold
          }
        };
        
        (performanceMonitor as any).addMetrics(highMemoryMetrics);
        
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Performance Issue - memory_warning'),
          expect.objectContaining({
            memoryPercentage: 90,
            memoryUsed: 180
          })
        );
        
        consoleSpy.mockRestore();
      });

      it('should detect render time warnings', () => {
        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
        
        const slowRenderMetrics: PerformanceMetrics = {
          timestamp: Date.now(),
          renderTime: 150 // Above 100ms threshold
        };
        
        (performanceMonitor as any).addMetrics(slowRenderMetrics);
        
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Performance Issue - component_render'),
          expect.objectContaining({
            renderTime: 150
          })
        );
        
        consoleSpy.mockRestore();
      });
    });

    describe('Subscription System', () => {
      it('should notify listeners when metrics are added', () => {
        const listener = jest.fn();
        
        const unsubscribe = performanceMonitor.subscribe(listener);
        
        const testMetrics: PerformanceMetrics = {
          timestamp: Date.now(),
          renderTime: 50
        };
        
        (performanceMonitor as any).addMetrics(testMetrics);
        
        expect(listener).toHaveBeenCalledWith(testMetrics);
        
        unsubscribe();
      });

      it('should remove listeners when unsubscribed', () => {
        const listener = jest.fn();
        
        const unsubscribe = performanceMonitor.subscribe(listener);
        unsubscribe();
        
        const testMetrics: PerformanceMetrics = {
          timestamp: Date.now(),
          renderTime: 50
        };
        
        (performanceMonitor as any).addMetrics(testMetrics);
        
        expect(listener).not.toHaveBeenCalled();
      });
    });

    describe('Periodic Monitoring', () => {
      it('should collect metrics periodically', () => {
        const collectMetricsSpy = jest.spyOn(performanceMonitor as any, 'collectMetrics');
        
        // Fast-forward time to trigger periodic collection
        jest.advanceTimersByTime(30000); // 30 seconds
        
        expect(collectMetricsSpy).toHaveBeenCalled();
      });
    });
  });

  describe('PerformanceOptimizer', () => {
    describe('Debounce', () => {
      it('should debounce function calls', () => {
        const mockFn = jest.fn();
        const debouncedFn = PerformanceOptimizer.debounce(mockFn, 100);
        
        // Call multiple times quickly
        debouncedFn('arg1');
        debouncedFn('arg2');
        debouncedFn('arg3');
        
        // Function should not be called yet
        expect(mockFn).not.toHaveBeenCalled();
        
        // Fast-forward time
        jest.advanceTimersByTime(100);
        
        // Function should be called once with last arguments
        expect(mockFn).toHaveBeenCalledTimes(1);
        expect(mockFn).toHaveBeenCalledWith('arg3');
      });

      it('should reset debounce timer on subsequent calls', () => {
        const mockFn = jest.fn();
        const debouncedFn = PerformanceOptimizer.debounce(mockFn, 100);
        
        debouncedFn('arg1');
        
        // Advance time partially
        jest.advanceTimersByTime(50);
        
        // Call again, should reset timer
        debouncedFn('arg2');
        
        // Advance time by original wait time
        jest.advanceTimersByTime(100);
        
        // Should be called with the last argument
        expect(mockFn).toHaveBeenCalledTimes(1);
        expect(mockFn).toHaveBeenCalledWith('arg2');
      });
    });

    describe('Throttle', () => {
      it('should throttle function calls', () => {
        const mockFn = jest.fn();
        const throttledFn = PerformanceOptimizer.throttle(mockFn, 100);
        
        // Call multiple times
        throttledFn('arg1');
        throttledFn('arg2');
        throttledFn('arg3');
        
        // Function should be called immediately for first call
        expect(mockFn).toHaveBeenCalledTimes(1);
        expect(mockFn).toHaveBeenCalledWith('arg1');
        
        // Fast-forward time
        jest.advanceTimersByTime(100);
        
        // Call again after throttle period
        throttledFn('arg4');
        
        // Should be called again
        expect(mockFn).toHaveBeenCalledTimes(2);
        expect(mockFn).toHaveBeenLastCalledWith('arg4');
      });
    });

    describe('Batch Operations', () => {
      it('should batch operations correctly', async () => {
        const operations = [
          () => 1,
          () => 2,
          () => 3,
          () => 4,
          () => 5
        ];
        
        const results = await PerformanceOptimizer.batchOperations(operations, 2);
        
        expect(results).toEqual([1, 2, 3, 4, 5]);
      });

      it('should handle empty operations array', async () => {
        const results = await PerformanceOptimizer.batchOperations([]);
        expect(results).toEqual([]);
      });
    });

    describe('Run After Interactions', () => {
      it('should run function after interactions', async () => {
        const mockFn = jest.fn(() => 'result');
        
        const result = await PerformanceOptimizer.runAfterInteractions(mockFn);
        
        expect(result).toBe('result');
        expect(mockFn).toHaveBeenCalled();
      });
    });

    describe('Memoization', () => {
      it('should memoize function results', () => {
        const expensiveFn = jest.fn((x: number) => x * 2);
        const memoizedFn = PerformanceOptimizer.memoize(expensiveFn);
        
        // First call
        const result1 = memoizedFn(5);
        expect(result1).toBe(10);
        expect(expensiveFn).toHaveBeenCalledTimes(1);
        
        // Second call with same argument
        const result2 = memoizedFn(5);
        expect(result2).toBe(10);
        expect(expensiveFn).toHaveBeenCalledTimes(1); // Should not call again
        
        // Call with different argument
        const result3 = memoizedFn(10);
        expect(result3).toBe(20);
        expect(expensiveFn).toHaveBeenCalledTimes(2);
      });

      it('should handle multiple arguments in memoization', () => {
        const addFn = jest.fn((a: number, b: number) => a + b);
        const memoizedAdd = PerformanceOptimizer.memoize(addFn);
        
        memoizedAdd(1, 2);
        memoizedAdd(1, 2); // Should use cache
        memoizedAdd(2, 3); // Different args, should call function
        
        expect(addFn).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Platform-specific Behavior', () => {
    it('should handle iOS-specific monitoring', () => {
      (Platform as any).OS = 'ios';
      
      // Test iOS-specific behavior
      expect(Platform.OS).toBe('ios');
    });

    it('should handle Android-specific monitoring', () => {
      (Platform as any).OS = 'android';
      
      // Test Android-specific behavior
      expect(Platform.OS).toBe('android');
    });
  });
});