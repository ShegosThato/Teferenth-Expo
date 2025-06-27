/**
 * Intelligent Caching System
 * 
 * Advanced caching with machine learning-based predictions,
 * adaptive cache sizes, and intelligent eviction strategies.
 */

import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { enhancedPerformanceMonitor } from './enhancedPerformance';
import { memoryManager, MemoryCategory } from './memoryManagement';

// Cache entry metadata
interface CacheEntry<T = any> {
  key: string;
  data: T;
  size: number;
  createdAt: number;
  lastAccessed: number;
  accessCount: number;
  priority: number;
  ttl?: number;
  tags: string[];
  metadata: Record<string, unknown>;
}

// Cache statistics
interface CacheStats {
  totalEntries: number;
  totalSize: number;
  hitRate: number;
  missRate: number;
  evictionCount: number;
  averageAccessTime: number;
}

// Cache configuration
interface CacheConfig {
  maxSize: number;
  maxEntries: number;
  defaultTTL: number;
  evictionStrategy: 'lru' | 'lfu' | 'adaptive' | 'ml-based';
  compressionEnabled: boolean;
  persistToDisk: boolean;
  encryptionEnabled: boolean;
}

// Access pattern for ML predictions
interface AccessPattern {
  key: string;
  timestamp: number;
  context: Record<string, unknown>;
  sessionId: string;
  userAction: string;
}

// Prediction result
interface CachePrediction {
  key: string;
  probability: number;
  timeToAccess: number;
  confidence: number;
}

export class IntelligentCache<T = any> {
  private entries = new Map<string, CacheEntry<T>>();
  private accessPatterns: AccessPattern[] = [];
  private stats: CacheStats = {
    totalEntries: 0,
    totalSize: 0,
    hitRate: 0,
    missRate: 0,
    evictionCount: 0,
    averageAccessTime: 0,
  };
  private config: CacheConfig;
  private name: string;
  private diskCacheDir: string;
  private sessionId: string;

  constructor(name: string, config: Partial<CacheConfig> = {}) {
    this.name = name;
    this.config = {
      maxSize: 50 * 1024 * 1024, // 50MB
      maxEntries: 1000,
      defaultTTL: 60 * 60 * 1000, // 1 hour
      evictionStrategy: 'adaptive',
      compressionEnabled: true,
      persistToDisk: true,
      encryptionEnabled: false,
      ...config,
    };
    this.diskCacheDir = `${FileSystem.cacheDirectory}intelligent-cache/${name}/`;
    this.sessionId = Date.now().toString();
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      // Create disk cache directory
      if (this.config.persistToDisk) {
        const dirInfo = await FileSystem.getInfoAsync(this.diskCacheDir);
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(this.diskCacheDir, { intermediates: true });
        }
        await this.loadFromDisk();
      }

      // Load access patterns
      await this.loadAccessPatterns();

      // Start periodic cleanup
      this.startPeriodicCleanup();

