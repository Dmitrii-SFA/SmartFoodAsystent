const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-access-token, x-access-key, x-device-id",
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
    .split(/[,;\n\r]+/)
    .map((k) => k.trim())
    .filter(Boolean);
}

function getKvNamespace(env) {
  if (
    env &&
    env.USERS_KV &&
    typeof env.USERS_KV.get === "function" &&
    typeof env.USERS_KV.put === "function"
  ) {
    return env.USERS_KV;
  }
  return null;
}

function parseKvRecord(rawText) {
  if (rawText === null || rawText === undefined) return null;

  if (typeof rawText === "object" && !Array.isArray(rawText)) {
    const rawRem =
      rawText.remaining ?? rawText.limit ?? rawText.balance ?? rawText.requests;
    const remaining =
      typeof rawRem === "number" && !Number.isNaN(rawRem)
        ? Math.max(0, Math.floor(rawRem))
        : typeof rawRem === "string" && /^\d+$/.test(rawRem.trim())
        ? Math.max(0, parseInt(rawRem.trim(), 10))
        : PACKAGE_REQUESTS_LIMIT;
    const devices = Array.isArray(rawText.devices)
      ? rawText.devices.filter((d) => typeof d === "string" && d.trim().length > 0)
      : [];
    return {
      remaining,
      devices,
      needsNormalization: !(
        typeof rawText.remaining === "number" && Array.isArray(rawText.devices)
      ),
    };
  }

  if (typeof rawText === "number" && !Number.isNaN(rawText)) {
    return {
      remaining: Math.max(0, Math.floor(rawText)),
      devices: [],
      needsNormalization: true,
    };
  }

  const text = String(rawText).trim();

  if (text.length > 0) {
    try {
      const parsed = JSON.parse(text);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        const rawRem =
          parsed.remaining ?? parsed.limit ?? parsed.balance ?? parsed.requests;
        const remaining =
          typeof rawRem === "number" && !Number.isNaN(rawRem)
            ? Math.max(0, Math.floor(rawRem))
            : typeof rawRem === "string" && /^\d+$/.test(rawRem.trim())
            ? Math.max(0, parseInt(rawRem.trim(), 10))
            : PACKAGE_REQUESTS_LIMIT;
        const devices = Array.isArray(parsed.devices)
          ? parsed.devices.filter(
              (d) => typeof d === "string" && d.trim().length > 0
            )
          : [];
        return {
          remaining,
          devices,
          needsNormalization: !(
            typeof parsed.remaining === "number" &&
            Array.isArray(parsed.devices)
          ),
        };
      }
      if (typeof parsed === "number" && !Number.isNaN(parsed)) {
        return {
          remaining: Math.max(0, Math.floor(parsed)),
          devices: [],
          needsNormalization: true,
        };
      }
    } catch {
      // plain text value
    }
  }

  const numericMatch = text.match(/^(\d{1,6})(?:\s|$)/);
  if (numericMatch) {
    return {
      remaining: Math.max(0, parseInt(numericMatch[1], 10)),
      devices: [],
      needsNormalization: true,
    };
  }

  return {
    remaining: PACKAGE_REQUESTS_LIMIT,
    devices: [],
    needsNormalization: true,
  };
}

