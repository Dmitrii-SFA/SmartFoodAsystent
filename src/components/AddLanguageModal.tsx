import React, { useState } from 'react';
import { LanguageOption } from '../types/config';
import { ThemeStyles } from '../utils/themeHelper';
import { translateLanguageFromEnglishWithWorker, AiQuotaError } from '../utils/accessControl';
import { Globe, Sparkles, X, Loader2, AlertCircle, Check } from 'lucide-react';

interface AddLanguageModalProps {
  isOpen: boolean;
  onClose: () => void;
  langCode: string;
  accentColor: string;
  themeStyles: ThemeStyles;
  activeMetricIds: string[];
  onLanguageAdded: (newLang: LanguageOption) => void;
  onOpenPaywallModal: () => void;
  onQuotaUsed: (newUsedCount: number) => void;
}

const POPULAR_LANGUAGES = [
  'Українська',
  'Deutsch',
  'Español',
  'Français',
  'Italiano',
  'Português',
  'Čeština',
  'Türkçe',
  'Қазақша',
];

export const AddLanguageModal: React.FC<AddLanguageModalProps> = ({
  isOpen,
  onClose,
  langCode,
  accentColor,
  themeStyles,
  activeMetricIds,
  onLanguageAdded,
  onOpenPaywallModal,
  onQuotaUsed,
}) => {
  const [languageInput, setLanguageInput] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const c = (langCode || 'ru').toLowerCase().slice(0, 2);
  const isRu = c === 'ru';
  const isPl = c === 'pl';

  const handleTranslateAndAdd = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = languageInput.trim();
    if (!trimmed || isTranslating) return;

    setIsTranslating(true);
    setErrorMsg(null);

    try {
      const translatedLang = await translateLanguageFromEnglishWithWorker({
        targetLanguageName: trimmed,
        activeMetricIds,
        onOpenPaywall: () => {
          onClose();
          onOpenPaywallModal();
        },
        onQuotaUsed,
      });

      onLanguageAdded(translatedLang);
      setLanguageInput('');
      onClose();
    } catch (err: any) {
      if (err instanceof AiQuotaError && err.reason === 'daily_limit_reached') {
        onClose();
        onOpenPaywallModal();
        return;
      }
      setErrorMsg(
        err?.message ||
          (isRu
            ? 'Не удалось перевести интерфейс. Попробуйте ещё раз.'
            : isPl
            ? 'Nie udało się przetłumaczyć interfejsu. Spróbuj ponownie.'
            : 'Failed to translate the interface. Please try again.')
      );
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`w-full max-w-md border ${themeStyles.borderColor} ${themeStyles.cardBg} rounded-2xl shadow-2xl overflow-hidden flex flex-col`}
      >
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between gap-2 px-5 py-3.5 border-b border-slate-800/90 bg-slate-900/60">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/35 text-cyan-400 flex items-center justify-center shrink-0">
              <Globe className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-extrabold text-white leading-tight truncate">
                {isRu ? 'Добавить язык' : isPl ? 'Dodaj język' : 'Add Language'}
              </h2>
              <span className="text-[11px] text-slate-400 block truncate">
                {isRu
                  ? 'Полный ИИ-перевод интерфейса с английского'
                  : isPl
                  ? 'Pełne tłumaczenie AI z języka angielskiego'
                  : 'Full AI translation from English'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (!isTranslating) onClose();
            }}
            disabled={isTranslating}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition disabled:opacity-40"
            aria-label={isRu ? 'Закрыть' : isPl ? 'Zamknij' : 'Close'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form
          onSubmit={handleTranslateAndAdd}
          autoComplete="off"
          className="p-5 space-y-4 text-xs"
        >
          <p className="text-slate-300 leading-relaxed">
            {isRu
              ? 'Введите название нужного языка — искусственный интеллект переведёт с английского все слова и фразы интерфейса, названия нутриентов, приёмов пищи и базовых продуктов.'
              : isPl
              ? 'Wpisz nazwę wybranego języka — sztuczna inteligencja przetłumaczy z angielskiego wszystkie słowa i frazy interfejsu, nazwy składników odżywczych, posiłków oraz produktów bazowych.'
              : 'Enter the language name — AI will translate all interface words and phrases, nutrients, meal categories, and default products from English.'}
          </p>

          <div className="space-y-2">
            <label className="block font-bold text-slate-200">
              {isRu
                ? 'Название языка:'
                : isPl
                ? 'Nazwa języka:'
                : 'Language name:'}
            </label>
            <input
              type="search"
              name="sfa_add_language_query"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              aria-autocomplete="none"
              data-form-type="other"
              data-lpignore="true"
              data-1p-ignore="true"
              enterKeyHint="done"
              value={languageInput}
              onChange={(e) => {
                setLanguageInput(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
              disabled={isTranslating}
              placeholder={
                isRu
                  ? 'Например: Українська, Deutsch, Español, Français...'
                  : isPl
                  ? 'Np. Українська, Deutsch, Español, Français...'
                  : 'E.g. Українська, Deutsch, Español, Français...'
              }
              className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-white text-xs placeholder-slate-500 focus:outline-hidden focus:border-cyan-500 disabled:opacity-60"
            />
          </div>

          {/* Quick Language Chips */}
          <div className="space-y-1.5">
            <span className="text-[11px] text-slate-400">
              {isRu
                ? 'Быстрый выбор:'
                : isPl
                ? 'Szybki wybór:'
                : 'Quick pick:'}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_LANGUAGES.map((langName) => {
                const isSelected =
                  languageInput.trim().toLowerCase() === langName.toLowerCase();
                return (
                  <button
                    key={langName}
                    type="button"
                    disabled={isTranslating}
                    onClick={() => {
                      setLanguageInput(langName);
                      if (errorMsg) setErrorMsg(null);
                    }}
                    className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition active:scale-95 disabled:opacity-40 ${
                      isSelected
                        ? 'border-cyan-500 bg-cyan-950/40 text-cyan-200'
                        : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700 hover:text-white'
                    }`}
                  >
                    {langName}
                  </button>
                );
              })}
            </div>
          </div>

          {isTranslating && (
            <div className="p-3 rounded-xl bg-cyan-950/35 border border-cyan-500/35 text-cyan-200 flex items-center gap-2.5">
              <Loader2 className="w-4 h-4 text-cyan-400 animate-spin shrink-0" />
              <span className="leading-snug">
                {isRu
                  ? `Переводим интерфейс и базу с английского на «${languageInput.trim()}» (около 10–15 сек)...`
                  : isPl
                  ? `Tłumaczenie interfejsu i bazy z angielskiego na „${languageInput.trim()}” (ok. 10–15 sek)...`
                  : `Translating interface and database from English to "${languageInput.trim()}" (~10–15 sec)...`}
              </span>
            </div>
          )}

          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Footer Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/80">
            <button
              type="button"
              onClick={onClose}
              disabled={isTranslating}
              className="min-h-[42px] px-4 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition disabled:opacity-40"
            >
              {isRu ? 'Отмена' : isPl ? 'Anuluj' : 'Cancel'}
            </button>

            <button
              type="submit"
              disabled={!languageInput.trim() || isTranslating}
              className="min-h-[42px] px-4 py-2 rounded-xl font-bold text-white shadow-md flex items-center justify-center gap-1.5 transition active:scale-95 disabled:opacity-40"
              style={{ backgroundColor: accentColor }}
            >
              {isTranslating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  <span>{isRu ? 'Перевод...' : isPl ? 'Tłumaczenie...' : 'Translating...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span>
                    {isRu
                      ? 'Перевести и добавить'
                      : isPl
                      ? 'Przetłumacz i dodaj'
                      : 'Translate & Add'}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
