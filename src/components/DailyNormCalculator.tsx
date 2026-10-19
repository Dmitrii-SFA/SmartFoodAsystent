import React, { useState } from 'react';
import { MetricConfig, LocalizationLabels } from '../types/config';
import { ThemeStyles, getBorderRadiusClass } from '../utils/themeHelper';
import { Calculator, Sparkles, Check, User, Activity, Target, ChevronDown } from 'lucide-react';

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
  onUpdateMetrics?: (updatedMetrics: MetricConfig[]) => void;
  onApplyNorm?: (calories: number, proteins: number, fats: number, carbs: number) => void;
  onApplyCalculatedTargets?: (updatedMetrics: MetricConfig[], summaryText: string) => void;
}

type Gender = 'male' | 'female';
type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
type GoalType = 'lose' | 'maintain' | 'gain';

export const DailyNormCalculator: React.FC<DailyNormCalculatorProps> = ({
  metrics,
  themeStyles,
  accentColor,
  borderRadius,
  langCode = 'ru',
  isCollapsed = false,
  onToggleCollapse,
  onUpdateMetrics,
  onApplyNorm,
  onApplyCalculatedTargets,
}) => {
  const [gender, setGender] = useState<Gender>('male');
  const [age, setAge] = useState<string>('28');
  const [weight, setWeight] = useState<string>('75');
  const [height, setHeight] = useState<string>('178');
  const [activity, setActivity] = useState<ActivityLevel>('moderate');
  const [goal, setGoal] = useState<GoalType>('maintain');
  const [appliedFlash, setAppliedFlash] = useState(false);

  const radiusClass = getBorderRadiusClass(borderRadius);
  const c = (langCode || 'ru').toLowerCase();
  const isEn = c.startsWith('en');
  const isPl = c.startsWith('pl');

  const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, { label: string; factor: number; desc: string }> = {
    sedentary: {
      label: isEn ? 'Sedentary' : isPl ? 'Siedzący' : 'Сидячий образ жизни',
      factor: 1.2,
      desc: isEn ? 'Office job, little movement' : isPl ? 'Praca biurowa, mało ruchu' : 'Офисная работа, минимум движения',
    },
    light: {
      label: isEn ? 'Light activity' : isPl ? 'Lekka aktywność' : 'Лёгкая активность',
      factor: 1.375,
      desc: isEn ? 'Workouts 1–3 times a week' : isPl ? 'Treningi 1–3 razy w tygodniu' : 'Тренировки 1–3 раза в неделю',
    },
    moderate: {
      label: isEn ? 'Moderate activity' : isPl ? 'Umiarkowana aktywność' : 'Средняя активность',
      factor: 1.55,
      desc: isEn ? 'Workouts 3–5 times a week' : isPl ? 'Treningi 3–5 razy w tygodniu' : 'Спорт 3–5 раз в неделю',
    },
    active: {
      label: isEn ? 'High activity' : isPl ? 'Wysoka aktywność' : 'Высокая активность',
      factor: 1.725,
      desc: isEn ? 'Daily intensive workouts' : isPl ? 'Codzienne intensywne treningi' : 'Интенсивные тренировки 6–7 раз в неделю',
    },
    very_active: {
      label: isEn ? 'Extreme activity' : isPl ? 'Bardzo wysoka' : 'Экстремальная нагрузка',
      factor: 1.9,
      desc: isEn ? 'Physical labor or 2x/day training' : isPl ? 'Praca fizyczna lub 2 treningi dziennie' : 'Тяжёлый физ. труд или 2 тренировки в день',
    },
  };

  const GOAL_MODIFIERS: Record<GoalType, { label: string; calFactor: number; protPerKg: number; fatPerKg: number }> = {
    lose: {
      label: isEn ? 'Weight loss (−15%)' : isPl ? 'Redukcja (−15%)' : 'Похудение (−15% ккал)',
      calFactor: 0.85,
      protPerKg: 2.0,
      fatPerKg: 0.9,
    },
    maintain: {
      label: isEn ? 'Maintenance' : isPl ? 'Utrzymanie wagi' : 'Поддержание веса',
      calFactor: 1.0,
      protPerKg: 1.6,
      fatPerKg: 1.0,
    },
    gain: {
      label: isEn ? 'Muscle gain (+15%)' : isPl ? 'Budowa masy (+15%)' : 'Набор массы (+15% ккал)',
      calFactor: 1.15,
      protPerKg: 2.0,
      fatPerKg: 1.1,
    },
  };

  const numAge = Math.max(12, Math.min(100, Number(age) || 28));
  const numWeight = Math.max(30, Math.min(250, Number(weight) || 75));
  const numHeight = Math.max(120, Math.min(230, Number(height) || 178));

  // Mifflin-St Jeor Equation
  const bmr =
    gender === 'male'
      ? 10 * numWeight + 6.25 * numHeight - 5 * numAge + 5
      : 10 * numWeight + 6.25 * numHeight - 5 * numAge - 161;

  const tdee = bmr * ACTIVITY_MULTIPLIERS[activity].factor;
  const goalConf = GOAL_MODIFIERS[goal];

  const calcCalories = Math.round(tdee * goalConf.calFactor);
  const calcProteins = Math.round(numWeight * goalConf.protPerKg);
  const calcFats = Math.round(numWeight * goalConf.fatPerKg);
  const remainingCalForCarbs = Math.max(200, calcCalories - calcProteins * 4 - calcFats * 9);
  const calcCarbs = Math.round(remainingCalForCarbs / 4);
  const calcWaterMl = Math.round((numWeight * 33) / 50) * 50;
  const calcFiber = Math.max(20, Math.round((calcCalories / 1000) * 14));

  const handleApply = () => {
    const updated = metrics.map((m) => {
      switch (m.id) {
        case 'calories':
          return { ...m, target: calcCalories };
        case 'proteins':
          return { ...m, target: calcProteins };
        case 'fats':
          return { ...m, target: calcFats };
        case 'carbs':
          return { ...m, target: calcCarbs };
        case 'water':
          return { ...m, target: calcWaterMl };
        case 'fiber':
          return { ...m, target: calcFiber };
        case 'sugar':
          return { ...m, target: Math.round((calcCalories * 0.05) / 4) };
        default:
          return m;
      }
    });

    const summary = `${calcCalories} kcal (${calcProteins}/${calcFats}/${calcCarbs})`;
    onApplyCalculatedTargets?.(updated, summary);
    onUpdateMetrics?.(updated);
    onApplyNorm?.(calcCalories, calcProteins, calcFats, calcCarbs);
    setAppliedFlash(true);
    setTimeout(() => setAppliedFlash(false), 2500);
  };

  const currentCalorieTarget =
    metrics.find((m) => m.id === 'calories')?.target || calcCalories || 2000;

  return (
    <div
      id="daily-norm-settings-section"
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
            <Calculator className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <h3
              className={`text-sm sm:text-base font-bold leading-snug break-words ${themeStyles.textPrimary}`}
            >
              {isEn
                ? 'Daily Norm Calculator (Mifflin-St Jeor)'
                : isPl
                ? 'Kalkulator dziennego zapotrzebowania (Mifflin-St Jeor)'
                : 'Калькулятор суточной нормы (Миффлин — Сан Жеор)'}
            </h3>
            <p className={`text-xs leading-relaxed break-words ${themeStyles.textSecondary}`}>
              {isEn
                ? 'Automatic calculation of Calories, Macros, Water, and Fiber based on your parameters'
                : isPl
                ? 'Automatyczne obliczanie kalorii, makroskładników, wody i błonnika na podstawie parametrów'
                : 'Автоматический расчёт КБЖУ, воды и клетчатки по вашим параметрам'}
            </p>
            <div className="pt-1">
              <span className="inline-flex items-center text-[11px] font-mono tabular-nums px-2.5 py-0.5 rounded-lg bg-slate-800/90 border border-slate-700 text-emerald-300 font-semibold">
                {currentCalorieTarget} {isEn || isPl ? 'kcal' : 'ккал'}
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

      {/* Form Inputs */}
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
        <div>
          <label className="block text-[11px] text-slate-400 mb-1 flex items-center gap-1">
            <Activity className="w-3 h-3" />{' '}
            {isEn ? 'Activity level' : isPl ? 'Poziom aktywności' : 'Уровень активности'}
          </label>
          <select
            value={activity}
            onChange={(e) => setActivity(e.target.value as ActivityLevel)}
            className="w-full min-h-[40px] px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-medium"
          >
            {(Object.keys(ACTIVITY_MULTIPLIERS) as ActivityLevel[]).map((lvl) => (
              <option key={lvl} value={lvl}>
                {ACTIVITY_MULTIPLIERS[lvl].label} — {ACTIVITY_MULTIPLIERS[lvl].desc}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] text-slate-400 mb-1 flex items-center gap-1">
            <Target className="w-3 h-3" /> {isEn ? 'Your goal' : isPl ? 'Twój cel' : 'Ваша цель'}
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {(Object.keys(GOAL_MODIFIERS) as GoalType[]).map((gKey) => (
              <button
                key={gKey}
                type="button"
                onClick={() => setGoal(gKey)}
                className={`min-h-[40px] py-2 px-2 rounded-xl border text-[11px] font-semibold transition ${
                  goal === gKey
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {gKey === 'lose'
                  ? isEn
                    ? 'Weight Loss'
                    : isPl
                    ? 'Redukcja'
                    : 'Похудение'
                  : gKey === 'maintain'
                  ? isEn
                    ? 'Maintain'
                    : isPl
                    ? 'Utrzymanie'
                    : 'Баланс'
                  : isEn
                  ? 'Gain'
                  : isPl
                  ? 'Masa'
                  : 'Набор'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Calculated Preview Banner */}
      <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 flex-1 text-center">
          <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800/80">
            <div className="text-[10px] text-slate-400">
              {isEn ? 'Calories' : isPl ? 'Kalorie' : 'Калории'}
            </div>
            <div className="text-xs font-extrabold text-emerald-400 font-mono">{calcCalories}</div>
          </div>
          <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800/80">
            <div className="text-[10px] text-slate-400">
              {isEn ? 'Proteins' : isPl ? 'Białka' : 'Белки'}
            </div>
            <div className="text-xs font-extrabold text-blue-400 font-mono">{calcProteins} g</div>
          </div>
          <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800/80">
            <div className="text-[10px] text-slate-400">
              {isEn ? 'Fats' : isPl ? 'Tłuszcze' : 'Жиры'}
            </div>
            <div className="text-xs font-extrabold text-amber-400 font-mono">{calcFats} g</div>
          </div>
          <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800/80">
            <div className="text-[10px] text-slate-400">
              {isEn ? 'Carbs' : isPl ? 'Węglow.' : 'Углеводы'}
            </div>
            <div className="text-xs font-extrabold text-purple-400 font-mono">{calcCarbs} g</div>
          </div>
          <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800/80">
            <div className="text-[10px] text-slate-400">
              {isEn ? 'Water' : isPl ? 'Woda' : 'Вода'}
            </div>
            <div className="text-xs font-extrabold text-cyan-400 font-mono">{calcWaterMl} ml</div>
          </div>
          <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800/80">
            <div className="text-[10px] text-slate-400">
              {isEn ? 'Fiber' : isPl ? 'Błonnik' : 'Клетчатка'}
            </div>
            <div className="text-xs font-extrabold text-lime-400 font-mono">{calcFiber} g</div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleApply}
          className="min-h-[42px] px-4 py-2.5 rounded-xl font-bold text-xs text-white shadow-md flex items-center justify-center gap-1.5 transition active:scale-95 shrink-0"
          style={{ backgroundColor: accentColor }}
        >
          {appliedFlash ? (
            <>
              <Check className="w-4 h-4" />
              <span>{isEn ? 'Applied!' : isPl ? 'Zastosowano!' : 'Нормы применены!'}</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>
                {isEn
                  ? 'Apply these norms'
                  : isPl
                  ? 'Zastosuj te normy'
                  : 'Применить эти нормы'}
              </span>
            </>
          )}
        </button>
      </div>
        </div>
      )}
    </div>
  );
};
