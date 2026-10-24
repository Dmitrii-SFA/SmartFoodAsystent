import express, { Request, Response } from 'express';
import http from 'http';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import aiService, {
  DEFAULT_MODELS,
  DEFAULT_BASE_URLS,
  normalizeAiConfig,
} from './aiService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Helper to get or lazily init Gemini with optional user-supplied API key
function getGeminiClient(customApiKey?: string): GoogleGenAI | null {
  const apiKey = (customApiKey && typeof customApiKey === 'string' && customApiKey.trim().length > 0)
    ? customApiKey.trim()
    : process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// System instruction explaining Data-Driven UI and the config structure
const SYSTEM_INSTRUCTION = `
You are the AI configuration brain and nutritional assistant for an advanced Data-Driven PWA Calorie & Nutrient Tracker.
The entire user interface of the app (theme, color palette, active language, all tracked metrics like calories, macros, vitamins, minerals, visible sections, meal categories, and the list of installed languages) is dynamically controlled by a single JSON object named "userConfig".

When the user sends a message:
1. Analyze their intent:
   - Does the user want to change goals, add/remove metrics (e.g., Vitamin B12, Iron, Zinc, Water), switch language, change theme ('dark' | 'light' | 'emerald' | 'sunset' | 'cyberpunk' | 'nord'), toggle sections, change layout density, or add new meal categories?
   - Does the user want to add a NEW language (e.g. Polish / польский, German / немецкий, Spanish / испанский, French / французский, Italian / итальянский, etc.)?
   - Does the user want to log food by describing meals (e.g., "Я съел 2 яйца и яблоко, добавь в завтрак")?
   - Or does the user have general nutrition questions?

2. CRITICAL FOR LANGUAGE GENERATION:
   The application maintains a permanent registry of installed languages in "userConfig.installedLanguages":
   [
     { "code": "ru", "name": "Русский", "nativeName": "Русский", "flag": "🇷🇺", "labels": { ... } },
     { "code": "en", "name": "English", "nativeName": "English", "flag": "🇬🇧", "labels": { ... } }
   ]
   When the user asks to add or generate ANY new language (for example, Polish "Polski", German "Deutsch", Spanish "Español", etc.):
   - You MUST generate the COMPLETE translation dictionary for all labels:
     {
       "appTitle": "...",
       "todaySummary": "...",
       "dailyGoal": "...",
       "consumed": "...",
       "remaining": "...",
       "addFood": "...",
       "foodName": "...",
       "amountGrams": "...",
       "selectMeal": "...",
       "cancel": "...",
       "save": "...",
       "delete": "...",
       "chatTitle": "...",
       "chatPlaceholder": "...",
       "chatSend": "...",
       "applyChanges": "...",
       "revertChanges": "...",
       "configTitle": "...",
       "installApp": "...",
       "offlineMode": "...",
       "onlineMode": "...",
       "resetToDefault": "...",
       "exportConfig": "...",
       "importConfig": "..."
     }
   PROTECTED DEFAULT LANGUAGES:
   The languages 'ru' (Russian), 'en' (English), and 'pl' (Polish) are PROTECTED DEFAULT LANGUAGES.
   - You MUST NEVER delete, overwrite, or mutate the 'ru', 'en', or 'pl' language objects in installedLanguages.
   - When the user asks to add ANY new language (e.g. German, Spanish, French, Italian, Portuguese, etc.):
     1. PRESERVE all existing languages (especially 'ru', 'en', 'pl').
     2. APPEND the newly generated language as a separate distinct entry in "newConfig.installedLanguages".
     3. Set "newConfig.language.code" to this new language code and "newConfig.language.labels" to its dictionary.
     4. DO NOT overwrite or modify existing language dictionaries.

   PROTECTED BASE NUTRIENTS, THEMES, AND MEAL CATEGORIES:
   1. PROTECTED BASE NUTRIENTS:
      The nutrients with IDs ["calories", "proteins", "fats", "carbs", "fiber", "water"] are PROTECTED BASE NUTRIENTS.
      - You MUST NEVER delete or remove these nutrients from newConfig.metrics! Even if the user asks "удали белки" or "удали калории", politely explain that base nutrients are protected and cannot be deleted (their target can be adjusted, but the metric itself must remain).
      - New vitamins/minerals (e.g., Vitamin B12, Vitamin D, Magnesium, Iron, Zinc) can be added or removed freely.
   2. PROTECTED BASE THEMES:
      The themes ["dark", "light", "emerald", "sunset", "cyberpunk", "nord"] are PROTECTED. "newConfig.theme.mode" must always be one of these valid themes.
   3. PROTECTED BASE MEAL CATEGORIES:
      The meal categories with IDs ["breakfast", "lunch", "dinner", "snack"] are PROTECTED BASE MEAL CATEGORIES.
      - You MUST NEVER delete or remove these categories, nor change their IDs or core purpose.
      - Additional custom meal categories (e.g. "afternoon_snack" / "Полдник", "brunch" / "Бранч") can be added or removed as requested, but the 4 base meals must always remain intact.

3. Output a strictly structured JSON response with:
   - "assistantMessage": (string) A friendly, concise explanation in the user's active language describing what you did or answered.
   - "updatedConfig": (object or null) If any configuration changes were requested, return the FULL valid updated userConfig object preserving all existing fields (especially installedLanguages with ru, en, pl, and protected base metrics & meals).
   - "summaryOfChanges": (string or null) A brief 1-sentence note of what changed.
   - "suggestedMealsToAdd": (array of objects or null) If the user mentioned food eaten, calculate accurate estimated nutrients based on standard nutritional tables.
`;

const POLISH_LABELS = {
  appTitle: 'PWA Kalkulator Kalorii',
  todaySummary: 'Podsumowanie dnia',
  dailyGoal: 'Cel dzienny',
  consumed: 'Spożyto',
  remaining: 'Pozostało',
  addFood: 'Dodaj posiłek',
  foodName: 'Nazwa produktu lub dania',
  amountGrams: 'Waga porcji (gramy)',
  selectMeal: 'Kategoria posiłku',
  cancel: 'Anuluj',
  save: 'Zapisz',
  delete: 'Usuń',
  chatTitle: 'Asystent AI Gemini Flash',
  chatPlaceholder: 'Poproś Gemini o zmianę celów, motywu, dodanie witamin lub posiłku...',
  chatSend: 'Wyślij',
  applyChanges: 'Zastosuj zmiany',
  revertChanges: 'Cofnij',
  configTitle: 'userConfig.json (Data-Driven UI)',
  installApp: 'Zainstaluj PWA',
  offlineMode: 'Tryb offline — dane zapisane lokalnie',
  onlineMode: 'Połączono z siecią',
  resetToDefault: 'Przywróć domyślne',
  exportConfig: 'Eksportuj JSON',
  importConfig: 'Importuj JSON',
};

const GERMAN_LABELS = {
  appTitle: 'PWA Kalorienzähler',
  todaySummary: 'Tagesübersicht',
  dailyGoal: 'Tagesziel',
  consumed: 'Verbraucht',
  remaining: 'Verbleibend',
  addFood: 'Mahlzeit hinzufügen',
  foodName: 'Lebensmittel- oder Gerichtsname',
  amountGrams: 'Portionsgewicht (Gramm)',
  selectMeal: 'Mahlzeitenkategorie',
  cancel: 'Abbrechen',
  save: 'Speichern',
  delete: 'Löschen',
  chatTitle: 'Gemini Flash KI-Assistent',
  chatPlaceholder: 'Bitten Sie Gemini, Ziele, Design oder Vitamine anzupassen...',
  chatSend: 'Senden',
  applyChanges: 'Änderungen übernehmen',
  revertChanges: 'Rückgängig machen',
  configTitle: 'userConfig.json (Data-Driven UI)',
  installApp: 'PWA installieren',
  offlineMode: 'Offline-Modus — Daten lokal gespeichert',
  onlineMode: 'Mit dem Netzwerk verbunden',
  resetToDefault: 'Auf Standard zurücksetzen',
  exportConfig: 'JSON exportieren',
  importConfig: 'JSON importieren',
};

const SPANISH_LABELS = {
  appTitle: 'PWA Calculadora de Calorías',
  todaySummary: 'Resumen Diario',
  dailyGoal: 'Objetivo Diario',
  consumed: 'Consumido',
  remaining: 'Restante',
  addFood: 'Añadir Comida',
  foodName: 'Nombre del alimento o plato',
  amountGrams: 'Peso de la porción (gramos)',
  selectMeal: 'Categoría de comida',
  cancel: 'Cancelar',
  save: 'Guardar',
  delete: 'Eliminar',
  chatTitle: 'Asistente IA Gemini Flash',
  chatPlaceholder: 'Pide a Gemini ajustar objetivos, tema, añadir vitaminas o registrar comidas...',
  chatSend: 'Enviar',
  applyChanges: 'Aplicar Cambios',
  revertChanges: 'Revertir',
  configTitle: 'userConfig.json (Data-Driven UI)',
  installApp: 'Instalar PWA',
  offlineMode: 'Modo Offline — datos guardados localmente',
  onlineMode: 'Conectado a la red',
  resetToDefault: 'Restablecer por defecto',
  exportConfig: 'Exportar JSON',
  importConfig: 'Importar JSON',
};

// Helper to execute command locally if Gemini API experiences transient 503 high-demand spikes
function processCommandLocally(message: string, currentConfig: any) {
  const text = message.toLowerCase().trim();
  const newConfig = JSON.parse(JSON.stringify(currentConfig || {}));
  const changes: string[] = [];
  const suggestedMeals: any[] = [];

  // Ensure protected default languages (RU, EN, PL) are initialized and intact
  const protectedDefaults = [
    { code: 'ru', name: 'Russian', nativeName: 'Русский', isProtected: true, labels: newConfig.language?.labels || {} },
    { code: 'en', name: 'English', nativeName: 'English', isProtected: true, labels: {} },
    { code: 'pl', name: 'Polish', nativeName: 'Polski', isProtected: true, labels: POLISH_LABELS },
  ];
  if (!newConfig.installedLanguages || !Array.isArray(newConfig.installedLanguages)) {
    newConfig.installedLanguages = [...protectedDefaults];
  } else {
    protectedDefaults.forEach((p) => {
      const existing = newConfig.installedLanguages.find((l: any) => l.code.slice(0, 2).toLowerCase() === p.code.toLowerCase());
      if (!existing) {
        newConfig.installedLanguages.push(p);
      } else {
        existing.isProtected = true;
      }
    });
  }

  // 0. Full factory reset / restore original program
  if (
    text.includes('сбрось к заводск') ||
    text.includes('восстанови первоначальн') ||
    text.includes('сбрось к начальным') ||
    text.includes('restore default') ||
    text.includes('reset to default')
  ) {
    const factoryConfig = {
      version: (newConfig.version || 1) + 1,
      userName: 'Дмитрий',
      language: {
        code: 'ru',
        labels: newConfig.installedLanguages?.find((l: any) => l.code === 'ru')?.labels || {},
      },
      installedLanguages: newConfig.installedLanguages,
      theme: {
        mode: 'dark',
        accentColor: '#10b981',
        borderRadius: 'rounded-2xl',
        cardGlassEffect: true,
        density: 'comfortable',
        fontScale: 'base',
      },
      metrics: [
        { id: 'calories', label: 'Калории', shortLabel: 'Ккал', unit: 'ккал', target: 2200, color: '#f59e0b', isMainMacro: true, showInSummary: true, showInDetailList: true, showInFoodForm: true, category: 'energy', icon: 'Flame', isProtected: true },
        { id: 'proteins', label: 'Белки', shortLabel: 'Б', unit: 'г', target: 140, color: '#ef4444', isMainMacro: true, showInSummary: true, showInDetailList: true, showInFoodForm: true, category: 'macro', icon: 'Beef', isProtected: true },
        { id: 'fats', label: 'Жиры', shortLabel: 'Ж', unit: 'г', target: 70, color: '#3b82f6', isMainMacro: true, showInSummary: true, showInDetailList: true, showInFoodForm: true, category: 'macro', icon: 'Droplet', isProtected: true },
        { id: 'carbs', label: 'Углеводы', shortLabel: 'У', unit: 'г', target: 250, color: '#10b981', isMainMacro: true, showInSummary: true, showInDetailList: true, showInFoodForm: true, category: 'macro', icon: 'Wheat', isProtected: true },
        { id: 'fiber', label: 'Клетчатка', shortLabel: 'Кл', unit: 'г', target: 30, color: '#8b5cf6', isMainMacro: false, showInSummary: true, showInDetailList: true, showInFoodForm: true, category: 'fiber', icon: 'Apple', isProtected: true },
        { id: 'water', label: 'Вода', shortLabel: 'H2O', unit: 'мл', target: 2200, color: '#06b6d4', isMainMacro: false, showInSummary: true, showInDetailList: true, showInFoodForm: false, category: 'hydration', icon: 'Droplet', isProtected: true },
      ],
      mealCategories: [
        { id: 'breakfast', name: 'Завтрак', icon: 'Coffee', targetCaloriesPercent: 25, isProtected: true },
        { id: 'lunch', name: 'Обед', icon: 'Utensils', targetCaloriesPercent: 35, isProtected: true },
        { id: 'dinner', name: 'Ужин', icon: 'Moon', targetCaloriesPercent: 25, isProtected: true },
        { id: 'snack', name: 'Перекус', icon: 'Cookie', targetCaloriesPercent: 15, isProtected: true },
      ],
      sections: {
        heroSummary: true,
        macroRings: true,
        micronutrientsGrid: true,
        mealTimeline: true,
        quickStatsBar: true,
        aiChatWidget: true,
        jsonConfigPreview: false,
      },
    };

    return {
      assistantMessage: 'Первоначальная программа и все заводские настройки успешно восстановлены!',
      summaryOfChanges: 'Восстановлена первоначальная программа (базовые цели КБЖУ, приёмы пищи и тема)',
      updatedConfig: factoryConfig,
      suggestedMealsToAdd: null,
    };
  }

  // 1. Language addition or switching
  if (text.includes('польск') || text.includes('polski') || text.includes('polish') || text.includes('pl')) {
    const plLang = newConfig.installedLanguages.find((l: any) => l.code.slice(0, 2).toLowerCase() === 'pl');
    newConfig.language = {
      code: 'pl',
      labels: plLang?.labels || POLISH_LABELS,
    };

    // Translate metrics to Polish
    const metricTranslations: Record<string, string> = {
      calories: 'Kalorie',
      proteins: 'Białka',
      fats: 'Tłuszcze',
      carbs: 'Węglowodany',
      fiber: 'Błonnik',
      water: 'Woda',
      vitaminC: 'Witamina C',
      vitaminD: 'Witamina D',
      iron: 'Żelazo',
      calcium: 'Wapń',
      potassium: 'Potas',
      magnesium: 'Magnez',
      vitaminB12: 'Witamina B12',
    };
    newConfig.metrics?.forEach((m: any) => {
      if (metricTranslations[m.id]) m.label = metricTranslations[m.id];
    });

    // Translate meals to Polish
    const mealTranslations: Record<string, string> = {
      breakfast: 'Śniadanie',
      lunch: 'Obiad',
      dinner: 'Kolacja',
      snack: 'Przekąska',
      afternoon_snack: 'Podwieczorek',
    };
    newConfig.mealCategories?.forEach((c: any) => {
      if (mealTranslations[c.id]) c.name = mealTranslations[c.id];
    });

    changes.push('Активирован защищённый польский язык (PL)');
  } else if (text.includes('немецк') || text.includes('deutsch') || text.includes('german') || text.includes('de')) {
    const deLang = {
      code: 'de',
      name: 'Немецкий',
      nativeName: 'Deutsch',
      isProtected: false,
      labels: GERMAN_LABELS,
    };
    if (!newConfig.installedLanguages.some((l: any) => l.code.slice(0, 2).toLowerCase() === 'de')) {
      newConfig.installedLanguages.push(deLang);
    }
    newConfig.language = {
      code: 'de',
      labels: GERMAN_LABELS,
    };
    changes.push('Добавлен новый язык (DE) без изменения базовых языков');
  } else if (text.includes('испанск') || text.includes('español') || text.includes('spanish') || text.includes('es')) {
    const esLang = {
      code: 'es',
      name: 'Испанский',
      nativeName: 'Español',
      isProtected: false,
      labels: SPANISH_LABELS,
    };
    if (!newConfig.installedLanguages.some((l: any) => l.code.slice(0, 2).toLowerCase() === 'es')) {
      newConfig.installedLanguages.push(esLang);
    }
    newConfig.language = {
      code: 'es',
      labels: SPANISH_LABELS,
    };
    changes.push('Добавлен новый язык (ES) без изменения базовых языков');
  } else if (text.includes('английск') || text.includes('english') || text.includes('switch to en')) {
    const enLang = newConfig.installedLanguages.find((l: any) => l.code.slice(0, 2).toLowerCase() === 'en');
    newConfig.language = {
      code: 'en',
      labels: enLang?.labels || {},
    };
    changes.push('Language switched to EN (protected default)');
  } else if (text.includes('русск') || text.includes('russian') || text.includes('switch to ru')) {
    const ruLang = newConfig.installedLanguages.find((l: any) => l.code.slice(0, 2).toLowerCase() === 'ru');
    newConfig.language = {
      code: 'ru',
      labels: ruLang?.labels || {},
    };
    changes.push('Активирован русский язык (RU, защищённый)');
  }

  // 1. Protein goal change
  const proteinMatch = text.match(/(?:белк[а-я]*|protein)\D*?(\d{2,4})\s*(?:г|g)?/i);
  if (proteinMatch) {
    const val = parseInt(proteinMatch[1], 10);
    const m = newConfig.metrics?.find((x: any) => x.id === 'proteins' || x.category === 'macro' && x.id.includes('prot'));
    if (m) {
      m.target = val;
      changes.push(`Норма белка изменена на ${val} г`);
    }
  }

  // 2. Calories goal change
  const calorieMatch = text.match(/(?:калор[а-я]*|calor[a-z]*|ккал|kcal)\D*?(\d{3,5})/i);
  if (calorieMatch) {
    const val = parseInt(calorieMatch[1], 10);
    const m = newConfig.metrics?.find((x: any) => x.id === 'calories' || x.category === 'energy');
    if (m) {
      m.target = val;
      changes.push(`Суточная норма калорий установлена: ${val} ккал`);
    }
  }

  // 3. Fats goal change
  const fatsMatch = text.match(/(?:жир[а-я]*|fat[s]?)\D*?(\d{2,3})\s*(?:г|g)?/i);
  if (fatsMatch) {
    const val = parseInt(fatsMatch[1], 10);
    const m = newConfig.metrics?.find((x: any) => x.id === 'fats');
    if (m) {
      m.target = val;
      changes.push(`Норма жиров изменена на ${val} г`);
    }
  }

  // 4. Carbs goal change
  const carbsMatch = text.match(/(?:углев[а-я]*|carb[s]?)\D*?(\d{2,4})\s*(?:г|g)?/i);
  if (carbsMatch) {
    const val = parseInt(carbsMatch[1], 10);
    const m = newConfig.metrics?.find((x: any) => x.id === 'carbs');
    if (m) {
      m.target = val;
      changes.push(`Норма углеводов изменена на ${val} г`);
    }
  }

  // 5. Theme changes
  if (text.includes('изумруд') || text.includes('emerald')) {
    if (!newConfig.theme) newConfig.theme = {};
    newConfig.theme.mode = 'emerald';
    newConfig.theme.accentColor = '#10b981';
    changes.push('Включена изумрудная тема (Emerald)');
  } else if (text.includes('закат') || text.includes('sunset')) {
    if (!newConfig.theme) newConfig.theme = {};
    newConfig.theme.mode = 'sunset';
    newConfig.theme.accentColor = '#f97316';
    changes.push('Включена тема Sunset (теплые тона)');
  } else if (text.includes('киберпанк') || text.includes('cyberpunk')) {
    if (!newConfig.theme) newConfig.theme = {};
    newConfig.theme.mode = 'cyberpunk';
    newConfig.theme.accentColor = '#06b6d4';
    changes.push('Включена неоновая тема Cyberpunk');
  } else if (text.includes('норд') || text.includes('nord')) {
    if (!newConfig.theme) newConfig.theme = {};
    newConfig.theme.mode = 'nord';
    newConfig.theme.accentColor = '#38bdf8';
    changes.push('Включена арктическая тема Nord');
  } else if (text.includes('темн') || text.includes('dark')) {
    if (!newConfig.theme) newConfig.theme = {};
    newConfig.theme.mode = 'dark';
    newConfig.theme.accentColor = '#10b981';
    changes.push('Включена классическая темная тема');
  } else if (text.includes('светл') || text.includes('light')) {
    if (!newConfig.theme) newConfig.theme = {};
    newConfig.theme.mode = 'light';
    changes.push('Включена светлая тема');
  }

  // 6. Language changes
  if (text.includes('английск') || text.includes('english') || text.includes('switch to en')) {
    if (!newConfig.language) newConfig.language = { code: 'en', labels: {} };
    newConfig.language.code = 'en';
    changes.push('Language switched to English');
  } else if (text.includes('русск') || text.includes('russian') || text.includes('switch to ru')) {
    if (!newConfig.language) newConfig.language = { code: 'ru', labels: {} };
    newConfig.language.code = 'ru';
    changes.push('Язык переключен на русский');
  }

  // 7. Add Vitamin B12
  if (text.includes('b12') || text.includes('б12')) {
    const existing = newConfig.metrics?.find((m: any) => m.id === 'vitaminB12');
    const targetVal = text.match(/(\d+(?:\.\d+)?)\s*(?:мкг|mcg)?/)?.[1] || 2.4;
    if (!existing) {
      newConfig.metrics?.push({
        id: 'vitaminB12',
        label: 'Витамин B12',
        shortLabel: 'Vit B12',
        unit: 'мкг',
        target: parseFloat(String(targetVal)),
        color: '#8b5cf6',
        isMainMacro: false,
        showInSummary: true,
        showInDetailList: true,
        showInFoodForm: true,
        category: 'vitamin',
        icon: 'Pill',
      });
      changes.push(`Добавлен учет Витамина B12 (норма: ${targetVal} мкг)`);
    } else {
      existing.target = parseFloat(String(targetVal));
      existing.showInSummary = true;
      existing.showInDetailList = true;
      changes.push(`Обновлена норма Витамина B12: ${targetVal} мкг`);
    }
  }

  // 8. Add Magnesium
  if (text.includes('магний') || text.includes('magnesium')) {
    const existing = newConfig.metrics?.find((m: any) => m.id === 'magnesium');
    if (!existing) {
      newConfig.metrics?.push({
        id: 'magnesium',
        label: 'Магний',
        shortLabel: 'Mg',
        unit: 'мг',
        target: 400,
        color: '#38bdf8',
        showInSummary: true,
        showInDetailList: true,
        showInFoodForm: true,
        category: 'mineral',
        icon: 'Sparkles',
      });
      changes.push('Добавлен учет Магния (норма: 400 мг)');
    }
  }

  // 9. Hide / Show vitamins
  if (text.includes('скрой витамины') || text.includes('убери витамины') || text.includes('hide vitamin')) {
    newConfig.metrics?.forEach((m: any) => {
      if (m.category === 'vitamin' || m.category === 'mineral') {
        m.showInDetailList = false;
        m.showInSummary = false;
      }
    });
    changes.push('Микронутриенты и витамины скрыты из основного списка');
  } else if (text.includes('покажи витамины') || text.includes('show vitamin')) {
    newConfig.metrics?.forEach((m: any) => {
      if (m.category === 'vitamin' || m.category === 'mineral') {
        m.showInDetailList = true;
      }
    });
    changes.push('Отображение витаминов включено');
  }

  // Check for forbidden attempts to delete or mutate protected base nutrients or meals
  const forbiddenNutrientMatch = text.match(/(?:удали|сотри|delete|remove)\D*?(?:калори|белк|жир|углевод|клетчатк|вод|calorie|protein|fat|carb|fiber|water)/i);
  if (forbiddenNutrientMatch) {
    changes.push('Базовые нутриенты (калории, белки, жиры, углеводы, клетчатка, вода) защищены от удаления. Их целевые значения можно менять, но сами нутриенты удалить невозможно');
  }

  const forbiddenMealMatch = text.match(/(?:удали|измени|переименуй|delete|remove)\D*?(?:завтрак|обед|ужин|перекус|breakfast|lunch|dinner|snack)/i);
  if (forbiddenMealMatch && (text.includes('удали') || text.includes('delete') || text.includes('remove'))) {
    changes.push('Базовые приёмы пищи (Завтрак, Обед, Ужин, Перекус) защищены от удаления');
  }

  // 10. Add Meal Category (e.g. Полдник)
  if (text.includes('полдник')) {
    const existing = newConfig.mealCategories?.find((c: any) => c.id === 'afternoon_snack');
    if (!existing) {
      newConfig.mealCategories?.push({
        id: 'afternoon_snack',
        name: 'Полдник',
        icon: 'Cookie',
        targetCaloriesPercent: 10,
      });
      changes.push('Добавлена новая категория приема пищи: «Полдник» (10% калорий)');
    }
  }

  // 11. Food logging recognition
  if (text.includes('яйц') || text.includes('яйцо') || text.includes('яйца')) {
    suggestedMeals.push({
      mealCategoryId: text.includes('обед') ? 'lunch' : text.includes('ужин') ? 'dinner' : 'breakfast',
      name: 'Яйца вареные (2 шт)',
      amountGrams: 110,
      nutrients: { calories: 155, proteins: 13, fats: 11, carbs: 1.1, iron: 1.8, vitaminD: 2.0 },
    });
  }
  if (text.includes('овсянк') || text.includes('тост') || text.includes('авокадо') || text.includes('гречк') || text.includes('куриц')) {
    if (text.includes('авокадо')) {
      suggestedMeals.push({
        mealCategoryId: 'breakfast',
        name: 'Тост с авокадо',
        amountGrams: 90,
        nutrients: { calories: 190, proteins: 3.5, fats: 12, carbs: 18, fiber: 4.5 },
      });
    } else if (text.includes('гречк') || text.includes('куриц')) {
      suggestedMeals.push({
        mealCategoryId: 'lunch',
        name: 'Куриное филе с гречкой',
        amountGrams: 280,
        nutrients: { calories: 420, proteins: 44, fats: 7, carbs: 42, fiber: 4.2 },
      });
    }
  }

  const hasConfigChanges = changes.length > 0;
  const summary = hasConfigChanges ? changes.join('; ') : null;

  return {
    assistantMessage: hasConfigChanges
      ? `Готово! ${changes.join('. ')}.`
      : suggestedMeals.length > 0
      ? `Я подготовил блюда для записи в дневник: ${suggestedMeals.map((m) => m.name).join(', ')}.`
      : `Ваш запрос принят. Текущий профиль: ${newConfig.metrics?.length || 0} метрик, цель калорий: ${newConfig.metrics?.find((m: any) => m.id === 'calories')?.target || 2000} ккал. Чем еще помочь?`,
    summaryOfChanges: summary,
    updatedConfig: hasConfigChanges ? newConfig : null,
    suggestedMealsToAdd: suggestedMeals.length > 0 ? suggestedMeals : null,
  };
}

// Helper to resolve aiConfig from request body (supporting legacy customApiKey and new aiConfig)
function resolveAiConfigFromReq(req: Request) {
  if (req.body.aiConfig && typeof req.body.aiConfig === 'object') {
    return normalizeAiConfig(req.body.aiConfig);
  }
  const customKey = req.body.customApiKey;
  return normalizeAiConfig({
    provider: 'gemini',
    apiKey: customKey || undefined,
  });
}

// API Route: Providers metadata
app.get('/api/ai/providers', (_req: Request, res: Response) => {
  res.json({
    providers: [
      { id: 'gemini', name: 'Google Gemini', defaultModel: DEFAULT_MODELS.gemini, baseURL: DEFAULT_BASE_URLS.gemini },
      { id: 'openai', name: 'OpenAI (ChatGPT)', defaultModel: DEFAULT_MODELS.openai, baseURL: DEFAULT_BASE_URLS.openai },
      { id: 'openrouter', name: 'OpenRouter', defaultModel: DEFAULT_MODELS.openrouter, baseURL: DEFAULT_BASE_URLS.openrouter },
      { id: 'custom', name: 'Custom OpenAI-совместимый', defaultModel: DEFAULT_MODELS.custom, baseURL: DEFAULT_BASE_URLS.custom },
    ],
    defaultModels: DEFAULT_MODELS,
    defaultBaseURLs: DEFAULT_BASE_URLS,
  });
});

// API Route: Test AI connection
app.post('/api/ai/test', async (req: Request, res: Response) => {
  try {
    const aiConfig = resolveAiConfigFromReq(req);
    const result = await aiService.testConnection(aiConfig);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err?.message || 'Ошибка проверки соединения',
    });
  }
});

