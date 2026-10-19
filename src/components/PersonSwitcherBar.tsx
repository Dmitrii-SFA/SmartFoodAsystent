import React, { useEffect, useRef } from 'react';
import { User, X } from 'lucide-react';
import { PersonProfile } from '../types/config';
import { ThemeStyles, getBorderRadiusClass } from '../utils/themeHelper';

interface PersonSwitcherBarProps {
  people: PersonProfile[];
  activePersonId: string;
  onSelectPerson: (id: string) => void;
  onDeletePerson: (id: string) => void;
  themeStyles: ThemeStyles;
  accentColor: string;
  borderRadius: string;
  langCode?: string;
}

export const PersonSwitcherBar: React.FC<PersonSwitcherBarProps> = ({
  people,
  activePersonId,
  onSelectPerson,
  onDeletePerson,
  themeStyles,
  accentColor,
  borderRadius,
  langCode = 'ru',
}) => {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const radiusClass = getBorderRadiusClass(borderRadius);

  useEffect(() => {
    const activeEl = itemRefs.current[activePersonId];
    if (activeEl) {
      try {
        activeEl.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center',
        });
      } catch {
        // ignore
      }
    }
  }, [activePersonId, people.length]);

  if (!people || people.length <= 1) {
    return null;
  }

  const c = (langCode || 'ru').toLowerCase();
  const deleteTitle = c.startsWith('en')
    ? 'Delete person'
    : c.startsWith('pl')
    ? 'Usuń osobę'
    : 'Удалить человека';

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!scrollContainerRef.current) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      scrollContainerRef.current.scrollLeft += e.deltaY;
    }
  };

  return (
    <div
      className={`border ${themeStyles.borderColor} ${themeStyles.cardBg} ${radiusClass} px-2.5 py-2 shadow-sm select-none`}
    >
      <div
        ref={scrollContainerRef}
        onWheel={handleWheel}
        className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth touch-pan-x"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {people.map((person) => {
          const isActive = person.id === activePersonId;
          return (
            <div
              key={person.id}
              ref={(el) => {
                itemRefs.current[person.id] = el;
              }}
              onClick={() => onSelectPerson(person.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectPerson(person.id);
                }
              }}
              className={`group flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-xl border text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-all active:scale-95 ${
                isActive
                  ? 'text-white shadow-sm'
                  : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-700/60'
              }`}
              style={
                isActive
                  ? {
                      backgroundColor: `${accentColor}28`,
                      borderColor: accentColor,
                      color: '#ffffff',
                    }
                  : undefined
              }
            >
              <User
                className="w-3.5 h-3.5 shrink-0"
                style={isActive ? { color: accentColor } : undefined}
              />
              <span className="max-w-[160px] truncate">{person.name}</span>

              {people.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeletePerson(person.id);
                  }}
                  title={deleteTitle}
                  className={`p-1 rounded-lg transition-colors shrink-0 ${
                    isActive
                      ? 'hover:bg-rose-500/30 text-slate-300 hover:text-rose-200'
                      : 'hover:bg-rose-500/20 text-slate-400 hover:text-rose-300'
                  }`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