async function findKeyInUsersKv(kv, cleanKey) {
  if (!kv || !cleanKey) return null;

  let rawExisting = await kv.get(cleanKey);
  if (rawExisting !== null && rawExisting !== undefined) {
    return { storageKey: cleanKey, rawExisting };
  }

  const upperKey = cleanKey.toUpperCase();
  if (upperKey !== cleanKey) {
    rawExisting = await kv.get(upperKey);
    if (rawExisting !== null && rawExisting !== undefined) {
      return { storageKey: upperKey, rawExisting };
    }
  }

  const lowerKey = cleanKey.toLowerCase();
  if (lowerKey !== cleanKey) {
    rawExisting = await kv.get(lowerKey);
    if (rawExisting !== null && rawExisting !== undefined) {
      return { storageKey: lowerKey, rawExisting };
    }
  }

  if (typeof kv.list === "function") {
    try {
      const listResult = await kv.list({ limit: 1000 });
      const keys = Array.isArray(listResult?.keys) ? listResult.keys : [];
      const matchedEntry = keys.find(
        (item) =>
          typeof item?.name === "string" &&
          item.name.trim().toLowerCase() === lowerKey
      );
      if (matchedEntry && matchedEntry.name) {
        rawExisting = await kv.get(matchedEntry.name);
        if (rawExisting !== null && rawExisting !== undefined) {
          return { storageKey: matchedEntry.name, rawExisting };
        }
      }
    } catch {
      // ignore list error
    }
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

async function verifyAndLoadKeyState({
  accessKey,
  deviceId,
  env,
  registerDevice = true,
}) {
  const cleanKey = (accessKey || "").trim();
  const cleanDevice = (deviceId || "").trim();
  const masterKey =
    typeof env?.MASTER_KEY === "string" ? env.MASTER_KEY.trim() : "";

  // 1. Если введён ключ из env.MASTER_KEY — даём безлимитный доступ без ограничений
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

  const allowedKeysRaw =
    typeof env?.ALLOWED_KEYS === "string" ? env.ALLOWED_KEYS : "";
  const allowedKeys = parseAllowedKeys(allowedKeysRaw);
  const isInAllowedKeys = allowedKeys.some(
    (k) => k.toLowerCase() === cleanKey.toLowerCase()
  );

  const kv = getKvNamespace(env);

  // 2. Сначала ищем ключ как запись в базе env.USERS_KV (f88a2d8d574b41f59e6db567479fb7db)
  if (kv) {
    try {
      const found = await findKeyInUsersKv(kv, cleanKey);
      let storageKey = found ? found.storageKey : cleanKey;
      let record = found ? parseKvRecord(found.rawExisting) : null;
      let needsSave = Boolean(record && record.needsNormalization);

      // Если записи в USERS_KV ещё нет — проверяем, есть ли этот ключ в списке env.ALLOWED_KEYS
      if (!record) {
        if (isInAllowedKeys) {
          record = {
            remaining: PACKAGE_REQUESTS_LIMIT,
            devices: [],
            needsNormalization: false,
          };
          needsSave = true;
        } else {
          return {
            ok: false,
            status: 403,
            code: "INVALID_KEY",
            error: "Неверный ключ доступа",
          };
        }
      }

      // 3. Проверка и привязка x-device-id (максимум 2 устройства)
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
            needsSave = true;
          }
        }
      }

      if (needsSave) {
        await kv.put(
          storageKey,
          JSON.stringify({
            remaining: record.remaining,
            devices: record.devices,
          })
        );
      }

      if (record.remaining <= 0) {
        return {
          ok: false,
          status: 402,
          code: "KEY_EXHAUSTED",
          remainingRequests: 0,
          error:
            "Лимит в 500 ИИ-запросов по этому ключу исчерпан. Пожалуйста, приобретите новый пакет и введите новый ключ активации.",
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
      console.warn(
        "Pages Function USERS_KV error, falling back to ALLOWED_KEYS check:",
        kvErr
      );
    }
  }

  // Fallback если env.USERS_KV временно не настроено
  if (!isInAllowedKeys) {
    return {
      ok: false,
      status: 403,
      code: "INVALID_KEY",
      error: "Неверный ключ доступа",
    };
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

export async function onRequestGet(context) {
  return new Response(
    JSON.stringify({
      status: "ok",
      service: "Smart Food Assistance Pages Function",
      kvBound: Boolean(getKvNamespace(context?.env)),
    }),
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
    const headerKey =
      context.request.headers.get("x-access-token") ||
      context.request.headers.get("x-access-key") ||
      "";
    const headerDevice = context.request.headers.get("x-device-id") || "";
    const accessKey = (headerKey || requestData.accessKey || "").trim();
    const deviceId = (headerDevice || requestData.deviceId || "").trim();
    const clientIp = context.request.headers.get("cf-connecting-ip") || "anon";

    if (requestData.action === "verify_key") {
      if (!accessKey) {
        return new Response(
          JSON.stringify({
            valid: false,
            error: "Введите ключ активации",
            code: "EMPTY_KEY",
          }),
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

    const apiKey = context.env?.GEMINI_API_KEY;
    if (!apiKey) {
      if (recordedRateLimit) rollbackLastRateLimitTimestamp(clientRateKey);
      return new Response(
        JSON.stringify({
          error: "GEMINI_API_KEY не найден в настройках (env.GEMINI_API_KEY)",
        }),
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
      geminiResponse.status === 200 &&
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
        keyContext.record.remaining = Math.max(
          0,
          keyContext.record.remaining - 1
        );
        updatedRemaining = keyContext.record.remaining;
        await keyContext.kv.put(
          keyContext.storageKey,
          JSON.stringify({
            remaining: keyContext.record.remaining,
            devices: keyContext.record.devices,
          })
        );
      } catch (kvWriteErr) {
        console.warn("Pages Function USERS_KV write error:", kvWriteErr);
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