// API Route: Chat and Configuration update
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { message, currentConfig, history = [], demoRequestsUsed = 0 } = req.body;

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    const aiConfig = resolveAiConfigFromReq(req);
    const hasCustomKey = Boolean(aiConfig.apiKey && aiConfig.apiKey.trim().length > 0);

    // If using default Gemini without custom key and demo limit is exceeded:
    if (aiConfig.provider === 'gemini' && !hasCustomKey && demoRequestsUsed >= 10) {
      res.json({
        assistantMessage:
          '⚠️ Вы исчерпали лимит бесплатного демо-ассистента (10 запросов в день).\n\nЧтобы продолжить пользоваться ИИ без ограничений, пожалуйста, введите свой собственный API-ключ Google Gemini, OpenAI или OpenRouter в настройках приложения.',
        summaryOfChanges: null,
        updatedConfig: null,
        suggestedMealsToAdd: null,
        isLimitReached: true,
        action: 'open_api_key_modal',
        remainingRequests: 0,
      });
      return;
    }

    let parsed: any = null;

    try {
      parsed = await aiService.generateChatResponse({
        message,
        currentConfig,
        history,
        aiConfig,
        systemInstruction: SYSTEM_INSTRUCTION,
      });
    } catch (aiErr: any) {
      console.warn('AI call via aiService failed, attempting local processor:', aiErr?.message || aiErr);
      parsed = processCommandLocally(message, currentConfig);
    }

    // Sanitize and enforce protected entities in updatedConfig before returning to client
    if (parsed && parsed.updatedConfig) {
      // 1. Enforce protected base metrics
      const PROTECTED_BASE_METRIC_IDS = ['calories', 'proteins', 'fats', 'carbs', 'fiber', 'water'];
      if (!Array.isArray(parsed.updatedConfig.metrics)) {
        parsed.updatedConfig.metrics = currentConfig?.metrics || [];
      } else {
        PROTECTED_BASE_METRIC_IDS.forEach((baseId) => {
          const exists = parsed.updatedConfig.metrics.some((m: any) => m.id === baseId);
          if (!exists) {
            const original = (currentConfig?.metrics || []).find((m: any) => m.id === baseId);
            if (original) {
              parsed.updatedConfig.metrics.unshift({ ...original, isProtected: true });
            }
          } else {
            const m = parsed.updatedConfig.metrics.find((x: any) => x.id === baseId);
            if (m) m.isProtected = true;
          }
        });
      }

      // 2. Enforce protected base meal categories
      const PROTECTED_BASE_MEAL_IDS = ['breakfast', 'lunch', 'dinner', 'snack'];
      if (!Array.isArray(parsed.updatedConfig.mealCategories)) {
        parsed.updatedConfig.mealCategories = currentConfig?.mealCategories || [];
      } else {
        PROTECTED_BASE_MEAL_IDS.forEach((baseId) => {
          const exists = parsed.updatedConfig.mealCategories.some((c: any) => c.id === baseId);
          if (!exists) {
            const original = (currentConfig?.mealCategories || []).find((c: any) => c.id === baseId);
            if (original) {
              parsed.updatedConfig.mealCategories.push({ ...original, isProtected: true });
            }
          } else {
            const c = parsed.updatedConfig.mealCategories.find((x: any) => x.id === baseId);
            if (c) c.isProtected = true;
          }
        });
      }

      // 3. Enforce protected themes
      const VALID_THEMES = ['dark', 'light', 'emerald', 'sunset', 'cyberpunk', 'nord'];
      if (parsed.updatedConfig.theme && !VALID_THEMES.includes(parsed.updatedConfig.theme.mode)) {
        parsed.updatedConfig.theme.mode = currentConfig?.theme?.mode || 'dark';
      }
    }

    res.json(parsed);
  } catch (error: any) {
    console.error('Error in /api/chat, falling back to local processor:', error);
    try {
      const fallback = processCommandLocally(req.body.message || '', req.body.currentConfig || {});
      res.json(fallback);
    } catch (fallbackErr) {
      res.status(500).json({
        error: 'Failed to process AI chat request',
        details: error?.message || String(error),
      });
    }
  }
});

