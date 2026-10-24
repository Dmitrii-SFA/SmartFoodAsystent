import React, { useState } from 'react';
import { MealCategoryConfig, FoodItem, MetricConfig, LocalizationLabels } from '../types/config';
import { ThemeStyles, getBorderRadiusClass } from '../utils/themeHelper';
import { getUITranslations } from '../utils/translations';
import { getNutrientColor } from '../utils/nutrientColors';
import {
  FOOD_ICON_PRESETS,
  MEDICINE_ICON_PRESETS,
  MealCategoryIcon,
  getMealCategoryIconText,
} from '../utils/iconHelper';
import { unlockMobileAudio } from '../utils/soundEngine';
import {
  Plus,
  Trash2,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Utensils,
  X,
  ShoppingCart,
  Share2,
  Check,
  Clock,
  Bell,
  BellOff,
  Pill,
} from 'lucide-react';
import { DeleteConfirmModal } from './DeleteConfirmModal';

interface ReorderableMealTimelineProps {
  categories: MealCategoryConfig[];
  todayItems: FoodItem[];
  dailyCalorieTarget: number;
  metrics?: MetricConfig[];
  themeStyles: ThemeStyles;
  accentColor: string;
  borderRadius: string;
  langCode?: string;
  labels?: Partial<LocalizationLabels>;
  currentDateStr?: string;
  waterMl?: number;
  onShareDailyMenu?: () => void;
  onReorderCategories: (newCategories: MealCategoryConfig[]) => void;
  onAddCategory: (newCategory: MealCategoryConfig) => void;
  onDeleteCategory?: (categoryId: string) => void;
  onOpenAddFoodModal: (categoryId: string) => void;
  onDeleteItem: (itemId: string) => void;
  onAddToShoppingList?: (item: { name: string; quantity?: string; foodId?: string }) => void;
  onNavigateToMealSettings?: () => void;
}

