import { Component, type ErrorInfo, type ReactNode } from "react";

interface State {
  failed: boolean;
}

/** Keeps a render error from blanking the whole webview (specs/12 § 3). */
export class WindowErrorBoundary extends Component<{ children: ReactNode }, State> {
  override state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("Window render failed", error, info.componentStack);
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
