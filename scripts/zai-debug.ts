/** Debug ZAI API response shape. Run: npx tsx scripts/zai-debug.ts */
import { readFileSync } from "node:fs";

const env = readFileSync(process.env.HOME + "/.hermes/.env", "utf-8");
for (const line of env.split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

const key = process.env.GLM_API_KEY;
console.log("key prefix:", key?.slice(0, 8) + "...");

async function main() {
  const res = await fetch("https://api.z.ai/api/paas/v4/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: "glm-4.5-flash", messages: [{ role: "user", content: "say hi in Thai" }], max_tokens: 30 }),
    signal: AbortSignal.timeout(25000),
  });
  console.log("status:", res.status);
  const text = await res.text();
  console.log("body head:", text.slice(0, 400));
}
main();