// API Route: AI Nutrition food estimator
app.post('/api/food/estimate', async (req: Request, res: Response) => {
  try {
    const { query, metrics } = req.body;
    if (!query) {
      res.status(400).json({ error: 'Query is required' });
      return;
    }

    const aiConfig = resolveAiConfigFromReq(req);
    const data = await aiService.estimateFoodNutrients({
      query,
      metrics,
      aiConfig,
    });
    res.json(data);
  } catch (error: any) {
    console.error('Error in /api/food/estimate:', error);
    res.status(500).json({ error: 'Food estimation failed', details: error?.message });
  }
});

// API Route: Multimodal analysis for food label and dish photo
app.post('/api/food/analyze-photo', async (req: Request, res: Response) => {
  try {
    const { imageBase64, mode = 'label', foodName = '' } = req.body;

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      res.status(400).json({ error: 'imageBase64 is required' });
      return;
    }

    const aiConfig = resolveAiConfigFromReq(req);
    const parsedData = await aiService.analyzeFoodPhoto({
      imageBase64,
      mode,
      foodName,
      aiConfig,
    });
    res.json(parsedData);
  } catch (error: any) {
    console.error('Error in /api/food/analyze-photo:', error);
    res.status(500).json({
      error: 'Photo analysis failed',
      details: error?.message || 'Не удалось распознать фото',
    });
  }
});

