import {
  CookwareVessel,
  CookingStepItem,
  HeatSource,
  GasLevel,
  OvenMode,
  RecipeIngredient,
} from '../types/config';

import { COOKWARE_ICON_DEFS, resolveCookwareIconId } from '../components/recipes/CookwareIcon';

export const COOKWARE_ICONS: string[] = COOKWARE_ICON_DEFS.map((d) => d.id);

export interface ExtraHeatSourceDefinition {
  id: HeatSource;
  label: string;
  shortLabel: string;
  icon: string;
  controlType: 'temp' | 'program' | 'power' | 'level' | 'fixed';
  defaultTempC?: number;
  minTempC?: number;
  maxTempC?: number;
  programs?: { id: string; label: string }[];
  defaultProgram?: string;
}

export const EXTRA_HEAT_SOURCES: ExtraHeatSourceDefinition[] = [
  {
    id: 'steamer',
    label: 'Пароварка (На пару)',
    shortLabel: 'Пароварка',
    icon: '💨',
    controlType: 'temp',
    defaultTempC: 100,
    minTempC: 85,
    maxTempC: 105,
  },
  {
    id: 'grill',
    label: 'Гриль / Мангал',
    shortLabel: 'Гриль',
    icon: '🥩',
    controlType: 'temp',
    defaultTempC: 220,
    minTempC: 150,
    maxTempC: 300,
  },
  {
    id: 'airfryer',
    label: 'Аэрогриль',
    shortLabel: 'Аэрогриль',
    icon: '🌪️',
    controlType: 'temp',
    defaultTempC: 190,
    minTempC: 80,
    maxTempC: 240,
  },
  {
    id: 'multicooker',
    label: 'Мультиварка',
    shortLabel: 'Мультиварка',
    icon: '🍲',
    controlType: 'program',
    defaultProgram: 'Тушение',
    programs: [
      { id: 'Тушение', label: 'Тушение' },
      { id: 'Варка / Суп', label: 'Варка / Суп' },
      { id: 'Жарка', label: 'Жарка' },
      { id: 'Выпечка', label: 'Выпечка' },
      { id: 'Томление', label: 'Томление' },
      { id: 'Плов', label: 'Плов' },
      { id: 'На пару', label: 'На пару' },
    ],
  },
  {
    id: 'pressure',
    label: 'Скороварка / Автоклав',
    shortLabel: 'Скороварка',
    icon: '⏱️',
    controlType: 'program',
    defaultProgram: 'Высокое давление (120°C)',
    programs: [
      { id: 'Низкое давление (110°C)', label: 'Низкое давление (110°C)' },
      { id: 'Высокое давление (120°C)', label: 'Высокое давление (120°C)' },
    ],
  },
  {
    id: 'sousvide',
    label: 'Су-вид (Sous-vide)',
    shortLabel: 'Су-вид',
    icon: '🌡️',
    controlType: 'temp',
    defaultTempC: 60,
    minTempC: 40,
    maxTempC: 95,
  },
  {
    id: 'deepfryer',
    label: 'Фритюрница (Во фритюре)',
    shortLabel: 'Фритюр',
    icon: '🍟',
    controlType: 'temp',
    defaultTempC: 175,
    minTempC: 140,
    maxTempC: 200,
  },
  {
    id: 'microwave',
    label: 'Микроволновка (СВЧ)',
    shortLabel: 'СВЧ',
    icon: '⚡',
    controlType: 'program',
    defaultProgram: '800 Вт',
    programs: [
      { id: '300 Вт (Разморозка/Томление)', label: '300 Вт' },
      { id: '600 Вт (Средняя)', label: '600 Вт' },
      { id: '800 Вт (Высокая)', label: '800 Вт' },
      { id: '1000 Вт (Макс.)', label: '1000 Вт' },
    ],
  },
  {
    id: 'wok',
    label: 'Вок (Стир-фрай)',
    shortLabel: 'Вок',
    icon: '🥢',
    controlType: 'program',
    defaultProgram: 'Сильный жар (Стир-фрай)',
    programs: [
      { id: 'Средний жар', label: 'Средний жар' },
      { id: 'Сильный жар (Стир-фрай)', label: 'Сильный жар (Стир-фрай)' },
    ],
  },
  {
    id: 'smoker',
    label: 'Коптильня',
    shortLabel: 'Коптильня',
    icon: '🪵',
    controlType: 'temp',
    defaultTempC: 95,
    minTempC: 25,
    maxTempC: 140,
  },
  {
    id: 'bainmarie',
    label: 'Водяная баня',
    shortLabel: 'Водяная баня',
    icon: '💧',
    controlType: 'temp',
    defaultTempC: 80,
    minTempC: 50,
    maxTempC: 98,
  },
  {
    id: 'toaster',
    label: 'Вафельница / Тостер / Гриль-пресс',
    shortLabel: 'Вафельница',
    icon: '🧇',
    controlType: 'program',
    defaultProgram: 'Средняя прожарка',
    programs: [
      { id: 'Лёгкая румяность', label: 'Лёгкая' },
      { id: 'Средняя прожарка', label: 'Средняя' },
      { id: 'Хрустящая корочка', label: 'Сильная' },
    ],
  },
];

export type AutoCookingMethod =
  | 'boiling'
  | 'stewing'
  | 'frying'
  | 'baking'
  | 'steaming'
  | 'grilling'
  | 'airfrying'
  | 'multicooking'
  | 'pressure_cooking'
  | 'sousvide'
  | 'deepfrying'
  | 'microwaving'
  | 'wok_frying'
  | 'smoking'
  | 'bainmarie'
  | 'toasting'
  | 'mixing';

