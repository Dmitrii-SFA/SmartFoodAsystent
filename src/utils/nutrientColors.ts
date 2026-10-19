import { MetricConfig } from '../types/config';

export const DEFAULT_NUTRIENT_COLORS: Record<string, string> = {
  calories: '#f97316', // Оранжевый
  proteins: '#3b82f6', // Синий
  fats: '#eab308',     // Жёлтый
  carbs: '#ef4444',    // Красный
  fiber: '#22c55e',    // Зелёный
  water: '#06b6d4',    // Голубой
};

export function getNutrientColor(
  metricId: string,
  metrics?: MetricConfig[],
  fallbackColor?: string
): string {
  if (metrics && metrics.length > 0) {
    const found = metrics.find(
      (m) =>
        m.id.toLowerCase() === metricId.toLowerCase() ||
        (m.shortLabel && m.shortLabel.toLowerCase() === metricId.toLowerCase()) ||
        (m.label && m.label.toLowerCase() === metricId.toLowerCase())
    );
    if (found && found.color) {
      return found.color;
    }
  }

  const idKey = metricId.toLowerCase();
  if (DEFAULT_NUTRIENT_COLORS[idKey]) {
    return DEFAULT_NUTRIENT_COLORS[idKey];
  }

  if (idKey.startsWith('protein') || idKey.startsWith('белк') || idKey === 'б') {
    return DEFAULT_NUTRIENT_COLORS.proteins;
  }
  if (idKey.startsWith('fat') || idKey.startsWith('жир') || idKey === 'ж') {
    return DEFAULT_NUTRIENT_COLORS.fats;
  }
  if (idKey.startsWith('carb') || idKey.startsWith('углев') || idKey === 'у') {
    return DEFAULT_NUTRIENT_COLORS.carbs;
  }
  if (idKey.startsWith('calor') || idKey.startsWith('калор') || idKey === 'ккал') {
    return DEFAULT_NUTRIENT_COLORS.calories;
  }
  if (idKey.startsWith('fiber') || idKey.startsWith('клетчатк') || idKey === 'кл') {
    return DEFAULT_NUTRIENT_COLORS.fiber;
  }

  return fallbackColor || '#94a3b8';
}

export function hexToRgba(hex: string, alpha: number = 0.2): string {
  if (!hex || !hex.startsWith('#')) {
    return `rgba(148, 163, 184, ${alpha})`;
  }
  const cleanHex = hex.replace('#', '');
  let r = 0, g = 0, b = 0;
  if (cleanHex.length === 3) {
    r = parseInt(cleanHex[0] + cleanHex[0], 16);
    g = parseInt(cleanHex[1] + cleanHex[1], 16);
    b = parseInt(cleanHex[2] + cleanHex[2], 16);
  } else if (cleanHex.length === 6) {
    r = parseInt(cleanHex.substring(0, 2), 16);
    g = parseInt(cleanHex.substring(2, 4), 16);
    b = parseInt(cleanHex.substring(4, 6), 16);
  } else {
    return `rgba(148, 163, 184, ${alpha})`;
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function getNutrientBadgeStyle(color: string) {
  return {
    color,
    backgroundColor: hexToRgba(color, 0.14),
    borderColor: hexToRgba(color, 0.35),
  };
}
