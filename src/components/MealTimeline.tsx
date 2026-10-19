import React from 'react';
import { UserConfig, LoggedFoodItem, MealCategoryConfig } from '../types/config';
import { ThemeStyles, getBorderRadiusClass } from '../utils/themeHelper';
import { DynamicIcon } from '../utils/iconHelper';
import { getNutrientColor } from '../utils/nutrientColors';
import { Plus, Trash2, UtensilsCrossed, ShieldCheck, ShoppingCart } from 'lucide-react';

interface MealTimelineProps {
  config: UserConfig;
  themeStyles: ThemeStyles;
  todayItems: LoggedFoodItem[];
  onOpenAddFoodModal: (preselectedCategoryId?: string) => void;
  onDeleteItem: (itemId: string) => void;
  onAddToShoppingList?: (item: { name: string; quantity?: string; foodId?: string }) => void;
}

export const MealTimeline: React.FC<MealTimelineProps> = ({
  config,
  themeStyles,
  todayItems,
  onOpenAddFoodModal,
  onDeleteItem,
  onAddToShoppingList,
}) => {
  const labels = config.language.labels;
  const radiusClass = getBorderRadiusClass(config.theme.borderRadius);

  // Daily calorie target for percentage calculations
  const calorieMetric = config.metrics.find((m) => m.id === 'calories') || config.metrics[0];
  const dailyCalorieTarget = calorieMetric ? calorieMetric.target : 2000;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className={`text-base font-bold ${themeStyles.textPrimary} flex items-center gap-2`}>
          <UtensilsCrossed className="w-4 h-4 text-emerald-400" />
          <span>{config.language.code === 'ru' ? 'Дневник приемов пищи' : 'Meal Diary'}</span>
        </h3>
        <span className="text-xs text-slate-400">
          {todayItems.length} {config.language.code === 'ru' ? 'записей' : 'entries'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {config.mealCategories.map((category: MealCategoryConfig) => {
          const itemsInCat = todayItems.filter((i) => i.mealCategoryId === category.id);

          // Subtotals for this meal
          const totalCalories = Math.round(
            itemsInCat.reduce((sum, item) => sum + (item.nutrients['calories'] || 0), 0)
          );
          const totalProtein = Math.round(
            itemsInCat.reduce((sum, item) => sum + (item.nutrients['proteins'] || 0), 0)
          );
          const totalFat = Math.round(
            itemsInCat.reduce((sum, item) => sum + (item.nutrients['fats'] || 0), 0)
          );
          const totalCarbs = Math.round(
            itemsInCat.reduce((sum, item) => sum + (item.nutrients['carbs'] || 0), 0)
          );

          const targetCalories = category.targetCaloriesPercent
            ? Math.round((dailyCalorieTarget * category.targetCaloriesPercent) / 100)
            : null;

          return (
            <div
              key={category.id}
              className={`border ${themeStyles.borderColor} ${themeStyles.cardBg} ${radiusClass} p-4 shadow-sm flex flex-col justify-between transition-all`}
            >
              <div>
                {/* Category Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-xs"
                      style={{ backgroundColor: `${config.theme.accentColor}30`, color: config.theme.accentColor }}
                    >
                      <DynamicIcon name={category.icon} className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className={`text-sm font-bold ${themeStyles.textPrimary} flex items-center gap-1.5`}>
                        <span>{category.name}</span>
                        {category.isProtected && (
                          <span title="Базовый приём пищи (защищён от удаления)">
                            <ShieldCheck className="w-3 h-3 text-emerald-400/80" />
                          </span>
                        )}
                      </h4>
                      {targetCalories && (
                        <div className="text-[10px] text-slate-400">
                          {config.language.code === 'ru' ? 'Цель:' : 'Target:'} ~{targetCalories} ккал ({category.targetCaloriesPercent}%)
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Meal Calorie Subtotal */}
                  <div className="text-right">
                    <div
                      className="text-sm font-black transition-colors"
                      style={{ color: getNutrientColor('calories', config.metrics, '#f97316') }}
                    >
                      {totalCalories} ккал
                    </div>
                    <div className="text-[10px] text-slate-400 space-x-1.5 font-mono">
                      <span style={{ color: getNutrientColor('proteins', config.metrics, '#3b82f6') }} className="font-semibold">
                        Б: {totalProtein}г
                      </span>
                      <span style={{ color: getNutrientColor('fats', config.metrics, '#eab308') }} className="font-semibold">
                        Ж: {totalFat}г
                      </span>
                      <span style={{ color: getNutrientColor('carbs', config.metrics, '#ef4444') }} className="font-semibold">
                        У: {totalCarbs}г
                      </span>
                    </div>
                  </div>
                </div>

                {/* Items List */}
                <div className="mt-3 space-y-2">
                  {itemsInCat.length === 0 ? (
                    <div className="py-4 text-center text-xs text-slate-500 italic">
                      {config.language.code === 'ru' ? 'Ничего не записано' : 'No items logged yet'}
                    </div>
                  ) : (
                    itemsInCat.map((item) => (
                      <div
                        key={item.id}
                        className="group flex items-center justify-between p-2 rounded-xl bg-slate-800/30 hover:bg-slate-800/60 border border-slate-800/50 transition"
                      >
                        <div className="flex-1 min-w-0 pr-2">
                          <div className="flex items-baseline gap-2">
                            <span className="text-xs font-semibold text-slate-200 truncate">
                              {item.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono shrink-0">
                              {item.amountGrams} г
                            </span>
                          </div>

                          <div className="flex items-center gap-2 mt-0.5 text-[10px] font-mono text-slate-400">
                            <span
                              className="font-bold transition-colors"
                              style={{ color: getNutrientColor('calories', config.metrics, '#f97316') }}
                            >
                              {Math.round(item.nutrients['calories'] || 0)} ккал
                            </span>
                            {item.nutrients['proteins'] !== undefined && (
                              <span style={{ color: getNutrientColor('proteins', config.metrics, '#3b82f6') }}>
                                Б:{Math.round(item.nutrients['proteins'])}г
                              </span>
                            )}
                            {item.nutrients['fats'] !== undefined && (
                              <span style={{ color: getNutrientColor('fats', config.metrics, '#eab308') }}>
                                Ж:{Math.round(item.nutrients['fats'])}г
                              </span>
                            )}
                            {item.nutrients['carbs'] !== undefined && (
                              <span style={{ color: getNutrientColor('carbs', config.metrics, '#ef4444') }}>
                                У:{Math.round(item.nutrients['carbs'])}г
                              </span>
                            )}
                            {item.nutrients['fiber'] !== undefined && (
                              <span style={{ color: getNutrientColor('fiber', config.metrics, '#22c55e') }}>
                                Кл:{Math.round(item.nutrients['fiber'])}г
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {onAddToShoppingList && (
                            <button
                              type="button"
                              onClick={() =>
                                onAddToShoppingList({
                                  name: item.name,
                                  quantity: `${item.amountGrams} г`,
                                })
                              }
                              className="p-1.5 rounded-lg text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/15 transition active:scale-90"
                              title="Добавить в список покупок"
                            >
                              <ShoppingCart className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => onDeleteItem(item.id)}
                            className="opacity-60 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition active:scale-90"
                            title={labels.delete}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Add Food Button for this category */}
              <div className="mt-3 pt-2 border-t border-slate-800/60">
                <button
                  onClick={() => onOpenAddFoodModal(category.id)}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl border border-dashed border-slate-700 hover:border-emerald-500 hover:bg-emerald-500/10 text-xs font-medium text-slate-300 hover:text-emerald-300 transition active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{labels.addFood}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
