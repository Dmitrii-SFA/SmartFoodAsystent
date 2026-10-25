const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-access-token, x-device-id",
  "Access-Control-Expose-Headers": "x-remaining-requests, x-is-master, x-storage-mode",
};

const PACKAGE_REQUESTS_LIMIT = 500;
const MAX_DEVICES_PER_KEY = 2;
const MIN_REQUEST_INTERVAL_MS = 9500;
const MAX_REQUESTS_PER_MINUTE = 3;

const memoryRateLimits = new Map();
const memoryKeyDevices = new Map();

function parseAllowedKeys(raw) {
  if (!raw || typeof raw !== "string") return [];
  return raw
    .split(/[\s,;]+/)
    .map((k) => k.trim())
    .filter(Boolean);
}

function getKvNamespace(env) {
  if (!env || typeof env !== "object") return null;
  const candidate = env.KEYS_KV || env.QUOTA_KV || env.AI_QUOTA_KV || env.KV || null;
  if (candidate && typeof candidate.get === "function" && typeof candidate.put === "function") {
    return candidate;
  }
  return null;
}

function checkRateLimit(clientKey) {
  const now = Date.now();
  const rawList = memoryRateLimits.get(clientKey) || [];
  const recent = rawList.filter((t) => now - t < 60000);

  if (recent.length > 0) {
    const lastAt = recent[recent.length - 1];
    const elapsed = now - lastAt;
    if (elapsed < MIN_REQUEST_INTERVAL_MS) {
      const waitSeconds = Math.max(1, Math.ceil((10000 - elapsed) / 1000));
      return {
        allowed: false,
        code: "COOLDOWN",
        waitSeconds,
        message: `Пожалуйста, подождите ${waitSeconds} сек. перед следующим запросом (пауза 10 сек).`,
      };
    }
  }

  if (recent.length >= MAX_REQUESTS_PER_MINUTE) {
    const oldest = recent[0];
    const waitSeconds = Math.max(1, Math.ceil((60000 - (now - oldest)) / 1000));
    return {
      allowed: false,
      code: "RATE_LIMIT",
      waitSeconds,
      message: `Превышен минутный лимит (максимум 3 запроса в минуту). Подождите ${waitSeconds} сек.`,
    };
  }

  recent.push(now);
  memoryRateLimits.set(clientKey, recent);
  return { allowed: true };
}

function rollbackLastRateLimitTimestamp(clientKey) {
  const recent = memoryRateLimits.get(clientKey);
  if (Array.isArray(recent) && recent.length > 0) {
    recent.pop();
    memoryRateLimits.set(clientKey, recent);
  }
}

