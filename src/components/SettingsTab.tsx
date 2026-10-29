import React, { useState, useEffect, useRef } from 'react';
import {
  UserConfig,
  ThemeMode,
  LanguageOption,
  MetricConfig,
  MealCategoryConfig,
  AIConfig,
  RecipeItem,
  LibraryFoodItem,
  DayLog,
  NutritionGoalMode,
} from '../types/config';
import { ThemeStyles, getBorderRadiusClass } from '../utils/themeHelper';
import { getUITranslations } from '../utils/translations';
import { LanguageSelector } from './LanguageSelector';
import { PWAInstallButton } from './PWAInstallButton';
import { DailyNormCalculator } from './DailyNormCalculator';
import { MealCategoriesManager } from './MealCategoriesManager';
import { NutrientsManager } from './NutrientsManager';
import {
  Settings,
  Palette,
  Globe,
  Key,
  RotateCcw,
  Code2,
  Check,
  CircleDot,
  AlignLeft,
  Sparkles,
  ChevronDown,
  Bot,
  Share2,
  Download,
  Upload,
  Copy,
  FileJson,
  BookOpen,
  CalendarDays,
  AlertCircle,
  Volume2,
  Play,
  Smartphone,
  ChefHat,
  Bell,
  MessageCircle,
  Mail,
  Send,
} from 'lucide-react';
import {
  SOUND_MELODIES,
  loadSoundSettings,
  saveSoundSettings,
  playSoundMelody,
} from '../utils/soundEngine';
import { SoundMelodyId, SoundSettingsConfig } from '../types/config';
import { getQuotaStatus } from '../utils/accessControl';

export type SettingsSectionId =
  | 'language'
  | 'dailyNorm'
  | 'mealCategories'
  | 'nutrients'
  | 'nutrientMode'
  | 'theme'
  | 'soundSettings'
  | 'exportImport'
  | 'dataReset'
  | 'feedback';