export interface DetectedCookingMethodInfo {
  method: AutoCookingMethod;
  label: string; // e.g., 'Варится', 'Тушится', 'Жарится', 'Запекается', 'Смешивание'
  description: string;
  badgeColor: string;
}

/**
 * Helper to check if a library item or ingredient represents water
 */
export function isWaterFoodItem(foodId: string, foodName: string): boolean {
  if (foodId === 'lib-water') return true;
  const normalized = (foodName || '').trim().toLowerCase();
  return (
    normalized === 'вода' ||
    normalized === 'вода питьевая' ||
    normalized === 'кипяток' ||
    normalized === 'water' ||
    normalized === 'drinking water' ||
    normalized === 'woda' ||
    normalized === 'woda pitna'
  );
}

/**
 * Helper to check if a step item represents transferring the contents of another cookware vessel
 */
export function isVesselTransferItem(item: CookingStepItem): boolean {
  return Boolean(item.sourceVesselId || (item.foodId && item.foodId.startsWith('vessel-transfer:')));
}

/**
 * Helper to check if a step item is a regime-only step (no new ingredients added, only heat/oven/lid change)
 */
export function isRegimeOnlyStepItem(item: CookingStepItem): boolean {
  return Boolean(item.isRegimeOnly || item.foodId === 'step-regime-only');
}

/**
 * Check if a step item has thermal processing enabled
 */
export function isStepItemThermal(item: CookingStepItem): boolean {
  if (item.hasThermalProcessing === false) return false;
  if (item.hasThermalProcessing === true) return true;
  // Legacy fallback: if stepHeatSource is defined or hasThermalProcessing was not explicitly false, treat as true
  return true;
}

/**
 * Get the icon for a vessel (resolved to a pure cookware icon ID)
 */
export function getVesselDisplayIcon(vessel: CookwareVessel): string {
  if (vessel.icon) {
    return resolveCookwareIconId(vessel.icon, vessel.name);
  }
  switch (vessel.type) {
    case 'pan':
      return 'pan_classic';
    case 'oven':
      return 'baking_dish';
    case 'saucepan':
      return 'pan_deep';
    case 'steamer':
      return 'steamer';
    case 'grill':
      return 'pan_grill';
    default:
      return resolveCookwareIconId(undefined, vessel.name);
  }
}

/**
 * Get the display name for a vessel (fallback if user left it blank)
 */
export function getVesselDisplayName(vessel: CookwareVessel, index?: number): string {
  const trimmed = (vessel.name || '').trim();
  if (trimmed) return trimmed;
  return index !== undefined ? `Посуда #${index + 1}` : 'Посуда без названия';
}

export interface StepRegimeInput {
  hasThermalProcessing?: boolean;
  heatSource: HeatSource;
  electricLevel?: number;
  gasLevel?: GasLevel;
  ovenTempC?: number;
  ovenMode?: OvenMode;
  extraMode?: string;
  hasLid?: boolean;
}

/**
 * Convert any GasLevel (legacy preset string or 1..9 number) into a numeric level from 1 to 9
 */
export function resolveGasLevelNumber(gasLevel?: GasLevel): number {
  if (typeof gasLevel === 'number' && !isNaN(gasLevel)) {
    return Math.max(1, Math.min(9, Math.round(gasLevel)));
  }
  switch (gasLevel) {
    case 'simmer':
      return 2;
    case 'low':
      return 3;
    case 'medium':
      return 5;
    case 'high':
      return 8;
    default: {
      const parsed = Number(gasLevel);
      if (!isNaN(parsed) && parsed >= 1 && parsed <= 9) {
        return Math.round(parsed);
      }
      return 5;
    }
  }
}

/**
 * Format compact label for a cooking regime (used in step headers & vessel badges)
 */
export function formatRegimeBadgeText(regime: StepRegimeInput, langCode: string = 'ru'): string {
  const c = (langCode || 'ru').toLowerCase();
  const isEn = c.startsWith('en');
  const isPl = c.startsWith('pl');

  if (regime.hasThermalProcessing === false) {
    return isEn ? '🥣 No heat' : isPl ? '🥣 Bez podgrzewania' : '🥣 Без нагрева';
  }
  const lidSuffix = regime.hasLid
    ? isEn
      ? ' · Lid ON'
      : isPl
      ? ' · Z pokrywką'
      : ' · 盖 С крышкой'
    : isEn
    ? ' · No lid'
    : isPl
    ? ' · Bez pokrywki'
    : ' · Без крышки';

  if (regime.heatSource === 'oven') {
    const temp = regime.ovenTempC || 180;
    const ovenWord = isEn ? 'Oven' : isPl ? 'Piekarnik' : 'Духовка';
    return `♨️ ${ovenWord} ${temp}°C${lidSuffix}`;
  }
  if (regime.heatSource === 'gas') {
    const lvl = resolveGasLevelNumber(regime.gasLevel);
    const gasWord = isEn ? 'Gas' : isPl ? 'Gaz' : 'Газ';
    return `🔥 ${gasWord} ${lvl}/9${lidSuffix}`;
  }
  if (regime.heatSource === 'electric') {
    const el = regime.electricLevel || 5;
    const elWord = isEn ? 'Stove' : isPl ? 'Płyta' : 'Плита';
    return `⚡ ${elWord} ${el}/9${lidSuffix}`;
  }

  // Check extra heat sources
  const extraDef = EXTRA_HEAT_SOURCES.find((e) => e.id === regime.heatSource);
  if (extraDef) {
    if (extraDef.controlType === 'temp') {
      const temp = regime.ovenTempC || extraDef.defaultTempC || 180;
      return `${extraDef.icon} ${extraDef.shortLabel} ${temp}°C${lidSuffix}`;
    }
    if (extraDef.controlType === 'program') {
      const prog = regime.extraMode || extraDef.defaultProgram || '';
      return `${extraDef.icon} ${extraDef.shortLabel}${prog ? ` (${prog})` : ''}${lidSuffix}`;
    }
    return `${extraDef.icon} ${extraDef.shortLabel}${lidSuffix}`;
  }

  return `⚡ Плита ${regime.electricLevel || 5}/9${lidSuffix}`;
}

