import type { User } from "../../drizzle/schema";
import type { TrpcContext } from "./context";
import { sdk } from "./sdk";

// Create Express-like request/response objects for Workers compatibility
function createExpressLikeReq(request: Request) {
  const url = new URL(request.url);
  
  return {
    headers: {
      cookie: request.headers.get("cookie") || undefined,
    },
    protocol: url.protocol.replace(":", ""),
    hostname: url.hostname,
    url: url.pathname + url.search,
    originalUrl: url.pathname + url.search,
    query: Object.fromEntries(url.searchParams.entries()),
  } as any;
}

function createExpressLikeRes() {
  const headers = new Headers();
  const cookies: string[] = [];
  
  return {
    cookie: (name: string, value: string, options: any = {}) => {
      const parts = [`${name}=${value}`];
      if (options.path) parts.push(`Path=${options.path}`);
      if (options.maxAge) parts.push(`Max-Age=${options.maxAge}`);
      if (options.httpOnly) parts.push("HttpOnly");
      if (options.secure) parts.push("Secure");
      if (options.sameSite) parts.push(`SameSite=${options.sameSite}`);
      cookies.push(parts.join("; "));
    },
    clearCookie: (name: string, options: any = {}) => {
      const parts = [`${name}=`];
      if (options.path) parts.push(`Path=${options.path}`);
      parts.push("Max-Age=0");
      if (options.httpOnly) parts.push("HttpOnly");
      if (options.secure) parts.push("Secure");
      if (options.sameSite) parts.push(`SameSite=${options.sameSite}`);
      cookies.push(parts.join("; "));
    },
    getHeader: (name: string) => headers.get(name),
    setHeader: (name: string, value: string) => {
      headers.set(name, value);
    },
    _cookies: cookies,
    _headers: headers,
  } as any;
}

export async function createWorkersContext(
  request: Request
): Promise<TrpcContext> {
  let user: User | null = null;
  const expressLikeReq = createExpressLikeReq(request);
  const expressLikeRes = createExpressLikeRes();

  try {
    user = await sdk.authenticateRequest(expressLikeReq);
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  return {
    req: expressLikeReq,
    res: expressLikeRes,
    user,
  };
}

