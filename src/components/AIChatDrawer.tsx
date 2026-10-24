import React, { useState, useRef, useEffect } from 'react';
import { UserConfig, ChatMessage, LoggedFoodItem } from '../types/config';
import { ThemeStyles, getBorderRadiusClass } from '../utils/themeHelper';
import {
  Sparkles,
  Send,
  X,
  Check,
  RotateCcw,
  Bot,
  User,
  Loader2,
  Trash2,
  Sliders,
  Utensils,
  Maximize2,
  Minimize2,
  Key,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import {
  sendChatWithWorker,
  getQuotaStatus,
  AiQuotaError,
} from '../utils/accessControl';

interface AIChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  config: UserConfig;
  themeStyles: ThemeStyles;
  onApplyConfig: (newConfig: UserConfig, summary?: string) => void;
  onRevertConfig: () => void;
  canRevert: boolean;
  onAddMealsFromAI: (meals: Array<{ mealCategoryId: string; name: string; amountGrams: number; nutrients: Record<string, number> }>) => void;
  apiKey?: string;
  demoRequestsUsed?: number;
  totalDemoLimit?: number;
  onIncrementDemoUsage?: () => void;
  onOpenApiKeyModal: () => void;
}

const QUICK_PROMPTS = [
  '🇵🇱 Добавь польский язык (Polski)',
  '🎯 Увеличь норму белка до 160 г и калорий до 2400',
  '💊 Добавь учет витамина B12 (цель: 2.4 мкг, цвет #8b5cf6)',
  '🌿 Включи изумрудную тему (Emerald)',
  '🇩🇪 Добавь немецкий язык (Deutsch)',
  '🌙 Переключи на тему Sunset с теплыми акцентами',
  '🥗 Запиши в завтрак: 2 вареных яйца (110г) и тост с авокадо (80г)',
  '⚡ Скрой витамины, оставь только основные КБЖУ и клетчатку',
  '🍽️ Добавь категорию приема пищи "Полдник" с 10% калорий',
  '🔄 Сбрось все настройки к первоначальной программе',
];

