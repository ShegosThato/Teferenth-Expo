/**
 * Advanced Code Splitting and Lazy Loading
 * 
 * Intelligent code splitting system that dynamically loads components
 * based on performance metrics, user behavior, and device capabilities.
 */

import React, { Suspense, lazy, ComponentType } from 'react';
import { Platform } from 'react-native';
import { enhancedPerformanceMonitor } from './enhancedPerformance';
import { CONFIG } from '../config/enhancedEnv';

// Module loading strategies
export enum LoadingStrategy {
  IMMEDIATE = 'immediate',           // Load immediately
  ON_DEMAND = 'on_demand',          // Load when needed
  PRELOAD = 'preload',              // Preload during idle time
  PROGRESSIVE = 'progressive',       // Load progressively based on usage
  ADAPTIVE = 'adaptive',            // Adapt based on performance
}

// Module metadata for intelligent loading
export interface ModuleMetadata {
  name: string;
  size: number;                     // Estimated size in bytes
  priority: 'low' | 'medium' | 'high' | 'critical';
  dependencies: string[];           // Other modules this depends on
  usage: {
    frequency: number;              // How often it's used (0-1)
    lastUsed: number;              // Timestamp of last use
    loadTime: number;              // Average load time
  };
  conditions?: {
    platform?: ('ios' | 'android' | 'web')[];
    minMemory?: number;             // Minimum memory required
    networkType?: string[];         // Required network types
  };
}

// Loading context for decision making
export interface LoadingContext {
  availableMemory: number;
  networkSpeed: 'slow' | 'medium' | 'fast';
  batteryLevel: number;
  isLowPowerMode: boolean;
  currentLoad: number;              // Current system load (0-1)
  userBehavior: {
    isActive: boolean;
    recentActions: string[];
  };
}

// Module cache entry
interface CacheEntry<T = any> {
  module: T;
  loadedAt: number;
  lastAccessed: number;
  accessCount: number;
  size: number;
}

// Advanced code splitter class
export class AdvancedCodeSplitter {
  private static instance: AdvancedCodeSplitter;
  private moduleCache = new Map<string, CacheEntry>();
  private loadingPromises = new Map<string, Promise<any>>();
  private moduleMetadata = new Map<string, ModuleMetadata>();
  private preloadQueue: string[] = [];
  private isPreloading = false;
  private maxCacheSize = 50 * 1024 * 1024; // 50MB cache limit
  private currentCacheSize = 0;

  private constructor() {
    this.initializePreloading();
    this.setupCacheManagement();
  }

  public static getInstance(): AdvancedCodeSplitter {
    if (!this.instance) {
      this.instance = new AdvancedCodeSplitter();
    }
    return this.instance;
  }

  // Register module metadata
  public registerModule(metadata: ModuleMetadata): void {
    this.moduleMetadata.set(metadata.name, metadata);
    
    // Add to preload queue if high priority
    if (metadata.priority === 'high' || metadata.priority === 'critical') {
      this.addToPreloadQueue(metadata.name);
    }
  }

  // Intelligent module loading with strategy selection
  public async loadModule<T>(
    moduleName: string,
    importFn: () => Promise<{ default: T }>,
    strategy?: LoadingStrategy
  ): Promise<T> {
    const startTime = performance.now();
    
    try {
      // Check cache first
      const cached = this.moduleCache.get(moduleName);
      if (cached) {
        this.updateCacheAccess(moduleName);
        return cached.module;
      }

      // Check if already loading
      const existingPromise = this.loadingPromises.get(moduleName);
      if (existingPromise) {
        return existingPromise;
      }

      // Determine loading strategy
      const finalStrategy = strategy || this.determineOptimalStrategy(moduleName);
      
      // Execute loading based on strategy
      const loadPromise = this.executeLoadingStrategy(moduleName, importFn, finalStrategy);
      this.loadingPromises.set(moduleName, loadPromise);

      const result = await loadPromise;
      
      // Cache the result
      this.cacheModule(moduleName, result, performance.now() - startTime);
      
      // Clean up loading promise
      this.loadingPromises.delete(moduleName);
      
      // Update usage statistics
      this.updateUsageStats(moduleName, performance.now() - startTime);
      
      return result;
    } catch (error) {
      this.loadingPromises.delete(moduleName);
      enhancedPerformanceMonitor.trackError(`load_module_${moduleName}`, error as Error);
      throw error;
    }
  }

