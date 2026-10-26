import React, { useState, useEffect } from 'react';
import { MetricConfig, LocalizationLabels, NutritionGoalMode } from '../types/config';
import { ThemeStyles, getBorderRadiusClass } from '../utils/themeHelper';
import {
  Calculator,
  Sparkles,
  Check,
  User,
  Activity,
  Target,
  ChevronDown,
  Loader2,
  AlertCircle,
  SlidersHorizontal,
} from 'lucide-react';
import { calculateDailyNormWithWorker, AiQuotaError } from '../utils/accessControl';
import { getNutrientColor } from '../utils/nutrientColors';
import { METRIC_TRANSLATIONS } from '../config/defaultConfig';
import { translateUnit } from '../utils/translations';

interface DailyNormCalculatorProps {
  metrics: MetricConfig[];
  themeStyles: ThemeStyles;
  accentColor: string;
  borderRadius: string;
  apiKey?: string;
  langCode?: string;
  labels?: Partial<LocalizationLabels>;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  goalMode?: NutritionGoalMode;
  onUpdateGoalMode?: (mode: NutritionGoalMode) => void;
  onUpdateMetrics?: (updatedMetrics: MetricConfig[]) => void;
  onApplyNorm?: (calories: number, proteins: number, fats: number, carbs: number) => void;
  onApplyCalculatedTargets?: (updatedMetrics: MetricConfig[], summaryText: string) => void;
  onOpenPaywallModal?: () => void;
}

type Gender = 'male' | 'female';
type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active' | 'custom';
type GoalType = NutritionGoalMode;

const CORE_PRIMARY_IDS = ['calories', 'proteins', 'fats', 'carbs', 'water'];