export const AIChatDrawer: React.FC<AIChatDrawerProps> = ({
  isOpen,
  onClose,
  config,
  themeStyles,
  onApplyConfig,
  onRevertConfig,
  canRevert,
  onAddMealsFromAI,
  onIncrementDemoUsage,
  onOpenApiKeyModal,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        config.language.code === 'ru'
          ? 'Привет! Я AI-ассистент на базе **Gemini 3.5 Flash-Lite**. Я управляю всем интерфейсом приложения через структуру `userConfig.json`. Вы можете попросить меня изменить любые цели КБЖУ, добавить новые витамины или микронутриенты, переключить тему, язык, категории приемов пищи или записать съеденные блюда!'
          : "Hello! I am your AI assistant powered by **Gemini 3.5 Flash-Lite**. The whole interface is dynamically driven by `userConfig.json`. Ask me to tweak your nutrition targets, add new vitamins, change themes, switch language, or log food!",
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quota = getQuotaStatus();
  const hasCustomKey = quota.hasAccessKey;
  const remainingDemoRequests = quota.remainingToday;
  const totalDemoLimit = quota.dailyLimit;

  const radiusClass = getBorderRadiusClass(config.theme.borderRadius);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const data = await sendChatWithWorker({
        message: text,
        currentConfig: config,
        history: messages.map((m) => ({ role: m.role, content: m.content })),
      });

      onIncrementDemoUsage?.();
      const updatedQuota = getQuotaStatus();

      let finalMessageText = data.assistantMessage || 'Команда обработана.';
      if (!updatedQuota.hasAccessKey && !data.isLimitReached && updatedQuota.remainingToday <= 2 && updatedQuota.remainingToday > 0) {
        finalMessageText += `\n\n⚠️ Обратите внимание: у вас осталось ${updatedQuota.remainingToday} из ${updatedQuota.dailyLimit} бесплатных запросов на сегодня.`;
      }

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: finalMessageText,
        timestamp: Date.now(),
        configDiffSummary: data.summaryOfChanges || undefined,
        proposedConfig: data.updatedConfig || undefined,
        suggestedMeals: data.suggestedMealsToAdd || undefined,
        isLimitReached: Boolean(data.isLimitReached),
        action: data.action || undefined,
      };

      setMessages((prev) => [...prev, assistantMsg]);

      if (data.isLimitReached || data.action === 'open_api_key_modal') {
        onOpenApiKeyModal();
      } else if (data.updatedConfig) {
        onApplyConfig(data.updatedConfig, data.summaryOfChanges);
      }
    } catch (err: any) {
      if (err instanceof AiQuotaError) {
        if (err.code === 'LIMIT_REACHED') {
          const limitReachedMsg: ChatMessage = {
            id: `limit-${Date.now()}`,
            role: 'assistant',
            content: `⚠️ ${err.message}`,
            timestamp: Date.now(),
            isLimitReached: true,
            action: 'open_api_key_modal',
          };
          setMessages((prev) => [...prev, limitReachedMsg]);
          onOpenApiKeyModal();
        } else {
          const cooldownMsg: ChatMessage = {
            id: `cooldown-${Date.now()}`,
            role: 'assistant',
            content: `⏳ ${err.message}`,
            timestamp: Date.now(),
          };
          setMessages((prev) => [...prev, cooldownMsg]);
        }
      } else {
        console.error('Chat error:', err);
        const errorMsg: ChatMessage = {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: `⚠️ Произошла ошибка при обращении к ИИ: ${err.message || 'Проверьте интернет-соединение'}.`,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: 'reset',
        role: 'assistant',
        content: config.language.code === 'ru' ? 'История диалога очищена.' : 'Chat history cleared.',
        timestamp: Date.now(),
      },
    ]);
  };

  return (
    <div
      className={`fixed bottom-0 right-0 z-50 transition-all duration-300 p-2 sm:p-4 ${
        isExpanded ? 'w-full h-full sm:w-[650px] sm:h-[85vh]' : 'w-full sm:w-[480px] h-[600px] max-h-[90vh]'
      }`}
    >
      <div
        className={`w-full h-full border ${themeStyles.borderColor} ${themeStyles.cardBg} ${radiusClass} shadow-2xl flex flex-col overflow-hidden backdrop-blur-xl`}
      >
        {/* Drawer Header */}
        <div
          className="px-4 py-3 border-b border-slate-800 flex items-center justify-between"
          style={{
            background: `linear-gradient(90deg, ${config.theme.accentColor}25, rgba(139, 92, 246, 0.15))`,
          }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-xs"
              style={{ backgroundColor: config.theme.accentColor }}
            >
              <Sparkles className="w-4 h-4 animate-spin-slow" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>Gemini 3.5 Flash-Lite</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  gemini-3.5-flash-lite
                </span>
              </h3>
              <p className="text-[10px] text-slate-400">
                Data-Driven UI Controller & Nutrition Copilot
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Annual Access / Paywall button */}
            <button
              onClick={onOpenApiKeyModal}
              className={`flex items-center gap-1 px-2 py-1 text-[11px] font-semibold rounded-lg border transition ${
                hasCustomKey
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                  : remainingDemoRequests <= 2
                  ? 'border-amber-500/40 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 animate-pulse'
                  : 'border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20'
              }`}
              title={
                hasCustomKey
                  ? `Годовой доступ активен: осталось ${remainingDemoRequests} из ${totalDemoLimit} запросов сегодня`
                  : `Пробный режим: осталось ${remainingDemoRequests} из ${totalDemoLimit} запросов сегодня`
              }
            >
              <Key className="w-3.5 h-3.5" />
              <span className="hidden sm:inline font-mono">
                {hasCustomKey ? `PRO ${remainingDemoRequests}/${totalDemoLimit}` : `${remainingDemoRequests}/${totalDemoLimit}`}
              </span>
            </button>

            {canRevert && (
              <button
                onClick={onRevertConfig}
                className="p-1.5 rounded-lg text-amber-400 hover:bg-amber-500/10 transition"
                title="Отменить последнее изменение userConfig"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition hidden sm:inline-flex"
              title={isExpanded ? 'Уменьшить' : 'Развернуть'}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setIsClearModalOpen(true)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Очистить историю"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Закрыть"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    isUser
                      ? 'bg-slate-700 text-slate-200'
                      : 'bg-gradient-to-br from-emerald-500 to-purple-600 text-white shadow-xs'
                  }`}
                >
                  {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                </div>

                <div className={`max-w-[85%] space-y-2`}>
                  <div
                    className={`p-3 rounded-2xl ${
                      isUser
                        ? 'bg-emerald-600 text-white rounded-tr-none'
                        : 'bg-slate-800/80 border border-slate-700/70 text-slate-200 rounded-tl-none shadow-xs'
                    }`}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  </div>

                  {/* Config change card if proposed */}
                  {msg.configDiffSummary && (
                    <div className="p-3 rounded-xl border border-emerald-500/40 bg-emerald-950/40 text-emerald-200 space-y-2">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-300">
                        <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Конфигурация UI обновлена:</span>
                      </div>
                      <p className="text-[11px] text-emerald-200/90">{msg.configDiffSummary}</p>
                      {msg.proposedConfig && (
                        <div className="pt-1 flex items-center gap-2">
                          <button
                            onClick={() => onApplyConfig(msg.proposedConfig!, msg.configDiffSummary)}
                            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition"
                          >
                            <Check className="w-3 h-3" />
                            <span>Применено</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Limit reached action card */}
                  {(msg.isLimitReached || msg.action === 'open_api_key_modal') && (
                    <div className="p-3.5 rounded-xl border border-amber-500/50 bg-amber-950/40 text-amber-200 space-y-2.5">
                      <div className="flex items-center gap-1.5 font-bold text-amber-300">
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                        <span>Полный доступ на 1 год:</span>
                      </div>
                      <p className="text-[11px] text-amber-200/90 leading-relaxed">
                        Неограниченная база продуктов, до 100 ИИ-сканирований и рецептов в день, поддержка BLIK и банковских карт.
                      </p>
                      <button
                        onClick={onOpenApiKeyModal}
                        className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-500 text-white shadow-lg transition active:scale-95"
                      >
                        <Key className="w-3.5 h-3.5 text-yellow-300" />
                        <span>Открыть «Годовой доступ»</span>
                      </button>
                    </div>
                  )}

                  {/* Suggested meals logging card if food was mentioned */}
                  {msg.suggestedMeals && msg.suggestedMeals.length > 0 && (
                    <div className="p-3 rounded-xl border border-purple-500/40 bg-purple-950/40 text-purple-200 space-y-2">
                      <div className="flex items-center gap-1.5 font-bold text-purple-300">
                        <Utensils className="w-3.5 h-3.5 text-purple-400" />
                        <span>Распознаны блюда для дневника:</span>
                      </div>
                      <div className="space-y-1">
                        {msg.suggestedMeals.map((m, idx) => (
                          <div key={idx} className="text-[11px] flex justify-between text-purple-200/90">
                            <span>• {m.name} ({m.amountGrams}г)</span>
                            <span className="font-mono text-purple-300">{Math.round(m.nutrients['calories'] || 0)} ккал</span>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() => onAddMealsFromAI(msg.suggestedMeals!)}
                        className="w-full flex items-center justify-center gap-1 py-1.5 text-[11px] font-bold rounded-lg bg-purple-600 hover:bg-purple-500 text-white transition active:scale-95"
                      >
                        <Check className="w-3 h-3" />
                        <span>Записать в дневник</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-center gap-2 text-slate-400 text-xs py-2 pl-9">
              <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
              <span>Gemini Flash анализирует и обновляет userConfig...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick prompt chips */}
        <div className="px-3 py-2 border-t border-slate-800/80 bg-slate-900/40 overflow-x-auto whitespace-nowrap flex gap-1.5 no-scrollbar">
          {QUICK_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt)}
              disabled={isLoading}
              className="inline-flex px-2.5 py-1 rounded-lg border border-slate-800 bg-slate-800/70 hover:bg-slate-700/80 text-[11px] text-slate-300 hover:text-white transition active:scale-95 shrink-0"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input area */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/60">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={config.language.labels.chatPlaceholder}
              disabled={isLoading}
              className={`flex-1 px-3 py-2 text-xs rounded-xl border ${themeStyles.inputBg} focus:outline-hidden focus:ring-2 focus:ring-emerald-500`}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-2.5 rounded-xl text-white shadow-md disabled:opacity-40 transition active:scale-95"
              style={{ backgroundColor: config.theme.accentColor }}
              title={config.language.labels.chatSend}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Delete/Clear Chat Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isClearModalOpen}
        title="Очистить историю диалога?"
        message="Вы уверены, что хотите удалить всю историю переписки с ассистентом Gemini? Это действие необратимо."
        itemName="История чата Gemini"
        confirmLabel="Очистить"
        cancelLabel="Отмена"
        themeStyles={themeStyles}
        onCancel={() => setIsClearModalOpen(false)}
        onConfirm={() => {
          handleClearHistory();
          setIsClearModalOpen(false);
        }}
      />
    </div>
  );
};
