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
  langCode?: string;
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
  langCode = 'en',
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

  const c = (langCode || 'en').toLowerCase();
  const isRu = c.startsWith('ru');
  const isPl = c.startsWith('pl');

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
  const carryoverPreviewCount = !quota.isMasterKey ? Math.max(0, quota.remainingRequests) : 0;
  const projectedTotalOnNewKey = PAID_PACKAGE_REQUESTS + carryoverPreviewCount;

  const handleActivateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = keyInput.trim();
    if (!cleaned) {
      setErrorMsg(
        isRu
          ? 'Пожалуйста, введите ключ активации'
          : isPl
          ? 'Wprowadź klucz aktywacyjny'
          : 'Please enter an activation key'
      );
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
            (isRu
              ? 'Не удалось активировать ключ. Проверьте правильность кода или лимит устройств.'
              : isPl
              ? 'Nie udało się aktywować klucza. Sprawdź kod lub limit urządzeń.'
              : 'Failed to activate key. Please check the code or device limit.')
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
          ? isRu
            ? 'Мастер-ключ активирован! Включён полный безлимит запросов.'
            : isPl
            ? 'Klucz główny aktywowany! Odblokowano nielimitowane zapytania.'
            : 'Master key activated! Unlimited AI requests enabled.'
          : carryoverAdded > 0
          ? isRu
            ? `Ключ активирован! Ваш остаток (+${carryoverAdded}) прибавлен к ${PAID_PACKAGE_REQUESTS} → итого доступно: ${totalAvailable} запросов.`
            : isPl
            ? `Klucz aktywowany! Pozostałe zapytania (+${carryoverAdded}) dodano do ${PAID_PACKAGE_REQUESTS} → łącznie: ${totalAvailable}.`
            : `Key activated! Your remaining balance (+${carryoverAdded}) was added to ${PAID_PACKAGE_REQUESTS} → ${totalAvailable} total requests available.`
          : isRu
          ? `Ключ успешно активирован! Доступно запросов: ${totalAvailable} из ${totalLimit}.`
          : isPl
          ? `Klucz aktywowany! Dostępne zapytania: ${totalAvailable} z ${totalLimit}.`
          : `Key activated! Available requests: ${totalAvailable} of ${totalLimit}.`
      );

      setTimeout(() => {
        setActivatedSuccess(false);
        onClose();
      }, 1800);
    } catch (err: any) {
      setErrorMsg(
        err?.message ||
          (isRu
            ? 'Ошибка при проверке ключа. Попробуйте ещё раз.'
            : isPl
            ? 'Błąd podczas weryfikacji klucza. Spróbuj ponownie.'
            : 'Error verifying key. Please try again.')
      );
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
                {isRu ? 'Баланс ИИ-запросов' : isPl ? 'Saldo zapytań AI' : 'AI Requests Balance'}
              </span>
              <h2 className="text-base font-extrabold text-white leading-tight">
                {isRu
                  ? `Пакет на ${PAID_PACKAGE_REQUESTS} ИИ-запросов`
                  : isPl
                  ? `Pakiet ${PAID_PACKAGE_REQUESTS} zapytań AI`
                  : `${PAID_PACKAGE_REQUESTS} AI Requests Package`}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label={isRu ? 'Закрыть' : isPl ? 'Zamknij' : 'Close'}
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
                    ? isRu
                      ? 'Мастер-ключ владельца (Безлимит)'
                      : isPl
                      ? 'Klucz główny właściciela (Bez limitu)'
                      : 'Owner Master Key (Unlimited)'
                    : quota.hasAccessKey
                    ? quota.isKeyExhausted
                      ? isRu
                        ? 'Пакет запросов по ключу исчерпан'
                        : isPl
                        ? 'Pakiet zapytań dla klucza wyczerpany'
                        : 'Key request package exhausted'
                      : quota.packageLimit > PAID_PACKAGE_REQUESTS
                      ? isRu
                        ? `Пакет активен (${PAID_PACKAGE_REQUESTS} + остаток)`
                        : isPl
                        ? `Pakiet aktywny (${PAID_PACKAGE_REQUESTS} + pozostałe)`
                        : `Package active (${PAID_PACKAGE_REQUESTS} + carryover)`
                      : isRu
                      ? `Пакет ${PAID_PACKAGE_REQUESTS} запросов активен`
                      : isPl
                      ? `Pakiet ${PAID_PACKAGE_REQUESTS} zapytań aktywny`
                      : `${PAID_PACKAGE_REQUESTS} requests package active`
                    : isRu
                    ? `Стартовый пакет (${STARTER_FREE_REQUESTS} бесплатных)`
                    : isPl
                    ? `Pakiet startowy (${STARTER_FREE_REQUESTS} darmowych)`
                    : `Starter package (${STARTER_FREE_REQUESTS} free)`}
                </span>
                <span className="text-[10px] opacity-80 block">
                  {isRu
                    ? 'Без ограничения по сроку действия • остаток суммируется при новом ключе'
                    : isPl
                    ? 'Bez terminu ważności • pozostałe zapytania sumują się z nowym kluczem'
                    : 'No expiration date • remaining balance adds up when activating a new key'}
                </span>
              </div>
            </div>

            <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-700 text-white shrink-0">
              {quota.isMasterKey
                ? isRu
                  ? 'Осталось: ∞'
                  : isPl
                  ? 'Pozostało: ∞'
                  : 'Left: ∞'
                : isRu
                ? `Осталось: ${quota.remainingRequests} / ${quota.packageLimit}`
                : isPl
                ? `Pozostało: ${quota.remainingRequests} / ${quota.packageLimit}`
                : `Left: ${quota.remainingRequests} / ${quota.packageLimit}`}
            </span>
          </div>

          {quota.isKeyExhausted && (
            <div className="p-3 rounded-xl border border-amber-500/40 bg-amber-950/30 text-amber-200 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">
                {isRu
                  ? `Все запросы по текущему ключу использованы. Приобретите новый пакет и введите новый ключ для следующих ${PAID_PACKAGE_REQUESTS} запросов.`
                  : isPl
                  ? `Wszystkie zapytania dla obecnego klucza zostały wykorzystane. Kup nowy pakiet i wprowadź nowy klucz na kolejne ${PAID_PACKAGE_REQUESTS} zapytań.`
                  : `All requests for the current key have been used. Purchase a new package and enter a new key for the next ${PAID_PACKAGE_REQUESTS} requests.`}
              </span>
            </div>
          )}

          {/* Package Description & Purchase Button */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 space-y-3.5">
            <div className="space-y-1.5">
              <div className="text-xs sm:text-sm font-bold text-white">
                {isRu
                  ? `Дополнительный пакет: +${PAID_PACKAGE_REQUESTS} ИИ-запросов`
                  : isPl
                  ? `Dodatkowy pakiet: +${PAID_PACKAGE_REQUESTS} zapytań AI`
                  : `Add-on Package: +${PAID_PACKAGE_REQUESTS} AI Requests`}
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {isRu ? (
                  <>
                    Пакет на {PAID_PACKAGE_REQUESTS} обращений к нейросети{' '}
                    <strong>без ограничения по сроку действия</strong> (сканирование этикеток по фото,
                    расчёт продуктов по названию, генерация рецептов и расчёт суточной нормы).
                    Поддержка оплаты через <strong>BLIK и банковские карты</strong>.
                  </>
                ) : isPl ? (
                  <>
                    Pakiet {PAID_PACKAGE_REQUESTS} zapytań AI{' '}
                    <strong>bez ograniczenia czasowego</strong> (skanowanie etykiet ze zdjęć,
                    obliczanie produktów po nazwie, generowanie przepisów i dziennego zapotrzebowania).
                    Płatność przez <strong>BLIK i karty płatnicze</strong>.
                  </>
                ) : (
                  <>
                    Package of {PAID_PACKAGE_REQUESTS} AI requests{' '}
                    <strong>with no expiration date</strong> (nutrition label photo scanning, food
                    estimation by name, step-by-step recipe generation, and daily norm calculation).
                    Supports <strong>BLIK &amp; bank cards</strong>.
                  </>
                )}
              </p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {isRu
                  ? `• Неизрасходованные запросы не сгорают: при вводе нового ключа ваш текущий остаток автоматически прибавляется к ${PAID_PACKAGE_REQUESTS} запросам.`
                  : isPl
                  ? `• Niewykorzystane zapytania nie przepadają: po wpisaniu nowego klucza obecne saldo zostanie automatycznie dodane do ${PAID_PACKAGE_REQUESTS} zapytań.`
                  : `• Unused requests never expire: when you enter a new key, your current remaining balance is automatically added to the ${PAID_PACKAGE_REQUESTS} requests.`}
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
              <span>
                {isRu
                  ? `Купить пакет на ${PAID_PACKAGE_REQUESTS} ИИ-запросов`
                  : isPl
                  ? `Kup pakiet ${PAID_PACKAGE_REQUESTS} zapytań AI`
                  : `Buy ${PAID_PACKAGE_REQUESTS} AI Requests Package`}
              </span>
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
                <span>
                  {isRu
                    ? 'Активировать ключ пакета'
                    : isPl
                    ? 'Aktywuj klucz pakietu'
                    : 'Activate Package Key'}
                </span>
              </label>
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <Smartphone className="w-3 h-3 text-slate-400 shrink-0" />
                <span>
                  {isRu
                    ? `до ${MAX_DEVICES_PER_KEY} устройств`
                    : isPl
                    ? `do ${MAX_DEVICES_PER_KEY} urządzeń`
                    : `up to ${MAX_DEVICES_PER_KEY} devices`}
                </span>
              </span>
            </div>

            {carryoverPreviewCount > 0 && (
              <div className="px-3 py-2 rounded-xl bg-emerald-950/35 border border-emerald-500/30 text-[11px] text-emerald-200 flex items-center justify-between gap-2">
                <span>
                  {isRu
                    ? `При вводе нового ключа остаток суммируется:`
                    : isPl
                    ? `Nowy klucz zsumuje pozostałe zapytania:`
                    : `New key will add your remaining balance:`}
                </span>
                <span className="font-mono font-bold text-emerald-300 shrink-0">
                  {PAID_PACKAGE_REQUESTS} + {carryoverPreviewCount} = {projectedTotalOnNewKey}
                </span>
              </div>
            )}

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
                  placeholder={
                    isRu
                      ? 'Введите ключ активации на 500 запросов...'
                      : isPl
                      ? 'Wpisz klucz aktywacyjny na 500 zapytań...'
                      : 'Enter activation key for 500 requests...'
                  }
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
                    title={
                      isRu
                        ? 'Очистить поле для ввода нового ключа'
                        : isPl
                        ? 'Wyczyść pole'
                        : 'Clear input to enter a new key'
                    }
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
                    <span>{isRu ? 'Проверка...' : isPl ? 'Sprawdzanie...' : 'Verifying...'}</span>
                  </>
                ) : activatedSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>{isRu ? 'Активировано!' : isPl ? 'Aktywowano!' : 'Activated!'}</span>
                  </>
                ) : (
                  <span>{isRu ? 'Подтвердить' : isPl ? 'Potwierdź' : 'Activate'}</span>
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
                <span>
                  {successDetails ||
                    (isRu
                      ? 'Ключ успешно активирован!'
                      : isPl
                      ? 'Klucz został pomyślnie aktywowany!'
                      : 'Key successfully activated!')}
                </span>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
