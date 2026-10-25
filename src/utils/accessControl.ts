import { MetricConfig, UserConfig } from '../types/config';

export const CLOUDFLARE_WORKER_URL = 'https://api.smartfoodasystent.workers.dev/api';
export const STRIPE_PAYMENT_URL = 'https://buy.stripe.com/test_placeholder';
export const ACCESS_KEY_STORAGE_KEY = 'app_access_key';

const DAILY_USAGE_STORAGE_KEY = 'sfa_daily_ai_usage_v1';
const RECENT_TIMESTAMPS_STORAGE_KEY = 'sfa_recent_ai_timestamps_v1';

export const TRIAL_DAILY_LIMIT = 20;
export const PRO_DAILY_LIMIT = 100;
export const MIN_REQUEST_INTERVAL_MS = 10_000; // 10 seconds
export const MAX_REQUESTS_PER_MINUTE = 3; // max 3 requests per 60 seconds

export interface QuotaCheckResult {
  allowed: boolean;
  reason?: 'daily_limit_reached' | 'cooldown';
  waitSeconds?: number;
  usedToday: number;
  dailyLimit: number;
  hasAccessKey: boolean;
}

function getTodayDateKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getSavedAccessKey(): string {
  try {
    return (localStorage.getItem(ACCESS_KEY_STORAGE_KEY) || '').trim();
  } catch {
    return '';
  }
}

export function saveAccessKey(key: string): void {
  try {
    const cleaned = key.trim();
    if (cleaned) {
      localStorage.setItem(ACCESS_KEY_STORAGE_KEY, cleaned);
    } else {
      localStorage.removeItem(ACCESS_KEY_STORAGE_KEY);
    }
  } catch (e) {
    console.error('Failed to save access key:', e);
  }
}

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

export function getDailyUsageCount(): number {
  const today = getTodayDateKey();
  try {
    const raw = localStorage.getItem(DAILY_USAGE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.date === today) {
        return Math.max(0, Number(parsed.count) || 0);
      }
    }
  } catch {
    // ignore parse errors
  }
  return 0;
}

export function incrementDailyUsageCount(): number {
  const today = getTodayDateKey();
  const nextCount = getDailyUsageCount() + 1;
  try {
    localStorage.setItem(
      DAILY_USAGE_STORAGE_KEY,
      JSON.stringify({ date: today, count: nextCount })
    );
  } catch (e) {
    console.error('Failed to update daily usage count:', e);
  }
  return nextCount;
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

export function getQuotaStatus(): {
  hasAccessKey: boolean;
  accessKey: string;
  usedToday: number;
  dailyLimit: number;
  remainingToday: number;
} {
  const accessKey = getSavedAccessKey();
  const hasAccessKey = accessKey.length > 0;
  const dailyLimit = hasAccessKey ? PRO_DAILY_LIMIT : TRIAL_DAILY_LIMIT;
  const usedToday = getDailyUsageCount();
  const remainingToday = Math.max(0, dailyLimit - usedToday);
  return {
    hasAccessKey,
    accessKey,
    usedToday,
    dailyLimit,
    remainingToday,
  };
}

/**
 * Checks whether an AI request is allowed under:
 * 1) Daily limit: 20/day without key, 100/day with key (resets at midnight)
 * 2) Anti-spam: min 10 seconds between requests, max 3 requests per 60 seconds
 */
export function checkAiRequestAllowance(): QuotaCheckResult {
  const { hasAccessKey, usedToday, dailyLimit } = getQuotaStatus();

  // 1. Check daily limit first
  if (usedToday >= dailyLimit) {
    return {
      allowed: false,
      reason: 'daily_limit_reached',
      usedToday,
      dailyLimit,
      hasAccessKey,
    };
  }

  // 2. Check anti-spam interval (10s minimum between requests & max 3 per minute)
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
        usedToday,
        dailyLimit,
        hasAccessKey,
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
      usedToday,
      dailyLimit,
      hasAccessKey,
    };
  }

  return {
    allowed: true,
    usedToday,
    dailyLimit,
    hasAccessKey,
  };
}

export class AiQuotaError extends Error {
  reason: 'daily_limit_reached' | 'cooldown';
  waitSeconds?: number;

  constructor(
    reason: 'daily_limit_reached' | 'cooldown',
    message: string,
    waitSeconds?: number
  ) {
    super(message);
    this.name = 'AiQuotaError';
    this.reason = reason;
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
 * Sends a POST request to https://api.smartfoodasystent.workers.dev
 * with headers:
 * {
 *   "Content-Type": "application/json",
 *   "x-access-token": savedAccessKey || ""
 * }
 * Enforces daily limits (20/day trial, 100/day with key) and anti-spam (10s interval, max 3/min).
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
    if (check.reason === 'daily_limit_reached') {
      payload.onOpenPaywall?.();
      throw new AiQuotaError(
        'daily_limit_reached',
        check.hasAccessKey
          ? 'Достигнут суточный лимит (100 запросов в день). Лимит обновится в полночь.'
          : 'Достигнут суточный лимит пробного режима (20 запросов в сутки). Оформите годовой доступ для увеличения лимита до 100 запросов в день.'
      );
    }
    throw new AiQuotaError(
      'cooldown',
      `Пожалуйста, подождите ${check.waitSeconds || 10} сек. перед следующим запросом (защита от спама: интервал 10 сек, не более 3 запросов в минуту).`,
      check.waitSeconds
    );
  }

  // Record timestamp for anti-spam protection before firing
  recordRequestTimestamp();

  const savedAccessKey = getSavedAccessKey();
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
    ...(payload.extraPayload || {}),
  };

  const response = await fetch(CLOUDFLARE_WORKER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-access-token': savedAccessKey || '',
    },
    body: JSON.stringify(requestBody),
  });

  if (response.status === 401 || response.status === 402 || response.status === 403 || response.status === 429) {
    payload.onOpenPaywall?.();
    let errText = '';
    try {
      const errJson = await response.json();
      errText = errJson?.error?.message || errJson?.error || errJson?.message || '';
    } catch {
      // ignore
    }
    throw new AiQuotaError(
      'daily_limit_reached',
      errText || 'Лимит запросов исчерпан или требуется ключ годового доступа.'
    );
  }

  if (!response.ok) {
    let errMsg = `Ошибка сервера ИИ (${response.status})`;
    try {
      const errData = await response.json();
      errMsg = errData?.error?.message || errData?.error || errData?.message || errMsg;
    } catch {
      // ignore
    }
    throw new Error(errMsg);
  }

  // Increment daily counter upon successful response
  const updatedCount = incrementDailyUsageCount();
  payload.onQuotaUsed?.(updatedCount);

  const data = await response.json();

  // Handle Gemini GenerateContentResponse format
  const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof candidateText === 'string' && candidateText.trim()) {
    return extractJsonFromText(candidateText);
  }

  // Handle wrapper formats ({ text: "..." } or { result: "..." } or OpenAI choices)
  if (typeof data?.text === 'string' && data.text.trim()) {
    return extractJsonFromText(data.text);
  }
  if (typeof data?.result === 'string' && data.result.trim()) {
    return extractJsonFromText(data.result);
  }
  const choiceContent = data?.choices?.[0]?.message?.content;
  if (typeof choiceContent === 'string' && choiceContent.trim()) {
    return extractJsonFromText(choiceContent);
  }

  // Otherwise assume data is already the JSON object
  return data;
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
