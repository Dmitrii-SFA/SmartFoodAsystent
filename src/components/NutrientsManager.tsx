import React, { useState } from 'react';
import { MetricConfig, LocalizationLabels } from '../types/config';
import { ThemeStyles, getBorderRadiusClass } from '../utils/themeHelper';
import {
  Activity,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Star,
  Filter,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { getNutrientColor } from '../utils/nutrientColors';

interface NutrientsManagerProps {
  metrics: MetricConfig[];
  themeStyles: ThemeStyles;
  accentColor: string;
  borderRadius: string;
  langCode?: string;
  labels?: Partial<LocalizationLabels>;
  apiKey?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onUpdateMetrics: (updated: MetricConfig[], summary?: string) => void;
}

const CORE_PRIMARY_IDS = ['calories', 'proteins', 'fats', 'carbs', 'water'];

export const NutrientsManager: React.FC<NutrientsManagerProps> = ({
  metrics,
  themeStyles,
  accentColor,
  borderRadius,
  langCode = 'ru',
  isCollapsed = false,
  onToggleCollapse,
  onUpdateMetrics,
}) => {
  const [showSecondary, setShowSecondary] = useState<boolean>(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [newLabel, setNewLabel] = useState('');
  const [newUnit, setNewUnit] = useState('mg');
  const [newTarget, setNewTarget] = useState('100');
  const [newColor, setNewColor] = useState('#14b8a6');
  const [newIsPrimary, setNewIsPrimary] = useState(false);

  const [deleteMetricModal, setDeleteMetricModal] = useState<{
    isOpen: boolean;
    id: string;
    name: string;
  }>({
    isOpen: false,
    id: '',
    name: '',
  });

  const radiusClass = getBorderRadiusClass(borderRadius);
  const c = (langCode || 'ru').toLowerCase();
  const isEn = c.startsWith('en');
  const isPl = c.startsWith('pl');

  const CATEGORY_LABELS: Record<string, string> = {
    all: isEn ? 'All' : isPl ? 'Wszystkie' : 'Все',
    macro: isEn ? 'Macros & Sugars' : isPl ? 'Makro i cukry' : 'Макро и сахара',
    vitamin: isEn ? 'Vitamins' : isPl ? 'Witaminy' : 'Витамины',
    mineral: isEn ? 'Minerals' : isPl ? 'Minerały' : 'Минералы',
    other: isEn ? 'Fiber, Fats, Amino' : isPl ? 'Błonnik, Tłuszcze, Amino' : 'Клетчатка, Жиры, Амино',
    custom: isEn ? 'Custom' : isPl ? 'Własne' : 'Свои',
  };

  const isMetricPrimary = (m: MetricConfig) =>
    m.isPrimary !== undefined ? m.isPrimary : CORE_PRIMARY_IDS.includes(m.id);

  const primaryMetrics = (metrics || []).filter((m) => isMetricPrimary(m));
  const allSecondaryMetrics = (metrics || []).filter((m) => !isMetricPrimary(m));
  const selectedSecondaryCount = allSecondaryMetrics.filter(
    (m) => m.showInSummary !== false
  ).length;

  const filteredSecondaryMetrics = allSecondaryMetrics.filter((m) => {
    if (categoryFilter === 'all') return true;
    if (categoryFilter === 'macro') {
      return m.category === 'macro' || m.category === 'energy' || m.category === 'hydration';
    }
    if (categoryFilter === 'other') {
      return m.category === 'fiber' || (m.category as string) === 'other';
    }
    return (m.category || 'other') === categoryFilter;
  });

  const handleToggleVisible = (id: string) => {
    const updated = metrics.map((m) => {
      if (m.id !== id) return m;
      const nextVis = m.showInSummary === false;
      return {
        ...m,
        showInSummary: nextVis,
        showInDetailList: nextVis,
        showInFoodForm: nextVis,
        showInProducts: nextVis,
      };
    });
    onUpdateMetrics(
      updated,
      isEn ? 'Nutrient visibility updated' : isPl ? 'Widoczność składnika zmieniona' : 'Видимость нутриента изменена'
    );
  };

  const handleTogglePrimary = (id: string) => {
    const updated = metrics.map((m) => {
      if (m.id !== id) return m;
      const curPrimary = isMetricPrimary(m);
      return { ...m, isPrimary: !curPrimary, showInSummary: true };
    });
    onUpdateMetrics(
      updated,
      isEn ? 'Nutrient priority updated' : isPl ? 'Priorytet składnika zmieniony' : 'Приоритет нутриента изменён'
    );
  };

  const handleChangeField = (
    id: string,
    field: 'label' | 'target' | 'unit' | 'color',
    val: string | number
  ) => {
    const updated = metrics.map((m) => (m.id === id ? { ...m, [field]: val } : m));
    onUpdateMetrics(
      updated,
      isEn ? 'Nutrient parameters updated' : isPl ? 'Parametry składnika zaktualizowane' : 'Параметры нутриента обновлены'
    );
  };

  const handleDeleteCustom = (id: string) => {
    const targetMetric = metrics.find((m) => m.id === id);
    if (!targetMetric || targetMetric.isProtected || CORE_PRIMARY_IDS.includes(id)) {
      return;
    }
    const updated = metrics.filter((m) => m.id !== id);
    onUpdateMetrics(
      updated,
      isEn ? 'Nutrient deleted' : isPl ? 'Składnik usunięty' : 'Нутриент удалён'
    );
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) return;
    const customMetric: MetricConfig = {
      id: `custom_${Date.now()}`,
      label: newLabel.trim(),
      shortLabel: newLabel.trim().slice(0, 6),
      unit: newUnit.trim() || (isEn || isPl ? 'mg' : 'мг'),
      target: Math.max(1, Number(newTarget) || 100),
      color: newColor,
      showInSummary: true,
      showInDetailList: true,
      showInFoodForm: true,
      showInProducts: true,
      isPrimary: newIsPrimary,
      category: 'custom',
    };
    onUpdateMetrics([...metrics, customMetric], `+ ${customMetric.label}`);
    setNewLabel('');
  };

  const activeCount = (metrics || []).filter((m) => m.showInSummary !== false).length;
  const totalCount = (metrics || []).length;

  const renderMetricRow = (m: MetricConfig) => {
    const isPrimary = isMetricPrimary(m);
    const isProtectedCore = Boolean(m.isProtected || CORE_PRIMARY_IDS.includes(m.id));
    const isVisible = m.showInSummary !== false;
    const metricColor = getNutrientColor(m.id, metrics, m.color);

    return (
      <div
        key={m.id}
        className={`flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 p-2.5 rounded-xl border transition text-xs ${
          isVisible
            ? 'bg-slate-900/75 border-slate-800 hover:border-slate-700'
            : 'bg-slate-950/40 border-slate-900 opacity-60 hover:opacity-90'
        }`}
      >
        {/* Left: Color Picker + Name + Star Primary Toggle */}
        <div className="flex items-center gap-2 flex-1 min-w-[180px]">
          <input
            type="color"
            value={metricColor}
            onChange={(e) => handleChangeField(m.id, 'color', e.target.value)}
            className="w-6 h-6 rounded cursor-pointer bg-transparent border-0 shrink-0"
          />

          <input
            type="text"
            value={m.label}
            onChange={(e) => handleChangeField(m.id, 'label', e.target.value)}
            className="flex-1 min-h-[36px] px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/80 font-semibold"
            style={{ color: isVisible ? metricColor : '#94a3b8' }}
          />

          <button
            type="button"
            onClick={() => handleTogglePrimary(m.id)}
            className={`min-h-[32px] flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-bold transition shrink-0 ${
              isPrimary
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-amber-300'
            }`}
          >
            <Star className={`w-3 h-3 ${isPrimary ? 'fill-amber-400' : ''}`} />
            <span className="hidden md:inline">
              {isPrimary
                ? isEn
                  ? 'Primary'
                  : isPl
                  ? 'Główny'
                  : 'Основной'
                : isEn
                ? 'Secondary'
                : isPl
                ? 'Dodatkowy'
                : 'Второстеп.'}
            </span>
          </button>
        </div>

        {/* Right: Target + Unit + Visibility + Delete */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1 bg-slate-800/80 px-2 py-1 rounded-lg border border-slate-700">
            <span className="text-[10px] text-slate-400">
              {isEn ? 'Norm:' : isPl ? 'Norma:' : 'Норма:'}
            </span>
            <input
              type="number"
              min="0.1"
              step="any"
              value={m.target}
              onChange={(e) =>
                handleChangeField(m.id, 'target', Math.max(0, Number(e.target.value) || 0))
              }
              className="w-16 bg-transparent font-bold text-right font-mono focus:outline-hidden"
              style={{ color: metricColor }}
            />
            <span className="text-[10px] text-slate-400">{m.unit}</span>
          </div>

          {/* Toggle Visible */}
          <button
            type="button"
            onClick={() => handleToggleVisible(m.id)}
            className={`p-1.5 rounded-lg border transition ${
              isVisible
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                : 'bg-slate-800 border-slate-700 text-slate-500'
            }`}
            title={
              isVisible
                ? isEn
                  ? 'Tracked (click to hide)'
                  : isPl
                  ? 'Śledzony (kliknij, aby ukryć)'
                  : 'Отслеживается (нажмите, чтобы скрыть)'
                : isEn
                ? 'Hidden (click to track)'
                : isPl
                ? 'Ukryty (kliknij, aby śledzić)'
                : 'Скрыт (нажмите, чтобы отслеживать)'
            }
          >
            {isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>

          {/* Protected Core Badge or Delete Any Other Nutrient */}
          {isProtectedCore ? (
            <span className="p-1.5 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-emerald-400/80">
              <ShieldCheck className="w-4 h-4" />
            </span>
          ) : (
            <button
              type="button"
              onClick={() =>
                setDeleteMetricModal({
                  isOpen: true,
                  id: m.id,
                  name: `${m.label} (${m.target} ${m.unit})`,
                })
              }
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-950/50 border border-slate-700 hover:border-red-500/40 text-slate-400 hover:text-red-400 transition"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      id="nutrients-settings-section"
      className={`border ${themeStyles.borderColor} ${themeStyles.cardBg} ${radiusClass} p-4 sm:p-5 shadow-sm transition-all ${
        isCollapsed ? 'space-y-0' : 'space-y-4'
      }`}
    >
      <div
        onClick={onToggleCollapse}
        className={`flex items-start justify-between gap-3 ${
          onToggleCollapse ? 'cursor-pointer select-none group' : ''
        }`}
      >
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
            style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
          >
            <Activity className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <h3
              className={`text-sm sm:text-base font-bold leading-snug break-words ${themeStyles.textPrimary}`}
            >
              {isEn
                ? 'Nutrients & Daily Norms Setup'
                : isPl
                ? 'Konfiguracja składników i norm dziennych'
                : 'Настройка всех нутриентов и норм'}
            </h3>
            <p className={`text-xs leading-relaxed break-words ${themeStyles.textSecondary}`}>
              {isEn
                ? 'First choose which nutrients you want to track. Primary nutrients are selected; expand below to enable secondary nutrients.'
                : isPl
                ? 'Najpierw wybierz składniki do śledzenia. Główne są wybrane; rozwiń poniżej, aby włączyć dodatkowe.'
                : 'Сначала выберите нутриенты для подсчёта. Основные выбраны сразу, а второстепенные свёрнуты под кнопкой ниже.'}
            </p>
            <div className="pt-1">
              <span className="inline-flex items-center text-[11px] font-mono tabular-nums px-2.5 py-0.5 rounded-lg bg-slate-800/90 border border-slate-700 text-slate-200 font-semibold">
                {isEn
                  ? `Active: ${activeCount} / ${totalCount}`
                  : isPl
                  ? `Aktywne: ${activeCount} / ${totalCount}`
                  : `Активно: ${activeCount} из ${totalCount}`}
              </span>
            </div>
          </div>
        </div>

        {onToggleCollapse && (
          <div className="p-1.5 rounded-lg text-slate-400 group-hover:text-white transition shrink-0">
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${
                !isCollapsed ? 'rotate-180' : ''
              }`}
            />
          </div>
        )}
      </div>

      {!isCollapsed && (
        <div className="space-y-4 pt-3.5 border-t border-slate-800/80 animate-in fade-in duration-150">
          {/* Primary Nutrients List (always visible) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                {isEn
                  ? 'Primary nutrients'
                  : isPl
                  ? 'Główne składniki odżywcze'
                  : 'Основные нутриенты'}
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                {primaryMetrics.length}
              </span>
            </div>
            <div className="space-y-1.5">
              {primaryMetrics.map((m) => renderMetricRow(m))}
            </div>
          </div>

          {/* Expand/Collapse Button for Secondary Nutrients */}
          <div className="space-y-3 pt-1">
            <button
              type="button"
              onClick={() => setShowSecondary((prev) => !prev)}
              className={`w-full min-h-[42px] px-4 py-2.5 rounded-xl border text-xs font-bold flex items-center justify-between gap-2 transition active:scale-[0.99] ${
                showSecondary
                  ? 'bg-slate-800/90 border-emerald-500/50 text-emerald-300'
                  : 'bg-slate-900/80 hover:bg-slate-800/70 border-slate-800 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Filter className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">
                  {showSecondary
                    ? isEn
                      ? 'Hide secondary nutrients'
                      : isPl
                      ? 'Ukryj dodatkowe składniki'
                      : 'Скрыть второстепенные нутриенты'
                    : isEn
                    ? 'Show secondary nutrients (sugar, fiber, vitamins, minerals...)'
                    : isPl
                    ? 'Pokaż dodatkowe składniki (cukier, błonnik, witaminy, minerały...)'
                    : 'Показать остальные (второстепенные) нутриенты'}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] font-mono tabular-nums px-2 py-0.5 rounded-lg bg-slate-950/80 border border-slate-700 text-emerald-300">
                  {isEn
                    ? `${selectedSecondaryCount} / ${allSecondaryMetrics.length} selected`
                    : isPl
                    ? `${selectedSecondaryCount} / ${allSecondaryMetrics.length} wybrano`
                    : `Выбрано: ${selectedSecondaryCount} из ${allSecondaryMetrics.length}`}
                </span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    showSecondary ? 'rotate-180' : ''
                  }`}
                />
              </div>
            </button>

            {showSecondary && (
              <div className="space-y-3 p-3 rounded-2xl bg-slate-950/60 border border-slate-800/90 animate-in fade-in duration-150">
                {/* Category Filter for Secondary Nutrients */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Filter className="w-3.5 h-3.5 text-slate-400 mr-1" />
                  {Object.keys(CATEGORY_LABELS).map((catKey) => (
                    <button
                      key={catKey}
                      type="button"
                      onClick={() => setCategoryFilter(catKey)}
                      className={`min-h-[32px] px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition ${
                        categoryFilter === catKey
                          ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {CATEGORY_LABELS[catKey]}
                    </button>
                  ))}
                </div>

                {/* Secondary Metrics List */}
                <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1">
                  {filteredSecondaryMetrics.map((m) => renderMetricRow(m))}
                </div>
              </div>
            )}
          </div>

      {/* Add Custom Nutrient Form */}
      <form
        onSubmit={handleAddCustom}
        className="pt-3 border-t border-slate-800/80 space-y-2 text-xs"
      >
        <div className="font-semibold text-slate-300">
          {isEn
            ? 'Create custom nutrient / tracker:'
            : isPl
            ? 'Utwórz własny składnik odżywczy:'
            : 'Создать собственный нутриент / показатель:'}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
          <input
            type="text"
            required
            placeholder={
              isEn
                ? 'Name (e.g., Taurine, L-Carnitine)'
                : isPl
                ? 'Nazwa (np. Tauryna, L-Karnityna)'
                : 'Название (напр. Таурин, Коллаген, L-карнитин)'
            }
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            className="sm:col-span-2 min-h-[40px] px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
          />
          <input
            type="number"
            required
            min="0.1"
            step="any"
            placeholder={isEn ? 'Daily norm' : isPl ? 'Norma dzienna' : 'Суточная норма'}
            value={newTarget}
            onChange={(e) => setNewTarget(e.target.value)}
            className="min-h-[40px] px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
          />
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              placeholder={isEn || isPl ? 'Unit (mg, g)' : 'Ед. (мг, г)'}
              value={newUnit}
              onChange={(e) => setNewUnit(e.target.value)}
              className="w-full min-h-[40px] px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
            />
            <input
              type="color"
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
              className="w-9 h-9 rounded-lg cursor-pointer bg-transparent border-0 shrink-0"
            />
          </div>
          <button
            type="submit"
            className="min-h-[40px] py-2 px-4 rounded-xl font-bold text-white flex items-center justify-center gap-1.5 transition"
            style={{ backgroundColor: accentColor }}
          >
            <Plus className="w-4 h-4" />
            <span>{isEn ? 'Add' : isPl ? 'Dodaj' : 'Добавить'}</span>
          </button>
        </div>
          <label className="flex items-center gap-2 text-[11px] text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              checked={newIsPrimary}
              onChange={(e) => setNewIsPrimary(e.target.checked)}
              className="rounded border-slate-700"
            />
            <span>
              {isEn
                ? 'Immediately show in Primary daily block'
                : isPl
                ? 'Od razu pokaż w głównym bloku dziennym'
                : 'Сразу закрепить в Основном блоке дневной нормы'}
            </span>
          </label>
        </form>
        </div>
      )}

      {/* Delete Nutrient Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteMetricModal.isOpen}
        title={isEn ? 'Delete nutrient?' : isPl ? 'Usunąć składnik?' : 'Удалить нутриент?'}
        message={
          isEn
            ? 'Are you sure you want to delete this nutrient?'
            : isPl
            ? 'Czy na pewno chcesz usunąć ten składnik?'
            : 'Вы уверены, что хотите удалить этот нутриент из списка отслеживаемых показателей?'
        }
        itemName={deleteMetricModal.name}
        confirmLabel={isEn ? 'Delete' : isPl ? 'Usuń' : 'Удалить'}
        cancelLabel={isEn ? 'Cancel' : isPl ? 'Anuluj' : 'Отмена'}
        themeStyles={themeStyles}
        onCancel={() => setDeleteMetricModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={() => {
          handleDeleteCustom(deleteMetricModal.id);
          setDeleteMetricModal((prev) => ({ ...prev, isOpen: false }));
        }}
      />
    </div>
  );
};
