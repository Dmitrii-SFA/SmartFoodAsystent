import React, { useState, useRef, useEffect, useMemo } from 'react';
import { LibraryFoodItem, MetricConfig, MealCategoryConfig, LocalizationLabels, DayLog } from '../types/config';
import { ThemeStyles, getBorderRadiusClass } from '../utils/themeHelper';
import { getUITranslations } from '../utils/translations';
import {
  Apple,
  Search,
  Plus,
  Camera,
  Sparkles,
  Edit3,
  Loader2,
  Check,
  X,
  FileText,
  Utensils,
  AlertCircle,
  Trash2,
  ShieldCheck,
  Eye,
  EyeOff,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  ShoppingCart,
  ArrowUpDown,
  ArrowDown,
  ArrowUp,
} from 'lucide-react';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { getNutrientColor } from '../utils/nutrientColors';
import {
  estimateFoodWithWorker,
  analyzeFoodPhotoWithWorker,
} from '../utils/accessControl';

interface FoodLibraryTabProps {
  library: LibraryFoodItem[];
  metrics: MetricConfig[];
  categories: MealCategoryConfig[];
  themeStyles: ThemeStyles;
  accentColor: string;
  borderRadius: string;
  apiKey?: string;
  langCode?: string;
  labels?: Partial<LocalizationLabels>;
  dayLogs?: Record<string, DayLog>;
  currentDateStr?: string;
  onUpdateMetrics?: (metrics: MetricConfig[]) => void;
  onSaveToLibrary: (item: LibraryFoodItem) => void;
  onDeleteFromLibrary: (id: string) => void;
  onAddFoodToDayLog: (item: {
    mealCategoryId: string;
    name: string;
    amountGrams: number;
    nutrients: Record<string, number>;
  }) => void;
  onAddToShoppingList?: (item: { name: string; quantity?: string; foodId?: string }) => void;
  preselectedMealCategoryId?: string | null;
  onClearPreselectedMealCategory?: () => void;
  onOpenPaywallModal?: () => void;
  onQuotaUsed?: (count: number) => void;
}

type SortField =
  | 'last_used'
  | 'alphabet'
  | 'created_at'
  | 'calories'
  | 'proteins'
  | 'fats'
  | 'carbs';

type SortDirection = 'desc' | 'asc';

