import { MetricConfig, UserConfig } from '../types/config';

export const CLOUDFLARE_WORKER_URL = 'https://api.smartfoodasystent.workers.dev/api';

// ============================================================================
// ССЫЛКА НА ОПЛАТУ ДОПОЛНИТЕЛЬНОГО ПАКЕТА НА 500 ИИ-ЗАПРОСОВ (BLIK И КАРТЫ)
// Замените этот URL-заглушку на вашу реальную платежную ссылку (Stripe, Przelewy24, HotPay и т.д.)
// ============================================================================
export const PAYMENT_PACKAGE_500_URL = 'https://buy.stripe.com/test_placeholder_500_requests';
export const STRIPE_PAYMENT_URL = PAYMENT_PACKAGE_500_URL;

export const ACCESS_KEY_STORAGE_KEY = 'app_access_key';
const DEVICE_ID_STORAGE_KEY = 'sfa_device_id_v1';
const STARTER_REMAINING_STORAGE_KEY = 'sfa_starter_remaining_v1';
const KEY_BALANCES_STORAGE_KEY = 'sfa_key_balances_v1';
const KEY_LIMITS_STORAGE_KEY = 'sfa_key_limits_v1';
const MASTER_KEY_FLAG_STORAGE_KEY = 'sfa_is_master_key_v1';
const RECENT_TIMESTAMPS_STORAGE_KEY = 'sfa_recent_ai_timestamps_v1';

// Лимиты пакетов и защита от спама / двойного нажатия
export const STARTER_FREE_REQUESTS = 100; // 100 бесплатных запросов каждому новому пользователю
export const PAID_PACKAGE_REQUESTS = 500; // 500 запросов в платном пакете без срока действия
export const MAX_DEVICES_PER_KEY = 2; // максимум 2 устройства на один ключ
export const MIN_REQUEST_INTERVAL_MS = 10_000; // пауза 10 секунд между запросами
export const MAX_REQUESTS_PER_MINUTE = 3; // не более 3 запросов в минуту

// Константы для обратной совместимости импортов
export const TRIAL_DAILY_LIMIT = STARTER_FREE_REQUESTS;
export const PRO_DAILY_LIMIT = PAID_PACKAGE_REQUESTS;

export interface QuotaCheckResult {
  allowed: boolean;
  reason?: 'daily_limit_reached' | 'quota_exhausted' | 'cooldown';
  waitSeconds?: number;
  remainingRequests: number;
  packageLimit: number;
  usedRequests: number;
  hasAccessKey: boolean;
  isMasterKey: boolean;
  isKeyExhausted: boolean;
  // Поля обратной совместимости
  usedToday: number;
  dailyLimit: number;
}

export interface KeyVerificationResult {
  valid: boolean;
  isMaster?: boolean;
  remainingRequests?: number | null;
  packageLimit?: number | null;
  carryoverAdded?: number;
  storageMode?: 'server' | 'client_fallback';
  devicesUsed?: number;
  maxDevices?: number | null;
  error?: string;
  code?: string;
}

function notifyQuotaUpdated(): void {
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent('sfa-quota-updated'));
    } catch {
      // ignore
    }
  }
}

/**
 * Генерирует и сохраняет уникальный идентификатор браузера/телефона (deviceId)
 * для привязки ключа максимум к 2 устройствам.
 */
