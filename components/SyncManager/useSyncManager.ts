/**
 * SyncManager Hook
 * 
 * Custom hook that handles all the sync logic, network monitoring,
 * and state management for the SyncManager component.
 */

import { useEffect, useRef, useState } from 'react';
import { Animated } from 'react-native';
import { useNetInfo } from '@react-native-community/netinfo';
import { useDatabase } from '../../db/DatabaseContext';
import { processActionQueue, cleanupCompletedActions } from '../../lib/syncEngine';
import { toast } from '../../lib/toast';
import { Q } from '@nozbe/watermelondb';
import { ActionQueue } from '../../db/models';
import { performanceMonitor } from '../../lib/performance';

interface UseSyncManagerOptions {
  autoHide?: boolean;
  hideDelay?: number;
  syncInterval?: number;
  cleanupInterval?: number;
}

interface SyncManagerState {
  isSyncing: boolean;
  pendingActions: number;
  syncOpacity: Animated.Value;
  isVisible: boolean;
  lastSyncTime?: number;
  syncError?: string;
}

export const useSyncManager = (options: UseSyncManagerOptions = {}) => {
  const {
    autoHide = true,
    hideDelay = 5000,
    syncInterval = 30000, // 30 seconds
    cleanupInterval = 3600000, // 1 hour
  } = options;

  const database = useDatabase();
  const netInfo = useNetInfo();
  const lastNetworkState = useRef(netInfo.isInternetReachable);
  
  const [state, setState] = useState<SyncManagerState>({
    isSyncing: false,
    pendingActions: 0,
    syncOpacity: new Animated.Value(0),
    isVisible: false,
  });

  // Check for pending actions
  const checkPendingActions = async () => {
    try {
      const startTime = performance.now();
      
      const actions = await database.get<ActionQueue>('action_queue').query(
        Q.where('status', 'pending')
      ).fetch();
      
      setState(prev => ({
        ...prev,
        pendingActions: actions.length,
        isVisible: actions.length > 0 || prev.isSyncing,
      }));

      performanceMonitor.trackOperation('check_pending_actions', performance.now() - startTime);
    } catch (error) {
      console.error('Error checking pending actions:', error);
      setState(prev => ({
        ...prev,
        syncError: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  };

  // Process sync queue
  const processSync = async (showToast = true) => {
    if (state.isSyncing) return;

    const startTime = performance.now();
    setState(prev => ({ ...prev, isSyncing: true, syncError: undefined }));

    try {
      await processActionQueue(database, netInfo);
      
      setState(prev => ({
        ...prev,
        lastSyncTime: Date.now(),
      }));

      if (showToast && state.pendingActions > 0) {
        toast.success('Sync complete', `Processed ${state.pendingActions} offline actions`);
      }

      performanceMonitor.trackOperation('sync_process', performance.now() - startTime);
    } catch (error) {
      console.error('Error processing action queue:', error);
      
      setState(prev => ({
        ...prev,
        syncError: error instanceof Error ? error.message : 'Sync failed',
      }));

      if (showToast) {
        toast.error('Sync error', 'Failed to process some offline changes');
      }

      performanceMonitor.trackError('sync_process_failed', error as Error);
    } finally {
      setState(prev => ({ ...prev, isSyncing: false }));
    }
  };

  // Handle network state changes
  useEffect(() => {
    const handleNetworkChange = async () => {
      if (netInfo.isInternetReachable && !lastNetworkState.current) {
        console.log('Network connection restored, processing action queue...');
        
        toast.success('Network connection restored', 'Processing offline changes...');
        await processSync();
      } else if (!netInfo.isInternetReachable && lastNetworkState.current) {
        toast.warning('Network connection lost', 'Working offline - changes will sync when connection is restored');
      }
      
      lastNetworkState.current = netInfo.isInternetReachable;
    };

    handleNetworkChange();
  }, [netInfo.isInternetReachable]);

  // Set up pending actions monitoring
  useEffect(() => {
    checkPendingActions();
    
    const subscription = database.get<ActionQueue>('action_queue')
      .query()
      .observe()
      .subscribe(() => {
        checkPendingActions();
      });
      
    return () => subscription.unsubscribe();
  }, [database]);

  // Set up periodic sync and cleanup
  useEffect(() => {
    const syncTimer = setInterval(() => {
      if (netInfo.isInternetReachable && state.pendingActions > 0) {
        processSync(false); // Don't show toast for periodic sync
      }
    }, syncInterval);

    const cleanupTimer = setInterval(() => {
      cleanupCompletedActions(database).catch(error => {
        console.error('Error in cleanup:', error);
      });
    }, cleanupInterval);

    return () => {
      clearInterval(syncTimer);
      clearInterval(cleanupTimer);
    };
  }, [netInfo.isInternetReachable, state.pendingActions, syncInterval, cleanupInterval]);

  // Handle sync indicator animation
  useEffect(() => {
    if (state.isSyncing) {
      // Show and start pulsing animation
      Animated.sequence([
        Animated.timing(state.syncOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(state.syncOpacity, {
              toValue: 0.4,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(state.syncOpacity, {
              toValue: 1,
              duration: 800,
              useNativeDriver: true,
            }),
          ])
        ),
      ]).start();
    } else if (state.isVisible) {
      // Show solid
      Animated.timing(state.syncOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Auto-hide after delay
      if (autoHide && state.pendingActions === 0) {
        setTimeout(() => {
          setState(prev => ({ ...prev, isVisible: false }));
          Animated.timing(state.syncOpacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }).start();
        }, hideDelay);
      }
    } else {
      // Hide
      Animated.timing(state.syncOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [state.isSyncing, state.isVisible, state.pendingActions, autoHide, hideDelay]);

  // Manual sync trigger
  const triggerSync = () => {
    if (netInfo.isInternetReachable) {
      processSync();
    } else {
      toast.warning('No internet connection', 'Cannot sync while offline');
    }
  };

  // Force visibility (useful for debugging or manual control)
  const forceShow = () => {
    setState(prev => ({ ...prev, isVisible: true }));
  };

  const forceHide = () => {
    setState(prev => ({ ...prev, isVisible: false }));
  };

  return {
    ...state,
    // Actions
    triggerSync,
    forceShow,
    forceHide,
    // Status
    isOnline: netInfo.isInternetReachable,
    hasError: !!state.syncError,
    // Computed values
    shouldShowPendingCount: state.pendingActions > 0,
    syncStatusText: state.isSyncing 
      ? 'Syncing...' 
      : state.pendingActions > 0 
        ? `${state.pendingActions} pending ${state.pendingActions === 1 ? 'action' : 'actions'}`
        : 'All synced',
  };
};