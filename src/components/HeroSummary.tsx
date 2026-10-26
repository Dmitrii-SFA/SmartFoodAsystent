import React from 'react';
import { UserConfig, LoggedFoodItem, MetricConfig } from '../types/config';
import { ThemeStyles, getBorderRadiusClass } from '../utils/themeHelper';
import { DynamicIcon } from '../utils/iconHelper';
import { Plus, CheckCircle2, AlertTriangle, Droplets } from 'lucide-react';

interface HeroSummaryProps {
  config: UserConfig;
  themeStyles: ThemeStyles;
  todayItems: LoggedFoodItem[];
  waterMl: number;
  onAddWater: (amountMl: number) => void;
  onOpenAddFoodModal: () => void;
}

export const HeroSummary: React.FC<HeroSummaryProps> = ({
  config,
  themeStyles,
  todayItems,
  waterMl,
  onAddWater,
  onOpenAddFoodModal,
}) => {
  const labels = config.language.labels;
  const radiusClass = getBorderRadiusClass(config.theme.borderRadius);

  // Calculate consumed totals per metric id
  const consumedTotals: Record<string, number> = {};

  // Initialize with water if present
  consumedTotals['water'] = waterMl;

  todayItems.forEach((item) => {
    Object.entries(item.nutrients || {}).forEach(([metricId, value]) => {
      consumedTotals[metricId] = (consumedTotals[metricId] || 0) + (Number(value) || 0);
    });
  });

  // Find primary calorie metric (default to first energy metric or 'calories')
  const calorieMetric =
    config.metrics.find((m) => m.id === 'calories' || m.category === 'energy') || config.metrics[0];

  const calorieTarget = calorieMetric ? calorieMetric.target : 2000;
  const calorieConsumed = Math.round(consumedTotals[calorieMetric?.id || 'calories'] || 0);
  const calorieRemaining = Math.max(0, calorieTarget - calorieConsumed);
  const caloriePercent = Math.min(100, Math.round((calorieConsumed / Math.max(1, calorieTarget)) * 100));
  const isCalorieExceeded = calorieConsumed > calorieTarget;

  const goalMode = config.goalMode || 'maintain';

  const getHighlightState = (current: number, target: number): 'red' | 'green' | 'neutral' => {
    if (goalMode === 'lose') {
      return current > target ? 'red' : 'green';
    }
    if (goalMode === 'gain') {
      return current < target ? 'red' : 'green';
    }
    return 'neutral';
  };

  const calorieHighlight = getHighlightState(calorieConsumed, calorieTarget);
  const calorieBaseColor = calorieMetric?.color || config.theme.accentColor;

  // SVG Gauge calculations
  const radius = 68;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, caloriePercent) / 100) * circumference;

  // Filter summary metrics (all with showInSummary: true except the primary calorie gauge)
  const summaryMetrics = config.metrics.filter(
    (m) => m.showInSummary && m.id !== (calorieMetric?.id || 'calories')
  );

  return (
    <div
      className={`border ${themeStyles.borderColor} ${themeStyles.cardBg} ${radiusClass} p-5 shadow-lg transition-all duration-200`}
    >
      <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
        {/* Main Calorie Ring Gauge */}
        <div className="flex items-center gap-6 w-full lg:w-auto justify-center lg:justify-start">
          <div className="relative w-40 h-40 flex items-center justify-center shrink-0">
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 160 160">
              {/* Background circle */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                className="stroke-slate-800/60 dark:stroke-slate-800"
                strokeWidth="12"
                fill="transparent"
              />
              {/* Progress ring */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                stroke={calorieBaseColor}
                strokeWidth="12"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-700 ease-out"
              />
            </svg>

            {/* Inner Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
              <DynamicIcon
                name={calorieMetric?.icon || 'Flame'}
                className="w-5 h-5 mb-0.5"
                style={{ color: calorieMetric?.color || '#f59e0b' }}
              />
              <span
                className="text-2xl font-black tracking-tight transition-colors"
                style={{
                  color:
                    calorieHighlight === 'red'
                      ? '#f87171'
                      : calorieHighlight === 'green'
                      ? '#34d399'
                      : undefined,
                }}
              >
                {calorieConsumed}
              </span>
              <span className={`text-[10px] font-semibold uppercase tracking-wider ${themeStyles.textMuted}`}>
                / {calorieTarget} {calorieMetric?.unit || 'ккал'}
              </span>
              <span
                className={`mt-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  calorieHighlight === 'red'
                    ? 'bg-red-500/20 text-red-400'
                    : calorieHighlight === 'green'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                {caloriePercent}%
              </span>
            </div>
          </div>

          {/* Calorie Stats Breakdown */}
          <div className="space-y-2">
            <div>
              <div className="flex items-center gap-1.5">
                <span className={`text-xs font-medium uppercase tracking-wider ${themeStyles.textMuted}`}>
                  {labels.todaySummary}
                </span>
                {calorieConsumed >= calorieTarget && (
                  <span title="Цель достигнута">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  </span>
                )}
              </div>
              <h2 className={`text-xl font-extrabold ${themeStyles.textPrimary}`}>
                {calorieMetric?.label || 'Калории'}
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className={`p-2.5 rounded-xl border ${themeStyles.borderColor} bg-slate-800/40`}>
                <div className={`text-[10px] ${themeStyles.textMuted}`}>{labels.remaining}</div>
                <div className={`text-sm font-bold ${themeStyles.textPrimary}`}>
                  {isCalorieExceeded ? `+${calorieConsumed - calorieTarget}` : calorieRemaining} {calorieMetric?.unit}
                </div>
              </div>

              <div className={`p-2.5 rounded-xl border ${themeStyles.borderColor} bg-slate-800/40`}>
                <div className={`text-[10px] ${themeStyles.textMuted}`}>{labels.dailyGoal}</div>
                <div className={`text-sm font-bold ${themeStyles.textPrimary}`}>
                  {calorieTarget} {calorieMetric?.unit}
                </div>
              </div>
            </div>

            <button
              onClick={onOpenAddFoodModal}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl text-white shadow-md transition active:scale-95 hover:opacity-95"
              style={{ backgroundColor: config.theme.accentColor }}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{labels.addFood}</span>
            </button>
          </div>
        </div>

        {/* Dynamic Summary Cards for Configured Metrics */}
        <div className="w-full lg:flex-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
          {summaryMetrics.map((metric: MetricConfig) => {
            const consumed = Math.round(consumedTotals[metric.id] || 0);
            const target = metric.target;
            const rawPercent = Math.round((consumed / Math.max(1, target)) * 100);
            const percent = Math.min(100, rawPercent);
            const mHighlight = getHighlightState(consumed, target);

            return (
              <div
                key={metric.id}
                className={`p-3 rounded-xl border ${themeStyles.borderColor} bg-slate-800/30 hover:bg-slate-800/60 transition relative overflow-hidden flex flex-col justify-between`}
              >
                {/* Metric Header */}
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <DynamicIcon
                      name={metric.icon}
                      className="w-3.5 h-3.5 shrink-0"
                      style={{ color: metric.color }}
                    />
                    <span
                      className={`text-xs font-semibold ${
                        metric.id === 'water' ? 'shrink-0 whitespace-nowrap' : 'truncate'
                      } ${themeStyles.textPrimary}`}
                      title={metric.label}
                    >
                      {metric.label}
                    </span>
                  </div>
                  <span
                    className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded shrink-0"
                    style={
                      mHighlight === 'red'
                        ? {
                            backgroundColor: 'rgba(239, 68, 68, 0.16)',
                            color: '#fca5a5',
                          }
                        : mHighlight === 'green'
                        ? {
                            backgroundColor: 'rgba(16, 185, 129, 0.16)',
                            color: '#6ee7b7',
                          }
                        : {
                            color: metric.color,
                          }
                    }
                  >
                    {rawPercent}%
                  </span>
                </div>

                {/* Values */}
                <div className="my-1">
                  <div className="flex items-baseline gap-1">
                    <span
                      className="text-base font-bold tracking-tight"
                      style={{
                        color:
                          mHighlight === 'red'
                            ? '#f87171'
                            : mHighlight === 'green'
                            ? '#34d399'
                            : metric.color,
                      }}
                    >
                      {consumed}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      / {target} {metric.unit}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden mt-1">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${percent}%`,
                      backgroundColor: metric.color,
                    }}
                  />
                </div>

                {/* Special Quick Action for Water */}
                {metric.id === 'water' && (
                  <div className="mt-2 pt-1 border-t border-slate-800/80 flex items-center justify-between gap-1">
                    <span className="text-[10px] text-cyan-400 font-medium truncate">Стакан воды</span>
                    <button
                      onClick={() => onAddWater(250)}
                      className="flex items-center gap-0.5 px-2 py-0.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-[10px] font-bold transition active:scale-90 shrink-0"
                      title="+250 мл"
                    >
                      <Plus className="w-2.5 h-2.5" />
                      250
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