export function getOrCreateDeviceId(): string {
  try {
    const existing = localStorage.getItem(DEVICE_ID_STORAGE_KEY);
    if (existing && existing.trim().length >= 8) {
      return existing.trim();
    }
    const randomPart =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 12)}`;
    const newId = `dev_${randomPart}`;
    localStorage.setItem(DEVICE_ID_STORAGE_KEY, newId);
    return newId;
  } catch {
    return 'dev_fallback_browser';
  }
}

export function getSavedAccessKey(): string {
  try {
    return (localStorage.getItem(ACCESS_KEY_STORAGE_KEY) || '').trim();
  } catch {
    return '';
  }
}

export function isMasterAccessKeyActive(): boolean {
  try {
    return localStorage.getItem(MASTER_KEY_FLAG_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setMasterAccessKeyActive(isMaster: boolean): void {
  try {
    if (isMaster) {
      localStorage.setItem(MASTER_KEY_FLAG_STORAGE_KEY, 'true');
    } else {
      localStorage.removeItem(MASTER_KEY_FLAG_STORAGE_KEY);
    }
  } catch {
    // ignore
  }
}

function loadKeyBalancesMap(): Record<string, number> {
  try {
    const raw = localStorage.getItem(KEY_BALANCES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return {};
}

function saveKeyBalancesMap(map: Record<string, number>): void {
  try {
    localStorage.setItem(KEY_BALANCES_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

function loadKeyLimitsMap(): Record<string, number> {
  try {
    const raw = localStorage.getItem(KEY_LIMITS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return {};
}

function saveKeyLimitsMap(map: Record<string, number>): void {
  try {
    localStorage.setItem(KEY_LIMITS_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

export function getKeyPackageLimit(key: string): number {
  const clean = (key || '').trim();
  if (!clean) return PAID_PACKAGE_REQUESTS;
  const map = loadKeyLimitsMap();
  const rem = getKeyRemainingBalance(clean);
  if (typeof map[clean] === 'number' && !Number.isNaN(map[clean]) && map[clean] > 0) {
    return Math.max(PAID_PACKAGE_REQUESTS, Math.floor(map[clean]), rem);
  }
  const initial = Math.max(PAID_PACKAGE_REQUESTS, rem);
  map[clean] = initial;
  saveKeyLimitsMap(map);
  return initial;
}

export function setKeyPackageLimit(key: string, limit: number): void {
  const clean = (key || '').trim();
  if (!clean) return;
  const map = loadKeyLimitsMap();
  map[clean] = Math.max(PAID_PACKAGE_REQUESTS, Math.floor(Number(limit) || PAID_PACKAGE_REQUESTS));
  saveKeyLimitsMap(map);
}

export function getKeyRemainingBalance(key: string): number {
  const clean = (key || '').trim();
  if (!clean) return 0;
  const map = loadKeyBalancesMap();
  if (typeof map[clean] === 'number' && !Number.isNaN(map[clean])) {
    return Math.max(0, Math.floor(map[clean]));
  }
  // Для нового активированного ключа по умолчанию начисляется 500 запросов
  map[clean] = PAID_PACKAGE_REQUESTS;
  saveKeyBalancesMap(map);
  return PAID_PACKAGE_REQUESTS;
}

export function setKeyRemainingBalance(key: string, remaining: number): void {
  const clean = (key || '').trim();
  if (!clean) return;
  const normalized = Math.max(0, Math.floor(Number(remaining) || 0));
  const map = loadKeyBalancesMap();
  map[clean] = normalized;
  saveKeyBalancesMap(map);

  // Если баланс превышает текущий сохранённый лимит пакета (например, 533 из-за переноса остатка), обновляем лимит пакета
  const limitsMap = loadKeyLimitsMap();
  const currentLimit = limitsMap[clean] || PAID_PACKAGE_REQUESTS;
  if (normalized > currentLimit) {
    limitsMap[clean] = normalized;
    saveKeyLimitsMap(limitsMap);
  }

  notifyQuotaUpdated();
}

export function decrementKeyRemainingBalance(key: string): number {
  const clean = (key || '').trim();
  if (!clean) return 0;
  const current = getKeyRemainingBalance(clean);
  const next = Math.max(0, current - 1);
  setKeyRemainingBalance(clean, next);
  return next;
}

/**
 * Остаток стартового пакета (100 бесплатных запросов каждому новому пользователю)
 */
export function getStarterRemainingRequests(): number {
  try {
    const raw = localStorage.getItem(STARTER_REMAINING_STORAGE_KEY);
    if (raw === null || raw === undefined || raw === '') {
      localStorage.setItem(STARTER_REMAINING_STORAGE_KEY, String(STARTER_FREE_REQUESTS));
      return STARTER_FREE_REQUESTS;
    }
    const parsed = Number(raw);
    if (Number.isNaN(parsed)) {
      localStorage.setItem(STARTER_REMAINING_STORAGE_KEY, String(STARTER_FREE_REQUESTS));
      return STARTER_FREE_REQUESTS;
    }
    return Math.max(0, Math.min(STARTER_FREE_REQUESTS, Math.floor(parsed)));
  } catch {
    return STARTER_FREE_REQUESTS;
  }
}

export function setStarterRemainingRequests(remaining: number): void {
  const normalized = Math.max(0, Math.min(STARTER_FREE_REQUESTS, Math.floor(Number(remaining) || 0)));
  try {
    localStorage.setItem(STARTER_REMAINING_STORAGE_KEY, String(normalized));
  } catch (e) {
    console.error('Failed to set starter remaining requests:', e);
  }
  notifyQuotaUpdated();
}

export function decrementStarterRemainingRequests(): number {
  const current = getStarterRemainingRequests();
  const next = Math.max(0, current - 1);
  setStarterRemainingRequests(next);
  return next;
}

export function saveAccessKey(key: string): void {
  try {
    const cleaned = (key || '').trim();
    const prevKey = getSavedAccessKey();
    if (cleaned) {
      localStorage.setItem(ACCESS_KEY_STORAGE_KEY, cleaned);
      if (cleaned !== prevKey) {
        setMasterAccessKeyActive(false);
      }
      // Инициализируем локальный баланс 500 для нового ключа, если его еще нет
      getKeyRemainingBalance(cleaned);
    } else {
      localStorage.removeItem(ACCESS_KEY_STORAGE_KEY);
      setMasterAccessKeyActive(false);
    }
    notifyQuotaUpdated();
  } catch (e) {
    console.error('Failed to save access key:', e);
  }
}

/**
 * Автоматическое считывание ключа из URL (?key=...)
 */
export function checkAndActivateUrlAccessKey(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const url = new URL(window.location.href);
    const keyParam = url.searchParams.get('key');
    if (keyParam && keyParam.trim().length > 0) {
      const cleanKey = keyParam.trim();
      saveAccessKey(cleanKey);
      url.searchParams.delete('key');
      const nextSearch = url.searchParams.toString();
      const cleanUrl =
        url.pathname + (nextSearch ? `?${nextSearch}` : '') + (url.hash || '');
      window.history.replaceState({}, document.title, cleanUrl);
      return cleanKey;
    }
  } catch (e) {
    console.warn('Error checking URL access key:', e);
  }
  return null;
}

/**
 * Серверная проверка ключа (валидность по списку разрешенных, привязка к максимум 2 устройствам,
 * суммирование неизрасходованного остатка с 500 запросами нового ключа, мастер-ключ)
 */
export async function verifyAndActivateAccessKey(rawKey: string): Promise<KeyVerificationResult> {
  const cleanKey = (rawKey || '').trim();
  if (!cleanKey) {
    return {
      valid: false,
      error: 'Пожалуйста, введите ключ активации.',
      code: 'EMPTY_KEY',
    };
  }

  const deviceId = getOrCreateDeviceId();
  const previousAccessKey = getSavedAccessKey();
  const isSameKey =
    previousAccessKey.length > 0 &&
    previousAccessKey.toLowerCase() === cleanKey.toLowerCase();
  const wasMaster = isMasterAccessKeyActive();
  const existingBalances = loadKeyBalancesMap();
  const isBrandNewKeyLocally = typeof existingBalances[cleanKey] !== 'number';

  // Вычисляем текущий неизрасходованный остаток пользователя (со старого ключа или со стартового пакета),
  // чтобы при первой активации нового ключа он прибавился к 500 запросам (например, 500 + 33 = 533).
  const currentCarryover =
    !isSameKey && !wasMaster
      ? previousAccessKey
        ? getKeyRemainingBalance(previousAccessKey)
        : getStarterRemainingRequests()
      : 0;

  const applyLocalCarryoverCleanup = () => {
    if (!isSameKey && !wasMaster && currentCarryover > 0) {
      if (previousAccessKey) {
        setKeyRemainingBalance(previousAccessKey, 0);
      } else {
        setStarterRemainingRequests(0);
      }
    }
  };

  const candidateUrls: string[] = [
    '/api',
    CLOUDFLARE_WORKER_URL,
    'https://api.smartfoodasystent.workers.dev/',
  ];
  const uniqueUrls = Array.from(new Set(candidateUrls));

  const requestBody = {
    action: 'verify_key',
    accessKey: cleanKey,
    deviceId,
    carryoverRequests: currentCarryover,
    previousAccessKey: !isSameKey ? previousAccessKey : '',
  };

  for (let i = 0; i < uniqueUrls.length; i++) {
    const endpoint = uniqueUrls[i];
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-access-token': cleanKey,
          'x-device-id': deviceId,
        },
        body: JSON.stringify(requestBody),
      });

      if ((res.status === 404 || res.status === 405) && i < uniqueUrls.length - 1) {
        continue;
      }

      const data = await res.json().catch(() => ({}));

      // Если сервер явно ответил об ошибке ключа / лимите устройств / исчерпанном балансе
      if (res.status === 401 || res.status === 402 || res.status === 403 || data?.valid === false) {
        const errCode = data?.code || (res.status === 402 ? 'KEY_EXHAUSTED' : 'INVALID_KEY');
        if (errCode === 'KEY_EXHAUSTED') {
          setKeyRemainingBalance(cleanKey, 0);
        }
        return {
          valid: false,
          code: errCode,
          error:
            data?.error ||
            data?.message ||
            'Не удалось активировать ключ. Проверьте код или лимит устройств.',
          remainingRequests: typeof data?.remainingRequests === 'number' ? data.remainingRequests : undefined,
          packageLimit: typeof data?.packageLimit === 'number' ? data.packageLimit : undefined,
        };
      }

      // Если сервер успешно подтвердил ключ
      if (res.ok && data?.valid === true) {
        const isMaster = Boolean(data.isMaster);
        let carryoverAdded =
          typeof data.carryoverAdded === 'number' && data.carryoverAdded > 0
            ? data.carryoverAdded
            : 0;

        if (!isMaster && typeof data.remainingRequests === 'number') {
          setKeyRemainingBalance(cleanKey, data.remainingRequests);
          const resolvedLimit =
            typeof data.packageLimit === 'number' && data.packageLimit > 0
              ? Math.max(data.packageLimit, data.remainingRequests)
              : Math.max(PAID_PACKAGE_REQUESTS, data.remainingRequests);
          setKeyPackageLimit(cleanKey, resolvedLimit);
          applyLocalCarryoverCleanup();
        } else if (!isMaster) {
          if (isBrandNewKeyLocally && currentCarryover > 0) {
            const combined = PAID_PACKAGE_REQUESTS + currentCarryover;
            setKeyRemainingBalance(cleanKey, combined);
            setKeyPackageLimit(cleanKey, combined);
            carryoverAdded = currentCarryover;
            applyLocalCarryoverCleanup();
          } else {
            getKeyRemainingBalance(cleanKey);
          }
        }

        saveAccessKey(cleanKey);
        setMasterAccessKeyActive(isMaster);
        notifyQuotaUpdated();

        return {
          valid: true,
          isMaster,
          remainingRequests: isMaster ? null : getKeyRemainingBalance(cleanKey),
          packageLimit: isMaster ? null : getKeyPackageLimit(cleanKey),
          carryoverAdded,
          storageMode: data.storageMode || 'client_fallback',
          devicesUsed: data.devicesUsed,
          maxDevices: data.maxDevices ?? MAX_DEVICES_PER_KEY,
        };
      }

      // Fallback: если удаленный воркер еще не обновлен и не знает про action="verify_key"
      let fallbackCarryoverAdded = 0;
      if (isBrandNewKeyLocally && currentCarryover > 0) {
        const combined = PAID_PACKAGE_REQUESTS + currentCarryover;
        setKeyRemainingBalance(cleanKey, combined);
        setKeyPackageLimit(cleanKey, combined);
        fallbackCarryoverAdded = currentCarryover;
        applyLocalCarryoverCleanup();
      }
      saveAccessKey(cleanKey);
      return {
        valid: true,
        isMaster: false,
        remainingRequests: getKeyRemainingBalance(cleanKey),
        packageLimit: getKeyPackageLimit(cleanKey),
        carryoverAdded: fallbackCarryoverAdded,
        storageMode: 'client_fallback',
      };
    } catch {
      if (i === uniqueUrls.length - 1) {
        // При временной недоступности сети сохраняем ключ в клиентский fallback с учётом остатка
        let fallbackCarryoverAdded = 0;
        if (isBrandNewKeyLocally && currentCarryover > 0) {
          const combined = PAID_PACKAGE_REQUESTS + currentCarryover;
          setKeyRemainingBalance(cleanKey, combined);
          setKeyPackageLimit(cleanKey, combined);
          fallbackCarryoverAdded = currentCarryover;
          applyLocalCarryoverCleanup();
        }
        saveAccessKey(cleanKey);
        return {
          valid: true,
          isMaster: false,
          remainingRequests: getKeyRemainingBalance(cleanKey),
          packageLimit: getKeyPackageLimit(cleanKey),
          carryoverAdded: fallbackCarryoverAdded,
          storageMode: 'client_fallback',
        };
      }
    }
  }

  let fallbackCarryoverAdded = 0;
  if (isBrandNewKeyLocally && currentCarryover > 0) {
    const combined = PAID_PACKAGE_REQUESTS + currentCarryover;
    setKeyRemainingBalance(cleanKey, combined);
    setKeyPackageLimit(cleanKey, combined);
    fallbackCarryoverAdded = currentCarryover;
    applyLocalCarryoverCleanup();
  }
  saveAccessKey(cleanKey);
  return {
    valid: true,
    isMaster: false,
    remainingRequests: getKeyRemainingBalance(cleanKey),
    packageLimit: getKeyPackageLimit(cleanKey),
    carryoverAdded: fallbackCarryoverAdded,
    storageMode: 'client_fallback',
  };
}

function getRecentRequestTimestamps(): number[] {
  const now = Date.now();
  try {
    const raw = localStorage.getItem(RECENT_TIMESTAMPS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed
          .map((t) => Number(t) || 0)
          .filter((t) => t > 0 && now - t < 60_000);
      }
    }
  } catch {
    // ignore
  }
  return [];
}

function recordRequestTimestamp(): void {
  const now = Date.now();
  const recent = getRecentRequestTimestamps();
  recent.push(now);
  try {
    localStorage.setItem(RECENT_TIMESTAMPS_STORAGE_KEY, JSON.stringify(recent));
  } catch {
    // ignore
  }
}

function rollbackLastRequestTimestamp(): void {
  try {
    const recent = getRecentRequestTimestamps();
    if (recent.length > 0) {
      recent.pop();
      localStorage.setItem(RECENT_TIMESTAMPS_STORAGE_KEY, JSON.stringify(recent));
    }
  } catch {
    // ignore
  }
}

export function getQuotaStatus(): {
  hasAccessKey: boolean;
  accessKey: string;
  isMasterKey: boolean;
  remainingRequests: number;
  packageLimit: number;
  usedRequests: number;
  starterRemaining: number;
  keyRemaining: number | null;
  isKeyExhausted: boolean;
  deviceId: string;
  // Поля обратной совместимости
  usedToday: number;
  dailyLimit: number;
  remainingToday: number;
} {
  const accessKey = getSavedAccessKey();
  const hasAccessKey = accessKey.length > 0;
  const isMasterKey = hasAccessKey && isMasterAccessKeyActive();
  const starterRemaining = getStarterRemainingRequests();
  const deviceId = getOrCreateDeviceId();

  if (isMasterKey) {
    return {
      hasAccessKey: true,
      accessKey,
      isMasterKey: true,
      remainingRequests: 999999,
      packageLimit: PAID_PACKAGE_REQUESTS,
      usedRequests: 0,
      starterRemaining,
      keyRemaining: 999999,
      isKeyExhausted: false,
      deviceId,
      usedToday: 0,
      dailyLimit: PAID_PACKAGE_REQUESTS,
      remainingToday: 999999,
    };
  }

  if (hasAccessKey) {
    const keyRemaining = getKeyRemainingBalance(accessKey);
    const keyLimit = Math.max(getKeyPackageLimit(accessKey), keyRemaining);
    const usedRequests = Math.max(0, keyLimit - keyRemaining);
    const isKeyExhausted = keyRemaining <= 0;
    return {
      hasAccessKey: true,
      accessKey,
      isMasterKey: false,
      remainingRequests: keyRemaining,
      packageLimit: keyLimit,
      usedRequests,
      starterRemaining,
      keyRemaining,
      isKeyExhausted,
      deviceId,
      usedToday: usedRequests,
      dailyLimit: keyLimit,
      remainingToday: keyRemaining,
    };
  }

  const usedStarter = Math.max(0, STARTER_FREE_REQUESTS - starterRemaining);
  return {
    hasAccessKey: false,
    accessKey: '',
    isMasterKey: false,
    remainingRequests: starterRemaining,
    packageLimit: STARTER_FREE_REQUESTS,
    usedRequests: usedStarter,
    starterRemaining,
    keyRemaining: null,
    isKeyExhausted: false,
    deviceId,
    usedToday: usedStarter,
    dailyLimit: STARTER_FREE_REQUESTS,
    remainingToday: starterRemaining,
  };
}

// Функции обратной совместимости
export function getDailyUsageCount(): number {
  return getQuotaStatus().usedRequests;
}

export function incrementDailyUsageCount(): number {
  const status = getQuotaStatus();
  if (status.isMasterKey) return 0;
  if (status.hasAccessKey) {
    const rem = decrementKeyRemainingBalance(status.accessKey);
    const limit = getKeyPackageLimit(status.accessKey);
    return Math.max(0, limit - rem);
  }
  const rem = decrementStarterRemainingRequests();
  return Math.max(0, STARTER_FREE_REQUESTS - rem);
}

/**
 * Проверяет доступность запроса к ИИ:
 * 1) Мастер-ключ владельца — безлимит и без ограничений.
 * 2) Наличие доступных запросов в пакете (100 стартовых или 500 по ключу).
 * 3) Пауза 10 секунд между запросами (защита от случайного двойного нажатия) и лимит 3 запроса в минуту.
 */
export function checkAiRequestAllowance(): QuotaCheckResult {
  const {
    hasAccessKey,
    isMasterKey,
    remainingRequests,
    packageLimit,
    usedRequests,
    isKeyExhausted,
  } = getQuotaStatus();

  if (isMasterKey) {
    return {
      allowed: true,
      remainingRequests,
      packageLimit,
      usedRequests: 0,
      hasAccessKey: true,
      isMasterKey: true,
      isKeyExhausted: false,
      usedToday: 0,
      dailyLimit: packageLimit,
    };
  }

  // 1. Проверяем остаток запросов в пакете
  if (remainingRequests <= 0) {
    return {
      allowed: false,
      reason: 'daily_limit_reached',
      remainingRequests: 0,
      packageLimit,
      usedRequests,
      hasAccessKey,
      isMasterKey: false,
      isKeyExhausted,
      usedToday: usedRequests,
      dailyLimit: packageLimit,
    };
  }

  // 2. Проверяем паузу 10 сек (защита от двойного нажатия) и минутный лимит (3 запроса в минуту)
  const now = Date.now();
  const recent = getRecentRequestTimestamps();

  if (recent.length > 0) {
    const lastRequestAt = recent[recent.length - 1];
    const elapsedMs = now - lastRequestAt;
    if (elapsedMs < MIN_REQUEST_INTERVAL_MS) {
      const waitSeconds = Math.max(1, Math.ceil((MIN_REQUEST_INTERVAL_MS - elapsedMs) / 1000));
      return {
        allowed: false,
        reason: 'cooldown',
        waitSeconds,
        remainingRequests,
        packageLimit,
        usedRequests,
        hasAccessKey,
        isMasterKey: false,
        isKeyExhausted: false,
        usedToday: usedRequests,
        dailyLimit: packageLimit,
      };
    }
  }

  if (recent.length >= MAX_REQUESTS_PER_MINUTE) {
    const oldestInWindow = recent[0];
    const waitSeconds = Math.max(1, Math.ceil((60_000 - (now - oldestInWindow)) / 1000));
    return {
      allowed: false,
      reason: 'cooldown',
      waitSeconds,
      remainingRequests,
      packageLimit,
      usedRequests,
      hasAccessKey,
      isMasterKey: false,
      isKeyExhausted: false,
      usedToday: usedRequests,
      dailyLimit: packageLimit,
    };
  }

  return {
    allowed: true,
    remainingRequests,
    packageLimit,
    usedRequests,
    hasAccessKey,
    isMasterKey: false,
    isKeyExhausted: false,
    usedToday: usedRequests,
    dailyLimit: packageLimit,
  };
}

export class AiQuotaError extends Error {
  reason: 'daily_limit_reached' | 'quota_exhausted' | 'cooldown';
  code: string;
  waitSeconds?: number;

  constructor(
    reason: 'daily_limit_reached' | 'quota_exhausted' | 'cooldown',
    message: string,
    waitSeconds?: number
  ) {
    super(message);
    this.name = 'AiQuotaError';
    this.reason = reason;
    this.code = reason === 'cooldown' ? 'COOLDOWN' : 'LIMIT_REACHED';
    this.waitSeconds = waitSeconds;
  }
}

export function extractJsonFromText(raw: string): any {
  let cleaned = (raw || '').trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/i, '').replace(/\s*```$/i, '');
  }
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }
  return JSON.parse(cleaned);
}

