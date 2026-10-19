import React, { useState, useEffect } from 'react';
import { UserConfig } from '../types/config';
import { PRESET_CONFIGS, DEFAULT_USER_CONFIG, DEFAULT_INSTALLED_LANGUAGES, ensureEntireConfigProtected } from '../config/defaultConfig';
import { ThemeStyles, getBorderRadiusClass } from '../utils/themeHelper';
import {
  Code,
  Copy,
  Check,
  RotateCcw,
  Download,
  Upload,
  X,
  Sparkles,
  AlertCircle,
} from 'lucide-react';

interface ConfigJsonModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: UserConfig;
  themeStyles: ThemeStyles;
  onUpdateConfig: (newConfig: UserConfig) => void;
  onResetToDefault: () => void;
}

export const ConfigJsonModal: React.FC<ConfigJsonModalProps> = ({
  isOpen,
  onClose,
  config,
  themeStyles,
  onUpdateConfig,
  onResetToDefault,
}) => {
  const [jsonText, setJsonText] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const radiusClass = getBorderRadiusClass(config.theme.borderRadius);

  useEffect(() => {
    if (isOpen) {
      setJsonText(JSON.stringify(config, null, 2));
      setError(null);
      setIsEditing(false);
    }
  }, [isOpen, config]);

  if (!isOpen) return null;

  const handleApplyJson = () => {
    try {
      const parsed = JSON.parse(jsonText);
      if (!parsed.metrics || !parsed.theme || !parsed.language) {
        throw new Error('userConfig должен содержать поля: metrics, theme, language');
      }
      if (!parsed.installedLanguages || !Array.isArray(parsed.installedLanguages)) {
        parsed.installedLanguages = DEFAULT_INSTALLED_LANGUAGES;
      }
      const protectedConfig = ensureEntireConfigProtected(parsed);
      onUpdateConfig(protectedConfig);
      setError(null);
      setIsEditing(false);
    } catch (e: any) {
      setError(`Ошибка парсинга JSON: ${e.message}`);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([jsonText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `userConfig-v${config.version}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        setJsonText(JSON.stringify(parsed, null, 2));
        onUpdateConfig(parsed);
        setError(null);
      } catch (err: any) {
        setError(`Неверный файл конфигурации: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  const handleLoadPreset = (key: string) => {
    const preset = PRESET_CONFIGS[key];
    if (preset) {
      const merged: UserConfig = {
        ...config,
        ...preset.config,
        theme: {
          ...config.theme,
          ...(preset.config.theme || {}),
        },
        metrics: preset.config.metrics || config.metrics,
      };
      setJsonText(JSON.stringify(merged, null, 2));
      onUpdateConfig(merged);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div
        className={`w-full max-w-3xl h-[85vh] border ${themeStyles.borderColor} ${themeStyles.cardBg} ${radiusClass} shadow-2xl p-6 flex flex-col justify-between text-slate-100`}
      >
        {/* Header */}
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white"
                style={{ backgroundColor: config.theme.accentColor }}
              >
                <Code className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>userConfig.json (Data-Driven UI)</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono">
                    v{config.version}
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  {config.language.code === 'ru'
                    ? 'Вся структура интерфейса, цели КБЖУ, витамины и тема генерируются из этого JSON'
                    : 'The entire UI structure, macros, vitamins & theme render from this JSON'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Preset Buttons */}
          <div className="mt-3 flex flex-wrap items-center gap-2 pb-2">
            <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
              {config.language.code === 'ru' ? 'Готовые пресеты:' : 'Presets:'}
            </span>
            {Object.entries(PRESET_CONFIGS).map(([key, item]) => (
              <button
                key={key}
                onClick={() => handleLoadPreset(key)}
                className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition active:scale-95"
                title={item.description}
              >
                {item.title}
              </button>
            ))}
          </div>
        </div>

        {/* JSON Editor / Viewer */}
        <div className="flex-1 my-3 flex flex-col relative overflow-hidden">
          {error && (
            <div className="mb-2 p-2 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <textarea
            value={jsonText}
            onChange={(e) => {
              setJsonText(e.target.value);
              setIsEditing(true);
            }}
            spellCheck={false}
            className="flex-1 w-full p-4 rounded-xl font-mono text-xs leading-relaxed bg-slate-950/90 text-emerald-400 border border-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 resize-none selection:bg-emerald-500/30"
          />
        </div>

        {/* Actions Footer */}
        <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
              title="Скопировать JSON в буфер"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Скопировано!' : 'Копировать'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
              title="Скачать файл userConfig.json"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Экспорт</span>
            </button>

            <label className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>Импорт</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportFile}
                className="hidden"
              />
            </label>

            <button
              onClick={onResetToDefault}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition"
              title="Сбросить к первоначальному конфигу"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Сброс</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-medium rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 transition"
            >
              Закрыть
            </button>
            <button
              onClick={handleApplyJson}
              disabled={!isEditing}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-xl text-white shadow-md disabled:opacity-50 transition active:scale-95"
              style={{ backgroundColor: config.theme.accentColor }}
            >
              <Check className="w-3.5 h-3.5" />
              <span>Применить изменения</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