/**
 * Automatically determine whether food in a step or vessel is boiling, stewing, frying, baking, or mixing
 * based on thermal processing flag, water volume, solids weight, and active heat regime.
 */
export function detectRegimeCookingMode(
  regime: StepRegimeInput,
  waterMl: number,
  solidsGrams: number
): DetectedCookingMethodInfo {
  if (regime.hasThermalProcessing === false) {
    return {
      method: 'mixing',
      label: 'Смешивание',
      description: 'Смешивание и подготовка продуктов без термообработки',
      badgeColor: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
    };
  }

  const totalMass = waterMl + solidsGrams;
  const waterRatio = totalMass > 0 ? waterMl / totalMass : 0;

  // Handle extra cooking methods first
  switch (regime.heatSource) {
    case 'steamer':
      return {
        method: 'steaming',
        label: 'На пару',
        description: `Приготовление на пару (${regime.ovenTempC || 100}°C)`,
        badgeColor: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
      };
    case 'grill':
      return {
        method: 'grilling',
        label: 'На гриле',
        description: `Обжарка на гриле / углях (${regime.ovenTempC || 220}°C)`,
        badgeColor: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
      };
    case 'airfryer':
      return {
        method: 'airfrying',
        label: 'В аэрогриле',
        description: `Запекание горячим воздухом (${regime.ovenTempC || 190}°C)`,
        badgeColor: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      };
    case 'multicooker': {
      const prog = regime.extraMode || 'Тушение';
      return {
        method: 'multicooking',
        label: `Мультиварка: ${prog}`,
        description: `Автопрограмма мультиварки «${prog}»`,
        badgeColor: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
      };
    }
    case 'pressure':
      return {
        method: 'pressure_cooking',
        label: 'Под давлением',
        description: `Скороварка / Автоклав (${regime.extraMode || 'Высокое давление'})`,
        badgeColor: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
      };
    case 'sousvide':
      return {
        method: 'sousvide',
        label: 'Су-вид',
        description: `Томление в вакууме при точной температуре ${regime.ovenTempC || 60}°C`,
        badgeColor: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
      };
    case 'deepfryer':
      return {
        method: 'deepfrying',
        label: 'Во фритюре',
        description: `Обжарка во фритюре (${regime.ovenTempC || 175}°C)`,
        badgeColor: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
      };
    case 'microwave':
      return {
        method: 'microwaving',
        label: 'СВЧ-нагрев',
        description: `Приготовление в микроволновке (${regime.extraMode || '800 Вт'})`,
        badgeColor: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
      };
    case 'wok':
      return {
        method: 'wok_frying',
        label: 'Вок (Стир-фрай)',
        description: `Быстрая обжарка в воке (${regime.extraMode || 'Сильный жар'})`,
        badgeColor: 'bg-red-500/15 text-red-300 border-red-500/30',
      };
    case 'smoker':
      return {
        method: 'smoking',
        label: 'Копчение',
        description: `Коптильня (${regime.ovenTempC || 95}°C)`,
        badgeColor: 'bg-amber-600/15 text-amber-300 border-amber-500/30',
      };
    case 'bainmarie':
      return {
        method: 'bainmarie',
        label: 'Водяная баня',
        description: `Деликатный нагрев на водяной бане (${regime.ovenTempC || 80}°C)`,
        badgeColor: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
      };
    case 'toaster':
      return {
        method: 'toasting',
        label: 'Запекание / Пресс',
        description: `Вафельница / тостер (${regime.extraMode || 'Средняя прожарка'})`,
        badgeColor: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      };
    default:
      break;
  }

  // Oven mode
  if (regime.heatSource === 'oven') {
    const temp = regime.ovenTempC || 180;
    if (waterMl > 0 && (waterRatio >= 0.2 || temp <= 160)) {
      return {
        method: 'stewing',
        label: 'Тушится',
        description: `Томление и тушение с влагой в духовке (${temp}°C)`,
        badgeColor: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
      };
    }
    return {
      method: 'baking',
      label: 'Запекается',
      description: `Запекание в духовке (${temp}°C)`,
      badgeColor: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    };
  }

  // Determine heat intensity (low / medium / high) for stovetop (electric or gas)
  let heatIntensity: 'low' | 'medium' | 'high' = 'medium';
  if (regime.heatSource === 'electric') {
    const lvl = regime.electricLevel || 5;
    if (lvl <= 4) heatIntensity = 'low';
    else if (lvl <= 6) heatIntensity = 'medium';
    else heatIntensity = 'high';
  } else if (regime.heatSource === 'gas') {
    const lvl = resolveGasLevelNumber(regime.gasLevel);
    if (lvl <= 4) heatIntensity = 'low';
    else if (lvl <= 6) heatIntensity = 'medium';
    else heatIntensity = 'high';
  }

  if (waterMl > 0) {
    if (waterRatio >= 0.35) {
      return {
        method: 'boiling',
        label: 'Варится',
        description: `Варка в жидкости (${waterMl} мл воды)`,
        badgeColor: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
      };
    }
    if (heatIntensity === 'high' && waterRatio < 0.15) {
      return {
        method: 'frying',
        label: 'Жарится',
        description: 'Активная обжарка на сильном нагреве с минимальным количеством влаги',
        badgeColor: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
      };
    }
    return {
      method: 'stewing',
      label: 'Тушится',
      description: `Тушение в собственном соку и воде (${waterMl} мл)`,
      badgeColor: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    };
  }

  // No water added (waterMl === 0)
  if (heatIntensity === 'low') {
    return {
      method: 'stewing',
      label: 'Тушится',
      description: 'Томление и тушение в собственном соку на малом нагреве без воды',
      badgeColor: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    };
  }

  return {
    method: 'frying',
    label: 'Жарится',
    description: 'Жарка без добавления воды на среднем/сильном нагреве',
    badgeColor: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
  };
}

