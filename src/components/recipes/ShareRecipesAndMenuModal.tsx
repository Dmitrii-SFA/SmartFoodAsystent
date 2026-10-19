import React, { useState, useRef } from 'react';
import {
  RecipeItem,
  LibraryFoodItem,
  DayLog,
  LocalizationLabels,
} from '../../types/config';
import {
  X,
  Download,
  Upload,
  Copy,
  Check,
  Share2,
  BookOpen,
  CalendarDays,
  FileJson,
  AlertCircle,
} from 'lucide-react';

interface SharePackagePayload {
  type: 'pwa_calorie_share_v1';
  exportedAt: string;
  recipes?: RecipeItem[];
  libraryItems?: LibraryFoodItem[];
  dayLogs?: Record<string, DayLog>;
}

interface ShareRecipesAndMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipes: RecipeItem[];
  library: LibraryFoodItem[];
  currentDateStr: string;
  dayLogs?: Record<string, DayLog>;
  accentColor: string;
  langCode?: string;
  labels?: Partial<LocalizationLabels>;
  onImportData: (data: {
    recipes?: RecipeItem[];
    libraryItems?: LibraryFoodItem[];
    dayLogs?: Record<string, DayLog>;
  }) => void;
}

const MODAL_TEXTS = {
  ru: {
    title: 'Экспорт и Импорт (Рецепты и Дневное меню)',
    subtitle: 'Делитесь своими рецептами и дневным меню через файл или текстовый код',
    tabExport: 'Экспорт (Поделиться)',
    tabImport: 'Импорт (Загрузить)',
    includeRecipes: 'Включить рецепты (и их продукты)',
    selectAll: 'Выбрать все',
    deselectAll: 'Снять выбор',
    noRecipes: 'Нет сохраненных рецептов',
    includeDailyMenu: 'Включить дневное меню',
    currentDayOnly: 'Только выбранный день',
    allLoggedDays: 'Все записанные дни',
    itemsCount: 'блюд',
    downloadFileBtn: 'Скачать файл (.json)',
    copyCodeBtn: 'Скопировать код',
    copiedBtn: 'Код скопирован!',
    exportPreviewLabel: 'Код для пересылки (можно скопировать и отправить в мессенджере):',
    nothingSelected: 'Выберите хотя бы один рецепт или дневное меню для экспорта',
    uploadFileBtn: 'Выбрать файл (.json)',
    orPasteLabel: 'Или вставьте скопированный код рецепта / дневного меню:',
    pastePlaceholder: 'Вставьте JSON-код сюда...',
    importBtn: 'Импортировать в приложение',
    invalidJson: 'Некорректный формат JSON или файл не содержит рецептов / меню',
    importSuccessPrefix: 'Импортировано:',
    recipesWord: 'рецептов',
    productsWord: 'продуктов',
    daysWord: 'дней меню',
    closeBtn: 'Закрыть',
  },
  en: {
    title: 'Export & Import (Recipes & Daily Menu)',
    subtitle: 'Share your custom recipes and daily menu via file or text code',
    tabExport: 'Export (Share)',
    tabImport: 'Import (Load)',
    includeRecipes: 'Include recipes (and their ingredients)',
    selectAll: 'Select all',
    deselectAll: 'Deselect all',
    noRecipes: 'No saved recipes',
    includeDailyMenu: 'Include Daily Menu',
    currentDayOnly: 'Selected day only',
    allLoggedDays: 'All logged days',
    itemsCount: 'items',
    downloadFileBtn: 'Download file (.json)',
    copyCodeBtn: 'Copy code',
    copiedBtn: 'Code copied!',
    exportPreviewLabel: 'Shareable code (copy and send via messenger):',
    nothingSelected: 'Select at least one recipe or daily menu to export',
    uploadFileBtn: 'Choose file (.json)',
    orPasteLabel: 'Or paste copied recipe / daily menu JSON code:',
    pastePlaceholder: 'Paste JSON code here...',
    importBtn: 'Import into App',
    invalidJson: 'Invalid JSON format or no recipes / daily menu found',
    importSuccessPrefix: 'Imported:',
    recipesWord: 'recipes',
    productsWord: 'products',
    daysWord: 'menu days',
    closeBtn: 'Close',
  },
  pl: {
    title: 'Eksport i Import (Przepisy i Dzienne menu)',
    subtitle: 'Udostępniaj swoje przepisy i dzienne menu przez plik lub kod tekstowy',
    tabExport: 'Eksport (Udostępnij)',
    tabImport: 'Import (Wczytaj)',
    includeRecipes: 'Dołącz przepisy (i ich produkty)',
    selectAll: 'Zaznacz wszystkie',
    deselectAll: 'Odznacz wszystkie',
    noRecipes: 'Brak zapisanych przepisów',
    includeDailyMenu: 'Dołącz Dzienne menu',
    currentDayOnly: 'Tylko wybrany dzień',
    allLoggedDays: 'Wszystkie zapisane dni',
    itemsCount: 'pozycji',
    downloadFileBtn: 'Pobierz plik (.json)',
    copyCodeBtn: 'Skopiuj kod',
    copiedBtn: 'Skopiowano kod!',
    exportPreviewLabel: 'Kod do udostępnienia (skopiuj i wyślij w komunikatorze):',
    nothingSelected: 'Wybierz co najmniej jeden przepis lub dzienne menu do eksportu',
    uploadFileBtn: 'Wybierz plik (.json)',
    orPasteLabel: 'Lub wklej skopiowany kod JSON przepisu / dziennego menu:',
    pastePlaceholder: 'Wklej tutaj kod JSON...',
    importBtn: 'Importuj do aplikacji',
    invalidJson: 'Nieprawidłowy format JSON lub brak przepisów / menu',
    importSuccessPrefix: 'Zaimportowano:',
    recipesWord: 'przepisów',
    productsWord: 'produktów',
    daysWord: 'dni menu',
    closeBtn: 'Zamknij',
  },
};

