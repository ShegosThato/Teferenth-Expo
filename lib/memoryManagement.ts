/**
 * Advanced Memory Management System
 * 
 * Comprehensive memory management with automatic cleanup, leak detection,
 * and intelligent resource allocation based on device capabilities.
 */

import { Platform, AppState, AppStateStatus } from 'react-native';
import { enhancedPerformanceMonitor } from './enhancedPerformance';
import { imageOptimizer } from './enhancedImageOptimization';
import { codeSplitter } from './advancedCodeSplitting';

// Memory pressure levels
export enum MemoryPressure {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// Memory allocation categories
export enum MemoryCategory {
  IMAGES = 'images',
  COMPONENTS = 'components',
  DATA = 'data',
  CACHE = 'cache',
  TEMPORARY = 'temporary',
}

// Memory allocation tracking
interface MemoryAllocation {
  id: string;
  category: MemoryCategory;
  size: number;
  allocatedAt: number;
  lastAccessed: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  cleanup?: () => Promise<void> | void;
  metadata?: Record<string, unknown>;
}

// Memory statistics
export interface MemoryStats {
  totalAllocated: number;
  availableMemory: number;
  memoryPressure: MemoryPressure;
  allocationsByCategory: Record<MemoryCategory, number>;
  largestAllocations: Array<{
    id: string;
    category: MemoryCategory;
    size: number;
    age: number;
  }>;
  gcSuggestions: string[];
}

// Memory warning thresholds
interface MemoryThresholds {
  low: number;      // 60% of available memory
  medium: number;   // 75% of available memory
  high: number;     // 85% of available memory
  critical: number; // 95% of available memory
}

// Cleanup strategy configuration
interface CleanupStrategy {
  category: MemoryCategory;
  maxAge: number;           // Max age in milliseconds
  maxSize: number;          // Max total size for category
  priority: number;         // Cleanup priority (higher = cleaned first)
  aggressive: boolean;      // Whether to use aggressive cleanup
}

export class MemoryManager {
  private static instance: MemoryManager;
  private allocations = new Map<string, MemoryAllocation>();
  private totalAllocated = 0;
  private maxMemoryLimit: number;
  private thresholds: MemoryThresholds;
  private cleanupStrategies: CleanupStrategy[];
  private isCleaningUp = false;
  private memoryWarningListeners: Array<(pressure: MemoryPressure) => void> = [];
  private gcTimer: NodeJS.Timeout | null = null;

  private constructor() {
    this.maxMemoryLimit = this.estimateMemoryLimit();
    this.thresholds = this.calculateThresholds();
    this.cleanupStrategies = this.getDefaultCleanupStrategies();
    this.initialize();
  }

  public static getInstance(): MemoryManager {
    if (!this.instance) {
      this.instance = new MemoryManager();
    }
    return this.instance;
  }

  // Initialize memory management
  private initialize(): void {
    this.setupMemoryWarningHandlers();
    this.startPeriodicCleanup();
    this.setupAppStateHandlers();
    
    console.log('🧠 Memory manager initialized', {
      maxMemoryLimit: `${(this.maxMemoryLimit / 1024 / 1024).toFixed(1)}MB`,
      thresholds: {
        low: `${(this.thresholds.low / 1024 / 1024).toFixed(1)}MB`,
        medium: `${(this.thresholds.medium / 1024 / 1024).toFixed(1)}MB`,
        high: `${(this.thresholds.high / 1024 / 1024).toFixed(1)}MB`,
        critical: `${(this.thresholds.critical / 1024 / 1024).toFixed(1)}MB`,
      },
    });
  }

  // Estimate device memory limit
  private estimateMemoryLimit(): number {
    if (Platform.OS === 'web') {
      // Use navigator.deviceMemory if available
      const deviceMemory = (navigator as any).deviceMemory;
      if (deviceMemory) {
        return deviceMemory * 1024 * 1024 * 1024 * 0.3; // 30% of device memory
      }
      return 512 * 1024 * 1024; // 512MB default for web
    }
    
    // For React Native, estimate based on platform
    if (Platform.OS === 'ios') {
      return 1024 * 1024 * 1024; // 1GB for iOS
    } else {
      return 512 * 1024 * 1024; // 512MB for Android
    }
  }

