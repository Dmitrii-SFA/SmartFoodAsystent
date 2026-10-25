const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-access-token",
};

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const url = new URL(request.url);

    // Перехватываем все POST-запросы к ИИ
    if (request.method === "POST" || url.pathname === "/api") {
      try {
        const requestData = await request.json();
        const apiKey = env.GEMINI_API_KEY;

        if (!apiKey) {
          return new Response(JSON.stringify({ error: "GEMINI_API_KEY не найден в Secrets" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        const targetModel = requestData.model || "gemini-2.5-flash-lite";
        const googleUrl = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey}`;

        const geminiResponse = await fetch(googleUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: requestData.contents })
        });

        const result = await geminiResponse.json();
        return new Response(JSON.stringify(result), {
          status: geminiResponse.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    // Все обычные запросы к страницам сайта отдаем из статики
    return env.ASSETS.fetch(request);
  }
};
