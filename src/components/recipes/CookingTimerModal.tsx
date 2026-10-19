import React, { useState, useEffect, useRef } from 'react';
import { RecipeItem, CookwareVessel, CookingStepItem } from '../../types/config';
import {
  calculateVesselStepItems,
  findVesselTransferDestination,
  formatCompactDurationMinutes,
  formatRegimeBadgeText,
  isWaterFoodItem,
  isVesselTransferItem,
  isRegimeOnlyStepItem,
  getVesselDisplayIcon,
  getVesselDisplayName,
  DetectedCookingMethodInfo,
} from '../../utils/culinaryPhysics';
import { CookwareIcon } from './CookwareIcon';
import { loadSoundSettings, playSoundMelody } from '../../utils/soundEngine';
import {
  X,
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Volume2,
  BellRing,
  CheckCircle2,
  Droplet,
  ArrowRight,
  ChefHat,
  Layers,
} from 'lucide-react';

interface CookingTimerModalProps {
  isOpen: boolean;
  recipe: RecipeItem | null;
  accentColor: string;
  onClose: () => void;
}

interface TimerStepUnit {
  stepNumber: number;
  recipeStartMinute: number;
  recipeEndMinute: number;
  title: string;
  durationSeconds: number;
  durationMinutes: number;
  items: CookingStepItem[];
  regimeBadgeText?: string;
  stepCookingMode?: DetectedCookingMethodInfo;
}

interface VesselTimerState {
  vesselId: string;
  vesselName: string;
  vesselIcon: string;
  heatBadge: string;
  cookingMode?: DetectedCookingMethodInfo;
  startOffsetMinutes: number;
  recipeEndMinute: number;
  transferredToText?: string;
  steps: TimerStepUnit[];
  currentStepIdx: number;
  remainingSeconds: number;
  isRunning: boolean;
  isAlarmRinging: boolean;
  isVesselCompleted: boolean;
}

/**
 * Plays the user-configured cooking timer melody using Web Audio API
 */
function playKitchenTimerBeep() {
  try {
    const settings = loadSoundSettings();
    playSoundMelody(settings.cookingSoundId, {
      volume: settings.volume,
      vibrate: settings.vibrate,
    });
  } catch (e) {
    console.warn('Web Audio API not allowed or failed:', e);
  }
}

