import React, { useEffect } from 'react';
import { MealCategoryConfig, FoodItem, SoundSettingsConfig } from '../types/config';
import { ThemeStyles } from '../utils/themeHelper';
import { MealCategoryIcon } from '../utils/iconHelper';
import { loadSoundSettings, playSoundMelody } from '../utils/soundEngine';
import { BellRing, Clock, CheckCircle2, AlarmClock, Volume2 } from 'lucide-react';

interface MealReminderModalProps {
  activeMeal: MealCategoryConfig | null;
  mealItems: FoodItem[];
  soundSettings?: SoundSettingsConfig;
  langCode?: string;
  accentColor: string;
  themeStyles: ThemeStyles;
  onDismiss: () => void;
  onSnooze: (minutes: number) => void;
}

export const MealReminderModal: React.FC<MealReminderModalProps> = ({
  activeMeal,
  mealItems,
  soundSettings,
  langCode = 'ru',
  accentColor,
  themeStyles,
  onDismiss,
  onSnooze,
}) => {
  const c = (langCode || 'ru').toLowerCase();
  const isEn = c.startsWith('en');
  const isPl = c.startsWith('pl');

  useEffect(() => {
    if (!activeMeal) return;

    const currentSound = loadSoundSettings(soundSettings);
    const triggerSignal = () => {
      playSoundMelody(currentSound.mealSoundId, {
        volume: currentSound.volume,
        vibrate: currentSound.vibrate,
      });
    };

    // Play immediately and repeat every 3.2 seconds until dismissed or snoozed
    triggerSignal();
    const intervalId = window.setInterval(triggerSignal, 3200);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [activeMeal, soundSettings]);

  if (!activeMeal) return null;

  const totalKcal = Math.round(
    mealItems.reduce((sum, item) => sum + (item.nutrients?.['calories'] || 0), 0)
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className={`w-full max-w-md rounded-2xl border ${themeStyles.borderColor} ${themeStyles.cardBg} p-5 shadow-2xl space-y-4`}
      >
        {/* Top Alarm Header */}
        <div className="flex items-start gap-3.5">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-md"
            style={{ backgroundColor: `${accentColor}25`, color: accentColor }}
          >
            <BellRing className="w-6 h-6 animate-bounce" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span className="font-mono tabular-nums">{activeMeal.time || ''}</span>
              <span>•</span>
              <span>
                {isEn
                  ? 'Meal / Medication Reminder'
                  : isPl
                  ? 'Przypomnienie o posiłku / lekach'
                  : 'Напоминание о приёме'}
              </span>
            </div>

            <h3
              className={`text-lg font-bold leading-snug mt-0.5 flex items-center gap-2 ${themeStyles.textPrimary}`}
            >
              <MealCategoryIcon icon={activeMeal.icon} className="w-6 h-6" />
              <span className="break-words">{activeMeal.name}</span>
            </h3>
          </div>
        </div>

        {/* Planned items inside this meal category */}
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>
              {isEn
                ? 'Planned for this intake:'
                : isPl
                ? 'Zaplanowane na ten posiłek:'
                : 'Запланировано в этом приёме:'}
            </span>
            {mealItems.length > 0 && (
              <span className="font-mono tabular-nums text-amber-300 font-semibold">
                {totalKcal} {isEn ? 'kcal' : 'ккал'}
              </span>
            )}
          </div>

          {mealItems.length === 0 ? (
            <p className="text-xs text-slate-300">
              {isEn
                ? `It is time for "${activeMeal.name}"!`
                : isPl
                ? `Nadszedł czas na „${activeMeal.name}”!`
                : `Наступило время для «${activeMeal.name}»!`}
            </p>
          ) : (
            <ul className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {mealItems.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-2 text-xs px-2.5 py-1.5 rounded-lg bg-slate-950/70 border border-slate-800/80"
                >
                  <span className="font-medium text-white truncate">{item.name}</span>
                  <span className="text-[11px] font-mono tabular-nums text-slate-400 shrink-0">
                    {item.amountGrams} {isEn || isPl ? 'g' : 'г'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Replay sound button */}
        <button
          type="button"
          onClick={() => {
            const currentSound = loadSoundSettings(soundSettings);
            playSoundMelody(currentSound.mealSoundId, {
              volume: currentSound.volume,
              vibrate: currentSound.vibrate,
            });
          }}
          className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold flex items-center justify-center gap-2 transition"
        >
          <Volume2 className="w-3.5 h-3.5 text-amber-400" />
          <span>
            {isEn
              ? 'Play signal again'
              : isPl
              ? 'Odtwórz sygnał ponownie'
              : 'Повторить звуковой сигнал'}
          </span>
        </button>

        {/* Action Buttons: Snooze 5 min / Snooze 10 min / Dismiss */}
        <div className="space-y-2 pt-1">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onSnooze(5)}
              className="min-h-[42px] py-2 px-3 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95"
            >
              <AlarmClock className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                {isEn
                  ? 'Snooze 5 min'
                  : isPl
                  ? 'Drzemka 5 min'
                  : 'Отложить 5 мин'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => onSnooze(10)}
              className="min-h-[42px] py-2 px-3 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95"
            >
              <AlarmClock className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                {isEn
                  ? 'Snooze 10 min'
                  : isPl
                  ? 'Drzemka 10 min'
                  : 'Отложить 10 мин'}
              </span>
            </button>
          </div>

          <button
            type="button"
            onClick={onDismiss}
            className="w-full min-h-[46px] py-2.5 px-4 rounded-xl font-bold text-white text-sm shadow-lg flex items-center justify-center gap-2 transition active:scale-95"
            style={{ backgroundColor: accentColor }}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>
              {isEn
                ? 'Dismiss Signal / Done'
                : isPl
                ? 'Wyłącz sygnał / Gotowe'
                : 'Выключить сигнал / Принято'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