async function verifyAndLoadKeyState({ accessKey, deviceId, env, registerDevice = true }) {
  const cleanKey = (accessKey || "").trim();
  const cleanDevice = (deviceId || "").trim();
  const masterKey = (env?.MASTER_KEY || env?.OWNER_MASTER_KEY || "").trim();

  if (masterKey && cleanKey === masterKey) {
    return {
      ok: true,
      isMaster: true,
      remainingRequests: null,
      storageMode: "server",
      devicesUsed: 0,
      maxDevices: null,
    };
  }

  const allowedKeysRaw = env?.ALLOWED_KEYS || env?.ACCESS_KEYS || env?.VALID_KEYS || "";
  const allowedKeys = parseAllowedKeys(allowedKeysRaw);

  if (allowedKeys.length > 0 && !allowedKeys.includes(cleanKey)) {
    return {
      ok: false,
      status: 403,
      code: "INVALID_KEY",
      error: "Неверный ключ активации. Проверьте правильность введённого ключа.",
    };
  }

  const kv = getKvNamespace(env);

  if (kv) {
    try {
      const storageKey = `key_v1:${cleanKey}`;
      let record = await kv.get(storageKey, "json");
      if (!record || typeof record !== "object") {
        record = {
          remaining: PACKAGE_REQUESTS_LIMIT,
          devices: [],
          createdAt: Date.now(),
        };
      }

      if (!Array.isArray(record.devices)) record.devices = [];
      if (typeof record.remaining !== "number" || Number.isNaN(record.remaining)) {
        record.remaining = PACKAGE_REQUESTS_LIMIT;
      }

      if (cleanDevice) {
        if (!record.devices.includes(cleanDevice)) {
          if (record.devices.length >= MAX_DEVICES_PER_KEY) {
            return {
              ok: false,
              status: 403,
              code: "DEVICE_LIMIT_REACHED",
              error: `Превышен лимит устройств: этот ключ уже активирован на ${MAX_DEVICES_PER_KEY} устройствах (максимум 2 устройства на один ключ).`,
            };
          }
          if (registerDevice) {
            record.devices.push(cleanDevice);
            await kv.put(storageKey, JSON.stringify(record));
          }
        }
      }

      if (record.remaining <= 0) {
        return {
          ok: false,
          status: 402,
          code: "KEY_EXHAUSTED",
          remainingRequests: 0,
          error: "Лимит в 500 ИИ-запросов по этому ключу исчерпан. Пожалуйста, приобретите новый пакет и введите новый ключ активации.",
        };
      }

      return {
        ok: true,
        isMaster: false,
        remainingRequests: record.remaining,
        storageMode: "server",
        devicesUsed: record.devices.length,
        maxDevices: MAX_DEVICES_PER_KEY,
        kv,
        storageKey,
        record,
      };
    } catch (kvErr) {
      console.warn("Pages Function KV error, falling back to client balance tracking:", kvErr);
    }
  }

  if (cleanDevice) {
    const knownDevices = memoryKeyDevices.get(cleanKey) || [];
    if (!knownDevices.includes(cleanDevice)) {
      if (knownDevices.length >= MAX_DEVICES_PER_KEY) {
        return {
          ok: false,
          status: 403,
          code: "DEVICE_LIMIT_REACHED",
          error: `Превышен лимит устройств: этот ключ уже используется на ${MAX_DEVICES_PER_KEY} устройствах.`,
        };
      }
      if (registerDevice) {
        knownDevices.push(cleanDevice);
        memoryKeyDevices.set(cleanKey, knownDevices);
      }
    }
  }

  return {
    ok: true,
    isMaster: false,
    remainingRequests: null,
    storageMode: "client_fallback",
    devicesUsed: (memoryKeyDevices.get(cleanKey) || []).length || 1,
    maxDevices: MAX_DEVICES_PER_KEY,
  };
}

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
  let clientRateKey = "";
  let recordedRateLimit = false;

  try {
    const requestData = await context.request.json();
    const headerKey = context.request.headers.get("x-access-token") || "";
    const headerDevice = context.request.headers.get("x-device-id") || "";
    const accessKey = (headerKey || requestData.accessKey || "").trim();
    const deviceId = (headerDevice || requestData.deviceId || "").trim();
    const clientIp = context.request.headers.get("cf-connecting-ip") || "anon";

    if (requestData.action === "verify_key") {
      if (!accessKey) {
        return new Response(
          JSON.stringify({ error: "Введите ключ активации", code: "EMPTY_KEY" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const verification = await verifyAndLoadKeyState({
        accessKey,
        deviceId,
        env: context.env,
        registerDevice: true,
      });

      if (!verification.ok) {
        return new Response(
          JSON.stringify({
            valid: false,
            error: verification.error,
            code: verification.code,
            remainingRequests: verification.remainingRequests ?? undefined,
          }),
          {
            status: verification.status || 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({
          valid: true,
          isMaster: verification.isMaster,
          remainingRequests: verification.remainingRequests,
          storageMode: verification.storageMode,
          devicesUsed: verification.devicesUsed,
          maxDevices: verification.maxDevices,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let keyContext = null;
    if (accessKey) {
      keyContext = await verifyAndLoadKeyState({
        accessKey,
        deviceId,
        env: context.env,
        registerDevice: true,
      });

      if (!keyContext.ok) {
        return new Response(
          JSON.stringify({
            error: keyContext.error,
            code: keyContext.code,
            remainingRequests: keyContext.remainingRequests ?? undefined,
          }),
          {
            status: keyContext.status || 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    const isMaster = Boolean(keyContext && keyContext.isMaster);

    if (!isMaster) {
      clientRateKey = deviceId || accessKey || clientIp;
      const rateCheck = checkRateLimit(clientRateKey);
      if (!rateCheck.allowed) {
        return new Response(
          JSON.stringify({
            error: rateCheck.message,
            code: rateCheck.code,
            waitSeconds: rateCheck.waitSeconds,
          }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      recordedRateLimit = true;
    }

    const apiKey = context.env.GEMINI_API_KEY;
    if (!apiKey) {
      if (recordedRateLimit) rollbackLastRateLimitTimestamp(clientRateKey);
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
    const hasValidCandidate = Boolean(
      geminiResponse.ok &&
        result &&
        !result.error &&
        result.candidates &&
        result.candidates[0]?.content?.parts?.[0]?.text
    );

    if (!hasValidCandidate) {
      if (recordedRateLimit) rollbackLastRateLimitTimestamp(clientRateKey);
      return new Response(JSON.stringify(result), {
        status: geminiResponse.ok ? 502 : geminiResponse.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let updatedRemaining = null;
    let storageMode = keyContext ? keyContext.storageMode : "starter";

    if (keyContext && !isMaster && keyContext.kv && keyContext.record) {
      try {
        keyContext.record.remaining = Math.max(0, keyContext.record.remaining - 1);
        updatedRemaining = keyContext.record.remaining;
        await keyContext.kv.put(
          keyContext.storageKey,
          JSON.stringify(keyContext.record)
        );
      } catch (kvWriteErr) {
        console.warn("Pages Function KV write error:", kvWriteErr);
        storageMode = "client_fallback";
      }
    }

    const responseHeaders = {
      ...corsHeaders,
      "Content-Type": "application/json",
      "x-is-master": isMaster ? "true" : "false",
      "x-storage-mode": storageMode,
    };

    if (typeof updatedRemaining === "number") {
      responseHeaders["x-remaining-requests"] = String(updatedRemaining);
      result.remainingRequests = updatedRemaining;
    }

    result._quota = {
      isMaster,
      remainingRequests: updatedRemaining,
      storageMode,
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: responseHeaders,
    });
  } catch (err) {
    if (recordedRateLimit && clientRateKey) {
      rollbackLastRateLimitTimestamp(clientRateKey);
    }
    return new Response(
      JSON.stringify({ error: err?.message || "Function error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
}
