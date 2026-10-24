import React, { useState } from 'react';
import { MealCategoryConfig, LocalizationLabels } from '../types/config';
import { ThemeStyles, getBorderRadiusClass } from '../utils/themeHelper';
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
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Utensils,
  GripVertical,
  ChevronDown,
  Clock,
  Bell,
  BellOff,
  Pill,
} from 'lucide-react';
import { DeleteConfirmModal } from './DeleteConfirmModal';

interface MealCategoriesManagerProps {
  categories: MealCategoryConfig[];
  themeStyles: ThemeStyles;
  accentColor: string;
  borderRadius: string;
  langCode?: string;
  labels?: Partial<LocalizationLabels>;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onUpdateCategories: (updated: MealCategoryConfig[], summary?: string) => void;
}

export const MealCategoriesManager: React.FC<MealCategoriesManagerProps> = ({
  categories,
  themeStyles,
  accentColor,
  borderRadius,
  langCode = 'ru',
  isCollapsed = false,
  onToggleCollapse,
  onUpdateCategories,
}) => {
  const [newLabel, setNewLabel] = useState('');
  const [newIcon, setNewIcon] = useState('🥗');
  const [newRatio, setNewRatio] = useState('15');
  const [newTime, setNewTime] = useState('');
  const [newReminder, setNewReminder] = useState(false);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [deleteCatModal, setDeleteCatModal] = useState<{
    isOpen: boolean;
    id: string;
    name: string;
  }>({
    isOpen: false,
    id: '',
    name: '',
  });

  const radiusClass = getBorderRadiusClass(borderRadius);
  const c = (langCode || 'ru').toLowerCase();
  const isEn = c.startsWith('en');
  const isPl = c.startsWith('pl');
  const locKey: 'ru' | 'en' | 'pl' = isEn ? 'en' : isPl ? 'pl' : 'ru';

  const sorted = [...(categories || [])];

  const requestNotificationIfNeeded = () => {
    unlockMobileAudio();
    if (
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'default'
    ) {
      Notification.requestPermission().catch(() => {});
    }
  };

  const handleToggleVisible = (id: string) => {
    const updated = sorted.map((cat) =>
      cat.id === id
        ? ({ ...cat, visible: (cat as any).visible === false } as MealCategoryConfig)
        : cat
    );
    onUpdateCategories(
      updated,
      isEn
        ? 'Meal category visibility updated'
        : isPl
        ? 'Widoczność posiłków zaktualizowana'
        : 'Видимость приёма пищи обновлена'
    );
  };

  const handleChangeField = (
    id: string,
    field: 'name' | 'icon' | 'targetCaloriesPercent' | 'time' | 'reminderEnabled',
    value: string | number | boolean | undefined
  ) => {
    if (field === 'reminderEnabled' && value === true) {
      requestNotificationIfNeeded();
    }
    const updated = sorted.map((cat) => (cat.id === id ? { ...cat, [field]: value } : cat));
    onUpdateCategories(
      updated,
      isEn
        ? 'Meal categories updated'
        : isPl
        ? 'Posiłki zaktualizowane'
        : 'Параметры приёма пищи обновлены'
    );
  };

  const handleUpdateTimeAndReminder = (
    id: string,
    timeVal: string | undefined,
    reminderVal: boolean
  ) => {
    if (reminderVal) {
      requestNotificationIfNeeded();
    }
    const updated = sorted.map((cat) =>
      cat.id === id
        ? {
            ...cat,
            time: timeVal && timeVal.trim() ? timeVal.trim() : undefined,
            reminderEnabled: Boolean(timeVal && timeVal.trim() && reminderVal),
          }
        : cat
    );
    onUpdateCategories(
      updated,
      isEn
        ? 'Meal time & reminder updated'
        : isPl
        ? 'Godzina i przypomnienie zaktualizowane'
        : 'Время и напоминание приёма пищи обновлены'
    );
  };

  const handleMove = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= sorted.length) return;
    const copy = [...sorted];
    const [moved] = copy.splice(idx, 1);
    copy.splice(target, 0, moved);
    onUpdateCategories(
      copy,
      isEn
        ? 'Meal order updated'
        : isPl
        ? 'Kolejność posiłków zmieniona'
        : 'Порядок приёмов пищи изменён'
    );
  };

  const handleDelete = (id: string) => {
    const filtered = sorted.filter((cat) => cat.id !== id);
    onUpdateCategories(
      filtered,
      isEn ? 'Meal category deleted' : isPl ? 'Posiłek usunięty' : 'Приём пищи удалён'
    );
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) return;
    const pct = Math.min(100, Math.max(5, Number(newRatio) || 15));
    const cleanTime = newTime.trim() ? newTime.trim() : undefined;
    const reminderActive = Boolean(cleanTime && newReminder);
    if (reminderActive) {
      requestNotificationIfNeeded();
    }
    const newCat: MealCategoryConfig = {
      id: `meal_${Date.now()}`,
      name: newLabel.trim(),
      icon: newIcon || '🍽️',
      targetCaloriesPercent: pct,
      time: cleanTime,
      reminderEnabled: reminderActive,
    };
    onUpdateCategories([...sorted, newCat], `+ ${newCat.name}`);
    setNewLabel('');
    setNewTime('');
    setNewReminder(false);
  };

  const visibleMealsCount = sorted.filter((cItem) => (cItem as any).visible !== false).length;

  return (
    <div
      id="meal-categories-settings-section"
      className={`border ${themeStyles.borderColor} ${themeStyles.cardBg} ${radiusClass} p-4 sm:p-5 shadow-sm transition-all ${
        isCollapsed ? 'space-y-0' : 'space-y-4'
      }`}
    >
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
            <Utensils className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <h3
              className={`text-sm sm:text-base font-bold leading-snug break-words ${themeStyles.textPrimary}`}
            >
              {isEn
                ? 'Meal Categories & Order'
                : isPl
                ? 'Zarządzanie posiłkami i kolejnością'
                : 'Управление приёмами пищи и очередностью'}
            </h3>
            <p className={`text-xs leading-relaxed break-words ${themeStyles.textSecondary}`}>
              {isEn
                ? 'Customize meal names, icons, optional time, reminders, and calorie distribution'
                : isPl
                ? 'Dostosuj nazwy, ikony, opcjonalną godzinę, przypomnienia i udział kalorii'
                : 'Настройте названия, иконки, необязательное время, напоминания и долю калорий'}
            </p>
            <div className="pt-1">
              <span className="inline-flex items-center text-[11px] font-mono tabular-nums px-2.5 py-0.5 rounded-lg bg-slate-800/90 border border-slate-700 text-slate-200 font-semibold">
                {isEn
                  ? `${visibleMealsCount} meals`
                  : isPl
                  ? `${visibleMealsCount} posiłki`
                  : `${visibleMealsCount} приёма пищи`}
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
          {/* Existing Categories List */}
          <div className="space-y-2">
            {sorted.map((cat, idx) => {
              const catName = cat.name || (cat as any).label || cat.id;
              const pct =
                typeof cat.targetCaloriesPercent === 'number'
                  ? cat.targetCaloriesPercent
                  : Math.round(((cat as any).targetCalorieRatio || 0.25) * 100);
              const isVisible = (cat as any).visible !== false;
              const hasTime = Boolean(cat.time && cat.time.trim());
              const isReminderOn = Boolean(hasTime && cat.reminderEnabled);

              return (
                <div
                  key={cat.id}
                  draggable
                  onDragStart={() => setDraggedIdx(idx)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (draggedIdx === null || draggedIdx === idx) return;
                    const copy = [...sorted];
                    const [moved] = copy.splice(draggedIdx, 1);
                    copy.splice(idx, 0, moved);
                    onUpdateCategories(
                      copy,
                      isEn
                        ? 'Order updated'
                        : isPl
                        ? 'Kolejność zmieniona'
                        : 'Порядок приёмов пищи изменён'
                    );
                    setDraggedIdx(null);
                  }}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-2.5 sm:p-3 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition text-xs overflow-hidden"
                >
                  <div className="flex items-center gap-2 w-full sm:flex-1 min-w-0">
                    <GripVertical className="w-4 h-4 text-slate-500 cursor-grab shrink-0" />
                    <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-800 border border-slate-700 shrink-0">
                      <MealCategoryIcon icon={cat.icon} className="w-5 h-5" />
                    </div>
                    <input
                      type="text"
                      value={catName}
                      onChange={(e) => handleChangeField(cat.id, 'name', e.target.value)}
                      className="flex-1 min-w-0 min-h-[36px] px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white font-semibold"
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between sm:justify-end gap-1.5 w-full sm:w-auto min-w-0">
                    {/* Optional Time + Sound Reminder */}
                    <div className="flex items-center gap-1 bg-slate-800/80 px-1.5 py-1 rounded-lg border border-slate-700 min-w-0">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <input
                        type="time"
                        value={cat.time || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          handleUpdateTimeAndReminder(
                            cat.id,
                            val || undefined,
                            val ? (cat.reminderEnabled ?? true) : false
                          );
                        }}
                        className="w-[68px] sm:w-auto bg-transparent text-white font-mono text-[11px] focus:outline-hidden"
                      />
                      <button
                        type="button"
                        disabled={!hasTime}
                        onClick={() =>
                          handleUpdateTimeAndReminder(cat.id, cat.time, !isReminderOn)
                        }
                        className={`p-1 rounded transition disabled:opacity-30 shrink-0 ${
                          isReminderOn
                            ? 'text-amber-400 bg-amber-500/15'
                            : 'text-slate-400 hover:text-white'
                        }`}
                        title={
                          isEn
                            ? 'Toggle sound reminder'
                            : isPl
                            ? 'Przełącz przypomnienie dźwiękowe'
                            : 'Звуковое напоминание'
                        }
                      >
                        {isReminderOn ? (
                          <Bell className="w-3.5 h-3.5" />
                        ) : (
                          <BellOff className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    <div className="flex items-center gap-1 bg-slate-800/80 px-1.5 py-1 rounded-lg border border-slate-700 shrink-0">
                      <span className="text-[11px] text-slate-400">
                        {isEn ? 'Share:' : isPl ? 'Udział:' : 'Доля:'}
                      </span>
                      <input
                        type="number"
                        min="5"
                        max="100"
                        value={pct}
                        onChange={(e) =>
                          handleChangeField(
                            cat.id,
                            'targetCaloriesPercent',
                            Math.min(100, Math.max(5, Number(e.target.value) || 10))
                          )
                        }
                        className="w-9 bg-transparent text-white font-bold text-right focus:outline-hidden"
                      />
                      <span className="text-[11px] text-slate-400">%</span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {/* Move Up / Down */}
                      <div className="flex items-center bg-slate-800 rounded-lg border border-slate-700">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMove(idx, -1)}
                          className="p-1.5 text-slate-300 hover:text-white disabled:opacity-30"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === sorted.length - 1}
                          onClick={() => handleMove(idx, 1)}
                          className="p-1.5 text-slate-300 hover:text-white disabled:opacity-30"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Toggle Visible */}
                      <button
                        type="button"
                        onClick={() => handleToggleVisible(cat.id)}
                        className={`p-1.5 rounded-lg border transition ${
                          isVisible
                            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                            : 'bg-slate-800 border-slate-700 text-slate-500'
                        }`}
                      >
                        {isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>

                      {/* Delete */}
                      {sorted.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setDeleteCatModal({
                              isOpen: true,
                              id: cat.id,
                              name: `${getMealCategoryIconText(cat.icon)} ${catName}`,
                            })
                          }
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-950/50 border border-slate-700 hover:border-red-500/40 text-slate-400 hover:text-red-400 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add New Meal Category Form */}
          <form
            onSubmit={handleAdd}
            className="pt-3 border-t border-slate-800/80 space-y-2.5 text-xs"
          >
            <div className="font-semibold text-slate-300">
              {isEn
                ? 'Add a new meal category:'
                : isPl
                ? 'Dodaj nowy posiłek:'
                : 'Добавить новый приём пищи:'}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <input
                type="text"
                required
                placeholder={
                  isEn
                    ? 'Name (e.g., Second Breakfast, Vitamins)'
                    : isPl
                    ? 'Nazwa (np. Drugie śniadanie, Witaminy)'
                    : 'Название (напр. Полдник, Витамины, Лекарства)'
                }
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                className="sm:col-span-5 min-h-[40px] px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
              />
              <div className="sm:col-span-2 flex items-center gap-1.5 bg-slate-900 px-3 py-2 rounded-xl border border-slate-800">
                <span className="text-slate-400">
                  {isEn ? 'Share:' : isPl ? 'Udział:' : 'Доля:'}
                </span>
                <input
                  type="number"
                  min="5"
                  max="100"
                  value={newRatio}
                  onChange={(e) => setNewRatio(e.target.value)}
                  className="w-11 bg-transparent text-white font-bold text-right"
                />
                <span className="text-slate-400">%</span>
              </div>
              <div className="sm:col-span-3 flex items-center gap-1.5 bg-slate-900 px-2.5 py-1.5 rounded-xl border border-slate-800">
                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <input
                  type="time"
                  value={newTime}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNewTime(val);
                    if (val && !newReminder) setNewReminder(true);
                    if (!val) setNewReminder(false);
                  }}
                  className="flex-1 bg-transparent text-white font-mono text-xs focus:outline-hidden"
                />
                <button
                  type="button"
                  disabled={!newTime}
                  onClick={() => setNewReminder((prev) => !prev)}
                  className={`p-1.5 rounded-lg transition disabled:opacity-35 ${
                    newTime && newReminder
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {newTime && newReminder ? (
                    <Bell className="w-3.5 h-3.5" />
                  ) : (
                    <BellOff className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
              <button
                type="submit"
                className="sm:col-span-2 min-h-[40px] py-2 px-3 rounded-xl font-bold text-white flex items-center justify-center gap-1.5 transition"
                style={{ backgroundColor: accentColor }}
              >
                <Plus className="w-4 h-4 shrink-0" />
                <span>{isEn ? 'Add' : isPl ? 'Dodaj' : 'Добавить'}</span>
              </button>
            </div>

            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-slate-400">
                  {isEn ? 'Food icons:' : isPl ? 'Ikony jedzenia:' : 'Иконки еды:'}
                </span>
                {FOOD_ICON_PRESETS.map((em) => (
                  <button
                    key={em}
                    type="button"
                    onClick={() => setNewIcon(em)}
                    className={`w-8 h-8 rounded-lg text-sm flex items-center justify-center border transition ${
                      newIcon === em
                        ? 'bg-emerald-500/20 border-emerald-500 scale-105'
                        : 'bg-slate-900 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    {em}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-cyan-400 flex items-center gap-1">
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
                    onClick={() => setNewIcon(med.id)}
                    title={med.label[locKey]}
                    className={`h-8 px-2 rounded-lg text-[11px] flex items-center gap-1.5 border transition ${
                      newIcon === med.id
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
        </div>
      )}

      {/* Delete Meal Category Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteCatModal.isOpen}
        title={isEn ? 'Delete meal category?' : isPl ? 'Usunąć posiłek?' : 'Удалить приём пищи?'}
        message={
          isEn
            ? 'Are you sure you want to delete this meal category?'
            : isPl
            ? 'Czy na pewno chcesz usunąć ten posiłek?'
            : 'Вы уверены, что хотите удалить этот приём пищи? Внесённые ранее продукты за день останутся в базе.'
        }
        itemName={deleteCatModal.name}
        confirmLabel={isEn ? 'Delete' : isPl ? 'Usuń' : 'Удалить'}
        cancelLabel={isEn ? 'Cancel' : isPl ? 'Anuluj' : 'Отмена'}
        themeStyles={themeStyles}
        onCancel={() => setDeleteCatModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={() => {
          handleDelete(deleteCatModal.id);
          setDeleteCatModal((prev) => ({ ...prev, isOpen: false }));
        }}
      />
    </div>
  );
};
