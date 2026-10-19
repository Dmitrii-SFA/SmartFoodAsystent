import { ThemeConfig, ThemeMode } from '../types/config';

export interface ThemeStyles {
  appBg: string;
  cardBg: string;
  cardHover: string;
  borderColor: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accentBg: string;
  accentText: string;
  inputBg: string;
}

export function getThemeStyles(theme: ThemeConfig): ThemeStyles {
  const mode: ThemeMode = theme.mode || 'dark';

  switch (mode) {
    case 'light':
      return {
        appBg: 'bg-slate-50 text-slate-900',
        cardBg: theme.cardGlassEffect ? 'bg-white/85 backdrop-blur-md shadow-xs' : 'bg-white shadow-xs',
        cardHover: 'hover:border-slate-300',
        borderColor: 'border-slate-200',
        textPrimary: 'text-slate-900',
        textSecondary: 'text-slate-600',
        textMuted: 'text-slate-400',
        accentBg: 'bg-emerald-600 text-white',
        accentText: 'text-emerald-600',
        inputBg: 'bg-slate-100 border-slate-300 text-slate-900 placeholder:text-slate-400',
      };

    case 'emerald':
      return {
        appBg: 'bg-emerald-950 text-emerald-50',
        cardBg: theme.cardGlassEffect ? 'bg-emerald-900/60 backdrop-blur-md shadow-sm' : 'bg-emerald-900/80',
        cardHover: 'hover:border-emerald-600',
        borderColor: 'border-emerald-800/80',
        textPrimary: 'text-emerald-50',
        textSecondary: 'text-emerald-300',
        textMuted: 'text-emerald-500',
        accentBg: 'bg-emerald-500 text-emerald-950',
        accentText: 'text-emerald-400',
        inputBg: 'bg-emerald-900/70 border-emerald-700 text-emerald-100 placeholder:text-emerald-500',
      };

    case 'sunset':
      return {
        appBg: 'bg-stone-950 text-stone-100',
        cardBg: theme.cardGlassEffect ? 'bg-stone-900/75 backdrop-blur-md shadow-sm' : 'bg-stone-900',
        cardHover: 'hover:border-orange-700',
        borderColor: 'border-stone-800',
        textPrimary: 'text-stone-100',
        textSecondary: 'text-orange-200/80',
        textMuted: 'text-stone-500',
        accentBg: 'bg-orange-500 text-white',
        accentText: 'text-orange-400',
        inputBg: 'bg-stone-800/70 border-stone-700 text-stone-100 placeholder:text-stone-500',
      };

    case 'cyberpunk':
      return {
        appBg: 'bg-black text-cyan-100',
        cardBg: theme.cardGlassEffect ? 'bg-zinc-950/90 backdrop-blur-md border border-cyan-500/30 shadow-cyan-950/30' : 'bg-zinc-950 border border-cyan-800/50',
        cardHover: 'hover:border-cyan-400/70',
        borderColor: 'border-zinc-800',
        textPrimary: 'text-white',
        textSecondary: 'text-cyan-300',
        textMuted: 'text-zinc-500',
        accentBg: 'bg-cyan-500 text-black',
        accentText: 'text-cyan-400',
        inputBg: 'bg-zinc-900 border-zinc-700 text-cyan-200 placeholder:text-zinc-600',
      };

    case 'nord':
      return {
        appBg: 'bg-[#242933] text-[#ECEFF4]',
        cardBg: theme.cardGlassEffect ? 'bg-[#2E3440]/80 backdrop-blur-md shadow-sm' : 'bg-[#2E3440]',
        cardHover: 'hover:border-[#88C0D0]/50',
        borderColor: 'border-[#3B4252]',
        textPrimary: 'text-[#ECEFF4]',
        textSecondary: 'text-[#D8DEE9]',
        textMuted: 'text-[#4C566A]',
        accentBg: 'bg-[#88C0D0] text-[#2E3440]',
        accentText: 'text-[#88C0D0]',
        inputBg: 'bg-[#3B4252] border-[#434C5E] text-[#ECEFF4] placeholder:text-[#4C566A]',
      };

    case 'dark':
    default:
      return {
        appBg: 'bg-slate-950 text-slate-100',
        cardBg: theme.cardGlassEffect ? 'bg-slate-900/75 backdrop-blur-md shadow-sm' : 'bg-slate-900',
        cardHover: 'hover:border-slate-700',
        borderColor: 'border-slate-800',
        textPrimary: 'text-slate-100',
        textSecondary: 'text-slate-400',
        textMuted: 'text-slate-600',
        accentBg: 'bg-emerald-500 text-slate-950',
        accentText: 'text-emerald-400',
        inputBg: 'bg-slate-800/60 border-slate-700 text-slate-100 placeholder:text-slate-500',
      };
  }
}

export function getBorderRadiusClass(radius?: string): string {
  switch (radius) {
    case 'rounded-none':
      return 'rounded-none';
    case 'rounded-xl':
      return 'rounded-xl';
    case 'rounded-3xl':
      return 'rounded-3xl';
    case 'rounded-2xl':
    default:
      return 'rounded-2xl';
  }
}
