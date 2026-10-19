import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Palette, Check, X, RotateCcw } from 'lucide-react';

export const POPULAR_NUTRIENT_COLORS = [
  { name: 'Синий (Белки)', hex: '#3b82f6' },
  { name: 'Жёлтый (Жиры)', hex: '#eab308' },
  { name: 'Красный (Углеводы)', hex: '#ef4444' },
  { name: 'Оранжевый (Калории)', hex: '#f97316' },
  { name: 'Зелёный (Клетчатка)', hex: '#22c55e' },
  { name: 'Изумрудный', hex: '#10b981' },
  { name: 'Голубой (Вода)', hex: '#06b6d4' },
  { name: 'Лазурный', hex: '#0284c7' },
  { name: 'Фиолетовый', hex: '#8b5cf6' },
  { name: 'Пурпурный', hex: '#a855f7' },
  { name: 'Розовый', hex: '#f43f5e' },
  { name: 'Янтарный', hex: '#f59e0b' },
  { name: 'Лаймовый', hex: '#84cc16' },
  { name: 'Бирюзовый', hex: '#14b8a6' },
  { name: 'Индиго', hex: '#6366f1' },
  { name: 'Стальной', hex: '#64748b' },
];

interface NutrientColorPickerProps {
  color: string;
  onChangeColor: (newColor: string) => void;
  nutrientLabel?: string;
  defaultColor?: string;
  size?: 'sm' | 'md';
  buttonVariant?: 'icon' | 'badge' | 'full';
}

