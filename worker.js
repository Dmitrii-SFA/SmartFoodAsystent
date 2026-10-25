const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-access-token, x-access-key, x-device-id",
  "Access-Control-Expose-Headers": "x-remaining-requests, x-is-master, x-storage-mode",
};

const PACKAGE_REQUESTS_LIMIT = 500;
const MAX_DEVICES_PER_KEY = 2;
const MIN_REQUEST_INTERVAL_MS = 9500; // ~10s anti-double-click protection (with 500ms network tolerance)
const MAX_REQUESTS_PER_MINUTE = 3;

// Fallback in-memory stores when Cloudflare KV (env.USERS_KV) is temporarily not bound
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
  if (!env || typeof env !== "object") return null;
  const candidate =
    env.USERS_KV ||
    env.KEYS_KV ||
    env.QUOTA_KV ||
    env.AI_QUOTA_KV ||
    env.KV ||
    null;
  if (
    candidate &&
    typeof candidate.get === "function" &&
    typeof candidate.put === "function"
  ) {
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
        message: `Пожалуйста, подождите ${waitSeconds} сек. перед следующим запросом (защита от двойного нажатия: пауза 10 сек).`,
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

  // 1. Мастер-ключ из env.MASTER_KEY проверяется в первую очередь
  // и даёт полный обход любых лимитов, привязок устройств и списаний.
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

  // 2. Проверка ключа по списку разрешённых базовых ключей (env.ALLOWED_KEYS)
  const allowedKeysRaw =
    typeof env?.ALLOWED_KEYS === "string" ? env.ALLOWED_KEYS : "";
  const allowedKeys = parseAllowedKeys(allowedKeysRaw);
  const isInAllowedKeys = allowedKeys.includes(cleanKey);

  const kv = getKvNamespace(env);

  // Если ключ не входит в ALLOWED_KEYS (и на сервере настроены ALLOWED_KEYS или MASTER_KEY),
  // проверяем, нет ли его уже в USERS_KV; если нет — отклоняем как неверный ключ.
  if (!isInAllowedKeys && (allowedKeys.length > 0 || Boolean(masterKey))) {
    let existsInKv = false;
    if (kv && cleanKey) {
      try {
        const existingRecord =
          (await kv.get(cleanKey, "json")) ||
          (await kv.get(`key_v1:${cleanKey}`, "json"));
        if (existingRecord && typeof existingRecord === "object") {
          existsInKv = true;
        }
      } catch {
        // Игнорируем ошибку чтения KV при проверке
      }
    }

    if (!existsInKv) {
      return {
        ok: false,
        status: 403,
        code: "INVALID_KEY",
        error:
          "Неверный ключ активации. Проверьте правильность введённого ключа.",
      };
    }
  }

  // 3. Работа с серверным хранилищем env.USERS_KV (динамический учёт 500 запросов и привязка до 2 устройств)
  if (kv) {
    try {
      let storageKey = cleanKey;
      let record = await kv.get(storageKey, "json");

      // Поддержка записей со старым префиксом key_v1:, если они уже были созданы
      if (!record || typeof record !== "object") {
        const legacyRecord = await kv.get(`key_v1:${cleanKey}`, "json");
        if (legacyRecord && typeof legacyRecord === "object") {
          record = legacyRecord;
        }
      }

      let needsSave = false;

      if (!record || typeof record !== "object") {
        record = {
          remaining: PACKAGE_REQUESTS_LIMIT,
          total: PACKAGE_REQUESTS_LIMIT,
          used: 0,
          devices: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        needsSave = true;
      }

      if (!Array.isArray(record.devices)) {
        record.devices = [];
        needsSave = true;
      }

      if (
        typeof record.remaining !== "number" ||
        Number.isNaN(record.remaining)
      ) {
        record.remaining = PACKAGE_REQUESTS_LIMIT;
        needsSave = true;
      }

      // Привязка устройства (максимум 2 устройства на 1 ключ)
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
            record.updatedAt = Date.now();
            needsSave = true;
          }
        }
      }

      // Сохраняем запись в env.USERS_KV при первой активации пакета 500 запросов или привязке нового устройства
      if (needsSave && registerDevice) {
        await kv.put(storageKey, JSON.stringify(record));
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
      // Если KV-хранилище временно выдало ошибку, код не падает
      console.warn(
        "USERS_KV access error, falling back to in-memory/client balance tracking:",
        kvErr
      );
    }
  }

  // 4. Fallback, если env.USERS_KV временно не настроено:
  // проверка по MASTER_KEY и ALLOWED_KEYS уже выполнена выше, код не падает
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
          kvBound: Boolean(getKvNamespace(env)),
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Перехватываем все POST-запросы к ИИ и проверке ключей (на /api, /api/* или корень)
    if (
      request.method === "POST" ||
      pathname === "/api" ||
      pathname.startsWith("/api/")
    ) {
      let clientRateKey = "";
      let recordedRateLimit = false;

      try {
        const requestData = await request.json();
        const headerKey =
          request.headers.get("x-access-token") ||
          request.headers.get("x-access-key") ||
          "";
        const headerDevice = request.headers.get("x-device-id") || "";
        const accessKey = (headerKey || requestData.accessKey || "").trim();
        const deviceId = (headerDevice || requestData.deviceId || "").trim();
        const clientIp = request.headers.get("cf-connecting-ip") || "anon";

        // 1. Проверка и активация ключа без вызова ИИ (action === "verify_key")
        if (
          requestData.action === "verify_key" ||
          pathname === "/api/verify-key"
        ) {
          if (!accessKey) {
            return new Response(
              JSON.stringify({
                valid: false,
                error: "Введите ключ активации",
                code: "EMPTY_KEY",
              }),
              {
                status: 400,
                headers: {
                  ...corsHeaders,
                  "Content-Type": "application/json",
                },
              }
            );
          }

          const verification = await verifyAndLoadKeyState({
            accessKey,
            deviceId,
            env,
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
                headers: {
                  ...corsHeaders,
                  "Content-Type": "application/json",
                },
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

        // 2. Если пользователь передал ключ доступа — проверяем MASTER_KEY, ALLOWED_KEYS, привязку устройств и баланс в USERS_KV
        let keyContext = null;
        if (accessKey) {
          keyContext = await verifyAndLoadKeyState({
            accessKey,
            deviceId,
            env,
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
                headers: {
                  ...corsHeaders,
                  "Content-Type": "application/json",
                },
              }
            );
          }
        }

        const isMaster = Boolean(keyContext && keyContext.isMaster);

        // 3. Проверка минутного лимита (3 запроса/мин) и защиты от двойного нажатия (10 сек)
        // Для владельца с env.MASTER_KEY любые лимиты полностью отключены
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
                headers: {
                  ...corsHeaders,
                  "Content-Type": "application/json",
                },
              }
            );
          }
          recordedRateLimit = true;
        }

        // 4. Запрос к Google Gemini через env.GEMINI_API_KEY
        const apiKey = env?.GEMINI_API_KEY;
        if (!apiKey) {
          if (recordedRateLimit) rollbackLastRateLimitTimestamp(clientRateKey);
          return new Response(
            JSON.stringify({
              error: "GEMINI_API_KEY не найден в настройках воркера (env.GEMINI_API_KEY)",
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

        // Проверяем, что ответ от Gemini успешный (статус 200) и содержит корректный текст
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

        // 5. При успешном ответе от Gemini (статус 200) списываем 1 запрос с баланса ключа в env.USERS_KV
        // и возвращаем актуальный остаток на клиент
        let updatedRemaining = null;
        let storageMode = keyContext ? keyContext.storageMode : "starter";

        if (keyContext && !isMaster && keyContext.kv && keyContext.record) {
          try {
            keyContext.record.remaining = Math.max(
              0,
              keyContext.record.remaining - 1
            );
            keyContext.record.used = Math.max(
              0,
              PACKAGE_REQUESTS_LIMIT - keyContext.record.remaining
            );
            keyContext.record.updatedAt = Date.now();
            updatedRemaining = keyContext.record.remaining;
            await keyContext.kv.put(
              keyContext.storageKey,
              JSON.stringify(keyContext.record)
            );
          } catch (kvWriteErr) {
            console.warn("USERS_KV write error on decrement:", kvWriteErr);
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
