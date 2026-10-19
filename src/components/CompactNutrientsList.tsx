import React, { useState } from 'react';
import { MetricConfig, FoodItem, LocalizationLabels } from '../types/config';
import { ThemeStyles, getBorderRadiusClass } from '../utils/themeHelper';
import { getUITranslations } from '../utils/translations';
import {
  ChevronDown,
  ChevronUp,
  Droplets,
  Plus,
  RotateCcw,
  Star,
  AlertTriangle,
  Sparkles,
  X,
} from 'lucide-react';

interface CompactNutrientsListProps {
  metrics: MetricConfig[];
  consumedTotals?: Record<string, number>;
  todayItems?: FoodItem[];
  waterMl?: number;
  themeStyles: ThemeStyles;
  accentColor: string;
  borderRadius: string;
  apiKey?: string;
  langCode?: string;
  labels?: Partial<LocalizationLabels>;
  onAddWater?: (amountMl: number) => void;
  onResetWater?: () => void;
  onReorderMetrics?: (newMetrics: MetricConfig[]) => void;
  onToggleMetricVisibility?: (metricId: string, visible: boolean) => void;
  onToggleMetricPrimary?: (metricId: string, isPrimary: boolean) => void;
  onAddCustomMetric?: (newMetric: MetricConfig) => void;
  onNavigateToNutrientSettings?: () => void;
}

const CORE_PRIMARY_IDS = ['calories', 'proteins', 'fats', 'carbs', 'water'];

