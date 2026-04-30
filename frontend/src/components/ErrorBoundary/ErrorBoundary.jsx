import { Component } from 'react';

/**
 * ErrorBoundary – catches JavaScript errors in child components and
 * displays a friendly fallback UI with a "Try Again" button.
 *
 * Requirements: 4.3, 8.5
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error for debugging purposes
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            textAlign: 'center',
            padding: '3rem 1.5rem',
            maxWidth: '480px',
            margin: '0 auto',
          }}
          data-testid="error-boundary"
        >
          <h2 style={{ color: '#c62828', marginBottom: '0.75rem' }}>
            Something went wrong
          </h2>
          <p style={{ color: '#555', marginBottom: '1.25rem' }}>
            An unexpected error occurred. Please try again.
          </p>
          <button
            onClick={this.handleRetry}
            data-testid="error-boundary-retry"
            style={{
              padding: '0.5rem 1.5rem',
              border: '1px solid #c62828',
              borderRadius: '8px',
              background: 'none',
              color: '#c62828',
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
