/**
 * Image Caching System
 * 
 * Implements basic image caching to improve performance and reduce network requests.
 * Phase 1 Task 3: Basic Image Caching Implementation
 */

import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CachedImage {
  url: string;
  localUri?: string;
  timestamp: number;
  size?: number;
}

interface CacheStats {
  totalImages: number;
  totalSize: number;
  oldestTimestamp: number;
  newestTimestamp: number;
}

const CACHE_KEY_PREFIX = 'image_cache_';
const CACHE_METADATA_KEY = 'image_cache_metadata';
const MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_CACHE_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days
const MAX_CACHE_ITEMS = 100;

class ImageCacheManager {
  private cacheMetadata: Map<string, CachedImage> = new Map();
  private initialized = false;

  async initialize() {
    if (this.initialized) return;
    
    try {
      const metadataJson = await AsyncStorage.getItem(CACHE_METADATA_KEY);
      if (metadataJson) {
        const metadata = JSON.parse(metadataJson);
        this.cacheMetadata = new Map(Object.entries(metadata));
      }
      this.initialized = true;
      
      // Clean up old cache entries on initialization
      await this.cleanupCache();
    } catch (error) {
      console.error('Failed to initialize image cache:', error);
      this.initialized = true; // Continue without cache
    }
  }

  private getCacheKey(url: string): string {
    return CACHE_KEY_PREFIX + this.hashUrl(url);
  }

