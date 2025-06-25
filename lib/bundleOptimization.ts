/**
 * Bundle Size Optimization and Analysis
 * 
 * Provides utilities for analyzing and optimizing bundle size,
 * code splitting, and dynamic imports for better performance.
 * 
 * Phase 2 Task 2: Performance Optimizations
 */

import { Platform } from 'react-native';
import { performanceMonitor } from './performance';

// Bundle analysis interface
export interface BundleAnalysis {
  totalSize: number;
  jsSize: number;
  assetSize: number;
  imageSize: number;
  fontSize: number;
  chunks: Array<{
    name: string;
    size: number;
    type: 'js' | 'asset' | 'image' | 'font';
  }>;
  recommendations: string[];
}

// Code splitting utilities
export class CodeSplitter {
  private static loadedModules = new Set<string>();
  private static loadingModules = new Map<string, Promise<any>>();

  // Dynamic import with caching
  static async loadModule<T>(
    moduleName: string,
    importFn: () => Promise<T>
  ): Promise<T> {
    // Check if already loaded
    if (this.loadedModules.has(moduleName)) {
      return importFn();
    }

    // Check if currently loading
    if (this.loadingModules.has(moduleName)) {
      return this.loadingModules.get(moduleName)!;
    }

    // Start loading
    const loadPromise = this.performLoad(moduleName, importFn);
    this.loadingModules.set(moduleName, loadPromise);

    try {
      const result = await loadPromise;
      this.loadedModules.add(moduleName);
      this.loadingModules.delete(moduleName);
      return result;
    } catch (error) {
      this.loadingModules.delete(moduleName);
      throw error;
    }
  }

  private static async performLoad<T>(
    moduleName: string,
    importFn: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      const module = await importFn();
      const loadTime = Date.now() - startTime;
      
      performanceMonitor.addMetrics({
        timestamp: Date.now(),
        renderTime: loadTime
      });

      console.log(`Module "${moduleName}" loaded in ${loadTime}ms`);
      return module;
    } catch (error) {
      console.error(`Failed to load module "${moduleName}":`, error);
      throw error;
    }
  }

  // Preload modules for better performance
  static preloadModules(modules: Array<{ name: string; importFn: () => Promise<any> }>) {
    modules.forEach(({ name, importFn }) => {
      // Preload after a delay to not block initial render
      setTimeout(() => {
        this.loadModule(name, importFn).catch(error => 
          console.warn(`Failed to preload module "${name}":`, error)
        );
      }, 1000);
    });
  }
}

// Asset optimization utilities
export class AssetOptimizer {
  private static imageCache = new Map<string, string>();
  private static optimizedAssets = new Set<string>();

  // Optimize image assets
  static async optimizeImage(
    imageUri: string,
    options: {
      quality?: number;
      maxWidth?: number;
      maxHeight?: number;
      format?: 'jpeg' | 'png' | 'webp';
    } = {}
  ): Promise<string> {
    const {
      quality = 0.8,
      maxWidth = 1024,
      maxHeight = 1024,
      format = 'jpeg'
    } = options;

    // Check cache first
    const cacheKey = `${imageUri}_${quality}_${maxWidth}_${maxHeight}_${format}`;
    if (this.imageCache.has(cacheKey)) {
      return this.imageCache.get(cacheKey)!;
    }

    try {
      // In a real implementation, you'd use react-native-image-resizer
      // or similar library for actual image optimization
      
      // Simulated optimization
      const optimizedUri = await this.simulateImageOptimization(imageUri, options);
      
      this.imageCache.set(cacheKey, optimizedUri);
      this.optimizedAssets.add(imageUri);
      
      return optimizedUri;
    } catch (error) {
      console.error('Image optimization failed:', error);
      return imageUri; // Return original on failure
    }
  }

  private static async simulateImageOptimization(
    imageUri: string,
    options: any
  ): Promise<string> {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // In reality, this would compress and resize the image
    return imageUri; // Return original for now
  }

  // Batch optimize multiple images
  static async batchOptimizeImages(
    imageUris: string[],
    options: Parameters<typeof AssetOptimizer.optimizeImage>[1] = {}
  ): Promise<string[]> {
    const batchSize = 3;
    const results: string[] = [];

    for (let i = 0; i < imageUris.length; i += batchSize) {
      const batch = imageUris.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(uri => this.optimizeImage(uri, options))
      );
      results.push(...batchResults);
      
      // Small delay between batches
      if (i + batchSize < imageUris.length) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    return results;
  }

  // Get optimization statistics
  static getOptimizationStats() {
    return {
      cachedImages: this.imageCache.size,
      optimizedAssets: this.optimizedAssets.size,
      cacheHitRate: this.calculateCacheHitRate()
    };
  }

  private static calculateCacheHitRate(): number {
    // Simplified calculation
    return this.imageCache.size > 0 ? 85 : 0; // Simulated hit rate
  }
}

