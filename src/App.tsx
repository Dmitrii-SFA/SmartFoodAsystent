import React, { useState, useEffect } from 'react';
import { UserConfig, DayLog, LoggedFoodItem, ThemeMode, MealCategoryConfig } from './types/config';
import {
  DEFAULT_USER_CONFIG,
  DEFAULT_RUSSIAN_LABELS,
  DEFAULT_ENGLISH_LABELS,
  DEFAULT_INSTALLED_LANGUAGES,
  ensureProtectedLanguages,
  ensureProtectedMetrics,
  ensureProtectedMealCategories,
  ensureProtectedTheme,
  ensureEntireConfigProtected,
  translateConfigItems,
  getInitialDayLog,
} from './config/defaultConfig';
import { getThemeStyles } from './utils/themeHelper';
import { getWaterProductName, getUITranslations } from './utils/translations';
import { TopNavigation } from './components/TopNavigation';
import { DaySwipeHeader } from './components/DaySwipeHeader';
import { PersonSwitcherBar } from './components/PersonSwitcherBar';
import { CompactNutrientsList } from './components/CompactNutrientsList';
import { HeroSummary } from './components/HeroSummary';
import { ReorderableMealTimeline } from './components/ReorderableMealTimeline';
import { FoodLibraryTab } from './components/FoodLibraryTab';
import { RecipesTab } from './components/RecipesTab';
import { ShoppingListTab } from './components/ShoppingListTab';
import { SettingsTab } from './components/SettingsTab';
import { AddFoodModal } from './components/AddFoodModal';
import { AIChatDrawer } from './components/AIChatDrawer';
import { ConfigJsonModal } from './components/ConfigJsonModal';
import { ApiKeyModal } from './components/ApiKeyModal';
import { ResetConfirmModal } from './components/ResetConfirmModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { MealReminderModal } from './components/MealReminderModal';
import {
  APP_ICON_STORAGE_KEY,
  applyAppIconToDocument,
} from './components/AppIconStudio';
import {
  unlockMobileAudio,
  loadSoundSettings,
  saveSoundSettings,
} from './utils/soundEngine';
import { Sparkles, Sliders, Check, RotateCcw } from 'lucide-react';
import {
  LanguageOption,
  AppTab,
  LibraryFoodItem,
  RecipeItem,
  AIConfig,
  ShoppingListItem,
  SoundSettingsConfig,
  PersonProfile,
} from './types/config';

const STORAGE_KEY_SHOPPING_LIST = 'pwa_calorie_shopping_list_v1';

const STORAGE_KEY_CONFIG = 'pwa_calorie_user_config_v1';
const STORAGE_KEY_LOGS = 'pwa_calorie_day_logs_v1';
const STORAGE_KEY_PEOPLE_PROFILES = 'pwa_calorie_people_profiles_v1';
const STORAGE_KEY_ACTIVE_PERSON_ID = 'pwa_calorie_active_person_id_v1';
const STORAGE_KEY_API_KEY = 'pwa_gemini_custom_api_key_v1';
const STORAGE_KEY_AI_CONFIG = 'pwa_ai_config_v1';
const STORAGE_KEY_DEMO_REQUESTS = 'pwa_demo_requests_count_v1';
const TOTAL_DEMO_LIMIT = 10;

