import React from 'react';
import { AppTab, LocalizationLabels } from '../types/config';
import { ThemeStyles } from '../utils/themeHelper';
import { getUITranslations } from '../utils/translations';
import {
  CalendarDays,
  Apple,
  BookOpen,
  ShoppingCart,
  Settings,
} from 'lucide-react';

interface TopNavigationProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  themeStyles: ThemeStyles;
  accentColor: string;
  langCode?: string;
  labels?: Partial<LocalizationLabels>;
  shoppingCount?: number;
  onToggleAiChat?: () => void;
  isAiChatOpen?: boolean;
}

export const TopNavigation: React.FC<TopNavigationProps> = ({
  activeTab,
  onTabChange,
  themeStyles,
  accentColor,
  langCode = 'ru',
  labels,
}) => {
  const t = getUITranslations(langCode, labels);

  const tabs: Array<{
    id: AppTab;
    label: string;
    mobileLabel: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    {
      id: 'diary',
      label: t.tabDailyMenu,
      mobileLabel: t.tabDailyMenu,
      icon: CalendarDays,
    },
    {
      id: 'library',
      label: t.tabFoodLibrary,
      mobileLabel: t.tabFoodLibraryShort,
      icon: Apple,
    },
    {
      id: 'recipes',
      label: t.tabRecipes,
      mobileLabel: t.tabRecipes,
      icon: BookOpen,
    },
    {
      id: 'shopping',
      label: t.tabShoppingList,
      mobileLabel: t.tabShoppingListShort,
      icon: ShoppingCart,
    },
    {
      id: 'settings',
      label: t.tabSettings,
      mobileLabel: t.tabSettings,
      icon: Settings,
    },
  ];

  return (
    <nav className={`sticky top-0 z-40 border-b ${themeStyles.borderColor} ${themeStyles.cardBg} backdrop-blur-md transition-colors duration-200 shadow-xs`}>
      <div className="max-w-4xl mx-auto px-1 sm:px-4 py-1.5 sm:py-2 flex items-center justify-between gap-1 sm:gap-2">
        {/* The 5 main tabs - 5-column grid on mobile to guarantee fitting, flex on desktop */}
        <div className="grid grid-cols-5 sm:flex items-center gap-1 sm:gap-2 flex-1 min-w-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`relative flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-1.5 px-1 sm:px-3.5 sm:py-2 min-h-[52px] sm:min-h-[42px] font-semibold rounded-xl transition-all active:scale-95 touch-manipulation ${
                  isActive
                    ? 'text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
                style={
                  isActive
                    ? { backgroundColor: accentColor }
                    : undefined
                }
                title={tab.label}
              >
                <Icon className={`w-4 h-4 sm:w-4 sm:h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="text-[10px] sm:text-xs md:text-sm text-center leading-tight break-words max-w-full">
                  <span className="sm:hidden">{tab.mobileLabel}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