  // Determine optimal loading strategy based on context
  private determineOptimalStrategy(moduleName: string): LoadingStrategy {
    const metadata = this.moduleMetadata.get(moduleName);
    const context = this.getCurrentLoadingContext();
    
    // Critical modules always load immediately
    if (metadata?.priority === 'critical') {
      return LoadingStrategy.IMMEDIATE;
    }
    
    // Adapt based on performance conditions
    if (context.availableMemory < 100 * 1024 * 1024) { // Less than 100MB
      return LoadingStrategy.ON_DEMAND;
    }
    
    if (context.networkSpeed === 'slow' || context.isLowPowerMode) {
      return LoadingStrategy.ON_DEMAND;
    }
    
    // High usage modules get preloaded
    if (metadata?.usage.frequency > 0.7) {
      return LoadingStrategy.PRELOAD;
    }
    
    // Default to progressive loading
    return LoadingStrategy.PROGRESSIVE;
  }

  // Execute loading strategy
  private async executeLoadingStrategy<T>(
    moduleName: string,
    importFn: () => Promise<{ default: T }>,
    strategy: LoadingStrategy
  ): Promise<T> {
    switch (strategy) {
      case LoadingStrategy.IMMEDIATE:
        return this.loadImmediate(importFn);
        
      case LoadingStrategy.ON_DEMAND:
        return this.loadOnDemand(importFn);
        
      case LoadingStrategy.PRELOAD:
        return this.loadWithPreload(moduleName, importFn);
        
      case LoadingStrategy.PROGRESSIVE:
        return this.loadProgressive(moduleName, importFn);
        
      case LoadingStrategy.ADAPTIVE:
        return this.loadAdaptive(moduleName, importFn);
        
      default:
        return this.loadImmediate(importFn);
    }
  }

  // Loading strategy implementations
  private async loadImmediate<T>(importFn: () => Promise<{ default: T }>): Promise<T> {
    const module = await importFn();
    return module.default;
  }

  private async loadOnDemand<T>(importFn: () => Promise<{ default: T }>): Promise<T> {
    // Wait for next idle period
    await this.waitForIdlePeriod();
    return this.loadImmediate(importFn);
  }

  private async loadWithPreload<T>(
    moduleName: string,
    importFn: () => Promise<{ default: T }>
  ): Promise<T> {
    // Add dependencies to preload queue
    const metadata = this.moduleMetadata.get(moduleName);
    if (metadata?.dependencies) {
      metadata.dependencies.forEach(dep => this.addToPreloadQueue(dep));
    }
    
    return this.loadImmediate(importFn);
  }

  private async loadProgressive<T>(
    moduleName: string,
    importFn: () => Promise<{ default: T }>
  ): Promise<T> {
    // Load in chunks if module is large
    const metadata = this.moduleMetadata.get(moduleName);
    if (metadata && metadata.size > 1024 * 1024) { // 1MB threshold
      // For large modules, we could implement chunk loading
      // This is a simplified version
      await this.waitForIdlePeriod();
    }
    
    return this.loadImmediate(importFn);
  }

  private async loadAdaptive<T>(
    moduleName: string,
    importFn: () => Promise<{ default: T }>
  ): Promise<T> {
    const context = this.getCurrentLoadingContext();
    
    // Adapt loading based on current conditions
    if (context.currentLoad > 0.8) {
      await this.waitForIdlePeriod();
    }
    
    return this.loadImmediate(importFn);
  }