function formatCountdown(totalSeconds: number): string {
  const sec = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(sec / 3600);
  const minutes = Math.floor((sec % 3600) / 60);
  const seconds = sec % 60;

  const pad = (n: number) => String(n).padStart(2, '0');
  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

export const CookingTimerModal: React.FC<CookingTimerModalProps> = ({
  isOpen,
  recipe,
  accentColor,
  onClose,
}) => {
  const [vesselStates, setVesselStates] = useState<VesselTimerState[]>([]);
  const alarmIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isOpen || !recipe) return;

    const vessels = recipe.cookingProcess?.vessels || [];
    if (vessels.length > 0) {
      const initialized: VesselTimerState[] = vessels.map((vessel, vIdx) => {
        const { groupedSteps, startOffsetMinutes, recipeEndMinute, cookingMode } =
          calculateVesselStepItems(vessel, vIdx);
        const transferredTo = findVesselTransferDestination(vessel.id, vessels);

        const stepUnits: TimerStepUnit[] = groupedSteps.map((g, idx) => ({
          stepNumber: idx + 1,
          recipeStartMinute: g.recipeStartMinute,
          recipeEndMinute: g.recipeEndMinute,
          title: `Шаг ${idx + 1}`,
          durationMinutes: g.durationMinutes,
          durationSeconds: Math.max(1, Math.round(g.durationMinutes * 60)),
          items: g.items,
          regimeBadgeText: g.regimeBadgeText,
          stepCookingMode: g.stepCookingMode,
        }));

        const firstDuration = stepUnits[0]?.durationSeconds || 600;

        let transferredToText: string | undefined;
        if (transferredTo) {
          transferredToText = `Приготовить к ${transferredTo.addedAtRecipeMinute}-й минуте`;
        }

        return {
          vesselId: vessel.id,
          vesselName: getVesselDisplayName(vessel, vIdx),
          vesselIcon: getVesselDisplayIcon(vessel),
          heatBadge: formatRegimeBadgeText({
            heatSource: vessel.heatSource,
            electricLevel: vessel.electricLevel,
            gasLevel: vessel.gasLevel,
            ovenTempC: vessel.ovenTempC,
            hasLid: vessel.hasLid,
          }),
          cookingMode,
          startOffsetMinutes,
          recipeEndMinute,
          transferredToText,
          steps: stepUnits,
          currentStepIdx: 0,
          remainingSeconds: firstDuration,
          isRunning: false,
          isAlarmRinging: false,
          isVesselCompleted: stepUnits.length === 0,
        };
      });

      setVesselStates(initialized);
    } else {
      const fallbackStep: TimerStepUnit = {
        stepNumber: 1,
        recipeStartMinute: 0,
        recipeEndMinute: 20,
        title: 'Шаг 1',
        durationMinutes: 20,
        durationSeconds: 20 * 60,
        items: recipe.ingredients.map((ing, i) => ({
          id: `simple-${i}`,
          foodId: ing.foodId,
          foodName: ing.foodName,
          grams: ing.grams,
          addedAtMinute: 0,
          durationMinutes: 20,
        })),
      };
      setVesselStates([
        {
          vesselId: 'simple-vessel',
          vesselName: recipe.name,
          vesselIcon: '🍲',
          heatBadge: '',
          startOffsetMinutes: 0,
          recipeEndMinute: 20,
          steps: [fallbackStep],
          currentStepIdx: 0,
          remainingSeconds: fallbackStep.durationSeconds,
          isRunning: false,
          isAlarmRinging: false,
          isVesselCompleted: false,
        },
      ]);
    }
  }, [isOpen, recipe]);

  useEffect(() => {
    if (!isOpen) return;

    const timer = window.setInterval(() => {
      setVesselStates((prev) => {
        let shouldPlayBeep = false;

        const next = prev.map((vs) => {
          if (!vs.isRunning || vs.isVesselCompleted) return vs;
          if (vs.remainingSeconds > 1) {
            return {
              ...vs,
              remainingSeconds: vs.remainingSeconds - 1,
            };
          } else {
            shouldPlayBeep = true;
            return {
              ...vs,
              remainingSeconds: 0,
              isRunning: false,
              isAlarmRinging: true,
            };
          }
        });

        if (shouldPlayBeep) {
          playKitchenTimerBeep();
        }

        return next;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isOpen]);

  const anyAlarmRinging = vesselStates.some((vs) => vs.isAlarmRinging);
  useEffect(() => {
    if (anyAlarmRinging && isOpen) {
      alarmIntervalRef.current = window.setInterval(() => {
        playKitchenTimerBeep();
      }, 2500);
    } else if (alarmIntervalRef.current) {
      window.clearInterval(alarmIntervalRef.current);
      alarmIntervalRef.current = null;
    }

    return () => {
      if (alarmIntervalRef.current) {
        window.clearInterval(alarmIntervalRef.current);
        alarmIntervalRef.current = null;
      }
    };
  }, [anyAlarmRinging, isOpen]);

  if (!isOpen || !recipe) return null;

  const handleToggleStartPause = (vesselId: string) => {
    setVesselStates((prev) =>
      prev.map((vs) => {
        if (vs.vesselId !== vesselId) return vs;
        if (vs.isAlarmRinging) {
          return { ...vs, isAlarmRinging: false };
        }
        return {
          ...vs,
          isRunning: !vs.isRunning,
        };
      })
    );
  };

  const handleNextStep = (vesselId: string) => {
    setVesselStates((prev) =>
      prev.map((vs) => {
        if (vs.vesselId !== vesselId) return vs;
        const nextIdx = vs.currentStepIdx + 1;
        if (nextIdx >= vs.steps.length) {
          return {
            ...vs,
            isRunning: false,
            isAlarmRinging: false,
            remainingSeconds: 0,
            isVesselCompleted: true,
          };
        }
        const nextStep = vs.steps[nextIdx];
        return {
          ...vs,
          currentStepIdx: nextIdx,
          remainingSeconds: nextStep.durationSeconds,
          isRunning: false,
          isAlarmRinging: false,
        };
      })
    );
  };

  const handleSelectStep = (vesselId: string, stepIdx: number) => {
    setVesselStates((prev) =>
      prev.map((vs) => {
        if (vs.vesselId !== vesselId) return vs;
        const targetStep = vs.steps[stepIdx];
        if (!targetStep) return vs;
        return {
          ...vs,
          currentStepIdx: stepIdx,
          remainingSeconds: targetStep.durationSeconds,
          isRunning: false,
          isAlarmRinging: false,
          isVesselCompleted: false,
        };
      })
    );
  };

  const handleResetCurrentStep = (vesselId: string) => {
    setVesselStates((prev) =>
      prev.map((vs) => {
        if (vs.vesselId !== vesselId) return vs;
        const curStep = vs.steps[vs.currentStepIdx];
        if (!curStep) return vs;
        return {
          ...vs,
          remainingSeconds: curStep.durationSeconds,
          isRunning: false,
          isAlarmRinging: false,
          isVesselCompleted: false,
        };
      })
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl border border-slate-700 bg-slate-900 rounded-2xl shadow-2xl p-3.5 sm:p-5 space-y-3.5 max-h-[92vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div
              className="p-2 rounded-xl text-white shrink-0"
              style={{ backgroundColor: accentColor }}
            >
              <ChefHat className="w-4 h-4" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-white truncate">{recipe.name}</h3>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={playKitchenTimerBeep}
              title="Проверить звук"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 transition active:scale-95"
            >
              <Volume2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Vessels Stack */}
        <div className="space-y-3.5">
          {vesselStates.map((vs, vIdx) => {
            const currentStep = vs.steps[vs.currentStepIdx];
            const activeCookingMode = currentStep?.stepCookingMode || vs.cookingMode;
            const activeHeatBadge = currentStep?.regimeBadgeText || vs.heatBadge;

            const progressPercent =
              currentStep && currentStep.durationSeconds > 0
                ? Math.min(
                    100,
                    Math.max(
                      0,
                      Math.round(
                        ((currentStep.durationSeconds - vs.remainingSeconds) /
                          currentStep.durationSeconds) *
                          100
                      )
                    )
                  )
                : 0;

            return (
              <div
                key={vs.vesselId}
                className={`p-3 sm:p-3.5 rounded-2xl border transition space-y-2.5 ${
                  vs.isAlarmRinging
                    ? 'bg-amber-950/40 border-amber-400 shadow-lg shadow-amber-500/20'
                    : vs.isRunning
                    ? 'bg-slate-950/90 border-emerald-500/60'
                    : 'bg-slate-950/80 border-slate-800'
                }`}
              >
                {/* Vessel Header in 2 Clean Horizontal Lines (Line 1: Cookware Name + Step #, Line 2: Cooking Mode & Heat Badges) */}
                <div className="space-y-1.5 border-b border-slate-800/80 pb-2">
                  {/* Line 1: Full-width horizontal cookware name */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <CookwareIcon icon={vs.vesselIcon} vesselName={vs.vesselName} className="w-5 h-5" />
                      <h4 className="text-sm sm:text-base font-bold text-white truncate">
                        {vs.vesselName}
                      </h4>
                    </div>

                    <div className="shrink-0 flex items-center gap-1.5">
                      {vs.isVesselCompleted ? (
                        <span className="text-emerald-400 text-[10px] font-bold flex items-center gap-0.5">
                          <CheckCircle2 className="w-3 h-3" />
                          Готово
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono tabular-nums text-slate-400">
                          Шаг {vs.currentStepIdx + 1}/{vs.steps.length}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Line 2: Horizontal Cooking Mode (Тушится / Варится / Жарится), Regime & Start Minute */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {activeCookingMode && (
                      <span
                        className={`px-2 py-0.5 rounded border text-[10px] font-bold ${activeCookingMode.badgeColor}`}
                      >
                        {activeCookingMode.label}
                      </span>
                    )}
                    {activeHeatBadge && (
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono tabular-nums text-slate-300">
                        {activeHeatBadge}
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-300 font-mono tabular-nums text-[10px] font-semibold">
                      {vIdx === 0 ? 'Старт: 0м' : `Старт: ${vs.startOffsetMinutes}м`}
                    </span>
                  </div>
                </div>

                {vs.transferredToText && (
                  <div className="px-3 py-2 rounded-xl bg-cyan-950/40 border border-cyan-500/40 text-base sm:text-lg font-mono tabular-nums font-bold text-cyan-300 text-center">
                    {vs.transferredToText}
                  </div>
                )}

                {/* Alarm Banner when Step Finishes */}
                {vs.isAlarmRinging && (
                  <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-400 text-amber-200 flex items-center justify-between gap-2 animate-pulse">
                    <div className="flex items-center gap-2 text-xs font-bold">
                      <BellRing className="w-4 h-4 text-amber-300 shrink-0" />
                      <span>Шаг {vs.currentStepIdx + 1} завершён!</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleNextStep(vs.vesselId)}
                      className="px-3 py-1 rounded-lg bg-amber-400 text-slate-950 font-black text-xs shrink-0 hover:bg-amber-300 transition"
                    >
                      {vs.currentStepIdx + 1 < vs.steps.length ? 'Далее' : 'Готово'}
                    </button>
                  </div>
                )}

                {/* Active Step Card & Big Countdown */}
                {!vs.isVesselCompleted && currentStep && (
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                            Шаг {currentStep.stepNumber} ({currentStep.recipeStartMinute}м)
                          </span>
                          <span className="text-[10px] text-slate-300 font-mono tabular-nums font-semibold">
                            {formatCompactDurationMinutes(currentStep.durationMinutes)}
                          </span>
                          {currentStep.regimeBadgeText && (
                            <span className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-[9px] font-mono tabular-nums text-amber-300">
                              {currentStep.regimeBadgeText}
                            </span>
                          )}
                          {currentStep.stepCookingMode && (
                            <span
                              className={`px-1.5 py-0.5 rounded border text-[9px] font-bold ${currentStep.stepCookingMode.badgeColor}`}
                            >
                              {currentStep.stepCookingMode.label}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          {currentStep.items.map((item) => {
                            const isWater = isWaterFoodItem(item.foodId, item.foodName);
                            const isTransfer = isVesselTransferItem(item);
                            const isRegimeOnly = isRegimeOnlyStepItem(item);
                            return (
                              <span
                                key={item.id}
                                className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 border ${
                                  isTransfer
                                    ? 'bg-cyan-950/60 text-cyan-200 border-cyan-600/60'
                                    : isWater
                                    ? 'bg-blue-950/60 text-blue-200 border-blue-700/50'
                                    : isRegimeOnly
                                    ? 'bg-amber-950/40 text-amber-200 border-amber-500/40'
                                    : 'bg-slate-800 text-white border-slate-700'
                                }`}
                              >
                                {isTransfer && <Layers className="w-3 h-3 text-cyan-400" />}
                                {isWater && <Droplet className="w-3 h-3 text-blue-400" />}
                                <span>
                                  {isRegimeOnly
                                    ? 'Готовка содержимого в посуде'
                                    : item.foodName}
                                </span>
                                {!isRegimeOnly && (
                                  <span className="text-emerald-400 font-mono tabular-nums text-[11px]">
                                    {isTransfer
                                      ? `~${item.grams}г`
                                      : `${item.grams}${isWater ? 'мл' : 'г'}`}
                                  </span>
                                )}
                              </span>
                            );
                          })}
                        </div>
                      </div>

                      {/* Large Countdown Display */}
                      <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-950 border border-slate-800 min-w-[124px]">
                        <span
                          className={`text-2xl sm:text-3xl font-black font-mono tabular-nums tracking-tight ${
                            vs.isAlarmRinging
                              ? 'text-amber-400'
                              : vs.isRunning
                              ? 'text-emerald-400'
                              : 'text-white'
                          }`}
                        >
                          {formatCountdown(vs.remainingSeconds)}
                        </span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full h-1.5 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                      <div
                        className="h-full bg-emerald-500 transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>

                    {/* Timer Controls */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleToggleStartPause(vs.vesselId)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition active:scale-95 ${
                            vs.isRunning
                              ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          }`}
                        >
                          {vs.isRunning ? (
                            <>
                              <Pause className="w-3.5 h-3.5 fill-current" />
                              <span>Пауза</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-3.5 h-3.5 fill-current" />
                              <span>
                                {vs.remainingSeconds < currentStep.durationSeconds &&
                                vs.remainingSeconds > 0
                                  ? 'Продолжить'
                                  : 'Старт'}
                              </span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleResetCurrentStep(vs.vesselId)}
                          title="Сбросить шаг"
                          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition active:scale-95"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleNextStep(vs.vesselId)}
                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1 transition active:scale-95"
                      >
                        <span>
                          {vs.currentStepIdx + 1 < vs.steps.length ? 'Далее' : 'Завершить'}
                        </span>
                        <SkipForward className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Compact Steps List */}
                <div className="space-y-1">
                  {vs.steps.map((st, sIdx) => {
                    const isDone = vs.isVesselCompleted || sIdx < vs.currentStepIdx;
                    const isCurrent = !vs.isVesselCompleted && sIdx === vs.currentStepIdx;

                    return (
                      <button
                        key={st.stepNumber}
                        type="button"
                        onClick={() => handleSelectStep(vs.vesselId, sIdx)}
                        className={`w-full text-left p-1.5 rounded-lg border text-xs flex items-center justify-between gap-2 transition ${
                          isCurrent
                            ? 'bg-emerald-950/40 border-emerald-500/50 text-white'
                            : isDone
                            ? 'bg-slate-900/40 border-slate-800/50 text-slate-500'
                            : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className={`w-4 h-4 rounded-full text-[9px] font-mono font-bold flex items-center justify-center shrink-0 ${
                              isDone
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : isCurrent
                                ? 'bg-emerald-500 text-slate-950'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {isDone ? '✓' : st.stepNumber}
                          </span>
                          <span className="text-[9px] font-mono tabular-nums text-emerald-400 shrink-0">
                            {st.recipeStartMinute}м
                          </span>
                          <span className="truncate font-medium">
                            {st.items
                              .map((i) =>
                                isRegimeOnlyStepItem(i)
                                  ? 'Содержимое в посуде'
                                  : isVesselTransferItem(i)
                                  ? `${i.foodName} (~${i.grams}г)`
                                  : `${i.foodName} (${i.grams}г)`
                              )
                              .join(' + ')}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {st.regimeBadgeText && (
                            <span className="text-[9px] font-mono tabular-nums text-slate-400 hidden sm:inline">
                              {st.regimeBadgeText}
                            </span>
                          )}
                          <span className="text-[9px] font-mono tabular-nums text-amber-300">
                            {formatCompactDurationMinutes(st.durationMinutes)}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