      console.log(`🧠 Intelligent cache '${this.name}' initialized`);
    } catch (error) {
      console.error(`Failed to initialize cache '${this.name}':`, error);
    }
  }

  // Get item from cache
  public async get(key: string, context?: Record<string, unknown>): Promise<T | null> {
    const startTime = performance.now();
    
    try {
      let entry = this.entries.get(key);

      // Try loading from disk if not in memory
      if (!entry && this.config.persistToDisk) {
        entry = await this.loadFromDisk(key);
        if (entry) {
          this.entries.set(key, entry);
        }
      }

      if (!entry) {
        this.recordMiss(key, context);
        return null;
      }

      // Check TTL
      if (entry.ttl && Date.now() > entry.createdAt + entry.ttl) {
        await this.delete(key);
        this.recordMiss(key, context);
        return null;
      }

      // Update access metadata
      entry.lastAccessed = Date.now();
      entry.accessCount++;

      // Record access pattern for ML
      this.recordAccessPattern(key, context);

      // Record hit
      this.recordHit(key, performance.now() - startTime);

      return entry.data;
    } catch (error) {
      console.error(`Cache get error for key '${key}':`, error);
      return null;
    }
  }

  // Set item in cache
  public async set(
    key: string,
    data: T,
    options: {
      ttl?: number;
      priority?: number;
      tags?: string[];
      metadata?: Record<string, unknown>;
    } = {}
  ): Promise<boolean> {
    try {
      const size = this.calculateSize(data);
      const now = Date.now();

      // Check if we need to make space
      if (this.stats.totalSize + size > this.config.maxSize || 
          this.stats.totalEntries >= this.config.maxEntries) {
        await this.makeSpace(size);
      }

      const entry: CacheEntry<T> = {
        key,
        data,
        size,
        createdAt: now,
        lastAccessed: now,
        accessCount: 1,
        priority: options.priority || this.calculatePriority(key),
        ttl: options.ttl || this.config.defaultTTL,
        tags: options.tags || [],
        metadata: options.metadata || {},
      };

      // Store in memory
      this.entries.set(key, entry);

      // Store on disk if enabled
      if (this.config.persistToDisk) {
        await this.saveToDisk(entry);
      }

      // Update stats
      this.updateStatsOnSet(entry);

      // Register memory allocation
      memoryManager.allocate(
        `cache-${this.name}-${key}`,
        MemoryCategory.CACHE,
        size,
        {
          priority: 'medium',
          cleanup: () => this.delete(key),
          metadata: { cacheKey: key, cacheName: this.name },
        }
      );

      return true;
    } catch (error) {
      console.error(`Cache set error for key '${key}':`, error);
      return false;
    }
  }

  // Delete item from cache
  public async delete(key: string): Promise<boolean> {
    try {
      const entry = this.entries.get(key);
      if (!entry) return false;

      // Remove from memory
      this.entries.delete(key);

      // Remove from disk
      if (this.config.persistToDisk) {
        await this.deleteFromDisk(key);
      }

      // Update stats
      this.updateStatsOnDelete(entry);

      // Deallocate memory
      await memoryManager.deallocate(`cache-${this.name}-${key}`);

      return true;
    } catch (error) {
      console.error(`Cache delete error for key '${key}':`, error);
      return false;
    }
  }

  // Clear cache by tags
  public async clearByTags(tags: string[]): Promise<number> {
    let clearedCount = 0;
    
    for (const [key, entry] of this.entries) {
      if (entry.tags.some(tag => tags.includes(tag))) {
        await this.delete(key);
        clearedCount++;
      }
    }

    return clearedCount;
  }

  // Predict future cache accesses using ML
  public predictAccesses(timeWindow: number = 60000): CachePrediction[] {
    const predictions: CachePrediction[] = [];
    const now = Date.now();

    // Analyze access patterns
    const keyPatterns = new Map<string, AccessPattern[]>();
    
    for (const pattern of this.accessPatterns) {
      if (!keyPatterns.has(pattern.key)) {
        keyPatterns.set(pattern.key, []);
      }
      keyPatterns.get(pattern.key)!.push(pattern);
    }

    // Generate predictions for each key
    for (const [key, patterns] of keyPatterns) {
      if (patterns.length < 3) continue; // Need minimum data

      const prediction = this.generatePrediction(key, patterns, timeWindow);
      if (prediction.probability > 0.3) { // Only include likely predictions
        predictions.push(prediction);
      }
    }

    // Sort by probability
    return predictions.sort((a, b) => b.probability - a.probability);
  }

  // Generate prediction for a specific key
  private generatePrediction(
    key: string,
    patterns: AccessPattern[],
    timeWindow: number
  ): CachePrediction {
    const now = Date.now();
    const recentPatterns = patterns.filter(p => now - p.timestamp < 24 * 60 * 60 * 1000); // Last 24 hours

    if (recentPatterns.length === 0) {
      return { key, probability: 0, timeToAccess: Infinity, confidence: 0 };
    }

    // Calculate access frequency
    const accessFrequency = recentPatterns.length / 24; // Accesses per hour

    // Calculate time since last access
    const lastAccess = Math.max(...recentPatterns.map(p => p.timestamp));
    const timeSinceLastAccess = now - lastAccess;

    // Calculate average time between accesses
    const intervals = [];
    for (let i = 1; i < recentPatterns.length; i++) {
      intervals.push(recentPatterns[i].timestamp - recentPatterns[i - 1].timestamp);
    }
    const avgInterval = intervals.length > 0 ? 
      intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length : 
      Infinity;

    // Simple probability calculation
    const frequencyScore = Math.min(accessFrequency / 5, 1); // Normalize to 0-1
    const recencyScore = Math.max(0, 1 - (timeSinceLastAccess / (24 * 60 * 60 * 1000))); // Decay over 24 hours
    const intervalScore = avgInterval < timeWindow ? 0.8 : 0.2;

    const probability = (frequencyScore * 0.4 + recencyScore * 0.4 + intervalScore * 0.2);
    const timeToAccess = Math.max(0, avgInterval - timeSinceLastAccess);
    const confidence = Math.min(recentPatterns.length / 10, 1); // Higher confidence with more data

    return { key, probability, timeToAccess, confidence };
  }

  // Preload predicted cache entries
  public async preloadPredicted(
    loader: (key: string) => Promise<T>,
    maxPreloads: number = 5
  ): Promise<void> {
    const predictions = this.predictAccesses();
    const toPreload = predictions.slice(0, maxPreloads);

    for (const prediction of toPreload) {
      if (!this.entries.has(prediction.key)) {
        try {
          const data = await loader(prediction.key);
          await this.set(prediction.key, data, {
            priority: prediction.probability,
            metadata: { preloaded: true, prediction },
          });
        } catch (error) {
          console.warn(`Failed to preload cache key '${prediction.key}':`, error);
        }
      }
    }
  }

  // Make space in cache using intelligent eviction
  private async makeSpace(requiredSize: number): Promise<void> {
    const candidates = Array.from(this.entries.values());
    
    switch (this.config.evictionStrategy) {
      case 'lru':
        candidates.sort((a, b) => a.lastAccessed - b.lastAccessed);
        break;
      case 'lfu':
        candidates.sort((a, b) => a.accessCount - b.accessCount);
        break;
      case 'adaptive':
        candidates.sort((a, b) => this.calculateEvictionScore(a) - this.calculateEvictionScore(b));
        break;
      case 'ml-based':
        await this.mlBasedEviction(candidates, requiredSize);
        return;
    }

    // Evict entries until we have enough space
    let freedSize = 0;
    for (const candidate of candidates) {
      if (freedSize >= requiredSize && this.stats.totalEntries < this.config.maxEntries) {
        break;
      }
      
      await this.delete(candidate.key);
      freedSize += candidate.size;
      this.stats.evictionCount++;
    }
  }

  // Calculate eviction score for adaptive strategy
  private calculateEvictionScore(entry: CacheEntry<T>): number {
    const now = Date.now();
    const age = now - entry.createdAt;
    const timeSinceAccess = now - entry.lastAccessed;
    
    // Lower score = higher priority for eviction
    const ageScore = age / (24 * 60 * 60 * 1000); // Normalize by 24 hours
    const accessScore = 1 / (entry.accessCount + 1); // Inverse of access count
    const recencyScore = timeSinceAccess / (60 * 60 * 1000); // Normalize by 1 hour
    const priorityScore = 1 - entry.priority; // Inverse of priority
    const sizeScore = entry.size / (1024 * 1024); // Normalize by 1MB

    return ageScore * 0.2 + accessScore * 0.3 + recencyScore * 0.3 + priorityScore * 0.1 + sizeScore * 0.1;
  }

  // ML-based eviction strategy
  private async mlBasedEviction(candidates: CacheEntry<T>[], requiredSize: number): Promise<void> {
    // Predict which entries are least likely to be accessed soon
    const predictions = this.predictAccesses(60 * 60 * 1000); // Next hour
    const predictionMap = new Map(predictions.map(p => [p.key, p.probability]));

    // Sort by prediction probability (ascending - least likely first)
    candidates.sort((a, b) => {
      const aProbability = predictionMap.get(a.key) || 0;
      const bProbability = predictionMap.get(b.key) || 0;
      return aProbability - bProbability;
    });

    // Evict least likely to be accessed
    let freedSize = 0;
    for (const candidate of candidates) {
      if (freedSize >= requiredSize && this.stats.totalEntries < this.config.maxEntries) {
        break;
      }
      
      await this.delete(candidate.key);
      freedSize += candidate.size;
      this.stats.evictionCount++;
    }
  }

  // Calculate priority based on key characteristics
  private calculatePriority(key: string): number {
    // Simple heuristic - could be enhanced with ML
    if (key.includes('critical') || key.includes('user')) return 0.9;
    if (key.includes('image') || key.includes('media')) return 0.7;
    if (key.includes('temp') || key.includes('cache')) return 0.3;
    return 0.5;
  }

  // Calculate data size
  private calculateSize(data: T): number {
    try {
      return JSON.stringify(data).length * 2; // Rough estimate (UTF-16)
    } catch {
      return 1024; // Default size if can't calculate
    }
  }

  // Record access pattern for ML
  private recordAccessPattern(key: string, context?: Record<string, unknown>): void {
    const pattern: AccessPattern = {
      key,
      timestamp: Date.now(),
      context: context || {},
      sessionId: this.sessionId,
      userAction: context?.userAction as string || 'unknown',
    };

    this.accessPatterns.push(pattern);

    // Keep only recent patterns (last 1000)
    if (this.accessPatterns.length > 1000) {
      this.accessPatterns = this.accessPatterns.slice(-1000);
    }
  }

  // Record cache hit
  private recordHit(key: string, accessTime: number): void {
    this.stats.hitRate = (this.stats.hitRate * 0.9) + (1 * 0.1); // Exponential moving average
    this.stats.averageAccessTime = (this.stats.averageAccessTime * 0.9) + (accessTime * 0.1);
    
    enhancedPerformanceMonitor.trackOperation('cache_hit', accessTime);
  }

  // Record cache miss
  private recordMiss(key: string, context?: Record<string, unknown>): void {
    this.stats.missRate = (this.stats.missRate * 0.9) + (1 * 0.1);
    
    enhancedPerformanceMonitor.trackOperation('cache_miss', 0);
  }

  // Update stats on set
  private updateStatsOnSet(entry: CacheEntry<T>): void {
    this.stats.totalEntries = this.entries.size;
    this.stats.totalSize += entry.size;
  }

  // Update stats on delete
  private updateStatsOnDelete(entry: CacheEntry<T>): void {
    this.stats.totalEntries = this.entries.size;
    this.stats.totalSize -= entry.size;
  }

  // Load from disk
  private async loadFromDisk(key?: string): Promise<CacheEntry<T> | void> {
    if (!this.config.persistToDisk) return;

    try {
      if (key) {
        // Load specific entry
        const filePath = `${this.diskCacheDir}${key}.json`;
        const fileInfo = await FileSystem.getInfoAsync(filePath);
        if (fileInfo.exists) {
          const content = await FileSystem.readAsStringAsync(filePath);
          return JSON.parse(content) as CacheEntry<T>;
        }
      } else {
        // Load all entries
        const files = await FileSystem.readDirectoryAsync(this.diskCacheDir);
        for (const file of files) {
          if (file.endsWith('.json')) {
            const content = await FileSystem.readAsStringAsync(`${this.diskCacheDir}${file}`);
            const entry = JSON.parse(content) as CacheEntry<T>;
            this.entries.set(entry.key, entry);
          }
        }
      }
    } catch (error) {
      console.warn(`Failed to load cache from disk:`, error);
    }
  }

  // Save to disk
  private async saveToDisk(entry: CacheEntry<T>): Promise<void> {
    if (!this.config.persistToDisk) return;

    try {
      const filePath = `${this.diskCacheDir}${entry.key}.json`;
      await FileSystem.writeAsStringAsync(filePath, JSON.stringify(entry));
    } catch (error) {
      console.warn(`Failed to save cache entry to disk:`, error);
    }
  }

  // Delete from disk
  private async deleteFromDisk(key: string): Promise<void> {
    if (!this.config.persistToDisk) return;

    try {
      const filePath = `${this.diskCacheDir}${key}.json`;
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(filePath);
      }
    } catch (error) {
      console.warn(`Failed to delete cache entry from disk:`, error);
    }
  }

  // Load access patterns
  private async loadAccessPatterns(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(`cache-patterns-${this.name}`);
      if (stored) {
        this.accessPatterns = JSON.parse(stored);
      }
    } catch (error) {
      console.warn(`Failed to load access patterns:`, error);
    }
  }

  // Save access patterns
  private async saveAccessPatterns(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        `cache-patterns-${this.name}`,
        JSON.stringify(this.accessPatterns.slice(-500)) // Keep last 500 patterns
      );
    } catch (error) {
      console.warn(`Failed to save access patterns:`, error);
    }
  }

  // Start periodic cleanup
  private startPeriodicCleanup(): void {
    setInterval(async () => {
      await this.cleanup();
      await this.saveAccessPatterns();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  // Cleanup expired entries
  private async cleanup(): Promise<void> {
    const now = Date.now();
    const toDelete: string[] = [];

    for (const [key, entry] of this.entries) {
      if (entry.ttl && now > entry.createdAt + entry.ttl) {
        toDelete.push(key);
      }
    }

    for (const key of toDelete) {
      await this.delete(key);
    }
  }

  // Get cache statistics
  public getStats(): CacheStats {
    return { ...this.stats };
  }

  // Clear entire cache
  public async clear(): Promise<void> {
    const keys = Array.from(this.entries.keys());
    for (const key of keys) {
      await this.delete(key);
    }
  }
}

// Cache manager for multiple cache instances
export class CacheManager {
  private static instance: CacheManager;
  private caches = new Map<string, IntelligentCache>();

  public static getInstance(): CacheManager {
    if (!this.instance) {
      this.instance = new CacheManager();
    }
    return this.instance;
  }

  public getCache<T = any>(name: string, config?: Partial<CacheConfig>): IntelligentCache<T> {
    if (!this.caches.has(name)) {
      this.caches.set(name, new IntelligentCache<T>(name, config));
    }
    return this.caches.get(name)! as IntelligentCache<T>;
  }

  public async clearAllCaches(): Promise<void> {
    for (const cache of this.caches.values()) {
      await cache.clear();
    }
  }

  public getAllStats(): Record<string, CacheStats> {
    const stats: Record<string, CacheStats> = {};
    for (const [name, cache] of this.caches) {
      stats[name] = cache.getStats();
    }
    return stats;
  }
}

// Export singleton instance
export const cacheManager = CacheManager.getInstance();

// React hook for intelligent caching
export function useIntelligentCache<T = any>(
  cacheName: string,
  key: string,
  loader: () => Promise<T>,
  options: {
    ttl?: number;
    enabled?: boolean;
    dependencies?: any[];
  } = {}
) {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const cache = React.useMemo(() => 
    cacheManager.getCache<T>(cacheName), 
    [cacheName]
  );

  const loadData = React.useCallback(async () => {
    if (!options.enabled) return;

    setLoading(true);
    setError(null);

    try {
      // Try cache first
      let cachedData = await cache.get(key);
      
      if (cachedData) {
        setData(cachedData);
        setLoading(false);
        return;
      }

      // Load fresh data
      const freshData = await loader();
      await cache.set(key, freshData, { ttl: options.ttl });
      setData(freshData);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [cache, key, loader, options.ttl, options.enabled]);

  React.useEffect(() => {
    loadData();
  }, [loadData, ...(options.dependencies || [])]);

  const invalidate = React.useCallback(async () => {
    await cache.delete(key);
    await loadData();
  }, [cache, key, loadData]);

  return {
    data,
    loading,
    error,
    invalidate,
    refetch: loadData,
  };
}