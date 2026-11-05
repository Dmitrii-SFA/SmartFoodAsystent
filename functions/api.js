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
    const rawInit = rawText.initialLimit ?? rawText.packageLimit;
    const initialLimit =
      typeof rawInit === "number" && !Number.isNaN(rawInit) && rawInit > 0
        ? Math.max(remaining, Math.floor(rawInit))
        : Math.max(PACKAGE_REQUESTS_LIMIT, remaining);
    const devices = Array.isArray(rawText.devices)
      ? rawText.devices.filter((d) => typeof d === "string" && d.trim().length > 0)
      : [];
    const carryoverApplied = Boolean(rawText.carryoverApplied);
    return {
      remaining,
      initialLimit,
      devices,
      carryoverApplied,
      needsNormalization: !(
        typeof rawText.remaining === "number" && Array.isArray(rawText.devices)
      ),
    };
  }

  if (typeof rawText === "number" && !Number.isNaN(rawText)) {
    const rem = Math.max(0, Math.floor(rawText));
    return {
      remaining: rem,
      initialLimit: Math.max(PACKAGE_REQUESTS_LIMIT, rem),
      devices: [],
      carryoverApplied: false,
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
        const rawInit = parsed.initialLimit ?? parsed.packageLimit;
        const initialLimit =
          typeof rawInit === "number" && !Number.isNaN(rawInit) && rawInit > 0
            ? Math.max(remaining, Math.floor(rawInit))
            : Math.max(PACKAGE_REQUESTS_LIMIT, remaining);
        const devices = Array.isArray(parsed.devices)
          ? parsed.devices.filter(
              (d) => typeof d === "string" && d.trim().length > 0
            )
          : [];
        const carryoverApplied = Boolean(parsed.carryoverApplied);
        return {
          remaining,
          initialLimit,
          devices,
          carryoverApplied,
          needsNormalization: !(
            typeof parsed.remaining === "number" &&
            Array.isArray(parsed.devices)
          ),
        };
      }
      if (typeof parsed === "number" && !Number.isNaN(parsed)) {
        const rem = Math.max(0, Math.floor(parsed));
        return {
          remaining: rem,
          initialLimit: Math.max(PACKAGE_REQUESTS_LIMIT, rem),
          devices: [],
          carryoverApplied: false,
          needsNormalization: true,
        };
      }
    } catch {
      // plain text value
    }
  }

  const numericMatch = text.match(/^(\d{1,6})(?:\s|$)/);
  if (numericMatch) {
    const rem = Math.max(0, parseInt(numericMatch[1], 10));
    return {
      remaining: rem,
      initialLimit: Math.max(PACKAGE_REQUESTS_LIMIT, rem),
      devices: [],
      carryoverApplied: false,
      needsNormalization: true,
    };
  }

  return {
    remaining: PACKAGE_REQUESTS_LIMIT,
    initialLimit: PACKAGE_REQUESTS_LIMIT,
    devices: [],
    carryoverApplied: false,
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
  carryoverRequests = 0,
  previousAccessKey = "",
  isExplicitVerify = false,
}) {
  const cleanKey = (accessKey || "").trim();
  const cleanDevice = (deviceId || "").trim();
  const cleanPrevKey = (previousAccessKey || "").trim();
  const masterKey =
    typeof env?.MASTER_KEY === "string" ? env.MASTER_KEY.trim() : "";

  // 1. Если введён ключ из env.MASTER_KEY — даём безлимитный доступ без ограничений
  if (masterKey && cleanKey === masterKey) {
    return {
      ok: true,
      isMaster: true,
      remainingRequests: null,
      packageLimit: null,
      carryoverAdded: 0,
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
            initialLimit: PACKAGE_REQUESTS_LIMIT,
            devices: [],
            carryoverApplied: false,
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

      const isFirstDeviceOrUnbound =
        record.devices.length === 0 ||
        (cleanDevice &&
          record.devices.length === 1 &&
          record.devices[0] === cleanDevice);
      const canApplyCarryover =
        !record.carryoverApplied && isFirstDeviceOrUnbound;
      let carryoverAdded = 0;

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

      // 4. При первой активации нового ключа прибавляем неизрасходованный остаток запросов
      if (canApplyCarryover && registerDevice) {
        let prevKeyRemainingInKv = 0;

        if (
          cleanPrevKey &&
          cleanPrevKey.toLowerCase() !== cleanKey.toLowerCase() &&
          (!masterKey || cleanPrevKey !== masterKey)
        ) {
          try {
            const foundPrev = await findKeyInUsersKv(kv, cleanPrevKey);
            if (foundPrev) {
              const prevRecord = parseKvRecord(foundPrev.rawExisting);
              if (prevRecord && prevRecord.remaining > 0) {
                prevKeyRemainingInKv = prevRecord.remaining;
                await kv.put(
                  foundPrev.storageKey,
                  JSON.stringify({
                    remaining: 0,
                    initialLimit:
                      prevRecord.initialLimit || PACKAGE_REQUESTS_LIMIT,
                    devices: prevRecord.devices,
                    carryoverApplied: true,
                  })
                );
              }
            }
          } catch (prevErr) {
            console.warn(
              "Failed to transfer carryover from previous key:",
              prevErr
            );
          }
        }

        const parsedClientCarryover =
          typeof carryoverRequests === "number" &&
          !Number.isNaN(carryoverRequests)
            ? Math.floor(carryoverRequests)
            : typeof carryoverRequests === "string" &&
              /^\d+$/.test(carryoverRequests.trim())
            ? parseInt(carryoverRequests.trim(), 10)
            : 0;
        const safeClientCarryover = Math.min(
          5000,
          Math.max(0, parsedClientCarryover)
        );

        const bonusToAdd = Math.max(prevKeyRemainingInKv, safeClientCarryover);

        if (bonusToAdd > 0) {
          record.remaining += bonusToAdd;
          carryoverAdded = bonusToAdd;
        }

        record.initialLimit = Math.max(
          record.initialLimit || PACKAGE_REQUESTS_LIMIT,
          record.remaining
        );
        if (bonusToAdd > 0 || isExplicitVerify) {
          record.carryoverApplied = true;
        }
        needsSave = true;
      }

      if (needsSave) {
        await kv.put(
          storageKey,
          JSON.stringify({
            remaining: record.remaining,
            initialLimit: Math.max(
              record.initialLimit || PACKAGE_REQUESTS_LIMIT,
              record.remaining
            ),
            devices: record.devices,
            carryoverApplied: Boolean(record.carryoverApplied),
          })
        );
      }

      if (record.remaining <= 0) {
        return {
          ok: false,
          status: 402,
          code: "KEY_EXHAUSTED",
          remainingRequests: 0,
          packageLimit: record.initialLimit || PACKAGE_REQUESTS_LIMIT,
          error:
            "Лимит ИИ-запросов по этому ключу исчерпан. Пожалуйста, приобретите новый пакет и введите новый ключ активации.",
        };
      }

      return {
        ok: true,
        isMaster: false,
        remainingRequests: record.remaining,
        packageLimit: Math.max(
          record.initialLimit || PACKAGE_REQUESTS_LIMIT,
          record.remaining
        ),
        carryoverAdded,
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
    packageLimit: null,
    carryoverAdded: 0,
    storageMode: "client_fallback",
    devicesUsed: (memoryKeyDevices.get(cleanKey) || []).length || 1,
    maxDevices: MAX_DEVICES_PER_KEY,
  };
}

function generateAccessKey() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const randomSegment = (length = 4) => {
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    let segment = "";
    for (let i = 0; i < length; i++) {
      segment += chars[bytes[i] % chars.length];
    }
    return segment;
  };
  return `SFA-${randomSegment(4)}-${randomSegment(4)}-${randomSegment(4)}`;
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
    const url = new URL(context.request.url);
    const pathname = url.pathname.replace(/\/+$/, "") || "/";

    if (
      pathname === "/claim-stripe-key" ||
      pathname === "/api/claim-stripe-key" ||
      requestData.action === "claim_stripe_key"
    ) {
      const sessionId =
        typeof requestData.session_id === "string"
          ? requestData.session_id.trim()
          : typeof requestData.sessionId === "string"
          ? requestData.sessionId.trim()
          : "";

      if (!sessionId) {
        return new Response(
          JSON.stringify({ error: "Не передан session_id" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const kv = getKvNamespace(context.env);
      if (!kv) {
        return new Response(
          JSON.stringify({
            error: "Хранилище USERS_KV не подключено в настройках",
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const sessionKvKey = `stripe_session_${sessionId}`;
      const existingKey = await kv.get(sessionKvKey);
      if (existingKey && typeof existingKey === "string" && existingKey.trim()) {
        return new Response(
          JSON.stringify({ key: existingKey.trim() }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const stripeSecretKey =
        typeof context.env?.STRIPE_SECRET_KEY === "string"
          ? context.env.STRIPE_SECRET_KEY.trim()
          : "";

      if (!stripeSecretKey) {
        return new Response(
          JSON.stringify({
            error: "STRIPE_SECRET_KEY не настроен в переменных окружения",
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const stripeRes = await fetch(
        `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${stripeSecretKey}`,
          },
        }
      );

      const stripeSession = await stripeRes.json();

      if (!stripeRes.ok) {
        return new Response(
          JSON.stringify({
            error:
              stripeSession?.error?.message ||
              "Ошибка при проверке сессии оплаты в Stripe",
          }),
          {
            status: stripeRes.status,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      if (stripeSession.payment_status !== "paid") {
        return new Response(
          JSON.stringify({
            error: "Оплата по данной сессии еще не завершена",
            payment_status: stripeSession.payment_status,
          }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      let newKey = generateAccessKey();
      for (let attempt = 0; attempt < 5; attempt++) {
        const collision = await kv.get(newKey);
        if (collision === null || collision === undefined) break;
        newKey = generateAccessKey();
      }

      await kv.put(
        newKey,
        JSON.stringify({
          remaining: PACKAGE_REQUESTS_LIMIT,
          initialLimit: PACKAGE_REQUESTS_LIMIT,
          devices: [],
          carryoverApplied: false,
        })
      );

      await kv.put(sessionKvKey, newKey);

      return new Response(
        JSON.stringify({ key: newKey }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

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
        carryoverRequests:
          typeof requestData.carryoverRequests === "number"
            ? requestData.carryoverRequests
            : 0,
        previousAccessKey:
          typeof requestData.previousAccessKey === "string"
            ? requestData.previousAccessKey
            : "",
        isExplicitVerify: true,
      });

      if (!verification.ok) {
        return new Response(
          JSON.stringify({
            valid: false,
            error: verification.error,
            code: verification.code,
            remainingRequests: verification.remainingRequests ?? undefined,
            packageLimit: verification.packageLimit ?? undefined,
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
          packageLimit: verification.packageLimit,
          carryoverAdded: verification.carryoverAdded || 0,
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
        carryoverRequests:
          typeof requestData.carryoverRequests === "number"
            ? requestData.carryoverRequests
            : 0,
        previousAccessKey:
          typeof requestData.previousAccessKey === "string"
            ? requestData.previousAccessKey
            : "",
        isExplicitVerify: false,
      });

      if (!keyContext.ok) {
        return new Response(
          JSON.stringify({
            error: keyContext.error,
            code: keyContext.code,
            remainingRequests: keyContext.remainingRequests ?? undefined,
            packageLimit: keyContext.packageLimit ?? undefined,
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

    const FALLBACK_MODELS = [
      "gemini-3.5-flash-lite",
      "gemini-3.1-flash-lite",
      "gemini-2.5-flash-lite",
      "gemini-2.0-flash-lite",
    ];

    const geminiPayload = {
      contents: requestData.contents,
      ...(requestData.generationConfig
        ? { generationConfig: requestData.generationConfig }
        : {}),
    };

    let result = null;
    let hasValidCandidate = false;
    let usedModel = "";

    for (const modelName of FALLBACK_MODELS) {
      const googleUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
      try {
        const geminiResponse = await fetch(googleUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(geminiPayload),
        });

        const candidateResult = await geminiResponse.json().catch(() => null);

        if (
          geminiResponse.status === 200 &&
          candidateResult &&
          !candidateResult.error &&
          candidateResult.candidates &&
          candidateResult.candidates[0]?.content?.parts?.[0]?.text
        ) {
          result = candidateResult;
          hasValidCandidate = true;
          usedModel = modelName;
          break;
        }
      } catch (modelErr) {
        console.warn(`Pages Function model ${modelName} failed, trying next fallback:`, modelErr);
      }
    }

    if (!hasValidCandidate || !result) {
      if (recordedRateLimit) rollbackLastRateLimitTimestamp(clientRateKey);
      return new Response(
        JSON.stringify({
          error:
            "Все модели ИИ сейчас перегружены (Gemini 3.5 Flash Lite → Gemini 3.1 Flash Lite → Gemini 2.5 Flash Lite → Gemini 2.0 Flash Lite). Запрос не был списан, пожалуйста, попробуйте чуть позже.",
          code: "ALL_MODELS_OVERLOADED",
        }),
        {
          status: 503,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    result.usedModel = usedModel;

    let updatedRemaining = null;
    let updatedPackageLimit = null;
    let storageMode = keyContext ? keyContext.storageMode : "starter";

    if (keyContext && !isMaster && keyContext.kv && keyContext.record) {
      try {
        keyContext.record.remaining = Math.max(
          0,
          keyContext.record.remaining - 1
        );
        updatedRemaining = keyContext.record.remaining;
        updatedPackageLimit = Math.max(
          keyContext.record.initialLimit || PACKAGE_REQUESTS_LIMIT,
          updatedRemaining
        );
        await keyContext.kv.put(
          keyContext.storageKey,
          JSON.stringify({
            remaining: keyContext.record.remaining,
            initialLimit: updatedPackageLimit,
            devices: keyContext.record.devices,
            carryoverApplied: Boolean(keyContext.record.carryoverApplied),
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
    if (typeof updatedPackageLimit === "number") {
      result.packageLimit = updatedPackageLimit;
    }

    result._quota = {
      isMaster,
      remainingRequests: updatedRemaining,
      packageLimit: updatedPackageLimit,
      carryoverAdded: keyContext?.carryoverAdded || 0,
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
