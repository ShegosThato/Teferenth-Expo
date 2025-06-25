// components/SyncManager.tsx
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useNetInfo } from '@react-native-community/netinfo';
import { useDatabase } from '../db/DatabaseContext';
import { processActionQueue, cleanupCompletedActions } from '../lib/syncEngine';
import { toast } from '../lib/toast';
import { Q } from '@nozbe/watermelondb';
import { ActionQueue } from '../db/models';
import { colors } from '../lib/theme';

export const SyncManager: React.FC = () => {
  const database = useDatabase();
  const netInfo = useNetInfo();
  const lastNetworkState = useRef(netInfo.isInternetReachable);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingActions, setPendingActions] = useState(0);
  const syncOpacity = useRef(new Animated.Value(0)).current;

  // Check for pending actions
  useEffect(() => {
    const checkPendingActions = async () => {
      try {
        const actions = await database.get<ActionQueue>('action_queue').query(
          Q.where('status', 'pending')
        ).fetch();
        
        setPendingActions(actions.length);
      } catch (error) {
        console.error('Error checking pending actions:', error);
      }
    };
    
    checkPendingActions();
    
    // Set up a listener for changes to the action queue
    const subscription = database.get<ActionQueue>('action_queue')
      .query()
      .observe()
      .subscribe(() => {
        checkPendingActions();
      });
      
    return () => subscription.unsubscribe();
  }, [database]);

  // Process queue when network becomes available
  useEffect(() => {
    if (netInfo.isInternetReachable && !lastNetworkState.current) {
      console.log('Network connection restored, processing action queue...');
      
      // Show toast notification
      toast.success('Network connection restored', 'Processing offline changes...');
      
      setIsSyncing(true);
      processActionQueue(database, netInfo)
        .then(() => {
          if (pendingActions > 0) {
            toast.success('Sync complete', `Processed ${pendingActions} offline actions`);
          }
        })
        .catch(error => {
          console.error('Error processing action queue:', error);
          toast.error('Sync error', 'Failed to process some offline changes');
        })
        .finally(() => {
          setIsSyncing(false);
        });
    } else if (!netInfo.isInternetReachable && lastNetworkState.current) {
      // Network was lost
      toast.warning('Network connection lost', 'Working offline - changes will sync when connection is restored');
    }
    
    lastNetworkState.current = netInfo.isInternetReachable;
  }, [netInfo.isInternetReachable, database, pendingActions]);

  // Set up periodic sync and cleanup
  useEffect(() => {
    // Set up periodic sync and cleanup
    const syncInterval = setInterval(() => {
      if (netInfo.isInternetReachable && pendingActions > 0) {
        setIsSyncing(true);
        processActionQueue(database, netInfo)
          .catch(error => {
            console.error('Error in periodic sync:', error);
          })
          .finally(() => {
            setIsSyncing(false);
          });
      }
    }, 30000); // Check every 30 seconds

    const cleanupInterval = setInterval(() => {
      cleanupCompletedActions(database).catch(error => {
        console.error('Error in cleanup:', error);
      });
    }, 60000 * 60); // Cleanup every hour

    return () => {
      clearInterval(syncInterval);
      clearInterval(cleanupInterval);
    };
  }, [database, netInfo.isInternetReachable, pendingActions]);

  // Animate the sync indicator
  useEffect(() => {
    if (isSyncing) {
      Animated.sequence([
        Animated.timing(syncOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(syncOpacity, {
              toValue: 0.4,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(syncOpacity, {
              toValue: 1,
              duration: 800,
              useNativeDriver: true,
            }),
          ])
        ),
      ]).start();
    } else {
      Animated.timing(syncOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isSyncing, syncOpacity]);

  // Only show the sync indicator when syncing or when there are pending actions
  if (!isSyncing && pendingActions === 0) {
    return null;
  }

  return (
    <Animated.View style={[styles.container, { opacity: syncOpacity }]}>
      <View style={styles.indicator}>
        <Text style={styles.text}>
          {isSyncing ? 'Syncing...' : `${pendingActions} pending ${pendingActions === 1 ? 'action' : 'actions'}`}
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    zIndex: 1000,
  },
  indicator: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  text: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
});