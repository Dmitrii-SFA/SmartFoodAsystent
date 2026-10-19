import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  UserPlus,
  X,
} from 'lucide-react';
import { DayLog, LocalizationLabels } from '../types/config';
import { ThemeStyles, getBorderRadiusClass } from '../utils/themeHelper';
import { getUITranslations } from '../utils/translations';

interface DaySwipeHeaderProps {
  currentDateStr: string; // 'YYYY-MM-DD'
  logs?: Record<string, DayLog>;
  dailyCalorieTarget?: number;
  themeStyles: ThemeStyles;
  accentColor: string;
  borderRadius: string;
  langCode?: string;
  labels?: Partial<LocalizationLabels>;
  onSelectDate?: (dateStr: string) => void;
  onDateChange?: (dateStr: string) => void;
  onAddPerson?: (name: string) => void;
}

export const DaySwipeHeader: React.FC<DaySwipeHeaderProps> = ({
  currentDateStr,
  logs = {},
  dailyCalorieTarget = 2000,
  themeStyles,
  accentColor,
  borderRadius,
  langCode = 'ru',
  labels,
  onSelectDate,
  onDateChange,
  onAddPerson,
}) => {
  const [isAddPersonOpen, setIsAddPersonOpen] = useState(false);
  const [newPersonName, setNewPersonName] = useState('');
  const radiusClass = getBorderRadiusClass(borderRadius);
  const t = getUITranslations(langCode, labels);

  const c = (langCode || 'ru').toLowerCase();
  const addPersonTitle = c.startsWith('en')
    ? 'Add person'
    : c.startsWith('pl')
    ? 'Dodaj osobę'
    : 'Добавить человека';
  const personNamePlaceholder = c.startsWith('en')
    ? 'Person name...'
    : c.startsWith('pl')
    ? 'Imię osoby...'
    : 'Имя человека...';
  const addBtnLabel = c.startsWith('en')
    ? 'Add'
    : c.startsWith('pl')
    ? 'Dodaj'
    : 'Добавить';
  const cancelBtnLabel = c.startsWith('en')
    ? 'Cancel'
    : c.startsWith('pl')
    ? 'Anuluj'
    : 'Отмена';

  const handleDateSelect = (dateStr: string) => {
    onSelectDate?.(dateStr);
    onDateChange?.(dateStr);
  };

  const todayStr = new Date().toISOString().split('T')[0];

  const getLocaleCode = () => {
    if (c.startsWith('en')) return 'en-US';
    if (c.startsWith('pl')) return 'pl-PL';
    return 'ru-RU';
  };

  const shiftDate = (days: number) => {
    const [y, m, d] = currentDateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    dateObj.setDate(dateObj.getDate() + days);
    const nextY = dateObj.getFullYear();
    const nextM = String(dateObj.getMonth() + 1).padStart(2, '0');
    const nextD = String(dateObj.getDate()).padStart(2, '0');
    handleDateSelect(`${nextY}-${nextM}-${nextD}`);
  };

  const formatHumanDate = (dateStr: string): { title: string; subtitle: string } => {
    const [y, m, d] = (dateStr || todayStr).split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(y, m - 1, d);
    target.setHours(0, 0, 0, 0);

    const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const locale = getLocaleCode();

    const formatted = dateObj.toLocaleDateString(locale, {
      day: 'numeric',
      month: 'long',
      year: dateObj.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
    });

    const weekday = dateObj.toLocaleDateString(locale, { weekday: 'long' });

    if (diffDays === 0) return { title: t.today, subtitle: `${formatted}, ${weekday}` };
    if (diffDays === -1) return { title: t.yesterday, subtitle: `${formatted}, ${weekday}` };
    if (diffDays === 1) return { title: t.tomorrow, subtitle: `${formatted}, ${weekday}` };
    return { title: formatted, subtitle: weekday };
  };

  const { title, subtitle } = formatHumanDate(currentDateStr);

  // Calculate today's calorie completion
  const safeLogs = logs || {};
  const currentLog = safeLogs[currentDateStr];
  const totalCalories = (currentLog?.items || []).reduce(
    (acc, item) => acc + (item.nutrients?.['calories'] || 0),
    0
  );
  const goalPct =
    dailyCalorieTarget > 0 ? Math.round((totalCalories / dailyCalorieTarget) * 100) : 0;
  const isGoalReached = goalPct >= 90 && goalPct <= 110 && totalCalories > 0;

  const handleSubmitNewPerson = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newPersonName.trim();
    if (!trimmed) return;
    onAddPerson?.(trimmed);
    setNewPersonName('');
    setIsAddPersonOpen(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-stretch gap-2.5">
        {/* Narrower Date Plaque */}
        <div
          className={`flex-1 min-w-0 border ${themeStyles.borderColor} ${themeStyles.cardBg} ${radiusClass} px-3 py-2 shadow-sm transition-all select-none flex flex-col justify-center`}
        >
          <div className="flex items-center justify-between gap-1.5">
            {/* Left Arrow (Previous Day) */}
            <button
              onClick={() => shiftDate(-1)}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition active:scale-95 shrink-0"
              title={t.yesterday}
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Center Date Info */}
            <div className="flex-1 text-center min-w-0 px-1">
              <div className="flex items-center justify-center gap-1.5 flex-wrap">
                <span className={`text-sm sm:text-base font-extrabold tracking-tight ${themeStyles.textPrimary}`}>
                  {title}
                </span>
                {currentDateStr === todayStr && (
                  <span
                    className="px-1.5 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider shrink-0"
                    style={{ backgroundColor: `${accentColor}25`, color: accentColor }}
                  >
                    {t.todayBadge}
                  </span>
                )}
              </div>
              <p className={`text-[11px] capitalize truncate ${themeStyles.textSecondary}`}>{subtitle}</p>
            </div>

            {/* Right Controls: Next Day Arrow */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => shiftDate(1)}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition active:scale-95"
                title={t.tomorrow}
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Square Add Person Button on the Right */}
        {onAddPerson && (
          <button
            type="button"
            onClick={() => {
              setNewPersonName('');
              setIsAddPersonOpen(true);
            }}
            title={addPersonTitle}
            className={`aspect-square shrink-0 border ${themeStyles.borderColor} ${themeStyles.cardBg} ${radiusClass} px-3.5 flex flex-col items-center justify-center gap-1 shadow-sm hover:brightness-110 transition-all active:scale-95`}
            style={{ borderColor: `${accentColor}50` }}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
            >
              <UserPlus className="w-5 h-5" />
            </div>
          </button>
        )}
      </div>

      {/* Celebratory Banner when Daily Goal is Reached */}
      {isGoalReached && (
        <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs animate-in fade-in duration-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold">
              {t.dailyGoalReachedPct} ({goalPct}% — {Math.round(totalCalories)} {t.kcalShort})!
            </span>
          </div>
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
        </div>
      )}

      {/* Add Person Modal */}
      {isAddPersonOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsAddPersonOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-sm border ${themeStyles.borderColor} ${themeStyles.cardBg} ${radiusClass} p-4 shadow-2xl space-y-4`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="p-2 rounded-xl"
                  style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
                >
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className={`text-sm font-bold ${themeStyles.textPrimary}`}>
                  {addPersonTitle}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddPersonOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitNewPerson} className="space-y-3">
              <input
                type="text"
                autoFocus
                value={newPersonName}
                onChange={(e) => setNewPersonName(e.target.value)}
                placeholder={personNamePlaceholder}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddPersonOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                >
                  {cancelBtnLabel}
                </button>
                <button
                  type="submit"
                  disabled={!newPersonName.trim()}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 transition disabled:opacity-40"
                  style={{ backgroundColor: accentColor }}
                >
                  {addBtnLabel}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