// Bundle analyzer
export class BundleAnalyzer {
  // Analyze current bundle (simulated)
  static async analyzeBundleSize(): Promise<BundleAnalysis> {
    // In a real implementation, you'd integrate with Metro bundler
    // or use tools like react-native-bundle-visualizer
    
    const analysis: BundleAnalysis = {
      totalSize: 2.5 * 1024 * 1024, // 2.5MB simulated
      jsSize: 1.8 * 1024 * 1024,
      assetSize: 0.7 * 1024 * 1024,
      imageSize: 0.5 * 1024 * 1024,
      fontSize: 0.2 * 1024 * 1024,
      chunks: [
        { name: 'main.js', size: 800 * 1024, type: 'js' },
        { name: 'vendor.js', size: 600 * 1024, type: 'js' },
        { name: 'components.js', size: 400 * 1024, type: 'js' },
        { name: 'images', size: 500 * 1024, type: 'image' },
        { name: 'fonts', size: 200 * 1024, type: 'font' },
      ],
      recommendations: []
    };

    // Generate recommendations
    analysis.recommendations = this.generateRecommendations(analysis);

    return analysis;
  }

  private static generateRecommendations(analysis: BundleAnalysis): string[] {
    const recommendations: string[] = [];

    // Check bundle size
    if (analysis.totalSize > 3 * 1024 * 1024) { // 3MB
      recommendations.push('Bundle size is large. Consider code splitting and lazy loading.');
    }

    // Check JS size
    if (analysis.jsSize > 2 * 1024 * 1024) { // 2MB
      recommendations.push('JavaScript bundle is large. Consider removing unused dependencies.');
    }

    // Check image size
    if (analysis.imageSize > 1 * 1024 * 1024) { // 1MB
      recommendations.push('Image assets are large. Consider image optimization and compression.');
    }

    // Check for large chunks
    const largeChunks = analysis.chunks.filter(chunk => chunk.size > 500 * 1024);
    if (largeChunks.length > 0) {
      recommendations.push(`Large chunks detected: ${largeChunks.map(c => c.name).join(', ')}`);
    }

    return recommendations;
  }

  // Monitor bundle performance
  static monitorBundlePerformance() {
    const startTime = Date.now();
    
    // Monitor initial bundle load
    if (Platform.OS === 'web') {
      window.addEventListener('load', () => {
        const loadTime = Date.now() - startTime;
        performanceMonitor.addMetrics({
          timestamp: Date.now(),
          renderTime: loadTime
        });
        
        console.log(`Bundle loaded in ${loadTime}ms`);
      });
    }
  }
}

// Tree shaking utilities
export class TreeShaker {
  private static usedModules = new Set<string>();
  private static unusedModules = new Set<string>();

  // Track module usage
  static trackModuleUsage(moduleName: string) {
    this.usedModules.add(moduleName);
  }

  // Mark module as unused
  static markUnused(moduleName: string) {
    this.unusedModules.add(moduleName);
  }

  // Get usage statistics
  static getUsageStats() {
    return {
      usedModules: Array.from(this.usedModules),
      unusedModules: Array.from(this.unusedModules),
      usageRate: this.calculateUsageRate()
    };
  }

  private static calculateUsageRate(): number {
    const total = this.usedModules.size + this.unusedModules.size;
    return total > 0 ? (this.usedModules.size / total) * 100 : 0;
  }

  // Generate tree shaking report
  static generateReport() {
    const stats = this.getUsageStats();
    
    return {
      ...stats,
      recommendations: [
        ...stats.unusedModules.length > 0 ? 
          [`Remove unused modules: ${stats.unusedModules.slice(0, 5).join(', ')}`] : [],
        stats.usageRate < 80 ? 
          'Low module usage rate. Consider removing unused dependencies.' : ''
      ].filter(Boolean)
    };
  }
}

// Performance budget utilities
export class PerformanceBudget {
  private static budgets = {
    totalBundleSize: 3 * 1024 * 1024, // 3MB
    jsSize: 2 * 1024 * 1024, // 2MB
    imageSize: 1 * 1024 * 1024, // 1MB
    initialLoadTime: 3000, // 3 seconds
    renderTime: 100 // 100ms per component
  };

  // Check if performance budget is exceeded
  static async checkBudget(): Promise<{
    passed: boolean;
    violations: string[];
    analysis: BundleAnalysis;
  }> {
    const analysis = await BundleAnalyzer.analyzeBundleSize();
    const violations: string[] = [];

    // Check bundle size budget
    if (analysis.totalSize > this.budgets.totalBundleSize) {
      violations.push(`Total bundle size (${this.formatBytes(analysis.totalSize)}) exceeds budget (${this.formatBytes(this.budgets.totalBundleSize)})`);
    }

    if (analysis.jsSize > this.budgets.jsSize) {
      violations.push(`JS size (${this.formatBytes(analysis.jsSize)}) exceeds budget (${this.formatBytes(this.budgets.jsSize)})`);
    }

    if (analysis.imageSize > this.budgets.imageSize) {
      violations.push(`Image size (${this.formatBytes(analysis.imageSize)}) exceeds budget (${this.formatBytes(this.budgets.imageSize)})`);
    }

    return {
      passed: violations.length === 0,
      violations,
      analysis
    };
  }

  private static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Update budget limits
  static updateBudgets(newBudgets: Partial<typeof PerformanceBudget.budgets>) {
    this.budgets = { ...this.budgets, ...newBudgets };
  }

  // Get current budgets
  static getBudgets() {
    return { ...this.budgets };
  }
}

// Export all utilities
export {
  CodeSplitter,
  AssetOptimizer,
  BundleAnalyzer,
  TreeShaker,
  PerformanceBudget
};