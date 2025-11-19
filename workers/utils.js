export function createCORSHeaders() {
  return new Headers({
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  });
}

export function createJSONResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...createCORSHeaders(),
    },
  });
}

export function handleOptionsRequest() {
  return new Response(null, {
    status: 200,
    headers: createCORSHeaders(),
  });
}
