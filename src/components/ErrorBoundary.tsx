import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
  children: ReactNode;
  /** Optional custom fallback UI */
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Global error boundary — wraps the protected app layout.
 * Catches render-time and lifecycle errors in child components and
 * displays a friendly recovery UI instead of a white screen.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Surface to any external monitoring (e.g. Sentry) when available
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
          <Card className="card-athletic max-w-lg w-full">
            <CardContent className="pt-8 pb-8 flex flex-col items-center text-center gap-4">
              <div className="rounded-full bg-destructive/10 p-4">
                <AlertTriangle className="h-10 w-10 text-destructive" />
              </div>

              <div>
                <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
                <p className="text-sm text-muted-foreground max-w-xs">
                  An unexpected error occurred. You can try refreshing the page,
                  or go back to the dashboard.
                </p>
              </div>

              {this.state.error && (
                <div className="w-full rounded-lg bg-muted/60 px-4 py-3 text-left">
                  <p className="text-xs font-mono text-muted-foreground break-all line-clamp-3">
                    {this.state.error.message}
                  </p>
                </div>
              )}

              <div className="flex gap-3 mt-2">
                <Button variant="outline" onClick={this.handleRetry} className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </Button>
                <Button variant="default" onClick={this.handleGoHome} className="gap-2">
                  <Home className="h-4 w-4" />
                  Go to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