export const FoodLibraryTab: React.FC<FoodLibraryTabProps> = ({
  library,
  metrics,
  categories,
  themeStyles,
  accentColor,
  borderRadius,
  langCode = 'ru',
  labels,
  dayLogs,
  currentDateStr,
  onUpdateMetrics,
  onSaveToLibrary,
  onDeleteFromLibrary,
  onAddFoodToDayLog,
  onAddToShoppingList,
  preselectedMealCategoryId,
  onClearPreselectedMealCategory,
  onOpenPaywallModal,
  onQuotaUsed,
}) => {
  const radiusClass = getBorderRadiusClass(borderRadius);
  const t = getUITranslations(langCode, labels);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  // Sorting state: default to 'last_used' and 'desc' (most recently added to daily menu / closest to active date first)
  const [sortField, setSortField] = useState<SortField>('last_used');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const sortMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target as Node)) {
        setIsSortMenuOpen(false);
      }
    };
    if (isSortMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSortMenuOpen]);

  // Delete modal state
  const [deleteProductModal, setDeleteProductModal] = useState<{
    isOpen: boolean;
    id: string;
    name: string;
  }>({
    isOpen: false,
    id: '',
    name: '',
  });

  // Add / Edit Product Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [creationMode, setCreationMode] = useState<'manual' | 'ai_name' | 'photo_label' | 'photo_dish'>('ai_name');

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formServingGrams, setFormServingGrams] = useState(100);
  const [formServingGramsStr, setFormServingGramsStr] = useState('100');
  const [formNutrients, setFormNutrients] = useState<Record<string, number>>({});
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisNote, setAnalysisNote] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Quick Log to Diary dialog
  const [quickLogFood, setQuickLogFood] = useState<LibraryFoodItem | null>(null);
  const [quickLogCategory, setQuickLogCategory] = useState<string>(
    preselectedMealCategoryId || categories[0]?.id || 'breakfast'
  );
  const [quickLogGrams, setQuickLogGrams] = useState<number>(100);
  const [quickLogGramsStr, setQuickLogGramsStr] = useState<string>('100');

  useEffect(() => {
    if (preselectedMealCategoryId) {
      setQuickLogCategory(preselectedMealCategoryId);
    }
  }, [preselectedMealCategoryId]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Precompute usage metrics per product name from dayLogs and item.lastUsedAt
  const usageStatsByName = useMemo(() => {
    const map = new Map<
      string,
      {
        latestTimestamp: number;
        minDateDiffMs: number;
      }
    >();

    const refDateMs = currentDateStr ? Date.parse(`${currentDateStr}T12:00:00Z`) : Date.now();
    const safeRefDateMs = Number.isNaN(refDateMs) ? Date.now() : refDateMs;

    if (dayLogs && typeof dayLogs === 'object') {
      Object.entries(dayLogs).forEach(([dateKey, dayLog]) => {
        if (!dayLog || !Array.isArray(dayLog.items)) return;
        const dayMs = Date.parse(`${dateKey}T12:00:00Z`);
        const dateDiffMs = Number.isNaN(dayMs)
          ? Number.MAX_SAFE_INTEGER
          : Math.abs(safeRefDateMs - dayMs);

        dayLog.items.forEach((loggedItem) => {
          const lower = (loggedItem.name || '').trim().toLowerCase();
          if (!lower) return;
          const itemTs = Number(loggedItem.timestamp) || (Number.isNaN(dayMs) ? 0 : dayMs);
          const existing = map.get(lower);
          if (!existing) {
            map.set(lower, {
              latestTimestamp: itemTs,
              minDateDiffMs: dateDiffMs,
            });
          } else {
            map.set(lower, {
              latestTimestamp: Math.max(existing.latestTimestamp, itemTs),
              minDateDiffMs: Math.min(existing.minDateDiffMs, dateDiffMs),
            });
          }
        });
      });
    }

    return map;
  }, [dayLogs, currentDateStr]);

  const getNutrientPer100g = (item: LibraryFoodItem, nutrientKey: string): number => {
    const rawVal = Number(item.nutrients?.[nutrientKey]) || 0;
    const baseGrams = Math.max(1, Number(item.servingSizeGrams) || 100);
    return (rawVal / baseGrams) * 100;
  };

  const filteredLibrary = useMemo(() => {
    const filtered = library.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCat = activeCategory === 'all' || item.category === activeCategory;
      return matchesSearch && matchesCat;
    });

    const sorted = [...filtered].sort((a, b) => {
      let cmp = 0;

      if (sortField === 'last_used') {
        const lowerA = (a.name || '').trim().toLowerCase();
        const lowerB = (b.name || '').trim().toLowerCase();
        const statsA = usageStatsByName.get(lowerA);
        const statsB = usageStatsByName.get(lowerB);

        const lastTsA = Math.max(Number(a.lastUsedAt) || 0, statsA?.latestTimestamp || 0);
        const lastTsB = Math.max(Number(b.lastUsedAt) || 0, statsB?.latestTimestamp || 0);
        const usedA = lastTsA > 0;
        const usedB = lastTsB > 0;

        if (usedA !== usedB) {
          cmp = usedA ? 1 : -1;
        } else if (usedA && usedB) {
          const diffA = a.lastUsedAt ? 0 : (statsA?.minDateDiffMs ?? Number.MAX_SAFE_INTEGER);
          const diffB = b.lastUsedAt ? 0 : (statsB?.minDateDiffMs ?? Number.MAX_SAFE_INTEGER);
          if (diffA !== diffB) {
            // Smaller distance to currentDateStr means more relevant (higher)
            cmp = diffB - diffA;
          } else if (lastTsA !== lastTsB) {
            cmp = lastTsA - lastTsB;
          } else {
            cmp = (a.createdAt || 0) - (b.createdAt || 0);
          }
        } else {
          cmp = (a.createdAt || 0) - (b.createdAt || 0);
        }
      } else if (sortField === 'alphabet') {
        // For alphabetical: asc is A -> Z, desc is Z -> A
        const alphaCmp = (a.name || '').localeCompare(b.name || '', langCode || 'ru', {
          sensitivity: 'base',
        });
        return sortDirection === 'asc' ? alphaCmp : -alphaCmp;
      } else if (sortField === 'created_at') {
        cmp = (a.createdAt || 0) - (b.createdAt || 0);
      } else if (
        sortField === 'calories' ||
        sortField === 'proteins' ||
        sortField === 'fats' ||
        sortField === 'carbs'
      ) {
        const valA = getNutrientPer100g(a, sortField);
        const valB = getNutrientPer100g(b, sortField);
        cmp = valA - valB;
      }

      if (cmp === 0) {
        return (a.name || '').localeCompare(b.name || '', langCode || 'ru', {
          sensitivity: 'base',
        });
      }

      return sortDirection === 'desc' ? -cmp : cmp;
    });

    return sorted;
  }, [library, searchTerm, activeCategory, sortField, sortDirection, usageStatsByName, langCode]);

  const sortOptions: Array<{ id: SortField; label: string }> = [
    { id: 'last_used', label: t.sortByLastUsed },
    { id: 'alphabet', label: t.sortByAlphabet },
    { id: 'created_at', label: t.sortByCreatedAt },
    { id: 'calories', label: t.sortByCalories },
    { id: 'proteins', label: t.sortByProteins },
    { id: 'fats', label: t.sortByFats },
    { id: 'carbs', label: t.sortByCarbs },
  ];

  const activeSortLabel =
    sortOptions.find((o) => o.id === sortField)?.label || t.sortByLastUsed;

  // Quick Nutrient Visibility Settings modal
  const [isNutrientVisibilityModalOpen, setIsNutrientVisibilityModalOpen] = useState(false);

  // Additional nutrients management inside Add Product modal
  const [isSecondaryNutrientsExpanded, setIsSecondaryNutrientsExpanded] = useState(false);
  const [isAddNutrientMenuOpen, setIsAddNutrientMenuOpen] = useState(false);
  const [isCreatingNutrientMode, setIsCreatingNutrientMode] = useState(false);
  const [customAddedMetricIds, setCustomAddedMetricIds] = useState<string[]>([]);
  const [newNutrientName, setNewNutrientName] = useState('');
  const [newNutrientUnit, setNewNutrientUnit] = useState('г');
  const [newNutrientCategory, setNewNutrientCategory] = useState<'macro' | 'vitamin' | 'mineral' | 'fiber' | 'custom'>('custom');
  const [newNutrientTarget, setNewNutrientTarget] = useState('50');
  const [newNutrientColor, setNewNutrientColor] = useState('#10b981');
  const [newNutrientError, setNewNutrientError] = useState<string | null>(null);

  const CORE_METRIC_IDS = ['calories', 'proteins', 'fats', 'carbs'];
  const coreMetrics = CORE_METRIC_IDS.map((id) => metrics.find((m) => m.id === id)).filter(Boolean) as MetricConfig[];

  const handleToggleProductVisibility = (metricId: string, show: boolean) => {
    if (CORE_METRIC_IDS.includes(metricId) && !show) return;
    if (!onUpdateMetrics) return;
    const updated = metrics.map((m) =>
      m.id === metricId ? { ...m, showInProducts: show } : m
    );
    onUpdateMetrics(updated);
  };

  const handleAddExistingMetricToForm = (metricId: string) => {
    if (!customAddedMetricIds.includes(metricId)) {
      setCustomAddedMetricIds((prev) => [...prev, metricId]);
    }
    setFormNutrients((prev) => ({
      ...prev,
      [metricId]: prev[metricId] !== undefined ? prev[metricId] : 0,
    }));
    setIsAddNutrientMenuOpen(false);
  };

  const handleRemoveMetricFromForm = (metricId: string) => {
    setCustomAddedMetricIds((prev) => prev.filter((id) => id !== metricId));
    setFormNutrients((prev) => {
      const copy = { ...prev };
      delete copy[metricId];
      return copy;
    });
  };

  const handleCreateNewNutrient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNutrientName.trim()) {
      setNewNutrientError(t.errEnterNutrientName);
      return;
    }
    setNewNutrientError(null);

    const newId = `custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const targetVal = parseFloat(newNutrientTarget) || 50;

    const newMetric: MetricConfig = {
      id: newId,
      label: newNutrientName.trim(),
      unit: newNutrientUnit,
      target: targetVal,
      color: newNutrientColor,
      category: newNutrientCategory,
      isPrimary: false,
      showInSummary: false,
      showInDetailList: true,
      showInFoodForm: true,
      showInProducts: true,
      isProtected: false,
    };

    if (onUpdateMetrics) {
      onUpdateMetrics([...metrics, newMetric]);
    }

    setCustomAddedMetricIds((prev) => [...prev, newId]);
    setFormNutrients((prev) => ({
      ...prev,
      [newId]: 0,
    }));

    setNewNutrientName('');
    setIsCreatingNutrientMode(false);
    setIsAddNutrientMenuOpen(false);
  };

  const handleOpenAddModal = (mode: 'manual' | 'ai_name' | 'photo_label' | 'photo_dish') => {
    setEditingProductId(null);
    setCreationMode(mode);
    setFormName('');
    setFormServingGrams(100);
    setFormServingGramsStr('100');
    setFormNutrients({});
    setCustomAddedMetricIds([]);
    setIsSecondaryNutrientsExpanded(false);
    setIsAddNutrientMenuOpen(false);
    setIsCreatingNutrientMode(false);
    setNewNutrientError(null);
    setImagePreview(null);
    setAnalysisNote(null);
    setValidationError(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEditProductModal = (item: LibraryFoodItem) => {
    setEditingProductId(item.id);
    setCreationMode('manual');
    setFormName(item.name || '');
    const grams = item.servingSizeGrams || 100;
    setFormServingGrams(grams);
    setFormServingGramsStr(String(grams));
    setFormNutrients({ ...(item.nutrients || {}) });
    const existingExtraIds = Object.keys(item.nutrients || {}).filter(
      (id) => !CORE_METRIC_IDS.includes(id) && id !== 'water'
    );
    setCustomAddedMetricIds(existingExtraIds);
    setIsSecondaryNutrientsExpanded(false);
    setIsAddNutrientMenuOpen(false);
    setIsCreatingNutrientMode(false);
    setNewNutrientError(null);
    setImagePreview(null);
    setAnalysisNote(null);
    setValidationError(null);
    setIsAddModalOpen(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // AI Name estimation via Cloudflare Worker
  const handleEstimateByName = async () => {
    if (!formName.trim()) {
      setValidationError(t.errEnterFoodNameForAi);
      return;
    }
    setValidationError(null);
    setIsAnalyzing(true);
    setAnalysisNote(null);

    try {
      const data = await estimateFoodWithWorker({
        query: `${formName.trim()} (${formServingGrams} г)`,
        metrics,
        onOpenPaywall: onOpenPaywallModal,
        onQuotaUsed,
      });

      // Keep user's exact food name; do NOT overwrite what the user entered
      if (!formName.trim() && data.name) {
        setFormName(data.name);
      }
      if (data.nutrients) {
        setFormNutrients(data.nutrients);
        setIsSecondaryNutrientsExpanded(false);
      }
      if (data.note) setAnalysisNote(data.note);
    } catch (err: any) {
      setValidationError(err?.message || t.errFailedToCalculateNutrients);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Photo Analysis (label or dish) via Cloudflare Worker
  const handleAnalyzePhoto = async () => {
    if (!formName.trim()) {
      setValidationError(t.errEnterFoodNameForPhoto);
      return;
    }
    if (!imagePreview) {
      setValidationError(t.errUploadPhotoFirst);
      return;
    }
    setValidationError(null);
    setIsAnalyzing(true);
    setAnalysisNote(null);

    try {
      const data = await analyzeFoodPhotoWithWorker({
        imageBase64: imagePreview,
        mode: creationMode === 'photo_label' ? 'label' : 'dish',
        foodName: formName.trim(),
        onOpenPaywall: onOpenPaywallModal,
        onQuotaUsed,
      });

      if (data.servingSizeGrams) {
        setFormServingGrams(data.servingSizeGrams);
        setFormServingGramsStr(String(data.servingSizeGrams));
      }
      if (data.nutrients) {
        setFormNutrients(data.nutrients);
        setIsSecondaryNutrientsExpanded(false);
      }
      if (data.confidenceNote) setAnalysisNote(data.confidenceNote);
    } catch (err: any) {
      setValidationError(err?.message || t.errPhotoRecognitionFailed);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setValidationError(t.errFoodNameRequiredToSave);
      return;
    }

    const existingItem = editingProductId
      ? library.find((item) => item.id === editingProductId)
      : undefined;

    const savedItem: LibraryFoodItem = {
      ...(existingItem || {}),
      id: existingItem ? existingItem.id : `lib-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: formName.trim(),
      servingSizeGrams: Number(formServingGramsStr) || formServingGrams || 100,
      nutrients: formNutrients,
      createdAt: existingItem ? existingItem.createdAt : Date.now(),
      source: editingProductId ? 'manual' : creationMode,
    };

    onSaveToLibrary(savedItem);
    setEditingProductId(null);
    setIsAddModalOpen(false);
  };

  const handleConfirmQuickLog = () => {
    if (!quickLogFood) return;
    const finalGrams = Number(quickLogGramsStr) || quickLogGrams || 100;
    const factor = finalGrams / (quickLogFood.servingSizeGrams || 100);
    const calculatedNutrients: Record<string, number> = {};

    Object.entries(quickLogFood.nutrients || {}).forEach(([k, v]) => {
      calculatedNutrients[k] = Math.round((v || 0) * factor * 10) / 10;
    });

    onAddFoodToDayLog({
      mealCategoryId: quickLogCategory,
      name: quickLogFood.name,
      amountGrams: finalGrams,
      nutrients: calculatedNutrients,
    });

    setQuickLogFood(null);
  };

  return (
    <div className="space-y-4">
      {/* Search and Action Bar */}
      <div className={`relative z-30 border ${themeStyles.borderColor} ${themeStyles.cardBg} ${radiusClass} p-3.5 shadow-sm space-y-3`}>
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder={t.searchFoodPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-900/60 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-emerald-500"
            />
          </div>

          {/* 4 Add Product Buttons: 2x2 compact grid on mobile screens, row on desktop */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:flex items-center gap-2 lg:gap-1.5 w-full lg:w-auto">
            <button
              onClick={() => handleOpenAddModal('ai_name')}
              className="flex items-center justify-center gap-1.5 px-2.5 py-2 text-xs font-bold rounded-xl text-white shadow-xs transition active:scale-95 text-center min-w-0"
              style={{ backgroundColor: accentColor }}
              title={t.byAiName}
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{t.byAiName}</span>
            </button>

            <button
              onClick={() => handleOpenAddModal('photo_label')}
              className="flex items-center justify-center gap-1.5 px-2.5 py-2 text-xs font-semibold rounded-xl border border-purple-500/40 bg-purple-950/40 hover:bg-purple-900/50 text-purple-200 transition active:scale-95 text-center min-w-0"
              title={t.photoLabel}
            >
              <Camera className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span className="truncate">{t.photoLabel}</span>
            </button>

            <button
              onClick={() => handleOpenAddModal('photo_dish')}
              className="flex items-center justify-center gap-1.5 px-2.5 py-2 text-xs font-semibold rounded-xl border border-cyan-500/40 bg-cyan-950/40 hover:bg-cyan-900/50 text-cyan-200 transition active:scale-95 text-center min-w-0"
              title={t.photoDish}
            >
              <Utensils className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="truncate">{t.photoDish}</span>
            </button>

            <button
              onClick={() => handleOpenAddModal('manual')}
              className="flex items-center justify-center gap-1.5 px-2.5 py-2 text-xs font-semibold rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 transition active:scale-95 text-center min-w-0"
              title={t.manualAdd}
            >
              <Edit3 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{t.manualAdd}</span>
            </button>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 text-[11px] text-slate-400 pt-0.5 border-t border-slate-800/60">
          {/* Sort Button & Dropdown placed strictly to the left of Nutrient Display button */}
          <div className="relative flex items-center" ref={sortMenuRef}>
            <button
              type="button"
              onClick={() => setIsSortMenuOpen((prev) => !prev)}
              className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition active:scale-95 shrink-0"
              title={`${t.sortProductsBtn}: ${activeSortLabel}`}
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{t.sortProductsBtn}</span>
              <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
            </button>

            {isSortMenuOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-64 sm:w-72 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-2 z-50 space-y-1.5 animate-in fade-in zoom-in-95 duration-150">
                {/* Direction selector buttons */}
                <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-slate-950/80 border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setSortDirection('desc')}
                    className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-semibold transition ${
                      sortDirection === 'desc'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <ArrowDown className="w-3 h-3 shrink-0" />
                    <span className="truncate">{t.sortOrderDesc}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSortDirection('asc')}
                    className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-semibold transition ${
                      sortDirection === 'asc'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <ArrowUp className="w-3 h-3 shrink-0" />
                    <span className="truncate">{t.sortOrderAsc}</span>
                  </button>
                </div>

                {/* 7 Sort Field Options */}
                <div className="space-y-0.5">
                  {sortOptions.map((opt) => {
                    const isSelected = sortField === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          if (sortField === opt.id) {
                            setSortDirection((prev) => (prev === 'desc' ? 'asc' : 'desc'));
                          } else {
                            setSortField(opt.id);
                            setSortDirection(opt.id === 'alphabet' ? 'asc' : 'desc');
                          }
                          setIsSortMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl text-xs text-left transition ${
                          isSelected
                            ? 'bg-emerald-500/15 text-emerald-300 font-semibold border border-emerald-500/30'
                            : 'text-slate-200 hover:bg-slate-800/80'
                        }`}
                      >
                        <span className="truncate">{opt.label}</span>
                        {isSelected && (
                          <span className="flex items-center gap-1 text-[10px] text-emerald-400 shrink-0">
                            {sortDirection === 'desc' ? (
                              <ArrowDown className="w-3.5 h-3.5" />
                            ) : (
                              <ArrowUp className="w-3.5 h-3.5" />
                            )}
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsNutrientVisibilityModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition active:scale-95 shrink-0"
            title={t.nutrientDisplay}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>{t.nutrientDisplay}</span>
          </button>
        </div>
      </div>

      {/* Products Grid */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {filteredLibrary.map((item) => (
          <div
            key={item.id}
            className={`border ${themeStyles.borderColor} ${themeStyles.cardBg} ${radiusClass} p-3.5 shadow-xs flex flex-col justify-between hover:border-slate-600 transition-all`}
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${accentColor}25`, color: accentColor }}
                  >
                    <Apple className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className={`text-xs sm:text-sm font-bold leading-snug break-words ${themeStyles.textPrimary}`}>
                      {item.name}
                    </h4>
                    <span className="text-[10px] text-slate-400">
                      {t.perGrams} {item.servingSizeGrams}
                      {t.gramsShort}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenEditProductModal(item)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-cyan-400 hover:bg-cyan-950/30 transition active:scale-95 shrink-0"
                    title="Изменить"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  {onAddToShoppingList && (
                    <button
                      type="button"
                      onClick={() =>
                        onAddToShoppingList({
                          name: item.name,
                          quantity: `${item.servingSizeGrams || 100} ${t.gramsShort}`,
                          foodId: item.id,
                        })
                      }
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-emerald-400 hover:bg-emerald-950/30 transition active:scale-95 shrink-0"
                      title={t.addToShoppingList}
                    >
                      <ShoppingCart className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setQuickLogFood(item);
                      if (preselectedMealCategoryId) {
                        setQuickLogCategory(preselectedMealCategoryId);
                      }
                      setQuickLogGrams(item.servingSizeGrams || 100);
                      setQuickLogGramsStr(String(item.servingSizeGrams || 100));
                    }}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-xs transition active:scale-95 shrink-0"
                    style={{ backgroundColor: accentColor }}
                    title={t.logToDiary}
                  >
                    <Plus className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setDeleteProductModal({
                        isOpen: true,
                        id: item.id,
                        name: item.name,
                      })
                    }
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-red-950/30 transition shrink-0"
                    title={t.delete}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Macros Strip with synchronized dynamic nutrient colors */}
              {/* ROW 1: 4 Core Protected Nutrients */}
              <div className="grid grid-cols-4 gap-1 p-2 rounded-xl bg-slate-900/60 border border-slate-800 text-center font-mono my-1.5 text-[11px]">
                <div>
                  <div className="text-[9px] text-slate-400">{t.kcalShort}</div>
                  <div
                    className="font-bold transition-colors"
                    style={{ color: getNutrientColor('calories', metrics, '#f97316') }}
                  >
                    {Math.round(item.nutrients['calories'] || 0)}
                  </div>
                </div>
                <div>
                  <div className="text-[9px] text-slate-400">{t.protShort}</div>
                  <div
                    className="font-bold transition-colors"
                    style={{ color: getNutrientColor('proteins', metrics, '#3b82f6') }}
                  >
                    {Math.round((item.nutrients['proteins'] || 0) * 10) / 10}
                    {t.gramsShort}
                  </div>
                </div>
                <div>
                  <div className="text-[9px] text-slate-400">{t.fatShort}</div>
                  <div
                    className="font-bold transition-colors"
                    style={{ color: getNutrientColor('fats', metrics, '#eab308') }}
                  >
                    {Math.round((item.nutrients['fats'] || 0) * 10) / 10}
                    {t.gramsShort}
                  </div>
                </div>
                <div>
                  <div className="text-[9px] text-slate-400">{t.carbShort}</div>
                  <div
                    className="font-bold transition-colors"
                    style={{ color: getNutrientColor('carbs', metrics, '#ef4444') }}
                  >
                    {Math.round((item.nutrients['carbs'] || 0) * 10) / 10}
                    {t.gramsShort}
                  </div>
                </div>
              </div>

              {/* ROW 2, ROW 3+: Additional Visible Nutrients for this product */}
              {(() => {
                const visibleSecondary = metrics.filter(
                  (m) =>
                    !CORE_METRIC_IDS.includes(m.id) &&
                    m.id !== 'water' &&
                    m.showInProducts !== false &&
                    item.nutrients[m.id] !== undefined &&
                    item.nutrients[m.id] > 0
                );

                if (visibleSecondary.length === 0) return null;

                const rows: MetricConfig[][] = [];
                for (let i = 0; i < visibleSecondary.length; i += 4) {
                  rows.push(visibleSecondary.slice(i, i + 4));
                }

                return rows.map((rowChunk, rIdx) => (
                  <div
                    key={rIdx}
                    className="grid grid-cols-4 gap-1 p-1.5 rounded-xl bg-slate-900/40 border border-slate-800/80 text-center font-mono my-1 text-[10px]"
                  >
                    {rowChunk.map((m) => {
                      const val = item.nutrients[m.id] || 0;
                      const formatted = Math.round(val * 10) / 10;
                      return (
                        <div key={m.id} className="min-w-0 px-0.5">
                          <div className="text-[9px] text-slate-400 truncate" title={m.label}>
                            {m.shortLabel || m.label}
                          </div>
                          <div
                            className="font-bold truncate transition-colors text-[10px] sm:text-[11px]"
                            style={{ color: m.color || getNutrientColor(m.id, metrics) }}
                            title={`${m.label}: ${formatted} ${m.unit}`}
                          >
                            {formatted}{m.unit}
                          </div>
                        </div>
                      );
                    })}
                    {Array.from({ length: 4 - rowChunk.length }).map((_, emptyIdx) => (
                      <div key={`empty-${emptyIdx}`} className="min-w-0" />
                    ))}
                  </div>
                ));
              })()}
            </div>
          </div>
        ))}

        {/* Add Product Slot in Products Grid */}
        <div
          onClick={() => handleOpenAddModal('ai_name')}
          className={`border-2 border-dashed border-slate-800 hover:border-emerald-500/50 bg-slate-900/20 hover:bg-slate-900/40 ${radiusClass} p-5 text-center cursor-pointer transition-all group flex flex-col items-center justify-center gap-2 min-h-[160px]`}
        >
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform"
            style={{ backgroundColor: `${accentColor}25`, color: accentColor }}
          >
            <Plus className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs sm:text-sm font-bold text-slate-300 group-hover:text-white transition">
              {t.addProductCardTitle}
            </span>
            <p className="text-[11px] text-slate-500">
              {t.addProductCardSub}
            </p>
          </div>
        </div>
      </div>

      {/* Floating/Bottom Full-width Add Product Button */}
      <div className="flex justify-center pt-2">
        <button
          onClick={() => handleOpenAddModal('ai_name')}
          className="min-h-[42px] flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold rounded-xl text-white shadow-lg transition active:scale-95"
          style={{ backgroundColor: accentColor }}
        >
          <Plus className="w-4 h-4" />
          <span>{t.addNewProductToLibraryBtn}</span>
        </button>
      </div>

      {/* Add Product Modal (Manual, AI Name, Photo Label, Photo Dish) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg border border-slate-700 bg-slate-900 rounded-2xl shadow-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                  {editingProductId ? <Edit3 className="w-5 h-5" /> : <Apple className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {editingProductId ? t.editProductModalTitle : t.addProductModalTitle}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {editingProductId
                      ? t.editProductModalSub
                      : creationMode === 'ai_name'
                      ? t.addProductAiNameSub
                      : creationMode === 'photo_label'
                      ? t.addProductPhotoLabelSub
                      : creationMode === 'photo_dish'
                      ? t.addProductPhotoDishSub
                      : t.addProductManualSub}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setEditingProductId(null);
                  setIsAddModalOpen(false);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Validation Error Alert */}
            {validationError && (
              <div className="p-3 rounded-xl border border-red-500/40 bg-red-950/30 text-red-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              {/* Product Name (MANDATORY) */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  {t.foodNameMandatoryLabel} <span className="text-red-400">{t.mandatoryBadge}</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={t.foodNameInputPlaceholder}
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-medium focus:outline-hidden focus:border-emerald-500 text-sm"
                />
              </div>

              {/* Photo Input (if photo mode) */}
              {(creationMode === 'photo_label' || creationMode === 'photo_dish') && (
                <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/40 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-300">
                      {creationMode === 'photo_label' ? t.photoLabelHeading : t.photoDishHeading}
                    </span>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2.5 py-1 text-xs rounded-lg border border-purple-500/40 bg-purple-950/40 text-purple-200 hover:bg-purple-900/50"
                    >
                      {imagePreview ? t.replacePhotoBtn : t.chooseFileCameraBtn}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>

                  {imagePreview && (
                    <div className="space-y-2">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="max-h-48 w-full object-contain rounded-xl border border-slate-800 bg-black/40"
                      />
                      <button
                        type="button"
                        disabled={isAnalyzing}
                        onClick={handleAnalyzePhoto}
                        className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-500 text-white transition disabled:opacity-50"
                      >
                        {isAnalyzing ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>{t.geminiAnalyzingPhoto}</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            <span>{t.recognizeWithGeminiBtn}</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* AI Name Estimation Trigger */}
              {creationMode === 'ai_name' && (
                <button
                  type="button"
                  disabled={isAnalyzing}
                  onClick={handleEstimateByName}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition disabled:opacity-50"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{t.aiCalculatingNutrients}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>{t.calculateMacrosByNameBtn}</span>
                    </>
                  )}
                </button>
              )}

              {/* Analysis Note from AI */}
              {analysisNote && (
                <div className="p-2.5 rounded-xl border border-cyan-500/30 bg-cyan-950/20 text-cyan-200 text-[11px]">
                  💡 {analysisNote}
                </div>
              )}

              {/* Portion Weight */}
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  {t.defaultPortionWeightLabel}
                </label>
                <input
                  type="number"
                  min="1"
                  value={formServingGramsStr}
                  onChange={(e) => {
                    const v = e.target.value;
                    setFormServingGramsStr(v);
                    if (v !== '' && !isNaN(Number(v))) {
                      setFormServingGrams(Number(v));
                    }
                  }}
                  onBlur={() => {
                    if (formServingGramsStr === '' || isNaN(Number(formServingGramsStr)) || Number(formServingGramsStr) <= 0) {
                      setFormServingGramsStr(String(formServingGrams || 100));
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono"
                />
              </div>

              {/* Nutrients Fields */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                {/* ROW 1: 4 Core Protected Nutrients (always visible at the top) */}
                <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-200 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>{t.coreNutrientsTitle}</span>
                    </span>
                    <span className="text-[10px] text-emerald-400/90 font-mono font-medium">{t.mandatoryPluralBadge}</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono">
                    {coreMetrics.map((metric) => {
                      const mColor = metric.color || getNutrientColor(metric.id, metrics);
                      return (
                        <div key={metric.id} className="min-w-0">
                          <label className="flex items-center gap-1.5 text-[11px] text-slate-300 mb-1 truncate">
                            <span
                              className="w-2 h-2 rounded-full shrink-0 shadow-xs"
                              style={{ backgroundColor: mColor }}
                            />
                            <span className="truncate">{metric.label} ({metric.unit})</span>
                          </label>
                          <input
                            type="number"
                            step="any"
                            value={formNutrients[metric.id] !== undefined ? formNutrients[metric.id] : ''}
                            onChange={(e) => {
                              const v = e.target.value;
                              if (v === '') {
                                setFormNutrients((prev) => {
                                  const copy = { ...prev };
                                  delete copy[metric.id];
                                  return copy;
                                });
                              } else {
                                const n = parseFloat(v);
                                setFormNutrients((prev) => ({
                                  ...prev,
                                  [metric.id]: isNaN(n) ? 0 : n,
                                }));
                              }
                            }}
                            placeholder="0"
                            className="w-full px-2.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono text-xs focus:outline-hidden"
                            style={{ borderColor: `${mColor}50` }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ROWS 2+: Secondary & Custom Nutrients (collapsed by default under toggle button) */}
                {(() => {
                  const secondaryMetricsInForm = metrics.filter(
                    (m) =>
                      !CORE_METRIC_IDS.includes(m.id) &&
                      m.id !== 'water' &&
                      (
                        customAddedMetricIds.includes(m.id) ||
                        (formNutrients[m.id] !== undefined && formNutrients[m.id] !== null) ||
                        m.showInProducts !== false
                      )
                  );

                  const filledSecondaryCount = secondaryMetricsInForm.filter(
                    (m) => Number(formNutrients[m.id]) > 0
                  ).length;

                  const availableToAddMetrics = metrics.filter(
                    (m) =>
                      !CORE_METRIC_IDS.includes(m.id) &&
                      m.id !== 'water' &&
                      !secondaryMetricsInForm.some((sm) => sm.id === m.id)
                  );

                  return (
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => setIsSecondaryNutrientsExpanded((prev) => !prev)}
                        className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 text-xs text-slate-300 hover:text-white transition"
                      >
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold">{t.additionalNutrientsTitle}</span>
                          {filledSecondaryCount > 0 ? (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono font-bold">
                              {t.filledCountBadge} {filledSecondaryCount}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-400 text-[10px] font-mono">
                              {secondaryMetricsInForm.length} {t.availableCountBadge}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-400 shrink-0">
                          <span>{isSecondaryNutrientsExpanded ? t.collapseBtn : t.expandBtn}</span>
                          {isSecondaryNutrientsExpanded ? (
                            <ChevronUp className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                      </button>

                      {isSecondaryNutrientsExpanded && (
                        <div className="p-3 rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-2.5 animate-in fade-in duration-150">
                          <div className="flex items-center justify-between text-xs flex-wrap gap-2">
                            <span className="font-bold text-slate-200 flex items-center gap-1.5">
                              <span>{t.vitaminsAndMineralsTitle}</span>
                              <span className="text-[10px] text-slate-400 font-normal">
                                ({secondaryMetricsInForm.length} {t.inFormCountSuffix})
                              </span>
                            </span>

                            <button
                              type="button"
                              onClick={() => {
                                setIsAddNutrientMenuOpen(!isAddNutrientMenuOpen);
                                setIsCreatingNutrientMode(false);
                                setNewNutrientError(null);
                              }}
                              className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg border border-emerald-500/40 bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 transition active:scale-95"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>{t.addNutrient}</span>
                            </button>
                          </div>

                          {/* Add Nutrient Popover / Menu */}
                          {isAddNutrientMenuOpen && (
                            <div className="p-3 rounded-xl bg-slate-800/95 border border-slate-700 space-y-3 animate-in fade-in duration-150">
                              <div className="flex items-center justify-between border-b border-slate-700/80 pb-2">
                                <span className="text-xs font-bold text-white">{t.addNutrientToProductTitle}</span>
                                <button
                                  type="button"
                                  onClick={() => setIsAddNutrientMenuOpen(false)}
                                  className="text-slate-400 hover:text-white p-0.5"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {!isCreatingNutrientMode ? (
                                <div className="space-y-2.5">
                                  {availableToAddMetrics.length > 0 && (
                                    <div>
                                      <span className="text-[11px] text-slate-400 block mb-1.5">
                                        {t.selectFromExistingNutrients}
                                      </span>
                                      <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                                        {availableToAddMetrics.map((m) => (
                                          <button
                                            key={m.id}
                                            type="button"
                                            onClick={() => handleAddExistingMetricToForm(m.id)}
                                            className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] rounded-lg border border-slate-700 bg-slate-900/80 hover:bg-slate-700 text-slate-200 hover:text-white transition active:scale-95"
                                          >
                                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: m.color }} />
                                            <span>{m.label} ({m.unit})</span>
                                            <Plus className="w-3 h-3 text-emerald-400" />
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between">
                                    <span className="text-[11px] text-slate-400">{t.nutrientNotFoundQuestion}</span>
                                    <button
                                      type="button"
                                      onClick={() => setIsCreatingNutrientMode(true)}
                                      className="flex items-center gap-1 text-[11px] font-bold text-purple-300 hover:text-purple-200"
                                    >
                                      <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                                      <span>{t.createNewNutrientBtn}</span>
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                /* Inline New Nutrient Creator */
                                <form onSubmit={handleCreateNewNutrient} className="space-y-2.5">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-purple-300 flex items-center gap-1">
                                      <Sparkles className="w-3.5 h-3.5" />
                                      <span>{t.creatingNewNutrientTitle}</span>
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => setIsCreatingNutrientMode(false)}
                                      className="text-[10px] text-slate-400 hover:text-slate-200"
                                    >
                                      {t.backToSelectionBtn}
                                    </button>
                                  </div>

                                  {newNutrientError && (
                                    <div className="p-1.5 rounded-lg bg-red-950/60 border border-red-800 text-[10px] text-red-300">
                                      {newNutrientError}
                                    </div>
                                  )}

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <div>
                                      <label className="block text-[10px] text-slate-400 mb-0.5">{t.nutrientNameRequiredLabel}</label>
                                      <input
                                        type="text"
                                        required
                                        placeholder={t.nutrientNamePlaceholder}
                                        value={newNutrientName}
                                        onChange={(e) => setNewNutrientName(e.target.value)}
                                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                                      />
                                    </div>
                                    <div className="grid grid-cols-2 gap-1.5">
                                      <div>
                                        <label className="block text-[10px] text-slate-400 mb-0.5">{t.unitLabel}</label>
                                        <select
                                          value={newNutrientUnit}
                                          onChange={(e) => setNewNutrientUnit(e.target.value)}
                                          className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                                        >
                                          <option value="г">{t.unitGram}</option>
                                          <option value="мг">{t.unitMg}</option>
                                          <option value="мкг">{t.unitMcg}</option>
                                          <option value="мл">{t.unitMl}</option>
                                        </select>
                                      </div>
                                      <div>
                                        <label className="block text-[10px] text-slate-400 mb-0.5">{t.dailyNormPlaceholder}</label>
                                        <input
                                          type="number"
                                          value={newNutrientTarget}
                                          onChange={(e) => setNewNutrientTarget(e.target.value)}
                                          className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white font-mono"
                                          placeholder="50"
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-between pt-1">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[10px] text-slate-400">{t.colorLabel}</span>
                                      {['#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#eab308', '#06b6d4'].map((col) => (
                                        <button
                                          key={col}
                                          type="button"
                                          onClick={() => setNewNutrientColor(col)}
                                          className={`w-4 h-4 rounded-full transition ${newNutrientColor === col ? 'ring-2 ring-white scale-110' : 'opacity-70'}`}
                                          style={{ backgroundColor: col }}
                                        />
                                      ))}
                                    </div>

                                    <button
                                      type="submit"
                                      className="px-3 py-1.5 text-xs font-bold rounded-lg bg-purple-600 hover:bg-purple-500 text-white transition shadow-xs"
                                    >
                                      {t.createAndAttachBtn}
                                    </button>
                                  </div>
                                </form>
                              )}
                            </div>
                          )}

                          {/* Secondary Fields Grid */}
                          {secondaryMetricsInForm.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono">
                              {secondaryMetricsInForm.map((metric) => {
                                const mColor = metric.color || getNutrientColor(metric.id, metrics);
                                return (
                                  <div key={metric.id} className="min-w-0 relative group">
                                    <div className="flex items-center justify-between mb-1">
                                      <label className="flex items-center gap-1.5 text-[11px] text-slate-300 truncate">
                                        <span
                                          className="w-2 h-2 rounded-full shrink-0 shadow-xs"
                                          style={{ backgroundColor: mColor }}
                                        />
                                        <span className="truncate">{metric.label} ({metric.unit})</span>
                                      </label>
                                      {customAddedMetricIds.includes(metric.id) && (
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveMetricFromForm(metric.id)}
                                          className="p-0.5 text-slate-500 hover:text-red-400"
                                          title={t.removeNutrientFromProductTitle}
                                        >
                                          <X className="w-3 h-3" />
                                        </button>
                                      )}
                                    </div>
                                    <input
                                      type="number"
                                      step="any"
                                      value={formNutrients[metric.id] !== undefined ? formNutrients[metric.id] : ''}
                                      onChange={(e) => {
                                        const v = e.target.value;
                                        if (v === '') {
                                          setFormNutrients((prev) => {
                                            const copy = { ...prev };
                                            delete copy[metric.id];
                                            return copy;
                                          });
                                        } else {
                                          const n = parseFloat(v);
                                          setFormNutrients((prev) => ({
                                            ...prev,
                                            [metric.id]: isNaN(n) ? 0 : n,
                                          }));
                                        }
                                      }}
                                      placeholder="0"
                                      className="w-full px-2.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono text-xs focus:outline-hidden"
                                      style={{ borderColor: `${mColor}40` }}
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="text-center py-2 text-[11px] text-slate-500 italic">
                              {t.noAdditionalNutrientsSelected}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingProductId(null);
                    setIsAddModalOpen(false);
                  }}
                  className="min-h-[40px] px-3.5 py-2 text-xs rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="min-h-[40px] px-4 py-2 text-xs font-bold rounded-xl text-white shadow-md transition active:scale-95"
                  style={{ backgroundColor: accentColor }}
                >
                  {editingProductId ? t.saveChangesButton : t.saveToLibraryBtn}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Add to Diary Dialog */}
      {quickLogFood && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm border border-slate-700 bg-slate-900 rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white">{t.addToDiaryTitle}</h3>
                <p className="text-xs text-slate-400 font-semibold">{quickLogFood.name}</p>
              </div>
              <button
                onClick={() => setQuickLogFood(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  {t.mealCategorySelectLabel}
                </label>
                <select
                  value={quickLogCategory}
                  onChange={(e) => setQuickLogCategory(e.target.value)}
                  className="w-full min-h-[40px] px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-medium"
                >
                  {categories.map((c) => {
                    const iconMap: Record<string, string> = {
                      Coffee: '☕',
                      Utensils: '🍽️',
                      Moon: '🌙',
                      Cookie: '🍪',
                      Apple: '🍏',
                      Soup: '🍲',
                      Salad: '🥗',
                      med_tablet: '⚪',
                      med_capsule: '💊',
                      med_powder: '🥄',
                      med_drops: '💧',
                      med_vial: '🧪',
                      med_omega: '🌿',
                    };
                    const ic = iconMap[c.icon] || c.icon || '🍽️';
                    const catName = c.name || (c as any).label || c.id;
                    return (
                      <option key={c.id} value={c.id}>
                        {ic} {catName}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  {t.portionWeightGramsLabel}
                </label>
                <input
                  type="number"
                  min="1"
                  value={quickLogGramsStr}
                  onChange={(e) => {
                    const v = e.target.value;
                    setQuickLogGramsStr(v);
                    if (v !== '' && !isNaN(Number(v))) {
                      setQuickLogGrams(Number(v));
                    }
                  }}
                  onBlur={() => {
                    if (
                      quickLogGramsStr === '' ||
                      isNaN(Number(quickLogGramsStr)) ||
                      Number(quickLogGramsStr) <= 0
                    ) {
                      setQuickLogGramsStr(String(quickLogGrams || 100));
                    }
                  }}
                  className="w-full min-h-[40px] px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono"
                />
              </div>

              {/* Calculated Calorie Preview */}
              <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/80 font-mono text-center">
                <span className="text-slate-400">{t.totalCaloriesPreview} </span>
                <span
                  className="font-bold transition-colors"
                  style={{ color: getNutrientColor('calories', metrics, '#f97316') }}
                >
                  {Math.round(
                    ((quickLogFood.nutrients['calories'] || 0) *
                      (Number(quickLogGramsStr) || quickLogGrams || 100)) /
                      (quickLogFood.servingSizeGrams || 100)
                  )}{' '}
                  {t.kcalShort}
                </span>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  onClick={() => setQuickLogFood(null)}
                  className="min-h-[40px] px-3 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  {t.cancel}
                </button>
                <button
                  onClick={handleConfirmQuickLog}
                  className="min-h-[40px] px-4 py-2 font-bold rounded-xl text-white shadow-md"
                  style={{ backgroundColor: accentColor }}
                >
                  {t.logToDiaryBtn}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Product Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteProductModal.isOpen}
        title={t.deleteProductConfirmTitle}
        message={t.deleteProductConfirmMsg}
        itemName={deleteProductModal.name}
        confirmLabel={t.delete}
        cancelLabel={t.cancel}
        themeStyles={themeStyles}
        onCancel={() =>
          setDeleteProductModal((prev) => ({ ...prev, isOpen: false }))
        }
        onConfirm={() => {
          onDeleteFromLibrary(deleteProductModal.id);
          setDeleteProductModal((prev) => ({ ...prev, isOpen: false }));
        }}
      />

      {/* Nutrient Visibility Configuration Modal */}
      {isNutrientVisibilityModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md border border-slate-700 bg-slate-900 rounded-2xl shadow-2xl p-5 space-y-4 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">{t.nutrientCardsModalTitle}</h3>
                  <p className="text-[11px] text-slate-400">{t.nutrientCardsModalSub}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNutrientVisibilityModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Explanation Note */}
            <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-[11px] text-slate-300 space-y-1">
              <div>
                🛡️ <b className="text-white">{t.nutrientCardsRow1Title}</b> {t.nutrientCardsRow1Desc}
              </div>
              <div>
                ✨ <b className="text-white">{t.nutrientCardsRow2Title}</b> {t.nutrientCardsRow2Desc}
              </div>
            </div>

            {/* Nutrients List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-72">
              {metrics.map((m) => {
                const isCore = CORE_METRIC_IDS.includes(m.id);
                const isShown = m.showInProducts !== false;
                return (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-slate-800 bg-slate-900/50"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                        style={{ backgroundColor: m.color || getNutrientColor(m.id, metrics) }}
                      />
                      <div className="min-w-0">
                        <span className="text-xs font-semibold text-white block truncate">{m.label}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{m.category} • {m.unit}</span>
                      </div>
                    </div>

                    {isCore ? (
                      <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-950/40 border border-emerald-500/30">
                        <ShieldCheck className="w-3 h-3" />
                        <span>{t.alwaysInRow1Badge}</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleToggleProductVisibility(m.id, !isShown)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg border transition active:scale-95 ${
                          isShown
                            ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-300'
                            : 'border-slate-800 bg-slate-800 text-slate-400 hover:text-slate-300'
                        }`}
                      >
                        {isShown ? (
                          <>
                            <Eye className="w-3.5 h-3.5 text-emerald-400" />
                            <span>{t.showBtn}</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                            <span>{t.hideBtn}</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setIsNutrientVisibilityModalOpen(false)}
                className="px-4 py-2 text-xs font-bold rounded-xl text-white shadow-xs"
                style={{ backgroundColor: accentColor }}
              >
                {t.doneBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