export default function App() {
  const getTodayStr = () => new Date().toISOString().split('T')[0];

  // API Key state (stored in localStorage)
  const [apiKey, setApiKey] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_API_KEY) || '';
    } catch {
      return '';
    }
  });

  // Locked App Icon ID for "Smart Food Assistance" (chosen by owner, non-editable by users)
  const [lockedIconId, setLockedIconId] = useState<number>(() => {
    try {
      const saved = parseInt(localStorage.getItem(APP_ICON_STORAGE_KEY) || '0', 10);
      return saved >= 1 && saved <= 10 ? saved : 1;
    } catch {
      return 1;
    }
  });

  // AI Config state (Gemini, OpenAI, OpenRouter, Custom)
  const [aiConfig, setAiConfig] = useState<AIConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_AI_CONFIG);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse saved aiConfig', e);
    }
    const legacyKey = localStorage.getItem(STORAGE_KEY_API_KEY) || '';
    return {
      provider: 'gemini',
      apiKey: legacyKey,
      baseURL: 'https://generativelanguage.googleapis.com',
      model: 'gemini-3.8-flash',
    };
  });

  const handleSaveAiConfig = (newAiConfig: AIConfig) => {
    setAiConfig(newAiConfig);
    setApiKey(newAiConfig.apiKey || '');
    try {
      localStorage.setItem(STORAGE_KEY_AI_CONFIG, JSON.stringify(newAiConfig));
      if (newAiConfig.apiKey) {
        localStorage.setItem(STORAGE_KEY_API_KEY, newAiConfig.apiKey);
      }
    } catch (e) {
      console.error('Error saving AI config:', e);
    }
  };

  // Daily demo requests counter (stored per date in localStorage)
  const [demoRequestsUsed, setDemoRequestsUsed] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_DEMO_REQUESTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        const today = new Date().toISOString().split('T')[0];
        if (parsed.date === today) {
          return Number(parsed.count) || 0;
        }
      }
    } catch {
      // fallback
    }
    return 0;
  });

  // Load User Config from localStorage or fallback
  const [config, setConfig] = useState<UserConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
      if (saved) {
        let parsed = JSON.parse(saved);
        parsed = ensureEntireConfigProtected(parsed);

        // Repair active language if it is a protected default (ru, en, pl)
        const activeCode = (parsed.language?.code || 'ru').slice(0, 2).toLowerCase();
        const protectedLang = DEFAULT_INSTALLED_LANGUAGES.find((l) => l.code === activeCode);
        if (protectedLang) {
          parsed.language = {
            code: protectedLang.code,
            labels: protectedLang.labels,
          };
          const translated = translateConfigItems(parsed, activeCode);
          parsed.metrics = ensureProtectedMetrics(translated.metrics);
          parsed.mealCategories = ensureProtectedMealCategories(translated.mealCategories);
        }

        return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse saved userConfig, using default', e);
    }
    return DEFAULT_USER_CONFIG;
  });

  // Previous config for Undo / Revert support
  const [previousConfig, setPreviousConfig] = useState<UserConfig | null>(null);
  const [configToast, setConfigToast] = useState<{ message: string; visible: boolean }>({
    message: '',
    visible: false,
  });

  // Logs state
  const [currentDateStr, setCurrentDateStr] = useState<string>(getTodayStr());
  const [logs, setLogs] = useState<Record<string, DayLog>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LOGS);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to parse saved day logs', e);
    }
    const today = getTodayStr();
    return {
      [today]: getInitialDayLog(today),
    };
  });

  // Multi-person profiles state (each person has their own logs, metrics, and mealCategories)
  const getDefaultPersonName = (langCode: string = 'ru') => {
    const c = (langCode || 'ru').toLowerCase();
    if (c.startsWith('en')) return 'Me';
    if (c.startsWith('pl')) return 'Ja';
    return 'Я';
  };

  const [people, setPeople] = useState<PersonProfile[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PEOPLE_PROFILES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse saved people profiles', e);
    }
    return [
      {
        id: 'default',
        name: getDefaultPersonName(config.language?.code),
        logs,
        metrics: config.metrics,
        mealCategories: config.mealCategories,
      },
    ];
  });

  const [activePersonId, setActivePersonId] = useState<string>(() => {
    try {
      const savedId = localStorage.getItem(STORAGE_KEY_ACTIVE_PERSON_ID);
      if (savedId && people.some((p) => p.id === savedId)) {
        return savedId;
      }
    } catch {
      // ignore
    }
    return people[0]?.id || 'default';
  });

  // On initial mount, ensure active person's data is loaded into logs & config
  useEffect(() => {
    const activeProfile = people.find((p) => p.id === activePersonId) || people[0];
    if (activeProfile) {
      setLogs(activeProfile.logs || {});
      setConfig((prev) => {
        const activeCode = (prev.language?.code || 'ru').slice(0, 2).toLowerCase();
        const translated = translateConfigItems(
          {
            ...prev,
            metrics: activeProfile.metrics || prev.metrics,
            mealCategories: activeProfile.mealCategories || prev.mealCategories,
          },
          activeCode
        );
        return {
          ...prev,
          metrics: ensureProtectedMetrics(translated.metrics),
          mealCategories: ensureProtectedMealCategories(translated.mealCategories),
        };
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep active person's profile in sync with logs, config.metrics, and config.mealCategories
  useEffect(() => {
    setPeople((prev) =>
      prev.map((p) =>
        p.id === activePersonId
          ? {
              ...p,
              logs,
              metrics: config.metrics,
              mealCategories: config.mealCategories,
            }
          : p
      )
    );
  }, [logs, config.metrics, config.mealCategories, activePersonId]);

  // Persist people profiles and activePersonId to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PEOPLE_PROFILES, JSON.stringify(people));
    } catch (e) {
      console.error('Error saving people profiles:', e);
    }
  }, [people]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ACTIVE_PERSON_ID, activePersonId);
    } catch (e) {
      console.error('Error saving active person ID:', e);
    }
  }, [activePersonId]);

  const handleSelectPerson = (personId: string) => {
    if (personId === activePersonId) return;
    const target = people.find((p) => p.id === personId);
    if (!target) return;

    const activeCode = (config.language?.code || 'ru').slice(0, 2).toLowerCase();
    const translated = translateConfigItems(
      {
        ...config,
        metrics: target.metrics || DEFAULT_USER_CONFIG.metrics,
        mealCategories: target.mealCategories || DEFAULT_USER_CONFIG.mealCategories,
      },
      activeCode
    );
    const nextMetrics = ensureProtectedMetrics(translated.metrics);
    const nextMealCategories = ensureProtectedMealCategories(translated.mealCategories);

    setActivePersonId(personId);
    setLogs(target.logs || {});
    setConfig((prev) => ({
      ...prev,
      metrics: nextMetrics,
      mealCategories: nextMealCategories,
    }));
  };

  const handleAddPerson = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    const today = getTodayStr();
    const activeCode = (config.language?.code || 'ru').slice(0, 2).toLowerCase();
    const freshDefaults = translateConfigItems(DEFAULT_USER_CONFIG, activeCode);
    const freshMetrics = ensureProtectedMetrics(freshDefaults.metrics);
    const freshMealCategories = ensureProtectedMealCategories(freshDefaults.mealCategories);
    const freshLogs: Record<string, DayLog> = {
      [today]: getInitialDayLog(today),
    };

    const newPerson: PersonProfile = {
      id: `person-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: trimmed,
      logs: freshLogs,
      metrics: freshMetrics,
      mealCategories: freshMealCategories,
    };

    setPeople((prev) => [...prev, newPerson]);
    setActivePersonId(newPerson.id);
    setLogs(freshLogs);
    setConfig((prev) => ({
      ...prev,
      metrics: freshMetrics,
      mealCategories: freshMealCategories,
    }));

    setConfigToast({
      message: `Профиль «${trimmed}» добавлен!`,
      visible: true,
    });
    setTimeout(() => setConfigToast((prev) => ({ ...prev, visible: false })), 3000);
  };

  const handleDeletePerson = (personId: string) => {
    if (people.length <= 1) return;
    const targetToDelete = people.find((p) => p.id === personId);
    const remaining = people.filter((p) => p.id !== personId);
    if (remaining.length === 0) return;

    setPeople(remaining);

    if (personId === activePersonId) {
      const nextPerson = remaining[0];
      const activeCode = (config.language?.code || 'ru').slice(0, 2).toLowerCase();
      const translated = translateConfigItems(
        {
          ...config,
          metrics: nextPerson.metrics || DEFAULT_USER_CONFIG.metrics,
          mealCategories: nextPerson.mealCategories || DEFAULT_USER_CONFIG.mealCategories,
        },
        activeCode
      );
      setActivePersonId(nextPerson.id);
      setLogs(nextPerson.logs || {});
      setConfig((prev) => ({
        ...prev,
        metrics: ensureProtectedMetrics(translated.metrics),
        mealCategories: ensureProtectedMealCategories(translated.mealCategories),
      }));
    }

    if (targetToDelete) {
      setConfigToast({
        message: `Профиль «${targetToDelete.name}» удалён`,
        visible: true,
      });
      setTimeout(() => setConfigToast((prev) => ({ ...prev, visible: false })), 3000);
    }
  };

  // Active Screen Tab (diary, library, recipes, settings)
  const [activeTab, setActiveTab] = useState<AppTab>('diary');
  const [settingsFocusSection, setSettingsFocusSection] = useState<string | null>(null);

  // Food Library state (Water in 3 languages + English default products for the 2 default recipes)
  const STORAGE_KEY_LIBRARY = 'pwa_calorie_food_library_v2';
  const buildDefaultLibrary = (langCode: string = 'ru'): LibraryFoodItem[] => {
    const waterName = getWaterProductName(langCode);
    return [
      {
        id: 'lib-water',
        name: waterName,
        servingSizeGrams: 100,
        nutrients: {
          calories: 0,
          proteins: 0,
          fats: 0,
          carbs: 0,
          fiber: 0,
          sugar: 0,
          sodium: 0,
          potassium: 0,
          calcium: 0,
          iron: 0,
          magnesium: 0,
          vitaminC: 0,
          vitaminD: 0,
        },
        category: 'drink',
        createdAt: Date.now(),
        source: 'preset',
      },
      // Simple Recipe Ingredients (Oatmeal Pancake with Cottage Cheese)
      {
        id: 'lib-6',
        name: 'Oat Flakes',
        servingSizeGrams: 100,
        nutrients: { calories: 352, proteins: 12.5, fats: 6.2, carbs: 61, fiber: 10, iron: 4.3 },
        createdAt: Date.now(),
        source: 'preset',
      },
      {
        id: 'lib-5',
        name: 'Chicken Egg',
        servingSizeGrams: 100,
        nutrients: { calories: 143, proteins: 12.7, fats: 10.2, carbs: 0.7, vitaminD: 1.8, iron: 1.8 },
        createdAt: Date.now(),
        source: 'preset',
      },
      {
        id: 'lib-3',
        name: 'Cottage Cheese 5%',
        servingSizeGrams: 100,
        nutrients: { calories: 121, proteins: 17, fats: 5, carbs: 3, calcium: 160 },
        createdAt: Date.now(),
        source: 'preset',
      },
      // Full Cooking Borscht Ingredients (Classic Beef Borscht)
      {
        id: 'lib-7',
        name: 'Beef Brisket',
        servingSizeGrams: 100,
        nutrients: { calories: 218, proteins: 19.5, fats: 15.2, carbs: 0, iron: 2.7, potassium: 318 },
        createdAt: Date.now(),
        source: 'preset',
      },
      {
        id: 'lib-8',
        name: 'Raw Potato',
        servingSizeGrams: 100,
        nutrients: { calories: 77, proteins: 2.0, fats: 0.1, carbs: 16.3, fiber: 1.4, potassium: 421, vitaminC: 20 },
        createdAt: Date.now(),
        source: 'preset',
      },
      {
        id: 'lib-9',
        name: 'White Cabbage',
        servingSizeGrams: 100,
        nutrients: { calories: 27, proteins: 1.8, fats: 0.1, carbs: 4.7, fiber: 2.0, vitaminC: 36, calcium: 40 },
        createdAt: Date.now(),
        source: 'preset',
      },
      {
        id: 'lib-10',
        name: 'Fresh Beetroot',
        servingSizeGrams: 100,
        nutrients: { calories: 43, proteins: 1.5, fats: 0.1, carbs: 8.8, fiber: 2.8, potassium: 325, iron: 0.8 },
        createdAt: Date.now(),
        source: 'preset',
      },
      {
        id: 'lib-11',
        name: 'Fresh Carrot',
        servingSizeGrams: 100,
        nutrients: { calories: 35, proteins: 1.3, fats: 0.1, carbs: 6.9, fiber: 2.4, potassium: 200 },
        createdAt: Date.now(),
        source: 'preset',
      },
      {
        id: 'lib-12',
        name: 'Yellow Onion',
        servingSizeGrams: 100,
        nutrients: { calories: 41, proteins: 1.4, fats: 0.2, carbs: 8.2, fiber: 3.0, potassium: 175 },
        createdAt: Date.now(),
        source: 'preset',
      },
      {
        id: 'lib-13',
        name: 'Sunflower Oil',
        servingSizeGrams: 100,
        nutrients: { calories: 884, proteins: 0, fats: 99.9, carbs: 0 },
        createdAt: Date.now(),
        source: 'preset',
      },
    ];
  };

  const [library, setLibrary] = useState<LibraryFoodItem[]>(() => {
    const activeLangCode = config.language?.code || 'ru';
    const waterName = getWaterProductName(activeLangCode);
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LIBRARY);
      if (saved) {
        const parsed: LibraryFoodItem[] = JSON.parse(saved);
        return parsed.map((f) =>
          f.id === 'lib-water' ? { ...f, name: waterName } : f
        );
      }
      // Preserve any custom user-created items from v1 library if present
      const legacySaved = localStorage.getItem('pwa_calorie_food_library_v1');
      if (legacySaved) {
        const legacyParsed: LibraryFoodItem[] = JSON.parse(legacySaved);
        const legacyPresetIds = new Set([
          'lib-water',
          'lib-1',
          'lib-2',
          'lib-3',
          'lib-4',
          'lib-5',
          'lib-6',
          'lib-7',
          'lib-8',
          'lib-9',
          'lib-10',
          'lib-11',
          'lib-12',
          'lib-13',
        ]);
        const userCustomItems = legacyParsed.filter((f) => !legacyPresetIds.has(f.id));
        return [...buildDefaultLibrary(activeLangCode), ...userCustomItems];
      }
    } catch (e) {
      console.warn('Failed to parse saved library', e);
    }
    return buildDefaultLibrary(activeLangCode);
  });

  // Recipes state (2 default recipes in English: 1 simple list + 1 full cooking Borscht)
  const STORAGE_KEY_RECIPES = 'pwa_calorie_recipes_v2';
  const buildDefaultRecipes = (langCode: string = 'ru'): RecipeItem[] => {
    const waterName = getWaterProductName(langCode);
    return [
      {
        id: 'rec-oat-pancake',
        name: 'Oatmeal Pancake with Cottage Cheese',
        totalGrams: 160,
        rawGrams: 160,
        isDetailedCooking: false,
        ingredients: [
          {
            foodId: 'lib-6',
            foodName: 'Oat Flakes',
            grams: 50,
            nutrientsPer100g: { calories: 352, proteins: 12.5, fats: 6.2, carbs: 61 },
          },
          {
            foodId: 'lib-5',
            foodName: 'Chicken Egg',
            grams: 60,
            nutrientsPer100g: { calories: 143, proteins: 12.7, fats: 10.2, carbs: 0.7 },
          },
          {
            foodId: 'lib-3',
            foodName: 'Cottage Cheese 5%',
            grams: 50,
            nutrientsPer100g: { calories: 121, proteins: 17, fats: 5, carbs: 3 },
          },
        ],
        totalNutrients: { calories: 322, proteins: 22.4, fats: 11.7, carbs: 32.4 },
        nutrientsPer100g: { calories: 201.3, proteins: 14.0, fats: 7.3, carbs: 20.3 },
        createdAt: Date.now(),
      },
      {
        id: 'rec-borscht-en',
        name: 'Classic Beef Borscht',
        totalGrams: 3340,
        rawGrams: 3820,
        isDetailedCooking: true,
        ingredients: [
          { foodId: 'lib-water', foodName: waterName, grams: 2000, nutrientsPer100g: { calories: 0, proteins: 0, fats: 0, carbs: 0 } },
          { foodId: 'lib-7', foodName: 'Beef Brisket', grams: 600, nutrientsPer100g: { calories: 218, proteins: 19.5, fats: 15.2, carbs: 0 } },
          { foodId: 'lib-8', foodName: 'Raw Potato', grams: 350, nutrientsPer100g: { calories: 77, proteins: 2.0, fats: 0.1, carbs: 16.3 } },
          { foodId: 'lib-9', foodName: 'White Cabbage', grams: 300, nutrientsPer100g: { calories: 27, proteins: 1.8, fats: 0.1, carbs: 4.7 } },
          { foodId: 'lib-10', foodName: 'Fresh Beetroot', grams: 250, nutrientsPer100g: { calories: 43, proteins: 1.5, fats: 0.1, carbs: 8.8 } },
          { foodId: 'lib-11', foodName: 'Fresh Carrot', grams: 150, nutrientsPer100g: { calories: 35, proteins: 1.3, fats: 0.1, carbs: 6.9 } },
          { foodId: 'lib-12', foodName: 'Yellow Onion', grams: 150, nutrientsPer100g: { calories: 41, proteins: 1.4, fats: 0.2, carbs: 8.2 } },
          { foodId: 'lib-13', foodName: 'Sunflower Oil', grams: 20, nutrientsPer100g: { calories: 884, proteins: 0, fats: 99.9, carbs: 0 } },
        ],
        totalNutrients: { calories: 2055, proteins: 137, fats: 114, carbs: 104 },
        nutrientsPer100g: { calories: 61.5, proteins: 4.1, fats: 3.4, carbs: 3.1 },
        cookingProcess: {
          isEnabled: true,
          rawWeightGrams: 3820,
          evaporatedWaterMl: 480,
          weightDeltaGrams: -480,
          finalDishWeightGrams: 3340,
          vessels: [
            {
              id: 'vessel-pot-1',
              name: 'Pot 4L (Broth & Base)',
              icon: 'pot',
              type: 'pot',
              heatSource: 'electric',
              electricLevel: 3,
              waterAddedMl: 0,
              startOffsetMinutes: 0,
              stepItems: [
                { id: 'step-water-1', foodId: 'lib-water', foodName: waterName, grams: 2000, addedAtMinute: 0, durationMinutes: 90, cumulativeDurationMinutes: 125, isExtracted: false },
                { id: 'step-1', foodId: 'lib-7', foodName: 'Beef Brisket', grams: 600, addedAtMinute: 0, durationMinutes: 90, cumulativeDurationMinutes: 125, isExtracted: false },
                { id: 'step-2', foodId: 'lib-8', foodName: 'Raw Potato', grams: 350, addedAtMinute: 90, durationMinutes: 20, cumulativeDurationMinutes: 35, isExtracted: false },
                { id: 'step-3', foodId: 'lib-9', foodName: 'White Cabbage', grams: 300, addedAtMinute: 110, durationMinutes: 15, cumulativeDurationMinutes: 15, isExtracted: false },
                { id: 'step-4-transfer', foodId: 'vessel-transfer:vessel-pan-1', foodName: 'Contents: Frying Pan 28cm (Sautéed Vegetables)', grams: 471, addedAtMinute: 110, durationMinutes: 15, cumulativeDurationMinutes: 15, sourceVesselId: 'vessel-pan-1', isExtracted: false },
              ],
            },
            {
              id: 'vessel-pan-1',
              name: 'Frying Pan 28cm (Sautéed Vegetables)',
              icon: 'pan_classic',
              type: 'pan',
              heatSource: 'electric',
              electricLevel: 9,
              waterAddedMl: 0,
              startOffsetMinutes: 90,
              stepItems: [
                { id: 'step-pan-1', foodId: 'lib-12', foodName: 'Yellow Onion', grams: 150, addedAtMinute: 0, durationMinutes: 5, cumulativeDurationMinutes: 5, isExtracted: false },
                { id: 'step-pan-2', foodId: 'lib-11', foodName: 'Fresh Carrot', grams: 150, addedAtMinute: 0, durationMinutes: 5, cumulativeDurationMinutes: 5, isExtracted: false },
                { id: 'step-pan-3', foodId: 'lib-10', foodName: 'Fresh Beetroot', grams: 250, addedAtMinute: 0, durationMinutes: 5, cumulativeDurationMinutes: 5, isExtracted: false },
                { id: 'step-pan-4', foodId: 'lib-13', foodName: 'Sunflower Oil', grams: 20, addedAtMinute: 0, durationMinutes: 5, cumulativeDurationMinutes: 5, isExtracted: false },
              ],
            },
          ],
          aiAnalysis: {
            note: 'Rich beef broth simmered gently (level 3/9) for collagen extraction. Vegetables sautéed in the pan from minute 90 to 95 and transferred to the pot at minute 110 with cabbage to preserve vibrant color and aroma.',
            nutrientImpact: 'Beta-carotene from carrots dissolves into the oil lipid fraction for optimal absorption, while minerals enrich the broth.',
            chefTips: 'Let the borscht rest covered for 20 minutes after turning off the stove to balance the flavors.',
            analyzedAt: Date.now(),
          },
        },
        createdAt: Date.now(),
      },
    ];
  };

  const [recipes, setRecipes] = useState<RecipeItem[]>(() => {
    const activeLangCode = config.language?.code || 'ru';
    const waterName = getWaterProductName(activeLangCode);
    try {
      const saved = localStorage.getItem(STORAGE_KEY_RECIPES);
      if (saved) {
        const parsed: RecipeItem[] = JSON.parse(saved);
        return parsed.map((rec) => ({
          ...rec,
          ingredients: (rec.ingredients || []).map((ing) =>
            ing.foodId === 'lib-water' ? { ...ing, foodName: waterName } : ing
          ),
          cookingProcess: rec.cookingProcess
            ? {
                ...rec.cookingProcess,
                vessels: (rec.cookingProcess.vessels || []).map((v) => ({
                  ...v,
                  stepItems: (v.stepItems || []).map((s) =>
                    s.foodId === 'lib-water' ? { ...s, foodName: waterName } : s
                  ),
                })),
              }
            : undefined,
        }));
      }
      // Preserve any custom user-created recipes from v1 if present
      const legacySaved = localStorage.getItem('pwa_calorie_recipes_v1');
      if (legacySaved) {
        const legacyParsed: RecipeItem[] = JSON.parse(legacySaved);
        const legacyPresetIds = new Set(['rec-borscht-1', 'rec-1']);
        const customUserRecipes = legacyParsed.filter((r) => !legacyPresetIds.has(r.id));
        return [...buildDefaultRecipes(activeLangCode), ...customUserRecipes];
      }
    } catch (e) {
      console.warn('Failed to parse saved recipes', e);
    }
    return buildDefaultRecipes(activeLangCode);
  });

  // Sync library and recipes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_LIBRARY, JSON.stringify(library));
    } catch (e) {
      console.error('Error saving library:', e);
    }
  }, [library]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_RECIPES, JSON.stringify(recipes));
    } catch (e) {
      console.error('Error saving recipes:', e);
    }
  }, [recipes]);

  // Shopping List state
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SHOPPING_LIST);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse saved shopping list', e);
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SHOPPING_LIST, JSON.stringify(shoppingList));
    } catch (e) {
      console.error('Error saving shopping list:', e);
    }
  }, [shoppingList]);

  const handleAddToShoppingList = (item: { name: string; quantity?: string; foodId?: string }) => {
    const trimmedName = (item.name || '').trim();
    if (!trimmedName) return;
    const newItem: ShoppingListItem = {
      id: `shop-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      foodId: item.foodId,
      name: trimmedName,
      quantity: item.quantity?.trim() || '1',
      addedAt: Date.now(),
    };
    setShoppingList((prev) => [newItem, ...prev]);
    setConfigToast({
      message: `«${trimmedName}» добавлено в список покупок!`,
      visible: true,
    });
    setTimeout(() => setConfigToast((prev) => ({ ...prev, visible: false })), 3000);
  };

  const handleUpdateShoppingQuantity = (id: string, quantity: string) => {
    setShoppingList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  };

  const handleDeleteShoppingItem = (id: string) => {
    setShoppingList((prev) => prev.filter((item) => item.id !== id));
  };

  // Modals & Drawers state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isAddFoodModalOpen, setIsAddFoodModalOpen] = useState(false);
  const [addFoodInitialCatId, setAddFoodInitialCatId] = useState<string | undefined>(undefined);
  const [preselectedMealCategoryId, setPreselectedMealCategoryId] = useState<string | null>(null);

  // Restore original factory program defaults
  const handleRestoreOriginalProgram = (clearLogsToo: boolean) => {
    // Save previous config for undo
    setPreviousConfig({ ...config });

    // Restore pristine canonical configuration
    const restoredConfig = JSON.parse(JSON.stringify(DEFAULT_USER_CONFIG));
    setConfig(restoredConfig);
    setLibrary(buildDefaultLibrary(restoredConfig.language.code));
    setRecipes(buildDefaultRecipes(restoredConfig.language.code));
    try {
      localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(restoredConfig));
    } catch (e) {
      console.error('Error resetting config:', e);
    }

    // Optionally reset logs and people profiles
    if (clearLogsToo) {
      const today = getTodayStr();
      const freshLogs = { [today]: getInitialDayLog(today) };
      setLogs(freshLogs);
      const resetDefaultPerson: PersonProfile = {
        id: 'default',
        name: getDefaultPersonName(restoredConfig.language.code),
        logs: freshLogs,
        metrics: restoredConfig.metrics,
        mealCategories: restoredConfig.mealCategories,
      };
      setPeople([resetDefaultPerson]);
      setActivePersonId('default');
      try {
        localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(freshLogs));
        localStorage.setItem(STORAGE_KEY_PEOPLE_PROFILES, JSON.stringify([resetDefaultPerson]));
        localStorage.setItem(STORAGE_KEY_ACTIVE_PERSON_ID, 'default');
      } catch (e) {
        console.error('Error resetting logs:', e);
      }
    }

    setIsResetModalOpen(false);
    setConfigToast({
      message: 'Первоначальная программа полностью восстановлена!',
      visible: true,
    });
    setTimeout(() => {
      setConfigToast((prev) => ({ ...prev, visible: false }));
    }, 4000);
  };

  // Save API Key to localStorage
  const handleSaveApiKey = (newKey: string) => {
    setApiKey(newKey);
    try {
      localStorage.setItem(STORAGE_KEY_API_KEY, newKey);
    } catch (e) {
      console.error('Error saving API key:', e);
    }
  };

  // Increment demo usage counter
  const handleIncrementDemoUsage = () => {
    setDemoRequestsUsed((prev) => {
      const nextCount = prev + 1;
      try {
        const today = new Date().toISOString().split('T')[0];
        localStorage.setItem(
          STORAGE_KEY_DEMO_REQUESTS,
          JSON.stringify({ date: today, count: nextCount })
        );
      } catch (e) {
        console.error('Error saving demo usage:', e);
      }
      return nextCount;
    });
  };

  // Sync config to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
    } catch (e) {
      console.error('Error saving config to localStorage:', e);
    }
  }, [config]);

  // Sync logs to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(logs));
    } catch (e) {
      console.error('Error saving logs to localStorage:', e);
    }
  }, [logs]);

  // Calculate remaining demo requests
  const remainingDemoRequests = Boolean(apiKey && apiKey.trim().length > 0)
    ? 9999
    : Math.max(0, TOTAL_DEMO_LIMIT - demoRequestsUsed);

  // Ensure current day exists in logs
  const currentDayLog: DayLog = logs[currentDateStr] || {
    date: currentDateStr,
    waterMl: 0,
    items: [],
  };

  // Calculate consumed totals for the active day
  const consumedTotals: Record<string, number> = {
    water: currentDayLog.waterMl || 0,
  };
  (currentDayLog.items || []).forEach((item) => {
    Object.entries(item.nutrients || {}).forEach(([metricId, val]) => {
      consumedTotals[metricId] = (consumedTotals[metricId] || 0) + (Number(val) || 0);
    });
  });

  const themeStyles = getThemeStyles(config.theme);

  // Apply new config (e.g. from Gemini or Config Editor)
  const handleApplyConfig = (newConfig: UserConfig, summary?: string) => {
    setPreviousConfig({ ...config });

    // Merging installed languages: preserve all existing languages and protected defaults (RU, EN, PL)
    const prevLangs = config.installedLanguages || [];
    const incomingLangs = newConfig.installedLanguages || [];

    const mergedMap = new Map<string, LanguageOption>();
    // 1. Keep all previous languages
    prevLangs.forEach((l) => mergedMap.set(l.code.slice(0, 2).toLowerCase(), l));

    // 2. Add any newly generated languages without touching protected languages
    incomingLangs.forEach((l) => {
      const code2 = l.code.slice(0, 2).toLowerCase();
      const existing = mergedMap.get(code2);
      if (!existing) {
        // Brand new language created: append as new
        mergedMap.set(code2, { ...l, isProtected: false });
      } else if (!existing.isProtected) {
        mergedMap.set(code2, l);
      }
    });

    const finalLanguages = ensureProtectedLanguages(Array.from(mergedMap.values()));
    const finalMetrics = ensureProtectedMetrics(newConfig.metrics);
    const finalMealCategories = ensureProtectedMealCategories(newConfig.mealCategories);
    const finalTheme = ensureProtectedTheme(newConfig.theme);

    setConfig({
      ...newConfig,
      installedLanguages: finalLanguages,
      metrics: finalMetrics,
      mealCategories: finalMealCategories,
      theme: finalTheme,
      version: (config.version || 1) + 1,
    });

    if (summary) {
      setConfigToast({ message: summary, visible: true });
      setTimeout(() => {
        setConfigToast((prev) => ({ ...prev, visible: false }));
      }, 5000);
    }
  };

  // Revert config
  const handleRevertConfig = () => {
    if (previousConfig) {
      setConfig(previousConfig);
      setPreviousConfig(null);
      setConfigToast({ message: 'Предыдущие настройки восстановлены', visible: true });
      setTimeout(() => {
        setConfigToast((prev) => ({ ...prev, visible: false }));
      }, 3000);
    }
  };

  // Quick Theme Mode update
  const handleUpdateThemeMode = (mode: ThemeMode) => {
    setPreviousConfig({ ...config });
    setConfig((prev) => ({
      ...prev,
      theme: {
        ...prev.theme,
        mode,
      },
    }));
  };

  // Switch to selected language from installed languages
  const handleSelectLanguage = (lang: LanguageOption) => {
    setPreviousConfig({ ...config });
    const code2 = lang.code.slice(0, 2).toLowerCase();

    // Use canonical protected labels if it's ru, en, or pl to fix any prior modifications
    const canonicalProtected = DEFAULT_INSTALLED_LANGUAGES.find((l) => l.code === code2);
    const targetLabels = canonicalProtected ? canonicalProtected.labels : lang.labels;
    const waterName = getWaterProductName(code2);

    setConfig((prev) => {
      const translated = translateConfigItems(prev, code2);
      return {
        ...prev,
        language: {
          code: lang.code,
          labels: targetLabels,
        },
        metrics: translated.metrics,
        mealCategories: translated.mealCategories,
        installedLanguages: prev.installedLanguages?.some(
          (l) => l.code.slice(0, 2).toLowerCase() === code2
        )
          ? prev.installedLanguages
          : [...(prev.installedLanguages || []), lang],
      };
    });

    // Update Water product name in 3 languages ("Вода", "Water", "Woda") in library and recipes
    setLibrary((prev) =>
      prev.map((item) =>
        item.id === 'lib-water' ? { ...item, name: waterName } : item
      )
    );
    setRecipes((prev) =>
      prev.map((rec) => ({
        ...rec,
        ingredients: (rec.ingredients || []).map((ing) =>
          ing.foodId === 'lib-water' ? { ...ing, foodName: waterName } : ing
        ),
        cookingProcess: rec.cookingProcess
          ? {
              ...rec.cookingProcess,
              vessels: (rec.cookingProcess.vessels || []).map((v) => ({
                ...v,
                stepItems: (v.stepItems || []).map((s) =>
                  s.foodId === 'lib-water' ? { ...s, foodName: waterName } : s
                ),
              })),
            }
          : undefined,
      }))
    );

    setConfigToast({
      message: `${lang.nativeName || lang.name} (${lang.code.slice(0, 2).toUpperCase()})`,
      visible: true,
    });
    setTimeout(() => {
      setConfigToast((prev) => ({ ...prev, visible: false }));
    }, 3000);
  };

  const handleRequestNewLanguage = () => {
    setIsChatOpen(true);
  };

  // Add food item
  const handleSaveFood = (foodData: Omit<LoggedFoodItem, 'id' | 'timestamp'>) => {
    const newItem: LoggedFoodItem = {
      ...foodData,
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
    };

    setLogs((prev) => {
      const day = prev[currentDateStr] || { date: currentDateStr, waterMl: 0, items: [] };
      return {
        ...prev,
        [currentDateStr]: {
          ...day,
          items: [newItem, ...day.items],
        },
      };
    });
  };

  // Delete food item
  const handleDeleteItem = (itemId: string) => {
    setLogs((prev) => {
      const day = prev[currentDateStr];
      if (!day) return prev;
      return {
        ...prev,
        [currentDateStr]: {
          ...day,
          items: day.items.filter((item) => item.id !== itemId),
        },
      };
    });
  };

  // Water increment
  const handleAddWater = (amountMl: number) => {
    setLogs((prev) => {
      const day = prev[currentDateStr] || { date: currentDateStr, waterMl: 0, items: [] };
      return {
        ...prev,
        [currentDateStr]: {
          ...day,
          waterMl: Math.max(0, (day.waterMl || 0) + amountMl),
        },
      };
    });
  };

  // Add meals from Gemini chat
  const handleAddMealsFromAI = (
    suggestedMeals: Array<{
      mealCategoryId: string;
      name: string;
      amountGrams: number;
      nutrients: Record<string, number>;
    }>
  ) => {
    const newItems: LoggedFoodItem[] = suggestedMeals.map((m) => ({
      id: `item-ai-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      mealCategoryId: m.mealCategoryId || config.mealCategories[0]?.id || 'breakfast',
      name: m.name,
      amountGrams: m.amountGrams || 100,
      timestamp: Date.now(),
      nutrients: m.nutrients,
    }));

    setLogs((prev) => {
      const day = prev[currentDateStr] || { date: currentDateStr, waterMl: 0, items: [] };
      return {
        ...prev,
        [currentDateStr]: {
          ...day,
          items: [...newItems, ...day.items],
        },
      };
    });

    setConfigToast({
      message: `Добавлено ${newItems.length} блюд из чата в дневник!`,
      visible: true,
    });
    setTimeout(() => {
      setConfigToast((prev) => ({ ...prev, visible: false }));
    }, 4000);
  };

  // Clicking "Добавить блюдо" in the Daily Menu opens the Food Library tab with the meal category preselected
  const handleOpenAddFoodModal = (categoryId?: string) => {
    const targetCatId = categoryId || config.mealCategories[0]?.id || 'breakfast';
    setPreselectedMealCategoryId(targetCatId);
    setActiveTab('library');
  };

  // Active categories for the current selected day:
  // Merges global userConfig.mealCategories and single-day customDayCategories
  const currentDayCategories: MealCategoryConfig[] = [
    ...(config.mealCategories || []),
    ...(currentDayLog.customDayCategories || []),
  ];

  // Add one-time meal category (single day only, for currentDateStr)
  const handleAddDayCategory = (newCat: MealCategoryConfig) => {
    setLogs((prev) => {
      const day = prev[currentDateStr] || { date: currentDateStr, waterMl: 0, items: [] };
      const dayCats = day.customDayCategories || [];
      return {
        ...prev,
        [currentDateStr]: {
          ...day,
          customDayCategories: [...dayCats, newCat],
        },
      };
    });
    setConfigToast({
      message: `Разовый приём «${newCat.name}» добавлен для этого дня`,
      visible: true,
    });
    setTimeout(() => setConfigToast((prev) => ({ ...prev, visible: false })), 3000);
  };

  // Delete meal category from daily timeline (single-day or global)
  const handleDeleteMealCategory = (catId: string) => {
    if (currentDayLog.customDayCategories?.some((c) => c.id === catId)) {
      setLogs((prev) => {
        const day = prev[currentDateStr];
        if (!day) return prev;
        return {
          ...prev,
          [currentDateStr]: {
            ...day,
            customDayCategories: (day.customDayCategories || []).filter((c) => c.id !== catId),
          },
        };
      });
      setConfigToast({
        message: 'Разовый приём пищи удален',
        visible: true,
      });
      setTimeout(() => setConfigToast((prev) => ({ ...prev, visible: false })), 3000);
      return;
    }

    if (currentDayCategories.length > 1) {
      const updated = config.mealCategories.filter((c) => c.id !== catId);
      handleApplyConfig(
        { ...config, mealCategories: updated },
        'Приём пищи удален из расписания'
      );
    }
  };

  // Reorder daily categories
  const handleReorderDayCategories = (newCats: MealCategoryConfig[]) => {
    const globalIds = new Set(config.mealCategories.map((c) => c.id));
    const newGlobals = newCats.filter((c) => globalIds.has(c.id));
    const newDayCats = newCats.filter((c) => !globalIds.has(c.id));

    if (newGlobals.length > 0) {
      setConfig((prev) => ({ ...prev, mealCategories: newGlobals }));
    }
    if (newDayCats.length > 0 || (currentDayLog.customDayCategories?.length || 0) > 0) {
      setLogs((prev) => {
        const day = prev[currentDateStr] || { date: currentDateStr, waterMl: 0, items: [] };
        return {
          ...prev,
          [currentDateStr]: {
            ...day,
            customDayCategories: newDayCats,
          },
        };
      });
    }
  };

  useEffect(() => {
    let active = true;
    const localRaw = localStorage.getItem(APP_ICON_STORAGE_KEY);
    const localId = localRaw ? parseInt(localRaw, 10) : 0;

    if (localId >= 1 && localId <= 10) {
      applyAppIconToDocument(localId, config.language?.code || 'ru');
    } else {
      fetch('/api/app-icon')
        .then((r) => r.json())
        .then((data) => {
          if (!active) return;
          const serverIconId = Number(data?.iconId) || 1;
          setLockedIconId(serverIconId);
          try {
            localStorage.setItem(APP_ICON_STORAGE_KEY, String(serverIconId));
          } catch {
            // ignore
          }
          applyAppIconToDocument(serverIconId, config.language?.code || 'ru');
        })
        .catch(() => {
          applyAppIconToDocument(lockedIconId, config.language?.code || 'ru');
        });
    }
    return () => {
      active = false;
    };
  }, [lockedIconId, config.language?.code]);

  // Unlock mobile Web Audio on first user touch/click so scheduled meal alarms can play sound on phones
  useEffect(() => {
    const handleUnlock = () => {
      unlockMobileAudio();
    };
    window.addEventListener('touchstart', handleUnlock, { passive: true, once: true });
    window.addEventListener('click', handleUnlock, { passive: true, once: true });
    return () => {
      window.removeEventListener('touchstart', handleUnlock);
      window.removeEventListener('click', handleUnlock);
    };
  }, []);

  // Meal Reminder Alarm State & Scheduler
  const [activeReminderMeal, setActiveReminderMeal] = useState<MealCategoryConfig | null>(null);
  const [snoozedTimes, setSnoozedTimes] = useState<Record<string, string>>({});
  const firedRemindersRef = React.useRef<Set<string>>(new Set());

  useEffect(() => {
    const checkMealReminders = () => {
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const nowHHMM = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
      const todayKey = getTodayStr();

      for (const cat of currentDayCategories) {
        if ((cat as any).visible === false) continue;
        const snoozedHHMM = snoozedTimes[cat.id];
        const scheduledHHMM = snoozedHHMM || (cat.reminderEnabled && cat.time ? cat.time.trim() : '');
        if (!scheduledHHMM) continue;

        if (scheduledHHMM === nowHHMM) {
          const fireKey = `${todayKey}|${cat.id}|${scheduledHHMM}`;
          if (!firedRemindersRef.current.has(fireKey)) {
            firedRemindersRef.current.add(fireKey);
            setActiveReminderMeal(cat);

            // Clear one-time snooze override once it triggers
            if (snoozedHHMM) {
              setSnoozedTimes((prev) => {
                const next = { ...prev };
                delete next[cat.id];
                return next;
              });
            }

            // Send system notification if granted
            if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
              const lang = (config.language?.code || 'ru').toLowerCase();
              const title = lang.startsWith('en')
                ? `Meal Reminder: ${cat.name}`
                : lang.startsWith('pl')
                ? `Przypomnienie: ${cat.name}`
                : `Напоминание: ${cat.name}`;
              const body = lang.startsWith('en')
                ? `Scheduled time: ${scheduledHHMM}`
                : lang.startsWith('pl')
                ? `Zaplanowana godzina: ${scheduledHHMM}`
                : `Назначенное время: ${scheduledHHMM}`;
              try {
                if (navigator.serviceWorker) {
                  navigator.serviceWorker.ready
                    .then((reg) => reg.showNotification(title, { body, icon: '/icon.svg' }))
                    .catch(() => {
                      new Notification(title, { body, icon: '/icon.svg' });
                    });
                } else {
                  new Notification(title, { body, icon: '/icon.svg' });
                }
              } catch {
                // ignore notification errors
              }
            }
            break;
          }
        }
      }
    };

    checkMealReminders();
    const timerId = window.setInterval(checkMealReminders, 5000);
    return () => window.clearInterval(timerId);
  }, [currentDayCategories, snoozedTimes, config.language?.code]);

  const handleSnoozeReminder = (minutes: number) => {
    if (!activeReminderMeal) return;
    const target = new Date(Date.now() + minutes * 60 * 1000);
    const pad = (n: number) => String(n).padStart(2, '0');
    const snoozeHHMM = `${pad(target.getHours())}:${pad(target.getMinutes())}`;
    const todayKey = getTodayStr();
    // Allow firing at the snoozed minute
    firedRemindersRef.current.delete(`${todayKey}|${activeReminderMeal.id}|${snoozeHHMM}`);
    setSnoozedTimes((prev) => ({
      ...prev,
      [activeReminderMeal.id]: snoozeHHMM,
    }));
    setActiveReminderMeal(null);
  };

  // Full-screen Daily Menu horizontal swipe state & handlers
  const diaryTouchRef = React.useRef<{
    startX: number;
    startY: number;
    lastX: number;
    axis: 'none' | 'horizontal' | 'vertical';
    active: boolean;
  }>({
    startX: 0,
    startY: 0,
    lastX: 0,
    axis: 'none',
    active: false,
  });

  const [diarySwipeOffsetX, setDiarySwipeOffsetX] = useState<number>(0);
  const [diarySwipeOpacity, setDiarySwipeOpacity] = useState<number>(1);
  const [diarySwipeTransition, setDiarySwipeTransition] = useState<string>('none');
  const diaryAnimatingRef = React.useRef<boolean>(false);

  const shiftDiaryDateByDays = (days: number) => {
    const [y, m, d] = currentDateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    dateObj.setDate(dateObj.getDate() + days);
    const nextY = dateObj.getFullYear();
    const nextM = String(dateObj.getMonth() + 1).padStart(2, '0');
    const nextD = String(dateObj.getDate()).padStart(2, '0');
    setCurrentDateStr(`${nextY}-${nextM}-${nextD}`);
  };

  const handleDiaryTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (diaryAnimatingRef.current || e.touches.length !== 1) return;
    const target = e.target as HTMLElement | null;
    if (
      target &&
      target.closest(
        'input, textarea, select, [draggable="true"], .fixed.inset-0, [data-no-day-swipe="true"]'
      )
    ) {
      diaryTouchRef.current.active = false;
      return;
    }

    const touch = e.touches[0];
    diaryTouchRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      lastX: touch.clientX,
      axis: 'none',
      active: true,
    };
    setDiarySwipeTransition('none');
  };

  const handleDiaryTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const state = diaryTouchRef.current;
    if (!state.active || diaryAnimatingRef.current || e.touches.length !== 1) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - state.startX;
    const deltaY = touch.clientY - state.startY;
    state.lastX = touch.clientX;

    if (state.axis === 'none') {
      if (Math.abs(deltaY) > 10 && Math.abs(deltaY) >= Math.abs(deltaX)) {
        state.axis = 'vertical';
        return;
      }
      if (Math.abs(deltaX) > 14 && Math.abs(deltaX) > Math.abs(deltaY) * 1.25) {
        state.axis = 'horizontal';
      }
    }

    if (state.axis === 'horizontal') {
      const dampedX = Math.max(-180, Math.min(180, deltaX * 0.58));
      const fade = Math.max(0.55, 1 - Math.abs(dampedX) / 360);
      setDiarySwipeOffsetX(dampedX);
      setDiarySwipeOpacity(fade);
    }
  };

  const handleDiaryTouchEnd = () => {
    const state = diaryTouchRef.current;
    if (!state.active) return;
    state.active = false;

    if (state.axis !== 'horizontal') {
      if (diarySwipeOffsetX !== 0 || diarySwipeOpacity !== 1) {
        setDiarySwipeTransition('transform 160ms cubic-bezier(0.22, 1, 0.36, 1), opacity 160ms ease-out');
        setDiarySwipeOffsetX(0);
        setDiarySwipeOpacity(1);
      }
      state.axis = 'none';
      return;
    }

    const rawDeltaX = state.lastX - state.startX;
    state.axis = 'none';

    const SWIPE_THRESHOLD_PX = 55;
    if (Math.abs(rawDeltaX) >= SWIPE_THRESHOLD_PX) {
      const isSwipeLeft = rawDeltaX < 0; // swipe left -> next day (+1), swipe right -> previous day (-1)
      const exitX = isSwipeLeft ? -95 : 95;
      const enterX = isSwipeLeft ? 75 : -75;

      diaryAnimatingRef.current = true;
      setDiarySwipeTransition('transform 110ms ease-out, opacity 110ms ease-out');
      setDiarySwipeOffsetX(exitX);
      setDiarySwipeOpacity(0.3);

      window.setTimeout(() => {
        shiftDiaryDateByDays(isSwipeLeft ? 1 : -1);
        setDiarySwipeTransition('none');
        setDiarySwipeOffsetX(enterX);
        setDiarySwipeOpacity(0.45);

        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => {
            setDiarySwipeTransition(
              'transform 170ms cubic-bezier(0.22, 1, 0.36, 1), opacity 170ms ease-out'
            );
            setDiarySwipeOffsetX(0);
            setDiarySwipeOpacity(1);
            window.setTimeout(() => {
              diaryAnimatingRef.current = false;
            }, 175);
          });
        });
      }, 110);
    } else {
      setDiarySwipeTransition('transform 160ms cubic-bezier(0.22, 1, 0.36, 1), opacity 160ms ease-out');
      setDiarySwipeOffsetX(0);
      setDiarySwipeOpacity(1);
    }
  };

  return (
    <div className={`min-h-screen ${themeStyles.appBg} flex flex-col transition-colors duration-200 overflow-x-hidden`}>
      {/* PWA Offline indicator */}
      <OfflineIndicator label={config.language.labels.offlineMode} />

      {/* Top Navigation Bar with the 5 core tabs */}
      <TopNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        themeStyles={themeStyles}
        accentColor={config.theme.accentColor}
        langCode={config.language.code}
        labels={config.language.labels}
        shoppingCount={shoppingList.length}
        onToggleAiChat={() => setIsChatOpen((prev) => !prev)}
        isAiChatOpen={isChatOpen}
      />

      {/* Toast Notification when Gemini or User changes userConfig */}
      {configToast.visible && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-40 max-w-md w-full px-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="p-3 rounded-2xl bg-slate-900/95 border border-emerald-500/50 text-white shadow-2xl flex items-center justify-between gap-3 backdrop-blur-md">
            <div className="flex items-center gap-2.5 text-xs">
              <span className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400">
                <Check className="w-4 h-4" />
              </span>
              <div>
                <span className="font-bold text-emerald-300">Конфиг обновлен:</span>{' '}
                <span className="text-slate-200">{configToast.message}</span>
              </div>
            </div>

            {previousConfig && (
              <button
                onClick={handleRevertConfig}
                className="flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 transition shrink-0"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Отменить</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Content Area switched by activeTab */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4">
        {/* Horizontal Scrollable Person Switcher Menu (appears between top 5 buttons and date bar once a person is added) */}
        <PersonSwitcherBar
          people={people}
          activePersonId={activePersonId}
          onSelectPerson={handleSelectPerson}
          onDeletePerson={handleDeletePerson}
          themeStyles={themeStyles}
          accentColor={config.theme.accentColor}
          borderRadius={config.theme.borderRadius}
          langCode={config.language.code}
        />

        {/* TAB 1: ДНЕВНОЕ МЕНЮ (Стартовая страница) */}
        {activeTab === 'diary' && (
          <div
            onTouchStart={handleDiaryTouchStart}
            onTouchMove={handleDiaryTouchMove}
            onTouchEnd={handleDiaryTouchEnd}
            onTouchCancel={handleDiaryTouchEnd}
            style={{
              transform:
                diarySwipeOffsetX !== 0
                  ? `translate3d(${diarySwipeOffsetX}px, 0, 0)`
                  : undefined,
              opacity: diarySwipeOpacity !== 1 ? diarySwipeOpacity : undefined,
              transition: diarySwipeTransition,
              willChange: diarySwipeOffsetX !== 0 ? 'transform, opacity' : undefined,
              touchAction: 'pan-y',
            }}
            className="space-y-4 animate-in fade-in duration-200"
          >
            {/* 1. Day of Week Swipe & Arrow Header + Square Add Person Button */}
            <DaySwipeHeader
              currentDateStr={currentDateStr}
              logs={logs}
              dailyCalorieTarget={
                config.metrics.find((m) => m.id === 'calories')?.target || 2000
              }
              onDateChange={setCurrentDateStr}
              onSelectDate={setCurrentDateStr}
              onAddPerson={handleAddPerson}
              themeStyles={themeStyles}
              accentColor={config.theme.accentColor}
              borderRadius={config.theme.borderRadius}
              langCode={config.language.code}
              labels={config.language.labels}
            />

            {/* 2. Nutrients Display: Either Compact single-row or Classic circular HeroSummary */}
            {config.theme.nutrientDisplayMode === 'circles' ? (
              <HeroSummary
                config={config}
                themeStyles={themeStyles}
                todayItems={currentDayLog.items}
                waterMl={currentDayLog.waterMl || 0}
                onAddWater={handleAddWater}
                onOpenAddFoodModal={() => handleOpenAddFoodModal()}
              />
            ) : (
              <CompactNutrientsList
                metrics={config.metrics}
                consumedTotals={consumedTotals}
                todayItems={currentDayLog.items}
                waterMl={currentDayLog.waterMl || 0}
                onAddWater={handleAddWater}
                onResetWater={() => handleAddWater(-(currentDayLog.waterMl || 0))}
                themeStyles={themeStyles}
                accentColor={config.theme.accentColor}
                borderRadius={config.theme.borderRadius}
                apiKey={apiKey}
                langCode={config.language.code}
                labels={config.language.labels}
                onReorderMetrics={(newMetrics) => {
                  handleApplyConfig(
                    { ...config, metrics: newMetrics },
                    'Порядок нутриентов обновлен'
                  );
                }}
                onToggleMetricVisibility={(metricId, show) => {
                  const updated = config.metrics.map((m) =>
                    m.id === metricId ? { ...m, showInSummary: show } : m
                  );
                  handleApplyConfig(
                    { ...config, metrics: updated },
                    show ? 'Нутриент выведен на главный экран' : 'Нутриент скрыт с главного экрана'
                  );
                }}
                onToggleMetricPrimary={(metricId, isPrimary) => {
                  const updated = config.metrics.map((m) =>
                    m.id === metricId ? { ...m, isPrimary } : m
                  );
                  handleApplyConfig(
                    { ...config, metrics: updated },
                    isPrimary ? 'Нутриент переведен в Основные' : 'Нутриент переведен во Второстепенные'
                  );
                }}
                onAddCustomMetric={(newMetric) => {
                  handleApplyConfig(
                    { ...config, metrics: [...config.metrics, newMetric] },
                    `Добавлен новый нутриент: ${newMetric.label}`
                  );
                }}
                onNavigateToNutrientSettings={() => {
                  setSettingsFocusSection('nutrients');
                  setActiveTab('settings');
                }}
              />
            )}

            {/* 3. Reorderable Meal Timeline with drag & drop and bottom Add Meal / Share Daily Menu buttons */}
            <ReorderableMealTimeline
              categories={currentDayCategories}
              todayItems={currentDayLog.items}
              dailyCalorieTarget={
                config.metrics.find((m) => m.id === 'calories')?.target || 2000
              }
              metrics={config.metrics}
              themeStyles={themeStyles}
              accentColor={config.theme.accentColor}
              borderRadius={config.theme.borderRadius}
              langCode={config.language.code}
              labels={config.language.labels}
              currentDateStr={currentDateStr}
              waterMl={currentDayLog.waterMl || 0}
              onShareDailyMenu={() => {
                const c = (config.language?.code || 'ru').toLowerCase();
                const msg = c.startsWith('en')
                  ? `Daily menu (${currentDateStr}) copied to clipboard!`
                  : c.startsWith('pl')
                  ? `Dzienne menu (${currentDateStr}) skopiowano do schowka!`
                  : `Дневное меню (${currentDateStr}) скопировано в буфер обмена!`;
                setConfigToast({ message: msg, visible: true });
                setTimeout(() => setConfigToast((prev) => ({ ...prev, visible: false })), 3000);
              }}
              onReorderCategories={handleReorderDayCategories}
              onAddCategory={handleAddDayCategory}
              onDeleteCategory={handleDeleteMealCategory}
              onOpenAddFoodModal={handleOpenAddFoodModal}
              onDeleteItem={handleDeleteItem}
              onAddToShoppingList={handleAddToShoppingList}
              onNavigateToMealSettings={() => {
                setSettingsFocusSection('mealCategories');
                setActiveTab('settings');
              }}
            />
          </div>
        )}

        {/* TAB 2: СПИСОК ПРОДУКТОВ (Библиотека с ручным вводом, ИИ по названию, фото этикетки, фото тарелки) */}
        {activeTab === 'library' && (
          <div className="animate-in fade-in duration-200">
            <FoodLibraryTab
              library={library}
              metrics={config.metrics}
              categories={currentDayCategories}
              themeStyles={themeStyles}
              accentColor={config.theme.accentColor}
              borderRadius={config.theme.borderRadius}
              apiKey={apiKey}
              langCode={config.language.code}
              labels={config.language.labels}
              preselectedMealCategoryId={preselectedMealCategoryId}
              onClearPreselectedMealCategory={() => setPreselectedMealCategoryId(null)}
              onUpdateMetrics={(newMetrics) => {
                handleApplyConfig(
                  { ...config, metrics: newMetrics },
                  'Настройки нутриентов обновлены'
                );
              }}
              onSaveToLibrary={(newItem) => {
                setLibrary((prev) => [newItem, ...prev]);
                setConfigToast({
                  message: `Продукт «${newItem.name}» добавлен в библиотеку!`,
                  visible: true,
                });
                setTimeout(() => setConfigToast((prev) => ({ ...prev, visible: false })), 3000);
              }}
              onDeleteFromLibrary={(id) => {
                setLibrary((prev) => prev.filter((item) => item.id !== id));
              }}
              onAddFoodToDayLog={(foodItem) => {
                handleSaveFood(foodItem);
                setConfigToast({
                  message: `«${foodItem.name}» (${foodItem.amountGrams}г) записано в дневник!`,
                  visible: true,
                });
                setTimeout(() => setConfigToast((prev) => ({ ...prev, visible: false })), 3000);
              }}
            />
          </div>
        )}

        {/* TAB 3: РЕЦЕПТЫ (Создание блюд из продуктов библиотеки с подсчетом КБЖУ на порцию) */}
        {activeTab === 'recipes' && (
          <div className="animate-in fade-in duration-200">
            <RecipesTab
              recipes={recipes}
              library={library}
              metrics={config.metrics}
              themeStyles={themeStyles}
              accentColor={config.theme.accentColor}
              borderRadius={config.theme.borderRadius}
              langCode={config.language.code}
              labels={config.language.labels}
              apiKey={apiKey}
              aiConfig={(config as any).aiConfig}
              onSaveRecipe={(savedRecipe) => {
                const isExisting = recipes.some((r) => r.id === savedRecipe.id);
                setRecipes((prev) =>
                  prev.some((r) => r.id === savedRecipe.id)
                    ? prev.map((r) => (r.id === savedRecipe.id ? savedRecipe : r))
                    : [savedRecipe, ...prev]
                );
                setConfigToast({
                  message: isExisting
                    ? `Изменения в рецепте «${savedRecipe.name}» сохранены!`
                    : `Рецепт «${savedRecipe.name}» успешно сохранен!`,
                  visible: true,
                });
                setTimeout(() => setConfigToast((prev) => ({ ...prev, visible: false })), 3000);
              }}
              onDeleteRecipe={(recipeId) => {
                setRecipes((prev) => prev.filter((r) => r.id !== recipeId));
              }}
              onAddLibraryItems={(newItems) => {
                if (!newItems || newItems.length === 0) return;
                setLibrary((prev) => {
                  const existingNames = new Set(prev.map((p) => p.name.trim().toLowerCase()));
                  const filtered = newItems.filter(
                    (it) => !existingNames.has(it.name.trim().toLowerCase())
                  );
                  return filtered.length > 0 ? [...filtered, ...prev] : prev;
                });
              }}
              onRemoveLibraryItems={(idsToRemove) => {
                if (!idsToRemove || idsToRemove.length === 0) return;
                const removeSet = new Set(idsToRemove);
                setLibrary((prev) => prev.filter((item) => !removeSet.has(item.id)));
              }}
              onAddToShoppingList={handleAddToShoppingList}
              onShareRecipe={(sharedRecipe) => {
                const c = (config.language?.code || 'ru').toLowerCase();
                const msg = c.startsWith('en')
                  ? `Recipe "${sharedRecipe.name}" copied to clipboard!`
                  : c.startsWith('pl')
                  ? `Przepis "${sharedRecipe.name}" skopiowano do schowka!`
                  : `Рецепт «${sharedRecipe.name}» скопирован в буфер обмена!`;
                setConfigToast({ message: msg, visible: true });
                setTimeout(() => setConfigToast((prev) => ({ ...prev, visible: false })), 3000);
              }}
              currentDateStr={currentDateStr}
              dayLogs={logs}
              onImportSharedData={(shared) => {
                if (shared.libraryItems && shared.libraryItems.length > 0) {
                  setLibrary((prev) => {
                    const existingNames = new Set(prev.map((p) => p.name.trim().toLowerCase()));
                    const newLib = shared.libraryItems!.filter(
                      (it) => !existingNames.has(it.name.trim().toLowerCase())
                    );
                    return newLib.length > 0 ? [...newLib, ...prev] : prev;
                  });
                }
                if (shared.recipes && shared.recipes.length > 0) {
                  setRecipes((prev) => {
                    const existingIds = new Set(prev.map((r) => r.id));
                    const normalizedNew = shared.recipes!.map((r) =>
                      existingIds.has(r.id)
                        ? { ...r, id: `rec-imp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` }
                        : r
                    );
                    return [...normalizedNew, ...prev];
                  });
                }
                if (shared.dayLogs && Object.keys(shared.dayLogs).length > 0) {
                  setLogs((prev) => {
                    const next = { ...prev };
                    Object.entries(shared.dayLogs!).forEach(([dateKey, importedLog]) => {
                      const existingDay = next[dateKey];
                      if (!existingDay) {
                        next[dateKey] = importedLog;
                      } else {
                        const existingItemIds = new Set((existingDay.items || []).map((i) => i.id));
                        const mergedItems = [
                          ...(existingDay.items || []),
                          ...(importedLog.items || []).map((it) =>
                            existingItemIds.has(it.id)
                              ? { ...it, id: `item-imp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` }
                              : it
                          ),
                        ];
                        next[dateKey] = {
                          ...existingDay,
                          waterMl: Math.max(existingDay.waterMl || 0, importedLog.waterMl || 0),
                          items: mergedItems,
                        };
                      }
                    });
                    return next;
                  });
                }
                const t = getUITranslations(config.language?.code, config.language?.labels);
                setConfigToast({
                  message: `${t.importConfig}: OK`,
                  visible: true,
                });
                setTimeout(() => setConfigToast((prev) => ({ ...prev, visible: false })), 3000);
              }}
              onLogRecipeToDay={(recipe) => {
                const per100g =
                  recipe.nutrientsPer100g && Object.keys(recipe.nutrientsPer100g).length > 0
                    ? recipe.nutrientsPer100g
                    : (() => {
                        const weight = Math.max(1, recipe.totalGrams || recipe.rawGrams || 100);
                        const map: Record<string, number> = {};
                        Object.entries(recipe.totalNutrients || {}).forEach(([k, val]) => {
                          map[k] = Math.round(((val || 0) / weight) * 100 * 10) / 10;
                        });
                        return map;
                      })();
                handleSaveFood({
                  mealCategoryId: config.mealCategories[0]?.id || 'lunch',
                  name: recipe.name,
                  amountGrams: 100,
                  nutrients: per100g,
                });
                setConfigToast({
                  message: `100 g «${recipe.name}»`,
                  visible: true,
                });
                setTimeout(() => setConfigToast((prev) => ({ ...prev, visible: false })), 3000);
              }}
            />
          </div>
        )}

        {/* TAB 4: СПИСОК ПОКУПОК */}
        {activeTab === 'shopping' && (
          <div className="animate-in fade-in duration-200">
            <ShoppingListTab
              shoppingList={shoppingList}
              library={library}
              themeStyles={themeStyles}
              accentColor={config.theme.accentColor}
              borderRadius={config.theme.borderRadius}
              langCode={config.language.code}
              labels={config.language.labels}
              onAddItem={handleAddToShoppingList}
              onUpdateQuantity={handleUpdateShoppingQuantity}
              onDeleteItem={handleDeleteShoppingItem}
            />
          </div>
        )}

        {/* TAB 5: НАСТРОЙКИ (Тема, язык, API-ключ Gemini, сброс к заводским, userConfig.json) */}
        {activeTab === 'settings' && (
          <div className="animate-in fade-in duration-200">
            <SettingsTab
              config={config}
              themeStyles={themeStyles}
              apiKey={apiKey}
              aiConfig={aiConfig}
              remainingDemoRequests={remainingDemoRequests}
              totalDemoLimit={TOTAL_DEMO_LIMIT}
              onUpdateThemeMode={handleUpdateThemeMode}
              onUpdateNutrientDisplayMode={(mode) => {
                handleApplyConfig(
                  {
                    ...config,
                    theme: { ...config.theme, nutrientDisplayMode: mode },
                  },
                  mode === 'circles'
                    ? 'Включен круговой вид дневной нормы'
                    : 'Включены компактные полосы нутриентов'
                );
              }}
              onSelectLanguage={handleSelectLanguage}
              onRequestNewLanguage={handleRequestNewLanguage}
              onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
              onOpenAiChat={() => setIsChatOpen(true)}
              onOpenResetModal={() => setIsResetModalOpen(true)}
              onOpenConfigModal={() => setIsConfigModalOpen(true)}
              onUpdateMetrics={(newMetrics) => {
                handleApplyConfig(
                  { ...config, metrics: newMetrics },
                  'Дневная норма калорий и БЖУ успешно обновлена!'
                );
              }}
              onUpdateMealCategories={(newCats) => {
                handleApplyConfig(
                  { ...config, mealCategories: newCats },
                  'Список и порядок приёмов пищи обновлен!'
                );
              }}
              focusSection={settingsFocusSection}
              onClearFocusSection={() => setSettingsFocusSection(null)}
              recipes={recipes}
              library={library}
              currentDateStr={currentDateStr}
              dayLogs={logs}
              onImportSharedData={(shared, targetDateOverride) => {
                if (shared.libraryItems && shared.libraryItems.length > 0) {
                  setLibrary((prev) => {
                    const existingNames = new Set(prev.map((p) => p.name.trim().toLowerCase()));
                    const newLib = shared.libraryItems!.filter(
                      (it) => !existingNames.has(it.name.trim().toLowerCase())
                    );
                    return newLib.length > 0 ? [...newLib, ...prev] : prev;
                  });
                }
                if (shared.recipes && shared.recipes.length > 0) {
                  setRecipes((prev) => {
                    const existingIds = new Set(prev.map((r) => r.id));
                    const normalizedNew = shared.recipes!.map((r) =>
                      existingIds.has(r.id)
                        ? { ...r, id: `rec-imp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` }
                        : r
                    );
                    return [...normalizedNew, ...prev];
                  });
                }
                if (shared.dayLogs && Object.keys(shared.dayLogs).length > 0) {
                  setLogs((prev) => {
                    const next = { ...prev };
                    Object.entries(shared.dayLogs!).forEach(([dateKey, importedLog]) => {
                      const existingDay = next[dateKey];
                      if (!existingDay) {
                        next[dateKey] = importedLog;
                      } else {
                        const existingItemIds = new Set((existingDay.items || []).map((i) => i.id));
                        const mergedItems = [
                          ...(existingDay.items || []),
                          ...(importedLog.items || []).map((it) =>
                            existingItemIds.has(it.id)
                              ? { ...it, id: `item-imp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` }
                              : it
                          ),
                        ];
                        next[dateKey] = {
                          ...existingDay,
                          waterMl: Math.max(existingDay.waterMl || 0, importedLog.waterMl || 0),
                          items: mergedItems,
                        };
                      }
                    });
                    return next;
                  });
                  if (targetDateOverride) {
                    setCurrentDateStr(targetDateOverride);
                  }
                }
                const t = getUITranslations(config.language?.code, config.language?.labels);
                setConfigToast({
                  message: `${t.importConfig}: OK`,
                visible: true,
                });
                setTimeout(() => setConfigToast((prev) => ({ ...prev, visible: false })), 3000);
              }}
              onUpdateSoundSettings={(newSoundSettings: SoundSettingsConfig) => {
                saveSoundSettings(newSoundSettings);
                setConfig((prev) => ({
                  ...prev,
                  soundSettings: newSoundSettings,
                }));
              }}
            />
          </div>
        )}
      </main>

      {/* Meal / Medication Sound Reminder Popup Modal */}
      <MealReminderModal
        activeMeal={activeReminderMeal}
        mealItems={
          activeReminderMeal
            ? currentDayLog.items.filter((i) => i.mealCategoryId === activeReminderMeal.id)
            : []
        }
        soundSettings={config.soundSettings || loadSoundSettings()}
        langCode={config.language.code}
        accentColor={config.theme.accentColor}
        themeStyles={themeStyles}
        onDismiss={() => setActiveReminderMeal(null)}
        onSnooze={handleSnoozeReminder}
      />

      {/* AI Gemini Flash Chat Drawer */}
      <AIChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        config={config}
        themeStyles={themeStyles}
        onApplyConfig={handleApplyConfig}
        onRevertConfig={handleRevertConfig}
        canRevert={!!previousConfig}
        onAddMealsFromAI={handleAddMealsFromAI}
        apiKey={apiKey}
        demoRequestsUsed={demoRequestsUsed}
        totalDemoLimit={TOTAL_DEMO_LIMIT}
        onIncrementDemoUsage={handleIncrementDemoUsage}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
      />

      {/* Add Food Modal */}
      <AddFoodModal
        isOpen={isAddFoodModalOpen}
        onClose={() => setIsAddFoodModalOpen(false)}
        config={{ ...config, mealCategories: currentDayCategories }}
        themeStyles={themeStyles}
        initialCategoryId={addFoodInitialCatId}
        onSaveFood={handleSaveFood}
        apiKey={apiKey}
        libraryItems={library}
      />

      {/* userConfig.json Viewer and Editor Modal */}
      <ConfigJsonModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        config={config}
        themeStyles={themeStyles}
        onUpdateConfig={handleApplyConfig}
        onResetToDefault={() => handleApplyConfig(DEFAULT_USER_CONFIG, 'Сброшено к заводским настройкам')}
      />

      {/* AI Provider & API Key Settings Modal */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        aiConfig={aiConfig}
        onSaveAiConfig={handleSaveAiConfig}
        apiKey={apiKey}
        onSaveApiKey={handleSaveApiKey}
        themeStyles={themeStyles}
        remainingDemoRequests={remainingDemoRequests}
        totalDemoLimit={TOTAL_DEMO_LIMIT}
      />

      {/* Reset to Factory Defaults Modal */}
      <ResetConfirmModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirmReset={handleRestoreOriginalProgram}
        themeStyles={themeStyles}
      />
    </div>
  );
}