interface SettingsTabProps {
  config: UserConfig;
  themeStyles: ThemeStyles;
  apiKey: string;
  aiConfig?: AIConfig;
  remainingDemoRequests: number;
  totalDemoLimit: number;
  onUpdateThemeMode: (mode: ThemeMode) => void;
  onUpdateNutrientDisplayMode: (mode: 'compact' | 'circles') => void;
  onSelectLanguage: (lang: LanguageOption) => void;
  onRequestNewLanguage: () => void;
  onOpenApiKeyModal: () => void;
  onOpenAiChat?: () => void;
  onOpenResetModal: () => void;
  onOpenConfigModal: () => void;
  onUpdateMetrics: (metrics: MetricConfig[]) => void;
  onUpdateGoalMode?: (mode: NutritionGoalMode) => void;
  onUpdateMealCategories: (categories: MealCategoryConfig[]) => void;
  focusSection?: string | null;
  onClearFocusSection?: () => void;
  recipes?: RecipeItem[];
  library?: LibraryFoodItem[];
  currentDateStr?: string;
  dayLogs?: Record<string, DayLog>;
  onImportSharedData?: (
    data: {
      recipes?: RecipeItem[];
      libraryItems?: LibraryFoodItem[];
      dayLogs?: Record<string, DayLog>;
    },
    targetDateOverride?: string
  ) => void;
  onUpdateSoundSettings?: (settings: SoundSettingsConfig) => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  config,
  themeStyles,
  apiKey,
  aiConfig,
  remainingDemoRequests,
  totalDemoLimit,
  onUpdateThemeMode,
  onUpdateNutrientDisplayMode,
  onSelectLanguage,
  onRequestNewLanguage,
  onOpenApiKeyModal,
  onOpenAiChat,
  onOpenResetModal,
  onOpenConfigModal,
  onUpdateMetrics,
  onUpdateGoalMode,
  onUpdateMealCategories,
  focusSection,
  onClearFocusSection,
  recipes = [],
  library = [],
  currentDateStr = new Date().toISOString().split('T')[0],
  dayLogs = {},
  onImportSharedData,
  onUpdateSoundSettings,
}) => {
  const radiusClass = getBorderRadiusClass(config.theme.borderRadius);
  const currentNutrientMode = config.theme.nutrientDisplayMode || 'compact';
  const langCode = config.language?.code || 'ru';
  const c = langCode.toLowerCase();
  const isEn = c.startsWith('en');
  const isPl = c.startsWith('pl');
  const t = getUITranslations(langCode, config.language?.labels);

  const activeCode = langCode.slice(0, 2).toUpperCase();
  const languages: LanguageOption[] = config.installedLanguages || [];

  // Deduplicate languages by 2-letter code
  const uniqueLanguages: LanguageOption[] = [];
  const seenCodes = new Set<string>();
  languages.forEach((lang) => {
    const code2 = lang.code.slice(0, 2).toUpperCase();
    if (!seenCodes.has(code2)) {
      seenCodes.add(code2);
      uniqueLanguages.push(lang);
    }
  });

  const activeLanguageName =
    uniqueLanguages.find((l) => l.code.slice(0, 2).toUpperCase() === activeCode)?.nativeName ||
    uniqueLanguages.find((l) => l.code.slice(0, 2).toUpperCase() === activeCode)?.name ||
    activeCode;

  const themeModes: Array<{
    mode: ThemeMode;
    label: string;
    shortBadge: string;
    previewBg: string;
  }> = [
    {
      mode: 'dark',
      label: isEn ? 'Dark Slate' : isPl ? 'Ciemny (Dark)' : 'Тёмная (Dark)',
      shortBadge: isEn ? 'Dark' : isPl ? 'Ciemny' : 'Тёмная',
      previewBg: 'bg-slate-900 border-slate-700 text-slate-100',
    },
    {
      mode: 'light',
      label: isEn ? 'Light Clean' : isPl ? 'Jasny (Light)' : 'Светлая (Light)',
      shortBadge: isEn ? 'Light' : isPl ? 'Jasny' : 'Светлая',
      previewBg: 'bg-white border-slate-300 text-slate-900',
    },
    {
      mode: 'emerald',
      label: isEn ? 'Emerald Forest' : isPl ? 'Szmaragdowy (Emerald)' : 'Изумрудная (Emerald)',
      shortBadge: isEn ? 'Emerald' : isPl ? 'Szmaragdowy' : 'Изумрудная',
      previewBg: 'bg-emerald-950 border-emerald-700 text-emerald-100',
    },
    {
      mode: 'sunset',
      label: isEn ? 'Warm Sunset' : isPl ? 'Zachód słońca (Sunset)' : 'Закат (Sunset)',
      shortBadge: isEn ? 'Sunset' : isPl ? 'Zachód słońca' : 'Закат',
      previewBg: 'bg-stone-900 border-orange-700 text-orange-100',
    },
    {
      mode: 'cyberpunk',
      label: isEn ? 'Cyberpunk Neon' : isPl ? 'Cyberpunk' : 'Киберпанк (Cyberpunk)',
      shortBadge: isEn || isPl ? 'Cyberpunk' : 'Киберпанк',
      previewBg: 'bg-zinc-950 border-cyan-500 text-cyan-100',
    },
    {
      mode: 'nord',
      label: isEn ? 'Nordic Frost' : isPl ? 'Skandynawski (Nord)' : 'Скандинавская (Nord)',
      shortBadge: isEn ? 'Nord' : isPl ? 'Nord' : 'Скандинавская',
      previewBg: 'bg-[#2E3440] border-[#88C0D0] text-slate-100',
    },
  ];

  const currentThemeLabel =
    themeModes.find((tm) => tm.mode === config.theme.mode)?.shortBadge || config.theme.mode;

  // Independent collapsible sections state (all collapsed by default as requested)
  const [openSections, setOpenSections] = useState<Record<SettingsSectionId, boolean>>({
    language: false,
    dailyNorm: false,
    mealCategories: false,
    nutrients: false,
    nutrientMode: false,
    theme: false,
    soundSettings: false,
    exportImport: false,
    dataReset: false,
    feedback: true,
  });

  // Sound Settings state
  const [soundConfig, setSoundConfig] = useState<SoundSettingsConfig>(() =>
    loadSoundSettings(config.soundSettings)
  );

  useEffect(() => {
    if (config.soundSettings) {
      setSoundConfig(loadSoundSettings(config.soundSettings));
    }
  }, [config.soundSettings]);

  const handleSoundChange = (next: SoundSettingsConfig) => {
    setSoundConfig(next);
    saveSoundSettings(next);
    if (onUpdateSoundSettings) {
      onUpdateSoundSettings(next);
    }
  };

  // Export & Import state inside Settings tile
  const [eiMode, setEiMode] = useState<'export' | 'import'>('export');
  const [exportMenuEnabled, setExportMenuEnabled] = useState<boolean>(true);
  const [menuScope, setMenuScope] = useState<'current' | 'all'>('current');
  const [exportRecipesEnabled, setExportRecipesEnabled] = useState<boolean>(false);
  const [selectedRecipeIds, setSelectedRecipeIds] = useState<string[]>([]);
  const [eiCopied, setEiCopied] = useState<boolean>(false);
  const [importText, setImportText] = useState<string>('');
  const [importTargetDate, setImportTargetDate] = useState<string>(currentDateStr);
  const [useTargetDateOverride, setUseTargetDateOverride] = useState<boolean>(true);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const importFileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setImportTargetDate(currentDateStr);
  }, [currentDateStr]);

  // Handle auto-expansion when navigating from external gear button
  useEffect(() => {
    if (focusSection && focusSection in openSections) {
      const sectionKey = focusSection as SettingsSectionId;
      setOpenSections((prev) => ({ ...prev, [sectionKey]: true }));

      setTimeout(() => {
        const idMap: Record<string, string> = {
          mealCategories: 'meal-categories-settings-section',
          nutrients: 'nutrients-settings-section',
          dailyNorm: 'daily-norm-settings-section',
          exportImport: 'export-import-settings-section',
        };
        const elId = idMap[focusSection] || focusSection;
        const el = document.getElementById(elId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        if (onClearFocusSection) onClearFocusSection();
      }, 150);
    }
  }, [focusSection, onClearFocusSection]);

  const toggleSection = (id: SettingsSectionId) => {
    setOpenSections((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const openCount = Object.values(openSections).filter(Boolean).length;

  // Build Export Payload (exact same structure as Share buttons on Recipe & Daily Menu)
  const buildExportPayload = () => {
    const chosenRecipes = exportRecipesEnabled
      ? recipes.filter((r) => selectedRecipeIds.includes(r.id))
      : [];

    const neededFoodIds = new Set<string>();
    const neededFoodNames = new Set<string>();
    chosenRecipes.forEach((rec) => {
      (rec.ingredients || []).forEach((ing) => {
        if (ing.foodId) neededFoodIds.add(ing.foodId);
        if (ing.foodName) neededFoodNames.add(ing.foodName.trim().toLowerCase());
      });
    });

    const bundledLibraryItems = exportRecipesEnabled
      ? library.filter(
          (item) =>
            neededFoodIds.has(item.id) ||
            neededFoodNames.has(item.name.trim().toLowerCase())
        )
      : [];

    let exportedDayLogs: Record<string, DayLog> | undefined = undefined;
    if (exportMenuEnabled) {
      if (menuScope === 'current') {
        const currentLog = dayLogs[currentDateStr] || {
          date: currentDateStr,
          waterMl: 0,
          items: [],
        };
        exportedDayLogs = { [currentDateStr]: currentLog };
      } else {
        exportedDayLogs = dayLogs;
      }
    }

    return {
      type: 'pwa_calorie_share_v1' as const,
      exportedAt: new Date().toISOString(),
      recipes: chosenRecipes.length > 0 ? chosenRecipes : undefined,
      libraryItems: bundledLibraryItems.length > 0 ? bundledLibraryItems : undefined,
      dayLogs: exportedDayLogs,
    };
  };

  const exportPayloadObj = buildExportPayload();
  const hasAnythingToExport =
    exportMenuEnabled || (exportRecipesEnabled && selectedRecipeIds.length > 0);
  const serializedExportJson = JSON.stringify(exportPayloadObj, null, 2);

  const handleCopyExportJson = async () => {
    if (!hasAnythingToExport) return;
    try {
      await navigator.clipboard.writeText(serializedExportJson);
      setEiCopied(true);
      setTimeout(() => setEiCopied(false), 2500);
    } catch {
      // ignore fallback
    }
  };

  const handleDownloadExportJson = () => {
    if (!hasAnythingToExport) return;
    const blob = new Blob([serializedExportJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smart-food-export-${currentDateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleUploadImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImportText(String(reader.result || ''));
      setImportError(null);
      setImportSuccess(null);
    };
    reader.readAsText(file);
  };

  const handleConfirmSettingsImport = () => {
    setImportError(null);
    setImportSuccess(null);
    const invalidMsg = isEn
      ? 'Invalid JSON format or no recipes / daily menu found'
      : isPl
      ? 'Nieprawidłowy format JSON lub brak przepisów / dziennego menu'
      : 'Некорректный формат JSON или код не содержит рецептов / дневного меню';

    if (!importText.trim()) {
      setImportError(invalidMsg);
      return;
    }

    try {
      const parsed = JSON.parse(importText.trim());
      let importedRecipes: RecipeItem[] = [];
      let importedLibrary: LibraryFoodItem[] = [];
      let importedLogs: Record<string, DayLog> = {};

      if (Array.isArray(parsed)) {
        importedRecipes = parsed.filter((r) => r && r.name && Array.isArray(r.ingredients));
      } else if (parsed && typeof parsed === 'object') {
        if (Array.isArray(parsed.recipes)) {
          importedRecipes = parsed.recipes;
        } else if (parsed.name && Array.isArray(parsed.ingredients)) {
          importedRecipes = [parsed];
        }

        if (Array.isArray(parsed.libraryItems)) {
          importedLibrary = parsed.libraryItems;
        }

        if (parsed.dayLogs && typeof parsed.dayLogs === 'object') {
          importedLogs = parsed.dayLogs;
        } else if (parsed.date && Array.isArray(parsed.items)) {
          importedLogs = { [parsed.date]: parsed };
        }
      }

      const daysKeys = Object.keys(importedLogs);
      if (importedRecipes.length === 0 && importedLibrary.length === 0 && daysKeys.length === 0) {
        setImportError(invalidMsg);
        return;
      }

      // If user chose to import a single day's menu onto the selected target date
      let finalDayLogs = importedLogs;
      if (useTargetDateOverride && daysKeys.length === 1 && importTargetDate) {
        const sourceLog = importedLogs[daysKeys[0]];
        finalDayLogs = {
          [importTargetDate]: {
            ...sourceLog,
            date: importTargetDate,
          },
        };
      }

      onImportSharedData?.(
        {
          recipes: importedRecipes,
          libraryItems: importedLibrary,
          dayLogs: daysKeys.length > 0 ? finalDayLogs : undefined,
        },
        useTargetDateOverride ? importTargetDate : undefined
      );

      const okMsg = isEn
        ? `Imported: ${importedRecipes.length} recipes, ${daysKeys.length} menu day(s)`
        : isPl
        ? `Zaimportowano: ${importedRecipes.length} przepisów, ${daysKeys.length} dni menu`
        : `Успешно импортировано: рецептов — ${importedRecipes.length}, дней меню — ${daysKeys.length}`;
      setImportSuccess(okMsg);
      setImportText('');
    } catch {
      setImportError(invalidMsg);
    }
  };

  const [, setQuotaRefreshTick] = useState<number>(0);
  useEffect(() => {
    const onQuotaChange = () => setQuotaRefreshTick((n) => n + 1);
    window.addEventListener('sfa-quota-updated', onQuotaChange);
    return () => window.removeEventListener('sfa-quota-updated', onQuotaChange);
  }, []);

  const liveQuota = getQuotaStatus();

  return (
    <div className="space-y-3.5 max-w-3xl mx-auto pb-8">
      {/* 0. Верхняя панель разделов настроек */}
      <div className="flex items-center justify-between gap-2 px-1 pt-1 pb-1">
        <div className="flex items-center gap-2 min-w-0">
          <Settings className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className={`text-xs sm:text-sm font-bold truncate ${themeStyles.textPrimary}`}>
            {t.settingsSectionsTitle}
          </span>
          <span className="text-[11px] font-mono tabular-nums px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 shrink-0">
            {openCount} {t.openCountOfTotal} 9
          </span>
        </div>

        <PWAInstallButton
          variant="square"
          accentColor={config.theme.accentColor}
          langCode={config.language.code}
          themeStyles={themeStyles}
          borderRadius={config.theme.borderRadius}
        />
      </div>

      {/* 1. Баланс ИИ-запросов и активация ключа (пакет 500 запросов) */}
      <div
        className={`relative z-20 border ${themeStyles.borderColor} ${themeStyles.cardBg} ${radiusClass} p-4 sm:p-5 shadow-sm transition-all`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
              <Key className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className={`text-sm sm:text-base font-bold leading-snug ${themeStyles.textPrimary}`}>
                  {isEn
                    ? 'AI Requests Balance & Key'
                    : isPl
                    ? 'Bilans zapytań AI i klucz'
                    : 'Баланс ИИ-запросов и ключ доступа'}
                </h4>
                <span
                  className={`inline-flex items-center text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-lg border ${
                    liveQuota.isMasterKey
                      ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                      : liveQuota.remainingRequests > 0
                      ? 'bg-slate-800/90 border-slate-700 text-emerald-300'
                      : 'bg-amber-950/60 border-amber-500/50 text-amber-300'
                  }`}
                >
                  {liveQuota.isMasterKey
                    ? isEn
                      ? 'Remaining: ∞'
                      : isPl
                      ? 'Pozostało: ∞'
                      : 'Осталось: ∞'
                    : isEn
                    ? `Remaining: ${liveQuota.remainingRequests} / ${liveQuota.packageLimit}`
                    : isPl
                    ? `Pozostało: ${liveQuota.remainingRequests} / ${liveQuota.packageLimit}`
                    : `Осталось: ${liveQuota.remainingRequests} из ${liveQuota.packageLimit}`}
                </span>
              </div>
              <p className="text-xs leading-relaxed text-slate-400 break-words">
                {liveQuota.isMasterKey
                  ? isEn
                    ? 'Master key active — unlimited AI requests without restrictions'
                    : isPl
                    ? 'Klucz główny aktywny — nielimitowane zapytania AI'
                    : 'Активен мастер-ключ владельца — полный безлимит ИИ-запросов'
                  : liveQuota.hasAccessKey
                  ? isEn
                    ? 'Package of 500 AI requests (no expiration date, up to 2 devices)'
                    : isPl
                    ? 'Pakiet 500 zapytań AI (bez terminu ważności, do 2 urządzeń)'
                    : 'Активен пакет на 500 ИИ-запросов без срока действия (до 2 устройств)'
                  : isEn
                  ? 'Starter package: 100 free AI requests. Top up +500 requests or activate a key anytime'
                  : isPl
                  ? 'Pakiet startowy: 100 darmowych zapytań AI. Doładuj +500 zapytań lub aktywuj klucz'
                  : 'Стартовый пакет: 100 бесплатных ИИ-запросов. Вы можете пополнить баланс (+500 запросов) или ввести ключ заранее'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenApiKeyModal}
            className="min-h-[40px] px-4 py-2 rounded-xl font-bold text-xs text-white shadow-md flex items-center justify-center gap-1.5 shrink-0 transition active:scale-95 hover:opacity-95"
            style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-300 shrink-0" />
            <span>
              {isEn
                ? 'Top up / Enter Key'
                : isPl
                ? 'Doładuj / Wpisz klucz'
                : 'Пополнить / Ввести ключ'}
            </span>
          </button>
        </div>
      </div>

      {/* 2. Язык интерфейса */}
      <div
        className={`relative z-30 overflow-visible border ${themeStyles.borderColor} ${themeStyles.cardBg} ${radiusClass} p-4 sm:p-5 shadow-sm transition-all ${
          openSections.language ? 'space-y-4' : 'space-y-0'
        }`}
      >
        <div
          onClick={() => toggleSection('language')}
          className="flex items-start justify-between gap-3 cursor-pointer select-none group"
        >
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 mt-0.5">
              <Globe className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <h4
                className={`text-sm sm:text-base font-bold leading-snug break-words ${themeStyles.textPrimary} group-hover:text-cyan-400 transition-colors`}
              >
                {t.secLanguage}
              </h4>
              <p className="text-xs leading-relaxed text-slate-400 break-words">
                {t.secLanguageSub}
              </p>
              <div className="pt-1">
                <span className="inline-flex items-center text-[11px] font-mono px-2.5 py-0.5 rounded-lg bg-slate-800/90 border border-slate-700 text-slate-200 font-semibold">
                  {activeCode} • {activeLanguageName}
                </span>
              </div>
            </div>
          </div>

          <div className="p-1.5 rounded-lg text-slate-400 group-hover:text-white transition shrink-0">
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${
                openSections.language ? 'rotate-180' : ''
              }`}
            />
          </div>
        </div>

        {openSections.language && (
          <div className="space-y-3 pt-3.5 border-t border-slate-800/80 animate-in fade-in duration-150">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <span className="text-xs text-slate-400">{t.secLanguageSub}</span>
              <div className="shrink-0">
                <LanguageSelector
                  config={config}
                  themeStyles={themeStyles}
                  onSelectLanguage={onSelectLanguage}
                  onRequestNewLanguage={onRequestNewLanguage}
                />
              </div>
            </div>

            {/* Плитки установленных языков для прямого удобного выбора */}
            <div className="space-y-2">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {uniqueLanguages.map((lang) => {
                  const code2 = lang.code.slice(0, 2).toUpperCase();
                  const isActive = code2 === activeCode;
                  const displayName = lang.nativeName || lang.name || code2;
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => onSelectLanguage(lang)}
                      className={`min-h-[42px] flex items-center justify-between p-2.5 rounded-xl border text-left transition-all active:scale-95 ${
                        isActive
                          ? 'border-emerald-500 bg-emerald-950/30 text-white ring-2 ring-emerald-500/50 shadow-sm'
                          : 'border-slate-800 bg-slate-900/40 text-slate-300 hover:border-slate-700 hover:text-white'
                      }`}
                      title={`${displayName} (${code2})`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono font-bold text-xs px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-200 shrink-0">
                          {code2}
                        </span>
                        <span className="text-xs font-semibold truncate">{displayName}</span>
                      </div>
                      {isActive && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 ml-1" />}
                    </button>
                  );
                })}

                {/* Добавить новый язык через Gemini */}
                <button
                  type="button"
                  onClick={onRequestNewLanguage}
                  className="min-h-[42px] flex items-center justify-center gap-1.5 p-2.5 rounded-xl border border-dashed border-purple-500/50 bg-purple-950/20 hover:bg-purple-900/30 text-purple-300 text-xs font-semibold transition active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5 text-yellow-300 shrink-0" />
                  <span>+ Gemini AI</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Настройка всех нутриентов и норм (теперь между языком интерфейса и суточной нормой) */}
      <div className="relative z-10">
        <NutrientsManager
          metrics={config.metrics}
          onUpdateMetrics={onUpdateMetrics}
          themeStyles={themeStyles}
          accentColor={config.theme.accentColor}
          borderRadius={config.theme.borderRadius}
          apiKey={apiKey}
          isCollapsed={!openSections.nutrients}
          onToggleCollapse={() => toggleSection('nutrients')}
          langCode={config.language?.code}
          labels={config.language?.labels}
        />
      </div>

      {/* 4. Суточная норма */}
      <div className="relative z-10">
        <DailyNormCalculator
          metrics={config.metrics}
          goalMode={config.goalMode || 'maintain'}
          onUpdateGoalMode={onUpdateGoalMode}
          onUpdateMetrics={onUpdateMetrics}
          themeStyles={themeStyles}
          accentColor={config.theme.accentColor}
          borderRadius={config.theme.borderRadius}
          apiKey={apiKey}
          isCollapsed={!openSections.dailyNorm}
          onToggleCollapse={() => toggleSection('dailyNorm')}
          langCode={config.language?.code}
          labels={config.language?.labels}
          onOpenPaywallModal={onOpenApiKeyModal}
        />
      </div>

      {/* 5. Управление приёмами пищи и очередностью (теперь полностью сворачивается) */}
      <div className="relative z-10">
        <MealCategoriesManager
          categories={config.mealCategories}
          onUpdateCategories={onUpdateMealCategories}
          themeStyles={themeStyles}
          accentColor={config.theme.accentColor}
          borderRadius={config.theme.borderRadius}
          isCollapsed={!openSections.mealCategories}
          onToggleCollapse={() => toggleSection('mealCategories')}
          langCode={config.language?.code}
          labels={config.language?.labels}
        />
      </div>

      {/* 6. Режим отображения нутриентов (Compact опущено ниже описания) */}
      <div
        className={`relative z-10 border ${themeStyles.borderColor} ${themeStyles.cardBg} ${radiusClass} p-4 sm:p-5 shadow-sm transition-all ${
          openSections.nutrientMode ? 'space-y-4' : 'space-y-0'
        }`}
      >
        <div
          onClick={() => toggleSection('nutrientMode')}
          className="flex items-start justify-between gap-3 cursor-pointer select-none group"
        >
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
              <CircleDot className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <h4
                className={`text-sm sm:text-base font-bold leading-snug break-words ${themeStyles.textPrimary} group-hover:text-purple-400 transition-colors`}
              >
                {t.secNutrientMode}
              </h4>
              <p className="text-xs leading-relaxed text-slate-400 break-words">
                {t.secNutrientModeSub}
              </p>
              <div className="pt-1">
                <span className="inline-flex items-center text-[11px] font-mono px-2.5 py-0.5 rounded-lg bg-slate-800/90 border border-slate-700 text-slate-200 font-semibold">
                  {currentNutrientMode === 'compact'
                    ? isEn
                      ? 'Compact'
                      : isPl
                      ? 'Kompaktowy (Compact)'
                      : 'Компактный (Compact)'
                    : isEn
                    ? 'Circular (Circle)'
                    : isPl
                    ? 'Kołowy (Circle)'
                    : 'Круговой (Circle)'}
                </span>
              </div>
            </div>
          </div>

          <div className="p-1.5 rounded-lg text-slate-400 group-hover:text-white transition shrink-0">
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${
                openSections.nutrientMode ? 'rotate-180' : ''
              }`}
            />
          </div>
        </div>

        {openSections.nutrientMode && (
          <div className="pt-3.5 border-t border-slate-800/80 animate-in fade-in duration-150">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => onUpdateNutrientDisplayMode('compact')}
                className={`min-h-[44px] p-3 rounded-xl border text-left flex items-center justify-between transition-all active:scale-95 ${
                  currentNutrientMode === 'compact'
                    ? 'border-emerald-500 bg-emerald-950/30 text-white ring-2 ring-emerald-500/50'
                    : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-xs text-white">
                  <AlignLeft className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    {isEn
                      ? 'Compact Bars'
                      : isPl
                      ? 'Kompaktowe paski'
                      : 'Компактные полосы'}
                  </span>
                </div>
                {currentNutrientMode === 'compact' && (
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                )}
              </button>

              <button
                type="button"
                onClick={() => onUpdateNutrientDisplayMode('circles')}
                className={`min-h-[44px] p-3 rounded-xl border text-left flex items-center justify-between transition-all active:scale-95 ${
                  currentNutrientMode === 'circles'
                    ? 'border-emerald-500 bg-emerald-950/30 text-white ring-2 ring-emerald-500/50'
                    : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-xs text-white">
                  <CircleDot className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    {isEn
                      ? 'Circular Ring'
                      : isPl
                      ? 'Widok kołowy'
                      : 'Круговой кружок'}
                  </span>
                </div>
                {currentNutrientMode === 'circles' && (
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 7. Тема оформления (надпись Тёмная опущена ниже описания) */}
      <div
        className={`relative z-10 border ${themeStyles.borderColor} ${themeStyles.cardBg} ${radiusClass} p-4 sm:p-5 shadow-sm transition-all ${
          openSections.theme ? 'space-y-4' : 'space-y-0'
        }`}
      >
        <div
          onClick={() => toggleSection('theme')}
          className="flex items-start justify-between gap-3 cursor-pointer select-none group"
        >
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
              <Palette className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <h4
                className={`text-sm sm:text-base font-bold leading-snug break-words ${themeStyles.textPrimary} group-hover:text-emerald-400 transition-colors`}
              >
                {t.secTheme}
              </h4>
              <p className="text-xs leading-relaxed text-slate-400 break-words">
                {t.secThemeSub}
              </p>
              <div className="pt-1">
                <span className="inline-flex items-center text-[11px] font-mono px-2.5 py-0.5 rounded-lg bg-slate-800/90 border border-slate-700 text-slate-200 font-semibold">
                  {currentThemeLabel}
                </span>
              </div>
            </div>
          </div>

          <div className="p-1.5 rounded-lg text-slate-400 group-hover:text-white transition shrink-0">
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${
                openSections.theme ? 'rotate-180' : ''
              }`}
            />
          </div>
        </div>

        {openSections.theme && (
          <div className="pt-3.5 border-t border-slate-800/80 animate-in fade-in duration-150">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {themeModes.map((item) => {
                const isSelected = config.theme.mode === item.mode;
                return (
                  <button
                    key={item.mode}
                    type="button"
                    onClick={() => onUpdateThemeMode(item.mode)}
                    className={`min-h-[44px] p-3 rounded-xl border text-left flex items-center justify-between gap-2 transition-all active:scale-95 ${
                      item.previewBg
                    } ${
                      isSelected
                        ? 'ring-2 ring-emerald-400 font-bold shadow-md'
                        : 'opacity-85 hover:opacity-100'
                    }`}
                  >
                    <span className="text-xs leading-tight break-words">{item.label}</span>
                    {isSelected && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 8. Настройка звука (между Тема оформления и дизайн и Экспорт и импорт) */}
      <div
        id="sound-settings-section"
        className={`relative z-10 border ${themeStyles.borderColor} ${themeStyles.cardBg} ${radiusClass} p-4 sm:p-5 shadow-sm transition-all ${
          openSections.soundSettings ? 'space-y-4' : 'space-y-0'
        }`}
      >
        <div
          onClick={() => toggleSection('soundSettings')}
          className="flex items-start justify-between gap-3 cursor-pointer select-none group"
        >
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
              <Volume2 className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <h4
                className={`text-sm sm:text-base font-bold leading-snug break-words ${themeStyles.textPrimary} group-hover:text-amber-400 transition-colors`}
              >
                {isEn
                  ? 'Sound Settings'
                  : isPl
                  ? 'Ustawienia dźwięku'
                  : 'Настройка звука'}
              </h4>
              <p className="text-xs leading-relaxed text-slate-400 break-words">
                {isEn
                  ? 'Choose melodies for cooking timers and meal reminders, adjust volume and phone vibration'
                  : isPl
                  ? 'Wybierz melodie dla minutnika gotowania i przypomnień o posiłkach, głośność i wibracje'
                  : 'Выбор разных мелодий при готовке и при приёмах пищи, громкость и вибрация на телефоне'}
              </p>
              <div className="pt-1">
                <span className="inline-flex items-center text-[11px] font-mono tabular-nums px-2.5 py-0.5 rounded-lg bg-slate-800/90 border border-slate-700 text-amber-300 font-semibold">
                  {(() => {
                    const loc: 'ru' | 'en' | 'pl' = isEn ? 'en' : isPl ? 'pl' : 'ru';
                    const cookMeta =
                      SOUND_MELODIES.find((m) => m.id === soundConfig.cookingSoundId) ||
                      SOUND_MELODIES[0];
                    const mealMeta =
                      SOUND_MELODIES.find((m) => m.id === soundConfig.mealSoundId) ||
                      SOUND_MELODIES[0];
                    return `${Math.round(soundConfig.volume * 100)}% • ${cookMeta.icon} ${
                      cookMeta.name[loc].split(':')[0]
                    } / ${mealMeta.icon} ${mealMeta.name[loc].split(':')[0]}`;
                  })()}
                </span>
              </div>
            </div>
          </div>

          <div className="p-1.5 rounded-lg text-slate-400 group-hover:text-white transition shrink-0">
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${
                openSections.soundSettings ? 'rotate-180' : ''
              }`}
            />
          </div>
        </div>

        {openSections.soundSettings && (
          <div className="pt-3.5 border-t border-slate-800/80 space-y-4 animate-in fade-in duration-150 text-xs">
            {/* Volume & Phone Vibration Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200 flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>
                      {isEn
                        ? 'Signal Volume'
                        : isPl
                        ? 'Głośność sygnału'
                        : 'Громкость сигнала'}
                    </span>
                  </span>
                  <span className="font-mono tabular-nums font-bold text-amber-300">
                    {Math.round(soundConfig.volume * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={100}
                  step={5}
                  value={Math.round(soundConfig.volume * 100)}
                  onChange={(e) => {
                    const nextVol = Number(e.target.value) / 100;
                    handleSoundChange({ ...soundConfig, volume: nextVol });
                  }}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-900/70 border border-slate-800">
                <div className="flex items-center gap-2 min-w-0">
                  <Smartphone className="w-4 h-4 text-cyan-400 shrink-0" />
                  <div className="min-w-0">
                    <div className="font-bold text-slate-200 truncate">
                      {isEn
                        ? 'Phone Vibration'
                        : isPl
                        ? 'Wibracja w telefonie'
                        : 'Вибрация на телефоне'}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      {isEn
                        ? 'Vibrate when alarm rings'
                        : isPl
                        ? 'Wibruj podczas alarmu'
                        : 'Виброотклик при сигнале'}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    handleSoundChange({ ...soundConfig, vibrate: !soundConfig.vibrate })
                  }
                  className={`min-h-[34px] px-3 py-1 rounded-lg font-bold border transition shrink-0 ${
                    soundConfig.vibrate
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  {soundConfig.vibrate
                    ? isEn
                      ? 'ON'
                      : isPl
                      ? 'WŁ.'
                      : 'ВКЛ'
                    : isEn
                    ? 'OFF'
                    : isPl
                    ? 'WYŁ.'
                    : 'ВЫКЛ'}
                </button>
              </div>
            </div>

            {/* Two columns: 1) Cooking Melody, 2) Meal Reminder Melody */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* Column 1: Cooking Timer Melody */}
              <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/50 space-y-2.5">
                <div className="flex items-center gap-2 font-bold text-slate-100 pb-1 border-b border-slate-800/80">
                  <ChefHat className="w-4 h-4 text-orange-400 shrink-0" />
                  <span>
                    {isEn
                      ? 'Melody for Cooking (Recipe Timer)'
                      : isPl
                      ? 'Melodia przy gotowaniu (Minutnik)'
                      : 'Мелодия при готовке (таймер рецептов)'}
                  </span>
                </div>

                <div className="space-y-1.5">
                  {SOUND_MELODIES.map((melody) => {
                    const loc: 'ru' | 'en' | 'pl' = isEn ? 'en' : isPl ? 'pl' : 'ru';
                    const isSelected = soundConfig.cookingSoundId === melody.id;
                    return (
                      <div
                        key={`cook_${melody.id}`}
                        className={`flex items-center justify-between gap-2 p-2 rounded-xl border transition ${
                          isSelected
                            ? 'border-orange-500/60 bg-orange-950/25 text-white'
                            : 'border-slate-800/90 bg-slate-900/50 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            handleSoundChange({
                              ...soundConfig,
                              cookingSoundId: melody.id as SoundMelodyId,
                            });
                            playSoundMelody(melody.id, {
                              volume: soundConfig.volume,
                              vibrate: soundConfig.vibrate,
                            });
                          }}
                          className="flex items-start gap-2 text-left flex-1 min-w-0"
                        >
                          <span className="text-base leading-none mt-0.5 shrink-0">
                            {melody.icon}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="font-bold leading-snug break-words flex items-center gap-1.5">
                              <span>{melody.name[loc]}</span>
                              {isSelected && (
                                <Check className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 leading-tight mt-0.5 break-words">
                              {melody.description[loc]}
                            </div>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            playSoundMelody(melody.id, {
                              volume: soundConfig.volume,
                              vibrate: soundConfig.vibrate,
                            });
                          }}
                          className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-orange-500/20 border border-slate-700 hover:border-orange-500/40 text-orange-300 flex items-center justify-center shrink-0 transition active:scale-95"
                          title={
                            isEn
                              ? 'Preview sound'
                              : isPl
                              ? 'Odsłuchaj dźwięk'
                              : 'Прослушать звук'
                          }
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Column 2: Meal Reminder Melody */}
              <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/50 space-y-2.5">
                <div className="flex items-center gap-2 font-bold text-slate-100 pb-1 border-b border-slate-800/80">
                  <Bell className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    {isEn
                      ? 'Melody for Meals & Medications'
                      : isPl
                      ? 'Melodia dla posiłków i leków'
                      : 'Мелодия при приёмах пищи и лекарств'}
                  </span>
                </div>

                <div className="space-y-1.5">
                  {SOUND_MELODIES.map((melody) => {
                    const loc: 'ru' | 'en' | 'pl' = isEn ? 'en' : isPl ? 'pl' : 'ru';
                    const isSelected = soundConfig.mealSoundId === melody.id;
                    return (
                      <div
                        key={`meal_${melody.id}`}
                        className={`flex items-center justify-between gap-2 p-2 rounded-xl border transition ${
                          isSelected
                            ? 'border-amber-500/60 bg-amber-950/25 text-white'
                            : 'border-slate-800/90 bg-slate-900/50 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            handleSoundChange({
                              ...soundConfig,
                              mealSoundId: melody.id as SoundMelodyId,
                            });
                            playSoundMelody(melody.id, {
                              volume: soundConfig.volume,
                              vibrate: soundConfig.vibrate,
                            });
                          }}
                          className="flex items-start gap-2 text-left flex-1 min-w-0"
                        >
                          <span className="text-base leading-none mt-0.5 shrink-0">
                            {melody.icon}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="font-bold leading-snug break-words flex items-center gap-1.5">
                              <span>{melody.name[loc]}</span>
                              {isSelected && (
                                <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 leading-tight mt-0.5 break-words">
                              {melody.description[loc]}
                            </div>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            playSoundMelody(melody.id, {
                              volume: soundConfig.volume,
                              vibrate: soundConfig.vibrate,
                            });
                          }}
                          className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-amber-500/20 border border-slate-700 hover:border-amber-500/40 text-amber-300 flex items-center justify-center shrink-0 transition active:scale-95"
                          title={
                            isEn
                              ? 'Preview sound'
                              : isPl
                              ? 'Odsłuchaj dźwięk'
                              : 'Прослушать звук'
                          }
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 9. Экспорт и импорт (Импорт рецептов и импорт-экспорт дневного меню — между Настройка звука и Управление данными) */}
      <div
        id="export-import-settings-section"
        className={`relative z-10 border ${themeStyles.borderColor} ${themeStyles.cardBg} ${radiusClass} p-4 sm:p-5 shadow-sm transition-all ${
          openSections.exportImport ? 'space-y-4' : 'space-y-0'
        }`}
      >
        <div
          onClick={() => toggleSection('exportImport')}
          className="flex items-start justify-between gap-3 cursor-pointer select-none group"
        >
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0 mt-0.5">
              <Share2 className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <h4
                className={`text-sm sm:text-base font-bold leading-snug break-words ${themeStyles.textPrimary} group-hover:text-teal-400 transition-colors`}
              >
                {isEn
                  ? 'Export & Import'
                  : isPl
                  ? 'Eksport i Import'
                  : 'Экспорт и импорт'}
              </h4>
              <p className="text-xs leading-relaxed text-slate-400 break-words">
                {isEn
                  ? 'Import recipes and export or import your daily menu to transfer to another day or share'
                  : isPl
                  ? 'Import przepisów oraz eksport i import dziennego menu na inny dzień lub do udostępnienia'
                  : 'Импорт рецептов и импорт-экспорт дневного меню для переноса на другой день или обмена'}
              </p>
              <div className="pt-1">
                <span className="inline-flex items-center text-[11px] font-mono tabular-nums px-2.5 py-0.5 rounded-lg bg-slate-800/90 border border-slate-700 text-teal-300 font-semibold">
                  {isEn
                    ? `${recipes.length} recipes • Menu (${currentDateStr})`
                    : isPl
                    ? `${recipes.length} przepisów • Menu (${currentDateStr})`
                    : `Рецепты (${recipes.length}) • Меню (${currentDateStr})`}
                </span>
              </div>
            </div>
          </div>

          <div className="p-1.5 rounded-lg text-slate-400 group-hover:text-white transition shrink-0">
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${
                openSections.exportImport ? 'rotate-180' : ''
              }`}
            />
          </div>
        </div>

        {openSections.exportImport && (
          <div className="pt-3.5 border-t border-slate-800/80 space-y-4 animate-in fade-in duration-150 text-xs">
            {/* Switch between Import and Export */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setEiMode('import')}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg font-bold text-xs transition ${
                  eiMode === 'import'
                    ? 'bg-cyan-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Upload className="w-4 h-4 shrink-0" />
                <span>
                  {isEn
                    ? 'Import (Recipes & Daily Menu)'
                    : isPl
                    ? 'Import (Przepisy i Dzienne menu)'
                    : 'Импорт (Рецепты и Дневное меню)'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setEiMode('export')}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg font-bold text-xs transition ${
                  eiMode === 'export'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Download className="w-4 h-4 shrink-0" />
                <span>
                  {isEn
                    ? 'Export (Daily Menu & Recipes)'
                    : isPl
                    ? 'Eksport (Dzienne menu i Przepisy)'
                    : 'Экспорт (Дневное меню и Рецепты)'}
                </span>
              </button>
            </div>

            {eiMode === 'import' ? (
              <div className="space-y-3.5">
                <input
                  ref={importFileInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleUploadImportFile}
                  className="hidden"
                />

                {/* Target Date selector when importing Daily Menu */}
                <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/60 space-y-2.5">
                  <label className="flex items-center gap-2 font-bold text-slate-200 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={useTargetDateOverride}
                      onChange={(e) => setUseTargetDateOverride(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-600 text-cyan-500"
                    />
                    <CalendarDays className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>
                      {isEn
                        ? 'Apply imported daily menu to a specific date:'
                        : isPl
                        ? 'Zastosuj zaimportowane dzienne menu do wybranego dnia:'
                        : 'Применить импортируемое дневное меню на выбранную дату:'}
                    </span>
                  </label>

                  {useTargetDateOverride && (
                    <div className="flex flex-wrap items-center gap-2 pl-6">
                      <input
                        type="date"
                        value={importTargetDate}
                        onChange={(e) => {
                          if (e.target.value) setImportTargetDate(e.target.value);
                        }}
                        className="min-h-[38px] px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setImportTargetDate(currentDateStr)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold transition"
                      >
                        {isEn
                          ? `Active day (${currentDateStr})`
                          : isPl
                          ? `Aktywny dzień (${currentDateStr})`
                          : `Текущий день (${currentDateStr})`}
                      </button>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => importFileInputRef.current?.click()}
                  className="w-full py-2.5 px-4 rounded-xl border-2 border-dashed border-cyan-500/40 bg-cyan-950/20 hover:bg-cyan-950/40 text-cyan-200 font-bold flex items-center justify-center gap-2 transition active:scale-95"
                >
                  <FileJson className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>
                    {isEn
                      ? 'Choose file (.json) with recipe or daily menu'
                      : isPl
                      ? 'Wybierz plik (.json) z przepisem lub dziennym menu'
                      : 'Выбрать файл (.json) с рецептом или дневным меню'}
                  </span>
                </button>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-semibold text-slate-300">
                    {isEn
                      ? 'Or paste code copied via the Share button (recipe or daily menu):'
                      : isPl
                      ? 'Lub wklej kod skopiowany przyciskiem Udostępnij (przepis lub dzienne menu):'
                      : 'Или вставьте код, скопированный кнопкой «Поделиться» (рецепт или дневное меню):'}
                  </label>
                  <textarea
                    value={importText}
                    onChange={(e) => {
                      setImportText(e.target.value);
                      setImportError(null);
                      setImportSuccess(null);
                    }}
                    placeholder={
                      isEn
                        ? 'Paste JSON code here...'
                        : isPl
                        ? 'Wklej tutaj kod JSON...'
                        : 'Вставьте скопированный код сюда...'
                    }
                    rows={5}
                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-500 font-mono text-[11px] text-white placeholder-slate-500 focus:outline-hidden"
                  />
                </div>

                {importError && (
                  <div className="p-2.5 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{importError}</span>
                  </div>
                )}

                {importSuccess && (
                  <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{importSuccess}</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleConfirmSettingsImport}
                  disabled={!importText.trim()}
                  className="w-full py-2.5 px-4 rounded-xl font-bold bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white shadow-md flex items-center justify-center gap-2 transition active:scale-95"
                >
                  <Upload className="w-4 h-4 shrink-0" />
                  <span>
                    {isEn
                      ? 'Import Recipes / Daily Menu'
                      : isPl
                      ? 'Importuj Przepisy / Dzienne menu'
                      : 'Импортировать рецепты / дневное меню'}
                  </span>
                </button>
              </div>
            ) : (
              <div className="space-y-3.5">
                {/* Daily Menu Export Options */}
                <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/50 space-y-2.5">
                  <label className="flex items-center gap-2 font-bold text-white cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={exportMenuEnabled}
                      onChange={(e) => setExportMenuEnabled(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-600 text-emerald-500"
                    />
                    <CalendarDays className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>
                      {isEn
                        ? 'Export Daily Menu'
                        : isPl
                        ? 'Eksportuj Dzienne menu'
                        : 'Экспортировать дневное меню'}
                    </span>
                  </label>

                  {exportMenuEnabled && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setMenuScope('current')}
                        className={`p-2.5 rounded-xl border text-left transition ${
                          menuScope === 'current'
                            ? 'border-cyan-500/50 bg-cyan-950/30 text-white font-bold'
                            : 'border-slate-800 bg-slate-900/40 text-slate-400'
                        }`}
                      >
                        <div>
                          {isEn
                            ? 'Selected day only'
                            : isPl
                            ? 'Tylko wybrany dzień'
                            : 'Только выбранный день'}
                        </div>
                        <div className="text-[10px] font-mono text-cyan-300 mt-0.5">
                          {currentDateStr} ({dayLogs[currentDateStr]?.items?.length || 0})
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setMenuScope('all')}
                        className={`p-2.5 rounded-xl border text-left transition ${
                          menuScope === 'all'
                            ? 'border-cyan-500/50 bg-cyan-950/30 text-white font-bold'
                            : 'border-slate-800 bg-slate-900/40 text-slate-400'
                        }`}
                      >
                        <div>
                          {isEn
                            ? 'All logged days'
                            : isPl
                            ? 'Wszystkie zapisane dni'
                            : 'Все записанные дни'}
                        </div>
                        <div className="text-[10px] font-mono text-cyan-300 mt-0.5">
                          {Object.keys(dayLogs).length}
                        </div>
                      </button>
                    </div>
                  )}
                </div>

                {/* Optional Recipes Export Selection */}
                <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/50 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="flex items-center gap-2 font-bold text-white cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={exportRecipesEnabled}
                        onChange={(e) => {
                          setExportRecipesEnabled(e.target.checked);
                          if (e.target.checked && selectedRecipeIds.length === 0) {
                            setSelectedRecipeIds(recipes.map((r) => r.id));
                          }
                        }}
                        className="w-4 h-4 rounded border-slate-600 text-emerald-500"
                      />
                      <BookOpen className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>
                        {isEn
                          ? 'Include Recipes (and their ingredients)'
                          : isPl
                          ? 'Dołącz przepisy (i ich produkty)'
                          : 'Включить рецепты (и их продукты)'}
                      </span>
                    </label>

                    {exportRecipesEnabled && recipes.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedRecipeIds(recipes.map((r) => r.id))}
                          className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-200 transition"
                        >
                          {isEn ? 'Select all' : isPl ? 'Zaznacz wszystkie' : 'Выбрать все'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedRecipeIds([])}
                          className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-400 hover:text-white transition"
                        >
                          {isEn ? 'Clear' : isPl ? 'Odznacz' : 'Снять выбор'}
                        </button>
                      </div>
                    )}
                  </div>

                  {exportRecipesEnabled && (
                    <div className="max-h-36 overflow-y-auto space-y-1.5 pt-1">
                      {recipes.map((r) => {
                        const isChecked = selectedRecipeIds.includes(r.id);
                        return (
                          <label
                            key={r.id}
                            className={`flex items-center justify-between gap-2 p-2 rounded-lg border cursor-pointer transition ${
                              isChecked
                                ? 'border-emerald-500/40 bg-emerald-950/20 text-white'
                                : 'border-slate-800 bg-slate-900/40 text-slate-400'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedRecipeIds((prev) => [...prev, r.id]);
                                  } else {
                                    setSelectedRecipeIds((prev) =>
                                      prev.filter((id) => id !== r.id)
                                    );
                                  }
                                }}
                                className="w-4 h-4 rounded border-slate-600 text-emerald-500 shrink-0"
                              />
                              <span className="font-semibold break-words">{r.name}</span>
                            </div>
                            <span className="text-[10px] font-mono text-slate-400 shrink-0">
                              {r.totalGrams}g
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                {hasAnythingToExport && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={handleCopyExportJson}
                      className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-white shadow-md transition active:scale-95"
                      style={{ backgroundColor: config.theme.accentColor }}
                    >
                      {eiCopied ? (
                        <>
                          <Check className="w-4 h-4 shrink-0" />
                          <span>
                            {isEn ? 'Code copied!' : isPl ? 'Skopiowano kod!' : 'Код скопирован!'}
                          </span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 shrink-0" />
                          <span>
                            {isEn ? 'Copy code' : isPl ? 'Skopiuj kod' : 'Скопировать код'}
                          </span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadExportJson}
                      className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white transition active:scale-95"
                    >
                      <Download className="w-4 h-4 shrink-0" />
                      <span>
                        {isEn
                          ? 'Download file (.json)'
                          : isPl
                          ? 'Pobierz plik (.json)'
                          : 'Скачать файл (.json)'}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 9. Управление данными и сброс (v6.5 • JSON опущено ниже описания) */}
      <div
        className={`relative z-10 border ${themeStyles.borderColor} ${themeStyles.cardBg} ${radiusClass} p-4 sm:p-5 shadow-sm transition-all ${
          openSections.dataReset ? 'space-y-4' : 'space-y-0'
        }`}
      >
        <div
          onClick={() => toggleSection('dataReset')}
          className="flex items-start justify-between gap-3 cursor-pointer select-none group"
        >
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 mt-0.5">
              <Code2 className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <h4
                className={`text-sm sm:text-base font-bold leading-snug break-words ${themeStyles.textPrimary} group-hover:text-cyan-400 transition-colors`}
              >
                {t.secDataReset}
              </h4>
              <p className="text-xs leading-relaxed text-slate-400 break-words">
                {t.secDataResetSub}
              </p>
              <div className="pt-1">
                <span className="inline-flex items-center text-[11px] font-mono tabular-nums px-2.5 py-0.5 rounded-lg bg-slate-800/90 border border-slate-700 text-slate-200 font-semibold">
                  v{config.version} • JSON
                </span>
              </div>
            </div>
          </div>

          <div className="p-1.5 rounded-lg text-slate-400 group-hover:text-white transition shrink-0">
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${
                openSections.dataReset ? 'rotate-180' : ''
              }`}
            />
          </div>
        </div>

        {openSections.dataReset && (
          <div className="pt-3.5 border-t border-slate-800/80 animate-in fade-in duration-150">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onOpenConfigModal}
                className="min-h-[42px] flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 transition active:scale-95"
              >
                <Code2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>userConfig.json</span>
              </button>

              <button
                type="button"
                onClick={onOpenResetModal}
                className="min-h-[42px] flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-red-500/40 bg-red-950/40 hover:bg-red-900/50 text-red-200 transition active:scale-95"
              >
                <RotateCcw className="w-3.5 h-3.5 text-red-400 shrink-0" />
                <span>{t.restoreOriginal}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 10. Обратная связь / Feedback (В самом низу меню настроек) */}
      <div
        className={`relative z-10 border ${themeStyles.borderColor} ${themeStyles.cardBg} ${radiusClass} p-4 sm:p-5 shadow-sm transition-all ${
          openSections.feedback ? 'space-y-4' : 'space-y-0'
        }`}
      >
        <div
          onClick={() => toggleSection('feedback')}
          className="flex items-start justify-between gap-3 cursor-pointer select-none group"
        >
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 mt-0.5">
              <MessageCircle className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <h4
                className={`text-sm sm:text-base font-bold leading-snug break-words ${themeStyles.textPrimary} group-hover:text-sky-400 transition-colors`}
              >
                {isEn ? 'Feedback & Support' : isPl ? 'Kontakt i opinie' : 'Обратная связь'}
              </h4>
              <p className="text-xs leading-relaxed text-slate-400 break-words">
                {isEn
                  ? 'Questions, suggestions, or support via Telegram and Email'
                  : isPl
                  ? 'Pytania, sugestie lub wsparcie przez Telegram i Email'
                  : 'Вопросы, предложения и поддержка в Telegram и по электронной почте'}
              </p>
            </div>
          </div>

          <div className="p-1.5 rounded-lg text-slate-400 group-hover:text-white transition shrink-0">
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${
                openSections.feedback ? 'rotate-180' : ''
              }`}
            />
          </div>
        </div>

        {openSections.feedback && (
          <div className="pt-3.5 border-t border-slate-800/80 animate-in fade-in duration-150">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <a
                href="https://t.me/smartfoodasystent"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-xl border border-sky-500/30 bg-sky-950/25 hover:bg-sky-900/35 text-slate-100 transition active:scale-[0.99]"
              >
                <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
                  <Send className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] text-slate-400 font-medium">Telegram</div>
                  <div className="text-xs sm:text-sm font-bold text-sky-300 truncate">
                    https://t.me/smartfoodasystent
                  </div>
                </div>
              </a>

              <a
                href="mailto:smartfoodasystent@gmail.com"
                className="flex items-center gap-3 p-3 rounded-xl border border-emerald-500/30 bg-emerald-950/25 hover:bg-emerald-900/35 text-slate-100 transition active:scale-[0.99]"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] text-slate-400 font-medium">Email</div>
                  <div className="text-xs sm:text-sm font-bold text-emerald-300 truncate">
                    smartfoodasystent@gmail.com
                  </div>
                </div>
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
