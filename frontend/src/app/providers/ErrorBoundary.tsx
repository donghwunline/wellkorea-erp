/**
 * ErrorBoundary component to catch and display React errors gracefully.
 *
 * Features:
 * - Catches runtime errors in component tree
 * - Displays fallback UI with error details
 * - Logs errors to console (can be extended to send to monitoring service)
 * - Reset button to attempt recovery
 *
 * Usage:
 * ```typescript
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 * ```
 */

import type { ReactNode } from 'react';
import React, { Component } from 'react';
import { navigation } from '@/shared/lib';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log error to console (can be extended to send to monitoring service)
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // TODO: Send error to monitoring service (e.g., Sentry, LogRocket)
    // Example: logErrorToService(error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: '2rem',
            textAlign: 'center',
            maxWidth: '800px',
            margin: '0 auto',
          }}
        >
          <h1 style={{ color: '#d32f2f' }}>Something went wrong</h1>
          <p style={{ marginBottom: '2rem' }}>
            An unexpected error occurred. Please try refreshing the page or contact support if the
            problem persists.
          </p>

          {this.state.error && (
            <details style={{ marginBottom: '2rem', textAlign: 'left' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>Error Details</summary>
              <pre
                style={{
                  backgroundColor: '#f5f5f5',
                  padding: '1rem',
                  borderRadius: '4px',
                  overflow: 'auto',
                  fontSize: '0.875rem',
                }}
              >
                {this.state.error.toString()}
              </pre>
              {this.state.errorInfo && (
                <pre
                  style={{
                    backgroundColor: '#f5f5f5',
                    padding: '1rem',
                    borderRadius: '4px',
                    overflow: 'auto',
                    fontSize: '0.875rem',
                    marginTop: '1rem',
                  }}
                >
                  {this.state.errorInfo.componentStack}
                </pre>
              )}
            </details>
          )}

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button
              onClick={this.handleReset}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#1976d2',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Try Again
            </button>
            <button
              onClick={() => navigation.reloadPage()}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#757575',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