/**
 * Automatically determine whether food in a vessel is boiling, stewing, frying, baking, or mixing
 */
export function detectVesselCookingMode(vessel: CookwareVessel): DetectedCookingMethodInfo {
  const stepItems = vessel.stepItems || [];
  let waterFromSteps = 0;
  let solidsGrams = 0;

  for (const item of stepItems) {
    if (isRegimeOnlyStepItem(item)) continue;
    if (isWaterFoodItem(item.foodId, item.foodName)) {
      waterFromSteps += Number(item.grams) || 0;
    } else {
      solidsGrams += Number(item.grams) || 0;
    }
  }

  const waterMl = Math.max(Number(vessel.waterAddedMl) || 0, waterFromSteps);

  // Check if any step in the vessel has thermal processing enabled
  const thermalSteps = stepItems.filter((s) => isStepItemThermal(s));
  if (stepItems.length > 0 && thermalSteps.length === 0) {
    return detectRegimeCookingMode(
      { hasThermalProcessing: false, heatSource: 'electric' },
      waterMl,
      solidsGrams
    );
  }

  // Use the last thermal step's regime if available, or vessel fallback
  const lastThermal = thermalSteps[thermalSteps.length - 1];
  return detectRegimeCookingMode(
    {
      hasThermalProcessing: true,
      heatSource: lastThermal?.stepHeatSource ?? vessel.heatSource ?? 'electric',
      electricLevel: lastThermal?.stepElectricLevel ?? vessel.electricLevel ?? 5,
      gasLevel: lastThermal?.stepGasLevel ?? vessel.gasLevel ?? 'medium',
      ovenTempC: lastThermal?.stepOvenTempC ?? vessel.ovenTempC ?? 180,
      ovenMode: lastThermal?.stepOvenMode ?? vessel.ovenMode ?? 'top_bottom',
      extraMode: lastThermal?.stepExtraMode,
      hasLid: lastThermal?.stepHasLid ?? vessel.hasLid,
    },
    waterMl,
    solidsGrams
  );
}

/**
 * Calculate evaporation rate in ml/min for a specific regime (heat source, power/temp, and lid).
 * If hasThermalProcessing === false, evaporation rate is 0 ml/min.
 * Covering the cookware with a lid (hasLid === true) reduces water evaporation rate by 65% (multiplier 0.35).
 */
export function getRegimeEvaporationRateMlPerMin(regime: StepRegimeInput): number {
  if (regime.hasThermalProcessing === false) {
    return 0;
  }

  let baseRateMlPerMin = 4.0;

  switch (regime.heatSource) {
    case 'electric': {
      const level = Math.max(1, Math.min(9, regime.electricLevel || 5));
      const electricRates: Record<number, number> = {
        1: 0.8,
        2: 1.5,
        3: 2.5,
        4: 3.8,
        5: 5.2,
        6: 7.0,
        7: 9.0,
        8: 11.5,
        9: 14.0,
      };
      baseRateMlPerMin = electricRates[level] || 5.2;
      break;
    }
    case 'gas': {
      const level = resolveGasLevelNumber(regime.gasLevel);
      const gasNumericRates: Record<number, number> = {
        1: 0.9,
        2: 1.6,
        3: 2.8,
        4: 4.2,
        5: 5.8,
        6: 7.6,
        7: 9.8,
        8: 12.2,
        9: 14.8,
      };
      baseRateMlPerMin = gasNumericRates[level] || 5.8;
      break;
    }
    case 'oven': {
      const temp = Math.max(30, Math.min(350, regime.ovenTempC || 180));
      baseRateMlPerMin = Math.max(0.5, ((temp - 50) / 150) * 5.0);
      if (regime.ovenMode === 'convection' || regime.ovenMode === 'turbo_grill') {
        baseRateMlPerMin *= 1.25;
      }
      break;
    }
    case 'steamer':
      baseRateMlPerMin = 1.2;
      break;
    case 'grill':
      baseRateMlPerMin = 8.5;
      break;
    case 'airfryer':
      baseRateMlPerMin = 6.0;
      break;
    case 'multicooker': {
      const prog = regime.extraMode || 'Тушение';
      if (prog.includes('Жарка')) baseRateMlPerMin = 6.5;
      else if (prog.includes('Томление')) baseRateMlPerMin = 1.0;
      else baseRateMlPerMin = 2.0;
      break;
    }
    case 'pressure':
      baseRateMlPerMin = 0.6; // sealed pressure vessel loses almost no water
      break;
    case 'sousvide':
      baseRateMlPerMin = 0; // vacuum sealed bag loses 0 water
      break;
    case 'deepfryer':
      baseRateMlPerMin = 9.0;
      break;
    case 'microwave':
      baseRateMlPerMin = 3.5;
      break;
    case 'wok':
      baseRateMlPerMin = 12.5;
      break;
    case 'smoker':
      baseRateMlPerMin = 1.8;
      break;
    case 'bainmarie':
      baseRateMlPerMin = 1.0;
      break;
    case 'toaster':
      baseRateMlPerMin = 4.5;
      break;
    default:
      baseRateMlPerMin = 4.0;
  }

  // Lid modifier: covered cookware retains steam and reduces evaporation speed by 65%
  const lidMultiplier = regime.hasLid ? 0.35 : 1.0;

  return baseRateMlPerMin * lidMultiplier;
}