export const ReorderableMealTimeline: React.FC<ReorderableMealTimelineProps> = ({
  categories,
  todayItems,
  dailyCalorieTarget,
  metrics,
  themeStyles,
  accentColor,
  borderRadius,
  langCode = 'ru',
  labels,
  currentDateStr,
  waterMl = 0,
  onShareDailyMenu,
  onReorderCategories,
  onAddCategory,
  onDeleteCategory,
  onOpenAddFoodModal,
  onDeleteItem,
  onAddToShoppingList,
}) => {
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [sharedCopied, setSharedCopied] = useState(false);

  // Quick time & reminder editor per card
  const [editingTimeCatId, setEditingTimeCatId] = useState<string | null>(null);

  // Add Meal Modal State (time is empty by default as requested)
  const [showAddMealModal, setShowAddMealModal] = useState(false);
  const [newMealLabel, setNewMealLabel] = useState('');
  const [newMealIcon, setNewMealIcon] = useState('🥗');
  const [newMealRatio, setNewMealRatio] = useState('15');
  const [newMealTime, setNewMealTime] = useState('');
  const [newMealReminder, setNewMealReminder] = useState(false);

  // Delete Confirmation Modal State
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    type: 'category' | 'food';
    id: string;
    name: string;
  }>({
    isOpen: false,
    type: 'food',
    id: '',
    name: '',
  });

  const radiusClass = getBorderRadiusClass(borderRadius);
  const t = getUITranslations(langCode, labels);
  const c = (langCode || 'ru').toLowerCase();
  const isEn = c.startsWith('en');
  const isPl = c.startsWith('pl');
  const locKey: 'ru' | 'en' | 'pl' = isEn ? 'en' : isPl ? 'pl' : 'ru';

  const getCategoryName = (cat: MealCategoryConfig) =>
    cat.name || (cat as any).label || cat.id;

  const getCategoryTargetPercent = (cat: MealCategoryConfig) => {
    if (typeof cat.targetCaloriesPercent === 'number') return cat.targetCaloriesPercent;
    if (typeof (cat as any).targetCalorieRatio === 'number') {
      return Math.round((cat as any).targetCalorieRatio * 100);
    }
    return 25;
  };

  const sortedCategories = [...(categories || [])].filter(
    (cItem) => (cItem as any).visible !== false
  );

  const requestNotificationPermissionIfNeeded = () => {
    unlockMobileAudio();
    if (
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'default'
    ) {
      Notification.requestPermission().catch(() => {});
    }
  };

  const updateCategoryTimeAndReminder = (
    catId: string,
    nextTime: string | undefined,
    nextReminder: boolean
  ) => {
    if (nextReminder) {
      requestNotificationPermissionIfNeeded();
    }
    const updated = (categories || []).map((cat) =>
      cat.id === catId
        ? {
            ...cat,
            time: nextTime && nextTime.trim() ? nextTime.trim() : undefined,
            reminderEnabled: Boolean(nextTime && nextTime.trim() && nextReminder),
          }
        : cat
    );
    onReorderCategories(updated);
  };

  const moveCategory = (index: number, direction: -1 | 1) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= sortedCategories.length) return;
    const updated = [...sortedCategories];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIdx, 0, moved);
    onReorderCategories(updated);
  };

  const handleDragStart = (idx: number) => {
    setDraggedIdx(idx);
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragOverIdx !== idx) {
      setDragOverIdx(idx);
    }
  };

  const handleDrop = (idx: number) => {
    if (draggedIdx === null || draggedIdx === idx) {
      setDraggedIdx(null);
      setDragOverIdx(null);
      return;
    }
    const updated = [...sortedCategories];
    const [moved] = updated.splice(draggedIdx, 1);
    updated.splice(idx, 0, moved);
    onReorderCategories(updated);
    setDraggedIdx(null);
    setDragOverIdx(null);
  };

  const handleCreateMealCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMealLabel.trim()) return;
    const pct = Math.min(100, Math.max(5, Number(newMealRatio) || 15));
    const cleanTime = newMealTime.trim() ? newMealTime.trim() : undefined;
    const reminderActive = Boolean(cleanTime && newMealReminder);
    if (reminderActive) {
      requestNotificationPermissionIfNeeded();
    }
    const newCat: MealCategoryConfig = {
      id: `meal_${Date.now()}`,
      name: newMealLabel.trim(),
      icon: newMealIcon || '🍽️',
      targetCaloriesPercent: pct,
      time: cleanTime,
      reminderEnabled: reminderActive,
    };
    onAddCategory(newCat);
    setNewMealLabel('');
    setNewMealTime('');
    setNewMealReminder(false);
    setShowAddMealModal(false);
  };

  const handleShareCurrentDayMenu = async () => {
    const dateKey = currentDateStr || new Date().toISOString().split('T')[0];
    const payload = {
      type: 'pwa_calorie_share_v1',
      exportedAt: new Date().toISOString(),
      dayLogs: {
        [dateKey]: {
          date: dateKey,
          waterMl: waterMl || 0,
          items: todayItems || [],
          customDayCategories: categories,
        },
      },
    };
    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      setSharedCopied(true);
      setTimeout(() => setSharedCopied(false), 2500);
    } catch {
      // ignore clipboard fallback
    }
    if (onShareDailyMenu) {
      onShareDailyMenu();
    }
  };

  const shareMenuTitle = isEn
    ? 'Share daily menu (copy code)'
    : isPl
    ? 'Udostępnij dzienne menu (skopiuj kod)'
    : 'Поделиться дневным меню (скопировать код)';

  return (
    <div className="space-y-3">
      {/* Section Header */}
      <div className="flex items-center justify-between px-1 gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <h3 className={`text-sm font-bold tracking-tight ${themeStyles.textPrimary}`}>
            {t.mealsTimelineTitle}
          </h3>
          <span className="text-[11px] text-slate-500 hidden sm:inline">
            ({t.dragMealHint})
          </span>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {sortedCategories.map((category, idx) => {
          const items = todayItems.filter((item) => item.mealCategoryId === category.id);
          const categoryCalories = Math.round(
            items.reduce((sum, item) => sum + (item.nutrients['calories'] || 0), 0)
          );
          const categoryProteins = Math.round(
            items.reduce((sum, item) => sum + (item.nutrients['proteins'] || 0), 0)
          );
          const categoryFats = Math.round(
            items.reduce((sum, item) => sum + (item.nutrients['fats'] || 0), 0)
          );
          const categoryCarbs = Math.round(
            items.reduce((sum, item) => sum + (item.nutrients['carbs'] || 0), 0)
          );
          const targetCategoryCalories = Math.round(
            dailyCalorieTarget * (getCategoryTargetPercent(category) / 100)
          );
          const progressPct = Math.min(
            100,
            Math.round((categoryCalories / Math.max(1, targetCategoryCalories)) * 100)
          );

          const isBeingDragged = draggedIdx === idx;
          const isDragOver = dragOverIdx === idx;
          const catName = getCategoryName(category);
          const hasTime = Boolean(category.time && category.time.trim());
          const isReminderOn = Boolean(hasTime && category.reminderEnabled);
          const isTimeEditorOpen = editingTimeCatId === category.id;

          return (
            <div
              key={category.id}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDrop={() => handleDrop(idx)}
              onDragEnd={() => {
                setDraggedIdx(null);
                setDragOverIdx(null);
              }}
              className={`border ${themeStyles.borderColor} ${themeStyles.cardBg} ${radiusClass} p-3.5 shadow-sm flex flex-col justify-between transition-all overflow-hidden ${
                isBeingDragged ? 'opacity-50 scale-[0.99]' : ''
              } ${isDragOver ? 'ring-2 ring-emerald-500/70' : ''}`}
            >
              <div>
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {/* Drag Handle */}
                    <div
                      className="cursor-grab active:cursor-grabbing text-slate-500 hover:text-slate-300 p-0.5 shrink-0"
                      title={t.dragMealHint}
                    >
                      <GripVertical className="w-4 h-4" />
                    </div>
                    <span className="text-xl flex items-center justify-center w-6 h-6 select-none shrink-0">
                      <MealCategoryIcon icon={category.icon} className="w-5 h-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4
                          className={`text-sm font-bold leading-tight truncate ${themeStyles.textPrimary}`}
                        >
                          {catName}
                        </h4>
                        {/* Quick Time & Reminder Button in Card Header */}
                        <button
                          type="button"
                          onClick={() =>
                            setEditingTimeCatId((prev) =>
                              prev === category.id ? null : category.id
                            )
                          }
                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-[11px] font-mono tabular-nums border transition shrink-0 ${
                            hasTime
                              ? isReminderOn
                                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 font-semibold'
                                : 'bg-slate-800/90 border-slate-700 text-slate-200'
                              : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                          }`}
                          title={
                            isEn
                              ? 'Set meal time & sound reminder'
                              : isPl
                              ? 'Ustaw godzinę posiłku i przypomnienie dźwiękowe'
                              : 'Установить время и звуковое напоминание'
                          }
                        >
                          {hasTime ? (
                            <>
                              <Clock className="w-3 h-3 shrink-0" />
                              <span>{category.time}</span>
                              {isReminderOn && (
                                <Bell className="w-3 h-3 text-amber-400 shrink-0" />
                              )}
                            </>
                          ) : (
                            <Clock className="w-3.5 h-3.5 shrink-0" />
                          )}
                        </button>
                      </div>
                      <p className={`text-[11px] font-mono tabular-nums ${themeStyles.textSecondary}`}>
                        <span
                          className="font-semibold"
                          style={{ color: getNutrientColor('calories', metrics, '#f97316') }}
                        >
                          {categoryCalories}
                        </span>{' '}
                        / {targetCategoryCalories} {t.kcalShort}
                      </p>
                    </div>
                  </div>

                  {/* Right Actions: Up/Down arrows + Delete + Add Food */}
                  <div className="flex items-center gap-1 shrink-0 ml-auto">
                    <div className="flex items-center bg-slate-900/70 rounded-lg border border-slate-800 p-0.5">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => moveCategory(idx, -1)}
                        className="p-1 text-slate-400 hover:text-white disabled:opacity-30 transition"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === sortedCategories.length - 1}
                        onClick={() => moveCategory(idx, 1)}
                        className="p-1 text-slate-400 hover:text-white disabled:opacity-30 transition"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {onDeleteCategory && (
                      <button
                        type="button"
                        onClick={() =>
                          setDeleteConfirm({
                            isOpen: true,
                            type: 'category',
                            id: category.id,
                            name: `${getMealCategoryIconText(category.icon)} ${catName}`,
                          })
                        }
                        className="p-1.5 rounded-lg bg-slate-900/70 border border-slate-800 text-slate-400 hover:text-red-400 hover:border-red-500/40 transition"
                        title={t.deleteMealConfirmTitle}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      onClick={() => onOpenAddFoodModal(category.id)}
                      className="min-h-[34px] flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-xl text-white shadow-xs transition active:scale-95"
                      style={{ backgroundColor: accentColor }}
                    >
                      <Plus className="w-3.5 h-3.5 shrink-0" />
                      <span className="hidden sm:inline">{t.addFood}</span>
                    </button>
                  </div>
                </div>

                {/* Quick Inline Time & Reminder Popover Panel */}
                {isTimeEditorOpen && (
                  <div className="mb-2.5 p-2.5 rounded-xl bg-slate-900/90 border border-slate-700/90 space-y-2 text-xs animate-in fade-in duration-150">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>
                          {isEn
                            ? 'Meal time & reminder'
                            : isPl
                            ? 'Godzina i przypomnienie'
                            : 'Время и напоминание'}
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setEditingTimeCatId(null)}
                        className="p-1 rounded-lg text-slate-400 hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="time"
                        value={category.time || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateCategoryTimeAndReminder(
                            category.id,
                            val || undefined,
                            val ? (category.reminderEnabled ?? true) : false
                          );
                        }}
                        className="min-h-[36px] px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono text-xs"
                      />

                      <button
                        type="button"
                        disabled={!hasTime}
                        onClick={() =>
                          updateCategoryTimeAndReminder(
                            category.id,
                            category.time,
                            !isReminderOn
                          )
                        }
                        className={`min-h-[36px] px-2.5 py-1 rounded-lg border font-semibold flex items-center gap-1.5 transition disabled:opacity-40 ${
                          isReminderOn
                            ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                            : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                        }`}
                      >
                        {isReminderOn ? (
                          <>
                            <Bell className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span>
                              {isEn
                                ? 'Reminder ON'
                                : isPl
                                ? 'Przypomnienie WŁ.'
                                : 'Напоминание ВКЛ'}
                            </span>
                          </>
                        ) : (
                          <>
                            <BellOff className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>
                              {isEn
                                ? 'Reminder OFF'
                                : isPl
                                ? 'Przypomnienie WYŁ.'
                                : 'Напоминание ВЫКЛ'}
                            </span>
                          </>
                        )}
                      </button>

                      {hasTime && (
                        <button
                          type="button"
                          onClick={() =>
                            updateCategoryTimeAndReminder(category.id, undefined, false)
                          }
                          className="min-h-[36px] px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-red-950/40 border border-slate-700 hover:border-red-500/40 text-slate-300 hover:text-red-300 transition"
                        >
                          {isEn ? 'Clear time' : isPl ? 'Usuń godzinę' : 'Убрать время'}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Mini Progress Bar + P/F/C Summary */}
                <div className="space-y-1.5 mb-2.5">
                  <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${progressPct}%`, backgroundColor: accentColor }}
                    />
                  </div>
                  {items.length > 0 && (
                    <div className="flex items-center justify-between text-[10px] text-slate-400 px-0.5 font-mono tabular-nums">
                      <span>
                        <b style={{ color: getNutrientColor('proteins', metrics, '#3b82f6') }}>
                          {t.protShort}: {categoryProteins}{t.gramsShort}
                        </b>{' '}
                        •{' '}
                        <b style={{ color: getNutrientColor('fats', metrics, '#eab308') }}>
                          {t.fatShort}: {categoryFats}{t.gramsShort}
                        </b>{' '}
                        •{' '}
                        <b style={{ color: getNutrientColor('carbs', metrics, '#ef4444') }}>
                          {t.carbShort}: {categoryCarbs}{t.gramsShort}
                        </b>
                      </span>
                      <span>
                        {progressPct}% {t.ofNormShort}
                      </span>
                    </div>
                  )}
                </div>

                {/* Items List */}
                {items.length === 0 ? (
                  <div
                    onClick={() => onOpenAddFoodModal(category.id)}
                    className="py-3 text-center border border-dashed border-slate-800 hover:border-slate-700 rounded-xl cursor-pointer transition"
                  >
                    <p className={`text-xs ${themeStyles.textSecondary} opacity-60`}>
                      {t.noEntries} — <span className="underline">{t.add.toLowerCase()}</span>
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-1.5">
                    {items.map((item) => {
                      const cal = Math.round(item.nutrients['calories'] || 0);
                      const prot = Math.round(item.nutrients['proteins'] || 0);
                      const fat = Math.round(item.nutrients['fats'] || 0);
                      const carb = Math.round(item.nutrients['carbs'] || 0);

                      return (
                        <li
                          key={item.id}
                          className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition text-xs"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className={`font-medium truncate ${themeStyles.textPrimary}`}>
                                {item.name}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 shrink-0">
                                {item.amountGrams} {t.gramsShort}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5 font-mono tabular-nums flex-wrap">
                              <span
                                className="font-semibold"
                                style={{ color: getNutrientColor('calories', metrics, '#f97316') }}
                              >
                                {cal} {t.kcalShort}
                              </span>
                              <span>•</span>
                              <span>
                                <span
                                  style={{ color: getNutrientColor('proteins', metrics, '#3b82f6') }}
                                  className="font-medium"
                                >
                                  {t.protShort}: {prot}{t.gramsShort}
                                </span>{' '}
                                •{' '}
                                <span
                                  style={{ color: getNutrientColor('fats', metrics, '#eab308') }}
                                  className="font-medium"
                                >
                                  {t.fatShort}: {fat}{t.gramsShort}
                                </span>{' '}
                                •{' '}
                                <span
                                  style={{ color: getNutrientColor('carbs', metrics, '#ef4444') }}
                                  className="font-medium"
                                >
                                  {t.carbShort}: {carb}{t.gramsShort}
                                </span>
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {onAddToShoppingList && (
                              <button
                                type="button"
                                onClick={() =>
                                  onAddToShoppingList({
                                    name: item.name,
                                    quantity: `${item.amountGrams} ${t.gramsShort}`,
                                  })
                                }
                                className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-emerald-950/30 transition"
                                title={t.addToShoppingList}
                              >
                                <ShoppingCart className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() =>
                                setDeleteConfirm({
                                  isOpen: true,
                                  type: 'food',
                                  id: item.id,
                                  name: `${item.name} (${item.amountGrams} ${t.gramsShort})`,
                                })
                              }
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-950/30 transition"
                              title={t.delete}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Inline Add Meal Category Form (rendered above the bottom button when open) */}
      {showAddMealModal && (
        <form
          onSubmit={handleCreateMealCategory}
          className={`border ${themeStyles.borderColor} ${themeStyles.cardBg} ${radiusClass} p-3.5 space-y-3 animate-in fade-in duration-150`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Utensils className="w-3.5 h-3.5 text-emerald-400" />
              {t.newMealCategoryTitle}
            </span>
            <button
              type="button"
              onClick={() => setShowAddMealModal(false)}
              className="p-1 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 text-xs">
            <div className="sm:col-span-5">
              <label className="block text-[11px] text-slate-400 mb-1">
                {t.mealCategoryNameLabel}
              </label>
              <input
                type="text"
                required
                placeholder={t.mealCategoryNamePlaceholder}
                value={newMealLabel}
                onChange={(e) => setNewMealLabel(e.target.value)}
                className="w-full min-h-[38px] px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] text-slate-400 mb-1">{t.calorieSharePct}</label>
              <input
                type="number"
                min="5"
                max="100"
                value={newMealRatio}
                onChange={(e) => setNewMealRatio(e.target.value)}
                className="w-full min-h-[38px] px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white"
              />
            </div>

            {/* Optional Time & Reminder controls */}
            <div className="sm:col-span-3">
              <label className="block text-[11px] text-slate-400 mb-1">
                {isEn
                  ? 'Time (optional)'
                  : isPl
                  ? 'Godzina (opcjonalnie)'
                  : 'Время (необязательно)'}
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="time"
                  value={newMealTime}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNewMealTime(val);
                    if (val && !newMealReminder) {
                      setNewMealReminder(true);
                    } else if (!val) {
                      setNewMealReminder(false);
                    }
                  }}
                  className="flex-1 min-h-[38px] px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-xs"
                />
                <button
                  type="button"
                  disabled={!newMealTime}
                  onClick={() => setNewMealReminder((prev) => !prev)}
                  className={`min-h-[38px] px-2.5 rounded-lg border flex items-center justify-center transition disabled:opacity-35 ${
                    newMealTime && newMealReminder
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                      : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                  title={
                    isEn
                      ? 'Sound reminder on phone'
                      : isPl
                      ? 'Przypomnienie dźwiękowe w telefonie'
                      : 'Звуковое напоминание на телефоне'
                  }
                >
                  {newMealTime && newMealReminder ? (
                    <Bell className="w-4 h-4 text-amber-400" />
                  ) : (
                    <BellOff className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="sm:col-span-2 flex items-end">
              <button
                type="submit"
                className="w-full min-h-[38px] py-1.5 px-3 rounded-lg font-bold text-white transition"
                style={{ backgroundColor: accentColor }}
              >
                {t.createButton}
              </button>
            </div>
          </div>

          {/* Quick Icon Selector: Food Icons + Medicine Icons */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-slate-400 mr-1">{t.iconLabel}</span>
              {FOOD_ICON_PRESETS.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setNewMealIcon(ic)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm border transition ${
                    newMealIcon === ic
                      ? 'bg-emerald-500/20 border-emerald-500 scale-105'
                      : 'bg-slate-900 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  {ic}
                </button>
              ))}
            </div>

            {/* Medicine & Supplement Icons Row (6 icons — fewer than the 10 food icons) */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-cyan-400 mr-1 flex items-center gap-1">
                <Pill className="w-3 h-3 shrink-0" />
                <span>
                  {isEn
                    ? 'Medications & supplements:'
                    : isPl
                    ? 'Leki i suplementy:'
                    : 'Лекарства и добавки:'}
                </span>
              </span>
              {MEDICINE_ICON_PRESETS.map((med) => (
                <button
                  key={med.id}
                  type="button"
                  onClick={() => setNewMealIcon(med.id)}
                  title={med.label[locKey]}
                  className={`h-8 px-2 rounded-lg flex items-center gap-1.5 text-[11px] border transition ${
                    newMealIcon === med.id
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 font-semibold scale-105'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <MealCategoryIcon icon={med.id} className="w-4 h-4" />
                  <span>{med.label[locKey]}</span>
                </button>
              ))}
            </div>
          </div>
        </form>
      )}

      {/* Bottom Row: Almost full-width Add Meal Category button + small square Share Daily Menu button */}
      <div className="flex items-stretch gap-2 pt-1">
        <button
          type="button"
          onClick={() => setShowAddMealModal((prev) => !prev)}
          className="flex-1 min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold border border-slate-700 bg-slate-800/90 hover:bg-slate-700 text-slate-100 transition active:scale-[0.99] shadow-xs"
        >
          <Plus className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{t.addMealCategory}</span>
        </button>

        <button
          type="button"
          onClick={handleShareCurrentDayMenu}
          className={`w-11 h-11 min-h-[44px] min-w-[44px] aspect-square rounded-xl border flex items-center justify-center transition active:scale-95 shrink-0 shadow-xs ${
            sharedCopied
              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
              : 'bg-slate-800/90 hover:bg-slate-700 border-slate-700 text-emerald-400 hover:text-white'
          }`}
          title={shareMenuTitle}
        >
          {sharedCopied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteConfirm.isOpen}
        title={
          deleteConfirm.type === 'category'
            ? t.deleteMealConfirmTitle
            : t.deleteFoodFromDiaryTitle
        }
        message={
          deleteConfirm.type === 'category'
            ? t.deleteMealConfirmMsg
            : t.deleteFoodFromDiaryMsg
        }
        itemName={deleteConfirm.name}
        confirmLabel={t.delete}
        cancelLabel={t.cancel}
        themeStyles={themeStyles}
        onCancel={() => setDeleteConfirm((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={() => {
          if (deleteConfirm.type === 'category' && onDeleteCategory) {
            onDeleteCategory(deleteConfirm.id);
          } else if (deleteConfirm.type === 'food') {
            onDeleteItem(deleteConfirm.id);
          }
          setDeleteConfirm((prev) => ({ ...prev, isOpen: false }));
        }}
      />
    </div>
  );
};
