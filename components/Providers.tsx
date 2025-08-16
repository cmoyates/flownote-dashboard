"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [qc] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Notion rate limits—don’t hammer it
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            retry: (failCount, _err: any) => failCount < 2,
            staleTime: 30_000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={qc}>
      {children}
      {/* Optional in dev */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