/**
 * Legacy helper for a vessel's base evaporation rate
 */
export function getEvaporationRateMlPerMin(vessel: CookwareVessel): number {
  return getRegimeEvaporationRateMlPerMin({
    hasThermalProcessing: true,
    heatSource: vessel.heatSource,
    electricLevel: vessel.electricLevel,
    gasLevel: vessel.gasLevel,
    ovenTempC: vessel.ovenTempC,
    ovenMode: vessel.ovenMode,
    hasLid: vessel.hasLid,
  });
}

export interface CookingStepGroup {
  addedAtMinute: number; // relative minute within this vessel (e.g. 0, 90, 110)
  recipeStartMinute: number; // global recipe minute when this step starts
  recipeEndMinute: number; // global recipe minute when this step ends
  durationMinutes: number; // duration of this step (interval until next step or end)
  items: CookingStepItem[];
  // Effective cooking regime for this step
  hasThermalProcessing: boolean;
  hasCustomRegime: boolean;
  effectiveHeatSource: HeatSource;
  effectiveElectricLevel: number;
  effectiveGasLevel: GasLevel;
  effectiveOvenTempC: number;
  effectiveOvenMode: OvenMode;
  effectiveExtraMode?: string;
  effectiveHasLid: boolean;
  stepCookingMode: DetectedCookingMethodInfo;
  regimeBadgeText: string;
}

/**
 * Group step items that share the same addedAtMinute into a single chronological Step,
 * and calculate cumulative cooking time for each item and total time for the vessel.
 *
 * Duration calculation rule:
 * - Items added at the same minute belong to the same Step.
 * - If a subsequent Step is added at a later minute (e.g. Step 1 at 0m, Step 2 at 90m),
 *   the interval between Step 1 and Step 2 is (90 - 0) = 90m.
 * - For the final Step (e.g. at 110m with duration 15m), the vessel finishes at 110 + 15 = 125m.
 */