export const DailyNormCalculator: React.FC<DailyNormCalculatorProps> = ({
  metrics,
  themeStyles,
  accentColor,
  borderRadius,
  langCode = 'ru',
  isCollapsed = false,
  onToggleCollapse,
  goalMode = 'maintain',
  onUpdateGoalMode,
  onUpdateMetrics,
  onApplyNorm,
  onApplyCalculatedTargets,
  onOpenPaywallModal,
}) => {
  const radiusClass = getBorderRadiusClass(borderRadius);
  const c = (langCode || 'ru').toLowerCase().slice(0, 2);
  const isEn = c === 'en';
  const isPl = c === 'pl';

  const isMetricPrimary = (m: MetricConfig) =>
    m.isPrimary !== undefined ? m.isPrimary : CORE_PRIMARY_IDS.includes(m.id);

  const trackedMetrics = (metrics || []).filter(
    (m) => m.showInSummary !== false || CORE_PRIMARY_IDS.includes(m.id)
  );
  const primaryTrackedMetrics = trackedMetrics.filter((m) => isMetricPrimary(m));
  const secondaryTrackedMetrics = trackedMetrics.filter((m) => !isMetricPrimary(m));

  // Manual inputs dictionary for all metrics
  const [manualTargets, setManualTargets] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    (metrics || []).forEach((m) => {
      init[m.id] = String(typeof m.target === 'number' ? m.target : 0);
    });
    return init;
  });

  // Sync manual inputs when metrics prop changes externally
  useEffect(() => {
    const next: Record<string, string> = {};
    (metrics || []).forEach((m) => {
      next[m.id] = String(typeof m.target === 'number' ? m.target : 0);
    });
    setManualTargets(next);
  }, [metrics]);

  // Expand/collapse state for selected secondary nutrients
  const [isSecondaryOpen, setIsSecondaryOpen] = useState<boolean>(false);

  // AI Calculation Menu state (hidden by default inside the "Посчитать с помощью ИИ" button)
  const [isAiMenuOpen, setIsAiMenuOpen] = useState<boolean>(false);
  const [gender, setGender] = useState<Gender>('male');
  const [age, setAge] = useState<string>('28');
  const [weight, setWeight] = useState<string>('75');
  const [height, setHeight] = useState<string>('178');
  const [activity, setActivity] = useState<ActivityLevel>('moderate');
  const [customActivity, setCustomActivity] = useState<string>('');
  const [goal, setGoal] = useState<GoalType>(goalMode || 'maintain');

  useEffect(() => {
    if (goalMode) {
      setGoal(goalMode);
    }
  }, [goalMode]);

  const handleSelectGoalMode = (nextGoal: GoalType) => {
    setGoal(nextGoal);
    onUpdateGoalMode?.(nextGoal);
  };

  const [isAiCalculating, setIsAiCalculating] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiNote, setAiNote] = useState<string | null>(null);
  const [appliedFlash, setAppliedFlash] = useState<boolean>(false);

  const PRESET_ACTIVITIES: Record<
    Exclude<ActivityLevel, 'custom'>,
    { label: string; factor: number; desc: string }
  > = {
    sedentary: {
      label: isEn ? 'Sedentary' : isPl ? 'Siedzący' : 'Сидячий образ жизни',
      factor: 1.2,
      desc: isEn
        ? 'Office job, little movement'
        : isPl
        ? 'Praca biurowa, mało ruchu'
        : 'Офисная работа, минимум движения',
    },
    light: {
      label: isEn ? 'Light activity' : isPl ? 'Lekka aktywność' : 'Лёгкая активность',
      factor: 1.375,
      desc: isEn
        ? 'Workouts 1–3 times a week'
        : isPl
        ? 'Treningi 1–3 razy w tygodniu'
        : 'Тренировки 1–3 раза в неделю',
    },
    moderate: {
      label: isEn ? 'Moderate activity' : isPl ? 'Umiarkowana aktywność' : 'Средняя активность',
      factor: 1.55,
      desc: isEn
        ? 'Workouts 3–5 times a week'
        : isPl
        ? 'Treningi 3–5 razy w tygodniu'
        : 'Спорт 3–5 раз в неделю',
    },
    active: {
      label: isEn ? 'High activity' : isPl ? 'Wysoka aktywność' : 'Высокая активность',
      factor: 1.725,
      desc: isEn
        ? 'Daily intensive workouts'
        : isPl
        ? 'Codzienne intensywne treningi'
        : 'Интенсивные тренировки 6–7 раз в неделю',
    },
    very_active: {
      label: isEn ? 'Extreme activity' : isPl ? 'Bardzo wysoka' : 'Экстремальная нагрузка',
      factor: 1.9,
      desc: isEn
        ? 'Physical labor or 2x/day training'
        : isPl
        ? 'Praca fizyczna lub 2 treningi dziennie'
        : 'Тяжёлый физ. труд или 2 тренировки в день',
    },
  };

  const GOAL_MODIFIERS: Record<
    GoalType,
    { label: string; shortLabel: string; calFactor: number; protPerKg: number; fatPerKg: number }
  > = {
    lose: {
      label: isEn ? 'Weight loss (−15%)' : isPl ? 'Redukcja (−15%)' : 'Похудение (−15% ккал)',
      shortLabel: isEn ? 'Weight Loss' : isPl ? 'Redukcja' : 'Похудение',
      calFactor: 0.85,
      protPerKg: 2.0,
      fatPerKg: 0.9,
    },
    maintain: {
      label: isEn ? 'Maintenance' : isPl ? 'Utrzymanie wagi' : 'Поддержание веса',
      shortLabel: isEn ? 'Maintain' : isPl ? 'Utrzymanie' : 'Баланс',
      calFactor: 1.0,
      protPerKg: 1.6,
      fatPerKg: 1.0,
    },
    gain: {
      label: isEn ? 'Muscle gain (+15%)' : isPl ? 'Budowa masy (+15%)' : 'Набор массы (+15% ккал)',
      shortLabel: isEn ? 'Gain' : isPl ? 'Masa' : 'Набор',
      calFactor: 1.15,
      protPerKg: 2.0,
      fatPerKg: 1.1,
    },
  };

  const getLocalizedMetricLabel = (m: MetricConfig): string => {
    return METRIC_TRANSLATIONS[c]?.[m.id] || m.label;
  };

  const handleManualInputChange = (id: string, val: string) => {
    setManualTargets((prev) => ({ ...prev, [id]: val }));
  };

  const applyAllTargets = (nextTargetsMap: Record<string, number>) => {
    const safeCal = Math.max(500, Math.round(nextTargetsMap.calories || 2000));
    const safeProt = Math.max(10, Math.round(nextTargetsMap.proteins || 100));
    const safeFat = Math.max(10, Math.round(nextTargetsMap.fats || 60));
    const safeCarb = Math.max(10, Math.round(nextTargetsMap.carbs || 200));
    const safeWater = Math.max(500, Math.round(nextTargetsMap.water || 2000));

    const updated = metrics.map((m) => {
      if (m.id === 'calories') return { ...m, target: safeCal };
      if (m.id === 'proteins') return { ...m, target: safeProt };
      if (m.id === 'fats') return { ...m, target: safeFat };
      if (m.id === 'carbs') return { ...m, target: safeCarb };
      if (m.id === 'water') return { ...m, target: safeWater };
      if (nextTargetsMap[m.id] !== undefined && !Number.isNaN(nextTargetsMap[m.id])) {
        const rounded = Math.round(nextTargetsMap[m.id] * 10) / 10;
        return { ...m, target: Math.max(0, rounded) };
      }
      return m;
    });

    const summary = `${safeCal} kcal (${safeProt}/${safeFat}/${safeCarb})`;
    onApplyCalculatedTargets?.(updated, summary);
    onUpdateMetrics?.(updated);
    onApplyNorm?.(safeCal, safeProt, safeFat, safeCarb);
  };

  const handleSaveManual = () => {
    const numericMap: Record<string, number> = {};
    trackedMetrics.forEach((m) => {
      const rawVal = Number(manualTargets[m.id]);
      if (m.id === 'calories') {
        numericMap[m.id] = Math.max(500, Math.round(rawVal || 2000));
      } else if (m.id === 'water') {
        numericMap[m.id] = Math.max(500, Math.round(rawVal || 2000));
      } else if (['proteins', 'fats', 'carbs'].includes(m.id)) {
        numericMap[m.id] = Math.max(10, Math.round(rawVal || m.target || 50));
      } else {
        numericMap[m.id] = Math.max(0, Number.isNaN(rawVal) ? m.target : rawVal);
      }
    });

    setManualTargets((prev) => {
      const updatedStrings = { ...prev };
      Object.entries(numericMap).forEach(([k, v]) => {
        updatedStrings[k] = String(v);
      });
      return updatedStrings;
    });

    applyAllTargets(numericMap);
    setAppliedFlash(true);
    setTimeout(() => setAppliedFlash(false), 2500);
  };

  const handleCalculateWithAi = async () => {
    setAiError(null);
    setAiNote(null);

    const numAge = Math.max(12, Math.min(100, Number(age) || 28));
    const numWeight = Math.max(30, Math.min(250, Number(weight) || 75));
    const numHeight = Math.max(120, Math.min(230, Number(height) || 178));

    const trimmedCustom = customActivity.trim();
    const isUsingCustom = activity === 'custom' || trimmedCustom.length > 0;

    if (activity === 'custom' && !trimmedCustom) {
      setAiError(
        isEn
          ? 'Please enter your activity in the text field below.'
          : isPl
          ? 'Wpisz swoją aktywność w polu tekstowym poniżej.'
          : 'Пожалуйста, впишите вашу активность в пустую строчку ниже.'
      );
      return;
    }

    const activityDesc = isUsingCustom
      ? trimmedCustom
      : `${PRESET_ACTIVITIES[activity as Exclude<ActivityLevel, 'custom'>].label} (${
          PRESET_ACTIVITIES[activity as Exclude<ActivityLevel, 'custom'>].desc
        })`;

    setIsAiCalculating(true);
    try {
      const result = await calculateDailyNormWithWorker({
        gender,
        age: numAge,
        weightKg: numWeight,
        heightCm: numHeight,
        goalLabel: GOAL_MODIFIERS[goal].label,
        activityDescription: activityDesc,
        trackedMetrics: trackedMetrics.map((m) => ({
          id: m.id,
          label: getLocalizedMetricLabel(m),
          unit: m.unit,
        })),
        langCode,
        onOpenPaywall: onOpenPaywallModal,
      });

      const mergedTargets: Record<string, number> = {};
      trackedMetrics.forEach((m) => {
        mergedTargets[m.id] = Number(manualTargets[m.id]) || m.target;
      });

      if (result.targets && typeof result.targets === 'object') {
        Object.entries(result.targets).forEach(([k, val]) => {
          if (typeof val === 'number' && !Number.isNaN(val)) {
            mergedTargets[k] = val;
          }
        });
      }
      if (typeof result.calories === 'number') mergedTargets.calories = result.calories;
      if (typeof result.proteins === 'number') mergedTargets.proteins = result.proteins;
      if (typeof result.fats === 'number') mergedTargets.fats = result.fats;
      if (typeof result.carbs === 'number') mergedTargets.carbs = result.carbs;
      if (typeof result.water === 'number') mergedTargets.water = result.water;
      if (typeof result.fiber === 'number') mergedTargets.fiber = result.fiber;
      if (typeof result.sugar === 'number') mergedTargets.sugar = result.sugar;

      setManualTargets((prev) => {
        const next = { ...prev };
        Object.entries(mergedTargets).forEach(([k, val]) => {
          next[k] = String(Math.round(val * 10) / 10);
        });
        return next;
      });

      if (result.note) {
        setAiNote(result.note);
      }

      if (secondaryTrackedMetrics.length > 0) {
        setIsSecondaryOpen(true);
      }

      applyAllTargets(mergedTargets);

      setAppliedFlash(true);
      setTimeout(() => setAppliedFlash(false), 2500);
    } catch (err: any) {
      if (err instanceof AiQuotaError) {
        if ((err.reason === 'daily_limit_reached' || err.code === 'LIMIT_REACHED') && onOpenPaywallModal) {
          onOpenPaywallModal();
        }
        setAiError(err.message);
      } else {
        setAiError(
          err?.message ||
            (isEn
              ? 'Failed to calculate with AI. Please try again.'
              : isPl
              ? 'Nie udało się obliczyć z AI. Spróbuj ponownie.'
              : 'Не удалось выполнить расчёт с помощью ИИ. Попробуйте ещё раз.')
        );
      }
    } finally {
      setIsAiCalculating(false);
    }
  };

  const currentCalorieTarget =
    metrics.find((m) => m.id === 'calories')?.target || Number(manualTargets.calories) || 2000;
  const calorieColor = getNutrientColor('calories', metrics, '#f97316');

  const renderNutrientNormInputCard = (m: MetricConfig) => {
    const color = getNutrientColor(m.id, metrics, m.color);
    const labelText = getLocalizedMetricLabel(m);
    const unitText = translateUnit(m.unit, langCode);
    const valStr = manualTargets[m.id] ?? String(m.target ?? 0);

    return (
      <div
        key={m.id}
        className="p-2.5 rounded-xl bg-slate-900/90 border transition-colors"
        style={{ borderColor: `${color}45` }}
      >
        <label
          className="flex items-center justify-between gap-1.5 text-[11px] font-semibold mb-1.5 truncate"
          title={`${labelText} (${unitText})`}
        >
          <span className="flex items-center gap-1.5 min-w-0 truncate">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: color }}
            />
            <span className="truncate" style={{ color }}>
              {labelText}
            </span>
          </span>
          <span className="text-[10px] text-slate-400 font-mono shrink-0">{unitText}</span>
        </label>
        <input
          type="number"
          min="0"
          step="any"
          value={valStr}
          onChange={(e) => handleManualInputChange(m.id, e.target.value)}
          className="w-full min-h-[38px] px-2.5 py-1.5 rounded-lg bg-slate-950 border font-bold font-mono text-sm focus:outline-none transition"
          style={{
            color,
            borderColor: `${color}55`,
          }}
        />
      </div>
    );
  };

  return (
    <div
      id="daily-norm-settings-section"
      className={`border ${themeStyles.borderColor} ${themeStyles.cardBg} ${radiusClass} p-4 sm:p-5 shadow-sm transition-all ${
        isCollapsed ? 'space-y-0' : 'space-y-4'
      }`}
    >
      {/* Header */}
      <div
        onClick={onToggleCollapse}
        className={`flex items-start justify-between gap-3 ${
          onToggleCollapse ? 'cursor-pointer select-none group' : ''
        }`}
      >
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
            style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
          >
            <Calculator className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <h3
              className={`text-sm sm:text-base font-bold leading-snug break-words ${themeStyles.textPrimary}`}
            >
              {isEn ? 'Daily Norm' : isPl ? 'Dzienna norma' : 'Суточная норма'}
            </h3>
            <p className={`text-xs leading-relaxed break-words ${themeStyles.textSecondary}`}>
              {isEn
                ? 'Manual entry or AI calculation of daily targets for all selected nutrients'
                : isPl
                ? 'Ręczne wprowadzanie lub obliczenie z AI dziennych norm dla wszystkich wybranych składników'
                : 'Ручной ввод или расчёт с помощью ИИ суточной нормы для всех выбранных нутриентов'}
            </p>
            <div className="pt-1 flex items-center gap-2 flex-wrap">
              <span
                className="inline-flex items-center text-[11px] font-mono tabular-nums px-2.5 py-0.5 rounded-lg bg-slate-800/90 border font-semibold"
                style={{ color: calorieColor, borderColor: `${calorieColor}55` }}
              >
                {currentCalorieTarget} {isEn || isPl ? 'kcal' : 'ккал'}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2.5 py-0.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 font-semibold">
                <Target className="w-3 h-3 shrink-0" />
                {GOAL_MODIFIERS[goal].shortLabel}
              </span>
              <span className="inline-flex items-center text-[11px] font-mono tabular-nums px-2.5 py-0.5 rounded-lg bg-slate-800/90 border border-slate-700 text-slate-300">
                {isEn
                  ? `Tracked nutrients: ${trackedMetrics.length}`
                  : isPl
                  ? `Śledzone składniki: ${trackedMetrics.length}`
                  : `Отслеживается нутриентов: ${trackedMetrics.length}`}
              </span>
            </div>
          </div>
        </div>
        {onToggleCollapse && (
          <div className="p-1.5 rounded-lg text-slate-400 group-hover:text-white transition shrink-0">
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${
                !isCollapsed ? 'rotate-180' : ''
              }`}
            />
          </div>
        )}
      </div>

      {!isCollapsed && (
        <div className="space-y-4 pt-3.5 border-t border-slate-800/80 animate-in fade-in duration-150">
          {/* Goal Mode Selector directly in Daily Norm (Похудение, Баланс, Набор) */}
          <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/90 space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>
                  {isEn
                    ? 'Goal & Daily Menu Highlighting'
                    : isPl
                    ? 'Cel i podświetlanie w dziennym menu'
                    : 'Цель и подсветка в Дневном меню'}
                </span>
              </label>
              <span className="text-[11px] text-slate-400">
                {goal === 'lose'
                  ? isEn
                    ? 'Within norm — green, exceeded — red'
                    : isPl
                    ? 'W normie — zielony, przekroczenie — czerwony'
                    : 'Не добрал — зелёный, превысил — красный'
                  : goal === 'gain'
                  ? isEn
                    ? 'Below norm — red, reached — green'
                    : isPl
                    ? 'Poniżej normy — czerwony, osiągnięto — zielony'
                    : 'Не добрал — красный, набрал норму — зелёный'
                  : isEn
                  ? 'No red/green highlighting'
                  : isPl
                  ? 'Bez podświetlania na czerwono/zielono'
                  : 'Без красной и зелёной подсветки'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(GOAL_MODIFIERS) as GoalType[]).map((gKey) => {
                const isSelected = goal === gKey;
                return (
                  <button
                    key={gKey}
                    type="button"
                    onClick={() => handleSelectGoalMode(gKey)}
                    className={`min-h-[40px] py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 ${
                      isSelected
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-sm ring-1 ring-emerald-500/40'
                        : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                    }`}
                  >
                    <span>{GOAL_MODIFIERS[gKey].shortLabel}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Primary Manual Input Section */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
              {primaryTrackedMetrics.map((m) => renderNutrientNormInputCard(m))}
            </div>

            {/* Selected Secondary Nutrients Expand/Collapse Section */}
            {secondaryTrackedMetrics.length > 0 && (
              <div className="space-y-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setIsSecondaryOpen((prev) => !prev)}
                  className={`w-full min-h-[40px] px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center justify-between gap-2 transition active:scale-[0.99] ${
                    isSecondaryOpen
                      ? 'bg-slate-800/90 border-emerald-500/50 text-emerald-300'
                      : 'bg-slate-900/80 hover:bg-slate-800/70 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate">
                      {isSecondaryOpen
                        ? isEn
                          ? 'Hide selected secondary nutrients'
                          : isPl
                          ? 'Ukryj wybrane dodatkowe składniki'
                          : 'Скрыть выбранные второстепенные нутриенты'
                        : isEn
                        ? 'Show selected secondary nutrients'
                        : isPl
                        ? 'Pokaż wybrane dodatkowe składniki'
                        : 'Показать выбранные второстепенные нутриенты'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="hidden sm:flex items-center -space-x-1">
                      {secondaryTrackedMetrics.slice(0, 6).map((m) => (
                        <span
                          key={m.id}
                          className="w-2.5 h-2.5 rounded-full ring-1 ring-slate-950"
                          style={{
                            backgroundColor: getNutrientColor(m.id, metrics, m.color),
                          }}
                        />
                      ))}
                    </div>
                    <span className="text-[11px] font-mono tabular-nums px-2 py-0.5 rounded-lg bg-slate-950/80 border border-slate-700 text-emerald-300">
                      {secondaryTrackedMetrics.length}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-200 ${
                        isSecondaryOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </button>

                {isSecondaryOpen && (
                  <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/90 animate-in fade-in duration-150">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                      {secondaryTrackedMetrics.map((m) => renderNutrientNormInputCard(m))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action buttons row: Save Manual & Calculate with AI toggle */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={() => setIsAiMenuOpen((prev) => !prev)}
                className={`min-h-[42px] px-4 py-2.5 rounded-xl font-bold text-xs border flex items-center justify-center gap-2 transition active:scale-95 ${
                  isAiMenuOpen
                    ? 'bg-purple-600/25 border-purple-500 text-purple-200'
                    : 'bg-slate-900 hover:bg-slate-800/90 border-purple-500/40 text-purple-300'
                }`}
              >
                <Sparkles className="w-4 h-4 text-yellow-300 shrink-0" />
                <span>
                  {isEn
                    ? 'Calculate with AI'
                    : isPl
                    ? 'Oblicz za pomocą AI'
                    : 'Посчитать с помощью ИИ'}
                </span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    isAiMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              <button
                type="button"
                onClick={handleSaveManual}
                className="min-h-[42px] px-5 py-2.5 rounded-xl font-bold text-xs text-white shadow-md flex items-center justify-center gap-1.5 transition active:scale-95"
                style={{ backgroundColor: accentColor }}
              >
                <Check className="w-4 h-4" />
                <span>
                  {appliedFlash
                    ? isEn
                      ? 'Saved!'
                      : isPl
                      ? 'Zapisano!'
                      : 'Норма сохранена!'
                    : isEn
                    ? 'Save daily norm'
                    : isPl
                    ? 'Zapisz dzienną normę'
                    : 'Сохранить суточную норму'}
                </span>
              </button>
            </div>
          </div>

          {/* Collapsible "Посчитать с помощью ИИ" Menu */}
          {isAiMenuOpen && (
            <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-950/90 border border-purple-500/30 space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-yellow-300 shrink-0" />
                  <span className="text-xs font-bold text-purple-200">
                    {isEn
                      ? 'AI Daily Norm Calculation'
                      : isPl
                      ? 'Obliczanie dziennej normy przez AI'
                      : 'Расчёт суточной нормы с помощью ИИ'}
                  </span>
                </div>
              </div>

              {/* Body Parameters */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                {/* Gender */}
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1 flex items-center gap-1">
                    <User className="w-3 h-3" /> {isEn ? 'Gender' : isPl ? 'Płeć' : 'Пол'}
                  </label>
                  <div className="grid grid-cols-2 gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setGender('male')}
                      className={`min-h-[34px] py-1.5 rounded-lg font-semibold transition ${
                        gender === 'male'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {isEn ? 'Male' : isPl ? 'Męż.' : 'Муж'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setGender('female')}
                      className={`min-h-[34px] py-1.5 rounded-lg font-semibold transition ${
                        gender === 'female'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {isEn ? 'Female' : isPl ? 'Kob.' : 'Жен'}
                    </button>
                  </div>
                </div>

                {/* Age */}
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    {isEn ? 'Age (years)' : isPl ? 'Wiek (lat)' : 'Возраст (лет)'}
                  </label>
                  <input
                    type="number"
                    min="12"
                    max="100"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full min-h-[40px] px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-semibold"
                  />
                </div>

                {/* Weight */}
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    {isEn ? 'Weight (kg)' : isPl ? 'Waga (kg)' : 'Вес (кг)'}
                  </label>
                  <input
                    type="number"
                    min="30"
                    max="250"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full min-h-[40px] px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-semibold"
                  />
                </div>

                {/* Height */}
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    {isEn ? 'Height (cm)' : isPl ? 'Wzrost (cm)' : 'Рост (см)'}
                  </label>
                  <input
                    type="number"
                    min="120"
                    max="230"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    className="w-full min-h-[40px] px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-semibold"
                  />
                </div>
              </div>

              {/* Activity & Goal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="space-y-2">
                  <label className="block text-[11px] text-slate-400 mb-1 flex items-center gap-1">
                    <Activity className="w-3 h-3" />{' '}
                    {isEn ? 'Activity level' : isPl ? 'Poziom aktywności' : 'Уровень активности'}
                  </label>
                  <select
                    value={activity}
                    onChange={(e) => setActivity(e.target.value as ActivityLevel)}
                    className="w-full min-h-[40px] px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-medium"
                  >
                    {(Object.keys(PRESET_ACTIVITIES) as Array<Exclude<ActivityLevel, 'custom'>>).map(
                      (lvl) => (
                        <option key={lvl} value={lvl}>
                          {PRESET_ACTIVITIES[lvl].label} — {PRESET_ACTIVITIES[lvl].desc}
                        </option>
                      )
                    )}
                    <option value="custom">
                      {isEn
                        ? 'Custom activity (type below)'
                        : isPl
                        ? 'Własna aktywność (wpisz poniżej)'
                        : 'Своя активность (вписать вручную)'}
                    </option>
                  </select>

                  {/* Empty line where user can type ANY activity for AI calculation */}
                  <div>
                    <input
                      type="text"
                      value={customActivity}
                      onChange={(e) => {
                        setCustomActivity(e.target.value);
                        if (e.target.value.trim().length > 0 && activity !== 'custom') {
                          setActivity('custom');
                        }
                      }}
                      placeholder={
                        isEn
                          ? 'Or type your own activity here (any activity for AI)...'
                          : isPl
                          ? 'Lub wpisz tutaj własną aktywność dla AI...'
                          : 'Или впишите сюда свою активность (любая активность для ИИ)...'
                      }
                      className="w-full min-h-[40px] px-3 py-2 rounded-xl bg-slate-900 border border-purple-500/40 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-purple-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1 flex items-center gap-1">
                    <Target className="w-3 h-3" />{' '}
                    {isEn ? 'Your goal' : isPl ? 'Twój cel' : 'Ваша цель'}
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(Object.keys(GOAL_MODIFIERS) as GoalType[]).map((gKey) => (
                      <button
                        key={gKey}
                        type="button"
                        onClick={() => handleSelectGoalMode(gKey)}
                        className={`min-h-[40px] py-2 px-2 rounded-xl border text-[11px] font-semibold transition ${
                          goal === gKey
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {GOAL_MODIFIERS[gKey].shortLabel}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {aiError && (
                <div className="p-2.5 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{aiError}</span>
                </div>
              )}

              {aiNote && (
                <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-200 text-xs">
                  {aiNote}
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={isAiCalculating}
                  onClick={handleCalculateWithAi}
                  className="w-full sm:w-auto min-h-[42px] px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-60 shadow-md flex items-center justify-center gap-2 transition active:scale-95"
                >
                  {isAiCalculating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>
                        {isEn
                          ? 'AI is calculating...'
                          : isPl
                          ? 'AI oblicza...'
                          : 'ИИ считает норму...'}
                      </span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-yellow-300" />
                      <span>
                        {isEn
                          ? 'Calculate norms with AI'
                          : isPl
                          ? 'Oblicz normę z AI'
                          : 'Рассчитать норму с помощью ИИ'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
