import React, { useState, useRef, useEffect } from 'react';
import { UserConfig, LanguageOption } from '../types/config';
import { ThemeStyles } from '../utils/themeHelper';
import { Globe, Check, ChevronDown, Sparkles } from 'lucide-react';

interface LanguageSelectorProps {
  config: UserConfig;
  themeStyles: ThemeStyles;
  onSelectLanguage: (lang: LanguageOption) => void;
  onRequestNewLanguage: () => void;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  config,
  themeStyles,
  onSelectLanguage,
  onRequestNewLanguage,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [alignLeft, setAlignLeft] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeCode = (config.language?.code || 'ru').slice(0, 2).toUpperCase();
  const languages: LanguageOption[] = config.installedLanguages || [];

  // Deduplicate languages by 2-letter code
  const uniqueLanguages: LanguageOption[] = [];
  const seenCodes = new Set<string>();
  languages.forEach((lang) => {
    const code2 = lang.code.slice(0, 2).toUpperCase();
    if (!seenCodes.has(code2)) {
      seenCodes.add(code2);
      uniqueLanguages.push(lang);
    }
  });

  // Current active language option
  const currentLang = uniqueLanguages.find(
    (l) => l.code.slice(0, 2).toUpperCase() === activeCode
  ) || {
    code: activeCode.toLowerCase(),
    name: activeCode,
    nativeName: activeCode,
    labels: config.language.labels,
  };

  // Check screen position when opening to prevent overflowing off-screen
  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      // Dropdown width is ~224px (w-56).
      // If opening towards the right (left-0) fits in the viewport, prefer left-0.
      // Otherwise align right-0 to stay inside screen bounds.
      setAlignLeft(rect.left + 230 <= viewportWidth);
    }
  }, [isOpen]);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${isOpen ? 'z-50' : 'z-20'}`} ref={dropdownRef}>
      {/* Trigger Button - strictly two-letter English abbreviation */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-xl border ${themeStyles.borderColor} ${themeStyles.inputBg} hover:bg-white/10 transition active:scale-95 text-slate-200 shadow-xs`}
        title={`Language: ${activeCode}`}
      >
        <Globe className="w-3.5 h-3.5 opacity-70" />
        <span className="font-mono font-bold tracking-wider uppercase">{activeCode}</span>
        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu - explicitly elevated with high z-index and solid shadow/background */}
      {isOpen && (
        <div
          className={`absolute ${
            alignLeft ? 'left-0' : 'right-0'
          } mt-2 w-56 max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-700/80 bg-slate-900/95 shadow-2xl p-2 z-50 backdrop-blur-2xl ring-1 ring-white/10 animate-in fade-in zoom-in-95 duration-150`}
        >
          <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 flex items-center justify-between">
            <span>
              {activeCode === 'RU'
                ? 'Выбор языка'
                : activeCode === 'PL'
                ? 'Wybór języka'
                : 'Select Language'}
            </span>
            <span className="font-mono text-[10px] text-slate-500">{uniqueLanguages.length}</span>
          </div>

          <div className="py-1.5 max-h-60 overflow-y-auto space-y-1">
            {uniqueLanguages.map((lang) => {
              const langCode2 = lang.code.slice(0, 2).toUpperCase();
              const isActive = langCode2 === activeCode;
              const displayName = lang.nativeName || lang.name || langCode2;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => {
                    onSelectLanguage(lang);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-all active:scale-95 ${
                    isActive
                      ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold shadow-xs'
                      : 'border border-transparent text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono font-bold tracking-wider text-[11px] px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-200 shrink-0">
                      {langCode2}
                    </span>
                    <span className="truncate text-left">{displayName}</span>
                  </div>
                  {isActive && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 ml-1.5" />}
                </button>
              );
            })}
          </div>

          {/* Add New Language with Gemini Button */}
          <div className="pt-1.5 border-t border-slate-800">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onRequestNewLanguage();
              }}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl border border-dashed border-purple-500/50 bg-purple-950/20 hover:bg-purple-900/30 text-purple-300 text-xs font-semibold transition active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse shrink-0" />
              <span>
                + Gemini AI (
                {activeCode === 'RU'
                  ? 'Новый язык'
                  : activeCode === 'PL'
                  ? 'Nowy język'
                  : 'New language'}
                )
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