export function calculateVesselStepItems(
  vessel: CookwareVessel,
  vesselIndex: number = 0
): {
  enrichedItems: CookingStepItem[];
  groupedSteps: CookingStepGroup[];
  totalTimeMinutes: number;
  startOffsetMinutes: number;
  recipeEndMinute: number;
  waterFromStepsMl: number;
  cookingMode: DetectedCookingMethodInfo;
} {
  const startOffsetMinutes =
    vesselIndex === 0 ? 0 : Math.max(0, Math.round(Number(vessel.startOffsetMinutes) || 0));

  const items = [...(vessel.stepItems || [])].sort(
    (a, b) => (Number(a.addedAtMinute) || 0) - (Number(b.addedAtMinute) || 0)
  );

  let waterFromStepsMl = 0;
  for (const item of items) {
    if (isRegimeOnlyStepItem(item)) continue;
    if (isWaterFoodItem(item.foodId, item.foodName)) {
      waterFromStepsMl += Math.max(0, Number(item.grams) || 0);
    }
  }

  if (items.length === 0) {
    const vesselWithWater = {
      ...vessel,
      waterAddedMl: Math.max(Number(vessel.waterAddedMl) || 0, waterFromStepsMl),
    };
    return {
      enrichedItems: [],
      groupedSteps: [],
      totalTimeMinutes: 0,
      startOffsetMinutes,
      recipeEndMinute: startOffsetMinutes,
      waterFromStepsMl,
      cookingMode: detectRegimeCookingMode(
        { hasThermalProcessing: false, heatSource: 'electric' },
        vesselWithWater.waterAddedMl,
        0
      ),
    };
  }

  // Group items by addedAtMinute
  const minuteMap = new Map<number, CookingStepItem[]>();
  for (const item of items) {
    const min = Math.max(0, Math.round(Number(item.addedAtMinute) || 0));
    const list = minuteMap.get(min) || [];
    list.push({ ...item, addedAtMinute: min });
    minuteMap.set(min, list);
  }

  const sortedMinutes = Array.from(minuteMap.keys()).sort((a, b) => a - b);

  // Determine the vessel end minute (relative to vessel start = 0)
  const lastStepMinute = sortedMinutes[sortedMinutes.length - 1];
  const lastStepGroupItems = minuteMap.get(lastStepMinute) || [];
  const lastStepDuration = lastStepGroupItems.reduce(
    (maxD, it) => Math.max(maxD, Math.max(0, Math.round(Number(it.durationMinutes) || 0))),
    0
  );

  // Total vessel time is primarily driven by the timeline end: lastStepMinute + lastStepDuration
  let totalTimeMinutes = lastStepMinute + lastStepDuration;

  for (let i = 0; i < sortedMinutes.length - 1; i++) {
    const curMin = sortedMinutes[i];
    const nextMin = sortedMinutes[i + 1];
    if (nextMin <= curMin) {
      const grp = minuteMap.get(curMin) || [];
      const dur = grp.reduce((m, it) => Math.max(m, Math.max(0, Number(it.durationMinutes) || 0)), 0);
      totalTimeMinutes = Math.max(totalTimeMinutes, curMin + dur);
    }
  }

  // Enrich each item with its true cumulative cooking duration inside this vessel
  const enrichedItems: CookingStepItem[] = items.map((item) => {
    const addedAt = Math.max(0, Math.round(Number(item.addedAtMinute) || 0));
    const endMin =
      item.isExtracted && item.extractedAtMinute && item.extractedAtMinute > addedAt
        ? Math.min(totalTimeMinutes, item.extractedAtMinute)
        : totalTimeMinutes;
    const cumulativeDurationMinutes = Math.max(0, endMin - addedAt);
    return {
      ...item,
      addedAtMinute: addedAt,
      cumulativeDurationMinutes,
    };
  });

  // Rebuild grouped steps with enriched items & per-step effective cooking regime
  let cumulativeWaterMl = Number(vessel.waterAddedMl) || 0;
  let cumulativeSolidsGrams = 0;

  // Running regime state across steps so that when thermal processing is enabled on a subsequent step,
  // it defaults to the previous thermal step's settings unless overridden
  let runningHeatSource: HeatSource = vessel.heatSource || 'electric';
  let runningElectricLevel: number = vessel.electricLevel || 5;
  let runningGasLevel: GasLevel = vessel.gasLevel || 'medium';
  let runningOvenTempC: number = vessel.ovenTempC || 180;
  let runningOvenMode: OvenMode = vessel.ovenMode || 'top_bottom';
  let runningExtraMode: string | undefined = undefined;
  let runningHasLid: boolean = Boolean(vessel.hasLid);

  const groupedSteps: CookingStepGroup[] = sortedMinutes.map((min, idx) => {
    const nextMin = idx < sortedMinutes.length - 1 ? sortedMinutes[idx + 1] : totalTimeMinutes;
    const stepDuration = Math.max(0, nextMin - min);
    const stepItemsForMin = enrichedItems.filter((it) => it.addedAtMinute === min);

    // Accumulate water and solids present in the vessel at this step
    for (const stItem of stepItemsForMin) {
      if (isRegimeOnlyStepItem(stItem)) continue;
      if (isWaterFoodItem(stItem.foodId, stItem.foodName)) {
        cumulativeWaterMl += Math.max(0, Number(stItem.grams) || 0);
      } else if (!stItem.isExtracted) {
        cumulativeSolidsGrams += Math.max(0, Number(stItem.grams) || 0);
      }
    }

    // Check if thermal processing is enabled for this step group:
    // If any item in this group explicitly has hasThermalProcessing === true, or if none has hasThermalProcessing === false
    const anyThermalTrue = stepItemsForMin.some((it) => it.hasThermalProcessing === true);
    const allThermalFalse =
      stepItemsForMin.length > 0 &&
      stepItemsForMin.every((it) => it.hasThermalProcessing === false);
    const hasThermalProcessing = anyThermalTrue ? true : !allThermalFalse;

    const overrideItem = stepItemsForMin.find(
      (it) =>
        it.stepHeatSource !== undefined ||
        it.stepElectricLevel !== undefined ||
        it.stepGasLevel !== undefined ||
        it.stepOvenTempC !== undefined ||
        it.stepOvenMode !== undefined ||
        it.stepExtraMode !== undefined ||
        it.stepHasLid !== undefined
    );

    const hasCustomRegime = Boolean(overrideItem);

    if (hasThermalProcessing) {
      if (overrideItem?.stepHeatSource !== undefined) {
        runningHeatSource = overrideItem.stepHeatSource;
      }
      if (overrideItem?.stepElectricLevel !== undefined) {
        runningElectricLevel = overrideItem.stepElectricLevel;
      }
      if (overrideItem?.stepGasLevel !== undefined) {
        runningGasLevel = overrideItem.stepGasLevel;
      }
      if (overrideItem?.stepOvenTempC !== undefined) {
        runningOvenTempC = overrideItem.stepOvenTempC;
      }
      if (overrideItem?.stepOvenMode !== undefined) {
        runningOvenMode = overrideItem.stepOvenMode;
      }
      if (overrideItem?.stepExtraMode !== undefined) {
        runningExtraMode = overrideItem.stepExtraMode;
      }
      if (overrideItem?.stepHasLid !== undefined) {
        runningHasLid = overrideItem.stepHasLid;
      }
    }

    const effectiveHeatSource: HeatSource = runningHeatSource;
    const effectiveElectricLevel: number = runningElectricLevel;
    const effectiveGasLevel: GasLevel = runningGasLevel;
    const effectiveOvenTempC: number = runningOvenTempC;
    const effectiveOvenMode: OvenMode = runningOvenMode;
    const effectiveExtraMode: string | undefined = runningExtraMode;
    const effectiveHasLid: boolean = runningHasLid;

    const stepRegime: StepRegimeInput = {
      hasThermalProcessing,
      heatSource: effectiveHeatSource,
      electricLevel: effectiveElectricLevel,
      gasLevel: effectiveGasLevel,
      ovenTempC: effectiveOvenTempC,
      ovenMode: effectiveOvenMode,
      extraMode: effectiveExtraMode,
      hasLid: effectiveHasLid,
    };

    const stepCookingMode = detectRegimeCookingMode(
      stepRegime,
      cumulativeWaterMl,
      cumulativeSolidsGrams
    );

    return {
      addedAtMinute: min,
      recipeStartMinute: startOffsetMinutes + min,
      recipeEndMinute: startOffsetMinutes + min + stepDuration,
      durationMinutes: stepDuration,
      items: stepItemsForMin,
      hasThermalProcessing,
      hasCustomRegime,
      effectiveHeatSource,
      effectiveElectricLevel,
      effectiveGasLevel,
      effectiveOvenTempC,
      effectiveOvenMode,
      effectiveExtraMode,
      effectiveHasLid,
      stepCookingMode,
      regimeBadgeText: formatRegimeBadgeText(stepRegime),
    };
  });

  // Dominant vessel cooking mode: last thermal step's mode, or mixing if no thermal steps
  const thermalGroups = groupedSteps.filter((g) => g.hasThermalProcessing);
  const dominantCookingMode =
    thermalGroups.length > 0
      ? thermalGroups[thermalGroups.length - 1].stepCookingMode
      : groupedSteps[groupedSteps.length - 1]?.stepCookingMode ||
        detectVesselCookingMode(vessel);

  return {
    enrichedItems,
    groupedSteps,
    totalTimeMinutes,
    startOffsetMinutes,
    recipeEndMinute: startOffsetMinutes + totalTimeMinutes,
    waterFromStepsMl,
    cookingMode: dominantCookingMode,
  };
}

