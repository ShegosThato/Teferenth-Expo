import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from './theme';
import { ErrorReporter, handleError } from './errorHandling';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  showErrorDetails?: boolean;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  retryCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Enhanced error logging and reporting
    this.setState({ errorInfo });

    // Report error through our error handling system
    const appError = handleError(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
      retryCount: this.state.retryCount
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log additional context in development
    if (__DEV__) {
      console.group('ErrorBoundary caught an error');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Component Stack:', errorInfo.componentStack);
      console.groupEnd();
    }
  }

  handleReset = () => {
    const newRetryCount = this.state.retryCount + 1;
    
    if (newRetryCount <= this.maxRetries) {
      this.setState({ 
        hasError: false, 
        error: undefined, 
        errorInfo: undefined,
        retryCount: newRetryCount
      });
    } else {
      // Too many retries, show permanent error state
      console.warn('ErrorBoundary: Maximum retries exceeded');
    }
  };

  handleReload = () => {
    // Reset retry count and try again
    this.setState({ 
      hasError: false, 
      error: undefined, 
      errorInfo: undefined,
      retryCount: 0
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const canRetry = this.state.retryCount < this.maxRetries;
      const showDetails = this.props.showErrorDetails ?? __DEV__;

      // Enhanced fallback UI
      return (
        <View style={styles.container}>
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.content}>
              <Ionicons 
                name="warning-outline" 
                size={64} 
                color={colors.danger}
                accessible={true}
                accessibilityLabel="Error icon"
              />
              
              <Text style={styles.title}>
                {canRetry ? 'Something went wrong' : 'Persistent Error'}
              </Text>
              
              <Text style={styles.message}>
                {canRetry 
                  ? 'An unexpected error occurred. Please try again.'
                  : 'The app encountered a persistent error. Please restart the application.'
                }
              </Text>

              {this.state.retryCount > 0 && (
                <Text style={styles.retryInfo}>
                  Retry attempt: {this.state.retryCount}/{this.maxRetries}
                </Text>
              )}

              {showDetails && this.state.error && (
                <View style={styles.errorDetails}>
                  <Text style={styles.errorDetailsTitle}>Error Details:</Text>
                  <Text style={styles.errorText}>
                    {this.state.error.name}: {this.state.error.message}
                  </Text>
                  {this.state.error.stack && (
                    <Text style={styles.stackTrace}>
                      {this.state.error.stack}
                    </Text>
                  )}
                </View>
              )}

              <View style={styles.buttonContainer}>
                {canRetry ? (
                  <Pressable 
                    style={styles.primaryButton} 
                    onPress={this.handleReset}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel="Try again"
                  >
                    <Ionicons name="refresh-outline" size={20} color="white" />
                    <Text style={styles.primaryButtonText}>Try Again</Text>
                  </Pressable>
                ) : (
                  <Pressable 
                    style={styles.primaryButton} 
                    onPress={this.handleReload}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel="Restart app"
                  >
                    <Ionicons name="reload-outline" size={20} color="white" />
                    <Text style={styles.primaryButtonText}>Restart App</Text>
                  </Pressable>
                )}

                {showDetails && (
                  <Pressable 
                    style={styles.secondaryButton}
                    onPress={() => {
                      const recentErrors = ErrorReporter.getRecentErrors(5);
                      console.log('Recent errors:', recentErrors);
                    }}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel="View error log"
                  >
                    <Ionicons name="list-outline" size={20} color={colors.primary} />
                    <Text style={styles.secondaryButtonText}>View Error Log</Text>
                  </Pressable>
                )}
              </View>
            </View>
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
    maxWidth: 400,
    alignSelf: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: colors.mutedText,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  retryInfo: {
    fontSize: 14,
    color: colors.warning,
    marginBottom: 16,
    fontWeight: '500',
  },
  errorDetails: {
    backgroundColor: '#fee2e2',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    width: '100%',
    maxHeight: 200,
  },
  errorDetailsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#dc2626',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#dc2626',
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  stackTrace: {
    fontSize: 10,
    color: '#7f1d1d',
    fontFamily: 'monospace',
    lineHeight: 14,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});