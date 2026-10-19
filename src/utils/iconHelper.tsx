import React from 'react';
import {
  Flame,
  Beef,
  Droplet,
  Wheat,
  Apple,
  Pill,
  Sun,
  Shield,
  Sparkles,
  Activity,
  Coffee,
  Utensils,
  Moon,
  Cookie,
  Heart,
  Zap,
  Target,
  CircleDot,
  Dumbbell,
  Scale,
  Award,
} from 'lucide-react';

interface IconProps {
  name?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const FOOD_ICON_PRESETS: string[] = [
  '🍳',
  '🥗',
  '🍲',
  '🍏',
  '🥩',
  '🥣',
  '🥪',
  '🥤',
  '🧁',
  '🥑',
];

export interface MedicineIconPreset {
  id: string;
  label: {
    ru: string;
    en: string;
    pl: string;
  };
}

// 6 distinct medicine/supplement icons (fewer than the 10 food icons)
export const MEDICINE_ICON_PRESETS: MedicineIconPreset[] = [
  {
    id: 'med_tablet',
    label: {
      ru: 'Таблетка',
      en: 'Tablet',
      pl: 'Tabletka',
    },
  },
  {
    id: 'med_capsule',
    label: {
      ru: 'Капсула',
      en: 'Capsule',
      pl: 'Kapsułka',
    },
  },
  {
    id: 'med_powder',
    label: {
      ru: 'Порошок / Саше',
      en: 'Powder / Scoop',
      pl: 'Proszek / Miarka',
    },
  },
  {
    id: 'med_drops',
    label: {
      ru: 'Капли / Раствор',
      en: 'Drops / Solution',
      pl: 'Krople / Roztwór',
    },
  },
  {
    id: 'med_vial',
    label: {
      ru: 'Витамины / Флакон',
      en: 'Vitamins / Bottle',
      pl: 'Witaminy / Fiolka',
    },
  },
  {
    id: 'med_omega',
    label: {
      ru: 'Гель-капсула / Омега',
      en: 'Softgel / Omega',
      pl: 'Kapsułka żelowa / Omega',
    },
  },
];

export function getMealCategoryIconText(icon?: string): string {
  if (!icon) return '🍽️';
  const map: Record<string, string> = {
    Coffee: '☕',
    Utensils: '🍽️',
    Moon: '🌙',
    Cookie: '🍪',
    Apple: '🍏',
    Soup: '🍲',
    Salad: '🥗',
    Flame: '🔥',
    med_tablet: '⚪',
    med_capsule: '💊',
    med_powder: '🥄',
    med_drops: '💧',
    med_vial: '🧪',
    med_omega: '🌿',
  };
  return map[icon] || icon;
}

export const MealCategoryIcon: React.FC<{ icon?: string; className?: string }> = ({
  icon,
  className = 'w-5 h-5',
}) => {
  if (icon === 'med_tablet') {
    // Round scored pharmaceutical tablet SVG
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className={`inline-block shrink-0 ${className}`}
        aria-label="Tablet"
      >
        <circle cx="12" cy="12" r="9" fill="#e0f2fe" stroke="#38bdf8" strokeWidth="2" />
        <path d="M6.5 17.5L17.5 6.5" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" />
        <path
          d="M8 9.5C9.2 8 11 7.2 13 7.5"
          stroke="#ffffff"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (icon === 'med_capsule') {
    // Two-tone medicinal capsule SVG
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className={`inline-block shrink-0 ${className}`}
        aria-label="Capsule"
      >
        <g transform="rotate(-35 12 12)">
          <rect
            x="7"
            y="3"
            width="10"
            height="18"
            rx="5"
            fill="#f8fafc"
            stroke="#94a3b8"
            strokeWidth="1.6"
          />
          <path
            d="M7 8C7 5.23858 9.23858 3 12 3C14.7614 3 17 5.23858 17 8V12H7V8Z"
            fill="#f43f5e"
          />
          <line x1="7" y1="12" x2="17" y2="12" stroke="#64748b" strokeWidth="1.4" />
          <line
            x1="9.5"
            y1="6.5"
            x2="9.5"
            y2="10"
            stroke="#fda4af"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </g>
      </svg>
    );
  }

  if (icon === 'med_powder') {
    // Powder scoop / sachet with granules SVG
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className={`inline-block shrink-0 ${className}`}
        aria-label="Powder"
      >
        {/* Powder mound */}
        <path
          d="M5 13C5.8 9.2 8.2 7.5 11 7.5C13.8 7.5 16.2 9.2 17 13H5Z"
          fill="#fde68a"
          stroke="#f59e0b"
          strokeWidth="1.5"
        />
        {/* Measuring scoop */}
        <path
          d="M4 13H18C18 16.8 15.2 19.5 11 19.5C6.8 19.5 4 16.8 4 13Z"
          fill="#38bdf8"
          stroke="#0284c7"
          strokeWidth="1.6"
        />
        <path d="M18 14.5H22" stroke="#0284c7" strokeWidth="2.4" strokeLinecap="round" />
        {/* Granule sparkles */}
        <circle cx="9" cy="5" r="1" fill="#fbbf24" />
        <circle cx="12.5" cy="4.2" r="1.1" fill="#fbbf24" />
        <circle cx="15" cy="6" r="0.9" fill="#fbbf24" />
      </svg>
    );
  }