// API Route: AI Lifestyle and Activity Adjustment for Mifflin-St Jeor TDEE
app.post('/api/nutrition/ai-tdee', async (req: Request, res: Response) => {
  try {
    const { gender = 'male', age = 30, heightCm = 178, weightKg = 75, activityPrompt = '' } = req.body;

    let bmr = 10 * Number(weightKg) + 6.25 * Number(heightCm) - 5 * Number(age);
    bmr += gender === 'male' ? 5 : -161;
    bmr = Math.round(bmr);

    const aiConfig = resolveAiConfigFromReq(req);

    try {
      const data = await aiService.estimateTdee({
        gender,
        age,
        heightCm,
        weightKg,
        activityPrompt,
        bmr,
        aiConfig,
      });
      res.json(data);
    } catch (aiErr: any) {
      const fallbackTdee = Math.round(bmr * 1.4);
      res.json({
        bmr,
        recommendedCalories: fallbackTdee,
        explanation: 'Базовый метаболизм рассчитан по формуле Миффлина-Сан Жеора с умеренным коэффициентом активности.',
      });
    }
  } catch (error: any) {
    console.error('Error in /api/nutrition/ai-tdee:', error);
    res.status(500).json({ error: 'AI TDEE failed', details: error?.message });
  }
});

// API Route: AI Generate Custom Metric
app.post('/api/nutrition/generate-metric', async (req: Request, res: Response) => {
  try {
    const { metricName = '' } = req.body;
    if (!metricName.trim()) {
      res.status(400).json({ error: 'metricName is required' });
      return;
    }

    const aiConfig = resolveAiConfigFromReq(req);
    try {
      const parsed = await aiService.generateCustomMetric({
        metricName,
        aiConfig,
      });
      res.json(parsed);
    } catch (aiErr) {
      res.json({
        id: `metric_${Date.now()}`,
        label: metricName.trim(),
        unit: 'мг',
        target: 100,
        color: '#10b981',
        category: 'custom',
        icon: 'Sparkles',
        isPrimary: false,
        showInSummary: true,
        showInDetailList: true,
        showInFoodForm: true,
        showInProducts: true,
        isProtected: false,
      });
    }
  } catch (error: any) {
    console.error('Error in /api/nutrition/generate-metric:', error);
    res.status(500).json({ error: 'Generate metric failed', details: error?.message });
  }
});

