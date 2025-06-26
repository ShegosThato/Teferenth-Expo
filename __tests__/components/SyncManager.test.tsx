/**
 * Unit Tests for SyncManager Component
 * 
 * These tests verify the sync functionality, network state handling,
 * and user feedback for the offline-first architecture.
 */

import React from 'react';
import { render, waitFor, act } from '@testing-library/react-native';
import { useNetInfo } from '@react-native-community/netinfo';
import { SyncManager } from '../../components/SyncManager';
import { useDatabase } from '../../db/DatabaseContext';
import { processActionQueue, cleanupCompletedActions } from '../../lib/syncEngine';
import { toast } from '../../lib/toast';

// Mock dependencies
jest.mock('@react-native-community/netinfo');
jest.mock('../../db/DatabaseContext');
jest.mock('../../lib/syncEngine');
jest.mock('../../lib/toast');

const mockUseNetInfo = useNetInfo as jest.MockedFunction<typeof useNetInfo>;
const mockUseDatabase = useDatabase as jest.MockedFunction<typeof useDatabase>;
const mockProcessActionQueue = processActionQueue as jest.MockedFunction<typeof processActionQueue>;
const mockCleanupCompletedActions = cleanupCompletedActions as jest.MockedFunction<typeof cleanupCompletedActions>;
const mockToast = toast as jest.Mocked<typeof toast>;

// Mock database and collections
const mockDatabase = {
  get: jest.fn()
};

const mockCollection = {
  query: jest.fn(),
  observe: jest.fn()
};

const mockQuery = {
  fetch: jest.fn(),
  observe: jest.fn()
};

const mockSubscription = {
  unsubscribe: jest.fn()
};

const mockObservable = {
  subscribe: jest.fn().mockReturnValue(mockSubscription)
};

