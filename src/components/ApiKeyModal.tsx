import React, { useState, useEffect } from 'react';
import { ThemeStyles } from '../utils/themeHelper';
import {
  Key,
  Check,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  X,
  CreditCard,
  Crown,
} from 'lucide-react';
import {
  STRIPE_PAYMENT_URL,
  getSavedAccessKey,
  saveAccessKey,
  getQuotaStatus,
} from '../utils/accessControl';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  themeStyles: ThemeStyles;
  accessKey?: string;
  onSaveAccessKey?: (key: string) => void;
  // Optional legacy props for compatibility
  aiConfig?: any;
  onSaveAiConfig?: (config: any) => void;
  remainingDemoRequests?: number;
  totalDemoLimit?: number;
  apiKey?: string;
  onSaveApiKey?: (key: string) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  themeStyles,
  accessKey,
  onSaveAccessKey,
  onSaveApiKey,
}) => {
  const [keyInput, setKeyInput] = useState<string>('');
  const [activatedSuccess, setActivatedSuccess] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const currentKey = accessKey !== undefined ? accessKey : getSavedAccessKey();
      setKeyInput(currentKey);
      setActivatedSuccess(false);
      setErrorMsg(null);
    }
  }, [isOpen, accessKey]);

  if (!isOpen) return null;

  const quota = getQuotaStatus();

  const handleActivateKey = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = keyInput.trim();
    if (!cleaned) {
      setErrorMsg('Пожалуйста, введите ключ доступа');
      return;
    }

    setErrorMsg(null);
    saveAccessKey(cleaned);
    onSaveAccessKey?.(cleaned);
    onSaveApiKey?.(cleaned);
    setActivatedSuccess(true);

    setTimeout(() => {
      setActivatedSuccess(false);
      onClose();
    }, 1100);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div
        className={`w-full max-w-md my-auto border ${themeStyles.borderColor} ${themeStyles.cardBg} rounded-2xl shadow-2xl overflow-hidden flex flex-col`}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/90 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/35 text-amber-400 flex items-center justify-center shrink-0">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 block">
                Годовой доступ
              </span>
              <h2 className="text-base font-extrabold text-white leading-tight">
                Полный доступ на 1 год
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Закрыть"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5 text-xs">
          {/* Status Pill */}
          <div
            className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${
              quota.hasAccessKey
                ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-200'
                : 'border-amber-500/40 bg-amber-950/25 text-amber-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {quota.hasAccessKey ? (
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              )}
              <span className="font-semibold">
                {quota.hasAccessKey ? 'Годовой доступ активен' : 'Пробный режим (20 запросов/сутки)'}
              </span>
            </div>
            <span className="font-mono font-bold text-[11px] px-2 py-0.5 rounded-lg bg-slate-900/80 border border-slate-700 text-white shrink-0">
              Осталось сегодня: {quota.remainingToday} / {quota.dailyLimit}
            </span>
          </div>

          {/* Description & Main CTA */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 space-y-4">
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
              Неограниченная база продуктов, до 100 ИИ-сканирований и рецептов в день, поддержка BLIK и банковских карт
            </p>

            <a
              href={STRIPE_PAYMENT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full min-h-[44px] py-3 px-4 rounded-xl font-bold text-xs sm:text-sm text-white shadow-lg flex items-center justify-center gap-2 transition active:scale-[0.99] hover:opacity-95"
              style={{
                background: 'linear-gradient(135deg, #10b981, #059669)',
              }}
            >
              <CreditCard className="w-4 h-4 shrink-0" />
              <span>Оформить доступ на 1 год</span>
              <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-80" />
            </a>
          </div>

          {/* Already have a key section */}
          <form
            onSubmit={handleActivateKey}
            className="pt-4 border-t border-slate-800/90 space-y-2.5"
          >
            <label className="block text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>У меня уже есть ключ</span>
            </label>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="text"
                value={keyInput}
                onChange={(e) => {
                  setKeyInput(e.target.value);
                  setErrorMsg(null);
                }}
                placeholder="Введите ваш ключ доступа..."
                className="flex-1 min-h-[40px] px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-900 text-white font-mono text-xs placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
              />
              <button
                type="submit"
                className="min-h-[40px] px-4 py-2 rounded-xl font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-500 transition flex items-center justify-center gap-1.5 shrink-0 active:scale-95"
              >
                {activatedSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Активировано!</span>
                  </>
                ) : (
                  <span>Активировать</span>
                )}
              </button>
            </div>

            {errorMsg && (
              <p className="text-[11px] text-red-400 font-medium">{errorMsg}</p>
            )}
            {activatedSuccess && (
              <p className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>Ключ годового доступа успешно сохранён!</span>
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
