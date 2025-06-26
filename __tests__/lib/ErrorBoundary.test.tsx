/**
 * Unit Tests for ErrorBoundary Component
 * 
 * These tests verify error handling, user feedback, and recovery
 * mechanisms in the error boundary system.
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ErrorBoundary } from '../../lib/ErrorBoundary';
import { handleError } from '../../lib/errorHandling';

// Mock dependencies
jest.mock('../../lib/errorHandling');
jest.mock('../../lib/theme', () => ({
  colors: {
    background: '#ffffff',
    text: '#000000',
    textMuted: '#666666',
    error: '#ff0000',
    border: '#cccccc',
    card: '#f5f5f5'
  }
}));

const mockHandleError = handleError as jest.MockedFunction<typeof handleError>;

// Component that throws an error for testing
const ThrowError: React.FC<{ shouldThrow?: boolean }> = ({ shouldThrow = true }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock console.error to avoid noise in tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    mockHandleError.mockReturnValue({
      id: 'error-1',
      message: 'Test error',
      timestamp: new Date(),
      severity: 'error',
      context: {}
    } as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Error Catching', () => {
    it('should catch and display errors', () => {
      const { getByText } = render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(getByText('Something went wrong')).toBeTruthy();
      expect(getByText(/We encountered an unexpected error/)).toBeTruthy();
    });

    it('should call handleError when error occurs', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(mockHandleError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.any(String),
          errorBoundary: true,
          retryCount: 0
        })
      );
    });

    it('should call custom onError handler', () => {
      const onError = jest.fn();
      
      render(
        <ErrorBoundary onError={onError}>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(onError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.any(String)
        })
      );
    });
  });

  describe('Error Display', () => {
    it('should show default error message', () => {
      const { getByText } = render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(getByText('Something went wrong')).toBeTruthy();
      expect(getByText(/We encountered an unexpected error/)).toBeTruthy();
    });

    it('should show custom fallback when provided', () => {
      const customFallback = <div>Custom error message</div>;
      
      const { getByText } = render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(getByText('Custom error message')).toBeTruthy();
    });

    it('should show error details when enabled', () => {
      const { getByText } = render(
        <ErrorBoundary showErrorDetails={true}>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(getByText('Show Details')).toBeTruthy();
    });

    it('should hide error details by default', () => {
      const { queryByText } = render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(queryByText('Show Details')).toBeNull();
    });
  });

  describe('Error Recovery', () => {
    it('should allow retry when retry button is pressed', () => {
      const { getByText, rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(getByText('Something went wrong')).toBeTruthy();

      // Press retry button
      fireEvent.press(getByText('Try Again'));

      // Re-render with non-throwing component
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(getByText('No error')).toBeTruthy();
    });

    it('should track retry count', () => {
      const { getByText, rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      // First retry
      fireEvent.press(getByText('Try Again'));
      
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(mockHandleError).toHaveBeenLastCalledWith(
        expect.any(Error),
        expect.objectContaining({
          retryCount: 1
        })
      );
    });

    it('should disable retry after max attempts', () => {
      const { getByText, rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      // Simulate multiple retries
      for (let i = 0; i < 4; i++) {
        if (getByText('Try Again')) {
          fireEvent.press(getByText('Try Again'));
          rerender(
            <ErrorBoundary>
              <ThrowError shouldThrow={true} />
            </ErrorBoundary>
          );
        }
      }

      // After max retries, button should be disabled or show different text
      expect(getByText(/maximum retry attempts/i)).toBeTruthy();
    });
  });

  describe('Error Details', () => {
    it('should toggle error details visibility', () => {
      const { getByText, queryByText } = render(
        <ErrorBoundary showErrorDetails={true}>
          <ThrowError />
        </ErrorBoundary>
      );

      // Initially details should be hidden
      expect(queryByText('Test error')).toBeNull();

      // Click show details
      fireEvent.press(getByText('Show Details'));

      // Details should now be visible
      expect(getByText('Test error')).toBeTruthy();

      // Click hide details
      fireEvent.press(getByText('Hide Details'));

      // Details should be hidden again
      expect(queryByText('Test error')).toBeNull();
    });

    it('should display error message in details', () => {
      const { getByText } = render(
        <ErrorBoundary showErrorDetails={true}>
          <ThrowError />
        </ErrorBoundary>
      );

      fireEvent.press(getByText('Show Details'));
      expect(getByText('Test error')).toBeTruthy();
    });

    it('should display component stack in details', () => {
      const { getByText } = render(
        <ErrorBoundary showErrorDetails={true}>
          <ThrowError />
        </ErrorBoundary>
      );

      fireEvent.press(getByText('Show Details'));
      expect(getByText(/Component Stack/)).toBeTruthy();
    });
  });

  describe('Normal Operation', () => {
    it('should render children when no error occurs', () => {
      const { getByText } = render(
        <ErrorBoundary>
          <div>Normal content</div>
        </ErrorBoundary>
      );

      expect(getByText('Normal content')).toBeTruthy();
    });

    it('should not call error handlers when no error occurs', () => {
      const onError = jest.fn();
      
      render(
        <ErrorBoundary onError={onError}>
          <div>Normal content</div>
        </ErrorBoundary>
      );

      expect(onError).not.toHaveBeenCalled();
      expect(mockHandleError).not.toHaveBeenCalled();
    });
  });

  describe('State Management', () => {
    it('should reset error state on retry', () => {
      const { getByText, rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(getByText('Something went wrong')).toBeTruthy();

      // Retry with non-throwing component
      fireEvent.press(getByText('Try Again'));
      
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(getByText('No error')).toBeTruthy();
    });

    it('should maintain error state until retry', () => {
      const { getByText, rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(getByText('Something went wrong')).toBeTruthy();

      // Re-render without retry
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      // Should still show error state
      expect(getByText('Something went wrong')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible error message', () => {
      const { getByText } = render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      const errorMessage = getByText('Something went wrong');
      expect(errorMessage).toBeTruthy();
    });

    it('should have accessible retry button', () => {
      const { getByText } = render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      const retryButton = getByText('Try Again');
      expect(retryButton).toBeTruthy();
    });

    it('should have accessible details toggle', () => {
      const { getByText } = render(
        <ErrorBoundary showErrorDetails={true}>
          <ThrowError />
        </ErrorBoundary>
      );

      const detailsButton = getByText('Show Details');
      expect(detailsButton).toBeTruthy();
    });
  });
});