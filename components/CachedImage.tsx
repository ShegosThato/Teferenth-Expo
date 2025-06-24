/**
 * CachedImage Component
 * 
 * A drop-in replacement for React Native's Image component with caching support.
 * Phase 1 Task 3: Basic Image Caching Implementation
 */

import React, { useEffect, useState } from 'react';
import { Image, ImageProps, ActivityIndicator, View, StyleSheet } from 'react-native';
import { imageCache } from '../lib/imageCache';
import { colors } from '../lib/theme';

interface CachedImageProps extends Omit<ImageProps, 'source'> {
  source: { uri: string } | { uri: string; cache?: 'default' | 'reload' | 'force-cache' | 'only-if-cached' };
  showLoadingIndicator?: boolean;
  loadingIndicatorColor?: string;
  fallbackSource?: ImageProps['source'];
}

export const CachedImage: React.FC<CachedImageProps> = ({
  source,
  showLoadingIndicator = true,
  loadingIndicatorColor = colors.primary,
  fallbackSource,
  style,
  ...props
}) => {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    loadImage();
  }, [source]);

  const loadImage = async () => {
    if (!source?.uri) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(false);

    try {
      // Check cache first
      const cachedUri = await imageCache.getCachedImageUri(source.uri);
      
      if (cachedUri) {
        // Use cached version
        setImageUri(cachedUri);
        setLoading(false);
      } else {
        // Use original URL and cache it for next time
        setImageUri(source.uri);
        setLoading(false);
        
        // Cache in background (don't wait for it)
        imageCache.cacheImage(source.uri).catch(err => {
          console.warn('Failed to cache image:', err);
        });
      }
    } catch (err) {
      console.error('Error loading image:', err);
      setError(true);
      setLoading(false);
      
      // Fallback to original URL
      if (source.uri) {
        setImageUri(source.uri);
      }
    }
  };

  const handleImageError = () => {
    setError(true);
    if (fallbackSource) {
      // If there's a fallback, we don't show the error state
      setError(false);
    }
  };

  const handleImageLoad = () => {
    setLoading(false);
  };

  // Show loading indicator
  if (loading && showLoadingIndicator) {
    return (
      <View style={[styles.loadingContainer, style]}>
        <ActivityIndicator size="small" color={loadingIndicatorColor} />
      </View>
    );
  }

  // Show fallback image if there's an error and fallback is provided
  if (error && fallbackSource) {
    return (
      <Image
        {...props}
        source={fallbackSource}
        style={style}
        onError={handleImageError}
        onLoad={handleImageLoad}
      />
    );
  }

  // Show main image
  if (imageUri) {
    return (
      <Image
        {...props}
        source={{ uri: imageUri }}
        style={style}
        onError={handleImageError}
        onLoad={handleImageLoad}
        // COMPLETED: Added accessibility labels (Phase 1 Task 4)
        accessible={true}
        accessibilityRole="image"
        accessibilityLabel={props.accessibilityLabel || "Scene image"}
      />
    );
  }

  // Show empty view if no image
  return <View style={[styles.emptyContainer, style]} />;
};

const styles = StyleSheet.create({
  loadingContainer: {
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 100,
  },
  emptyContainer: {
    backgroundColor: colors.border,
    minHeight: 100,
  },
});

export default CachedImage;