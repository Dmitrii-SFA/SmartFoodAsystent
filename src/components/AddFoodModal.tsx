import React, { useState, useEffect } from 'react';
import { UserConfig, MetricConfig, LoggedFoodItem, LibraryFoodItem } from '../types/config';
import { PRESET_FOOD_DATABASE } from '../config/defaultConfig';
import { ThemeStyles, getBorderRadiusClass } from '../utils/themeHelper';
import { DynamicIcon, MealCategoryIcon } from '../utils/iconHelper';
import { X, Sparkles, Plus, Loader2, Apple } from 'lucide-react';
import { estimateFoodWithWorker, AiQuotaError } from '../utils/accessControl';

interface AddFoodModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: UserConfig;
  themeStyles: ThemeStyles;
  initialCategoryId?: string;
  onSaveFood: (food: Omit<LoggedFoodItem, 'id' | 'timestamp'>) => void;
  apiKey?: string;
  libraryItems?: LibraryFoodItem[];
  onOpenPaywallModal?: () => void;
  onQuotaUsed?: (count: number) => void;
}

export const AddFoodModal: React.FC<AddFoodModalProps> = ({
  isOpen,
  onClose,
  config,
  themeStyles,
  initialCategoryId,
  onSaveFood,
  libraryItems = [],
  onOpenPaywallModal,
  onQuotaUsed,
}) => {
  const labels = config.language.labels;
  const radiusClass = getBorderRadiusClass(config.theme.borderRadius);

  const [selectedCategory, setSelectedCategory] = useState<string>(
    initialCategoryId || config.mealCategories[0]?.id || 'breakfast'
  );
  const [foodName, setFoodName] = useState<string>('');
  const [amountGrams, setAmountGrams] = useState<number>(100);
  const [amountGramsStr, setAmountGramsStr] = useState<string>('100');
  const [nutrients, setNutrients] = useState<Record<string, number>>({});
  const [isEstimating, setIsEstimating] = useState<boolean>(false);
  const [aiNote, setAiNote] = useState<string | null>(null);

  // Update selected category if initialCategoryId changes
  useEffect(() => {
    if (initialCategoryId) {
      setSelectedCategory(initialCategoryId);
    }
  }, [initialCategoryId]);

  if (!isOpen) return null;

  // Form metrics (metrics that have showInFoodForm: true)
  const formMetrics = config.metrics.filter((m) => m.showInFoodForm);

  const handleNutrientChange = (metricId: string, val: string) => {
    if (val === '') {
      setNutrients((prev) => {
        const copy = { ...prev };
        delete copy[metricId];
        return copy;
      });
      return;
    }
    const num = parseFloat(val);
    if (!isNaN(num)) {
      setNutrients((prev) => ({
        ...prev,
        [metricId]: num,
      }));
    }
  };

  // Preset food click handler
  const handleSelectPreset = (preset: typeof PRESET_FOOD_DATABASE[0]) => {
    setFoodName(preset.name);
    setAmountGrams(preset.defaultGrams);
    setAmountGramsStr(String(preset.defaultGrams));
    const cleanNutrients: Record<string, number> = {};
    Object.entries(preset.nutrients).forEach(([k, v]) => {
      if (typeof v === 'number') {
        cleanNutrients[k] = v;
      }
    });
    setNutrients(cleanNutrients);
    setAiNote(null);
  };

  // Recalculate nutrients proportionally when amountGrams changes if base values are present
  const handleAmountGramsChange = (newGrams: number) => {
    if (newGrams <= 0) {
      setAmountGrams(newGrams);
      return;
    }
    const ratio = amountGrams > 0 ? newGrams / amountGrams : 1;
    setAmountGrams(newGrams);

    // Scale current nutrients
    setNutrients((prev) => {
      const scaled: Record<string, number> = {};
      Object.entries(prev).forEach(([key, val]) => {
        scaled[key] = Math.round(val * ratio * 10) / 10;
      });
      return scaled;
    });
  };

  // AI Estimation via Cloudflare Worker proxy
  const handleEstimateWithGemini = async () => {
    if (!foodName.trim()) return;
    setIsEstimating(true);
    setAiNote(null);

    try {
      const data = await estimateFoodWithWorker({
        query: `${foodName} (${amountGrams} г)`,
        metrics: config.metrics,
        onOpenPaywall: onOpenPaywallModal,
        onQuotaUsed,
      });

      if (!foodName.trim() && data.name) {
        setFoodName(data.name);
      }
      if (data.nutrients) {
        setNutrients(data.nutrients);
      }
      if (data.note) {
        setAiNote(data.note);
      }
    } catch (e: any) {
      if (e instanceof AiQuotaError) {
        setAiNote(e.message);
        return;
      }
      setAiNote(e?.message || 'Ошибка при расчёте пищевой ценности через ИИ.');
    } finally {
      setIsEstimating(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodName.trim()) return;

    const finalGrams = Number(amountGramsStr) || amountGrams || 100;
    onSaveFood({
      mealCategoryId: selectedCategory,
      name: foodName.trim(),
      amountGrams: finalGrams,
      nutrients: nutrients,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div
        className={`w-full max-w-xl border ${themeStyles.borderColor} ${themeStyles.cardBg} ${radiusClass} shadow-2xl p-6 text-slate-100 max-h-[90vh] overflow-y-auto`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white"
              style={{ backgroundColor: config.theme.accentColor }}
            >
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">{labels.addFood}</h3>
              <p className="text-xs text-slate-400">
                {config.language.code === 'ru' ? 'Запись в Data-Driven дневник' : 'Log to Data-Driven Diary'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="mt-4 space-y-4">
          {/* Meal Category Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {labels.selectMeal}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {config.mealCategories.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border text-xs font-semibold transition ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300 shadow-xs'
                        : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <MealCategoryIcon icon={cat.icon} className="w-4 h-4" />
                    <span>{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preset and Library quick buttons */}
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1.5 flex items-center justify-between">
              <span>{config.language.code === 'ru' ? 'Быстрый выбор из вашей библиотеки и базы:' : 'Quick Select:'}</span>
              {libraryItems.length > 0 && (
                <span className="text-[10px] text-emerald-400 font-mono">
                  {libraryItems.length} из библиотеки
                </span>
              )}
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
              {/* User Library products first */}
              {libraryItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setFoodName(item.name);
                    setAmountGrams(item.servingSizeGrams || 100);
                    setNutrients(item.nutrients || {});
                    setAiNote(null);
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border border-emerald-500/40 bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-200 transition active:scale-95"
                >
                  <Apple className="w-3 h-3 text-emerald-400" />
                  <span>{item.name}</span>
                </button>
              ))}

              {/* Standard Presets */}
              {PRESET_FOOD_DATABASE.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectPreset(item)}
                  className="px-2.5 py-1 text-xs rounded-lg border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white transition active:scale-95"
                >
                  {item.name}
                </button>
              ))}
            </div>
          </div>

          {/* Food Name & AI Estimate Button */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {labels.foodName}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                required
                value={foodName}
                onChange={(e) => setFoodName(e.target.value)}
                placeholder="например: Гречка с куриным филе"
                className={`flex-1 px-3 py-2 text-xs rounded-xl border ${themeStyles.inputBg} focus:outline-hidden focus:ring-2 focus:ring-emerald-500`}
              />
              <button
                type="button"
                onClick={handleEstimateWithGemini}
                disabled={!foodName.trim() || isEstimating}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white shadow-md transition active:scale-95 shrink-0"
                title="Рассчитать пищевую ценность с помощью Gemini Flash"
              >
                {isEstimating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                )}
                <span>Gemini AI</span>
              </button>
            </div>
            {aiNote && (
              <p className="mt-1 text-[11px] text-emerald-400 flex items-center gap-1">
                <span>✨</span>
                <span>{aiNote}</span>
              </p>
            )}
          </div>

          {/* Portion Grams */}
          <div className="w-full sm:w-1/2">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {labels.amountGrams}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                step="1"
                value={amountGramsStr}
                onChange={(e) => {
                  const v = e.target.value;
                  setAmountGramsStr(v);
                  if (v !== '' && !isNaN(Number(v))) {
                    handleAmountGramsChange(Number(v));
                  }
                }}
                onBlur={() => {
                  if (amountGramsStr === '' || isNaN(Number(amountGramsStr)) || Number(amountGramsStr) <= 0) {
                    setAmountGramsStr(String(amountGrams || 100));
                  }
                }}
                className={`w-full px-3 py-2 text-xs rounded-xl border ${themeStyles.inputBg} focus:outline-hidden focus:ring-2 focus:ring-emerald-500`}
              />
              <span className="text-xs text-slate-400 font-mono">г</span>
            </div>
          </div>

          {/* Dynamic Metric Fields rendered strictly from userConfig.metrics */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-300">
                {config.language.code === 'ru'
                  ? 'Нутриенты порции (Data-Driven список из userConfig)'
                  : 'Portion Nutrients (Driven by userConfig)'}
              </label>
              <span className="text-[10px] text-slate-400">
                {formMetrics.length} {config.language.code === 'ru' ? 'полей' : 'fields'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto pr-1">
              {formMetrics.map((metric: MetricConfig) => {
                const val = nutrients[metric.id] ?? '';
                return (
                  <div
                    key={metric.id}
                    className="p-2 rounded-xl border border-slate-800 bg-slate-900/50 flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1 truncate">
                        <DynamicIcon
                          name={metric.icon}
                          className="w-3 h-3 shrink-0"
                          style={{ color: metric.color }}
                        />
                        <span className="text-[11px] font-medium text-slate-300 truncate" title={metric.label}>
                          {metric.label}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">{metric.unit}</span>
                    </div>

                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={val}
                      onChange={(e) => handleNutrientChange(metric.id, e.target.value)}
                      placeholder="0"
                      className="w-full px-2 py-1 text-xs rounded-lg border border-slate-700 bg-slate-800 text-white font-mono focus:outline-hidden focus:ring-1 focus:ring-emerald-400"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 transition"
            >
              {labels.cancel}
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold rounded-xl text-white shadow-md transition active:scale-95"
              style={{ backgroundColor: config.theme.accentColor }}
            >
              {labels.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
