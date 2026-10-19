import React, { useState } from 'react';
import { ThemeStyles } from '../utils/themeHelper';
import { RotateCcw, AlertTriangle, X, Check, ShieldAlert } from 'lucide-react';

interface ResetConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmReset: (clearLogsToo: boolean) => void;
  themeStyles: ThemeStyles;
}

export const ResetConfirmModal: React.FC<ResetConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirmReset,
  themeStyles,
}) => {
  const [clearLogs, setClearLogs] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`w-full max-w-md border ${themeStyles.borderColor} ${themeStyles.cardBg} rounded-2xl shadow-2xl overflow-hidden flex flex-col`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-red-950/20">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>Восстановление первоначальной программы</span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Сброс всех настроек к заводскому состоянию
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          <div className="p-3.5 rounded-xl border border-amber-500/40 bg-amber-950/30 text-amber-200 space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-300">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Что будет восстановлено:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-300">
              <li>Все <b>исходные цели КБЖУ и калорий</b> (2200 ккал, 140г белка и т.д.)</li>
              <li>Базовые <b>приёмы пищи</b> (Завтрак, Обед, Ужин, Перекус)</li>
              <li><b>Защищённые языки</b>: Русский (активен), Английский, Польский</li>
              <li>Оригинальная <b>тёмная тема</b> и изумрудный акцент</li>
              <li>Все стандартные переключатели разделов интерфейса</li>
            </ul>
          </div>

          {/* Option to also reset meal diary logs */}
          <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-800 bg-slate-900/60 cursor-pointer hover:bg-slate-900 transition">
            <input
              type="checkbox"
              checked={clearLogs}
              onChange={(e) => setClearLogs(e.target.checked)}
              className="mt-0.5 rounded border-slate-700 text-emerald-500 focus:ring-emerald-500"
            />
            <div className="space-y-0.5">
              <span className="font-semibold text-slate-200">
                Очистить также дневник питания (записи съеденной еды)
              </span>
              <p className="text-[10px] text-slate-400">
                Если флажок снят, ваши съеденные блюда и история питания за сегодня останутся нетронутыми.
              </p>
            </div>
          </label>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/40 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3.5 py-2 text-xs rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition"
          >
            Отмена
          </button>
          <button
            onClick={() => onConfirmReset(clearLogs)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-red-600 hover:bg-red-500 text-white shadow-lg transition active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Восстановить программу</span>
          </button>
        </div>
      </div>
    </div>
  );
};
