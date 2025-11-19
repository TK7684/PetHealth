import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "../server/routers";
import { createWorkersContext } from "../server/_core/workers-context";
import { COOKIE_NAME, ONE_YEAR_MS } from "../shared/const";
import * as db from "../server/db";
import { sdk } from "../server/_core/sdk";
import { handleStripeWebhook } from "../server/stripe";

export default {
  async fetch(request: Request, env: any, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Handle OAuth callback
    if (url.pathname === "/api/oauth/callback") {
      return handleOAuthCallback(request, env);
    }

    // Handle Stripe webhook
    if (url.pathname === "/webhook/stripe") {
      return handleStripeWebhookRequest(request, env);
    }

    // Handle tRPC requests
    if (url.pathname.startsWith("/api/trpc")) {
      const response = await fetchRequestHandler({
        endpoint: "/api/trpc",
        req: request,
        router: appRouter,
        createContext: async () => {
          return createWorkersContext(request);
        },
        onError: ({ error, path }) => {
          console.error(`tRPC error on '${path}':`, error);
        },
      });

      // Extract cookies from context if any were set
      // Note: This is a limitation - we can't easily extract cookies from the context
      // For now, procedures that set cookies will need to return them in the response
      return response;
    }

    // For static files, return 404 - these should be served by Cloudflare Pages
    // In production, static files are served by Pages, and Workers handles API routes
    return new Response("Not Found", { status: 404 });
  },
};

async function handleOAuthCallback(request: Request, env: any): Promise<Response> {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!code || !state) {
    return new Response(
      JSON.stringify({ error: "code and state are required" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    const tokenResponse = await sdk.exchangeCodeForToken(code, state);
    const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

    if (!userInfo.openId) {
      return new Response(
        JSON.stringify({ error: "openId missing from user info" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    await db.upsertUser({
      openId: userInfo.openId,
      name: userInfo.name || null,
      email: userInfo.email ?? null,
      loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
      lastSignedIn: new Date(),
    });

    const sessionToken = await sdk.createSessionToken(userInfo.openId, {
      name: userInfo.name || "",
      expiresInMs: ONE_YEAR_MS,
    });

    // Set cookie and redirect
    const cookieOptions = getCookieOptions(request);
    const cookieString = `${COOKIE_NAME}=${sessionToken}; Path=/; HttpOnly; SameSite=None; Secure; Max-Age=${Math.floor(ONE_YEAR_MS / 1000)}`;

    return new Response(null, {
      status: 302,
      headers: {
        Location: "/",
        "Set-Cookie": cookieString,
      },
    });
  } catch (error) {
    console.error("[OAuth] Callback failed", error);
    return new Response(
      JSON.stringify({ error: "OAuth callback failed" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

async function handleStripeWebhookRequest(request: Request, env: any): Promise<Response> {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return new Response(
        JSON.stringify({ error: "Missing stripe-signature header" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    await handleStripeWebhook(body, signature);

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: "Webhook handler failed" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

function getCookieOptions(request: Request) {
  // Determine if request is secure
  const url = new URL(request.url);
  const isSecure = url.protocol === "https:";

  return {
    httpOnly: true,
    path: "/",
    sameSite: "None" as const,
    secure: isSecure,
  };
}

