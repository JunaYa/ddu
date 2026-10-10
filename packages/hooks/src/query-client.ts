import { QueryClient } from "@tanstack/react-query";

/**
 * QueryClient for a ddu window. Data comes from local IPC, not a network:
 * windows are shown and hidden constantly, so refetching on focus would only
 * re-read unchanged state; live changes arrive through native subscriptions
 * (e.g. `useSetting`) instead.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        retry: 2,
        refetchOnWindowFocus: false,
      },
    },
  });
}
