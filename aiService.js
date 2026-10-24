// @ts-check
import { GoogleGenAI } from '@google/genai';

/**
 * @typedef {'gemini' | 'openai' | 'openrouter' | 'custom'} AIProvider
 *
 * @typedef {Object} AIConfig
 * @property {AIProvider} provider
 * @property {string} [apiKey]
 * @property {string} [baseURL]
 * @property {string} [model]
 */

export const DEFAULT_MODELS = {
  gemini: 'gemini-3.5-flash-lite',
  openai: 'gpt-4o-mini',
  openrouter: 'meta-llama/llama-3.3-70b-instruct',
  custom: 'gpt-4o-mini',
};

export const DEFAULT_BASE_URLS = {
  gemini: 'https://generativelanguage.googleapis.com',
  openai: 'https://api.openai.com/v1',
  openrouter: 'https://openrouter.ai/api/v1',
  custom: 'https://api.openai.com/v1',
};

/**
 * Helper to get Gemini client instance
 * @param {string} [customApiKey]
 * @returns {GoogleGenAI | null}
 */
export function getGeminiClient(customApiKey) {
  const key = (customApiKey && typeof customApiKey === 'string' && customApiKey.trim().length > 0)
    ? customApiKey.trim()
    : process.env.GEMINI_API_KEY;

  if (!key) return null;

  return new GoogleGenAI({
    apiKey: key,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

/**
 * Normalizes user-supplied AI configuration
 * @param {AIConfig} [config]
 * @returns {AIConfig}
 */
export function normalizeAiConfig(config) {
  const provider = (config && config.provider) || 'gemini';
  const apiKey = (config && config.apiKey) ? config.apiKey.trim() : '';
  const baseURL = (config && config.baseURL && config.baseURL.trim())
    ? config.baseURL.trim()
    : DEFAULT_BASE_URLS[provider] || DEFAULT_BASE_URLS.gemini;
  const model = (config && config.model && config.model.trim())
    ? config.model.trim()
    : DEFAULT_MODELS[provider] || DEFAULT_MODELS.gemini;

  return { provider, apiKey, baseURL, model };
}

/**
 * Calls OpenAI-compatible chat completions endpoint (OpenAI, OpenRouter, Groq, Ollama, vLLM, etc.)
 * @param {Object} params
 * @param {string} params.baseURL
 * @param {string} params.apiKey
 * @param {string} params.model
 * @param {Array<{role: string, content: any}>} params.messages
 * @param {boolean} [params.jsonMode]
 * @param {number} [params.temperature]
 * @returns {Promise<string>}
 */
async function callOpenAICompatible({
  baseURL,
  apiKey,
  model,
  messages,
  jsonMode = true,
  temperature = 0.2,
}) {
  const cleanBase = baseURL.replace(/\/+$/, '');
  const endpoint = cleanBase.endsWith('/chat/completions')
    ? cleanBase
    : `${cleanBase}/chat/completions`;

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey || ''}`,
    'HTTP-Referer': 'https://aistudio.google.com',
    'X-Title': 'PWA Calorie & Nutrient Tracker',
  };

  /** @type {Record<string, any>} */
  const body = {
    model,
    messages,
    temperature,
  };

  if (jsonMode) {
    body.response_format = { type: 'json_object' };
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(12000),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    let errorMsg = `HTTP ${res.status}`;
    try {
      const parsed = JSON.parse(errorBody);
      errorMsg = parsed.error?.message || parsed.message || errorBody;
    } catch {
      errorMsg = errorBody || `HTTP ${res.status}`;
    }
    throw new Error(`[${model}] ${errorMsg}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content || '';
  return text.trim();
}

/**
 * Cleans markdown code fences from JSON output
 * @param {string} raw
 * @returns {string}
 */
export function extractJsonString(raw) {
  let cleaned = raw.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/i, '').replace(/\s*```$/i, '');
  }
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return cleaned.substring(firstBrace, lastBrace + 1);
  }
  return cleaned;
}

/**
 * Unified AI Service
 */
export const aiService = {
  /**
   * Test connection to provider with user configuration
   * @param {AIConfig} rawConfig
   * @returns {Promise<{ success: boolean; message: string; latencyMs?: number; provider: string; model: string }>}
   */
  async testConnection(rawConfig) {
    const config = normalizeAiConfig(rawConfig);
    const startTime = Date.now();

    try {
      if (config.provider === 'gemini') {
        const client = getGeminiClient(config.apiKey);
        if (!client) {
          throw new Error('API-ключ Google Gemini не указан.');
        }
        const response = await client.models.generateContent({
          model: config.model || DEFAULT_MODELS.gemini,
          contents: 'Ответь кратко JSON: {"status": "ok"}',
          config: { responseMimeType: 'application/json' },
        });
        const latency = Date.now() - startTime;
        if (!response.text) throw new Error('Пустой ответ от Gemini');
        return {
          success: true,
          message: `Соединение с Google Gemini успешно установлено (${latency}мс). Модель: ${config.model}`,
          latencyMs: latency,
          provider: 'gemini',
          model: config.model || DEFAULT_MODELS.gemini,
        };
      }

      // OpenAI, OpenRouter or Custom
      if (!config.apiKey && config.provider !== 'custom') {
        throw new Error(`API-ключ для ${config.provider} обязателен.`);
      }

      const responseText = await callOpenAICompatible({
        baseURL: config.baseURL || DEFAULT_BASE_URLS[config.provider] || DEFAULT_BASE_URLS.openai,
        apiKey: config.apiKey || '',
        model: config.model || DEFAULT_MODELS[config.provider] || 'gpt-4o-mini',
        messages: [
          { role: 'user', content: 'Ответь строго в формате JSON: {"status": "ok"}' },
        ],
        jsonMode: true,
      });

      const latency = Date.now() - startTime;
      return {
        success: true,
        message: `Соединение с ${config.provider} успешно (${latency}мс). Модель: ${config.model}`,
        latencyMs: latency,
        provider: config.provider,
        model: config.model || 'unknown',
      };
    } catch (err) {
      const latency = Date.now() - startTime;
      return {
        success: false,
        message: err instanceof Error ? err.message : String(err),
        latencyMs: latency,
        provider: config.provider,
        model: config.model || 'unknown',
      };
    }
  },

  /**
   * Process Chat Command and return JSON config changes
   * @param {Object} params
   * @param {string} params.message
   * @param {any} params.currentConfig
   * @param {Array<{role: string, content: string}>} [params.history]
   * @param {AIConfig} [params.aiConfig]
   * @param {string} params.systemInstruction
   * @returns {Promise<any>}
   */
  async generateChatResponse({
    message,
    currentConfig,
    history = [],
    aiConfig,
    systemInstruction,
  }) {
    const config = normalizeAiConfig(aiConfig);

    const conversationContext = history
      .slice(-6)
      .map((h) => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.content}`)
      .join('\n');

    const promptText = `
Current userConfig:
${JSON.stringify(currentConfig || {}, null, 2)}

Recent Conversation History:
${conversationContext || 'None'}

User Command / Message:
"${message}"

Return your response strictly as valid JSON adhering to this structure:
{
  "assistantMessage": "Friendly and helpful response in Russian (or user active language) explaining what was done or answering question",
  "summaryOfChanges": "Brief 1-sentence note of what changed in userConfig, or null if no config change",
  "updatedConfig": <FULL valid updated userConfig JSON with modifications applied, or null if no changes needed>,
  "suggestedMealsToAdd": [
    {
      "mealCategoryId": "breakfast | lunch | dinner | snack",
      "name": "Food item name",
      "amountGrams": 150,
      "nutrients": {
        "calories": 250,
        "proteins": 15,
        "fats": 8,
        "carbs": 30
      }
    }
  ] (or null)
}
`;

    let responseText = '';

    if (config.provider === 'gemini') {
      const client = getGeminiClient(config.apiKey);
      if (!client) {
        throw new Error('NO_API_KEY');
      }

      const candidateModels = [
        config.model || 'gemini-3.8-flash',
        'gemini-3.8-flash',
        'gemini-flash-latest',
        'gemini-3.1-flash-lite',
      ];
      const uniqueModels = [...new Set(candidateModels)];

      let lastErr = null;
      for (const m of uniqueModels) {
        try {
          const resp = await client.models.generateContent({
            model: m,
            contents: promptText,
            config: {
              systemInstruction,
              responseMimeType: 'application/json',
            },
          });
          if (resp.text) {
            responseText = resp.text.trim();
            break;
          }
        } catch (/** @type {any} */ err) {
          lastErr = err;
          console.warn(`[aiService] Gemini model ${m} error:`, err?.message || err);
        }
      }

      if (!responseText) {
        throw lastErr || new Error('All Gemini candidate models failed');
      }
    } else {
      // OpenAI-compatible (ChatGPT, OpenRouter, Custom)
      const messages = [
        { role: 'system', content: systemInstruction },
        ...history.slice(-4).map((h) => ({
          role: h.role === 'assistant' ? 'assistant' : 'user',
          content: h.content,
        })),
        { role: 'user', content: promptText },
      ];

      responseText = await callOpenAICompatible({
        baseURL: config.baseURL || DEFAULT_BASE_URLS[config.provider] || DEFAULT_BASE_URLS.openai,
        apiKey: config.apiKey || '',
        model: config.model || DEFAULT_MODELS[config.provider] || 'gpt-4o-mini',
        messages,
        jsonMode: true,
      });
    }

    const cleanJson = extractJsonString(responseText);
    return JSON.parse(cleanJson);
  },

  /**
   * Estimates nutrients for a food item by text query
   * @param {Object} params
   * @param {string} params.query
   * @param {Array<any>} params.metrics
   * @param {AIConfig} [params.aiConfig]
   * @returns {Promise<any>}
   */
  async estimateFoodNutrients({ query, metrics, aiConfig }) {
    const config = normalizeAiConfig(aiConfig);
    const metricIds = Array.isArray(metrics)
      ? metrics.map((m) => m.id).join(', ')
      : 'calories, proteins, fats, carbs, fiber';

    const prompt = `
Estimate the nutritional values for the exact product or dish requested:
User query: "${query}"
Active tracked metrics: [${metricIds}]

CRITICAL RULES:
1. STRICTLY PRESERVE USER FOOD NAME: Do NOT rename, replace, or alter the user's food name!
   Return "name": the user's exact food name as entered in the query (trimmed, without changing wording, e.g. if the user wrote "пельмени по-польски", keep "пельмени по-польски", NEVER replace with "пельмени с мясным фаршем" or other generic titles).
2. DO NOT ASSUME COOKED / BOILED: Never arbitrarily change the product to cooked or boiled ("отварные", "варёные") unless the user explicitly used that word in their query!
   If the user enters a raw, semi-finished, or packaged product (such as pelmeni, dumplings, pasta, rice, buckwheat, oatmeal, meat), calculate the KBJU for the product in its standard raw / packaged state per 100g (or the specified portion grams), NOT cooked with water absorption. If the user wants cooked, they will specify "отварные" themselves.
3. Portion weight: If an amount in grams is given in the query, use that exact number for "amountGrams". If none is specified, default to 100g.
4. Nutrients: Calculate realistic macronutrients and micronutrients for this exact product according to tracked metrics.

Return a JSON object with:
- "name": exact food title from user query
- "amountGrams": portion weight in grams (number)
- "nutrients": { [metricId: string]: number } (estimated values for this portion)
- "note": short 1-line note
`;

    let responseText = '';

    if (config.provider === 'gemini') {
      const client = getGeminiClient(config.apiKey);
      if (!client) throw new Error('API key missing for Gemini');

      const resp = await client.models.generateContent({
        model: config.model || 'gemini-3.8-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' },
      });
      responseText = resp.text || '{}';
    } else {
      responseText = await callOpenAICompatible({
        baseURL: config.baseURL || DEFAULT_BASE_URLS[config.provider] || DEFAULT_BASE_URLS.openai,
        apiKey: config.apiKey || '',
        model: config.model || DEFAULT_MODELS[config.provider] || 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        jsonMode: true,
      });
    }

    const cleanJson = extractJsonString(responseText);
    return JSON.parse(cleanJson);
  },

  /**
   * Multimodal analysis of food label or dish plate photo
   * @param {Object} params
   * @param {string} params.imageBase64
   * @param {'label' | 'dish'} params.mode
   * @param {string} [params.foodName]
   * @param {AIConfig} [params.aiConfig]
   * @returns {Promise<any>}
   */
  async analyzeFoodPhoto({ imageBase64, mode = 'label', foodName = '', aiConfig }) {
    const config = normalizeAiConfig(aiConfig);

    const match = imageBase64.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
    const mimeType = match ? match[1] : 'image/jpeg';
    const base64Data = match ? match[2] : imageBase64;
    const fullDataUrl = match ? imageBase64 : `data:${mimeType};base64,${base64Data}`;

    let systemPrompt = '';
    let userPrompt = '';

    if (mode === 'label') {
      systemPrompt = `You are an expert nutrition AI. Your task is to analyze a food nutrition label / packaging photo and extract the exact macronutrients (calories, protein, fat, carbs) per 100g (or stated portion).
Crucially: Nutrition labels rarely list all micronutrients and vitamins. You MUST calculate and estimate realistic micronutrients and vitamins (Vitamin C, Vitamin D, Vitamin B12, Iron, Calcium, Potassium, Magnesium, Fiber) based on the specified product name: "${foodName || 'this food'}".
Output strictly JSON matching this structure:
{
  "name": "${foodName || 'Recognized product'}",
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
}`;
      userPrompt = `Please read the nutrition facts on this label for "${foodName || 'food'}". Extract calories, protein, fat, carbohydrates per 100g. Then estimate vitamins/minerals for "${foodName || 'food'}".`;
    } else {
      systemPrompt = `You are a culinary and nutritional vision AI. You are looking at a photo of a meal / dish on a plate.
Analyze the dish components, estimate the overall portion weight in grams, and calculate total nutrients.
Product name provided by user: "${foodName || 'Meal on plate'}".
Output strictly JSON matching this structure:
{
  "name": "${foodName || 'Определенное блюдо на тарелке'}",
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
      userPrompt = `Analyze the food on the plate for "${foodName || 'food'}". Estimate portion weight in grams and full nutritional values.`;
    }

    let responseText = '';

    if (config.provider === 'gemini') {
      const client = getGeminiClient(config.apiKey);
      if (!client) throw new Error('API Key missing for Gemini');

      const response = await client.models.generateContent({
        model: config.model || 'gemini-3.8-flash',
        contents: [
          {
            role: 'user',
            parts: [
              { text: `${systemPrompt}\n\n${userPrompt}` },
              {
                inlineData: {
                  mimeType,
                  data: base64Data,
                },
              },
            ],
          },
        ],
        config: { responseMimeType: 'application/json' },
      });
      responseText = response.text || '{}';
    } else {
      // Vision in OpenAI standard: content array with text and image_url
      const messages = [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [
            { type: 'text', text: userPrompt },
            {
              type: 'image_url',
              image_url: { url: fullDataUrl },
            },
          ],
        },
      ];

      responseText = await callOpenAICompatible({
        baseURL: config.baseURL || DEFAULT_BASE_URLS[config.provider] || DEFAULT_BASE_URLS.openai,
        apiKey: config.apiKey || '',
        model: config.model || 'gpt-4o-mini',
        messages,
        jsonMode: true,
      });
    }

    const cleanJson = extractJsonString(responseText);
    const parsed = JSON.parse(cleanJson);
    if (foodName && foodName.trim().length > 0) {
      parsed.name = foodName.trim();
    }
    return parsed;
  },

  /**
   * Lifestyle and Activity Adjustment for Mifflin-St Jeor TDEE
   * @param {Object} params
   * @param {string} params.gender
   * @param {number} params.age
   * @param {number} params.heightCm
   * @param {number} params.weightKg
   * @param {string} params.activityPrompt
   * @param {number} params.bmr
   * @param {AIConfig} [params.aiConfig]
   * @returns {Promise<any>}
   */
  async estimateTdee({
    gender,
    age,
    heightCm,
    weightKg,
    activityPrompt,
    bmr,
    aiConfig,
  }) {
    const config = normalizeAiConfig(aiConfig);

    const prompt = `
You are a sports science and clinical nutrition expert.
User parameters:
- Gender: ${gender}
- Age: ${age} years
- Height: ${heightCm} cm
- Weight: ${weightKg} kg
- Calculated Mifflin-St Jeor BMR: ${bmr} kcal/day
- User's description of their lifestyle, sports, and daily activities: "${activityPrompt}"

Analyze the user's specific activities (e.g. running, rock climbing, desk work, daily steps, lifting).
Determine their realistic physical activity level (PAL / TDEE multiplier).
Calculate the exact recommended daily calorie target to maintain healthy body weight.

Return STRICT JSON:
{
  "bmr": ${bmr},
  "recommendedCalories": 2450,
  "activityMultiplier": 1.45,
  "explanation": "краткое объяснение на русском языке (1-2 предложения), как учтена активность пользователя."
}
`;

    let responseText = '';

    if (config.provider === 'gemini') {
      const client = getGeminiClient(config.apiKey);
      if (!client) throw new Error('API Key missing for Gemini');

      const response = await client.models.generateContent({
        model: config.model || 'gemini-3.8-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' },
      });
      responseText = response.text || '{}';
    } else {
      responseText = await callOpenAICompatible({
        baseURL: config.baseURL || DEFAULT_BASE_URLS[config.provider] || DEFAULT_BASE_URLS.openai,
        apiKey: config.apiKey || '',
        model: config.model || DEFAULT_MODELS[config.provider] || 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        jsonMode: true,
      });
    }

    const cleanJson = extractJsonString(responseText);
    const data = JSON.parse(cleanJson);
    if (!data.recommendedCalories) {
      data.recommendedCalories = Math.round(bmr * 1.4);
    }
    return data;
  },

  /**
   * Generates custom nutrient metric configuration
   * @param {Object} params
   * @param {string} params.metricName
   * @param {AIConfig} [params.aiConfig]
   * @returns {Promise<any>}
   */
  async generateCustomMetric({ metricName, aiConfig }) {
    const config = normalizeAiConfig(aiConfig);

    const prompt = `
Create a nutrition tracking metric definition for: "${metricName.trim()}".
Identify typical daily adult intake, unit ('г', 'мг', 'мкг', 'мл', 'ккал'), appropriate category ('macro', 'vitamin', 'mineral', 'fiber', 'hydration', 'custom'), suitable Lucide icon name ('Sparkles', 'Activity', 'Droplet', 'Pill', 'Flame', 'Apple', 'Shield', 'Heart', 'Coffee'), and hex color.

Return STRICT JSON:
{
  "id": "slug_id",
  "label": "Красивое название на русском",
  "unit": "мг",
  "target": 50,
  "category": "mineral",
  "icon": "Sparkles",
  "color": "#10b981",
  "isPrimary": false,
  "showInSummary": true,
  "showInDetailList": true,
  "showInFoodForm": true,
  "showInProducts": true,
  "isProtected": false
}
`;

    let responseText = '';

    if (config.provider === 'gemini') {
      const client = getGeminiClient(config.apiKey);
      if (!client) throw new Error('API key missing for Gemini');

      const response = await client.models.generateContent({
        model: config.model || 'gemini-3.8-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' },
      });
      responseText = response.text || '{}';
    } else {
      responseText = await callOpenAICompatible({
        baseURL: config.baseURL || DEFAULT_BASE_URLS[config.provider] || DEFAULT_BASE_URLS.openai,
        apiKey: config.apiKey || '',
        model: config.model || DEFAULT_MODELS[config.provider] || 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        jsonMode: true,
      });
    }

    const cleanJson = extractJsonString(responseText);
    const parsed = JSON.parse(cleanJson);
    parsed.isProtected = false;
    return parsed;
  },

  /**
   * Performs deep culinary and nutrient analysis of a cooking process (Gemini 3.8 Flash)
   * @param {Object} params
   * @param {Array<any>} params.vessels
   * @param {Array<any>} params.ingredients
   * @param {number} params.totalRawWeightGrams
   * @param {number} params.calculatedEvaporationMl
   * @param {number} params.finalDishWeightGrams
   * @param {AIConfig} [params.aiConfig]
   * @returns {Promise<any>}
   */
  async analyzeCookingProcess({
    vessels,
    ingredients,
    totalRawWeightGrams,
    calculatedEvaporationMl,
    finalDishWeightGrams,
    aiConfig,
  }) {
    const config = normalizeAiConfig(aiConfig);

    const prompt = `
Вы — ведущий кулинарный физик, шеф-повар и нутрициолог.
Проанализируйте следующий кулинарный рецепт и термический процесс приготовления:

Ингредиенты:
${JSON.stringify(ingredients, null, 2)}

Посуда, режимы конфорок, закладка и таймлайн:
${JSON.stringify(vessels, null, 2)}

Исходный сырой вес (продукты + вода): ${totalRawWeightGrams} г
Расчетное испарение воды по формулам: ${calculatedEvaporationMl} мл
Расчетный вес готового блюда: ${finalDishWeightGrams} г

Сделайте экспертный анализ:
1. Оцените плотность бульона/блюда, экстракцию коллагена и соков из мяса, пассеровку овощей на сковороде и их объединение.
2. Проанализируйте влияние термообработки на нутриенты (сохранение/разрушение витамина C при длительной варке, повышение биодоступности ликопина/каротина при пассеровке с маслом, переход водорастворимых минералов в бульон).
3. Дайте ценный кулинарный совет шефа по температуре, контролю кипения или времени добавления трав/специй.

Верните СТРОГИЙ JSON в формате:
{
  "note": "Подробный кулинарный вывод о текстуре, уварке и вкусе блюда на русском языке (2-4 предложения)",
  "nutrientImpact": "Оценка сохранности витаминов и перехода минералов в бульон (1-2 предложения)",
  "chefTips": "Практический кулинарный совет шефа (1-2 предложения)",
  "recommendedFinalWeightGrams": ${finalDishWeightGrams}
}
`;

    let responseText = '';

    if (config.provider === 'gemini') {
      const client = getGeminiClient(config.apiKey);
      if (!client) throw new Error('API key missing for Gemini');

      const response = await client.models.generateContent({
        model: config.model || 'gemini-3.8-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' },
      });
      responseText = response.text || '{}';
    } else {
      responseText = await callOpenAICompatible({
        baseURL: config.baseURL || DEFAULT_BASE_URLS[config.provider] || DEFAULT_BASE_URLS.openai,
        apiKey: config.apiKey || '',
        model: config.model || DEFAULT_MODELS[config.provider] || 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        jsonMode: true,
      });
    }

    const cleanJson = extractJsonString(responseText);
    const parsed = JSON.parse(cleanJson);
    return parsed;
  },

  /**
   * Generates a complete step-by-step recipe with cookware vessels, ingredients, weights, and thermal regimes by dish name
   * @param {Object} params
   * @param {string} params.dishName
   * @param {Array<any>} [params.library]
   * @param {Array<any>} [params.metrics]
   * @param {AIConfig} [params.aiConfig]
   * @returns {Promise<any>}
   */
  async generateRecipeByDishName({
    dishName,
    library = [],
    metrics = [],
    aiConfig,
  }) {
    const config = normalizeAiConfig(aiConfig);
    const metricIds = Array.isArray(metrics) && metrics.length > 0
      ? metrics.map((m) => m.id).join(', ')
      : 'calories, proteins, fats, carbs, fiber';

    const existingProductNames = Array.isArray(library)
      ? library.slice(0, 60).map((f) => f.name).join(', ')
      : '';

    const prompt = `
Вы — профессиональный шеф-повар, технолог общественного питания и нутрициолог.
Пользователь хочет создать подробный пошаговый рецепт блюда по названию: "${dishName}".

Доступные в библиотеке продукты (если подходят по смыслу, используйте точно такие же названия, а если нужны другие — добавьте любые необходимые продукты):
[${existingProductNames}]

Отслеживаемые нутриенты (на 100 г сырого продукта): [${metricIds}]

ПРАВИЛА СОЗДАНИЯ ПОШАГОВОГО РЕЦЕПТА:
1. Разбейте приготовление блюда на реальную посуду (1, 2 или 3 посуды в массиве "vessels"):
   - Если блюдо готовится в одной посуде (например, каша, омлет, салат, запеканка, рагу в мультиварке) — используйте 1 посуду.
   - Если в блюде есть отдельная зажарка/соус/варка в другой посуде, которая потом перекладывается в основную посуду (например, борщ, суп с зажаркой, паста с соусом, бефстроганов с гарниром) — создайте 2 посуды и в основной посуде на нужном шаге добавьте перенос содержимого второй посуды с полем "sourceVesselId": "vessel-2" и "foodName": "Содержимое: <название 2-й посуды>".
2. Таймлайн шагов ("stepItems") внутри каждой посуды:
   - "addedAtMinute" — минута от начала готовки в ЭТОЙ посуде (первый шаг всегда 0).
   - Если несколько продуктов закладываются одновременно в один шаг (например, на 0-й минуте закладываются Вода 1500г и Говядина 500г, и варятся 60 минут), у обоих элементов должно быть "addedAtMinute": 0 и "durationMinutes": 60, а следующий шаг в этой посуде должен начинаться на "addedAtMinute": 60!
   - Каждый следующий шаг начинается строго на минуте = (addedAtMinute предыдущего шага + durationMinutes предыдущего шага).
3. Термообработка или смешивание без нагрева ("hasThermalProcessing"):
   - Если шаг происходит БЕЗ нагрева (например, нарезка и смешивание салата в миске, замес теста, маринование, сборка холодной закуски) — установите "hasThermalProcessing": false.
   - Если в шаге идет варка, жарка, тушение, запекание, приготовление на пару, в мультиварке, гриле и т.д. — установите "hasThermalProcessing": true и укажите реалистичные параметры нагрева:
     * "stepHeatSource": одно из значений: "electric" | "gas" | "oven" | "steamer" | "grill" | "airfryer" | "multicooker" | "pressure" | "sousvide" | "deepfryer" | "microwave" | "wok" | "smoker" | "bainmarie" | "toaster"
     * "stepElectricLevel": число от 1 до 9 (например, 3 для томления/бульона, 5-6 для варки/тушения, 7-8 для жарки)
     * "stepGasLevel": "simmer" | "low" | "medium" | "high"
     * "stepOvenTempC": температура в °C (например, 180 для духовки/аэрогриля, 220 для гриля, 100 для пароварки)
     * "stepOvenMode": "top_bottom" | "convection" | "grill" | "turbo_grill" | "bottom_only"
     * "stepExtraMode": строка программы (например, для мультиварки: "Тушение", "Варка / Суп", "Жарка", "Выпечка", "Томление", "Плов", "На пару")
     * "stepHasLid": true (под крышкой) или false (без крышки)
   - Если на каком-то шаге нужно просто поменять режим нагрева или снять/надеть крышку без добавления новых продуктов — создайте шаг с "isRegimeOnly": true, "foodName": "Готовка содержимого в посуде", "grams": 0.
4. Все сырые ингредиенты (включая "Вода", если используется вода) перечислите в массиве "ingredients" с общим весом в граммах и точным КБЖУ на 100 г сырого продукта. У воды КБЖУ = 0.

Верните СТРОГИЙ JSON следующей структуры:
{
  "name": "Точное название блюда",
  "ingredients": [
    {
      "foodName": "Вода",
      "grams": 1500,
      "category": "drink",
      "nutrientsPer100g": { "calories": 0, "proteins": 0, "fats": 0, "carbs": 0, "fiber": 0 }
    },
    {
      "foodName": "Куриное филе",
      "grams": 400,
      "category": "protein",
      "nutrientsPer100g": { "calories": 113, "proteins": 23.6, "fats": 1.9, "carbs": 0.4, "fiber": 0 }
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
        },
        {
          "foodName": "Куриное филе",
          "grams": 400,
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
    "note": "Краткое описание технологии приготовления и вкусового профиля блюда (2-3 предложения).",
    "nutrientImpact": "Влияние выбранных режимов готовки на сохранность витаминов и макронутриентов (1-2 предложения).",
    "chefTips": "Практический совет шеф-повара для идеального результата (1-2 предложения)."
  }
}
`;

    let responseText = '';

    if (config.provider === 'gemini') {
      const client = getGeminiClient(config.apiKey);
      if (!client) throw new Error('API key missing for Gemini');

      const candidateModels = [
        config.model || 'gemini-3.8-flash',
        'gemini-3.8-flash',
        'gemini-flash-latest',
        'gemini-3.1-flash-lite',
      ];
      const uniqueModels = [...new Set(candidateModels)];

      let lastErr = null;
      for (const m of uniqueModels) {
        try {
          const resp = await client.models.generateContent({
            model: m,
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
            },
          });
          if (resp.text) {
            responseText = resp.text.trim();
            break;
          }
        } catch (/** @type {any} */ err) {
          lastErr = err;
          console.warn(`[aiService.generateRecipeByDishName] Gemini model ${m} error:`, err?.message || err);
        }
      }

      if (!responseText) {
        throw lastErr || new Error('All Gemini candidate models failed');
      }
    } else {
      responseText = await callOpenAICompatible({
        baseURL: config.baseURL || DEFAULT_BASE_URLS[config.provider] || DEFAULT_BASE_URLS.openai,
        apiKey: config.apiKey || '',
        model: config.model || DEFAULT_MODELS[config.provider] || 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        jsonMode: true,
      });
    }

    const cleanJson = extractJsonString(responseText);
    return JSON.parse(cleanJson);
  },
};

export default aiService;
