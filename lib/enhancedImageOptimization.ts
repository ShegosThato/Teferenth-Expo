/**
 * Enhanced Image Optimization and Caching
 * 
 * Advanced image optimization system with intelligent caching,
 * progressive loading, and adaptive quality based on device capabilities.
 */

import { Platform, Dimensions } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { enhancedPerformanceMonitor } from './enhancedPerformance';
import { CONFIG } from '../config/enhancedEnv';

// Image optimization configuration
export interface ImageOptimizationConfig {
  quality: number;                  // 0.1 - 1.0
  maxWidth: number;
  maxHeight: number;
  format: 'jpeg' | 'png' | 'webp';
  progressive: boolean;
  blur: number;                     // For progressive loading
  compressionLevel: number;         // 0-9 for PNG
}

// Image metadata
export interface ImageMetadata {
  originalSize: number;
  optimizedSize: number;
  dimensions: { width: number; height: number };
  format: string;
  quality: number;
  optimizedAt: number;
  accessCount: number;
  lastAccessed: number;
}

// Cache entry for images
interface ImageCacheEntry {
  uri: string;
  localPath: string;
  metadata: ImageMetadata;
  priority: 'low' | 'medium' | 'high';
  expiresAt: number;
}

// Device capability assessment
interface DeviceCapabilities {
  screenDensity: number;
  screenSize: { width: number; height: number };
  memoryClass: 'low' | 'medium' | 'high';
  networkSpeed: 'slow' | 'medium' | 'fast';
  storageAvailable: number;
}

// Progressive loading states
export enum LoadingState {
  PLACEHOLDER = 'placeholder',
  BLUR = 'blur',
  LOW_QUALITY = 'low_quality',
  HIGH_QUALITY = 'high_quality',
  ERROR = 'error',
}

export class EnhancedImageOptimizer {
  private static instance: EnhancedImageOptimizer;
  private cache = new Map<string, ImageCacheEntry>();
  private loadingPromises = new Map<string, Promise<string>>();
  private maxCacheSize = 100 * 1024 * 1024; // 100MB
  private currentCacheSize = 0;
  private cacheDirectory: string;
  private deviceCapabilities: DeviceCapabilities;

  private constructor() {
    this.cacheDirectory = `${FileSystem.cacheDirectory}images/`;
    this.deviceCapabilities = this.assessDeviceCapabilities();
    this.initializeCache();
  }

  public static getInstance(): EnhancedImageOptimizer {
    if (!this.instance) {
      this.instance = new EnhancedImageOptimizer();
    }
    return this.instance;
  }

  // Initialize cache system
  private async initializeCache(): Promise<void> {
    try {
      // Create cache directory if it doesn't exist
      const dirInfo = await FileSystem.getInfoAsync(this.cacheDirectory);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.cacheDirectory, { intermediates: true });
      }

      // Load existing cache entries
      await this.loadCacheIndex();
      
      // Clean up expired entries
      await this.cleanupExpiredEntries();
      