// API Route: AI Cooking Process & Thermal Physics Analysis
app.post('/api/recipes/analyze-cooking', async (req: Request, res: Response) => {
  try {
    const {
      vessels = [],
      ingredients = [],
      totalRawWeightGrams = 0,
      calculatedEvaporationMl = 0,
      finalDishWeightGrams = 0,
    } = req.body;

    const aiConfig = resolveAiConfigFromReq(req);

    try {
      const analysis = await aiService.analyzeCookingProcess({
        vessels,
        ingredients,
        totalRawWeightGrams,
        calculatedEvaporationMl,
        finalDishWeightGrams,
        aiConfig,
      });
      res.json({ success: true, analysis });
    } catch (aiErr: any) {
      console.warn('AI Cooking analysis fallback:', aiErr?.message);
      // Fallback response with expert culinary rule-of-thumb
      const fallbackAnalysis = {
        note: `При термической обработке испарилось около ${calculatedEvaporationMl} мл влаги. Бульон приобрел насыщенную консистенцию за счет постепенной экстракции белков и коллагена из мясных волокон, а пассерованные овощи обогатили аромат блюда.`,
        nutrientImpact: `Длительное томление частично снижает термолабильный витамин C, однако водорастворимые минералы (калий, натрий, фосфор) полностью сохранены в бульоне. Жирорастворимый бета-каротин моркови перешел в легкоусвояемую форму благодаря пассеровке в масле.`,
        chefTips: `Для максимальной прозрачности бульона поддерживайте слабый огонь без бурного кипения (режим 2–3 на электроплите или томление на газе). Добавляйте свежую зелень и чеснок за 2 минуты до выключения.`,
        recommendedFinalWeightGrams: finalDishWeightGrams,
      };
      res.json({ success: true, analysis: fallbackAnalysis });
    }
  } catch (error: any) {
    console.error('Error in /api/recipes/analyze-cooking:', error);
    res.status(500).json({ error: 'Cooking analysis failed', details: error?.message });
  }
});

