import React, { useState, useEffect } from 'react';
import { ThemeStyles } from '../utils/themeHelper';
import {
  Key,
  Check,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  X,
  Eye,
  EyeOff,
  AlertTriangle,
  Loader2,
  Globe,
  Bot,
  Cpu,
  Server,
  Zap,
} from 'lucide-react';
import { AIConfig, AIProvider } from '../types/config';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  aiConfig: AIConfig;
  onSaveAiConfig: (config: AIConfig) => void;
  themeStyles: ThemeStyles;
  remainingDemoRequests: number;
  totalDemoLimit: number;
  // Backward compatibility
  apiKey?: string;
  onSaveApiKey?: (key: string) => void;
}

const PROVIDER_OPTIONS: Array<{
  id: AIProvider;
  name: string;
  badge: string;
  defaultModel: string;
  defaultBaseURL: string;
  description: string;
  popularModels: string[];
  keyHelpUrl: string;
  keyHelpLabel: string;
}> = [
  {
    id: 'gemini',
    name: 'Google Gemini',
    badge: 'Рекомендуется',
    defaultModel: 'gemini-3.8-flash',
    defaultBaseURL: 'https://generativelanguage.googleapis.com',
    description: 'Быстрый и бесплатный мультимодальный ИИ с распознаванием фото тарелки и этикеток',
    popularModels: ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'],
    keyHelpUrl: 'https://aistudio.google.com/app/apikey',
    keyHelpLabel: 'Google AI Studio',
  },
  {
    id: 'openai',
    name: 'OpenAI (ChatGPT)',
    badge: 'OpenAI API',
    defaultModel: 'gpt-4o-mini',
    defaultBaseURL: 'https://api.openai.com/v1',
    description: 'Официальный API моделей OpenAI: GPT-4o mini, GPT-4o с поддержкой компьютерного зрения',
    popularModels: ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo'],
    keyHelpUrl: 'https://platform.openai.com/api-keys',
    keyHelpLabel: 'OpenAI Platform',
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    badge: 'Агрегатор',
    defaultModel: 'meta-llama/llama-3.3-70b-instruct',
    defaultBaseURL: 'https://openrouter.ai/api/v1',
    description: 'Доступ ко всем ведущим моделям (Claude, Llama 3, DeepSeek, Gemini) по единому ключу',
    popularModels: [
      'meta-llama/llama-3.3-70b-instruct',
      'google/gemini-2.0-flash-001',
      'deepseek/deepseek-chat',
      'anthropic/claude-3.5-sonnet',
    ],
    keyHelpUrl: 'https://openrouter.ai/keys',
    keyHelpLabel: 'OpenRouter Keys',
  },
  {
    id: 'custom',
    name: 'Custom OpenAI-совместимый',
    badge: 'Ollama / Groq / vLLM',
    defaultModel: 'gpt-4o-mini',
    defaultBaseURL: 'https://api.openai.com/v1',
    description: 'Любой собственный сервер или провайдер, совместимый с OpenAI chat completions',
    popularModels: ['llama3', 'mistral', 'qwen2.5', 'gpt-4o-mini'],
    keyHelpUrl: '',
    keyHelpLabel: '',
  },
];

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  aiConfig,
  onSaveAiConfig,
  themeStyles,
  remainingDemoRequests,
  totalDemoLimit,
  apiKey,
  onSaveApiKey,
}) => {
  // Local form state initialized from aiConfig or fallback apiKey
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>(aiConfig?.provider || 'gemini');
  const [keyInput, setKeyInput] = useState<string>(aiConfig?.apiKey || apiKey || '');
  const [baseURLInput, setBaseURLInput] = useState<string>(aiConfig?.baseURL || '');
  const [modelInput, setModelInput] = useState<string>(aiConfig?.model || 'gemini-3.8-flash');

  const [showKey, setShowKey] = useState(false);
  const [isSavedToast, setIsSavedToast] = useState(false);

  // Connection test state
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    latencyMs?: number;
  } | null>(null);

  // Sync state when modal opens
  useEffect(() => {
    if (isOpen) {
      const prov = aiConfig?.provider || 'gemini';
      setSelectedProvider(prov);
      setKeyInput(aiConfig?.apiKey || apiKey || '');
      setBaseURLInput(aiConfig?.baseURL || '');
      const defaultMod = PROVIDER_OPTIONS.find((p) => p.id === prov)?.defaultModel || 'gemini-3.8-flash';
      setModelInput(aiConfig?.model || defaultMod);
      setTestResult(null);
    }
  }, [isOpen, aiConfig, apiKey]);

  if (!isOpen) return null;

  const currentProviderInfo = PROVIDER_OPTIONS.find((p) => p.id === selectedProvider) || PROVIDER_OPTIONS[0];

  const handleProviderSelect = (provId: AIProvider) => {
    setSelectedProvider(provId);
    const opt = PROVIDER_OPTIONS.find((p) => p.id === provId);
    if (opt) {
      setModelInput(opt.defaultModel);
      if (provId !== 'custom') {
        setBaseURLInput(opt.defaultBaseURL);
      }
    }
    setTestResult(null);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/ai/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aiConfig: {
            provider: selectedProvider,
            apiKey: keyInput.trim(),
            baseURL: baseURLInput.trim() || undefined,
            model: modelInput.trim() || undefined,
          },
        }),
      });
      const data = await res.json();
      setTestResult(data);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || 'Сетевая ошибка при проверке подключения',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    const newConfig: AIConfig = {
      provider: selectedProvider,
      apiKey: keyInput.trim(),
      baseURL: baseURLInput.trim() || undefined,
      model: modelInput.trim() || undefined,
    };

    onSaveAiConfig(newConfig);
    if (onSaveApiKey) {
      onSaveApiKey(keyInput.trim());
    }

    setIsSavedToast(true);
    setTimeout(() => {
      setIsSavedToast(false);
      onClose();
    }, 1200);
  };

  const handleClear = () => {
    setKeyInput('');
    setTestResult(null);
  };

  const hasCustomKey = Boolean(keyInput && keyInput.trim().length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div
        className={`w-full max-w-xl my-auto border ${themeStyles.borderColor} ${themeStyles.cardBg} rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-white flex items-center gap-1.5 flex-wrap">
                <span>ИИ-провайдер и API-ключ</span>
                {hasCustomKey && (
                  <span className="px-1.5 py-0.5 text-[10px] rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Ключ введен
                  </span>
                )}
              </h2>
              <p className="text-[11px] text-slate-400 truncate">
                Поддержка Gemini, OpenAI (ChatGPT), OpenRouter и локальных моделей
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

        {/* Content - Scrollable */}
        <div className="p-4 sm:p-5 space-y-4 text-xs overflow-y-auto flex-1">
          {/* Status Banner */}
          {!hasCustomKey ? (
            <div
              className={`p-3 rounded-xl border ${
                remainingDemoRequests <= 2
                  ? 'border-amber-500/50 bg-amber-950/30 text-amber-200'
                  : 'border-slate-800 bg-slate-900/60 text-slate-300'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <AlertTriangle
                  className={`w-4 h-4 mt-0.5 shrink-0 ${
                    remainingDemoRequests <= 2 ? 'text-amber-400' : 'text-slate-400'
                  }`}
                />
                <div className="space-y-1">
                  <div className="font-semibold text-white">
                    {remainingDemoRequests <= 0 ? (
                      <span className="text-amber-400">Лимит бесплатного демо-режима исчерпан</span>
                    ) : (
                      <span>
                        Демо-режим: осталось {remainingDemoRequests} из {totalDemoLimit} запросов
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-300">
                    Подключите собственный ключ Google Gemini (бесплатный), OpenAI или OpenRouter для работы без ограничений и защиты ключей на сервере.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl border border-emerald-500/40 bg-emerald-950/30 text-emerald-200 flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <div className="font-semibold text-white">Персональный API-ключ настроен</div>
                <div className="text-[11px] text-emerald-300/90">
                  Все запросы обрабатываются через выбранный вами провайдер без демо-лимитов.
                </div>
              </div>
            </div>
          )}

          {/* 1. Provider Selector */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Выберите провайдера нейросети:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PROVIDER_OPTIONS.map((opt) => {
                const isSelected = selectedProvider === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleProviderSelect(opt.id)}
                    className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition active:scale-95 ${
                      isSelected
                        ? 'border-emerald-400 bg-emerald-950/40 text-white ring-1 ring-emerald-400/50'
                        : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800/80 text-slate-300 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="font-bold text-xs truncate">{opt.name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                    </div>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 font-mono">
                      {opt.badge}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-400 pt-0.5">
              {currentProviderInfo.description}
            </p>
          </div>

          {/* 2. API Key Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                API-ключ ({currentProviderInfo.name}):
              </label>
              {keyInput && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-[10px] text-slate-400 hover:text-red-400 transition"
                >
                  Очистить
                </button>
              )}
            </div>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={keyInput}
                onChange={(e) => {
                  setKeyInput(e.target.value);
                  setTestResult(null);
                }}
                placeholder={
                  selectedProvider === 'gemini'
                    ? 'AIzaSy...'
                    : selectedProvider === 'openai'
                    ? 'sk-proj-...'
                    : selectedProvider === 'openrouter'
                    ? 'sk-or-v1-...'
                    : 'Ваш API-токен...'
                }
                className={`w-full px-3.5 py-2.5 pr-20 text-xs font-mono rounded-xl border ${themeStyles.borderColor} bg-slate-900 text-white placeholder-slate-600 focus:outline-hidden focus:ring-2 focus:ring-emerald-500`}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="p-1.5 text-slate-400 hover:text-white transition"
                  title={showKey ? 'Скрыть' : 'Показать'}
                >
                  {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            <p className="text-[10px] text-slate-400">
              Хранится в браузере (LocalStorage) и отправляется на локальный backend-прокси без CORS.
            </p>
          </div>

          {/* 3. Model and Base URL Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Model Name */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Модель:
              </label>
              <input
                type="text"
                value={modelInput}
                onChange={(e) => {
                  setModelInput(e.target.value);
                  setTestResult(null);
                }}
                placeholder={currentProviderInfo.defaultModel}
                className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-700 bg-slate-900 text-white placeholder-slate-600 focus:outline-hidden focus:border-emerald-500"
              />
              {/* Popular Models Chips */}
              <div className="flex flex-wrap gap-1 pt-1">
                {currentProviderInfo.popularModels.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setModelInput(m);
                      setTestResult(null);
                    }}
                    className={`text-[9px] px-2 py-0.5 rounded-lg border font-mono transition ${
                      modelInput === m
                        ? 'border-emerald-500/60 bg-emerald-950/60 text-emerald-300'
                        : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Base URL (editable for Custom & OpenRouter) */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Base URL (API эндпоинт):
              </label>
              <input
                type="text"
                value={baseURLInput || currentProviderInfo.defaultBaseURL}
                onChange={(e) => {
                  setBaseURLInput(e.target.value);
                  setTestResult(null);
                }}
                placeholder={currentProviderInfo.defaultBaseURL}
                disabled={selectedProvider === 'gemini'}
                className={`w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-700 bg-slate-900 text-white placeholder-slate-600 focus:outline-hidden focus:border-emerald-500 ${
                  selectedProvider === 'gemini' ? 'opacity-60 cursor-not-allowed' : ''
                }`}
              />
              <span className="text-[10px] text-slate-400 block pt-1">
                {selectedProvider === 'custom'
                  ? 'Пример: http://localhost:11434/v1 для Ollama или https://api.groq.com/openai/v1'
                  : 'Стандартный URL для выбранного провайдера'}
              </span>
            </div>
          </div>

          {/* Test Connection Button & Result */}
          <div className="pt-2 space-y-2">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting || (!keyInput && selectedProvider !== 'gemini')}
              className="flex items-center justify-center gap-1.5 w-full py-2 px-3 text-xs font-semibold rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white transition active:scale-98 disabled:opacity-50"
            >
              {isTesting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                  <span>Проверка соединения...</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>Проверить подключение к {currentProviderInfo.name}</span>
                </>
              )}
            </button>

            {testResult && (
              <div
                className={`p-2.5 rounded-xl border text-[11px] flex items-start gap-2 ${
                  testResult.success
                    ? 'border-emerald-500/50 bg-emerald-950/40 text-emerald-200'
                    : 'border-red-500/50 bg-red-950/40 text-red-200'
                }`}
              >
                {testResult.success ? (
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-bold">
                    {testResult.success ? 'Соединение успешно!' : 'Ошибка подключения'}
                  </div>
                  <div className="text-slate-300 leading-relaxed">{testResult.message}</div>
                </div>
              </div>
            )}
          </div>

          {/* How to get free key */}
          {currentProviderInfo.keyHelpUrl && (
            <div className="p-3 rounded-xl border border-purple-500/30 bg-purple-950/20 text-purple-200 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-purple-300">
                <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                <span>Где взять ключ для {currentProviderInfo.name}:</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Перейдите в{' '}
                <a
                  href={currentProviderInfo.keyHelpUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-300 underline font-semibold hover:text-white inline-flex items-center gap-0.5"
                >
                  {currentProviderInfo.keyHelpLabel}{' '}
                  <ExternalLink className="w-2.5 h-2.5 inline" />
                </a>
                , скопируйте ваш персональный API-ключ и сохраните настройки.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition"
          >
            Отмена
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl text-white shadow-md transition active:scale-95"
            style={{
              background: isSavedToast ? '#10b981' : 'linear-gradient(135deg, #10b981, #6366f1)',
            }}
          >
            {isSavedToast ? (
              <>
                <Check className="w-4 h-4" />
                <span>Сохранено!</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Сохранить настройки</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