describe('SyncManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    // Setup default mocks
    mockUseDatabase.mockReturnValue(mockDatabase as any);
    mockCollection.query.mockReturnValue(mockQuery);
    mockQuery.observe.mockReturnValue(mockObservable);
    mockDatabase.get.mockReturnValue(mockCollection);
    mockProcessActionQueue.mockResolvedValue(undefined);
    mockCleanupCompletedActions.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Network State Handling', () => {
    it('should not show sync indicator when no pending actions and not syncing', async () => {
      mockUseNetInfo.mockReturnValue({
        isInternetReachable: true,
        isConnected: true,
        type: 'wifi',
        details: {}
      } as any);

      mockQuery.fetch.mockResolvedValue([]); // No pending actions

      const { queryByText } = render(<SyncManager />);

      await waitFor(() => {
        expect(queryByText('Syncing...')).toBeNull();
        expect(queryByText(/pending/)).toBeNull();
      });
    });

    it('should show pending actions count when offline', async () => {
      mockUseNetInfo.mockReturnValue({
        isInternetReachable: false,
        isConnected: false,
        type: 'none',
        details: {}
      } as any);

      const mockActions = [
        { id: '1', status: 'pending' },
        { id: '2', status: 'pending' },
        { id: '3', status: 'pending' }
      ];
      mockQuery.fetch.mockResolvedValue(mockActions);

      const { getByText } = render(<SyncManager />);

      await waitFor(() => {
        expect(getByText('3 pending actions')).toBeTruthy();
      });
    });

    it('should show singular form for one pending action', async () => {
      mockUseNetInfo.mockReturnValue({
        isInternetReachable: false,
        isConnected: false,
        type: 'none',
        details: {}
      } as any);

      const mockActions = [{ id: '1', status: 'pending' }];
      mockQuery.fetch.mockResolvedValue(mockActions);

      const { getByText } = render(<SyncManager />);

      await waitFor(() => {
        expect(getByText('1 pending action')).toBeTruthy();
      });
    });
  });

  describe('Network Connection Changes', () => {
    it('should trigger sync when network connection is restored', async () => {
      // Start with no connection
      const mockNetInfo = {
        isInternetReachable: false,
        isConnected: false,
        type: 'none',
        details: {}
      };

      const { rerender } = render(<SyncManager />);
      mockUseNetInfo.mockReturnValue(mockNetInfo as any);

      // Simulate network restoration
      mockNetInfo.isInternetReachable = true;
      mockNetInfo.isConnected = true;
      mockNetInfo.type = 'wifi';

      mockUseNetInfo.mockReturnValue(mockNetInfo as any);
      rerender(<SyncManager />);

      await waitFor(() => {
        expect(mockProcessActionQueue).toHaveBeenCalledWith(mockDatabase, mockNetInfo);
        expect(mockToast.success).toHaveBeenCalledWith(
          'Network connection restored',
          'Processing offline changes...'
        );
      });
    });

    it('should show warning when network connection is lost', async () => {
      // Start with connection
      const mockNetInfo = {
        isInternetReachable: true,
        isConnected: true,
        type: 'wifi',
        details: {}
      };

      const { rerender } = render(<SyncManager />);
      mockUseNetInfo.mockReturnValue(mockNetInfo as any);

      // Simulate network loss
      mockNetInfo.isInternetReachable = false;
      mockNetInfo.isConnected = false;
      mockNetInfo.type = 'none';

      mockUseNetInfo.mockReturnValue(mockNetInfo as any);
      rerender(<SyncManager />);

      await waitFor(() => {
        expect(mockToast.warning).toHaveBeenCalledWith(
          'Network connection lost',
          'Working offline - changes will sync when connection is restored'
        );
      });
    });
  });

  describe('Sync Process', () => {
    it('should show success message after successful sync', async () => {
      mockUseNetInfo.mockReturnValue({
        isInternetReachable: true,
        isConnected: true,
        type: 'wifi',
        details: {}
      } as any);

      const mockActions = [
        { id: '1', status: 'pending' },
        { id: '2', status: 'pending' }
      ];
      mockQuery.fetch.mockResolvedValue(mockActions);

      // Mock successful sync
      mockProcessActionQueue.mockResolvedValue(undefined);

      render(<SyncManager />);

      // Trigger sync by simulating network restoration
      await act(async () => {
        // This would be triggered by the useEffect when network state changes
      });

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith(
          'Sync complete',
          'Processed 2 offline actions'
        );
      });
    });

    it('should show error message when sync fails', async () => {
      mockUseNetInfo.mockReturnValue({
        isInternetReachable: true,
        isConnected: true,
        type: 'wifi',
        details: {}
      } as any);

      // Mock sync failure
      const syncError = new Error('Sync failed');
      mockProcessActionQueue.mockRejectedValue(syncError);

      render(<SyncManager />);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          'Sync error',
          'Failed to process some offline changes'
        );
      });
    });
  });

  describe('Periodic Operations', () => {
    it('should set up periodic sync interval', async () => {
      mockUseNetInfo.mockReturnValue({
        isInternetReachable: true,
        isConnected: true,
        type: 'wifi',
        details: {}
      } as any);

      const mockActions = [{ id: '1', status: 'pending' }];
      mockQuery.fetch.mockResolvedValue(mockActions);

      render(<SyncManager />);

      // Fast-forward time to trigger periodic sync
      act(() => {
        jest.advanceTimersByTime(30000); // 30 seconds
      });

      await waitFor(() => {
        expect(mockProcessActionQueue).toHaveBeenCalled();
      });
    });

    it('should set up periodic cleanup interval', async () => {
      mockUseNetInfo.mockReturnValue({
        isInternetReachable: true,
        isConnected: true,
        type: 'wifi',
        details: {}
      } as any);

      render(<SyncManager />);

      // Fast-forward time to trigger cleanup
      act(() => {
        jest.advanceTimersByTime(60000 * 60); // 1 hour
      });

      await waitFor(() => {
        expect(mockCleanupCompletedActions).toHaveBeenCalledWith(mockDatabase);
      });
    });

    it('should not sync when offline during periodic check', async () => {
      mockUseNetInfo.mockReturnValue({
        isInternetReachable: false,
        isConnected: false,
        type: 'none',
        details: {}
      } as any);

      const mockActions = [{ id: '1', status: 'pending' }];
      mockQuery.fetch.mockResolvedValue(mockActions);

      render(<SyncManager />);

      // Fast-forward time
      act(() => {
        jest.advanceTimersByTime(30000);
      });

      // Should not trigger sync when offline
      expect(mockProcessActionQueue).not.toHaveBeenCalled();
    });
  });

  describe('Component Lifecycle', () => {
    it('should subscribe to action queue changes', async () => {
      mockUseNetInfo.mockReturnValue({
        isInternetReachable: true,
        isConnected: true,
        type: 'wifi',
        details: {}
      } as any);

      render(<SyncManager />);

      await waitFor(() => {
        expect(mockDatabase.get).toHaveBeenCalledWith('action_queue');
        expect(mockCollection.query).toHaveBeenCalled();
        expect(mockQuery.observe).toHaveBeenCalled();
        expect(mockObservable.subscribe).toHaveBeenCalled();
      });
    });

    it('should unsubscribe from action queue changes on unmount', async () => {
      mockUseNetInfo.mockReturnValue({
        isInternetReachable: true,
        isConnected: true,
        type: 'wifi',
        details: {}
      } as any);

      const { unmount } = render(<SyncManager />);

      unmount();

      expect(mockSubscription.unsubscribe).toHaveBeenCalled();
    });

    it('should clear intervals on unmount', async () => {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

      mockUseNetInfo.mockReturnValue({
        isInternetReachable: true,
        isConnected: true,
        type: 'wifi',
        details: {}
      } as any);

      const { unmount } = render(<SyncManager />);

      unmount();

      expect(clearIntervalSpy).toHaveBeenCalledTimes(2); // sync and cleanup intervals
    });
  });

  describe('Error Handling', () => {
    it('should handle errors when checking pending actions', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      mockUseNetInfo.mockReturnValue({
        isInternetReachable: true,
        isConnected: true,
        type: 'wifi',
        details: {}
      } as any);

      const error = new Error('Database error');
      mockQuery.fetch.mockRejectedValue(error);

      render(<SyncManager />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error checking pending actions:', error);
      });

      consoleSpy.mockRestore();
    });

    it('should handle errors in periodic sync', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      mockUseNetInfo.mockReturnValue({
        isInternetReachable: true,
        isConnected: true,
        type: 'wifi',
        details: {}
      } as any);

      const mockActions = [{ id: '1', status: 'pending' }];
      mockQuery.fetch.mockResolvedValue(mockActions);

      const syncError = new Error('Periodic sync failed');
      mockProcessActionQueue.mockRejectedValue(syncError);

      render(<SyncManager />);

      act(() => {
        jest.advanceTimersByTime(30000);
      });

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error in periodic sync:', syncError);
      });

      consoleSpy.mockRestore();
    });

    it('should handle errors in cleanup', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      mockUseNetInfo.mockReturnValue({
        isInternetReachable: true,
        isConnected: true,
        type: 'wifi',
        details: {}
      } as any);

      const cleanupError = new Error('Cleanup failed');
      mockCleanupCompletedActions.mockRejectedValue(cleanupError);

      render(<SyncManager />);

      act(() => {
        jest.advanceTimersByTime(60000 * 60);
      });

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error in cleanup:', cleanupError);
      });

      consoleSpy.mockRestore();
    });
  });
});