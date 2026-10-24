import React, { useState, useRef, useEffect } from 'react';
import { LibraryFoodItem, MetricConfig, MealCategoryConfig, LocalizationLabels } from '../types/config';
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
  onUpdateMetrics?: (metrics: MetricConfig[]) => void;
  onSaveToLibrary: (item: LibraryFoodItem) => void;
  onDeleteFromLibrary: (id: string) => void;
  onAddFoodToDayLog: (item: {
    mealCategoryId: string;
    name: string;
    amountGrams: number;
    nutrients: Record<string, number>;
  }) => void;
  preselectedMealCategoryId?: string | null;
  onClearPreselectedMealCategory?: () => void;
  onOpenPaywallModal?: () => void;
  onQuotaUsed?: (count: number) => void;
}

export const FoodLibraryTab: React.FC<FoodLibraryTabProps> = ({
  library,
  metrics,
  categories,
  themeStyles,
  accentColor,
  borderRadius,
  langCode = 'ru',
  labels,
  onUpdateMetrics,
  onSaveToLibrary,
  onDeleteFromLibrary,
  onAddFoodToDayLog,
  preselectedMealCategoryId,
  onClearPreselectedMealCategory,
  onOpenPaywallModal,
  onQuotaUsed,
}) => {
  const radiusClass = getBorderRadiusClass(borderRadius);
  const t = getUITranslations(langCode, labels);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

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

  // Add Product Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
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

  const filteredLibrary = library.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = activeCategory === 'all' || item.category === activeCategory;
    return matchesSearch && matchesCat;
  });

  // Quick Nutrient Visibility Settings modal
  const [isNutrientVisibilityModalOpen, setIsNutrientVisibilityModalOpen] = useState(false);

  // Additional nutrients management inside Add Product modal
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
      setNewNutrientError('Введите название нутриента');
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
    setCreationMode(mode);
    setFormName('');
    setFormServingGrams(100);
    setFormServingGramsStr('100');
    setFormNutrients({});
    setCustomAddedMetricIds([]);
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
      setValidationError('Обязательно введите название продукта перед анализом ИИ!');
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
      if (data.nutrients) setFormNutrients(data.nutrients);
      if (data.note) setAnalysisNote(data.note);
    } catch (err: any) {
      setValidationError(err?.message || 'Не удалось рассчитать нутриенты');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Photo Analysis (label or dish) via Cloudflare Worker
  const handleAnalyzePhoto = async () => {
    if (!formName.trim()) {
      setValidationError('Обязательно введите название продукта перед анализом фотографии!');
      return;
    }
    if (!imagePreview) {
      setValidationError('Загрузите или сфотографируйте изображение!');
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
      if (data.nutrients) setFormNutrients(data.nutrients);
      if (data.confidenceNote) setAnalysisNote(data.confidenceNote);
    } catch (err: any) {
      setValidationError(err?.message || 'Ошибка распознавания фото');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setValidationError('Нельзя создать продукт без указания названия!');
      return;
    }

    const newItem: LibraryFoodItem = {
      id: `lib-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: formName.trim(),
      servingSizeGrams: Number(formServingGramsStr) || formServingGrams || 100,
      nutrients: formNutrients,
      createdAt: Date.now(),
      source: creationMode,
      photoUrl: imagePreview || undefined,
    };

    onSaveToLibrary(newItem);
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

  const preselectedCategoryObj = preselectedMealCategoryId
    ? categories.find((c) => c.id === preselectedMealCategoryId)
    : undefined;

  return (
    <div className="space-y-4">
      {/* Preselected Meal Category Banner when opened from Daily Menu "+ Добавить блюдо" */}
      {preselectedCategoryObj && (
        <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between gap-2 text-xs text-emerald-200">
          <div className="flex items-center gap-2">
            <Utensils className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Добавление продукта для приёма пищи: <b>«{preselectedCategoryObj.name}»</b> — выберите продукт из библиотеки ниже или создайте новый.
            </span>
          </div>
          {onClearPreselectedMealCategory && (
            <button
              type="button"
              onClick={onClearPreselectedMealCategory}
              className="p-1 text-slate-400 hover:text-white transition shrink-0"
              title="Скрыть подсказку"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Search and Action Bar */}
      <div className={`border ${themeStyles.borderColor} ${themeStyles.cardBg} ${radiusClass} p-3.5 shadow-sm space-y-3`}>
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

        <div className="flex items-center justify-between gap-2 text-[11px] text-slate-400 pt-0.5 border-t border-slate-800/60">
          <span>
            {t.totalInLibrary} <b>{library.length}</b> {t.productsUnit}
          </span>

          <button
            type="button"
            onClick={() => setIsNutrientVisibilityModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition active:scale-95 shrink-0"
            title={t.nutrientDisplay}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
            <span>{t.nutrientDisplay}</span>
          </button>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
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
                  <Apple className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Добавить продукт в библиотеку</h3>
                  <p className="text-[11px] text-slate-400">
                    {creationMode === 'ai_name' && 'Расчет всех нутриентов через ИИ по названию'}
                    {creationMode === 'photo_label' && 'Распознавание КБЖУ с фото этикетки + витамины по названию'}
                    {creationMode === 'photo_dish' && 'Примерная визуальная оценка готового блюда по фото'}
                    {creationMode === 'manual' && 'Ручной ввод всех значений'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
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
                  Название продукта / блюда * <span className="text-red-400">(обязательно)</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="например, Творог рассыпчатый 5%, Протеиновый батончик, Борщ..."
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
                      {creationMode === 'photo_label' ? 'Фото этикетки с КБЖУ' : 'Фото тарелки с едой'}
                    </span>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2.5 py-1 text-xs rounded-lg border border-purple-500/40 bg-purple-950/40 text-purple-200 hover:bg-purple-900/50"
                    >
                      {imagePreview ? 'Заменить фото' : 'Выбрать файл / камеру'}
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
                            <span>Gemini анализирует изображение...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            <span>Распознать через Gemini Vision</span>
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
                      <span>ИИ рассчитывает нутриенты...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Рассчитать КБЖУ и витамины по названию</span>
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
                  Вес порции (граммы, по умолчанию 100 г)
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
                {/* ROW 1: 4 Core Protected Nutrients */}
                <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-200 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Строка 1: Базовые КБЖУ (защищённые)</span>
                    </span>
                    <span className="text-[10px] text-emerald-400/90 font-mono font-medium">обязательные</span>
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

                {/* ROWS 2+: Secondary & Custom Nutrients */}
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

                  const availableToAddMetrics = metrics.filter(
                    (m) =>
                      !CORE_METRIC_IDS.includes(m.id) &&
                      m.id !== 'water' &&
                      !secondaryMetricsInForm.some((sm) => sm.id === m.id)
                  );

                  return (
                    <div className="p-3 rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-2.5">
                      <div className="flex items-center justify-between text-xs flex-wrap gap-2">
                        <span className="font-bold text-slate-200 flex items-center gap-1.5">
                          <span>Строки 2+: Дополнительные нутриенты</span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            ({secondaryMetricsInForm.length} в форме)
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
                          <span>Добавить нутриент</span>
                        </button>
                      </div>

                      {/* Add Nutrient Popover / Menu */}
                      {isAddNutrientMenuOpen && (
                        <div className="p-3 rounded-xl bg-slate-800/95 border border-slate-700 space-y-3 animate-in fade-in duration-150">
                          <div className="flex items-center justify-between border-b border-slate-700/80 pb-2">
                            <span className="text-xs font-bold text-white">Добавить нутриент к продукту:</span>
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
                                    Выберите из существующих нутриентов:
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
                                <span className="text-[11px] text-slate-400">Нужного нутриента нет в списке?</span>
                                <button
                                  type="button"
                                  onClick={() => setIsCreatingNutrientMode(true)}
                                  className="flex items-center gap-1 text-[11px] font-bold text-purple-300 hover:text-purple-200"
                                >
                                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                                  <span>+ Создать новый нутриент</span>
                                </button>
                              </div>
                            </div>
                          ) : (
                            /* Inline New Nutrient Creator */
                            <form onSubmit={handleCreateNewNutrient} className="space-y-2.5">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-purple-300 flex items-center gap-1">
                                  <Sparkles className="w-3.5 h-3.5" />
                                  <span>Создание нового нутриента</span>
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setIsCreatingNutrientMode(false)}
                                  className="text-[10px] text-slate-400 hover:text-slate-200"
                                >
                                  ← Назад к выбору
                                </button>
                              </div>

                              {newNutrientError && (
                                <div className="p-1.5 rounded-lg bg-red-950/60 border border-red-800 text-[10px] text-red-300">
                                  {newNutrientError}
                                </div>
                              )}

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-[10px] text-slate-400 mb-0.5">Название нутриента *</label>
                                  <input
                                    type="text"
                                    required
                                    placeholder="например: Омега-3, Кофеин, Креатин"
                                    value={newNutrientName}
                                    onChange={(e) => setNewNutrientName(e.target.value)}
                                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-1.5">
                                  <div>
                                    <label className="block text-[10px] text-slate-400 mb-0.5">Единица</label>
                                    <select
                                      value={newNutrientUnit}
                                      onChange={(e) => setNewNutrientUnit(e.target.value)}
                                      className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                                    >
                                      <option value="г">г (граммы)</option>
                                      <option value="мг">мг (миллиграммы)</option>
                                      <option value="мкг">мкг (микрограммы)</option>
                                      <option value="мл">мл (миллилитры)</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-[10px] text-slate-400 mb-0.5">Суточная норма</label>
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
                                  <span className="text-[10px] text-slate-400">Цвет:</span>
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
                                  Создать и привязать
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
                                      title="Убрать нутриент из этого продукта"
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
                          Дополнительные нутриенты не выбраны. Нажмите «+ Добавить нутриент» выше.
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
                  onClick={() => setIsAddModalOpen(false)}
                  className="min-h-[40px] px-3.5 py-2 text-xs rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="min-h-[40px] px-4 py-2 text-xs font-bold rounded-xl text-white shadow-md transition active:scale-95"
                  style={{ backgroundColor: accentColor }}
                >
                  {t.saveToLibraryBtn}
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
                  <h3 className="text-sm font-bold text-white">Отображение нутриентов в карточках</h3>
                  <p className="text-[11px] text-slate-400">Настройте, что показывать во 2-й и 3-й строках продуктов</p>
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
                🛡️ <b className="text-white">Строка 1 (базовая):</b> Калории, Белки, Жиры и Углеводы всегда зафиксированы и отображаются первыми.
              </div>
              <div>
                ✨ <b className="text-white">Строки 2 и 3:</b> Включайте или скрывайте дополнительные нутриенты. Например, витамин С можно отслеживать в дневной норме, но скрыть в карточках продуктов, чтобы они оставались компактными.
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
                        <span>Всегда в стр. 1</span>
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
                            <span>Показывать</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                            <span>Скрыть</span>
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
                Готово
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
