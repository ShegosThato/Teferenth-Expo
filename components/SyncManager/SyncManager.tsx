/**
 * Refactored SyncManager Component
 * 
 * This is an improved version of the SyncManager with better separation of concerns,
 * custom hooks for logic, and improved maintainability.
 */

import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors } from '../../lib/theme';
import { useSyncManager } from './useSyncManager';
import { SyncIndicator } from './SyncIndicator';

export interface SyncManagerProps {
  // Optional props for customization
  position?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
  showPendingCount?: boolean;
  autoHide?: boolean;
  hideDelay?: number;
}

export const SyncManager: React.FC<SyncManagerProps> = ({
  position = 'bottom-left',
  showPendingCount = true,
  autoHide = true,
  hideDelay = 5000,
}) => {
  const {
    isSyncing,
    pendingActions,
    syncOpacity,
    isVisible,
  } = useSyncManager({ autoHide, hideDelay });

  if (!isVisible) {
    return null;
  }

  return (
    <Animated.View style={[
      styles.container,
      styles[position],
      { opacity: syncOpacity }
    ]}>
      <SyncIndicator
        isSyncing={isSyncing}
        pendingActions={pendingActions}
        showPendingCount={showPendingCount}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 1000,
  },
  'bottom-left': {
    bottom: 16,
    left: 16,
  },
  'bottom-right': {
    bottom: 16,
    right: 16,
  },
  'top-left': {
    top: 16,
    left: 16,
  },
  'top-right': {
    top: 16,
    right: 16,
  },
});