// Helper fallback for AI Recipe Generation if AI provider is temporarily unavailable
function generateRecipeFallback(dishName: string) {
  const title = dishName.trim();
  const lower = title.toLowerCase();

  if (lower.includes('салат') || lower.includes('цезарь') || lower.includes('греческий')) {
    return {
      name: title,
      ingredients: [
        { foodName: 'Куриное филе', grams: 200, category: 'protein', nutrientsPer100g: { calories: 113, proteins: 23.6, fats: 1.9, carbs: 0.4, fiber: 0 } },
        { foodName: 'Томаты черри', grams: 150, category: 'vegetable', nutrientsPer100g: { calories: 20, proteins: 0.9, fats: 0.2, carbs: 3.9, fiber: 1.2 } },
        { foodName: 'Листья салата', grams: 100, category: 'vegetable', nutrientsPer100g: { calories: 15, proteins: 1.4, fats: 0.2, carbs: 2.9, fiber: 1.3 } },
        { foodName: 'Сыр твердый', grams: 50, category: 'dairy', nutrientsPer100g: { calories: 360, proteins: 25, fats: 29, carbs: 0, fiber: 0 } },
        { foodName: 'Масло оливковое', grams: 15, category: 'custom', nutrientsPer100g: { calories: 884, proteins: 0, fats: 99.8, carbs: 0, fiber: 0 } },
      ],
      vessels: [
        {
          id: 'vessel-1',
          name: 'Салатник (Сборка салата)',
          icon: '🥗',
          type: 'custom',
          heatSource: 'electric',
          electricLevel: 5,
          gasLevel: 'medium',
          hasLid: false,
          startOffsetMinutes: 0,
          stepItems: [
            { foodName: 'Листья салата', grams: 100, addedAtMinute: 0, durationMinutes: 5, hasThermalProcessing: false },
            { foodName: 'Томаты черри', grams: 150, addedAtMinute: 0, durationMinutes: 5, hasThermalProcessing: false },
            { foodName: 'Содержимое: Сковорода (Обжарка филе)', grams: 170, addedAtMinute: 12, durationMinutes: 3, hasThermalProcessing: false, sourceVesselId: 'vessel-2' },
            { foodName: 'Сыр твердый', grams: 50, addedAtMinute: 12, durationMinutes: 3, hasThermalProcessing: false },
            { foodName: 'Масло оливковое', grams: 15, addedAtMinute: 12, durationMinutes: 3, hasThermalProcessing: false },
          ],
        },
        {
          id: 'vessel-2',
          name: 'Сковорода (Обжарка филе)',
          icon: '🍳',
          type: 'pan',
          heatSource: 'electric',
          electricLevel: 7,
          gasLevel: 'high',
          hasLid: false,
          startOffsetMinutes: 0,
          stepItems: [
            { foodName: 'Куриное филе', grams: 200, addedAtMinute: 0, durationMinutes: 12, hasThermalProcessing: true, stepHeatSource: 'electric', stepElectricLevel: 7, stepGasLevel: 'high', stepHasLid: false },
          ],
        },
      ],
      aiAnalysis: {
        note: `Быстрая обжарка филе до золотистой корочки с последующим соединением со свежими овощами без термообработки в салатнике.`,
        nutrientImpact: `Свежие овощи без нагрева сохраняют 100% витамина C и фолатов, а оливковое масло способствует усвоению жирорастворимых витаминов.`,
        chefTips: `Дайте обжаренному филе остыть 2–3 минуты перед добавлением к листьям салата, чтобы зелень осталась хрустящей.`,
      },
    };
  }

  return {
    name: title,
    ingredients: [
      { foodName: 'Вода', grams: 600, category: 'drink', nutrientsPer100g: { calories: 0, proteins: 0, fats: 0, carbs: 0, fiber: 0 } },
      { foodName: 'Куриное филе', grams: 400, category: 'protein', nutrientsPer100g: { calories: 113, proteins: 23.6, fats: 1.9, carbs: 0.4, fiber: 0 } },
      { foodName: 'Рис круглозерный', grams: 250, category: 'grain', nutrientsPer100g: { calories: 344, proteins: 6.7, fats: 0.7, carbs: 78.9, fiber: 0.8 } },
      { foodName: 'Морковь свежая', grams: 150, category: 'vegetable', nutrientsPer100g: { calories: 35, proteins: 1.3, fats: 0.1, carbs: 6.9, fiber: 2.4 } },
      { foodName: 'Лук репчатый', grams: 120, category: 'vegetable', nutrientsPer100g: { calories: 41, proteins: 1.4, fats: 0.2, carbs: 8.2, fiber: 1.7 } },
      { foodName: 'Масло подсолнечное', grams: 25, category: 'custom', nutrientsPer100g: { calories: 884, proteins: 0, fats: 99.9, carbs: 0, fiber: 0 } },
    ],
    vessels: [
      {
        id: 'vessel-1',
        name: 'Казан / Глубокая сковорода',
        icon: '🥘',
        type: 'pan',
        heatSource: 'electric',
        electricLevel: 6,
        gasLevel: 'medium',
        hasLid: true,
        startOffsetMinutes: 0,
        stepItems: [
          { foodName: 'Масло подсолнечное', grams: 25, addedAtMinute: 0, durationMinutes: 10, hasThermalProcessing: true, stepHeatSource: 'electric', stepElectricLevel: 7, stepGasLevel: 'high', stepHasLid: false },
          { foodName: 'Лук репчатый', grams: 120, addedAtMinute: 0, durationMinutes: 10, hasThermalProcessing: true, stepHeatSource: 'electric', stepElectricLevel: 7, stepGasLevel: 'high', stepHasLid: false },
          { foodName: 'Морковь свежая', grams: 150, addedAtMinute: 0, durationMinutes: 10, hasThermalProcessing: true, stepHeatSource: 'electric', stepElectricLevel: 7, stepGasLevel: 'high', stepHasLid: false },
          { foodName: 'Куриное филе', grams: 400, addedAtMinute: 10, durationMinutes: 10, hasThermalProcessing: true, stepHeatSource: 'electric', stepElectricLevel: 6, stepGasLevel: 'medium', stepHasLid: false },
          { foodName: 'Рис круглозерный', grams: 250, addedAtMinute: 20, durationMinutes: 25, hasThermalProcessing: true, stepHeatSource: 'electric', stepElectricLevel: 3, stepGasLevel: 'simmer', stepHasLid: true },
          { foodName: 'Вода', grams: 600, addedAtMinute: 20, durationMinutes: 25, hasThermalProcessing: true, stepHeatSource: 'electric', stepElectricLevel: 3, stepGasLevel: 'simmer', stepHasLid: true },
        ],
      },
    ],
    aiAnalysis: {
      note: `Классическая пошаговая технология для блюда «${title}»: обжарка овощной основы на открытом огне с переходом на медленное томление под крышкой.`,
      nutrientImpact: `Медленное томление под крышкой минимизирует потерю влаги и сохраняет витамины группы B и микроэлементы внутри продукта.`,
      chefTips: `Не открывайте крышку на финальном этапе томления, чтобы сохранить равномерное распределение пара и сочность блюда.`,
    },
  };
}