/**
 * Отправляет запрос к ИИ через Cloudflare Worker / серверный прокси.
 * - Передает ключ доступа (x-access-token) и идентификатор устройства (x-device-id).
 * - Уменьшает счетчик запросов на 1 ТОЛЬКО после получения успешного и корректного JSON-ответа от нейросети.
 * - При ошибках сети или сервера запросы НЕ списываются.
 */
export async function callCloudflareWorkerAI(payload: {
  prompt: string;
  systemInstruction?: string;
  imageBase64?: string;
  mimeType?: string;
  action?: string;
  extraPayload?: Record<string, any>;
  onOpenPaywall?: () => void;
  onQuotaUsed?: (newUsedCount: number) => void;
}): Promise<any> {
  const check = checkAiRequestAllowance();
  if (!check.allowed) {
    if (check.reason === 'daily_limit_reached' || check.reason === 'quota_exhausted') {
      payload.onOpenPaywall?.();
      throw new AiQuotaError(
        'daily_limit_reached',
        check.hasAccessKey
          ? 'Лимит в 500 ИИ-запросов по вашему ключу исчерпан. Пожалуйста, приобретите новый пакет на 500 запросов или введите новый ключ активации.'
          : 'Стартовый пакет из 100 бесплатных ИИ-запросов исчерпан. Приобретите дополнительный пакет на 500 запросов или введите ключ активации.'
      );
    }
    throw new AiQuotaError(
      'cooldown',
      `Пожалуйста, подождите ${check.waitSeconds || 10} сек. перед следующим запросом (защита от двойного нажатия: пауза 10 сек, лимит 3 запроса в минуту).`,
      check.waitSeconds
    );
  }

  // Фиксируем метку времени для защиты от случайного двойного нажатия
  recordRequestTimestamp();

  const savedAccessKey = getSavedAccessKey();
  const deviceId = getOrCreateDeviceId();

  const fullTextPrompt = payload.systemInstruction
    ? `${payload.systemInstruction.trim()}\n\n${payload.prompt.trim()}`
    : payload.prompt.trim();

  const parts: any[] = [{ text: fullTextPrompt }];
  if (payload.imageBase64) {
    const match = payload.imageBase64.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
    const mimeType = payload.mimeType || (match ? match[1] : 'image/jpeg');
    const base64Data = match ? match[2] : payload.imageBase64;
    parts.push({
      inline_data: {
        mime_type: mimeType,
        data: base64Data,
      },
    });
  }

  const requestBody: Record<string, any> = {
    contents: [
      {
        role: 'user',
        parts,
      },
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.2,
    },
    accessKey: savedAccessKey || '',
    deviceId,
    action: payload.action || 'ai_request',
    ...(payload.extraPayload || {}),
  };

  const requestInit: RequestInit = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-access-token': savedAccessKey || '',
      'x-device-id': deviceId,
    },
    body: JSON.stringify(requestBody),
  };

  const candidateUrls: string[] = [
    '/api',
    CLOUDFLARE_WORKER_URL,
    'https://api.smartfoodasystent.workers.dev/',
  ];
  const uniqueUrls = Array.from(new Set(candidateUrls));

  let response: Response | null = null;
  let lastNetworkError: any = null;

  for (let i = 0; i < uniqueUrls.length; i++) {
    const endpoint = uniqueUrls[i];
    try {
      const res = await fetch(endpoint, requestInit);
      if ((res.status === 404 || res.status === 405) && i < uniqueUrls.length - 1) {
        continue;
      }
      response = res;
      break;
    } catch (netErr) {
      lastNetworkError = netErr;
      if (i === uniqueUrls.length - 1) {
        rollbackLastRequestTimestamp();
        throw netErr;
      }
    }
  }

  if (!response) {
    rollbackLastRequestTimestamp();
    throw lastNetworkError || new Error('Не удалось связаться с сервером ИИ');
  }

  if (
    response.status === 401 ||
    response.status === 402 ||
    response.status === 403 ||
    response.status === 429
  ) {
    let errText = '';
    let errCode = '';
    let errRemaining: number | undefined = undefined;
    let errWaitSeconds: number | undefined = undefined;

    try {
      const errJson = await response.json();
      errText = errJson?.error?.message || errJson?.error || errJson?.message || '';
      errCode = errJson?.code || '';
      if (typeof errJson?.remainingRequests === 'number') {
        errRemaining = errJson.remainingRequests;
      }
      if (typeof errJson?.waitSeconds === 'number') {
        errWaitSeconds = errJson.waitSeconds;
      }
    } catch {
      // ignore
    }

    // Если это минутный лимит (3 запроса в минуту) или пауза 10 секунд — НЕ открываем окно покупки
    if (response.status === 429 || errCode === 'COOLDOWN' || errCode === 'RATE_LIMIT') {
      throw new AiQuotaError(
        'cooldown',
        errText || 'Пожалуйста, подождите 10 секунд перед следующим запросом (лимит 3 запроса в минуту).',
        errWaitSeconds
      );
    }

    // При исчерпании 500 запросов по ключу синхронизируем баланс с нулем
    if (savedAccessKey && (errCode === 'KEY_EXHAUSTED' || errRemaining === 0)) {
      setKeyRemainingBalance(savedAccessKey, 0);
    }

    rollbackLastRequestTimestamp();
    payload.onOpenPaywall?.();
    throw new AiQuotaError(
      'daily_limit_reached',
      errText ||
        (savedAccessKey
          ? 'Лимит запросов по ключу исчерпан или превышен лимит устройств (максимум 2 устройства). Пожалуйста, введите новый ключ.'
          : 'Стартовый пакет из 100 бесплатных ИИ-запросов исчерпан. Приобретите пакет на 500 запросов или введите ключ активации.')
    );
  }

  if (!response.ok) {
    rollbackLastRequestTimestamp();
    let errMsg = `Ошибка сервера ИИ (${response.status})`;
    try {
      const errData = await response.json();
      errMsg = errData?.error?.message || errData?.error || errData?.message || errMsg;
    } catch {
      // ignore
    }
    throw new Error(errMsg);
  }

  let data: any;
  try {
    data = await response.json();
  } catch (parseErr) {
    rollbackLastRequestTimestamp();
    throw new Error('Получен некорректный ответ от сервера ИИ');
  }

  // Сначала проверяем и парсим ответ от нейросети (чтобы убедиться, что он успешный и корректный)
  let parsedResult: any = null;
  try {
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof candidateText === 'string' && candidateText.trim()) {
      parsedResult = extractJsonFromText(candidateText);
    } else if (typeof data?.text === 'string' && data.text.trim()) {
      parsedResult = extractJsonFromText(data.text);
    } else if (typeof data?.result === 'string' && data.result.trim()) {
      parsedResult = extractJsonFromText(data.result);
    } else if (typeof data?.choices?.[0]?.message?.content === 'string' && data.choices[0].message.content.trim()) {
      parsedResult = extractJsonFromText(data.choices[0].message.content);
    } else if (data && typeof data === 'object' && !data.error && !data.candidates) {
      parsedResult = data;
    }
  } catch (jsonErr) {
    rollbackLastRequestTimestamp();
    throw new Error('Нейросеть вернула неполный ответ. Запрос не был списан, попробуйте ещё раз.');
  }

  if (!parsedResult || typeof parsedResult !== 'object') {
    rollbackLastRequestTimestamp();
    throw new Error('Пустой ответ от нейросети. Запрос не был списан.');
  }

  // Списываем 1 запрос ТОЛЬКО после того, как получен успешный и корректный ответ от ИИ
  const isMasterFromServer =
    Boolean(data?._quota?.isMaster) || response.headers.get('x-is-master') === 'true';

  if (isMasterFromServer) {
    setMasterAccessKeyActive(true);
  } else if (savedAccessKey) {
    setMasterAccessKeyActive(false);
    const headerRem = response.headers.get('x-remaining-requests');
    const serverRemaining =
      typeof data?._quota?.remainingRequests === 'number'
        ? data._quota.remainingRequests
        : typeof data?.remainingRequests === 'number'
        ? data.remainingRequests
        : headerRem !== null && headerRem !== '' && !Number.isNaN(Number(headerRem))
        ? Number(headerRem)
        : null;

    const serverPackageLimit =
      typeof data?._quota?.packageLimit === 'number'
        ? data._quota.packageLimit
        : typeof data?.packageLimit === 'number'
        ? data.packageLimit
        : null;

    if (serverRemaining !== null) {
      // Серверное хранилище вернуло точный остаток по ключу
      setKeyRemainingBalance(savedAccessKey, serverRemaining);
      if (serverPackageLimit !== null && serverPackageLimit > 0) {
        setKeyPackageLimit(savedAccessKey, Math.max(serverPackageLimit, serverRemaining));
      }
    } else {
      // Fallback: если серверное хранилище еще не подключено, клиент сам уменьшает баланс из 500 на 1
      decrementKeyRemainingBalance(savedAccessKey);
    }
  } else {
    // Пользователь использует стартовый пакет из 100 бесплатных запросов
    decrementStarterRemainingRequests();
  }

  const updatedStatus = getQuotaStatus();
  payload.onQuotaUsed?.(updatedStatus.usedRequests);
  notifyQuotaUpdated();

  return parsedResult;
}

