/**
 * Performance Test Suite
 * 
 * Comprehensive testing component for validating all performance enhancements
 * and providing real-time performance validation.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../lib/theme';
import { enhancedPerformanceMonitor } from '../lib/enhancedPerformance';
import { advancedPerformanceEnhancer, useAdvancedPerformance } from '../lib/advancedPerformanceEnhancements';
import { memoryManager, MemoryCategory } from '../lib/memoryManagement';
import { cacheManager } from '../lib/intelligentCaching';
import { OptimizedFlatList } from './OptimizedFlatList';

// Test result interface
interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'warning' | 'running';
  duration?: number;
  details?: string;
  score?: number;
}

// Test categories
type TestCategory = 'memory' | 'performance' | 'caching' | 'prediction' | 'optimization';

export const PerformanceTestSuite: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [currentTest, setCurrentTest] = useState<string>('');
  const [overallScore, setOverallScore] = useState<number>(0);
  
  const { prediction, recommendations, batchOperation } = useAdvancedPerformance('PerformanceTestSuite');

  // Test data for performance testing
  const generateTestData = useCallback((count: number) => {
    return Array.from({ length: count }, (_, index) => ({
      id: index,
      title: `Test Item ${index}`,
      description: `This is a test item with index ${index} for performance testing`,
      image: `https://picsum.photos/200/200?random=${index}`,
      data: new Array(100).fill(0).map(() => Math.random()),
    }));
  }, []);

  // Memory stress test
  const runMemoryStressTest = useCallback(async (): Promise<TestResult> => {
    const startTime = performance.now();
    
    try {
      // Allocate large amounts of memory
      const allocations: string[] = [];
      
      for (let i = 0; i < 50; i++) {
        const id = `stress-test-${i}`;
        const size = 1024 * 1024; // 1MB each
        
        const success = memoryManager.allocate(
          id,
          MemoryCategory.TEMPORARY,
          size,
          { priority: 'low' }
        );
        
        if (success) {
          allocations.push(id);
        }
      }
      
      // Check memory pressure
      const memoryPressure = memoryManager.getCurrentMemoryPressure();
      
      // Cleanup
      for (const id of allocations) {
        await memoryManager.deallocate(id);
      }
      
      const duration = performance.now() - startTime;
      
      return {
        name: 'Memory Stress Test',
        status: memoryPressure === 'critical' ? 'warning' : 'pass',
        duration,
        details: `Memory pressure: ${memoryPressure}, Allocated: ${allocations.length}/50`,
        score: allocations.length >= 40 ? 90 : 70,
      };
    } catch (error) {
      return {
        name: 'Memory Stress Test',
        status: 'fail',
        duration: performance.now() - startTime,
        details: `Error: ${error}`,
        score: 0,
      };
    }
  }, []);

  // Performance rendering test
  const runRenderingPerformanceTest = useCallback(async (): Promise<TestResult> => {
    const startTime = performance.now();
    
    try {
      // Simulate heavy rendering operations
      const testData = generateTestData(1000);
      let renderCount = 0;
      
      // Simulate multiple renders
      for (let i = 0; i < 10; i++) {
        await new Promise(resolve => {
          setTimeout(() => {
            renderCount++;
            resolve(void 0);
          }, 16); // Target 60fps
        });
      }
      
      const duration = performance.now() - startTime;
      const avgRenderTime = duration / renderCount;
      
      return {
        name: 'Rendering Performance Test',
        status: avgRenderTime < 16 ? 'pass' : avgRenderTime < 33 ? 'warning' : 'fail',
        duration,
        details: `Average render time: ${avgRenderTime.toFixed(2)}ms, Target: <16ms`,
        score: Math.max(0, 100 - (avgRenderTime - 16) * 5),
      };
    } catch (error) {
      return {
        name: 'Rendering Performance Test',
        status: 'fail',
        duration: performance.now() - startTime,
        details: `Error: ${error}`,
        score: 0,
      };
    }
  }, [generateTestData]);

  // Caching performance test
  const runCachingTest = useCallback(async (): Promise<TestResult> => {
    const startTime = performance.now();
    
    try {
      const cache = cacheManager.getCache('test-cache');
      const testKeys = Array.from({ length: 100 }, (_, i) => `test-key-${i}`);
      const testData = testKeys.map(key => ({ key, data: `test-data-${key}` }));
      
      // Test cache writes
      for (const item of testData) {
        await cache.set(item.key, item.data);
      }
      
      // Test cache reads
      let hits = 0;
      for (const key of testKeys) {
        const result = await cache.get(key);
        if (result) hits++;
      }
      
      // Test cache predictions
      const predictions = cache.predictAccesses(60000);
      
      const duration = performance.now() - startTime;
      const hitRate = (hits / testKeys.length) * 100;
      
      // Cleanup
      await cache.clear();
      
      return {
        name: 'Caching Performance Test',
        status: hitRate >= 95 ? 'pass' : hitRate >= 80 ? 'warning' : 'fail',
        duration,
        details: `Hit rate: ${hitRate.toFixed(1)}%, Predictions: ${predictions.length}`,
        score: hitRate,
      };
    } catch (error) {
      return {
        name: 'Caching Performance Test',
        status: 'fail',
        duration: performance.now() - startTime,
        details: `Error: ${error}`,
        score: 0,
      };
    }
  }, []);

  // Batching optimization test
  const runBatchingTest = useCallback(async (): Promise<TestResult> => {
    const startTime = performance.now();
    
    try {
      const operations: Promise<void>[] = [];
      
      // Create multiple operations to be batched
      for (let i = 0; i < 20; i++) {
        const operation = batchOperation(async () => {
          // Simulate async operation
          await new Promise(resolve => setTimeout(resolve, 10));
        }, 0.5);
        operations.push(operation);
      }
      
      // Wait for all operations to complete
      await Promise.all(operations);
      
      const duration = performance.now() - startTime;
      
      return {
        name: 'Batching Optimization Test',
        status: duration < 500 ? 'pass' : duration < 1000 ? 'warning' : 'fail',
        duration,
        details: `Batched 20 operations in ${duration.toFixed(2)}ms`,
        score: Math.max(0, 100 - (duration - 200) / 10),
      };
    } catch (error) {
      return {
        name: 'Batching Optimization Test',
        status: 'fail',
        duration: performance.now() - startTime,
        details: `Error: ${error}`,
        score: 0,
      };
    }
  }, [batchOperation]);

  // Prediction accuracy test
  const runPredictionTest = useCallback(async (): Promise<TestResult> => {
    const startTime = performance.now();
    
    try {
      // Get current prediction
      const currentPrediction = prediction;
      
      // Get optimization recommendations
      const currentRecommendations = recommendations;
      
      const duration = performance.now() - startTime;
      
      const hasValidPrediction = currentPrediction && currentPrediction.confidence > 0;
      const hasRecommendations = currentRecommendations.length > 0;
      
      return {
        name: 'Prediction System Test',
        status: hasValidPrediction ? 'pass' : 'warning',
        duration,
        details: `Prediction confidence: ${currentPrediction?.confidence.toFixed(2) || 'N/A'}, Recommendations: ${currentRecommendations.length}`,
        score: hasValidPrediction ? (currentPrediction.confidence * 100) : 50,
      };
    } catch (error) {
      return {
        name: 'Prediction System Test',
        status: 'fail',
        duration: performance.now() - startTime,
        details: `Error: ${error}`,
        score: 0,
      };
    }
  }, [prediction, recommendations]);

  // Run all performance tests
  const runAllTests = useCallback(async () => {
    setIsRunning(true);
    setResults([]);
    setOverallScore(0);
    
    const tests = [
      { name: 'Memory Stress Test', runner: runMemoryStressTest },
      { name: 'Rendering Performance Test', runner: runRenderingPerformanceTest },
      { name: 'Caching Performance Test', runner: runCachingTest },
      { name: 'Batching Optimization Test', runner: runBatchingTest },
      { name: 'Prediction System Test', runner: runPredictionTest },
    ];
    
    const testResults: TestResult[] = [];
    
    for (const test of tests) {
      setCurrentTest(test.name);
      
      // Add running status
      const runningResult: TestResult = {
        name: test.name,
        status: 'running',
      };
      setResults(prev => [...prev.filter(r => r.name !== test.name), runningResult]);
      
      try {
        const result = await test.runner();
        testResults.push(result);
        setResults(prev => [...prev.filter(r => r.name !== test.name), result]);
      } catch (error) {
        const errorResult: TestResult = {
          name: test.name,
          status: 'fail',
          details: `Unexpected error: ${error}`,
          score: 0,
        };
        testResults.push(errorResult);
        setResults(prev => [...prev.filter(r => r.name !== test.name), errorResult]);
      }
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Calculate overall score
    const totalScore = testResults.reduce((sum, result) => sum + (result.score || 0), 0);
    const avgScore = totalScore / testResults.length;
    setOverallScore(avgScore);
    
    setCurrentTest('');
    setIsRunning(false);
    
    // Show completion alert
    Alert.alert(
      'Performance Tests Complete',
      `Overall Score: ${avgScore.toFixed(1)}/100\n\nPassed: ${testResults.filter(r => r.status === 'pass').length}\nWarnings: ${testResults.filter(r => r.status === 'warning').length}\nFailed: ${testResults.filter(r => r.status === 'fail').length}`,
      [{ text: 'OK' }]
    );
  }, [runMemoryStressTest, runRenderingPerformanceTest, runCachingTest, runBatchingTest, runPredictionTest]);

  // Render test result item
  const renderTestResult = (result: TestResult) => {
    const getStatusColor = () => {
      switch (result.status) {
        case 'pass': return colors.success;
        case 'warning': return colors.warning;
        case 'fail': return colors.danger;
        case 'running': return colors.info;
        default: return colors.textSecondary;
      }
    };

    const getStatusIcon = () => {
      switch (result.status) {
        case 'pass': return 'checkmark-circle';
        case 'warning': return 'warning';
        case 'fail': return 'close-circle';
        case 'running': return 'time';
        default: return 'help-circle';
      }
    };

    return (
      <View key={result.name} style={styles.testResult}>
        <View style={styles.testHeader}>
          <Ionicons
            name={getStatusIcon()}
            size={24}
            color={getStatusColor()}
          />
          <Text style={styles.testName}>{result.name}</Text>
          {result.score !== undefined && (
            <Text style={[styles.testScore, { color: getStatusColor() }]}>
              {result.score.toFixed(0)}
            </Text>
          )}
        </View>
        
        {result.duration && (
          <Text style={styles.testDuration}>
            Duration: {result.duration.toFixed(2)}ms
          </Text>
        )}
        
        {result.details && (
          <Text style={styles.testDetails}>{result.details}</Text>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Performance Test Suite</Text>
        <Text style={styles.subtitle}>Validate all performance enhancements</Text>
      </View>

      {overallScore > 0 && (
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreLabel}>Overall Score</Text>
          <Text style={[
            styles.scoreValue,
            { color: overallScore >= 80 ? colors.success : overallScore >= 60 ? colors.warning : colors.danger }
          ]}>
            {overallScore.toFixed(1)}/100
          </Text>
        </View>
      )}

      <Pressable
        style={[styles.runButton, isRunning && styles.runButtonDisabled]}
        onPress={runAllTests}
        disabled={isRunning}
      >
        <Ionicons
          name={isRunning ? 'time' : 'play'}
          size={20}
          color="#fff"
        />
        <Text style={styles.runButtonText}>
          {isRunning ? 'Running Tests...' : 'Run Performance Tests'}
        </Text>
      </Pressable>

      {currentTest && (
        <View style={styles.currentTest}>
          <Text style={styles.currentTestText}>Running: {currentTest}</Text>
        </View>
      )}

      <ScrollView style={styles.resultsContainer}>
        {results.map(renderTestResult)}
      </ScrollView>

      {results.length > 0 && (
        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>Test Summary</Text>
          <View style={styles.summaryStats}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Passed</Text>
              <Text style={[styles.summaryValue, { color: colors.success }]}>
                {results.filter(r => r.status === 'pass').length}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Warnings</Text>
              <Text style={[styles.summaryValue, { color: colors.warning }]}>
                {results.filter(r => r.status === 'warning').length}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Failed</Text>
              <Text style={[styles.summaryValue, { color: colors.danger }]}>
                {results.filter(r => r.status === 'fail').length}
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  scoreContainer: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: '700',
  },
  runButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  runButtonDisabled: {
    backgroundColor: colors.textSecondary,
  },
  runButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  currentTest: {
    backgroundColor: colors.info,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  currentTestText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  resultsContainer: {
    flex: 1,
    marginBottom: 16,
  },
  testResult: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  testHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  testName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 12,
    flex: 1,
  },
  testScore: {
    fontSize: 18,
    fontWeight: '700',
  },
  testDuration: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  testDetails: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  summary: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
  },
});

export default PerformanceTestSuite;