// API Route: AI Generate Full Step-by-Step Recipe by Dish Name
app.post('/api/recipes/generate-ai', async (req: Request, res: Response) => {
  try {
    const { dishName = '', library = [], metrics = [] } = req.body;
    if (!dishName || typeof dishName !== 'string' || !dishName.trim()) {
      res.status(400).json({ error: 'Укажите название блюда для генерации рецепта' });
      return;
    }

    const aiConfig = resolveAiConfigFromReq(req);

    try {
      const generated = await aiService.generateRecipeByDishName({
        dishName: dishName.trim(),
        library,
        metrics,
        aiConfig,
      });
      res.json({ success: true, recipe: generated });
    } catch (aiErr: any) {
      console.warn('AI Recipe Generation fallback:', aiErr?.message || aiErr);
      const fallback = generateRecipeFallback(dishName.trim());
      res.json({ success: true, recipe: fallback, isFallback: true });
    }
  } catch (error: any) {
    console.error('Error in /api/recipes/generate-ai:', error);
    res.status(500).json({ error: 'Не удалось сгенерировать рецепт', details: error?.message });
  }
});

// Locked App Icon state (persisted to public/icon.svg and public/locked-icon.json)
const LOCKED_ICON_JSON_PATH = path.resolve('public', 'locked-icon.json');
const PUBLIC_ICON_SVG_PATH = path.resolve('public', 'icon.svg');

