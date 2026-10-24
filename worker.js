/**
 * Cloudflare Worker entry point for Smart Food Assistance
 * Fixes 405 Method Not Allowed by handling POST & OPTIONS requests before static assets,
 * and proxies AI requests to Google Gemini (gemini-3.5-flash-lite with automatic fallback).
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-access-token, Authorization',
  'Access-Control-Max-Age': '86400',
};

const MODEL_FALLBACK_CHAIN = [
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-2.5-flash-lite',
  'gemini-flash-latest',
];

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
}

export default {
  async fetch(request, env, ctx) {
    const method = request.method.toUpperCase();

    // 1. Handle CORS Preflight (OPTIONS)
    if (method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: CORS_HEADERS,
      });
    }

    // 2. Handle AI POST requests (camera photo scan, food estimation, recipes, chat)
    if (method === 'POST') {
      const apiKey = env?.GEMINI_API_KEY;
      if (!apiKey) {
        return jsonResponse(
          {
            error: {
              message:
                'GEMINI_API_KEY не настроен в секретах Cloudflare Worker (Settings -> Variables and Secrets).',
            },
          },
          500
        );
      }

      let requestBody;
      try {
        requestBody = await request.json();
      } catch {
        return jsonResponse(
          { error: { message: 'Некорректное JSON-тело запроса.' } },
          400
        );
      }

      // Optional access token validation if ACCESS_KEYS secret is configured in Worker
      const clientAccessToken = (request.headers.get('x-access-token') || '').trim();
      if (env?.VALID_ACCESS_KEYS) {
        const allowedKeys = String(env.VALID_ACCESS_KEYS)
          .split(',')
          .map((k) => k.trim())
          .filter(Boolean);
        if (
          clientAccessToken &&
          allowedKeys.length > 0 &&
          !allowedKeys.includes(clientAccessToken)
        ) {
          return jsonResponse(
            { error: { message: 'Недействительный ключ годового доступа.' } },
            401
          );
        }
      }

      const requestedModel =
        typeof requestBody.model === 'string' && requestBody.model.trim()
          ? requestBody.model.trim()
          : 'gemini-3.5-flash-lite';

      // Build ordered list of models to try (starting with requestedModel, e.g. gemini-3.5-flash-lite)
      const modelsToTry = [
        requestedModel,
        ...MODEL_FALLBACK_CHAIN.filter((m) => m !== requestedModel),
      ];

      // Build clean Gemini generateContent payload
      const geminiPayload = {
        contents: requestBody.contents || [],
      };
      if (requestBody.generationConfig) {
        geminiPayload.generationConfig = requestBody.generationConfig;
      }
      if (requestBody.systemInstruction) {
        geminiPayload.systemInstruction =
          typeof requestBody.systemInstruction === 'string'
            ? { parts: [{ text: requestBody.systemInstruction }] }
            : requestBody.systemInstruction;
      }

      let lastResponseData = null;
      let lastStatus = 500;

      for (const modelName of modelsToTry) {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
          modelName
        )}:generateContent?key=${encodeURIComponent(apiKey)}`;

        const upstreamResponse = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(geminiPayload),
        });

        lastStatus = upstreamResponse.status;
        try {
          lastResponseData = await upstreamResponse.json();
        } catch {
          lastResponseData = {
            error: { message: `Upstream error (${upstreamResponse.status})` },
          };
        }

        if (upstreamResponse.ok) {
          return jsonResponse(
            {
              ...lastResponseData,
              modelUsed: modelName,
            },
            200
          );
        }

        // If model alias was not found (404) or invalid argument on model name (400), try next fallback model
        if (upstreamResponse.status === 404 || upstreamResponse.status === 400) {
          continue;
        }

        // For other errors (e.g., 429 quota, 401/403 key error), return immediately
        break;
      }

      return jsonResponse(
        lastResponseData || { error: { message: 'Ошибка при обращении к Gemini API.' } },
        lastStatus
      );
    }

    // 3. Handle GET / HEAD requests: serve static assets if bound, or return Worker status JSON
    if (env?.ASSETS && typeof env.ASSETS.fetch === 'function') {
      const assetResponse = await env.ASSETS.fetch(request);
      if (assetResponse.status !== 404) {
        return assetResponse;
      }
      // SPA fallback to index.html for navigation routes
      const url = new URL(request.url);
      if (!url.pathname.includes('.')) {
        return env.ASSETS.fetch(new Request(new URL('/index.html', request.url), request));
      }
      return assetResponse;
    }

    return jsonResponse({
      status: 'ok',
      service: 'Smart Food Assistance Cloudflare Worker',
      model: 'gemini-3.5-flash-lite',
    });
  },
};
