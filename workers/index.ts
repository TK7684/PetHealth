/// <reference types="@cloudflare/workers-types" />

import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "../server/routers";
import { createWorkersContext } from "../server/_core/workers-context";
import { setDatabase } from "../server/db";
import { setRuntimeEnv } from "../server/_core/ai";

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
    // Thread runtime secrets (GLM_API_KEY, JWT_SECRET) into the app layer
    (globalThis as any).__pethealthEnv = env;
    setRuntimeEnv(env as unknown as Record<string, unknown>);

    const url = new URL(request.url);

    // Handle tRPC API requests
    if (url.pathname.startsWith("/api/trpc")) {
      try {
        let ctxResult: { res?: { _cookies?: string[] } } | null = null;
        const response = await fetchRequestHandler({
          endpoint: "/api/trpc",
          req: request,
          router: appRouter,
          createContext: async () => {
            const ctx = await createWorkersContext(request);
            ctxResult = ctx as any;
            return ctx;
          },
          onError: ({ error, path }) => {
            console.error(`tRPC error on '${path}':`, error);
          },
        });
        // Pages/tRPC adapters drop ctx.res.cookie() calls — re-attach the
        // collected Set-Cookie headers here (login/logout/register set them).
        const cookies = (ctxResult as any)?.res?._cookies ?? [];
        if (cookies.length > 0) {
          const headers = new Headers(response.headers);
          for (const c of cookies) headers.append("Set-Cookie", c);
          return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers,
          });
        }
        return response as Response;
      } catch (err) {
        console.error("tRPC handler error:", err);
        return new Response(JSON.stringify({ error: "Internal server error" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Debug: which env bindings exist (names only, never values)
    if (url.pathname === "/api/debug-env") {
      const names = Object.keys(env ?? {}).filter(k => k !== "ASSETS");
      return new Response(JSON.stringify({ bindings: names, hasProcessEnv: typeof (globalThis as any).process !== "undefined", processEnvKeys: typeof (globalThis as any).process !== "undefined" ? Object.keys((globalThis as any).process.env ?? {}).slice(0, 20) : null }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
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