  // Get current loading context
  private getCurrentLoadingContext(): LoadingContext {
    const performanceReport = enhancedPerformanceMonitor.getPerformanceReport();
    
    return {
      availableMemory: 200 * 1024 * 1024, // Simulated - would use native modules
      networkSpeed: this.estimateNetworkSpeed(),
      batteryLevel: 0.8, // Simulated
      isLowPowerMode: false, // Simulated
      currentLoad: performanceReport.summary.averageMemoryUsage / 100,
      userBehavior: {
        isActive: true,
        recentActions: [], // Would track user actions
      },
    };
  }

  private estimateNetworkSpeed(): 'slow' | 'medium' | 'fast' {
    const report = enhancedPerformanceMonitor.getPerformanceReport();
    const avgLatency = report.summary.averageRenderTime; // Using render time as proxy
    
    if (avgLatency > 1000) return 'slow';
    if (avgLatency > 500) return 'medium';
    return 'fast';
  }

  // Cache management
  private cacheModule<T>(moduleName: string, module: T, loadTime: number): void {
    const metadata = this.moduleMetadata.get(moduleName);
    const size = metadata?.size || 1024; // Default 1KB if unknown
    
    // Check if we need to evict modules
    if (this.currentCacheSize + size > this.maxCacheSize) {
      this.evictLeastUsedModules(size);
    }
    
    const entry: CacheEntry<T> = {
      module,
      loadedAt: Date.now(),
      lastAccessed: Date.now(),
      accessCount: 1,
      size,
    };
    
    this.moduleCache.set(moduleName, entry);
    this.currentCacheSize += size;
  }

  private updateCacheAccess(moduleName: string): void {
    const entry = this.moduleCache.get(moduleName);
    if (entry) {
      entry.lastAccessed = Date.now();
      entry.accessCount++;
    }
  }

  private evictLeastUsedModules(requiredSpace: number): void {
    // Sort by access frequency and recency
    const entries = Array.from(this.moduleCache.entries())
      .map(([name, entry]) => ({
        name,
        entry,
        score: entry.accessCount / (Date.now() - entry.lastAccessed),
      }))
      .sort((a, b) => a.score - b.score);
    
    let freedSpace = 0;
    for (const { name, entry } of entries) {
      if (freedSpace >= requiredSpace) break;
      
      this.moduleCache.delete(name);
      this.currentCacheSize -= entry.size;
      freedSpace += entry.size;
      
      console.log(`🗑️ Evicted module: ${name} (freed ${entry.size} bytes)`);
    }
  }