  private hashUrl(url: string): string {
    // Simple hash function for URL
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
      const char = url.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  async getCachedImageUri(url: string): Promise<string | null> {
    await this.initialize();
    
    const cacheKey = this.getCacheKey(url);
    const cachedImage = this.cacheMetadata.get(cacheKey);
    
    if (!cachedImage) {
      return null;
    }
    
    // Check if cache entry is too old
    const age = Date.now() - cachedImage.timestamp;
    if (age > MAX_CACHE_AGE) {
      await this.removeCachedImage(url);
      return null;
    }
    
    // Check if cached file still exists
    try {
      const cachedData = await AsyncStorage.getItem(cacheKey);
      if (cachedData) {
        // For now, we return the original URL since we're using URL-based caching
        // In a full implementation, this would return a local file URI
        return url;
      } else {
        // Cache metadata exists but data is missing, clean up
        await this.removeCachedImage(url);
        return null;
      }
    } catch (error) {
      console.error('Error checking cached image:', error);
      return null;
    }
  }

  async cacheImage(url: string): Promise<boolean> {
    await this.initialize();
    
    try {
      const cacheKey = this.getCacheKey(url);
      
      // Check if already cached
      if (this.cacheMetadata.has(cacheKey)) {
        return true;
      }
      
      // For basic implementation, we just store the URL and metadata
      // In a full implementation, this would download and store the actual image data
      const cachedImage: CachedImage = {
        url,
        timestamp: Date.now(),
        size: 0, // Would be actual file size in full implementation
      };
      
      // Store metadata
      this.cacheMetadata.set(cacheKey, cachedImage);
      await this.saveCacheMetadata();
      
      // Store a marker in AsyncStorage (in full implementation, this would be image data)
      await AsyncStorage.setItem(cacheKey, JSON.stringify({ url, cached: true }));
      
      // Check cache size limits
      await this.enforceCache Limits();
      
      return true;
    } catch (error) {
      console.error('Failed to cache image:', error);
      return false;
    }
  }

  async removeCachedImage(url: string): Promise<void> {
    await this.initialize();
    
    const cacheKey = this.getCacheKey(url);
    
    try {
      // Remove from AsyncStorage
      await AsyncStorage.removeItem(cacheKey);
      
      // Remove from metadata
      this.cacheMetadata.delete(cacheKey);
      await this.saveCacheMetadata();
    } catch (error) {
      console.error('Failed to remove cached image:', error);
    }
  }

  async clearCache(): Promise<void> {
    await this.initialize();
    
    try {
      // Remove all cached images
      const keys = Array.from(this.cacheMetadata.keys());
      await AsyncStorage.multiRemove(keys);
      
      // Clear metadata
      this.cacheMetadata.clear();
      await AsyncStorage.removeItem(CACHE_METADATA_KEY);
      
      console.log('Image cache cleared successfully');
    } catch (error) {
      console.error('Failed to clear image cache:', error);
    }
  }

  async getCacheStats(): Promise<CacheStats> {
    await this.initialize();
    
    const images = Array.from(this.cacheMetadata.values());
    const totalImages = images.length;
    const totalSize = images.reduce((sum, img) => sum + (img.size || 0), 0);
    const timestamps = images.map(img => img.timestamp);
    
    return {
      totalImages,
      totalSize,
      oldestTimestamp: timestamps.length > 0 ? Math.min(...timestamps) : 0,
      newestTimestamp: timestamps.length > 0 ? Math.max(...timestamps) : 0,
    };
  }

  private async cleanupCache(): Promise<void> {
    const now = Date.now();
    const expiredKeys: string[] = [];
    
    // Find expired entries
    for (const [key, cachedImage] of this.cacheMetadata.entries()) {
      const age = now - cachedImage.timestamp;
      if (age > MAX_CACHE_AGE) {
        expiredKeys.push(key);
      }
    }
    
    // Remove expired entries
    if (expiredKeys.length > 0) {
      try {
        await AsyncStorage.multiRemove(expiredKeys);
        expiredKeys.forEach(key => this.cacheMetadata.delete(key));
        await this.saveCacheMetadata();
        console.log(`Cleaned up ${expiredKeys.length} expired cache entries`);
      } catch (error) {
        console.error('Failed to cleanup expired cache entries:', error);
      }
    }
  }

  private async enforceCacheLimits(): Promise<void> {
    const stats = await this.getCacheStats();
    
    // Check item count limit
    if (stats.totalImages > MAX_CACHE_ITEMS) {
      await this.evictOldestEntries(stats.totalImages - MAX_CACHE_ITEMS);
    }
    
    // Note: Size limit enforcement would be implemented in full version
    // when we actually store image data
  }

  private async evictOldestEntries(count: number): Promise<void> {
    const entries = Array.from(this.cacheMetadata.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    const toRemove = entries.slice(0, count);
    const keysToRemove = toRemove.map(([key]) => key);
    
    try {
      await AsyncStorage.multiRemove(keysToRemove);
      keysToRemove.forEach(key => this.cacheMetadata.delete(key));
      await this.saveCacheMetadata();
      console.log(`Evicted ${count} oldest cache entries`);
    } catch (error) {
      console.error('Failed to evict cache entries:', error);
    }
  }

  private async saveCacheMetadata(): Promise<void> {
    try {
      const metadata = Object.fromEntries(this.cacheMetadata.entries());
      await AsyncStorage.setItem(CACHE_METADATA_KEY, JSON.stringify(metadata));
    } catch (error) {
      console.error('Failed to save cache metadata:', error);
    }
  }
}

// Singleton instance
export const imageCache = new ImageCacheManager();

// Hook for using image cache in components
export function useImageCache() {
  const [cachedUri, setCachedUri] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const loadImage = async (url: string) => {
    if (!url) return;
    
    setLoading(true);
    
    try {
      // Check cache first
      const cached = await imageCache.getCachedImageUri(url);
      if (cached) {
        setCachedUri(cached);
        setLoading(false);
        return;
      }
      
      // Cache the image for future use
      await imageCache.cacheImage(url);
      setCachedUri(url);
    } catch (error) {
      console.error('Error loading image:', error);
      setCachedUri(url); // Fallback to original URL
    } finally {
      setLoading(false);
    }
  };

  return { cachedUri, loading, loadImage };
}

// TODO: Full implementation improvements needed:
// 1. Actually download and store image files locally
// 2. Implement proper file system caching using expo-file-system
// 3. Add image compression and optimization
// 4. Implement progressive loading with placeholders
// 5. Add cache warming strategies
// 6. Implement background cache cleanup
// 7. Add cache hit/miss analytics

export default imageCache;