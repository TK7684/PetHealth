/// <reference types="@cloudflare/workers-types" />

import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "../server/routers";
import { createWorkersContext } from "../server/_core/workers-context";
import { setDatabase } from "../server/db";

export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  JWT_SECRET: string;
  NODE_ENV?: string;
}

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    // Initialize D1 database connection on every request (idempotent)
    if (env.DB) {
      setDatabase(env.DB);
    }

    const url = new URL(request.url);

    // Handle tRPC API requests
    if (url.pathname.startsWith("/api/trpc")) {
      try {
        const response = await fetchRequestHandler({
          endpoint: "/api/trpc",
          req: request,
          router: appRouter,
          createContext: async () => createWorkersContext(request),
          onError: ({ error, path }) => {
            console.error(`tRPC error on '${path}':`, error);
          },
        });
        return response as Response;
      } catch (err) {
        console.error("tRPC handler error:", err);
        return new Response(JSON.stringify({ error: "Internal server error" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Stripe webhook (post-MVP)
    if (url.pathname === "/webhook/stripe") {
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Everything else: serve static assets via CF Assets binding
    // This handles SPA routing (returns index.html for client-side routes)
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response("Not Found", { status: 404 });
  },
};
