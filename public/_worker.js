/**
 * Cloudflare Pages / Assets _worker.js entry point for Smart Food Assistance
 * Self-contained copy placed in dist/_worker.js on build so Cloudflare Pages
 * also handles POST & OPTIONS requests without 405 Method Not Allowed.
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

    if (method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: CORS_HEADERS,
      });
    }

    if (method === 'POST') {
      const apiKey = env?.GEMINI_API_KEY;
      if (!apiKey) {
        return jsonResponse(
          {
            error: {
              message:
                'GEMINI_API_KEY не настроен в секретах Cloudflare (Settings -> Variables and Secrets).',
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

      const modelsToTry = [
        requestedModel,
        ...MODEL_FALLBACK_CHAIN.filter((m) => m !== requestedModel),
      ];

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

        if (upstreamResponse.status === 404 || upstreamResponse.status === 400) {
          continue;
        }

        break;
      }

      return jsonResponse(
        lastResponseData || { error: { message: 'Ошибка при обращении к Gemini API.' } },
        lastStatus
      );
    }

    if (env?.ASSETS && typeof env.ASSETS.fetch === 'function') {
      const assetResponse = await env.ASSETS.fetch(request);
      if (assetResponse.status !== 404) {
        return assetResponse;
      }
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