/**
 * 1. Estimate food nutrients by name
 */
export async function estimateFoodWithWorker(params: {
  query: string;
  metrics: MetricConfig[];
  onOpenPaywall?: () => void;
  onQuotaUsed?: (newUsedCount: number) => void;
}): Promise<any> {
  const metricIds = Array.isArray(params.metrics)
    ? params.metrics.map((m) => m.id).join(', ')
    : 'calories, proteins, fats, carbs, fiber';

  const prompt = `
Estimate the nutritional values for the exact product or dish requested:
User query: "${params.query}"
Active tracked metrics: [${metricIds}]

CRITICAL RULES:
1. STRICTLY PRESERVE USER FOOD NAME: Do NOT rename, replace, or alter the user's food name!
   Return "name": the user's exact food name as entered in the query (trimmed, without changing wording).
2. DO NOT ASSUME COOKED / BOILED unless the user explicitly used that word in their query!
3. Portion weight: If an amount in grams is given in the query, use that exact number for "amountGrams". If none is specified, default to 100g.
4. Nutrients: Calculate realistic macronutrients and micronutrients for this exact product according to tracked metrics.

Return strictly a JSON object with:
{
  "name": "exact food title from user query",
  "amountGrams": 100,
  "nutrients": { "calories": 0, "proteins": 0, "fats": 0, "carbs": 0 },
  "note": "short 1-line note in Russian"
}
`;

  return callCloudflareWorkerAI({
    prompt,
    action: 'estimate_food',
    onOpenPaywall: params.onOpenPaywall,
    onQuotaUsed: params.onQuotaUsed,
  });
}

