import React from 'react';

export interface CookwareIconDef {
  id: string;
  label: string;
}

/**
 * 24 pure cookware icons (только посуда):
 * - 5 distinct frying pans / skillets (две сковороды которые по-разному выглядят, пару сковородок: классическая, глубокая с крышкой, гриль, чугунная, блинная)
 * - казан, вок, жаровня, утятница, тажин, горшочек
 * - кастрюли (высокая суповая, широкая низкая, ковшик, пароварка, скороварка, чаша мультиварки)
 * - формы для запекания и посуда (противень, форма с ручками, разъёмная форма, миска-салатник, дуршлаг, соусник, турка)
 */
export const COOKWARE_ICON_DEFS: CookwareIconDef[] = [
  { id: 'pan_classic', label: 'Сковорода классическая' },
  { id: 'pan_deep', label: 'Сковорода глубокая (сотейник)' },
  { id: 'pan_grill', label: 'Сковорода-гриль ребристая' },
  { id: 'pan_cast_iron', label: 'Сковорода чугунная с ушками' },
  { id: 'pan_crepe', label: 'Сковорода блинная низкая' },
  { id: 'kazan', label: 'Казан чугунный полукруглый' },
  { id: 'wok', label: 'Вок (глубокая сковорода)' },
  { id: 'pot_tall', label: 'Кастрюля высокая суповая' },
  { id: 'pot_wide', label: 'Кастрюля широкая низкая' },
  { id: 'saucepan', label: 'Ковшик с длинной ручкой' },
  { id: 'dutch_oven', label: 'Жаровня толстостенная' },
  { id: 'roaster_oval', label: 'Утятница (гусятница) овальная' },
  { id: 'clay_pot', label: 'Горшочек глиняный для запекания' },
  { id: 'tajine', label: 'Тажин с конусной крышкой' },
  { id: 'steamer', label: 'Пароварка / Мантоварка двухъярусная' },
  { id: 'pressure_cooker', label: 'Скороварка с клапаном' },
  { id: 'multicooker_bowl', label: 'Чаша мультиварки' },
  { id: 'baking_tray', label: 'Противень для духовки' },
  { id: 'baking_dish', label: 'Форма для запекания глубокая' },
  { id: 'cake_form', label: 'Форма круглая для выпечки' },
  { id: 'mixing_bowl', label: 'Миска глубокая / Салатник' },
  { id: 'colander', label: 'Дуршлаг с ручками' },
  { id: 'sauce_boat', label: 'Соусник с носиком' },
  { id: 'turka', label: 'Турка (джезва) с ручкой' },
];

/**
 * Normalizes any stored icon string (including legacy emojis) into one of the 24 cookware icon IDs
 */
export function resolveCookwareIconId(icon?: string, vesselName?: string): string {
  if (icon && COOKWARE_ICON_DEFS.some((d) => d.id === icon)) {
    return icon;
  }

  const nameLower = (vesselName || '').toLowerCase();
  if (nameLower.includes('казан')) return 'kazan';
  if (nameLower.includes('вок')) return 'wok';
  if (nameLower.includes('гриль')) return 'pan_grill';
  if (nameLower.includes('блин')) return 'pan_crepe';
  if (nameLower.includes('чугун')) return 'pan_cast_iron';
  if (nameLower.includes('сотейник')) return 'pan_deep';
  if (nameLower.includes('ковш')) return 'saucepan';
  if (nameLower.includes('утятн') || nameLower.includes('гусятн')) return 'roaster_oval';
  if (nameLower.includes('жаровн')) return 'dutch_oven';
  if (nameLower.includes('горшоч')) return 'clay_pot';
  if (nameLower.includes('тажин')) return 'tajine';
  if (nameLower.includes('паровар') || nameLower.includes('мантовар')) return 'steamer';
  if (nameLower.includes('скоровар')) return 'pressure_cooker';
  if (nameLower.includes('мультивар')) return 'multicooker_bowl';
  if (nameLower.includes('противен')) return 'baking_tray';
  if (nameLower.includes('форм')) return 'baking_dish';
  if (nameLower.includes('миск') || nameLower.includes('салат')) return 'mixing_bowl';
  if (nameLower.includes('дуршлаг') || nameLower.includes('сито')) return 'colander';
  if (nameLower.includes('соусн')) return 'sauce_boat';
  if (nameLower.includes('турк') || nameLower.includes('джезв')) return 'turka';
  if (nameLower.includes('кастрюл')) return 'pot_tall';
  if (nameLower.includes('сковород')) return 'pan_classic';

  // Legacy emoji fallback mapping to pure cookware
  switch (icon) {
    case '🍳':
      return 'pan_classic';
    case '🥘':
      return 'pan_deep';
    case '🍲':
      return 'pot_tall';
    case '🫕':
      return 'kazan';
    case '🥗':
    case '🥣':
      return 'mixing_bowl';
    case '🫖':
    case '☕':
      return 'turka';
    case '🫙':
      return 'clay_pot';
    case '🍽️':
    case '🍱':
      return 'baking_dish';
    default:
      return 'pan_classic';
  }
}

