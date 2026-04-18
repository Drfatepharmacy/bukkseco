import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background text-foreground">
          <div className="geo-card p-8 max-w-md w-full text-center">
            <h1 className="font-display text-2xl font-bold mb-4">Oops! Something went wrong.</h1>
            <p className="font-body text-muted-foreground mb-6">
              The dashboard encountered an unexpected error. Don't worry, your data is safe.
            </p>
            {this.state.error && (
              <pre className="bg-muted p-4 rounded text-xs text-left overflow-auto mb-6 max-h-40">
                {this.state.error.toString()}
              </pre>
            )}
            <Button
              onClick={() => window.location.reload()}
              className="btn-gold w-full"
            >
              Reload Dashboard
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