/**
 * 2. Analyze food photo (label or dish)
 */
export async function analyzeFoodPhotoWithWorker(params: {
  imageBase64: string;
  mode: 'label' | 'dish';
  foodName: string;
  onOpenPaywall?: () => void;
  onQuotaUsed?: (newUsedCount: number) => void;
}): Promise<any> {
  const { imageBase64, mode, foodName } = params;
  const systemInstruction =
    mode === 'label'
      ? `You are an expert nutrition AI. Analyze this food nutrition label / packaging photo and extract exact macronutrients (calories, protein, fat, carbs) per 100g (or stated portion). Also estimate realistic micronutrients and vitamins (Vitamin C, Vitamin D, Vitamin B12, Iron, Calcium, Potassium, Magnesium, Fiber) based on the product name: "${foodName || 'this food'}".
Output strictly JSON:
{
  "name": "${foodName || 'Продукт'}",
  "servingSizeGrams": 100,
  "nutrients": {
    "calories": 250,
    "proteins": 12,
    "fats": 8,
    "carbs": 32,
    "fiber": 2.5,
    "sugar": 4.0,
    "water": 0,
    "vitaminC": 0,
    "vitaminD": 0,
    "vitaminB12": 0,
    "iron": 1.2,
    "calcium": 60,
    "potassium": 180,
    "magnesium": 25
  },
  "confidenceNote": "КБЖУ распознано с этикетки упаковки, витамины и минералы рассчитаны ИИ по составу продукта."
}`
      : `You are a culinary and nutritional vision AI. Analyze this photo of a meal / dish on a plate. Estimate overall portion weight in grams and calculate total nutrients for "${foodName || 'Блюдо'}".
Output strictly JSON:
{
  "name": "${foodName || 'Блюдо'}",
  "servingSizeGrams": 280,
  "nutrients": {
    "calories": 420,
    "proteins": 28,
    "fats": 16,
    "carbs": 42,
    "fiber": 4.5,
    "water": 0,
    "vitaminC": 15,
    "iron": 2.8,
    "potassium": 420
  },
  "confidenceNote": "Примерная визуальная оценка порции и состава блюда по фотографии."
}`;

  const prompt =
    mode === 'label'
      ? `Read the nutrition facts on this label for "${foodName || 'food'}". Extract calories, protein, fat, carbohydrates per 100g and estimate vitamins/minerals.`
      : `Analyze the food on the plate for "${foodName || 'food'}". Estimate portion weight in grams and full nutritional values.`;

  return callCloudflareWorkerAI({
    prompt,
    systemInstruction,
    imageBase64,
    action: 'analyze_photo',
    onOpenPaywall: params.onOpenPaywall,
    onQuotaUsed: params.onQuotaUsed,
  });
}

