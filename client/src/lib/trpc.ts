import { createTRPCReact } from "@trpc/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import type { AppRouter } from "../../../server/routers";

// API base: same-origin by default; override for the pedpro.online subpath
// build where the API lives on pethealth.pages.dev (cross-origin — cookies
// are SameSite=None; Secure so they still flow with credentials:include).
export const API_URL = import.meta.env.VITE_API_URL || "/api/trpc";

export const trpc = createTRPCReact<AppRouter>();

function withCredentials(input: RequestInfo | URL, init?: RequestInit) {
  return globalThis.fetch(input, {
    ...(init ?? {}),
    credentials: "include",
  });
}

export const api = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: API_URL,
      transformer: superjson,
      fetch: withCredentials,
    }),
  ],
});

export { withCredentials };
