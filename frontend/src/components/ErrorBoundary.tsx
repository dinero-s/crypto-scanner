import { Component, type ErrorInfo, type ReactNode } from 'react';
import { ErrorState } from './ui/StateBlocks';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/** Перехват runtime-ошибок React */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('UI error boundary', error.message, info.componentStack);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <ErrorState
          message={
            this.props.fallbackTitle ??
            'Произошла ошибка интерфейса. Обновите страницу или вернитесь позже.'
          }
        />
      );
    }

    return this.props.children;
  }
}
