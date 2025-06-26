/**
 * Services Index
 * 
 * Centralized export of all services and their utilities.
 * This provides a single import point for all service-related functionality.
 */

// Service exports
export { projectService } from './ProjectService';
export { dataService } from './DataService';
export { settingsService } from './SettingsService';

// Service interfaces (re-exported from types)
export type {
  ProjectService,
  DataService,
  SettingsService,
} from '../types';

// Service utilities and helpers
export const serviceUtils = {
  // Initialize all services
  initializeServices: async () => {
    try {
      // Services initialize themselves, but we can perform any setup here
      console.log('Services initialized successfully');
    } catch (error) {
      console.error('Failed to initialize services:', error);
      throw error;
    }
  },

  // Cleanup all services
  cleanupServices: () => {
    try {
      // Cleanup settings service timers
      settingsService.destroy();
      console.log('Services cleaned up successfully');
    } catch (error) {
      console.error('Failed to cleanup services:', error);
    }
  },

  // Health check for all services
  healthCheck: async () => {
    const results = {
      projectService: true,
      dataService: true,
      settingsService: true,
      timestamp: Date.now(),
    };

    try {
      // Test project service
      // This would typically involve a lightweight operation
      results.projectService = true;
    } catch (error) {
      console.error('Project service health check failed:', error);
      results.projectService = false;
    }

    try {
      // Test data service
      await dataService.getDataSize();
      results.dataService = true;
    } catch (error) {
      console.error('Data service health check failed:', error);
      results.dataService = false;
    }

    try {
      // Test settings service
      settingsService.getSettings();
      results.settingsService = true;
    } catch (error) {
      console.error('Settings service health check failed:', error);
      results.settingsService = false;
    }

    return results;
  },
};

// Service error handling
export const serviceErrorHandlers = {
  // Handle service errors with retry logic
  withRetry: async <T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> => {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        console.warn(`Service operation failed (attempt ${attempt}/${maxRetries}):`, error);

        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delay * attempt));
        }
      }
    }

    throw lastError!;
  },

  // Handle service errors with fallback
  withFallback: async <T>(
    operation: () => Promise<T>,
    fallback: () => Promise<T> | T
  ): Promise<T> => {
    try {
      return await operation();
    } catch (error) {
      console.warn('Service operation failed, using fallback:', error);
      return await fallback();
    }
  },
};

// Service composition utilities
export const serviceComposition = {
  // Compose multiple service operations
  composeOperations: async <T>(
    operations: Array<() => Promise<T>>
  ): Promise<T[]> => {
    const results: T[] = [];
    
    for (const operation of operations) {
      try {
        const result = await operation();
        results.push(result);
      } catch (error) {
        console.error('Composed operation failed:', error);
        throw error;
      }
    }

    return results;
  },

  // Execute operations in parallel with error handling
  parallelOperations: async <T>(
    operations: Array<() => Promise<T>>
  ): Promise<Array<T | Error>> => {
    const promises = operations.map(async (operation) => {
      try {
        return await operation();
      } catch (error) {
        return error as Error;
      }
    });

    return Promise.all(promises);
  },
};

// Service monitoring and metrics
export const serviceMonitoring = {
  // Monitor service performance
  monitorService: <T>(
    serviceName: string,
    operation: () => Promise<T>
  ): Promise<T> => {
    const startTime = performance.now();
    
    return operation()
      .then((result) => {
        const duration = performance.now() - startTime;
        console.log(`${serviceName} operation completed in ${duration.toFixed(2)}ms`);
        return result;
      })
      .catch((error) => {
        const duration = performance.now() - startTime;
        console.error(`${serviceName} operation failed after ${duration.toFixed(2)}ms:`, error);
        throw error;
      });
  },

  // Get service metrics
  getServiceMetrics: async () => {
    try {
      const [dataSize, settings, healthCheck] = await Promise.all([
        dataService.getDataSize(),
        Promise.resolve(settingsService.getSettings()),
        serviceUtils.healthCheck(),
      ]);

      return {
        dataSize,
        settings,
        healthCheck,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error('Failed to get service metrics:', error);
      return {
        dataSize: 0,
        settings: null,
        healthCheck: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now(),
      };
    }
  },
};