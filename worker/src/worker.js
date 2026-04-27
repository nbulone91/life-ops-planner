const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders(request, env) });
    }

    try {
      if (url.pathname === "/api/health") {
        return json({ ok: true, service: "life-ops-planner-api" }, request, env);
      }

      if (url.pathname === "/api/state" && request.method === "GET") {
        const syncId = validateSyncId(url.searchParams.get("syncId"));
        const record = await env.PLANNER_KV.get(stateKey(syncId), "json");
        return json(record || { state: null, updatedAt: null }, request, env);
      }

      if (url.pathname === "/api/state" && request.method === "PUT") {
        const body = await readJson(request);
        const syncId = validateSyncId(body.syncId);
        const record = {
          state: body.state,
          updatedAt: new Date().toISOString(),
        };
        await env.PLANNER_KV.put(stateKey(syncId), JSON.stringify(record));
        return json(record, request, env);
      }

      if (url.pathname === "/api/ai" && request.method === "POST") {
        return handleAI(request, env);
      }

      return json({ error: "Not found" }, request, env, 404);
    } catch (error) {
      const status = error.status || 500;
      return json({ error: error.message || "Request failed" }, request, env, status);
    }
  },
};

async function handleAI(request, env) {
  if (!env.OPENAI_API_KEY) {
    return json({ error: "OPENAI_API_KEY is not configured on the backend." }, request, env, 501);
  }

  const body = await readJson(request);
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: env.OPENAI_MODEL || "gpt-5",
      instructions: "You are the writing assistant inside Life Ops Planner. Be concise, concrete, and helpful.",
      input: body.input,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    return json({ error: data.error?.message || "OpenAI request failed" }, request, env, response.status);
  }

  return json({ text: extractResponseText(data), raw: data }, request, env);
}

async function readJson(request) {
  try {
    return await request.json();
  } catch {
    throw httpError("Invalid JSON body", 400);
  }
}

function validateSyncId(syncId) {
  if (!syncId || typeof syncId !== "string" || !/^[a-f0-9]{64}$/.test(syncId)) {
    throw httpError("Invalid sync id", 400);
  }
  return syncId;
}

function stateKey(syncId) {
  return `planner:${syncId}`;
}

function extractResponseText(data) {
  if (data.output_text) return data.output_text;
  return (data.output || [])
    .flatMap((item) => item.content || [])
    .map((content) => content.text || "")
    .filter(Boolean)
    .join("\n")
    .trim();
}

function json(payload, request, env, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...JSON_HEADERS,
      ...corsHeaders(request, env),
    },
  });
}

function corsHeaders(request, env) {
  const origin = request.headers.get("Origin") || "";
  const allowedOrigin = env.ALLOWED_ORIGIN || "https://nbulone91.github.io";
  const allowOrigin = origin === allowedOrigin || origin.startsWith("http://127.0.0.1") ? origin : allowedOrigin;
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET,PUT,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Vary": "Origin",
  };
}

function httpError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}