      console.log('🖼️ Image cache initialized');
    } catch (error) {
      console.error('Failed to initialize image cache:', error);
    }
  }

  // Assess device capabilities for optimization decisions
  private assessDeviceCapabilities(): DeviceCapabilities {
    const { width, height } = Dimensions.get('screen');
    const screenSize = { width, height };
    
    // Estimate memory class based on screen size and platform
    let memoryClass: 'low' | 'medium' | 'high' = 'medium';
    const totalPixels = width * height;
    
    if (totalPixels < 1280 * 720) {
      memoryClass = 'low';
    } else if (totalPixels > 1920 * 1080) {
      memoryClass = 'high';
    }
    
    return {
      screenDensity: Platform.OS === 'web' ? window.devicePixelRatio || 1 : 2,
      screenSize,
      memoryClass,
      networkSpeed: 'medium', // Would be determined by network monitoring
      storageAvailable: 500 * 1024 * 1024, // 500MB estimated
    };
  }

  // Get optimal configuration based on device capabilities and image context
  private getOptimalConfig(
    originalDimensions: { width: number; height: number },
    context: {
      displaySize: { width: number; height: number };
      priority: 'low' | 'medium' | 'high';
      isVisible: boolean;
    }
  ): ImageOptimizationConfig {
    const { displaySize, priority, isVisible } = context;
    const { memoryClass, screenDensity } = this.deviceCapabilities;
    
    // Calculate target dimensions
    const targetWidth = Math.min(
      displaySize.width * screenDensity,
      originalDimensions.width
    );
    const targetHeight = Math.min(
      displaySize.height * screenDensity,
      originalDimensions.height
    );
    
    // Adjust quality based on device capabilities and priority
    let quality = 0.8;
    if (memoryClass === 'low') {
      quality = priority === 'high' ? 0.7 : 0.6;
    } else if (memoryClass === 'high') {
      quality = priority === 'high' ? 0.9 : 0.8;
    }
    
    // Reduce quality for non-visible images
    if (!isVisible) {
      quality *= 0.7;
    }
    
    return {
      quality,
      maxWidth: targetWidth,
      maxHeight: targetHeight,
      format: this.selectOptimalFormat(originalDimensions),
      progressive: true,
      blur: 10, // For progressive loading
      compressionLevel: memoryClass === 'low' ? 6 : 4,
    };
  }

  // Select optimal image format
  private selectOptimalFormat(dimensions: { width: number; height: number }): 'jpeg' | 'png' | 'webp' {
    // WebP for modern platforms with good compression
    if (Platform.OS === 'web' && this.supportsWebP()) {
      return 'webp';
    }
    
    // PNG for images with transparency or small images
    const totalPixels = dimensions.width * dimensions.height;
    if (totalPixels < 100 * 100) {
      return 'png';
    }
    
    // JPEG for photos and large images
    return 'jpeg';
  }

  private supportsWebP(): boolean {
    // Check WebP support in browser
    if (Platform.OS === 'web') {
      const canvas = document.createElement('canvas');
      return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    }
    return false;
  }

  // Main optimization method
  public async optimizeImage(
    imageUri: string,
    displaySize: { width: number; height: number },
    options: {
      priority?: 'low' | 'medium' | 'high';
      isVisible?: boolean;
      placeholder?: string;
      onProgress?: (state: LoadingState, progress: number) => void;
    } = {}
  ): Promise<{
    uri: string;
    metadata: ImageMetadata;
    loadingStates: { [key in LoadingState]?: string };
  }> {
    const {
      priority = 'medium',
      isVisible = true,
      placeholder,
      onProgress,
    } = options;

    const cacheKey = this.generateCacheKey(imageUri, displaySize, priority);
    
    try {
      // Check cache first
      const cached = this.cache.get(cacheKey);
      if (cached && !this.isExpired(cached)) {
        this.updateCacheAccess(cacheKey);
        onProgress?.(LoadingState.HIGH_QUALITY, 1);
        
        return {
          uri: cached.localPath,
          metadata: cached.metadata,
          loadingStates: {
            [LoadingState.HIGH_QUALITY]: cached.localPath,
          },
        };
      }

      // Check if already optimizing
      const existingPromise = this.loadingPromises.get(cacheKey);
      if (existingPromise) {
        const uri = await existingPromise;
        const entry = this.cache.get(cacheKey);
        return {
          uri,
          metadata: entry!.metadata,
          loadingStates: {
            [LoadingState.HIGH_QUALITY]: uri,
          },
        };
      }

      // Start optimization process
      const optimizationPromise = this.performOptimization(
        imageUri,
        displaySize,
        { priority, isVisible, placeholder, onProgress }
      );
      
      this.loadingPromises.set(cacheKey, optimizationPromise);
      
      const result = await optimizationPromise;
      this.loadingPromises.delete(cacheKey);
      
      return result;
    } catch (error) {
      this.loadingPromises.delete(cacheKey);
      enhancedPerformanceMonitor.trackError(`image_optimization_${cacheKey}`, error as Error);
      
      // Return original image as fallback
      onProgress?.(LoadingState.ERROR, 0);
      return {
        uri: imageUri,
        metadata: {
          originalSize: 0,
          optimizedSize: 0,
          dimensions: { width: 0, height: 0 },
          format: 'unknown',
          quality: 1,
          optimizedAt: Date.now(),
          accessCount: 0,
          lastAccessed: Date.now(),
        },
        loadingStates: {
          [LoadingState.ERROR]: imageUri,
        },
      };
    }
  }

  // Perform the actual optimization
  private async performOptimization(
    imageUri: string,
    displaySize: { width: number; height: number },
    options: {
      priority: 'low' | 'medium' | 'high';
      isVisible: boolean;
      placeholder?: string;
      onProgress?: (state: LoadingState, progress: number) => void;
    }
  ): Promise<{
    uri: string;
    metadata: ImageMetadata;
    loadingStates: { [key in LoadingState]?: string };
  }> {
    const { priority, isVisible, placeholder, onProgress } = options;
    const startTime = performance.now();
    
    // Step 1: Show placeholder
    if (placeholder) {
      onProgress?.(LoadingState.PLACEHOLDER, 0.1);
    }

    // Step 2: Get original image info
    onProgress?.(LoadingState.BLUR, 0.2);
    const originalInfo = await this.getImageInfo(imageUri);
    
    // Step 3: Generate optimization config
    const config = this.getOptimalConfig(originalInfo.dimensions, {
      displaySize,
      priority,
      isVisible,
    });

    // Step 4: Create progressive versions
    const loadingStates: { [key in LoadingState]?: string } = {};
    
    // Generate blur placeholder
    if (isVisible) {
      onProgress?.(LoadingState.BLUR, 0.4);
      const blurVersion = await this.generateBlurVersion(imageUri, config);
      loadingStates[LoadingState.BLUR] = blurVersion;
    }

    // Generate low quality version
    onProgress?.(LoadingState.LOW_QUALITY, 0.6);
    const lowQualityConfig = { ...config, quality: config.quality * 0.5 };
    const lowQualityVersion = await this.optimizeImageWithConfig(imageUri, lowQualityConfig);
    loadingStates[LoadingState.LOW_QUALITY] = lowQualityVersion.uri;

    // Generate high quality version
    onProgress?.(LoadingState.HIGH_QUALITY, 0.8);
    const highQualityVersion = await this.optimizeImageWithConfig(imageUri, config);
    loadingStates[LoadingState.HIGH_QUALITY] = highQualityVersion.uri;

    // Cache the result
    const cacheKey = this.generateCacheKey(imageUri, displaySize, priority);
    await this.cacheOptimizedImage(cacheKey, highQualityVersion, priority);

    onProgress?.(LoadingState.HIGH_QUALITY, 1);

    const optimizationTime = performance.now() - startTime;
    enhancedPerformanceMonitor.trackOperation('image_optimization', optimizationTime);

    return {
      uri: highQualityVersion.uri,
      metadata: highQualityVersion.metadata,
      loadingStates,
    };
  }

  // Get image information
  private async getImageInfo(imageUri: string): Promise<{
    dimensions: { width: number; height: number };
    size: number;
    format: string;
  }> {
    // This would use a native module or library to get actual image info
    // For now, we'll simulate the response
    return {
      dimensions: { width: 1920, height: 1080 },
      size: 500 * 1024, // 500KB
      format: 'jpeg',
    };
  }

  // Generate blur version for progressive loading
  private async generateBlurVersion(
    imageUri: string,
    config: ImageOptimizationConfig
  ): Promise<string> {
    // This would use image processing library to create a blurred version
    // For now, we'll return the original URI with a blur parameter
    return `${imageUri}?blur=${config.blur}&quality=0.1`;
  }

  // Optimize image with specific configuration
  private async optimizeImageWithConfig(
    imageUri: string,
    config: ImageOptimizationConfig
  ): Promise<{
    uri: string;
    metadata: ImageMetadata;
  }> {
    // This would use react-native-image-resizer or similar library
    // For now, we'll simulate the optimization
    
    const optimizedUri = `${this.cacheDirectory}${this.generateFileName(imageUri, config)}`;
    
    // Simulate optimization process
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const metadata: ImageMetadata = {
      originalSize: 500 * 1024, // Simulated
      optimizedSize: Math.floor(500 * 1024 * config.quality),
      dimensions: {
        width: config.maxWidth,
        height: config.maxHeight,
      },
      format: config.format,
      quality: config.quality,
      optimizedAt: Date.now(),
      accessCount: 1,
      lastAccessed: Date.now(),
    };

    return {
      uri: optimizedUri,
      metadata,
    };
  }

  // Cache management methods
  private async cacheOptimizedImage(
    cacheKey: string,
    optimizedImage: { uri: string; metadata: ImageMetadata },
    priority: 'low' | 'medium' | 'high'
  ): Promise<void> {
    const expirationTime = this.getExpirationTime(priority);
    
    const entry: ImageCacheEntry = {
      uri: cacheKey,
      localPath: optimizedImage.uri,
      metadata: optimizedImage.metadata,
      priority,
      expiresAt: Date.now() + expirationTime,
    };

    // Check if we need to evict entries
    if (this.currentCacheSize + optimizedImage.metadata.optimizedSize > this.maxCacheSize) {
      await this.evictLeastUsedEntries(optimizedImage.metadata.optimizedSize);
    }

    this.cache.set(cacheKey, entry);
    this.currentCacheSize += optimizedImage.metadata.optimizedSize;
    
    // Persist cache index
    await this.saveCacheIndex();
  }

  private getExpirationTime(priority: 'low' | 'medium' | 'high'): number {
    const baseTime = 24 * 60 * 60 * 1000; // 24 hours
    
    switch (priority) {
      case 'high': return baseTime * 7; // 7 days
      case 'medium': return baseTime * 3; // 3 days
      case 'low': return baseTime; // 1 day
    }
  }

  private async evictLeastUsedEntries(requiredSpace: number): Promise<void> {
    const entries = Array.from(this.cache.entries())
      .map(([key, entry]) => ({
        key,
        entry,
        score: this.calculateEvictionScore(entry),
      }))
      .sort((a, b) => a.score - b.score);

    let freedSpace = 0;
    for (const { key, entry } of entries) {
      if (freedSpace >= requiredSpace) break;

      try {
        await FileSystem.deleteAsync(entry.localPath, { idempotent: true });
        this.cache.delete(key);
        this.currentCacheSize -= entry.metadata.optimizedSize;
        freedSpace += entry.metadata.optimizedSize;
        
        console.log(`🗑️ Evicted image: ${key} (freed ${entry.metadata.optimizedSize} bytes)`);
      } catch (error) {
        console.warn(`Failed to evict image ${key}:`, error);
      }
    }
  }

  private calculateEvictionScore(entry: ImageCacheEntry): number {
    const now = Date.now();
    const age = now - entry.metadata.optimizedAt;
    const timeSinceAccess = now - entry.metadata.lastAccessed;
    const priorityWeight = entry.priority === 'high' ? 3 : entry.priority === 'medium' ? 2 : 1;
    
    // Lower score = more likely to be evicted
    return (entry.metadata.accessCount * priorityWeight) / (age + timeSinceAccess);
  }

  // Utility methods
  private generateCacheKey(
    imageUri: string,
    displaySize: { width: number; height: number },
    priority: string
  ): string {
    const hash = this.simpleHash(`${imageUri}_${displaySize.width}x${displaySize.height}_${priority}`);
    return hash.toString();
  }

  private generateFileName(imageUri: string, config: ImageOptimizationConfig): string {
    const hash = this.simpleHash(imageUri + JSON.stringify(config));
    return `${hash}.${config.format}`;
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private updateCacheAccess(cacheKey: string): void {
    const entry = this.cache.get(cacheKey);
    if (entry) {
      entry.metadata.lastAccessed = Date.now();
      entry.metadata.accessCount++;
    }
  }

  private isExpired(entry: ImageCacheEntry): boolean {
    return Date.now() > entry.expiresAt;
  }

  private async cleanupExpiredEntries(): Promise<void> {
    const now = Date.now();
    const expiredEntries = Array.from(this.cache.entries())
      .filter(([, entry]) => now > entry.expiresAt);

    for (const [key, entry] of expiredEntries) {
      try {
        await FileSystem.deleteAsync(entry.localPath, { idempotent: true });
        this.cache.delete(key);
        this.currentCacheSize -= entry.metadata.optimizedSize;
      } catch (error) {
        console.warn(`Failed to cleanup expired image ${key}:`, error);
      }
    }

    if (expiredEntries.length > 0) {
      console.log(`🧹 Cleaned up ${expiredEntries.length} expired images`);
      await this.saveCacheIndex();
    }
  }

  // Cache persistence
  private async loadCacheIndex(): Promise<void> {
    try {
      const indexPath = `${this.cacheDirectory}index.json`;
      const indexInfo = await FileSystem.getInfoAsync(indexPath);
      
      if (indexInfo.exists) {
        const indexData = await FileSystem.readAsStringAsync(indexPath);
        const entries = JSON.parse(indexData) as Array<[string, ImageCacheEntry]>;
        
        for (const [key, entry] of entries) {
          this.cache.set(key, entry);
          this.currentCacheSize += entry.metadata.optimizedSize;
        }
        
        console.log(`📂 Loaded ${entries.length} cached images`);
      }
    } catch (error) {
      console.warn('Failed to load cache index:', error);
    }
  }

  private async saveCacheIndex(): Promise<void> {
    try {
      const indexPath = `${this.cacheDirectory}index.json`;
      const entries = Array.from(this.cache.entries());
      await FileSystem.writeAsStringAsync(indexPath, JSON.stringify(entries));
    } catch (error) {
      console.warn('Failed to save cache index:', error);
    }
  }

  // Public API
  public getCacheStats(): {
    totalSize: number;
    entryCount: number;
    hitRate: number;
    topImages: Array<{
      key: string;
      accessCount: number;
      size: number;
      priority: string;
    }>;
  } {
    const entries = Array.from(this.cache.values());
    const totalAccess = entries.reduce((sum, entry) => sum + entry.metadata.accessCount, 0);
    
    return {
      totalSize: this.currentCacheSize,
      entryCount: entries.length,
      hitRate: totalAccess > 0 ? entries.length / totalAccess : 0,
      topImages: entries
        .map(entry => ({
          key: entry.uri,
          accessCount: entry.metadata.accessCount,
          size: entry.metadata.optimizedSize,
          priority: entry.priority,
        }))
        .sort((a, b) => b.accessCount - a.accessCount)
        .slice(0, 10),
    };
  }

  public async clearCache(): Promise<void> {
    try {
      await FileSystem.deleteAsync(this.cacheDirectory, { idempotent: true });
      await FileSystem.makeDirectoryAsync(this.cacheDirectory, { intermediates: true });
      
      this.cache.clear();
      this.currentCacheSize = 0;
      
      console.log('🗑️ Image cache cleared');
    } catch (error) {
      console.error('Failed to clear image cache:', error);
    }
  }

  public preloadImage(
    imageUri: string,
    displaySize: { width: number; height: number },
    priority: 'low' | 'medium' | 'high' = 'low'
  ): Promise<void> {
    return this.optimizeImage(imageUri, displaySize, {
      priority,
      isVisible: false,
    }).then(() => {
      console.log(`🔄 Preloaded image: ${imageUri}`);
    });
  }
}

