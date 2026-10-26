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
  Loader2,
  AlertCircle,
  Smartphone,
} from 'lucide-react';
import {
  PAYMENT_PACKAGE_500_URL,
  PAID_PACKAGE_REQUESTS,
  STARTER_FREE_REQUESTS,
  MAX_DEVICES_PER_KEY,
  getSavedAccessKey,
  getQuotaStatus,
  verifyAndActivateAccessKey,
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
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [activatedSuccess, setActivatedSuccess] = useState<boolean>(false);
  const [successDetails, setSuccessDetails] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [, setQuotaTick] = useState<number>(0);

  useEffect(() => {
    const handleQuotaUpdate = () => setQuotaTick((t) => t + 1);
    window.addEventListener('sfa-quota-updated', handleQuotaUpdate);
    return () => window.removeEventListener('sfa-quota-updated', handleQuotaUpdate);
  }, []);

  useEffect(() => {
    if (isOpen) {
      const currentKey = accessKey !== undefined ? accessKey : getSavedAccessKey();
      const currentQuota = getQuotaStatus();
      // Если предыдущий ключ исчерпал все 500 запросов, очищаем поле для удобного ввода нового ключа
      setKeyInput(currentQuota.isKeyExhausted ? '' : currentKey);
      setActivatedSuccess(false);
      setSuccessDetails(null);
      setErrorMsg(null);
      setIsVerifying(false);
    }
  }, [isOpen, accessKey]);

  if (!isOpen) return null;

  const quota = getQuotaStatus();

  const handleActivateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = keyInput.trim();
    if (!cleaned) {
      setErrorMsg('Пожалуйста, введите ключ активации');
      return;
    }

    setErrorMsg(null);
    setSuccessDetails(null);
    setIsVerifying(true);

    try {
      const result = await verifyAndActivateAccessKey(cleaned);
      if (!result.valid) {
        setErrorMsg(
          result.error ||
            'Не удалось активировать ключ. Проверьте правильность кода или лимит устройств.'
        );
        setIsVerifying(false);
        return;
      }

      onSaveAccessKey?.(cleaned);
      onSaveApiKey?.(cleaned);
      setActivatedSuccess(true);
      const totalAvailable = result.remainingRequests ?? PAID_PACKAGE_REQUESTS;
      const totalLimit = result.packageLimit ?? Math.max(PAID_PACKAGE_REQUESTS, totalAvailable);
      const carryoverAdded = result.carryoverAdded ?? 0;

      setSuccessDetails(
        result.isMaster
          ? 'Мастер-ключ активирован! Включён полный безлимит запросов.'
          : carryoverAdded > 0
          ? `Ключ успешно активирован! Неизрасходованный остаток (+${carryoverAdded}) прибавлен к пакету ${PAID_PACKAGE_REQUESTS} — доступно запросов: ${totalAvailable}.`
          : `Ключ успешно активирован! Доступно запросов: ${totalAvailable} из ${totalLimit}.`
      );

      setTimeout(() => {
        setActivatedSuccess(false);
        onClose();
      }, 1600);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Ошибка при проверке ключа. Попробуйте ещё раз.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div
        className={`w-full max-w-md my-auto border ${themeStyles.borderColor} ${themeStyles.cardBg} rounded-2xl shadow-2xl overflow-hidden flex flex-col`}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/90 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/35 text-emerald-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 block">
                Баланс ИИ-запросов
              </span>
              <h2 className="text-base font-extrabold text-white leading-tight">
                Пакет на {PAID_PACKAGE_REQUESTS} ИИ-запросов
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
        <div className="p-5 space-y-4 text-xs">
          {/* Current Balance Status Box */}
          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between gap-2 ${
              quota.isMasterKey
                ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-200'
                : quota.remainingRequests > 0
                ? quota.hasAccessKey
                  ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-200'
                  : 'border-cyan-500/40 bg-cyan-950/25 text-cyan-200'
                : 'border-amber-500/50 bg-amber-950/30 text-amber-200'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              {quota.isMasterKey || quota.hasAccessKey ? (
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
              )}
              <div className="min-w-0">
                <span className="font-bold block truncate">
                  {quota.isMasterKey
                    ? 'Мастер-ключ владельца (Безлимит)'
                    : quota.hasAccessKey
                    ? quota.isKeyExhausted
                      ? 'Пакет запросов по ключу исчерпан'
                      : quota.packageLimit > PAID_PACKAGE_REQUESTS
                      ? `Пакет активен (${PAID_PACKAGE_REQUESTS} + остаток)`
                      : `Пакет ${PAID_PACKAGE_REQUESTS} запросов активен`
                    : `Стартовый пакет (${STARTER_FREE_REQUESTS} бесплатных)`}
                </span>
                <span className="text-[10px] opacity-80 block">
                  Без ограничения по сроку действия • остаток суммируется при новом ключе
                </span>
              </div>
            </div>

            <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-700 text-white shrink-0">
              {quota.isMasterKey
                ? 'Осталось: ∞'
                : `Осталось: ${quota.remainingRequests} / ${quota.packageLimit}`}
            </span>
          </div>

          {quota.isKeyExhausted && (
            <div className="p-3 rounded-xl border border-amber-500/40 bg-amber-950/30 text-amber-200 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">
                Все запросы по текущему ключу использованы. Приобретите новый пакет и введите новый ключ для следующих {PAID_PACKAGE_REQUESTS} запросов.
              </span>
            </div>
          )}

          {/* Package Description & Purchase Button */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 space-y-3.5">
            <div className="space-y-1.5">
              <div className="text-xs sm:text-sm font-bold text-white">
                Дополнительный пакет: +{PAID_PACKAGE_REQUESTS} ИИ-запросов
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Пакет на {PAID_PACKAGE_REQUESTS} обращений к нейросети <strong>без ограничения по сроку действия</strong> (сканирование этикеток по фото, расчёт продуктов по названию, генерация рецептов и расчёт суточной нормы). Поддержка оплаты через <strong>BLIK и банковские карты</strong>.
              </p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                • Неизрасходованные запросы не сгорают: при вводе нового ключа ваш текущий остаток автоматически прибавляется к {PAID_PACKAGE_REQUESTS} запросам.
              </p>
            </div>

            <a
              href={PAYMENT_PACKAGE_500_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full min-h-[44px] py-3 px-4 rounded-xl font-bold text-xs sm:text-sm text-white shadow-lg flex items-center justify-center gap-2 transition active:scale-[0.99] hover:opacity-95"
              style={{
                background: 'linear-gradient(135deg, #10b981, #059669)',
              }}
            >
              <CreditCard className="w-4 h-4 shrink-0" />
              <span>Купить пакет на {PAID_PACKAGE_REQUESTS} ИИ-запросов</span>
              <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-80" />
            </a>
          </div>

          {/* Key Activation Form */}
          <form
            onSubmit={handleActivateKey}
            className="pt-3.5 border-t border-slate-800/90 space-y-2.5"
          >
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Активировать ключ пакета</span>
              </label>
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <Smartphone className="w-3 h-3 text-slate-400 shrink-0" />
                <span>до {MAX_DEVICES_PER_KEY} устройств</span>
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative flex-1 flex items-center">
                <input
                  type="text"
                  value={keyInput}
                  onChange={(e) => {
                    setKeyInput(e.target.value);
                    setErrorMsg(null);
                  }}
                  disabled={isVerifying}
                  placeholder="Введите ключ активации на 500 запросов..."
                  className="w-full min-h-[40px] pl-3.5 pr-8 py-2 rounded-xl border border-slate-700 bg-slate-900 text-white font-mono text-xs placeholder-slate-500 focus:outline-hidden focus:border-emerald-500 disabled:opacity-60"
                />
                {keyInput && !isVerifying && (
                  <button
                    type="button"
                    onClick={() => {
                      setKeyInput('');
                      setErrorMsg(null);
                    }}
                    className="absolute right-2 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                    title="Очистить поле для ввода нового ключа"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <button
                type="submit"
                disabled={isVerifying}
                className="min-h-[40px] px-4 py-2 rounded-xl font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 transition flex items-center justify-center gap-1.5 shrink-0 active:scale-95"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Проверка...</span>
                  </>
                ) : activatedSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Активировано!</span>
                  </>
                ) : (
                  <span>Подтвердить</span>
                )}
              </button>
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-red-950/40 border border-red-500/40 text-[11px] text-red-300 font-medium flex items-start gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {activatedSuccess && (
              <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-[11px] text-emerald-300 font-semibold flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{successDetails || 'Ключ успешно активирован!'}</span>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