app.get('/api/app-icon', (_req: Request, res: Response) => {
  try {
    if (fs.existsSync(LOCKED_ICON_JSON_PATH)) {
      const raw = fs.readFileSync(LOCKED_ICON_JSON_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      res.json({ iconId: Number(parsed.iconId) || 1 });
      return;
    }
  } catch {
    // ignore read error
  }
  res.json({ iconId: 1 });
});

app.post('/api/app-icon', (req: Request, res: Response) => {
  try {
    const { iconId, svg } = req.body || {};
    const validId = Number(iconId);
    if (validId >= 1 && validId <= 10) {
      fs.writeFileSync(
        LOCKED_ICON_JSON_PATH,
        JSON.stringify({ iconId: validId, updatedAt: new Date().toISOString() }, null, 2),
        'utf-8'
      );
      if (typeof svg === 'string' && svg.trim().startsWith('<svg')) {
        fs.writeFileSync(PUBLIC_ICON_SVG_PATH, svg.trim(), 'utf-8');
      }
      res.json({ success: true, iconId: validId });
      return;
    }
    res.status(400).json({ error: 'Invalid iconId' });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to persist icon' });
  }
});

// Local / Hybrid fallback endpoint matching Cloudflare Worker (worker.js)
app.post('/api/worker', async (req: Request, res: Response) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.status(500).json({
        error: { message: 'GEMINI_API_KEY не настроен на сервере.' },
      });
      return;
    }

    const requestBody = req.body || {};
    const requestedModel =
      typeof requestBody.model === 'string' && requestBody.model.trim()
        ? requestBody.model.trim()
        : 'gemini-3.5-flash-lite';

    const fallbackModels = [
      'gemini-3.5-flash-lite',
      'gemini-3.1-flash-lite',
      'gemini-2.5-flash-lite',
      'gemini-flash-latest',
    ];
    const modelsToTry = [
      requestedModel,
      ...fallbackModels.filter((m) => m !== requestedModel),
    ];

    const geminiPayload: Record<string, any> = {
      contents: requestBody.contents || [],
    };
    if (requestBody.generationConfig) {
      geminiPayload.generationConfig = requestBody.generationConfig;
    }
    if (requestBody.systemInstruction) {
      geminiPayload.systemInstruction =
        typeof requestBody.systemInstruction === 'string'
          ? { parts: [{ text: requestBody.systemInstruction }] }
          : requestBody.systemInstruction;
    }

    let lastData: any = null;
    let lastStatus = 500;

    for (const modelName of modelsToTry) {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        modelName
      )}:generateContent?key=${encodeURIComponent(apiKey)}`;

      const upstreamRes = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(geminiPayload),
      });

      lastStatus = upstreamRes.status;
      try {
        lastData = await upstreamRes.json();
      } catch {
        lastData = { error: { message: `Upstream error (${upstreamRes.status})` } };
      }

      if (upstreamRes.ok) {
        res.status(200).json({ ...lastData, modelUsed: modelName });
        return;
      }

      if (upstreamRes.status === 404 || upstreamRes.status === 400) {
        continue;
      }
      break;
    }

    res.status(lastStatus).json(lastData || { error: { message: 'Ошибка Gemini API' } });
  } catch (err: any) {
    res.status(500).json({ error: { message: err?.message || 'Internal Worker Proxy Error' } });
  }
});

async function startServer() {
  const httpServer = http.createServer(app);

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static('dist'));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve('dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