// Export singleton instance
export const imageOptimizer = EnhancedImageOptimizer.getInstance();

// React hook for image optimization
export function useOptimizedImage(
  imageUri: string,
  displaySize: { width: number; height: number },
  options: {
    priority?: 'low' | 'medium' | 'high';
    placeholder?: string;
  } = {}
) {
  const [state, setState] = React.useState<{
    uri: string;
    loadingState: LoadingState;
    progress: number;
    error?: Error;
  }>({
    uri: options.placeholder || imageUri,
    loadingState: LoadingState.PLACEHOLDER,
    progress: 0,
  });

  React.useEffect(() => {
    let isCancelled = false;

    const optimizeImage = async () => {
      try {
        const result = await imageOptimizer.optimizeImage(
          imageUri,
          displaySize,
          {
            ...options,
            isVisible: true,
            onProgress: (loadingState, progress) => {
              if (!isCancelled) {
                setState(prev => ({
                  ...prev,
                  loadingState,
                  progress,
                  uri: result.loadingStates[loadingState] || prev.uri,
                }));
              }
            },
          }
        );

        if (!isCancelled) {
          setState(prev => ({
            ...prev,
            uri: result.uri,
            loadingState: LoadingState.HIGH_QUALITY,
            progress: 1,
          }));
        }
      } catch (error) {
        if (!isCancelled) {
          setState(prev => ({
            ...prev,
            loadingState: LoadingState.ERROR,
            error: error as Error,
          }));
        }
      }
    };

    optimizeImage();

    return () => {
      isCancelled = true;
    };
  }, [imageUri, displaySize.width, displaySize.height, options.priority]);

  return state;
}