/**
 * Find if and when a vessel's contents are transferred into another vessel's step
 */
export function findVesselTransferDestination(
  sourceVesselId: string,
  allVessels: CookwareVessel[]
): {
  targetVesselId: string;
  targetVesselName: string;
  addedAtVesselMinute: number;
  addedAtRecipeMinute: number;
  stepItemId: string;
} | null {
  for (let vIdx = 0; vIdx < allVessels.length; vIdx++) {
    const targetVessel = allVessels[vIdx];
    if (targetVessel.id === sourceVesselId) continue;
    const targetOffset =
      vIdx === 0 ? 0 : Math.max(0, Math.round(Number(targetVessel.startOffsetMinutes) || 0));

    for (const item of targetVessel.stepItems || []) {
      if (
        item.sourceVesselId === sourceVesselId ||
        item.foodId === `vessel-transfer:${sourceVesselId}`
      ) {
        const vMin = Math.max(0, Math.round(Number(item.addedAtMinute) || 0));
        return {
          targetVesselId: targetVessel.id,
          targetVesselName: getVesselDisplayName(targetVessel, vIdx),
          addedAtVesselMinute: vMin,
          addedAtRecipeMinute: targetOffset + vMin,
          stepItemId: item.id,
        };
      }
    }
  }
  return null;
}

/**
 * Calculate the cooked weight of a single vessel (for transferring its contents into another vessel)
 */
export function calculateSingleVesselCookedWeight(vessel: CookwareVessel, vesselIndex: number = 0): {
  rawSolidsGrams: number;
  waterAddedMl: number;
  evaporatedWaterMl: number;
  cookedWeightGrams: number;
  totalTimeMinutes: number;
} {
  const { groupedSteps, totalTimeMinutes, waterFromStepsMl } = calculateVesselStepItems(
    vessel,
    vesselIndex
  );

  let rawSolidsGrams = 0;
  for (const item of vessel.stepItems || []) {
    if (isRegimeOnlyStepItem(item)) continue;
    if (!isWaterFoodItem(item.foodId, item.foodName) && !item.isExtracted) {
      rawSolidsGrams += Math.max(0, Number(item.grams) || 0);
    }
  }

  const waterAddedMl = Math.max(Number(vessel.waterAddedMl) || 0, waterFromStepsMl);
  const availableMoisture = waterAddedMl + rawSolidsGrams * 0.25;

  // Integrate evaporation step by step using each step's effective regime & lid state
  let rawEvap = 0;
  for (const grp of groupedSteps) {
    const stepRate = getRegimeEvaporationRateMlPerMin({
      hasThermalProcessing: grp.hasThermalProcessing,
      heatSource: grp.effectiveHeatSource,
      electricLevel: grp.effectiveElectricLevel,
      gasLevel: grp.effectiveGasLevel,
      ovenTempC: grp.effectiveOvenTempC,
      ovenMode: grp.effectiveOvenMode,
      extraMode: grp.effectiveExtraMode,
      hasLid: grp.effectiveHasLid,
    });
    rawEvap += stepRate * grp.durationMinutes;
  }

  const evaporatedWaterMl = Math.round(Math.min(availableMoisture * 0.78, rawEvap));
  const cookedWeightGrams = Math.max(
    10,
    Math.round(rawSolidsGrams + waterAddedMl - evaporatedWaterMl)
  );

  return {
    rawSolidsGrams: Math.round(rawSolidsGrams),
    waterAddedMl: Math.round(waterAddedMl),
    evaporatedWaterMl,
    cookedWeightGrams,
    totalTimeMinutes,
  };
}

/**
 * Calculate overall physics across all vessels in a recipe
 */
