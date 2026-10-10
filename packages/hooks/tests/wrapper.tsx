import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, StrictMode, Suspense } from "react";

/**
 * Fresh client per test, under StrictMode like the real window shell, so the
 * double mount/unmount of subscriptions is exercised. Retry off so failures
 * surface immediately.
 */
export function makeWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: ReactNode }) => (
    <StrictMode>
      <QueryClientProvider client={client}>
        <Suspense fallback={null}>{children}</Suspense>
      </QueryClientProvider>
    </StrictMode>
  );
}
