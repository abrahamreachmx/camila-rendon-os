import { QueryClient } from '@tanstack/react-query'
import { isTransient } from '@/lib/errors'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      // Un fallo transitorio (desfase de reloj al renovar el token) se reintenta
      // enseguida; el resto, una sola vez y con más calma.
      retry: (failureCount, error) => (isTransient(error) ? failureCount < 3 : failureCount < 1),
      retryDelay: (failureCount, error) => (isTransient(error) ? 350 : 1000 * 2 ** failureCount),
    },
    mutations: {
      retry: (failureCount, error) => isTransient(error) && failureCount < 3,
      retryDelay: 350,
    },
  },
})