/**
 * 3. Generate step-by-step recipe by dish name
 */
export async function generateRecipeWithWorker(params: {
  dishName: string;
  library: Array<{ id: string; name: string }>;
  metrics: MetricConfig[];
  onOpenPaywall?: () => void;
  onQuotaUsed?: (newUsedCount: number) => void;
}): Promise<any> {
  const metricIds =
    Array.isArray(params.metrics) && params.metrics.length > 0
      ? params.metrics.map((m) => m.id).join(', ')
      : 'calories, proteins, fats, carbs, fiber';

  const existingProductNames = Array.isArray(params.library)
    ? params.library
        .slice(0, 60)
        .map((f) => f.name)
        .join(', ')
    : '';

  const prompt = `
Вы — профессиональный шеф-повар, технолог общественного питания и нутрициолог.
Создайте подробный пошаговый рецепт блюда по названию: "${params.dishName}".

Доступные в библиотеке продукты (если подходят по смыслу, используйте точно такие же названия, а если нужны другие — добавьте любые необходимые продукты):
[${existingProductNames}]

Отслеживаемые нутриенты (на 100 г сырого продукта): [${metricIds}]

ПРАВИЛА СОЗДАНИЯ ПОШАГОВОГО РЕЦЕПТА:
1. Разбейте приготовление блюда на реальную посуду (1, 2 или 3 посуды в массиве "vessels").
   Если есть зажарка/соус во второй посуде, которая перекладывается в первую, добавьте в первой посуде шаг с "sourceVesselId": "vessel-2" и "foodName": "Содержимое: <название 2-й посуды>".
2. Таймлайн шагов ("stepItems"):
   - "addedAtMinute" — минута от начала готовки в ЭТОЙ посуде (первый шаг всегда 0).
   - Каждый следующий шаг начинается на минуте = (addedAtMinute предыдущего шага + durationMinutes предыдущего шага).
3. Для каждого шага укажите "hasThermalProcessing": true/false и параметры ("stepHeatSource": "electric" | "gas" | "oven" | "multicooker" и т.д., "stepElectricLevel": 1..9, "stepGasLevel": "simmer" | "low" | "medium" | "high", "stepHasLid": true/false).
4. Все сырые ингредиенты (включая "Вода", если используется вода) перечислите в массиве "ingredients" с общим весом в граммах и точным КБЖУ на 100 г сырого продукта.

Верните СТРОГИЙ JSON следующей структуры:
{
  "name": "${params.dishName}",
  "ingredients": [
    {
      "foodName": "Вода",
      "grams": 1500,
      "category": "drink",
      "nutrientsPer100g": { "calories": 0, "proteins": 0, "fats": 0, "carbs": 0, "fiber": 0 }
    }
  ],
  "vessels": [
    {
      "id": "vessel-1",
      "name": "Кастрюля 3 л",
      "icon": "🍲",
      "type": "pot",
      "heatSource": "electric",
      "electricLevel": 5,
      "gasLevel": "medium",
      "ovenTempC": 180,
      "ovenMode": "top_bottom",
      "hasLid": true,
      "startOffsetMinutes": 0,
      "stepItems": [
        {
          "foodName": "Вода",
          "grams": 1500,
          "addedAtMinute": 0,
          "durationMinutes": 30,
          "hasThermalProcessing": true,
          "isRegimeOnly": false,
          "stepHeatSource": "electric",
          "stepElectricLevel": 4,
          "stepGasLevel": "low",
          "stepHasLid": true
        }
      ]
    }
  ],
  "aiAnalysis": {
    "note": "Краткое описание технологии приготовления и вкусового профиля блюда.",
    "nutrientImpact": "Влияние выбранных режимов готовки на сохранность витаминов и макронутриентов.",
    "chefTips": "Практический совет шеф-повара для идеального результата."
  }
}
`;

  const res = await callCloudflareWorkerAI({
    prompt,
    action: 'generate_recipe',
    onOpenPaywall: params.onOpenPaywall,
    onQuotaUsed: params.onQuotaUsed,
  });

  return res?.recipe ? res.recipe : res;
}

