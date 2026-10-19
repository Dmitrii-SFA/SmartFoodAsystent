import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

interface OfflineIndicatorProps {
  label?: string;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  label = 'Офлайн режим — данные сохранены локально',
}) => {
  const isOnline = useOnlineStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-40 flex items-center gap-2 rounded-xl bg-amber-500/90 backdrop-blur-md px-3 py-2 text-xs font-semibold text-slate-950 shadow-lg border border-amber-400 animate-bounce">
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>{label}</span>
    </div>
  );
};