  if (icon === 'med_drops') {
    // Medical liquid droplet with cross SVG
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className={`inline-block shrink-0 ${className}`}
        aria-label="Drops"
      >
        <path
          d="M12 3C12 3 6 10.2 6 14.8C6 18.2 8.7 21 12 21C15.3 21 18 18.2 18 14.8C18 10.2 12 3 12 3Z"
          fill="#38bdf8"
          stroke="#0284c7"
          strokeWidth="1.6"
        />
        <path
          d="M12 12V17M9.5 14.5H14.5"
          stroke="#ffffff"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (icon === 'med_vial') {
    // Vitamin bottle / medicine jar with medical cross
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className={`inline-block shrink-0 ${className}`}
        aria-label="Vitamins"
      >
        <rect
          x="8"
          y="3"
          width="8"
          height="3.5"
          rx="1"
          fill="#cbd5e1"
          stroke="#64748b"
          strokeWidth="1.5"
        />
        <rect
          x="6"
          y="6.5"
          width="12"
          height="14.5"
          rx="2.5"
          fill="#10b981"
          stroke="#059669"
          strokeWidth="1.6"
        />
        <rect x="7.5" y="10" width="9" height="7.5" rx="1" fill="#ecfdf5" />
        <path
          d="M12 11.7V15.7M10 13.7H14"
          stroke="#059669"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (icon === 'med_omega') {
    // Golden translucent softgel / omega capsule with leaf
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className={`inline-block shrink-0 ${className}`}
        aria-label="Softgel"
      >
        <ellipse
          cx="12"
          cy="12"
          rx="8.5"
          ry="5.5"
          transform="rotate(-30 12 12)"
          fill="#fbbf24"
          stroke="#d97706"
          strokeWidth="1.7"
        />
        <path
          d="M8.5 11.5C10 9.5 13 8.5 15.5 8.8"
          stroke="#fef3c7"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return <span className="leading-none select-none">{getMealCategoryIconText(icon)}</span>;
};

export const DynamicIcon: React.FC<IconProps> = ({ name, className = 'w-4 h-4', style }) => {
  const iconKey = (name || '').toLowerCase().trim();

  switch (iconKey) {
    case 'flame':
    case 'fire':
    case 'energy':
      return <Flame className={className} style={style} />;
    case 'beef':
    case 'meat':
    case 'protein':
    case 'proteins':
      return <Beef className={className} style={style} />;
    case 'droplet':
    case 'drop':
    case 'water':
    case 'oil':
    case 'fat':
    case 'fats':
      return <Droplet className={className} style={style} />;
    case 'wheat':
    case 'grain':
    case 'carbs':
    case 'carb':
      return <Wheat className={className} style={style} />;
    case 'apple':
    case 'fiber':
    case 'fruit':
      return <Apple className={className} style={style} />;
    case 'pill':
    case 'vitamin':
    case 'vitaminc':
    case 'vitamind':
      return <Pill className={className} style={style} />;
    case 'sun':
      return <Sun className={className} style={style} />;
    case 'shield':
    case 'iron':
      return <Shield className={className} style={style} />;
    case 'sparkles':
    case 'calcium':
      return <Sparkles className={className} style={style} />;
    case 'activity':
    case 'potassium':
      return <Activity className={className} style={style} />;
    case 'coffee':
      return <Coffee className={className} style={style} />;
    case 'utensils':
      return <Utensils className={className} style={style} />;
    case 'moon':
      return <Moon className={className} style={style} />;
    case 'cookie':
    case 'snack':
      return <Cookie className={className} style={style} />;
    case 'heart':
      return <Heart className={className} style={style} />;
    case 'zap':
      return <Zap className={className} style={style} />;
    case 'dumbbell':
      return <Dumbbell className={className} style={style} />;
    case 'scale':
      return <Scale className={className} style={style} />;
    case 'award':
      return <Award className={className} style={style} />;
    case 'target':
      return <Target className={className} style={style} />;
    default:
      return <CircleDot className={className} style={style} />;
  }
};