  // Calculate memory pressure thresholds
  private calculateThresholds(): MemoryThresholds {
    return {
      low: this.maxMemoryLimit * 0.6,
      medium: this.maxMemoryLimit * 0.75,
      high: this.maxMemoryLimit * 0.85,
      critical: this.maxMemoryLimit * 0.95,
    };
  }

  // Get default cleanup strategies
  private getDefaultCleanupStrategies(): CleanupStrategy[] {
    return [
      {
        category: MemoryCategory.TEMPORARY,
        maxAge: 5 * 60 * 1000, // 5 minutes
        maxSize: 50 * 1024 * 1024, // 50MB
        priority: 1,
        aggressive: true,
      },
      {
        category: MemoryCategory.CACHE,
        maxAge: 30 * 60 * 1000, // 30 minutes
        maxSize: 100 * 1024 * 1024, // 100MB
        priority: 2,
        aggressive: false,
      },
      {
        category: MemoryCategory.IMAGES,
        maxAge: 60 * 60 * 1000, // 1 hour
        maxSize: 200 * 1024 * 1024, // 200MB
        priority: 3,
        aggressive: false,
      },
      {
        category: MemoryCategory.DATA,
        maxAge: 2 * 60 * 60 * 1000, // 2 hours
        maxSize: 100 * 1024 * 1024, // 100MB
        priority: 4,
        aggressive: false,
      },
      {
        category: MemoryCategory.COMPONENTS,
        maxAge: 10 * 60 * 1000, // 10 minutes
        maxSize: 50 * 1024 * 1024, // 50MB
        priority: 5,
        aggressive: false,
      },
    ];
  }

  // Setup memory warning handlers
  private setupMemoryWarningHandlers(): void {
    if (Platform.OS === 'ios') {
      // iOS memory warnings would be handled via native modules
      // For now, we'll simulate based on our own tracking
    }
    
    // Monitor our own memory usage
    setInterval(() => {
      const pressure = this.getCurrentMemoryPressure();
      if (pressure !== MemoryPressure.LOW) {
        this.handleMemoryWarning(pressure);
      }
    }, 10000); // Check every 10 seconds
  }