export function calculateOverallCookingPhysics(
  vessels: CookwareVessel[],
  ingredients: RecipeIngredient[]
): {
  rawWeightGrams: number;
  totalWaterAddedMl: number;
  evaporatedWaterMl: number;
  extractedSolidsGrams: number;
  weightDeltaGrams: number;
  finalDishWeightGrams: number;
  totalRecipeTimeMinutes: number;
  vesselSummaries: Array<{
    vesselId: string;
    vesselName: string;
    startOffsetMinutes: number;
    totalTimeMinutes: number;
    recipeEndMinute: number;
    evaporatedMl: number;
    waterAddedMl: number;
    cookingMode: DetectedCookingMethodInfo;
  }>;
} {
  let solidsFromIngredients = 0;
  let waterFromIngredients = 0;

  for (const ing of ingredients) {
    if (isWaterFoodItem(ing.foodId, ing.foodName)) {
      waterFromIngredients += Math.max(0, Number(ing.grams) || 0);
    } else {
      solidsFromIngredients += Math.max(0, Number(ing.grams) || 0);
    }
  }

  let solidsFromSteps = 0;
  let extractedSolidsGrams = 0;
  let totalWaterAddedMl = 0;
  let totalEvaporatedMl = 0;
  let totalRecipeTimeMinutes = 0;

  const vesselSummaries: Array<{
    vesselId: string;
    vesselName: string;
    startOffsetMinutes: number;
    totalTimeMinutes: number;
    recipeEndMinute: number;
    evaporatedMl: number;
    waterAddedMl: number;
    cookingMode: DetectedCookingMethodInfo;
  }> = [];

  for (let vIdx = 0; vIdx < vessels.length; vIdx++) {
    const v = vessels[vIdx];
    const {
      groupedSteps,
      totalTimeMinutes,
      startOffsetMinutes,
      recipeEndMinute,
      waterFromStepsMl,
      cookingMode,
    } = calculateVesselStepItems(v, vIdx);

    if (totalTimeMinutes > 0 || (v.stepItems && v.stepItems.length > 0)) {
      totalRecipeTimeMinutes = Math.max(totalRecipeTimeMinutes, recipeEndMinute);
    }

    const vWater = Math.max(Number(v.waterAddedMl) || 0, waterFromStepsMl);
    totalWaterAddedMl += vWater;

    let vesselSolids = 0;
    for (const step of v.stepItems || []) {
      if (isRegimeOnlyStepItem(step)) continue;
      if (isVesselTransferItem(step)) continue;
      if (!isWaterFoodItem(step.foodId, step.foodName)) {
        const g = Math.max(0, Number(step.grams) || 0);
        solidsFromSteps += g;
        vesselSolids += g;
        if (step.isExtracted) {
          extractedSolidsGrams += g;
        }
      }
    }

    // Integrate evaporation per step group considering step heat regime & lid state
    let rawEvap = 0;
    for (const grp of groupedSteps) {
      const stepRate = getRegimeEvaporationRateMlPerMin({
        hasThermalProcessing: grp.hasThermalProcessing,
        heatSource: grp.effectiveHeatSource,
        electricLevel: grp.effectiveElectricLevel,
        gasLevel: grp.effectiveGasLevel,
        ovenTempC: grp.effectiveOvenTempC,
        ovenMode: grp.effectiveOvenMode,
        extraMode: grp.effectiveExtraMode,
        hasLid: grp.effectiveHasLid,
      });
      rawEvap += stepRate * grp.durationMinutes;
    }

    const availableMoistureInVessel = vWater + vesselSolids * 0.25;
    const cappedEvap = Math.round(Math.min(availableMoistureInVessel * 0.78, rawEvap));
    totalEvaporatedMl += cappedEvap;

    vesselSummaries.push({
      vesselId: v.id,
      vesselName: getVesselDisplayName(v, vIdx),
      startOffsetMinutes,
      totalTimeMinutes,
      recipeEndMinute,
      evaporatedMl: cappedEvap,
      waterAddedMl: vWater,
      cookingMode,
    });
  }

  const effectiveSolidsGrams = Math.max(solidsFromIngredients, solidsFromSteps);
  const effectiveWaterMl = Math.max(waterFromIngredients, totalWaterAddedMl);
  const rawWeightGrams = Math.round(effectiveSolidsGrams + effectiveWaterMl);

  const finalDishWeightGrams = Math.max(
    10,
    Math.round(rawWeightGrams - totalEvaporatedMl - extractedSolidsGrams)
  );
  const weightDeltaGrams = finalDishWeightGrams - rawWeightGrams;

  return {
    rawWeightGrams,
    totalWaterAddedMl: Math.round(effectiveWaterMl),
    evaporatedWaterMl: Math.round(totalEvaporatedMl),
    extractedSolidsGrams: Math.round(extractedSolidsGrams),
    weightDeltaGrams,
    finalDishWeightGrams,
    totalRecipeTimeMinutes: Math.round(totalRecipeTimeMinutes),
    vesselSummaries,
  };
}

/**
 * Format minutes nicely (e.g. 125 -> "2 ч 5 мин" or "45 мин")
 */
export function formatDurationMinutes(minutes: number): string {
  const m = Math.max(0, Math.round(minutes || 0));
  if (m < 60) return `${m} мин`;
  const hrs = Math.floor(m / 60);
  const rem = m % 60;
  return rem > 0 ? `${hrs} ч ${rem} мин` : `${hrs} ч`;
}

/**
 * Ultra-compact duration formatter so time badges take minimal horizontal space
 * (e.g. 45 -> "45м", 90 -> "1ч 30м", 120 -> "2ч")
 */
export function formatCompactDurationMinutes(minutes: number): string {
  const m = Math.max(0, Math.round(minutes || 0));
  if (m < 60) return `${m}м`;
  const hrs = Math.floor(m / 60);
  const rem = m % 60;
  return rem > 0 ? `${hrs}ч ${rem}м` : `${hrs}ч`;
}
