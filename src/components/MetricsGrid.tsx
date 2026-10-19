import React, { useState } from 'react';
import { UserConfig, LoggedFoodItem, MetricConfig, MetricCategory } from '../types/config';
import { ThemeStyles, getBorderRadiusClass } from '../utils/themeHelper';
import { DynamicIcon } from '../utils/iconHelper';
import { Check, SlidersHorizontal, Plus, ShieldCheck } from 'lucide-react';

interface MetricsGridProps {
  config: UserConfig;
  themeStyles: ThemeStyles;
  todayItems: LoggedFoodItem[];
  waterMl: number;
  onQuickIncrement?: (metricId: string, amount: number) => void;
}

export const MetricsGrid: React.FC<MetricsGridProps> = ({
  config,
  themeStyles,
  todayItems,
  waterMl,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const radiusClass = getBorderRadiusClass(config.theme.borderRadius);

  // Compute totals
  const consumedTotals: Record<string, number> = {
    water: waterMl,
  };

  todayItems.forEach((item) => {
    Object.entries(item.nutrients || {}).forEach(([metricId, value]) => {
      consumedTotals[metricId] = (consumedTotals[metricId] || 0) + (Number(value) || 0);
    });
  });

  const allMetrics = config.metrics.filter((m) => m.showInDetailList);

  // Unique categories in the current config
  const availableCategories: { id: string; label: string }[] = [
    { id: 'all', label: config.language.code === 'ru' ? 'Все метрики' : 'All' },
    { id: 'macro', label: config.language.code === 'ru' ? 'КБЖУ' : 'Macros' },
    { id: 'fiber', label: config.language.code === 'ru' ? 'Клетчатка' : 'Fiber' },
    { id: 'vitamin', label: config.language.code === 'ru' ? 'Витамины' : 'Vitamins' },
    { id: 'mineral', label: config.language.code === 'ru' ? 'Минералы' : 'Minerals' },
    { id: 'hydration', label: config.language.code === 'ru' ? 'Вода' : 'Water' },
  ];

  const filteredMetrics = allMetrics.filter((m) => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'macro') return m.category === 'macro' || m.category === 'energy';
    return m.category === selectedCategory;
  });

  return (
    <div className={`border ${themeStyles.borderColor} ${themeStyles.cardBg} ${radiusClass} p-5 shadow-md`}>
      {/* Header and Category Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
          <h3 className={`text-base font-bold ${themeStyles.textPrimary}`}>
            {config.language.code === 'ru' ? 'Детальный профиль нутриентов' : 'Detailed Nutrient Breakdown'}
          </h3>
          <span className="text-xs text-slate-400 font-mono">({filteredMetrics.length})</span>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-900/60 border border-slate-800">
          {availableCategories.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition ${
                  isActive
                    ? 'bg-slate-700 text-white font-bold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {filteredMetrics.map((metric: MetricConfig) => {
          const consumed = Math.round(consumedTotals[metric.id] || 0);
          const target = metric.target;
          const percent = Math.min(150, Math.round((consumed / Math.max(1, target)) * 100));
          const isComplete = percent >= 100;

          return (
            <div
              key={metric.id}
              className={`p-3.5 rounded-xl border ${themeStyles.borderColor} bg-slate-800/25 hover:bg-slate-800/50 transition-all flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${metric.color}20`, color: metric.color }}
                    >
                      <DynamicIcon name={metric.icon} className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className={`text-xs font-bold leading-tight ${themeStyles.textPrimary}`}>
                        {metric.label}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {metric.category}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {metric.isProtected && (
                      <span className="text-[10px] text-slate-500 flex items-center gap-0.5" title="Базовый нутриент (защищён от удаления)">
                        <ShieldCheck className="w-3 h-3 text-emerald-400/80" />
                      </span>
                    )}
                    {isComplete && (
                      <span className="p-0.5 rounded-full bg-emerald-500/20 text-emerald-400" title="Норма выполнена">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-baseline justify-between mt-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-black text-white tracking-tight">
                      {consumed}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      / {target} {metric.unit}
                    </span>
                  </div>
                  <span
                    className={`text-xs font-bold font-mono ${
                      isComplete ? 'text-emerald-400' : 'text-slate-300'
                    }`}
                  >
                    {percent}%
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-2.5">
                <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, percent)}%`,
                      backgroundColor: percent > 115 ? '#f59e0b' : metric.color,
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
