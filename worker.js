const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-access-token",
};

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const url = new URL(request.url);
    const pathname = url.pathname.replace(/\/+$/, "") || "/";

    if (request.method === "GET" && pathname === "/api/app-icon") {
      return new Response(JSON.stringify({ iconId: 1 }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (request.method === "GET" && pathname === "/api") {
      return new Response(
        JSON.stringify({
          status: "ok",
          service: "Smart Food Assistance AI Worker",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Перехватываем все POST-запросы к ИИ (на /api, /api/* или корень)
    if (request.method === "POST" || pathname === "/api" || pathname.startsWith("/api/")) {
      try {
        const requestData = await request.json();
        const apiKey = env.GEMINI_API_KEY;

        if (!apiKey) {
          return new Response(
            JSON.stringify({ error: "GEMINI_API_KEY не найден в Secrets" }),
            {
              status: 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        const targetModel = requestData.model || "gemini-3.5-flash-lite";
        const googleUrl = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey}`;

        const geminiPayload = {
          contents: requestData.contents,
          ...(requestData.generationConfig
            ? { generationConfig: requestData.generationConfig }
            : {}),
        };

        const geminiResponse = await fetch(googleUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(geminiPayload),
        });

        const result = await geminiResponse.json();
        return new Response(JSON.stringify(result), {
          status: geminiResponse.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (err) {
        return new Response(
          JSON.stringify({ error: err?.message || "Worker error" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // Все обычные GET/HEAD запросы к страницам сайта отдаем из статики
    if (env && env.ASSETS && typeof env.ASSETS.fetch === "function") {
      return env.ASSETS.fetch(request);
    }

    return new Response("Not Found", { status: 404, headers: corsHeaders });
  },
};