/**
 * 4. Analyze cooking process thermal physics
 */
export async function analyzeCookingWithWorker(params: {
  vessels: any[];
  ingredients: any[];
  totalRawWeightGrams: number;
  calculatedEvaporationMl: number;
  finalDishWeightGrams: number;
  onOpenPaywall?: () => void;
  onQuotaUsed?: (newUsedCount: number) => void;
}): Promise<any> {
  const prompt = `
Вы — ведущий кулинарный физик, шеф-повар и нутрициолог.
Проанализируйте кулинарный рецепт и термический процесс приготовления:
Ингредиенты: ${JSON.stringify(params.ingredients)}
Посуда и таймлайн: ${JSON.stringify(params.vessels)}
Исходный сырой вес: ${params.totalRawWeightGrams} г
Расчетное испарение воды: ${params.calculatedEvaporationMl} мл
Расчетный вес готового блюда: ${params.finalDishWeightGrams} г

Верните СТРОГИЙ JSON:
{
  "note": "Подробный кулинарный вывод о текстуре, уварке и вкусе блюда на русском языке (2-3 предложения)",
  "nutrientImpact": "Оценка сохранности витаминов и перехода минералов в бульон (1-2 предложения)",
  "chefTips": "Практический кулинарный совет шефа (1-2 предложения)",
  "recommendedFinalWeightGrams": ${params.finalDishWeightGrams}
}
`;

  const res = await callCloudflareWorkerAI({
    prompt,
    action: 'analyze_cooking',
    onOpenPaywall: params.onOpenPaywall,
    onQuotaUsed: params.onQuotaUsed,
  });

  return res?.analysis ? res.analysis : res;
}