export const ShareRecipesAndMenuModal: React.FC<ShareRecipesAndMenuModalProps> = ({
  isOpen,
  onClose,
  recipes,
  library,
  currentDateStr,
  dayLogs = {},
  accentColor,
  langCode = 'ru',
  onImportData,
}) => {
  const code = (langCode || 'ru').slice(0, 2).toLowerCase() as 'ru' | 'en' | 'pl';
  const txt = MODAL_TEXTS[code] || MODAL_TEXTS.ru;

  const [mode, setMode] = useState<'export' | 'import'>('export');
  const [exportRecipesEnabled, setExportRecipesEnabled] = useState<boolean>(true);
  const [selectedRecipeIds, setSelectedRecipeIds] = useState<string[]>(() =>
    recipes.map((r) => r.id)
  );
  const [exportMenuEnabled, setExportMenuEnabled] = useState<boolean>(true);
  const [menuScope, setMenuScope] = useState<'current' | 'all'>('current');
  const [copied, setCopied] = useState(false);

  // Import state
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  // Build export payload
  const buildExportPayload = (): SharePackagePayload => {
    const chosenRecipes = exportRecipesEnabled
      ? recipes.filter((r) => selectedRecipeIds.includes(r.id))
      : [];

    // Automatically collect library items referenced by chosen recipes
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
      type: 'pwa_calorie_share_v1',
      exportedAt: new Date().toISOString(),
      recipes: chosenRecipes.length > 0 ? chosenRecipes : undefined,
      libraryItems: bundledLibraryItems.length > 0 ? bundledLibraryItems : undefined,
      dayLogs: exportedDayLogs,
    };
  };

  const payloadObj = buildExportPayload();
  const hasAnythingToExport =
    (exportRecipesEnabled && selectedRecipeIds.length > 0) || exportMenuEnabled;
  const serializedJson = JSON.stringify(payloadObj, null, 2);

  const handleDownloadJson = () => {
    if (!hasAnythingToExport) return;
    const blob = new Blob([serializedJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recipes-and-menu-${currentDateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyJson = async () => {
    if (!hasAnythingToExport) return;
    try {
      await navigator.clipboard.writeText(serializedJson);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const content = String(reader.result || '');
      setImportText(content);
      setImportError(null);
      setImportSuccess(null);
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = () => {
    setImportError(null);
    setImportSuccess(null);
    if (!importText.trim()) {
      setImportError(txt.invalidJson);
      return;
    }

    try {
      const parsed = JSON.parse(importText.trim());
      let importedRecipes: RecipeItem[] = [];
      let importedLibrary: LibraryFoodItem[] = [];
      let importedLogs: Record<string, DayLog> = {};

      if (Array.isArray(parsed)) {
        // Direct array of recipes
        importedRecipes = parsed.filter((r) => r && r.name && Array.isArray(r.ingredients));
      } else if (parsed && typeof parsed === 'object') {
        if (Array.isArray(parsed.recipes)) {
          importedRecipes = parsed.recipes;
        } else if (parsed.name && Array.isArray(parsed.ingredients)) {
          // Single recipe object
          importedRecipes = [parsed];
        }

        if (Array.isArray(parsed.libraryItems)) {
          importedLibrary = parsed.libraryItems;
        }

        if (parsed.dayLogs && typeof parsed.dayLogs === 'object') {
          importedLogs = parsed.dayLogs;
        } else if (parsed.date && Array.isArray(parsed.items)) {
          // Single DayLog object
          importedLogs = { [parsed.date]: parsed };
        }
      }

      const daysCount = Object.keys(importedLogs).length;
      if (importedRecipes.length === 0 && importedLibrary.length === 0 && daysCount === 0) {
        setImportError(txt.invalidJson);
        return;
      }

      onImportData({
        recipes: importedRecipes,
        libraryItems: importedLibrary,
        dayLogs: daysCount > 0 ? importedLogs : undefined,
      });

      setImportSuccess(
        `${txt.importSuccessPrefix} ${importedRecipes.length} ${txt.recipesWord}, ${importedLibrary.length} ${txt.productsWord}, ${daysCount} ${txt.daysWord}`
      );
      setImportText('');
    } catch {
      setImportError(txt.invalidJson);
    }
  };

  const currentDayItemsCount = dayLogs[currentDateStr]?.items?.length || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl border border-slate-700 bg-slate-900 rounded-2xl shadow-2xl p-4 sm:p-5 space-y-4 max-h-[92vh] overflow-y-auto text-xs">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${accentColor}25`, color: accentColor }}
            >
              <Share2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-white leading-snug break-words">
                {txt.title}
              </h3>
              <p className="text-[11px] text-slate-400 leading-snug break-words mt-0.5">
                {txt.subtitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setMode('export')}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg font-bold text-xs transition ${
              mode === 'export'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Download className="w-4 h-4 shrink-0" />
            <span className="break-words">{txt.tabExport}</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('import')}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg font-bold text-xs transition ${
              mode === 'import'
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Upload className="w-4 h-4 shrink-0" />
            <span className="break-words">{txt.tabImport}</span>
          </button>
        </div>

        {mode === 'export' ? (
          <div className="space-y-3.5">
            {/* 1. Recipes Section */}
            <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/50 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="flex items-center gap-2 font-bold text-white cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={exportRecipesEnabled}
                    onChange={(e) => setExportRecipesEnabled(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-600 text-emerald-500"
                  />
                  <BookOpen className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="break-words">{txt.includeRecipes}</span>
                </label>

                {exportRecipesEnabled && recipes.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSelectedRecipeIds(recipes.map((r) => r.id))}
                      className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-200 transition"
                    >
                      {txt.selectAll}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedRecipeIds([])}
                      className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-400 hover:text-white transition"
                    >
                      {txt.deselectAll}
                    </button>
                  </div>
                )}
              </div>

              {exportRecipesEnabled && (
                <div className="max-h-40 overflow-y-auto space-y-1.5 pt-1">
                  {recipes.length === 0 ? (
                    <div className="text-slate-500 italic py-2 text-center">{txt.noRecipes}</div>
                  ) : (
                    recipes.map((r) => {
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
                                  setSelectedRecipeIds((prev) => prev.filter((id) => id !== r.id));
                                }
                              }}
                              className="w-4 h-4 rounded border-slate-600 text-emerald-500 shrink-0"
                            />
                            <span className="font-semibold break-words leading-snug">{r.name}</span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400 shrink-0">
                            {r.totalGrams}g
                          </span>
                        </label>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* 2. Daily Menu Section */}
            <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/50 space-y-2.5">
              <label className="flex items-center gap-2 font-bold text-white cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={exportMenuEnabled}
                  onChange={(e) => setExportMenuEnabled(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-600 text-emerald-500"
                />
                <CalendarDays className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="break-words">{txt.includeDailyMenu}</span>
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
                    <div className="break-words">{txt.currentDayOnly}</div>
                    <div className="text-[10px] font-mono text-cyan-300 mt-0.5">
                      {currentDateStr} ({currentDayItemsCount} {txt.itemsCount})
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
                    <div className="break-words">{txt.allLoggedDays}</div>
                    <div className="text-[10px] font-mono text-cyan-300 mt-0.5">
                      {Object.keys(dayLogs).length} {txt.daysWord}
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Export Action Buttons */}
            {!hasAnythingToExport ? (
              <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-500/40 text-amber-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{txt.nothingSelected}</span>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={handleDownloadJson}
                    className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-white shadow-md transition active:scale-95"
                    style={{ backgroundColor: accentColor }}
                  >
                    <Download className="w-4 h-4 shrink-0" />
                    <span>{txt.downloadFileBtn}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyJson}
                    className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white transition active:scale-95"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="text-emerald-300">{txt.copiedBtn}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 shrink-0" />
                        <span>{txt.copyCodeBtn}</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] text-slate-400 block">
                    {txt.exportPreviewLabel}
                  </span>
                  <textarea
                    readOnly
                    value={serializedJson}
                    rows={4}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[10px] text-slate-300 focus:outline-hidden"
                  />
                </div>
              </>
            )}
          </div>
        ) : (
          /* IMPORT TAB */
          <div className="space-y-3.5">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileUpload}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3 px-4 rounded-xl border-2 border-dashed border-cyan-500/40 bg-cyan-950/20 hover:bg-cyan-950/40 text-cyan-200 font-bold flex items-center justify-center gap-2 transition active:scale-95"
            >
              <FileJson className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>{txt.uploadFileBtn}</span>
            </button>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-slate-300">
                {txt.orPasteLabel}
              </label>
              <textarea
                value={importText}
                onChange={(e) => {
                  setImportText(e.target.value);
                  setImportError(null);
                  setImportSuccess(null);
                }}
                placeholder={txt.pastePlaceholder}
                rows={6}
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
              onClick={handleConfirmImport}
              disabled={!importText.trim()}
              className="w-full py-2.5 px-4 rounded-xl font-bold bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white shadow-md flex items-center justify-center gap-2 transition active:scale-95"
            >
              <Upload className="w-4 h-4 shrink-0" />
              <span>{txt.importBtn}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