export function getCookwareIconLabel(icon?: string): string {
  const resolved = resolveCookwareIconId(icon);
  return COOKWARE_ICON_DEFS.find((d) => d.id === resolved)?.label || 'Посуда';
}

interface CookwareIconProps {
  icon?: string;
  vesselName?: string;
  className?: string;
}

export const CookwareIcon: React.FC<CookwareIconProps> = ({
  icon,
  vesselName,
  className = 'w-5 h-5',
}) => {
  const id = resolveCookwareIconId(icon, vesselName);

  const renderSvg = () => {
    switch (id) {
      // 1. Классическая сковорода (вид сбоку-сверху, круглая с длинной ручкой)
      case 'pan_classic':
        return (
          <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
            <circle cx="10" cy="13" r="6.5" fill="#334155" stroke="#94a3b8" strokeWidth="1.6" />
            <circle cx="10" cy="13" r="4.3" fill="#1e293b" stroke="#475569" strokeWidth="1" />
            <path
              d="M15.5 9.5L21.5 5.5"
              stroke="#f59e0b"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
            <circle cx="21" cy="5.8" r="0.7" fill="#1e293b" />
          </svg>
        );

      // 2. Сковорода глубокая / сотейник с высокой стенкой и стеклянной крышкой
      case 'pan_deep':
        return (
          <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
            <path
              d="M3 12H16L15 18.5C14.8 19.4 14 20 13 20H6C5 20 4.2 19.4 4 18.5L3 12Z"
              fill="#334155"
              stroke="#cbd5e1"
              strokeWidth="1.5"
            />
            <path
              d="M3.5 12C4.5 8.5 14.5 8.5 15.5 12"
              fill="#38bdf8"
              fillOpacity="0.25"
              stroke="#7dd3fc"
              strokeWidth="1.4"
            />
            <circle cx="9.5" cy="8.2" r="1.2" fill="#f59e0b" />
            <path d="M16 13H22" stroke="#f59e0b" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        );

      // 3. Сковорода-гриль квадратная с рёбрами
      case 'pan_grill':
        return (
          <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
            <rect
              x="3"
              y="7"
              width="12.5"
              height="12.5"
              rx="2.5"
              fill="#1e293b"
              stroke="#94a3b8"
              strokeWidth="1.6"
            />
            <path
              d="M5.5 10H13M5.5 13.2H13M5.5 16.5H13"
              stroke="#f97316"
              strokeWidth="1.3"
              strokeLinecap="round"
            />
            <path
              d="M15.5 10L21.5 6"
              stroke="#cbd5e1"
              strokeWidth="2.3"
              strokeLinecap="round"
            />
          </svg>
        );

      // 4. Чугунная сковорода с носиками и двумя боковыми ушками + ручкой
      case 'pan_cast_iron':
        return (
          <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
            <path
              d="M2 13.5C2 12.7 2.6 12 3.4 12H4"
              stroke="#94a3b8"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            <circle cx="10.2" cy="13.5" r="6.2" fill="#0f172a" stroke="#94a3b8" strokeWidth="1.8" />
            <circle cx="10.2" cy="13.5" r="4.2" fill="#1e293b" />
            <path
              d="M16.2 11.2L21.8 8.5"
              stroke="#94a3b8"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          </svg>
        );

      // 5. Блинная сковорода (низкий бортик, плоская, длинная ручка, золотистый блинчик на дне)
      case 'pan_crepe':
        return (
          <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
            <path
              d="M2.5 15.5H16L15.2 17.5H3.3L2.5 15.5Z"
              fill="#334155"
              stroke="#cbd5e1"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <ellipse cx="9.2" cy="15.2" rx="5.2" ry="1.2" fill="#fbbf24" />
            <path
              d="M16 15.5L22 12.5"
              stroke="#f59e0b"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </svg>
        );

      // 6. Казан чугунный полукруглый с ушками и купольной крышкой
      case 'kazan':
        return (
          <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
            <path
              d="M4 11C4 16.8 7.5 20.5 12 20.5C16.5 20.5 20 16.8 20 11H4Z"
              fill="#1e293b"
              stroke="#f59e0b"
              strokeWidth="1.6"
            />
            <path
              d="M2 11C2 9.8 3 9.5 4 11M22 11C22 9.8 21 9.5 20 11"
              stroke="#f59e0b"
              strokeWidth="1.7"
              strokeLinecap="round"
            />
            <path
              d="M4.5 11C6 7.5 18 7.5 19.5 11"
              fill="#b45309"
              fillOpacity="0.45"
              stroke="#fbbf24"
              strokeWidth="1.4"
            />
            <circle cx="12" cy="7.2" r="1.3" fill="#fbbf24" />
          </svg>
        );

      // 7. Вок — глубокая коническая чаша с длинной деревянной ручкой и ушком
      case 'wok':
        return (
          <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
            <path
              d="M3.5 11L6.8 18.2C7.4 19.2 8.5 19.8 10 19.8C11.5 19.8 12.6 19.2 13.2 18.2L16.5 11H3.5Z"
              fill="#334155"
              stroke="#cbd5e1"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <path d="M2 11H3.5" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M16.5 11L22 7.5" stroke="#d97706" strokeWidth="2.4" strokeLinecap="round" />
          </svg>
        );

      // 8. Кастрюля высокая суповая с крышкой и двумя ручками
      case 'pot_tall':
        return (
          <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
            <rect
              x="5"
              y="9.5"
              width="14"
              height="10.5"
              rx="2"
              fill="#334155"
              stroke="#93c5fd"
              strokeWidth="1.6"
            />
            <path d="M2.5 12H5M19 12H21.5" stroke="#93c5fd" strokeWidth="1.8" strokeLinecap="round" />
            <path
              d="M5 9.5C6.5 6.8 17.5 6.8 19 9.5"
              fill="#60a5fa"
              fillOpacity="0.3"
              stroke="#93c5fd"
              strokeWidth="1.5"
            />
            <circle cx="12" cy="6.5" r="1.2" fill="#93c5fd" />
          </svg>
        );

      // 9. Кастрюля широкая низкая
      case 'pot_wide':
        return (
          <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
            <rect
              x="3.5"
              y="12"
              width="17"
              height="7.5"
              rx="2"
              fill="#334155"
              stroke="#34d399"
              strokeWidth="1.6"
            />
            <path d="M1.8 14.2H3.5M20.5 14.2H22.2" stroke="#34d399" strokeWidth="1.8" strokeLinecap="round" />
            <path
              d="M4 12C6 9.5 18 9.5 20 12"
              fill="#10b981"
              fillOpacity="0.25"
              stroke="#34d399"
              strokeWidth="1.5"
            />
            <path d="M10.5 9.2H13.5" stroke="#34d399" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        );

      // 10. Ковшик с длинной ручкой
      case 'saucepan':
        return (
          <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
            <rect
              x="3.5"
              y="10.5"
              width="11.5"
              height="9"
              rx="1.8"
              fill="#334155"
              stroke="#cbd5e1"
              strokeWidth="1.6"
            />
            <path d="M4 10.5H14.5" stroke="#f8fafc" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M15 12.2L21.8 10.5" stroke="#f59e0b" strokeWidth="2.3" strokeLinecap="round" />
          </svg>
        );

      // 11. Жаровня толстостенная (чугунный кокот)
      case 'dutch_oven':
        return (
          <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
            <path
              d="M4.5 11H19.5L18.5 19C18.3 19.8 17.5 20.3 16.5 20.3H7.5C6.5 20.3 5.7 19.8 5.5 19L4.5 11Z"
              fill="#991b1b"
              stroke="#f87171"
              strokeWidth="1.6"
            />
            <path d="M2.2 12.5H4.5M19.5 12.5H21.8" stroke="#f87171" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M4.2 10.8H19.8" stroke="#fca5a5" strokeWidth="2" strokeLinecap="round" />
            <rect x="10.5" y="8" width="3" height="2" rx="0.8" fill="#fbbf24" />
          </svg>
        );

      // 12. Утятница / гусятница овальная
      case 'roaster_oval':
        return (
          <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
            <ellipse
              cx="12"
              cy="15"
              rx="8.5"
              ry="4.8"
              fill="#1e293b"
              stroke="#a78bfa"
              strokeWidth="1.6"
            />
            <ellipse
              cx="12"
              cy="12.5"
              rx="7.5"
              ry="3"
              fill="#312e81"
              stroke="#c4b5fd"
              strokeWidth="1.4"
            />
            <path d="M2 14.5H3.5M20.5 14.5H22" stroke="#c4b5fd" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M10.5 11.2H13.5" stroke="#fbbf24" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        );

      // 13. Горшочек глиняный для запекания
      case 'clay_pot':
        return (
          <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
            <path
              d="M6.5 10C4.5 13 5 18 7.5 20H16.5C19 18 19.5 13 17.5 10H6.5Z"
              fill="#9a3412"
              stroke="#fdba74"
              strokeWidth="1.6"
            />
            <path
              d="M7 10C8.5 7.8 15.5 7.8 17 10"
              fill="#c2410c"
              stroke="#fdba74"
              strokeWidth="1.4"
            />
            <circle cx="12" cy="7" r="1.2" fill="#fdba74" />
            <path d="M6 14C9 15 15 15 18 14" stroke="#fed7aa" strokeWidth="1.1" strokeDasharray="2 1.5" />
          </svg>
        );

      // 14. Тажин с высокой конусной крышкой
      case 'tajine':
        return (
          <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
            <path
              d="M3.5 16.5H20.5L19 20H5L3.5 16.5Z"
              fill="#9a3412"
              stroke="#fb923c"
              strokeWidth="1.5"
            />
            <path
              d="M4.5 16.5L11 6.5H13L19.5 16.5H4.5Z"
              fill="#ea580c"
              fillOpacity="0.45"
              stroke="#fdba74"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <circle cx="12" cy="5.5" r="1.3" fill="#fde047" />
          </svg>
        );

      // 15. Пароварка / Мантоварка двухъярусная
      case 'steamer':
        return (
          <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
            <rect x="5" y="14.5" width="14" height="5.5" rx="1.2" fill="#334155" stroke="#67e8f9" strokeWidth="1.5" />
            <rect x="5" y="9" width="14" height="5.5" rx="1.2" fill="#1e293b" stroke="#67e8f9" strokeWidth="1.5" />
            <circle cx="9" cy="11.8" r="0.8" fill="#67e8f9" />
            <circle cx="12" cy="11.8" r="0.8" fill="#67e8f9" />
            <circle cx="15" cy="11.8" r="0.8" fill="#67e8f9" />
            <path d="M5.5 9C7.5 6.8 16.5 6.8 18.5 9" stroke="#a5f3fc" strokeWidth="1.5" />
            <circle cx="12" cy="6.2" r="1.1" fill="#67e8f9" />
          </svg>
        );

      // 16. Скороварка с прижимной дугой и паровым клапаном
      case 'pressure_cooker':
        return (
          <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
            <rect x="5" y="10.5" width="14" height="9.5" rx="2" fill="#334155" stroke="#cbd5e1" strokeWidth="1.6" />
            <path d="M4 10.5H20" stroke="#f59e0b" strokeWidth="2.2" strokeLinecap="round" />
            <rect x="11" y="7" width="2" height="3" rx="0.6" fill="#ef4444" />
            <path d="M8.5 5.5L10 7.5M15.5 5.5L14 7.5" stroke="#93c5fd" strokeWidth="1.3" strokeLinecap="round" />
            <path d="M2.5 13H5M19 13H21.5" stroke="#cbd5e1" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        );

      // 17. Чаша мультиварки (с дисплеем на корпусе)
      case 'multicooker_bowl':
        return (
          <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
            <rect x="4.5" y="7" width="15" height="13" rx="3.5" fill="#1e293b" stroke="#a855f7" strokeWidth="1.6" />
            <path d="M4.5 10.5H19.5" stroke="#c084fc" strokeWidth="1.3" />
            <rect x="8.5" y="13" width="7" height="4" rx="1" fill="#3b0764" stroke="#c084fc" strokeWidth="1.2" />
            <circle cx="12" cy="15" r="0.9" fill="#4ade80" />
          </svg>
        );

      // 18. Противень для духовки (низкий широкий лоток с бортиками)
      case 'baking_tray':
        return (
          <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
            <path
              d="M2.5 13L5.5 9.5H18.5L21.5 13L19.8 16.5H4.2L2.5 13Z"
              fill="#334155"
              stroke="#cbd5e1"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <path d="M5.2 13.5H18.8" stroke="#64748b" strokeWidth="1.2" />
          </svg>
        );

      // 19. Форма для запекания глубокая стеклянная/керамическая
      case 'baking_dish':
        return (
          <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
            <path
              d="M4 11H20L18.5 18.5C18.3 19.3 17.5 19.8 16.6 19.8H7.4C6.5 19.8 5.7 19.3 5.5 18.5L4 11Z"
              fill="#0284c7"
              fillOpacity="0.35"
              stroke="#7dd3fc"
              strokeWidth="1.6"
            />
            <path d="M2.2 11H21.8" stroke="#7dd3fc" strokeWidth="2" strokeLinecap="round" />
          </svg>
        );

      // 20. Круглая разъёмная форма для выпечки / пирога с рифлёным краем
      case 'cake_form':
        return (
          <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
            <ellipse cx="12" cy="11" rx="8" ry="3" fill="#475569" stroke="#f472b6" strokeWidth="1.5" />
            <path
              d="M4 11V16.5C4 18.2 7.6 19.5 12 19.5C16.4 19.5 20 18.2 20 16.5V11"
              fill="#334155"
              stroke="#f472b6"
              strokeWidth="1.5"
            />
            <rect x="18.5" y="13" width="2" height="3" rx="0.5" fill="#fbcfe8" />
          </svg>
        );

      // 21. Миска глубокая / Салатник для смешивания
      case 'mixing_bowl':
        return (
          <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
            <path
              d="M3.5 10.5H20.5C20.5 16.2 16.8 20 12 20C7.2 20 3.5 16.2 3.5 10.5Z"
              fill="#065f46"
              fillOpacity="0.5"
              stroke="#34d399"
              strokeWidth="1.6"
            />
            <ellipse cx="12" cy="10.5" rx="8.5" ry="2" fill="#047857" stroke="#6ee7b7" strokeWidth="1.4" />
          </svg>
        );

      // 22. Дуршлаг с перфорацией и ручками на ножке
      case 'colander':
        return (
          <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
            <path
              d="M4.5 10.5H19.5C19.2 15.5 16 18.5 12 18.5C8 18.5 4.8 15.5 4.5 10.5Z"
              fill="#334155"
              stroke="#cbd5e1"
              strokeWidth="1.5"
            />
            <path d="M2.2 11H4.5M19.5 11H21.8" stroke="#cbd5e1" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M9 20H15" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
            <circle cx="9.5" cy="13.5" r="0.8" fill="#38bdf8" />
            <circle cx="12" cy="14.5" r="0.8" fill="#38bdf8" />
            <circle cx="14.5" cy="13.5" r="0.8" fill="#38bdf8" />
          </svg>
        );

      // 23. Соусник с изогнутым носиком и ручкой
      case 'sauce_boat':
        return (
          <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
            <path
              d="M3 11.5L6.5 12.5C7.2 16.2 10 18 13.5 18C16.2 18 18 16 18.5 12.5H6.5L3 11.5Z"
              fill="#334155"
              stroke="#fbbf24"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <path
              d="M18.5 12.5C20.5 12.5 21.5 13.8 20.5 15.5C19.8 16.5 18.5 16.5 17.8 16"
              stroke="#fbbf24"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path d="M9 19.5H15.5" stroke="#fbbf24" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        );

      // 24. Турка (джезва) медная с длинной ручкой
      case 'turka':
      default:
        return (
          <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
            <path
              d="M6.5 8.5H13.5L12.2 13L14.5 19.5H5.5L7.8 13L6.5 8.5Z"
              fill="#b45309"
              stroke="#fbbf24"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <path d="M13 10L21 6.5" stroke="#fde047" strokeWidth="2.1" strokeLinecap="round" />
          </svg>
        );
    }
  };

  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 ${className}`}
      title={getCookwareIconLabel(id)}
    >
      {renderSvg()}
    </span>
  );
};
