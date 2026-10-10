import { QueryClient } from "@tanstack/react-query";

/**
 * Default QueryClient configuration shared by every UI app. This is the
 * landing spot for pi-hero's `lib/query-client` during migration — apps mount
 * the returned client in a single `QueryClientProvider`.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        retry: 2,
        refetchOnWindowFocus: true,
      },
    },
  });
}
