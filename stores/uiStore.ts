/**
 * UI Store
 * 
 * Manages UI-specific state like loading states, modals, notifications, and navigation.
 * This store handles transient UI state that doesn't need persistence.
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { UIState, UIActions } from '../types';

interface UIStoreState extends UIState {
  // Modal actions
  openModal: (modal: keyof UIState['modals']) => void;
  closeModal: (modal: keyof UIState['modals']) => void;
  closeAllModals: () => void;
  
  // Loading actions
  setLoading: (loading: boolean) => void;
  setLoadingWithMessage: (loading: boolean, message?: string) => void;
  
  // Navigation actions
  setActiveScreen: (screen: string) => void;
  
  // Notification actions
  addNotification: (notification: Omit<UIState['notifications'][0], 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
  
  // Selection actions
  setSelectedProjectId: (id: string | undefined) => void;
  
  // Utility getters
  isModalOpen: (modal: keyof UIState['modals']) => boolean;
  hasNotifications: () => boolean;
  getNotificationCount: () => number;
  getRecentNotifications: (count?: number) => UIState['notifications'];
}

export const useUIStore = create<UIStoreState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    isLoading: false,
    selectedProjectId: undefined,
    activeScreen: 'Library',
    modals: {
      settings: false,
      export: false,
      backup: false,
    },
    notifications: [],

    // Modal actions
    openModal: (modal) => {
      set((state) => ({
        modals: {
          ...state.modals,
          [modal]: true,
        },
      }));
    },

    closeModal: (modal) => {
      set((state) => ({
        modals: {
          ...state.modals,
          [modal]: false,
        },
      }));
    },

    closeAllModals: () => {
      set({
        modals: {
          settings: false,
          export: false,
          backup: false,
        },
      });
    },

    // Loading actions
    setLoading: (loading) => {
      set({ isLoading: loading });
    },

    setLoadingWithMessage: (loading, message) => {
      set({ isLoading: loading });
      
      if (loading && message) {
        get().addNotification({
          type: 'info',
          title: 'Loading',
          message,
        });
      }
    },

    // Navigation actions
    setActiveScreen: (screen) => {
      set({ activeScreen: screen });
    },

    // Notification actions
    addNotification: (notification) => {
      const id = `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const timestamp = Date.now();
      
      const newNotification = {
        ...notification,
        id,
        timestamp,
      };

      set((state) => ({
        notifications: [newNotification, ...state.notifications],
      }));

      // Auto-remove notification after 5 seconds for non-error notifications
      if (notification.type !== 'error') {
        setTimeout(() => {
          get().removeNotification(id);
        }, 5000);
      }
    },

    removeNotification: (id) => {
      set((state) => ({
        notifications: state.notifications.filter(n => n.id !== id),
      }));
    },

    clearAllNotifications: () => {
      set({ notifications: [] });
    },

    // Selection actions
    setSelectedProjectId: (id) => {
      set({ selectedProjectId: id });
    },

    // Utility getters
    isModalOpen: (modal) => {
      return get().modals[modal];
    },

    hasNotifications: () => {
      return get().notifications.length > 0;
    },

    getNotificationCount: () => {
      return get().notifications.length;
    },

    getRecentNotifications: (count = 5) => {
      return get().notifications.slice(0, count);
    },
  }))
);

// Selectors for better performance
export const uiSelectors = {
  // Loading selectors
  isLoading: (state: UIStoreState) => state.isLoading,
  
  // Modal selectors
  modals: (state: UIStoreState) => state.modals,
  isSettingsModalOpen: (state: UIStoreState) => state.modals.settings,
  isExportModalOpen: (state: UIStoreState) => state.modals.export,
  isBackupModalOpen: (state: UIStoreState) => state.modals.backup,
  isAnyModalOpen: (state: UIStoreState) => Object.values(state.modals).some(Boolean),
  
  // Navigation selectors
  activeScreen: (state: UIStoreState) => state.activeScreen,
  
  // Notification selectors
  notifications: (state: UIStoreState) => state.notifications,
  notificationCount: (state: UIStoreState) => state.notifications.length,
  hasNotifications: (state: UIStoreState) => state.notifications.length > 0,
  errorNotifications: (state: UIStoreState) => state.notifications.filter(n => n.type === 'error'),
  successNotifications: (state: UIStoreState) => state.notifications.filter(n => n.type === 'success'),
  
  // Selection selectors
  selectedProjectId: (state: UIStoreState) => state.selectedProjectId,
};

// Specialized hooks
export const useLoadingState = () => {
  return useUIStore(uiSelectors.isLoading);
};

export const useModalState = (modal: keyof UIState['modals']) => {
  return useUIStore((state) => state.modals[modal]);
};

export const useNotifications = () => {
  return useUIStore(uiSelectors.notifications);
};

export const useActiveScreen = () => {
  return useUIStore(uiSelectors.activeScreen);
};

// Notification helpers
export const useNotificationActions = () => {
  const addNotification = useUIStore((state) => state.addNotification);
  const removeNotification = useUIStore((state) => state.removeNotification);
  const clearAllNotifications = useUIStore((state) => state.clearAllNotifications);

  return {
    showSuccess: (title: string, message: string) => {
      addNotification({ type: 'success', title, message });
    },
    showError: (title: string, message: string) => {
      addNotification({ type: 'error', title, message });
    },
    showWarning: (title: string, message: string) => {
      addNotification({ type: 'warning', title, message });
    },
    showInfo: (title: string, message: string) => {
      addNotification({ type: 'info', title, message });
    },
    removeNotification,
    clearAll: clearAllNotifications,
  };
};

// Modal helpers
export const useModalActions = () => {
  const openModal = useUIStore((state) => state.openModal);
  const closeModal = useUIStore((state) => state.closeModal);
  const closeAllModals = useUIStore((state) => state.closeAllModals);

  return {
    openSettings: () => openModal('settings'),
    openExport: () => openModal('export'),
    openBackup: () => openModal('backup'),
    closeSettings: () => closeModal('settings'),
    closeExport: () => closeModal('export'),
    closeBackup: () => closeModal('backup'),
    closeAll: closeAllModals,
  };
};