  // Setup app state handlers
  private setupAppStateHandlers(): void {
    AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background') {
        this.handleAppBackground();
      } else if (nextAppState === 'active') {
        this.handleAppForeground();
      }
    });
  }

  // Handle app going to background
  private async handleAppBackground(): Promise<void> {
    console.log('📱 App backgrounded - performing memory cleanup');
    
    // Aggressive cleanup when app goes to background
    await this.performCleanup({
      aggressive: true,
      categories: [MemoryCategory.TEMPORARY, MemoryCategory.CACHE],
    });
    
    // Clear image cache partially
    const imageStats = imageOptimizer.getCacheStats();
    if (imageStats.totalSize > 50 * 1024 * 1024) { // 50MB
      console.log('🖼️ Clearing image cache due to background state');
      // Would implement partial cache clearing
    }
  }

  // Handle app coming to foreground
  private handleAppForeground(): void {
    console.log('📱 App foregrounded - resuming normal operation');
    
    // Resume normal cleanup schedule
    this.startPeriodicCleanup();
  }

  // Start periodic cleanup
  private startPeriodicCleanup(): void {
    if (this.gcTimer) {
      clearInterval(this.gcTimer);
    }
    
    this.gcTimer = setInterval(() => {
      this.performPeriodicCleanup();
    }, 60000); // Every minute
  }

  // Allocate memory for a resource
  public allocate(
    id: string,
    category: MemoryCategory,
    size: number,
    options: {
      priority?: 'low' | 'medium' | 'high' | 'critical';
      cleanup?: () => Promise<void> | void;
      metadata?: Record<string, unknown>;
    } = {}
  ): boolean {
    const { priority = 'medium', cleanup, metadata } = options;
    
    // Check if allocation would exceed limits
    if (this.totalAllocated + size > this.maxMemoryLimit) {
      console.warn(`❌ Memory allocation failed: ${id} (${size} bytes) - would exceed limit`);
      return false;
    }
    
    // Check for existing allocation
    if (this.allocations.has(id)) {
      console.warn(`⚠️ Memory allocation already exists: ${id}`);
      return false;
    }
    
    const allocation: MemoryAllocation = {
      id,
      category,
      size,
      allocatedAt: Date.now(),
      lastAccessed: Date.now(),
      priority,
      cleanup,
      metadata,
    };
    
    this.allocations.set(id, allocation);
    this.totalAllocated += size;
    
    // Check memory pressure after allocation
    const pressure = this.getCurrentMemoryPressure();
    if (pressure !== MemoryPressure.LOW) {
      this.handleMemoryWarning(pressure);
    }
    
    console.log(`✅ Memory allocated: ${id} (${size} bytes, ${category})`);
    return true;
  }

  // Deallocate memory for a resource
  public async deallocate(id: string): Promise<boolean> {
    const allocation = this.allocations.get(id);
    if (!allocation) {
      console.warn(`⚠️ Memory allocation not found: ${id}`);
      return false;
    }
    
    try {
      // Run cleanup function if provided
      if (allocation.cleanup) {
        await allocation.cleanup();
      }
      
      this.allocations.delete(id);
      this.totalAllocated -= allocation.size;
      
      console.log(`🗑️ Memory deallocated: ${id} (${allocation.size} bytes, ${allocation.category})`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to deallocate memory: ${id}`, error);
      return false;
    }
  }

  // Update access time for an allocation
  public touch(id: string): void {
    const allocation = this.allocations.get(id);
    if (allocation) {
      allocation.lastAccessed = Date.now();
    }
  }

  // Get current memory pressure level
  public getCurrentMemoryPressure(): MemoryPressure {
    if (this.totalAllocated >= this.thresholds.critical) {
      return MemoryPressure.CRITICAL;
    } else if (this.totalAllocated >= this.thresholds.high) {
      return MemoryPressure.HIGH;
    } else if (this.totalAllocated >= this.thresholds.medium) {
      return MemoryPressure.MEDIUM;
    } else {
      return MemoryPressure.LOW;
    }
  }

  // Handle memory warnings
  private async handleMemoryWarning(pressure: MemoryPressure): Promise<void> {
    console.warn(`⚠️ Memory pressure: ${pressure}`);
    
    // Notify listeners
    this.memoryWarningListeners.forEach(listener => listener(pressure));
    
    // Perform cleanup based on pressure level
    switch (pressure) {
      case MemoryPressure.CRITICAL:
        await this.performEmergencyCleanup();
        break;
      case MemoryPressure.HIGH:
        await this.performAggressiveCleanup();
        break;
      case MemoryPressure.MEDIUM:
        await this.performModerateCleanup();
        break;
    }
    
    // Track memory pressure in performance monitor
    enhancedPerformanceMonitor.trackOperation('memory_pressure', pressure === MemoryPressure.CRITICAL ? 100 : 50);
  }

  // Emergency cleanup for critical memory pressure
  private async performEmergencyCleanup(): Promise<void> {
    console.log('🚨 Performing emergency memory cleanup');
    
    await this.performCleanup({
      aggressive: true,
      categories: [
        MemoryCategory.TEMPORARY,
        MemoryCategory.CACHE,
        MemoryCategory.IMAGES,
      ],
      forceCleanup: true,
    });
    
    // Clear external caches
    await imageOptimizer.clearCache();
    codeSplitter.clearCache();
  }

  // Aggressive cleanup for high memory pressure
  private async performAggressiveCleanup(): Promise<void> {
    console.log('🧹 Performing aggressive memory cleanup');
    
    await this.performCleanup({
      aggressive: true,
      categories: [MemoryCategory.TEMPORARY, MemoryCategory.CACHE],
    });
  }

  // Moderate cleanup for medium memory pressure
  private async performModerateCleanup(): Promise<void> {
    console.log('🧽 Performing moderate memory cleanup');
    
    await this.performCleanup({
      aggressive: false,
      categories: [MemoryCategory.TEMPORARY],
    });
  }

  // Periodic cleanup
  private async performPeriodicCleanup(): Promise<void> {
    if (this.isCleaningUp) return;
    
    const pressure = this.getCurrentMemoryPressure();
    if (pressure === MemoryPressure.LOW) {
      // Only clean up expired items during low pressure
      await this.cleanupExpiredAllocations();
    }
  }

  // Main cleanup method
  private async performCleanup(options: {
    aggressive?: boolean;
    categories?: MemoryCategory[];
    forceCleanup?: boolean;
  } = {}): Promise<void> {
    if (this.isCleaningUp && !options.forceCleanup) return;
    
    this.isCleaningUp = true;
    const startTime = performance.now();
    
    try {
      const { aggressive = false, categories } = options;
      const targetCategories = categories || Object.values(MemoryCategory);
      
      let cleanedSize = 0;
      let cleanedCount = 0;
      
      // Get cleanup candidates
      const candidates = this.getCleanupCandidates(targetCategories, aggressive);
      
      // Perform cleanup
      for (const allocation of candidates) {
        const success = await this.deallocate(allocation.id);
        if (success) {
          cleanedSize += allocation.size;
          cleanedCount++;
        }
      }
      
      const cleanupTime = performance.now() - startTime;
      console.log(`✨ Cleanup completed: ${cleanedCount} items, ${(cleanedSize / 1024 / 1024).toFixed(1)}MB freed in ${cleanupTime.toFixed(1)}ms`);
      
      enhancedPerformanceMonitor.trackOperation('memory_cleanup', cleanupTime);
    } finally {
      this.isCleaningUp = false;
    }
  }

  // Get cleanup candidates based on strategies
  private getCleanupCandidates(
    categories: MemoryCategory[],
    aggressive: boolean
  ): MemoryAllocation[] {
    const now = Date.now();
    const candidates: MemoryAllocation[] = [];
    
    for (const category of categories) {
      const strategy = this.cleanupStrategies.find(s => s.category === category);
      if (!strategy) continue;
      
      const categoryAllocations = Array.from(this.allocations.values())
        .filter(allocation => allocation.category === category);
      
      // Sort by priority and age
      categoryAllocations.sort((a, b) => {
        const priorityWeight = { low: 1, medium: 2, high: 3, critical: 4 };
        const aPriority = priorityWeight[a.priority];
        const bPriority = priorityWeight[b.priority];
        
        if (aPriority !== bPriority) {
          return aPriority - bPriority; // Lower priority first
        }
        
        return (now - a.lastAccessed) - (now - b.lastAccessed); // Older first
      });
      
      // Select candidates based on strategy
      for (const allocation of categoryAllocations) {
        const age = now - allocation.lastAccessed;
        const shouldCleanup = aggressive || 
          (strategy.aggressive && age > strategy.maxAge) ||
          allocation.priority === 'low';
        
        if (shouldCleanup && allocation.priority !== 'critical') {
          candidates.push(allocation);
        }
      }
    }
    
    return candidates;
  }

  // Clean up expired allocations
  private async cleanupExpiredAllocations(): Promise<void> {
    const now = Date.now();
    const expiredAllocations: MemoryAllocation[] = [];
    
    for (const allocation of this.allocations.values()) {
      const strategy = this.cleanupStrategies.find(s => s.category === allocation.category);
      if (strategy) {
        const age = now - allocation.lastAccessed;
        if (age > strategy.maxAge && allocation.priority !== 'critical') {
          expiredAllocations.push(allocation);
        }
      }
    }
    
    if (expiredAllocations.length > 0) {
      console.log(`🕐 Cleaning up ${expiredAllocations.length} expired allocations`);
      
      for (const allocation of expiredAllocations) {
        await this.deallocate(allocation.id);
      }
    }
  }

  // Get memory statistics
  public getMemoryStats(): MemoryStats {
    const allocationsByCategory = {} as Record<MemoryCategory, number>;
    const largestAllocations: Array<{
      id: string;
      category: MemoryCategory;
      size: number;
      age: number;
    }> = [];
    
    const now = Date.now();
    
    // Calculate allocations by category
    for (const category of Object.values(MemoryCategory)) {
      allocationsByCategory[category] = 0;
    }
    
    for (const allocation of this.allocations.values()) {
      allocationsByCategory[allocation.category] += allocation.size;
      largestAllocations.push({
        id: allocation.id,
        category: allocation.category,
        size: allocation.size,
        age: now - allocation.allocatedAt,
      });
    }
    
    // Sort largest allocations
    largestAllocations.sort((a, b) => b.size - a.size);
    
    return {
      totalAllocated: this.totalAllocated,
      availableMemory: this.maxMemoryLimit - this.totalAllocated,
      memoryPressure: this.getCurrentMemoryPressure(),
      allocationsByCategory,
      largestAllocations: largestAllocations.slice(0, 10),
      gcSuggestions: this.generateGCSuggestions(),
    };
  }

  // Generate garbage collection suggestions
  private generateGCSuggestions(): string[] {
    const suggestions: string[] = [];
    const stats = this.getMemoryStats();
    
    // Check for large categories
    for (const [category, size] of Object.entries(stats.allocationsByCategory)) {
      const strategy = this.cleanupStrategies.find(s => s.category === category as MemoryCategory);
      if (strategy && size > strategy.maxSize) {
        suggestions.push(`Consider cleaning up ${category} category (${(size / 1024 / 1024).toFixed(1)}MB)`);
      }
    }
    
    // Check memory pressure
    if (stats.memoryPressure !== MemoryPressure.LOW) {
      suggestions.push(`Memory pressure is ${stats.memoryPressure} - consider immediate cleanup`);
    }
    
    // Check for old allocations
    const oldAllocations = stats.largestAllocations.filter(a => a.age > 60 * 60 * 1000); // 1 hour
    if (oldAllocations.length > 0) {
      suggestions.push(`${oldAllocations.length} allocations are over 1 hour old`);
    }
    
    return suggestions;
  }

  // Subscribe to memory warnings
  public onMemoryWarning(listener: (pressure: MemoryPressure) => void): () => void {
    this.memoryWarningListeners.push(listener);
    return () => {
      this.memoryWarningListeners = this.memoryWarningListeners.filter(l => l !== listener);
    };
  }

  // Force garbage collection
  public async forceGC(): Promise<void> {
    console.log('🗑️ Forcing garbage collection');
    
    await this.performCleanup({
      aggressive: true,
      forceCleanup: true,
    });
    
    // Trigger native GC if available
    if (global.gc) {
      global.gc();
    }
  }

  // Cleanup on app termination
  public async cleanup(): Promise<void> {
    if (this.gcTimer) {
      clearInterval(this.gcTimer);
    }
    
    // Cleanup all allocations
    const allocationIds = Array.from(this.allocations.keys());
    for (const id of allocationIds) {
      await this.deallocate(id);
    }
    
    console.log('🧠 Memory manager cleaned up');
  }
}

// Export singleton instance
export const memoryManager = MemoryManager.getInstance();

// React hook for memory management
export function useMemoryManagement(
  id: string,
  category: MemoryCategory,
  size: number,
  options: {
    priority?: 'low' | 'medium' | 'high' | 'critical';
    cleanup?: () => Promise<void> | void;
  } = {}
) {
  const [isAllocated, setIsAllocated] = React.useState(false);
  const [memoryStats, setMemoryStats] = React.useState(memoryManager.getMemoryStats());
  
  React.useEffect(() => {
    const success = memoryManager.allocate(id, category, size, options);
    setIsAllocated(success);
    
    return () => {
      if (success) {
        memoryManager.deallocate(id);
      }
    };
  }, [id, category, size]);
  
  React.useEffect(() => {
    const updateStats = () => setMemoryStats(memoryManager.getMemoryStats());
    const interval = setInterval(updateStats, 5000); // Update every 5 seconds
    
    return () => clearInterval(interval);
  }, []);
  
  const touch = React.useCallback(() => {
    memoryManager.touch(id);
  }, [id]);
  
  return {
    isAllocated,
    memoryStats,
    touch,
    forceGC: () => memoryManager.forceGC(),
  };
}