export const CompactNutrientsList: React.FC<CompactNutrientsListProps> = ({
  metrics,
  consumedTotals,
  todayItems = [],
  waterMl = 0,
  themeStyles,
  accentColor,
  borderRadius,
  langCode = 'ru',
  labels,
  onAddWater,
  onResetWater,
  onToggleMetricVisibility,
  onToggleMetricPrimary,
  onAddCustomMetric,
  onNavigateToNutrientSettings,
}) => {
  const [showAllSecondary, setShowAllSecondary] = useState(false);
  const [showAddPicker, setShowAddPicker] = useState(false);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customLabel, setCustomLabel] = useState('');
  const [customUnit, setCustomUnit] = useState('мг');
  const [customTarget, setCustomTarget] = useState('100');
  const [customColor, setCustomColor] = useState('#14b8a6');
  const [customIsPrimary, setCustomIsPrimary] = useState(true);

  const radiusClass = getBorderRadiusClass(borderRadius);
  const t = getUITranslations(langCode, labels);

  const visibleMetrics = (metrics || []).filter((m) => m.showInSummary !== false);
  const hiddenMetrics = (metrics || []).filter((m) => m.showInSummary === false);

  // Split visible metrics into Primary (Calories, Proteins, Fats, Carbs, Water, or user-marked isPrimary) and Secondary
  const primaryMetrics = visibleMetrics.filter((m) =>
    m.isPrimary !== undefined ? m.isPrimary : CORE_PRIMARY_IDS.includes(m.id)
  );

  const secondaryMetrics = visibleMetrics.filter(
    (m) => !(m.isPrimary !== undefined ? m.isPrimary : CORE_PRIMARY_IDS.includes(m.id))
  );

  const getMetricCurrentValue = (metricId: string): number => {
    if (consumedTotals && consumedTotals[metricId] !== undefined) {
      return Number(consumedTotals[metricId]) || 0;
    }
    if (metricId === 'water') {
      return waterMl || 0;
    }
    return (todayItems || []).reduce((sum, item) => {
      const val = item?.nutrients?.[metricId] || 0;
      return sum + val;
    }, 0);
  };

  // Calculate status alerts across all visible metrics
  const overTargetMetrics = visibleMetrics.filter((m) => {
    const val = getMetricCurrentValue(m.id);
    return m.target > 0 && val > m.target * 1.1; // >110%
  });

  const handleCreateCustomNutrient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customLabel.trim() || !onAddCustomMetric) return;
    const id = `custom_${Date.now()}`;
    onAddCustomMetric({
      id,
      label: customLabel.trim(),
      shortLabel: customLabel.trim().slice(0, 6),
      unit: customUnit.trim() || (langCode === 'ru' ? 'мг' : 'mg'),
      target: Math.max(1, Number(customTarget) || 100),
      color: customColor,
      showInSummary: true,
      showInDetailList: true,
      showInFoodForm: true,
      showInProducts: true,
      isPrimary: customIsPrimary,
      category: 'custom',
    });
    setCustomLabel('');
    setShowCustomForm(false);
    setShowAddPicker(false);
  };

  const renderMetricRow = (metric: MetricConfig, isPrimarySection: boolean) => {
    const currentVal = Math.round(getMetricCurrentValue(metric.id) * 10) / 10;
    const targetVal = metric.target || 1;
    const rawPercentage = Math.round((currentVal / targetVal) * 100);
    const barPercentage = Math.min(100, Math.max(0, rawPercentage));
    const isOver = currentVal > targetVal;
    const isWater = metric.id === 'water';
    const remaining = Math.max(0, Math.round((targetVal - currentVal) * 10) / 10);
    const overAmount = Math.max(0, Math.round((currentVal - targetVal) * 10) / 10);

    return (
      <div
        key={metric.id}
        className={`group flex flex-col gap-1 py-1.5 px-2.5 rounded-xl border transition-all ${
          isPrimarySection
            ? 'bg-slate-900/65 border-slate-800/90 hover:border-slate-700'
            : 'bg-slate-900/35 border-slate-800/50 hover:border-slate-700/70'
        }`}
      >
        <div className="flex items-center justify-between gap-2 text-xs">
          {/* Left: Dot + Label + Star toggle */}
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
              style={{ backgroundColor: metric.color }}
            />
            <span
              className={`font-semibold truncate ${
                isPrimarySection ? themeStyles.textPrimary : 'text-slate-300'
              }`}
            >
              {metric.label}
            </span>

            {/* Toggle Primary / Secondary star */}
            {onToggleMetricPrimary && (
              <button
                type="button"
                onClick={() => onToggleMetricPrimary(metric.id, !isPrimarySection)}
                title={isPrimarySection ? t.moveToSecondary : t.makePrimary}
                className={`p-1 rounded transition ${
                  isPrimarySection
                    ? 'text-amber-400/70 hover:text-amber-300'
                    : 'text-slate-500 hover:text-amber-400'
                }`}
              >
                <Star className={`w-3.5 h-3.5 ${isPrimarySection ? 'fill-amber-400/40' : ''}`} />
              </button>
            )}

            {/* Quick Water Controls inline */}
            {isWater && onAddWater && (
              <div className="flex items-center gap-1 ml-1 flex-wrap">
                <button
                  onClick={() => onAddWater?.(250)}
                  className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/30 transition flex items-center gap-0.5 active:scale-95"
                  title={`+250 ${t.mlShort}`}
                >
                  <Plus className="w-2.5 h-2.5" />
                  250
                </button>
                <button
                  onClick={() => onAddWater?.(500)}
                  className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/30 transition flex items-center gap-0.5 active:scale-95"
                  title={`+500 ${t.mlShort}`}
                >
                  <Plus className="w-2.5 h-2.5" />
                  500
                </button>
                {currentVal > 0 && onResetWater && (
                  <button
                    onClick={() => onResetWater?.()}
                    className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition"
                    title={t.reset}
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Right: Numbers + Remaining/Over + Percentage */}
          <div className="flex items-center gap-2 shrink-0 font-mono text-xs tabular-nums">
            <span
              className="hidden sm:inline text-[10px]"
              style={{ color: isOver ? '#f87171' : `${metric.color}cc` }}
            >
              {isOver
                ? `${t.exceededBy} +${overAmount} ${metric.unit}`
                : `${t.remainingLabel} ${remaining} ${metric.unit}`}
            </span>
            <div>
              <span
                className="font-bold transition-colors"
                style={{ color: isOver ? '#f87171' : metric.color }}
              >
                {currentVal}
              </span>
              <span className="text-slate-500"> / </span>
              <span className={themeStyles.textSecondary}>
                {targetVal} <span className="text-[10px]">{metric.unit}</span>
              </span>
            </div>
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded-md min-w-[40px] text-center border transition-colors"
              style={
                isOver
                  ? {
                      backgroundColor: 'rgba(239, 68, 68, 0.15)',
                      color: '#fca5a5',
                      borderColor: 'rgba(239, 68, 68, 0.35)',
                    }
                  : rawPercentage >= 90
                  ? {
                      backgroundColor: `${metric.color}25`,
                      color: metric.color,
                      borderColor: `${metric.color}50`,
                    }
                  : {
                      backgroundColor: 'rgba(30, 41, 59, 0.8)',
                      color: metric.color,
                      borderColor: `${metric.color}35`,
                    }
              }
            >
              {rawPercentage}%
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${barPercentage}%`,
              backgroundColor: isOver && metric.id === 'calories' ? '#ef4444' : metric.color,
            }}
          />
        </div>
      </div>
    );
  };

  return (
    <div
      className={`border ${themeStyles.borderColor} ${themeStyles.cardBg} ${radiusClass} p-3.5 shadow-sm transition-all space-y-2.5`}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <h3 className={`text-sm font-bold tracking-tight ${themeStyles.textPrimary}`}>
            {t.dailySummaryTitle}
          </h3>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-medium">
            {primaryMetrics.length} {t.primaryShort} • {secondaryMetrics.length} {t.secondaryShort}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {overTargetMetrics.length > 0 ? (
            <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded-lg">
              <AlertTriangle className="w-3 h-3 shrink-0" />
              <span>
                {t.exceededNorm} {overTargetMetrics.length}
              </span>
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[11px] text-emerald-400/90">
              <Droplets className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="hidden sm:inline">{t.allNutrientsInNorm}</span>
            </span>
          )}

          {/* Quick Add Nutrient Button */}
          <button
            type="button"
            onClick={() => setShowAddPicker((prev) => !prev)}
            className="min-h-[34px] flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border border-slate-700 bg-slate-800/90 hover:bg-slate-700 text-slate-200 transition"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>{t.addNutrient}</span>
          </button>
        </div>
      </div>

      {/* Quick Add Nutrient Picker Panel */}
      {showAddPicker && (
        <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2.5 animate-in fade-in duration-150">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              {t.quickAddNutrientTitle}
            </span>
            <button
              type="button"
              onClick={() => {
                setShowAddPicker(false);
                setShowCustomForm(false);
              }}
              className="p-1 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {hiddenMetrics.length > 0 ? (
            <div className="space-y-1.5">
              <p className="text-[11px] text-slate-400">{t.clickNutrientToAdd}</p>
              <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-0.5">
                {hiddenMetrics.map((hm) => (
                  <button
                    key={hm.id}
                    type="button"
                    onClick={() => {
                      if (onToggleMetricVisibility) {
                        onToggleMetricVisibility(hm.id, true);
                      }
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-200 transition"
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: hm.color }}
                    />
                    <span>{hm.label}</span>
                    <span className="text-[10px] text-slate-400">
                      ({hm.target} {hm.unit})
                    </span>
                    <Plus className="w-3 h-3 text-emerald-400" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400">{t.allPresetsEnabledHint}</p>
          )}

          {/* Create custom nutrient inline or jump to full settings */}
          <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setShowCustomForm((prev) => !prev)}
              className="text-xs font-semibold text-emerald-400 hover:underline flex items-center gap-1 py-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t.createOwnNutrient}</span>
            </button>

            {onNavigateToNutrientSettings && (
              <button
                type="button"
                onClick={onNavigateToNutrientSettings}
                className="text-[11px] text-slate-400 hover:text-white underline py-1"
              >
                {t.allNutrientsSettingsLink}
              </button>
            )}
          </div>

          {showCustomForm && (
            <form
              onSubmit={handleCreateCustomNutrient}
              className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-2 border-t border-slate-800/60 text-xs"
            >
              <input
                type="text"
                required
                placeholder={t.nutrientNamePlaceholder}
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                className="sm:col-span-2 min-h-[38px] px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white"
              />
              <input
                type="number"
                required
                min="1"
                placeholder={t.dailyNormPlaceholder}
                value={customTarget}
                onChange={(e) => setCustomTarget(e.target.value)}
                className="min-h-[38px] px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white"
              />
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  placeholder={langCode === 'ru' ? 'Ед. (мг/г)' : 'Unit (mg/g)'}
                  value={customUnit}
                  onChange={(e) => setCustomUnit(e.target.value)}
                  className="w-full min-h-[38px] px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white"
                />
                <input
                  type="color"
                  value={customColor}
                  onChange={(e) => setCustomColor(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 shrink-0"
                />
              </div>
              <button
                type="submit"
                className="min-h-[38px] px-3 py-1.5 rounded-lg font-bold text-white transition"
                style={{ backgroundColor: accentColor }}
              >
                {t.add}
              </button>
              <label className="sm:col-span-5 flex items-center gap-2 text-[11px] text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={customIsPrimary}
                  onChange={(e) => setCustomIsPrimary(e.target.checked)}
                  className="rounded border-slate-700"
                />
                <span>{t.showInPrimaryBlock}</span>
              </label>
            </form>
          )}
        </div>
      )}

      {/* Primary Metrics List (Always Visible) */}
      <div className="space-y-1.5">
        {primaryMetrics.map((metric) => renderMetricRow(metric, true))}
      </div>

      {/* Expandable Secondary Metrics */}
      {secondaryMetrics.length > 0 && (
        <>
          {showAllSecondary && (
            <div className="pt-2 border-t border-slate-800/80 space-y-1.5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 px-1 pb-0.5">
                <span>{t.secondaryNutrientsLabel}</span>
                <span className="text-[10px] text-slate-500 hidden sm:inline">
                  {t.starHintMakePrimary}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                {secondaryMetrics.map((metric) => renderMetricRow(metric, false))}
              </div>
            </div>
          )}

          {/* Toggle Secondary Button */}
          <button
            onClick={() => setShowAllSecondary((prev) => !prev)}
            className="w-full min-h-[38px] py-1.5 px-3 rounded-xl bg-slate-900/70 hover:bg-slate-800/80 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white flex items-center justify-center gap-1.5 transition"
          >
            {showAllSecondary ? (
              <>
                <ChevronUp className="w-4 h-4 text-slate-400" />
                <span>{t.hideSecondaryNutrients}</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 text-slate-400" />
                <span>
                  {t.showSecondaryNutrients} (+{secondaryMetrics.length}:{' '}
                  {secondaryMetrics
                    .slice(0, 3)
                    .map((m) => m.shortLabel || m.label)
                    .join(', ')}
                  {secondaryMetrics.length > 3 ? '...' : ''})
                </span>
              </>
            )}
          </button>
        </>
      )}
    </div>
  );
};
