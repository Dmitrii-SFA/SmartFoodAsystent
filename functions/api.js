const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-access-token",
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function onRequestGet() {
  return new Response(
    JSON.stringify({ status: "ok", service: "Smart Food Assistance Pages Function" }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}

export async function onRequestPost(context) {
  try {
    const requestData = await context.request.json();
    const apiKey = context.env.GEMINI_API_KEY;

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "GEMINI_API_KEY не найден в Secrets" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const targetModel = requestData.model || "gemini-2.5-flash-lite";
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
      JSON.stringify({ error: err?.message || "Function error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
}
