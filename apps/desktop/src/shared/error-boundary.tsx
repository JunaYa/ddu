import { Component, type ErrorInfo, type ReactNode } from "react";

interface State {
  failed: boolean;
}

interface Props {
  children: ReactNode;
  /** Window-specific recovery, e.g. the capture overlay cancels itself. */
  onError?: (error: Error) => void;
}

/** Keeps a render error from blanking the whole webview (specs/12 § 3). */
export class WindowErrorBoundary extends Component<Props, State> {
  override state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("Window render failed", error, info.componentStack);
    this.props.onError?.(error);
  }

  override render(): ReactNode {
    if (!this.state.failed) return this.props.children;
    return (
      <div
        role="alert"
        className="flex h-screen items-center justify-center p-6 text-sm text-muted-foreground"
      >
        窗口出错，请关闭后重新打开。
      </div>
    );
  }
}
