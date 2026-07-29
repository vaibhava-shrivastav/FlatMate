import { Component } from 'react';
import { AlertTriangle } from 'lucide-react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Log to console in development; swap for a real error reporter in production
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="flex flex-col items-center gap-5 text-center max-w-sm">
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-danger/10 border border-danger/20">
            <AlertTriangle className="w-6 h-6 text-danger" aria-hidden="true" />
          </div>

          <div className="flex flex-col gap-1.5">
            <h1 className="text-base font-semibold text-text">Something went wrong</h1>
            <p className="text-sm text-text-muted leading-relaxed">
              An unexpected error occurred. Try refreshing the page.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={this.handleReset}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-[var(--radius)] bg-card text-white border border-border hover:border-primary transition-all duration-200 cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Try again
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-[var(--radius)] bg-primary text-white hover:bg-primary-hover transition-all duration-200 cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Refresh page
            </button>
          </div>
        </div>
      </div>
    );
  }
}