/**
 * 5. AI Assistant Chat & userConfig controller
 */
export async function sendChatWithWorker(params: {
  message: string;
  currentConfig: UserConfig;
  history: Array<{ role: string; content: string }>;
  onOpenPaywall?: () => void;
  onQuotaUsed?: (newUsedCount: number) => void;
}): Promise<any> {
  const conversationContext = (params.history || [])
    .slice(-6)
    .map((h) => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.content}`)
    .join('\n');

  const prompt = `
You are the AI nutritional assistant and configuration controller for Smart Food Assistance.
Current userConfig:
${JSON.stringify(params.currentConfig || {}, null, 2)}

Recent Conversation History:
${conversationContext || 'None'}

User Command / Message:
"${params.message}"

Return your response strictly as valid JSON adhering to this structure:
{
  "assistantMessage": "Friendly and helpful response in the user's active language explaining what was done or answering their question",
  "summaryOfChanges": "Brief 1-sentence note of what changed in userConfig, or null if no config change",
  "updatedConfig": null,
  "suggestedMealsToAdd": null
}
(If the user asked to modify userConfig targets, theme, languages, or metrics, include the full updated userConfig in "updatedConfig". If the user described food they ate, include an array of items in "suggestedMealsToAdd" with mealCategoryId, name, amountGrams, and nutrients.)
`;

  return callCloudflareWorkerAI({
    prompt,
    action: 'chat',
    onOpenPaywall: params.onOpenPaywall,
    onQuotaUsed: params.onQuotaUsed,
  });
}

/**
 * 6. Calculate personalized Daily Norm for all selected nutrients via AI
 */
export async function calculateDailyNormWithWorker(params: {
  gender: 'male' | 'female';
  age: number;
  weightKg: number;
  heightCm: number;
  goalLabel: string;
  activityDescription: string;
  trackedMetrics?: Array<{ id: string; label: string; unit: string }>;
  langCode?: string;
  onOpenPaywall?: () => void;
  onQuotaUsed?: (newUsedCount: number) => void;
}): Promise<{
  calories: number;
  proteins: number;
  fats: number;
  carbs: number;
  water: number;
  fiber?: number;
  sugar?: number;
  targets?: Record<string, number>;
  note?: string;
}> {
  const lang = (params.langCode || 'ru').toLowerCase();
  const responseLang = lang.startsWith('en')
    ? 'English'
    : lang.startsWith('pl')
    ? 'Polish'
    : 'Russian';

  const metricsListText =
    params.trackedMetrics && params.trackedMetrics.length > 0
      ? params.trackedMetrics
          .map((m) => `- "${m.id}": ${m.label} (unit: ${m.unit})`)
          .join('\n')
      : `- "calories": Calories (unit: kcal)\n- "proteins": Proteins (unit: g)\n- "fats": Fats (unit: g)\n- "carbs": Carbohydrates (unit: g)\n- "water": Water (unit: ml)\n- "fiber": Fiber (unit: g)\n- "sugar": Sugar (unit: g)`;

  const exampleTargetsObj: Record<string, number> = {
    calories: 2100,
    proteins: 135,
    fats: 70,
    carbs: 230,
    water: 2500,
    fiber: 28,
    sugar: 30,
  };
  if (params.trackedMetrics) {
    params.trackedMetrics.forEach((m) => {
      if (!(m.id in exampleTargetsObj)) {
        exampleTargetsObj[m.id] = 100;
      }
    });
  }

  const prompt = `
Calculate accurate daily nutritional norms for a person with the following parameters:
- Gender: ${params.gender === 'male' ? 'Male (Мужской)' : 'Female (Женский)'}
- Age: ${params.age} years
- Weight: ${params.weightKg} kg
- Height: ${params.heightCm} cm
- Physical Activity: "${params.activityDescription}"
- Goal: "${params.goalLabel}"

The user has selected the following nutrients to track daily (calculate the optimal daily target in the specified unit for EVERY nutrient in this list):
${metricsListText}

Carefully evaluate the exact physical activity described (including custom sports, steps, job type, workout frequency, or lifestyle) and calculate realistic daily energy expenditure, macro targets, and micronutrient/secondary targets for all listed nutrients.

Return strictly a valid JSON object with top-level core macros AND a "targets" object containing numeric values for EVERY requested nutrient ID:
{
  "calories": 2100,
  "proteins": 135,
  "fats": 70,
  "carbs": 230,
  "water": 2500,
  "fiber": 28,
  "sugar": 30,
  "targets": ${JSON.stringify(exampleTargetsObj)},
  "note": "Brief 1-2 sentence explanation in ${responseLang} of how the activity and parameters shaped these daily norms"
}
`;

  return callCloudflareWorkerAI({
    prompt,
    action: 'calculate_daily_norm',
    onOpenPaywall: params.onOpenPaywall,
    onQuotaUsed: params.onQuotaUsed,
  });
}
