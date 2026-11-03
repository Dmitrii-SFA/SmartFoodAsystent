import React, { useState } from 'react';
import { ThemeStyles } from '../utils/themeHelper';
import { Key, Copy, Check, X } from 'lucide-react';

interface StripeKeyIssuedModalProps {
  isOpen: boolean;
  issuedKey: string | null;
  onClose: () => void;
  themeStyles: ThemeStyles;
}

export const StripeKeyIssuedModal: React.FC<StripeKeyIssuedModalProps> = ({
  isOpen,
  issuedKey,
  onClose,
  themeStyles,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !issuedKey) return null;

  const handleCopyKey = async () => {
    try {
      await navigator.clipboard.writeText(issuedKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = issuedKey;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`w-full max-w-md border ${themeStyles.borderColor} ${themeStyles.cardBg} rounded-2xl shadow-2xl overflow-hidden flex flex-col`}
      >
        <div className="flex items-center justify-between gap-2 px-5 py-3.5 border-b border-slate-800/90 bg-slate-900/60">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/35 text-emerald-400 flex items-center justify-center shrink-0">
              <Key className="w-5 h-5" />
            </div>
            <h2 className="text-sm sm:text-base font-extrabold text-white leading-tight truncate">
              Ключ доступа
            </h2>
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

        <div className="p-5 space-y-4 text-xs sm:text-sm">
          <div className="p-4 rounded-xl border border-emerald-500/35 bg-emerald-950/25 text-slate-100 leading-relaxed space-y-2.5">
            <p className="font-bold text-white">
              Оплата прошла успешно! Ваш ключ на 500 запросов:{' '}
              <span className="font-mono text-emerald-300 select-all break-all">
                {issuedKey}
              </span>
            </p>
            <div className="px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 font-mono font-bold text-sm text-emerald-300 text-center select-all break-all">
              {issuedKey}
            </div>
          </div>

          <p className="text-xs text-slate-300 text-center leading-relaxed">
            Скопируйте этот ключ и вставьте его в окне ввода ключа
          </p>

          <button
            type="button"
            onClick={handleCopyKey}
            className="w-full min-h-[44px] py-3 px-4 rounded-xl font-bold text-xs sm:text-sm text-white shadow-lg flex items-center justify-center gap-2 transition active:scale-[0.99] hover:opacity-95"
            style={{
              background: 'linear-gradient(135deg, #10b981, #059669)',
            }}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 shrink-0" />
                <span>Скопировано!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 shrink-0" />
                <span>Скопировать ключ</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
