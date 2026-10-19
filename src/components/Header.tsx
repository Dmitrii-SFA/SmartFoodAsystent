import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Code2,
  Sparkles,
  Palette,
  Globe,
  Key,
  RotateCcw,
} from 'lucide-react';
import { UserConfig, ThemeMode, LanguageOption } from '../types/config';
import { ThemeStyles, getBorderRadiusClass } from '../utils/themeHelper';
import { PWAInstallButton } from './PWAInstallButton';
import { LanguageSelector } from './LanguageSelector';

interface HeaderProps {
  config: UserConfig;
  themeStyles: ThemeStyles;
  currentDateStr: string;
  onDateChange: (dateStr: string) => void;
  onOpenConfigModal: () => void;
  onToggleChat: () => void;
  isChatOpen: boolean;
  onUpdateThemeMode: (mode: ThemeMode) => void;
  onSelectLanguage: (lang: LanguageOption) => void;
  onRequestNewLanguage: () => void;
  onOpenApiKeyModal: () => void;
  onOpenResetModal: () => void;
  apiKey: string;
  remainingDemoRequests: number;
}

export const Header: React.FC<HeaderProps> = ({
  config,
  themeStyles,
  currentDateStr,
  onDateChange,
  onOpenConfigModal,
  onToggleChat,
  isChatOpen,
  onUpdateThemeMode,
  onSelectLanguage,
  onRequestNewLanguage,
  onOpenApiKeyModal,
  onOpenResetModal,
  apiKey,
  remainingDemoRequests,
}) => {
  const labels = config.language.labels;
  const radiusClass = getBorderRadiusClass(config.theme.borderRadius);

  // Format date nicely
  const formatDateLabel = (isoDate: string) => {
    const today = new Date().toISOString().split('T')[0];
    if (isoDate === today) {
      return config.language.code === 'ru' ? 'Сегодня' : 'Today';
    }
    const d = new Date(isoDate);
    return d.toLocaleDateString(config.language.code === 'ru' ? 'ru-RU' : 'en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const handlePrevDay = () => {
    const d = new Date(currentDateStr);
    d.setDate(d.getDate() - 1);
    onDateChange(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(currentDateStr);
    d.setDate(d.getDate() + 1);
    onDateChange(d.toISOString().split('T')[0]);
  };

  const themeModes: ThemeMode[] = ['dark', 'light', 'emerald', 'sunset', 'cyberpunk', 'nord'];

  return (
    <header className={`sticky top-0 z-30 border-b ${themeStyles.borderColor} ${themeStyles.cardBg} backdrop-blur-md transition-colors duration-200`}>
      <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Brand and Title */}
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 ${radiusClass} flex items-center justify-center font-black text-white shadow-md transition-transform hover:scale-105`}
            style={{ backgroundColor: config.theme.accentColor }}
          >
            <span className="text-lg">⚡</span>
          </div>
          <div>
            <h1 className={`text-base font-bold tracking-tight ${themeStyles.textPrimary}`}>
              {labels.appTitle}
            </h1>
            {config.userName && (
              <p className={`text-xs ${themeStyles.textSecondary}`}>{config.userName}</p>
            )}
          </div>
        </div>

        {/* Date Navigator */}
        <div className={`flex items-center gap-1 px-2 py-1 rounded-xl border ${themeStyles.borderColor} ${themeStyles.inputBg}`}>
          <button
            onClick={handlePrevDay}
            className="p-1 rounded-lg hover:bg-white/10 active:scale-95 transition text-slate-300"
            title="Предыдущий день"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1.5 px-2 text-xs font-semibold text-slate-200">
            <Calendar className="w-3.5 h-3.5 opacity-70" />
            <span>{formatDateLabel(currentDateStr)}</span>
          </div>

          <button
            onClick={handleNextDay}
            className="p-1 rounded-lg hover:bg-white/10 active:scale-95 transition text-slate-300"
            title="Следующий день"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Action Controls & AI trigger */}
        <div className="flex items-center gap-1.5">
          {/* In-app PWA install button */}
          <PWAInstallButton label={labels.installApp} accentColor={config.theme.accentColor} />

          {/* Dynamic Language Selector Dropdown */}
          <LanguageSelector
            config={config}
            themeStyles={themeStyles}
            onSelectLanguage={onSelectLanguage}
            onRequestNewLanguage={onRequestNewLanguage}
          />

          {/* Quick Theme Cycle */}
          <button
            onClick={() => {
              const currentIndex = themeModes.indexOf(config.theme.mode);
              const nextMode = themeModes[(currentIndex + 1) % themeModes.length];
              onUpdateThemeMode(nextMode);
            }}
            className={`p-2 rounded-xl border ${themeStyles.borderColor} hover:bg-white/10 transition text-slate-300`}
            title="Сменить тему"
          >
            <Palette className="w-4 h-4 text-emerald-400" />
          </button>

          {/* API Key Modal Button */}
          <button
            onClick={onOpenApiKeyModal}
            className={`p-2 rounded-xl border transition active:scale-95 ${
              apiKey && apiKey.trim().length > 0
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                : remainingDemoRequests <= 2
                ? 'border-amber-500/40 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 animate-pulse'
                : 'border-slate-700 bg-slate-800/60 hover:bg-slate-700 text-slate-300'
            }`}
            title="API-ключ"
          >
            <Key className="w-4 h-4" />
          </button>

          {/* Reset to Original Defaults Button */}
          <button
            onClick={onOpenResetModal}
            className="p-2 rounded-xl border border-red-500/30 bg-red-950/30 hover:bg-red-900/40 text-red-300 transition active:scale-95"
            title="Сброс настроек"
          >
            <RotateCcw className="w-4 h-4 text-red-400" />
          </button>

          {/* Config JSON Modal Button */}
          <button
            onClick={onOpenConfigModal}
            className={`p-2 rounded-xl border ${themeStyles.borderColor} bg-slate-800/60 hover:bg-slate-700/80 text-slate-200 transition active:scale-95`}
            title="userConfig.json"
          >
            <Code2 className="w-4 h-4 text-cyan-400" />
          </button>

          {/* AI Gemini Flash Chat Button */}
          <button
            onClick={onToggleChat}
            className={`relative flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl text-white shadow-lg transition active:scale-95 ${
              isChatOpen ? 'ring-2 ring-emerald-400' : ''
            }`}
            style={{
              background: `linear-gradient(135deg, ${config.theme.accentColor}, #8b5cf6)`,
            }}
            title="Открыть чат с Gemini Flash"
          >
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span>Gemini AI</span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
