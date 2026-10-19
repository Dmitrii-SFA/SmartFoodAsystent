import React, { useState, useEffect, useRef } from 'react';
import { CookwareType, HeatSource, GasLevel, OvenMode } from '../../types/config';
import {
  DetectedCookingMethodInfo,
  EXTRA_HEAT_SOURCES,
  resolveGasLevelNumber,
} from '../../utils/culinaryPhysics';
import { Flame, Thermometer, Waves, Sparkles, RotateCcw, Plus, X } from 'lucide-react';

interface StoveControllerProps {
  vesselType: CookwareType;
  heatSource: HeatSource;
  electricLevel?: number;
  gasLevel?: GasLevel;
  ovenTempC?: number;
  ovenMode?: OvenMode;
  extraMode?: string;
  hasLid?: boolean;
  cookingMode?: DetectedCookingMethodInfo;
  isStepOverride?: boolean;
  hasCustomStepRegime?: boolean;
  langCode?: string;
  onResetStepRegime?: () => void;
  onRemoveThermal?: () => void;
  onHeatSourceChange: (source: HeatSource) => void;
  onElectricLevelChange: (level: number) => void;
  onGasLevelChange: (level: GasLevel) => void;
  onOvenTempChange: (temp: number) => void;
  onOvenModeChange: (mode: OvenMode) => void;
  onExtraModeChange?: (mode: string) => void;
  onHasLidChange?: (hasLid: boolean) => void;
}

