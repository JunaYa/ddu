import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, Suspense } from "react";

/** Fresh client per test; retry off so failures surface immediately. */
export function makeWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>
      <Suspense fallback={null}>{children}</Suspense>
    </QueryClientProvider>
  );
}