export const NutrientColorPicker: React.FC<NutrientColorPickerProps> = ({
  color,
  onChangeColor,
  nutrientLabel,
  defaultColor,
  size = 'sm',
  buttonVariant = 'badge',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customHex, setCustomHex] = useState(color);
  const [isMobile, setIsMobile] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCustomHex(color);
  }, [color]);

  // Check screen size for mobile bottom sheet vs desktop popover
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Lock body scroll on mobile when sheet is open
  useEffect(() => {
    if (isOpen && isMobile) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen, isMobile]);

  // Click outside to close (desktop) and escape key listener
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (!isMobile && popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isMobile]);

  const handleSelectColor = (hex: string) => {
    setCustomHex(hex);
    onChangeColor(hex);
  };

  const handleApplyHex = (val: string) => {
    setCustomHex(val);
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
      onChangeColor(val);
    }
  };

  // Content for the color picker (shared between desktop popover and mobile bottom sheet)
  const renderPickerContent = (isSheetMode = false) => (
    <>
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="w-4 h-4 rounded-full ring-2 ring-white/30 shrink-0 shadow-xs"
            style={{ backgroundColor: color }}
          />
          <div className="min-w-0">
            <h4 className="text-sm font-bold text-white truncate">
              {nutrientLabel ? `Цвет: ${nutrientLabel}` : 'Выбор цвета'}
            </h4>
            <p className="text-[11px] text-slate-400">
              {isSheetMode ? 'Выберите оттенок для отображения нутриента' : 'Цвет в интерфейсе'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition active:scale-95"
          aria-label="Закрыть"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Quick preset swatches */}
      <div className="space-y-2 mb-4">
        <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block">
          Популярные оттенки
        </span>
        <div
          className={`grid gap-2 ${
            isSheetMode ? 'grid-cols-8 gap-2.5' : 'grid-cols-8 gap-1.5'
          }`}
        >
          {POPULAR_NUTRIENT_COLORS.map((p) => {
            const isSelected = p.hex.toLowerCase() === color.toLowerCase();
            return (
              <button
                key={p.hex}
                type="button"
                onClick={() => handleSelectColor(p.hex)}
                className={`rounded-xl transition-all flex items-center justify-center shadow-xs ${
                  isSheetMode ? 'h-9 w-full' : 'w-6 h-6 rounded-lg'
                } ${
                  isSelected
                    ? 'ring-2 ring-white scale-105 z-10 shadow-lg'
                    : 'hover:scale-105 opacity-90 hover:opacity-100 active:scale-95'
                }`}
                style={{ backgroundColor: p.hex }}
                title={p.name}
              >
                {isSelected && (
                  <Check
                    className={`${
                      isSheetMode ? 'w-4 h-4' : 'w-3.5 h-3.5'
                    } text-white stroke-[3] drop-shadow-md`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom color picker & Hex input */}
      <div className="pt-3 border-t border-slate-800 space-y-2.5">
        <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block">
          Произвольный оттенок
        </span>
        <div className="flex items-center gap-2">
          {/* Native color picker swatch */}
          <label className="relative cursor-pointer shrink-0">
            <input
              type="color"
              value={color}
              onChange={(e) => handleSelectColor(e.target.value)}
              className="opacity-0 absolute inset-0 w-9 h-9 cursor-pointer"
            />
            <div
              className="w-9 h-9 rounded-xl border border-slate-700 ring-1 ring-white/20 shadow-xs flex items-center justify-center transition hover:scale-105 active:scale-95"
              style={{ backgroundColor: color }}
              title="Открыть системную палитру"
            >
              <Palette className="w-4 h-4 text-white drop-shadow-md" />
            </div>
          </label>

          {/* Hex text input */}
          <div className="flex-1 flex items-center bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 font-mono text-xs">
            <span className="text-slate-500 mr-1 font-bold">#</span>
            <input
              type="text"
              maxLength={7}
              value={customHex.replace('#', '')}
              onChange={(e) => handleApplyHex(`#${e.target.value}`)}
              className="bg-transparent text-white w-full focus:outline-hidden uppercase font-semibold"
              placeholder="3B82F6"
            />
          </div>

          {/* Reset to standard preset if provided */}
          {defaultColor && (
            <button
              type="button"
              onClick={() => handleSelectColor(defaultColor)}
              className="p-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition active:scale-95 shrink-0"
              title={`Сбросить к исходному (${defaultColor})`}
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Done button */}
      <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className={`bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl font-bold transition active:scale-95 shadow-md flex items-center justify-center ${
            isSheetMode ? 'w-full py-2.5 text-sm' : 'px-4 py-1.5 text-xs'
          }`}
        >
          Готово
        </button>
      </div>
    </>
  );

  return (
    <div className="relative inline-block" ref={popoverRef}>
      {/* Trigger Button */}
      {buttonVariant === 'icon' && (
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="p-1.5 rounded-lg border border-slate-700/80 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition active:scale-95 flex items-center justify-center shrink-0 shadow-xs"
          title={`Изменить цвет: ${nutrientLabel || 'нутриент'}`}
        >
          <span
            className="w-3.5 h-3.5 rounded-full ring-1 ring-white/30 shrink-0"
            style={{ backgroundColor: color }}
          />
        </button>
      )}

      {buttonVariant === 'badge' && (
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="p-1.5 rounded-lg border border-slate-700/80 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition active:scale-95 flex items-center justify-center shrink-0 shadow-xs"
          title={`Цвет (${nutrientLabel || 'нутриент'})`}
        >
          <span
            className="w-3.5 h-3.5 rounded-full ring-1 ring-white/30 shrink-0 shadow-xs"
            style={{ backgroundColor: color }}
          />
        </button>
      )}

      {buttonVariant === 'full' && (
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:border-slate-600 transition active:scale-95 shrink-0 shadow-xs"
          title={`Изменить цвет (${nutrientLabel || 'нутриент'})`}
        >
          <span
            className="w-3 h-3 rounded-full ring-1 ring-white/40 shrink-0"
            style={{ backgroundColor: color }}
          />
          <Palette className="w-3.5 h-3.5 text-slate-400" />
          <span>Изменить цвет</span>
        </button>
      )}

      {/* Render Popover or Bottom Sheet */}
      {isOpen && (
        <>
          {/* Mobile: Bottom Sheet via React Portal */}
          {isMobile ? (
            createPortal(
              <div className="fixed inset-0 z-[100] flex flex-col justify-end">
                {/* Backdrop overlay */}
                <div
                  className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
                  onClick={() => setIsOpen(false)}
                />

                {/* Sheet Drawer */}
                <div
                  className="relative z-[101] w-full bg-slate-900 border-t border-slate-700/90 rounded-t-3xl p-5 pb-8 shadow-2xl max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-200"
                  role="dialog"
                  aria-modal="true"
                >
                  {/* Swipe / Grab bar */}
                  <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-4" />
                  {renderPickerContent(true)}
                </div>
              </div>,
              document.body
            )
          ) : (
            /* Desktop: Safe Popover Card */
            <div className="absolute right-0 top-full mt-2 z-50 w-72 p-3.5 rounded-2xl border border-slate-700 bg-slate-900/95 backdrop-blur-md shadow-2xl animate-in fade-in zoom-in-95 duration-150">
              {renderPickerContent(false)}
            </div>
          )}
        </>
      )}
    </div>
  );
};