export const StoveController: React.FC<StoveControllerProps> = ({
  heatSource,
  electricLevel = 5,
  gasLevel = 5,
  ovenTempC = 180,
  ovenMode = 'top_bottom',
  extraMode,
  hasLid = false,
  cookingMode,
  isStepOverride = false,
  hasCustomStepRegime = false,
  langCode = 'ru',
  onResetStepRegime,
  onRemoveThermal,
  onHeatSourceChange,
  onElectricLevelChange,
  onGasLevelChange,
  onOvenTempChange,
  onOvenModeChange,
  onExtraModeChange,
  onHasLidChange,
}) => {
  const [ovenTempStr, setOvenTempStr] = useState<string>(String(ovenTempC));
  const [isExtraPickerOpen, setIsExtraPickerOpen] = useState<boolean>(false);
  const knobRef = useRef<HTMLDivElement | null>(null);
  const [isDraggingKnob, setIsDraggingKnob] = useState<boolean>(false);

  const c = (langCode || 'ru').toLowerCase();
  const isEn = c.startsWith('en');
  const isPl = c.startsWith('pl');

  const numericGasLevel = resolveGasLevelNumber(gasLevel);

  useEffect(() => {
    setOvenTempStr(String(ovenTempC));
  }, [ovenTempC]);

  const activeExtraDef = EXTRA_HEAT_SOURCES.find((e) => e.id === heatSource);

  const OVEN_MODES: { id: OvenMode; label: string; icon: string }[] = [
    {
      id: 'top_bottom',
      label: isEn ? 'Top + Bottom' : isPl ? 'Góra + Dół' : 'Верх + Низ',
      icon: '↕️',
    },
    {
      id: 'convection',
      label: isEn ? 'Convection 💨' : isPl ? 'Termoobieg 💨' : 'Конвекция 💨',
      icon: '🌀',
    },
    {
      id: 'grill',
      label: isEn ? 'Grill 🔥' : isPl ? 'Grill 🔥' : 'Гриль 🔥',
      icon: '〰️',
    },
    {
      id: 'turbo_grill',
      label: isEn ? 'Turbo Grill' : isPl ? 'Turbo Grill' : 'Турбо-гриль',
      icon: '⚡',
    },
    {
      id: 'bottom_only',
      label: isEn ? 'Bottom Only' : isPl ? 'Tylko dół' : 'Только низ',
      icon: '⬇️',
    },
  ];

  const getPowerDescription = (lvl: number) => {
    if (lvl <= 2) {
      return isEn ? 'Simmer (Min)' : isPl ? 'Minimalny (Duszenie)' : 'Томление (мин)';
    }
    if (lvl <= 4) {
      return isEn ? 'Gentle / Low heat' : isPl ? 'Mały ogień' : 'Малый нагрев';
    }
    if (lvl <= 6) {
      return isEn ? 'Medium heat' : isPl ? 'Średni ogień' : 'Средний нагрев';
    }
    if (lvl <= 8) {
      return isEn ? 'High heat' : isPl ? 'Duży ogień' : 'Сильный огонь';
    }
    return isEn ? 'Max Turbo Flame' : isPl ? 'Maksymalny płomień' : 'Максимальный жар';
  };

  // Convert pointer position relative to rotary knob center into level 1..9
  // Angle mapping: -135 deg (bottom-left) = 1, 0 deg (top) = 5, +135 deg (bottom-right) = 9
  const updateGasFromPointer = (clientX: number, clientY: number) => {
    const el = knobRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = clientX - cx;
    const dy = clientY - cy;
    // Angle in degrees where 0 is straight up (12 o'clock), -90 is 9 o'clock, +90 is 3 o'clock
    let deg = Math.atan2(dx, -dy) * (180 / Math.PI);
    // Clamp to [-135, 135]
    if (deg < -135) deg = -135;
    if (deg > 135) deg = 135;
    const normalized = (deg + 135) / 270; // 0..1
    const newLevel = Math.max(1, Math.min(9, Math.round(1 + normalized * 8)));
    onGasLevelChange(newLevel);
  };

  const knobAngleDeg = -135 + ((numericGasLevel - 1) / 8) * 270;

  const renderCookingModeBadge = () => {
    if (!cookingMode) return null;
    return (
      <div
        className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] font-bold shrink-0 ${cookingMode.badgeColor}`}
      >
        {cookingMode.method === 'boiling' && <Waves className="w-3 h-3" />}
        {cookingMode.method === 'stewing' && <Sparkles className="w-3 h-3" />}
        {cookingMode.method === 'frying' && <Flame className="w-3 h-3" />}
        {cookingMode.method === 'baking' && <Thermometer className="w-3 h-3" />}
        <span>{cookingMode.label}</span>
      </div>
    );
  };

  return (
    <div className="p-2.5 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2.5">
      {/* Top Row: Main 3 Heat Sources (Электро, Газ, Духовка) + [+] Button on the right & Lid Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-1.5">
        <div className="flex items-center gap-1 flex-wrap">
          <button
            type="button"
            onClick={() => {
              onHeatSourceChange('electric');
              setIsExtraPickerOpen(false);
            }}
            className={`min-h-[34px] px-2.5 py-1 rounded-lg text-[11px] font-semibold transition flex items-center gap-1 ${
              heatSource === 'electric'
                ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <span>⚡</span>
            <span>{isEn ? 'Electric' : isPl ? 'Elektryczna' : 'Электро'}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              onHeatSourceChange('gas');
              setIsExtraPickerOpen(false);
            }}
            className={`min-h-[34px] px-2.5 py-1 rounded-lg text-[11px] font-semibold transition flex items-center gap-1 ${
              heatSource === 'gas'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <span>🔥</span>
            <span>{isEn ? 'Gas' : isPl ? 'Gaz' : 'Газ'}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              onHeatSourceChange('oven');
              setIsExtraPickerOpen(false);
            }}
            className={`min-h-[34px] px-2.5 py-1 rounded-lg text-[11px] font-semibold transition flex items-center gap-1 ${
              heatSource === 'oven'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <span>♨️</span>
            <span>{isEn ? 'Oven' : isPl ? 'Piekarnik' : 'Духовка'}</span>
          </button>

          {/* [+] Button on the right for extra cooking methods */}
          <button
            type="button"
            onClick={() => setIsExtraPickerOpen((prev) => !prev)}
            className={`min-h-[34px] px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
              activeExtraDef
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : isExtraPickerOpen
                ? 'bg-slate-800 text-white border border-slate-600'
                : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
            }`}
            title={
              isEn
                ? 'More appliances (steamer, grill, airfryer, multicooker...)'
                : isPl
                ? 'Więcej urządzeń (parowar, grill, airfryer, multicooker...)'
                : 'Дополнительные виды готовки (пароварка, гриль, аэрогриль, мультиварка и др.)'
            }
          >
            {activeExtraDef ? (
              <>
                <span>{activeExtraDef.icon}</span>
                <span>{activeExtraDef.shortLabel}</span>
                <Plus className="w-3 h-3 ml-0.5 text-emerald-400" />
              </>
            ) : (
              <Plus className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Lid Toggle (С крышкой / Без крышки) */}
          {onHasLidChange && (
            <button
              type="button"
              onClick={() => onHasLidChange(!hasLid)}
              className={`min-h-[34px] px-2.5 py-1 rounded-lg text-[10px] font-bold border transition flex items-center gap-1 ${
                hasLid
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border-slate-800'
              }`}
            >
              <span>
                {hasLid
                  ? isEn
                    ? '盖 With Lid'
                    : isPl
                    ? '盖 Z pokrywką'
                    : '盖 С крышкой'
                  : isEn
                  ? 'No Lid'
                  : isPl
                  ? 'Bez pokrywki'
                  : 'Без крышки'}
              </span>
            </button>
          )}

          {renderCookingModeBadge()}

          {isStepOverride && hasCustomStepRegime && onResetStepRegime && (
            <button
              type="button"
              onClick={onResetStepRegime}
              className="min-h-[34px] px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 text-[10px] flex items-center gap-1"
              title={
                isEn
                  ? 'Reset to previous step regime'
                  : isPl
                  ? 'Przywróć ustawienia z poprzedniego kroku'
                  : 'Вернуть как на предыдущем шаге'
              }
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          )}

          {onRemoveThermal && (
            <button
              type="button"
              onClick={onRemoveThermal}
              className="min-h-[34px] px-2 py-1 rounded-lg bg-slate-900 hover:bg-red-950/50 text-slate-400 hover:text-red-300 border border-slate-800 text-[10px] flex items-center gap-0.5"
              title={
                isEn
                  ? 'Remove heat from this step'
                  : isPl
                  ? 'Usuń obróbkę cieplną z tego kroku'
                  : 'Убрать термообработку из этого шага'
              }
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Expandable Extra Cooking Methods Palette when [+] is clicked */}
      {isExtraPickerOpen && (
        <div className="p-2 rounded-xl bg-slate-900/95 border border-slate-700/80 space-y-1.5 animate-in fade-in duration-150">
          <div className="flex items-center justify-between text-[10px] text-slate-400 px-0.5">
            <span className="font-bold text-slate-300">
              {isEn
                ? 'Additional thermal appliances:'
                : isPl
                ? 'Dodatkowe sposoby obróbki cieplnej:'
                : 'Дополнительные способы термообработки:'}
            </span>
            <button
              type="button"
              onClick={() => setIsExtraPickerOpen(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
            {EXTRA_HEAT_SOURCES.map((extra) => {
              const isSelected = heatSource === extra.id;
              return (
                <button
                  key={extra.id}
                  type="button"
                  onClick={() => {
                    onHeatSourceChange(extra.id);
                    if (extra.controlType === 'temp' && extra.defaultTempC) {
                      onOvenTempChange(extra.defaultTempC);
                    }
                    if (
                      extra.controlType === 'program' &&
                      extra.defaultProgram &&
                      onExtraModeChange
                    ) {
                      onExtraModeChange(extra.defaultProgram);
                    }
                    setIsExtraPickerOpen(false);
                  }}
                  className={`px-2 py-1.5 rounded-lg text-[10px] font-semibold border text-left flex items-center gap-1.5 transition ${
                    isSelected
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-slate-950/80 text-slate-300 hover:bg-slate-800 border-slate-800'
                  }`}
                >
                  <span className="text-xs shrink-0">{extra.icon}</span>
                  <span className="truncate">{extra.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 1. ELECTRIC STOVE (Levels 1-9) */}
      {heatSource === 'electric' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300"
                style={{
                  borderColor: `rgba(239, 68, 68, ${0.25 + (electricLevel / 9) * 0.75})`,
                  boxShadow: `0 0 ${electricLevel * 2}px rgba(239, 68, 68, ${
                    (electricLevel / 9) * 0.6
                  })`,
                  background: `radial-gradient(circle, rgba(239,68,68,${
                    (electricLevel / 9) * 0.45
                  }) 0%, rgba(15,23,42,0.9) 80%)`,
                }}
              >
                <span className="text-[10px] font-mono tabular-nums font-bold text-red-300">
                  {electricLevel}
                </span>
              </div>
              <span className="text-[11px] text-slate-300 font-medium">
                {isEn ? 'Power:' : isPl ? 'Moc:' : 'Мощность:'}{' '}
                <b className="text-red-400 font-mono tabular-nums">{electricLevel} / 9</b>
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              {getPowerDescription(electricLevel)}
            </span>
          </div>

          <div className="grid grid-cols-9 gap-1">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((lvl) => {
              const active = electricLevel === lvl;
              const passed = lvl <= electricLevel;
              return (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => onElectricLevelChange(lvl)}
                  className={`min-h-[34px] py-1 rounded-md font-mono tabular-nums text-[11px] font-bold transition ${
                    active
                      ? 'bg-red-500 text-white shadow-sm scale-105'
                      : passed
                      ? 'bg-red-500/25 text-red-300 border border-red-500/30'
                      : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  {lvl}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. GAS STOVE — Interactive Rotary Knob ("Крутилка") + Smooth Flame Adjustment 1-9 */}
      {heatSource === 'gas' && (
        <div className="p-3 rounded-xl bg-slate-900/75 border border-slate-800/90 flex flex-col sm:flex-row items-center gap-4">
          {/* Left: Interactive Rotary Stove Knob with Surrounding 1..9 Scale & Flame Glow */}
          <div className="flex flex-col items-center shrink-0">
            <div className="relative w-32 h-32 flex items-center justify-center select-none touch-none">
              {/* Outer 1..9 tick labels around the rotary knob */}
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((lvl) => {
                const tickDeg = -135 + ((lvl - 1) / 8) * 270;
                const tickRad = ((tickDeg - 90) * Math.PI) / 180;
                const radius = 54;
                const tx = Math.cos(tickRad) * radius;
                const ty = Math.sin(tickRad) * radius;
                const isSelected = numericGasLevel === lvl;
                const isPassed = lvl <= numericGasLevel;
                return (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => onGasLevelChange(lvl)}
                    style={{
                      transform: `translate(${tx}px, ${ty}px)`,
                    }}
                    className={`absolute w-5 h-5 rounded-full text-[10px] font-mono tabular-nums font-bold flex items-center justify-center transition ${
                      isSelected
                        ? 'bg-sky-500 text-white shadow-md shadow-sky-500/50 scale-110'
                        : isPassed
                        ? 'text-sky-300 hover:text-white'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {lvl}
                  </button>
                );
              })}

              {/* Animated Gas Burner Flame Ring Glow */}
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200"
                style={{
                  boxShadow:
                    numericGasLevel >= 7
                      ? `0 0 ${12 + numericGasLevel * 2}px rgba(245, 158, 11, 0.55), 0 0 ${
                          6 + numericGasLevel * 2
                        }px rgba(56, 189, 248, 0.7)`
                      : `0 0 ${8 + numericGasLevel * 2.5}px rgba(56, 189, 248, ${
                          0.25 + (numericGasLevel / 9) * 0.55
                        })`,
                }}
              >
                {/* Interactive Rotary Knob Body */}
                <div
                  ref={knobRef}
                  onPointerDown={(e) => {
                    e.currentTarget.setPointerCapture(e.pointerId);
                    setIsDraggingKnob(true);
                    updateGasFromPointer(e.clientX, e.clientY);
                  }}
                  onPointerMove={(e) => {
                    if (!isDraggingKnob) return;
                    updateGasFromPointer(e.clientX, e.clientY);
                  }}
                  onPointerUp={(e) => {
                    if (isDraggingKnob) {
                      setIsDraggingKnob(false);
                      try {
                        e.currentTarget.releasePointerCapture(e.pointerId);
                      } catch {
                        // ignore
                      }
                    }
                  }}
                  onPointerCancel={() => setIsDraggingKnob(false)}
                  className="w-18 h-18 rounded-full bg-gradient-to-b from-slate-700 via-slate-800 to-slate-950 border-2 border-slate-600 shadow-inner cursor-grab active:cursor-grabbing flex items-center justify-center relative"
                  title={
                    isEn
                      ? 'Drag or tap numbers 1–9 to adjust gas flame'
                      : isPl
                      ? 'Obróć pokrętło lub kliknij 1–9, aby ustawić płomień'
                      : 'Поверните ручку пальцем или нажмите на цифру 1–9'
                  }
                >
                  {/* Rotating Handle Ridge & Pointer Notch */}
                  <div
                    className="w-full h-full rounded-full transition-transform duration-100 flex items-center justify-center"
                    style={{ transform: `rotate(${knobAngleDeg}deg)` }}
                  >
                    {/* Notch indicator pointing toward current level */}
                    <div
                      className={`w-1.5 h-5 rounded-full absolute top-1.5 ${
                        numericGasLevel >= 7
                          ? 'bg-amber-400 shadow-xs shadow-amber-400'
                          : 'bg-sky-400 shadow-xs shadow-sky-400'
                      }`}
                    />
                    {/* Center metallic ridge */}
                    <div className="w-3 h-10 rounded-full bg-slate-600/50 border border-slate-500/40" />
                  </div>

                  {/* Center badge showing current level */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="px-1.5 py-0.5 rounded-md bg-slate-950/90 border border-slate-700 text-xs font-mono tabular-nums font-extrabold text-sky-300">
                      {numericGasLevel}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5">
              {isEn
                ? 'Turn knob (1–9)'
                : isPl
                ? 'Pokrętło gazu (1–9)'
                : 'Поворотная ручка газа'}
            </span>
          </div>

          {/* Right: Flame Indicator + Smooth Slider + 1..9 Quick Buttons */}
          <div className="flex-1 w-full space-y-2.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <div className="flex items-center -space-x-1">
                  {Array.from({ length: Math.min(5, Math.ceil(numericGasLevel / 2)) }).map(
                    (_, idx) => (
                      <Flame
                        key={idx}
                        className="w-4 h-4 transition-transform"
                        style={{
                          color: numericGasLevel >= 7 ? '#f59e0b' : '#38bdf8',
                          fill: numericGasLevel >= 7 ? '#f59e0b' : '#38bdf8',
                        }}
                      />
                    )
                  )}
                </div>
                <span className="text-xs text-slate-200 font-semibold">
                  {isEn ? 'Gas Flame:' : isPl ? 'Płomień gazu:' : 'Уровень газа:'}{' '}
                  <b className="text-sky-400 font-mono tabular-nums">{numericGasLevel} / 9</b>
                </span>
              </div>
              <span className="text-[11px] font-semibold text-sky-300 font-mono">
                {getPowerDescription(numericGasLevel)}
              </span>
            </div>

            {/* Smooth Range Slider 1..9 */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-slate-400">1</span>
              <input
                type="range"
                min={1}
                max={9}
                step={1}
                value={numericGasLevel}
                onChange={(e) => onGasLevelChange(Number(e.target.value))}
                className="flex-1 accent-sky-400 cursor-pointer h-2 rounded-lg"
              />
              <span className="text-[10px] font-mono text-slate-400">9</span>
            </div>

            {/* Direct 1..9 Level Buttons */}
            <div className="grid grid-cols-9 gap-1">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((lvl) => {
                const active = numericGasLevel === lvl;
                const passed = lvl <= numericGasLevel;
                return (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => onGasLevelChange(lvl)}
                    className={`min-h-[34px] py-1 rounded-md font-mono tabular-nums text-[11px] font-bold transition ${
                      active
                        ? 'bg-sky-500 text-white shadow-sm scale-105'
                        : passed
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-500/35'
                        : 'bg-slate-950 text-slate-400 hover:bg-slate-800 border border-slate-800'
                    }`}
                  >
                    {lvl}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 3. OVEN (Temperature 30-350°C + Mode) */}
      {heatSource === 'oven' && (
        <div className="space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Thermometer className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-[11px] text-slate-300 font-medium">
                {isEn ? 'Temperature:' : isPl ? 'Temperatura:' : 'Температура:'}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-1 max-w-xs">
              <input
                type="range"
                min={50}
                max={300}
                step={5}
                value={ovenTempC}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setOvenTempStr(String(val));
                  onOvenTempChange(val);
                }}
                className="flex-1 accent-amber-500 cursor-pointer"
              />
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={30}
                  max={350}
                  value={ovenTempStr}
                  onChange={(e) => {
                    const v = e.target.value;
                    setOvenTempStr(v);
                    if (v !== '' && !isNaN(Number(v))) {
                      onOvenTempChange(Number(v));
                    }
                  }}
                  onBlur={() => {
                    if (ovenTempStr === '' || isNaN(Number(ovenTempStr))) {
                      setOvenTempStr(String(ovenTempC || 180));
                    }
                  }}
                  className="w-14 px-1.5 py-1 rounded bg-slate-900 border border-slate-700 text-amber-300 font-mono tabular-nums text-xs text-center font-bold"
                />
                <span className="text-[11px] text-slate-400 font-mono">°C</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-1">
            {OVEN_MODES.map((m) => {
              const active = ovenMode === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onOvenModeChange(m.id)}
                  className={`min-h-[32px] px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition flex items-center gap-1 ${
                    active
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  <span>{m.icon}</span>
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. EXTRA COOKING APPLIANCES */}
      {activeExtraDef && (
        <div className="space-y-2 pt-0.5">
          {activeExtraDef.controlType === 'temp' && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-sm">{activeExtraDef.icon}</span>
                <span className="text-[11px] text-slate-300 font-medium">
                  {activeExtraDef.label} —{' '}
                  {isEn ? 'temperature:' : isPl ? 'temperatura:' : 'температура:'}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-1 max-w-xs">
                <input
                  type="range"
                  min={activeExtraDef.minTempC || 40}
                  max={activeExtraDef.maxTempC || 250}
                  step={5}
                  value={ovenTempC}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setOvenTempStr(String(val));
                    onOvenTempChange(val);
                  }}
                  className="flex-1 accent-emerald-500 cursor-pointer"
                />
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={activeExtraDef.minTempC || 20}
                    max={activeExtraDef.maxTempC || 300}
                    value={ovenTempStr}
                    onChange={(e) => {
                      const v = e.target.value;
                      setOvenTempStr(v);
                      if (v !== '' && !isNaN(Number(v))) {
                        onOvenTempChange(Number(v));
                      }
                    }}
                    onBlur={() => {
                      if (ovenTempStr === '' || isNaN(Number(ovenTempStr))) {
                        setOvenTempStr(String(ovenTempC || activeExtraDef.defaultTempC || 180));
                      }
                    }}
                    className="w-14 px-1.5 py-1 rounded bg-slate-900 border border-slate-700 text-emerald-300 font-mono tabular-nums text-xs text-center font-bold"
                  />
                  <span className="text-[11px] text-slate-400 font-mono">°C</span>
                </div>
              </div>
            </div>
          )}

          {activeExtraDef.controlType === 'program' && activeExtraDef.programs && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-300 font-medium">
                <span>{activeExtraDef.icon}</span>
                <span>
                  {activeExtraDef.label} — {isEn ? 'mode:' : isPl ? 'tryb:' : 'режим:'}
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {activeExtraDef.programs.map((prog) => {
                  const currentProg = extraMode || activeExtraDef.defaultProgram;
                  const active = currentProg === prog.id;
                  return (
                    <button
                      key={prog.id}
                      type="button"
                      onClick={() => onExtraModeChange && onExtraModeChange(prog.id)}
                      className={`min-h-[32px] px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition ${
                        active
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {prog.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