  // Preloading management
  private initializePreloading(): void {
    // Start preloading during idle periods
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(() => this.processPreloadQueue());
    } else {
      // Fallback for React Native
      setTimeout(() => this.processPreloadQueue(), 1000);
    }
  }

  private addToPreloadQueue(moduleName: string): void {
    if (!this.preloadQueue.includes(moduleName)) {
      this.preloadQueue.push(moduleName);
    }
  }

  private async processPreloadQueue(): Promise<void> {
    if (this.isPreloading || this.preloadQueue.length === 0) return;
    
    this.isPreloading = true;
    
    try {
      while (this.preloadQueue.length > 0) {
        const moduleName = this.preloadQueue.shift()!;
        const metadata = this.moduleMetadata.get(moduleName);
        
        if (metadata && !this.moduleCache.has(moduleName)) {
          // Check if conditions are met for preloading
          if (this.shouldPreload(metadata)) {
            console.log(`🔄 Preloading module: ${moduleName}`);
            // Note: We'd need the import function to actually preload
            // This is a placeholder for the preloading logic
          }
        }
        
        // Yield control to prevent blocking
        await this.waitForIdlePeriod();
      }
    } finally {
      this.isPreloading = false;
    }
  }

  private shouldPreload(metadata: ModuleMetadata): boolean {
    const context = this.getCurrentLoadingContext();
    
    // Don't preload if low on memory
    if (context.availableMemory < 150 * 1024 * 1024) return false;
    
    // Don't preload if low power mode
    if (context.isLowPowerMode) return false;
    
    // Don't preload if slow network
    if (context.networkSpeed === 'slow') return false;
    
    // Check platform conditions
    if (metadata.conditions?.platform && 
        !metadata.conditions.platform.includes(Platform.OS as any)) {
      return false;
    }
    
    return true;
  }

  // Utility methods
  private async waitForIdlePeriod(): Promise<void> {
    return new Promise(resolve => {
      if (typeof requestIdleCallback !== 'undefined') {
        requestIdleCallback(() => resolve());
      } else {
        setTimeout(resolve, 16); // Next frame
      }
    });
  }

  private updateUsageStats(moduleName: string, loadTime: number): void {
    const metadata = this.moduleMetadata.get(moduleName);
    if (metadata) {
      metadata.usage.lastUsed = Date.now();
      metadata.usage.loadTime = (metadata.usage.loadTime + loadTime) / 2; // Moving average
      metadata.usage.frequency = Math.min(1, metadata.usage.frequency + 0.1);
    }
  }

  private setupCacheManagement(): void {
    // Periodic cache cleanup
    setInterval(() => {
      this.cleanupExpiredCache();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  private cleanupExpiredCache(): void {
    const now = Date.now();
    const maxAge = 30 * 60 * 1000; // 30 minutes
    
    for (const [name, entry] of this.moduleCache.entries()) {
      if (now - entry.lastAccessed > maxAge) {
        this.moduleCache.delete(name);
        this.currentCacheSize -= entry.size;
        console.log(`🧹 Cleaned up expired module: ${name}`);
      }
    }
  }

  // Public API for cache management
  public getCacheStats(): {
    totalSize: number;
    moduleCount: number;
    hitRate: number;
    topModules: Array<{ name: string; accessCount: number; size: number }>;
  } {
    const entries = Array.from(this.moduleCache.entries());
    const totalAccess = entries.reduce((sum, [, entry]) => sum + entry.accessCount, 0);
    
    return {
      totalSize: this.currentCacheSize,
      moduleCount: entries.length,
      hitRate: totalAccess > 0 ? entries.length / totalAccess : 0,
      topModules: entries
        .map(([name, entry]) => ({
          name,
          accessCount: entry.accessCount,
          size: entry.size,
        }))
        .sort((a, b) => b.accessCount - a.accessCount)
        .slice(0, 10),
    };
  }

  public clearCache(): void {
    this.moduleCache.clear();
    this.currentCacheSize = 0;
    console.log('🗑️ Module cache cleared');
  }
}

// React component wrapper for intelligent lazy loading
export function createIntelligentLazyComponent<P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  options: {
    name: string;
    fallback?: React.ComponentType;
    strategy?: LoadingStrategy;
    metadata?: Partial<ModuleMetadata>;
  }
): ComponentType<P> {
  const { name, fallback: Fallback, strategy, metadata } = options;
  const splitter = AdvancedCodeSplitter.getInstance();
  
  // Register module metadata if provided
  if (metadata) {
    splitter.registerModule({
      name,
      size: 1024, // Default size
      priority: 'medium',
      dependencies: [],
      usage: {
        frequency: 0,
        lastUsed: 0,
        loadTime: 0,
      },
      ...metadata,
    });
  }
  
  // Create lazy component with intelligent loading
  const LazyComponent = lazy(async () => {
    const component = await splitter.loadModule(name, importFn, strategy);
    return { default: component };
  });
  
  return (props: P) => (
    <Suspense fallback={Fallback ? <Fallback /> : <div>Loading...</div>}>
      <LazyComponent {...props} />
    </Suspense>
  );
}

// Hook for managing module loading
export function useModuleLoader() {
  const splitter = AdvancedCodeSplitter.getInstance();
  
  const loadModule = React.useCallback(
    async <T>(
      name: string,
      importFn: () => Promise<{ default: T }>,
      strategy?: LoadingStrategy
    ) => {
      return splitter.loadModule(name, importFn, strategy);
    },
    []
  );
  
  const cacheStats = React.useMemo(() => splitter.getCacheStats(), []);
  
  return {
    loadModule,
    cacheStats,
    clearCache: () => splitter.clearCache(),
  };
}

// Export singleton instance
export const codeSplitter = AdvancedCodeSplitter.getInstance();