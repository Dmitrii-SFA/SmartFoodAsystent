import React, { useState } from 'react';
import { Download, Smartphone, Plus, X, Share } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { ThemeStyles, getBorderRadiusClass } from '../utils/themeHelper';

interface PWAInstallButtonProps {
  label?: string;
  accentColor?: string;
  variant?: 'default' | 'square' | 'banner';
  langCode?: string;
  themeStyles?: ThemeStyles;
  borderRadius?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  label = 'Add to Home Screen',
  accentColor = '#10b981',
  variant = 'default',
  langCode = 'en',
  themeStyles,
  borderRadius = 'rounded-2xl',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [dismissedForSession, setDismissedForSession] = useState(false);

  // Hide the button when the app is already installed / opened from the home screen,
  // or when the user dismissed the banner for the current session
  if (isInstalled || (variant === 'banner' && dismissedForSession)) {
    return null;
  }

  const c = (langCode || 'en').toLowerCase();
  const isEn = c.startsWith('en');
  const isPl = c.startsWith('pl');

  const buttonTitle = isEn
    ? 'Add to Home Screen'
    : isPl
    ? 'Dodaj do ekranu głównego'
    : 'Добавить на главный экран';

  const laterTitle = isEn
    ? 'Add later'
    : isPl
    ? 'Dodaj później'
    : 'Добавить позже';

  const modalTitle = isEn
    ? 'Add to Home Screen'
    : isPl
    ? 'Dodaj do ekranu głównego'
    : 'Добавить на главный экран';

  const modalSubtitle = isEn
    ? 'Create an app icon on your smartphone for quick one-tap launch'
    : isPl
    ? 'Utwórz ikonę aplikacji na smartfonie, aby uruchamiać jednym dotknięciem'
    : 'Создайте иконку приложения на смартфоне для быстрого запуска';

  const closeLabel = isEn ? 'Got it' : isPl ? 'Rozumiem' : 'Понятно';

  const handlePress = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (!accepted) {
        // User dismissed native dialog; no need to open fallback modal
      }
      return;
    }
    setShowGuideModal(true);
  };

  const radiusClass = getBorderRadiusClass(borderRadius);

  return (
    <>
      {variant === 'banner' ? (
        <div
          data-no-day-swipe="true"
          className="flex items-stretch gap-2 w-full"
        >
          <button
            type="button"
            onClick={handlePress}
            title={buttonTitle}
            className={`flex-1 min-w-0 py-2.5 px-3.5 ${radiusClass} border flex items-center justify-center gap-2.5 text-xs sm:text-sm font-bold text-slate-950 shadow-md hover:brightness-105 transition-all active:scale-[0.99]`}
            style={{
              backgroundColor: accentColor,
              borderColor: accentColor,
            }}
          >
            <div className="w-6 h-6 rounded-lg bg-slate-950/15 flex items-center justify-center shrink-0 relative">
              <Smartphone className="w-3.5 h-3.5 text-slate-950" />
              <Plus className="w-2.5 h-2.5 stroke-[3] text-slate-950 -ml-0.5" />
            </div>
            <span className="truncate">{buttonTitle}</span>
          </button>

          <button
            type="button"
            onClick={() => setDismissedForSession(true)}
            title={laterTitle}
            className={`shrink-0 px-3 py-2.5 ${radiusClass} border ${
              themeStyles
                ? `${themeStyles.borderColor} ${themeStyles.cardBg} ${themeStyles.textSecondary}`
                : 'border-slate-700 bg-slate-900 text-slate-300'
            } text-[11px] sm:text-xs font-semibold hover:text-white hover:border-slate-500 transition-all active:scale-95 flex items-center gap-1`}
          >
            <span>{laterTitle}</span>
            <X className="w-3.5 h-3.5 opacity-75 shrink-0" />
          </button>
        </div>
      ) : variant === 'square' ? (
        <button
          type="button"
          onClick={handlePress}
          title={buttonTitle}
          aria-label={buttonTitle}
          className={`w-9 h-9 sm:w-10 sm:h-10 aspect-square shrink-0 border ${
            themeStyles ? `${themeStyles.borderColor} ${themeStyles.cardBg}` : 'border-slate-700 bg-slate-900'
          } ${radiusClass} flex items-center justify-center shadow-sm hover:brightness-110 transition-all active:scale-95 relative`}
          style={{ borderColor: `${accentColor}55` }}
        >
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center relative"
            style={{ backgroundColor: `${accentColor}22`, color: accentColor }}
          >
            <Smartphone className="w-4 h-4" />
            <span
              className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center text-slate-950 shadow-sm"
              style={{ backgroundColor: accentColor }}
            >
              <Plus className="w-2.5 h-2.5 stroke-[3]" />
            </span>
          </div>
        </button>
      ) : (
        <button
          type="button"
          onClick={handlePress}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl text-white shadow-sm transition hover:opacity-90 active:scale-95"
          style={{ backgroundColor: accentColor }}
          title={buttonTitle}
        >
          <Download className="w-3.5 h-3.5" />
          <span>{label}</span>
        </button>
      )}

      {showGuideModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setShowGuideModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-sm border ${
              themeStyles ? `${themeStyles.borderColor} ${themeStyles.cardBg}` : 'border-slate-700 bg-slate-900'
            } ${radiusClass} p-5 shadow-2xl text-slate-100 space-y-4`}
          >
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <img
                  src="/apple-touch-icon.png"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/icon.svg';
                  }}
                  alt="App Icon"
                  className="w-12 h-12 rounded-2xl border border-slate-700/80 shadow-md shrink-0 object-cover bg-slate-800"
                />
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white leading-tight">
                    {modalTitle}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                    {modalSubtitle}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isIOS ? (
              <div className="space-y-3 text-xs text-slate-300">
                <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-2.5">
                  <div
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-bold text-[11px]"
                    style={{ backgroundColor: `${accentColor}25`, color: accentColor }}
                  >
                    1
                  </div>
                  <p className="leading-relaxed">
                    {isEn ? (
                      <>
                        Tap the <strong>Share</strong> <Share className="inline w-3.5 h-3.5 mx-0.5" /> button in the Safari toolbar.
                      </>
                    ) : isPl ? (
                      <>
                        Naciśnij przycisk <strong>Udostępnij</strong> <Share className="inline w-3.5 h-3.5 mx-0.5" /> na pasku Safari.
                      </>
                    ) : (
                      <>
                        Нажмите кнопку <strong>«Поделиться»</strong> <Share className="inline w-3.5 h-3.5 mx-0.5" /> в нижней панели браузера Safari.
                      </>
                    )}
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-2.5">
                  <div
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-bold text-[11px]"
                    style={{ backgroundColor: `${accentColor}25`, color: accentColor }}
                  >
                    2
                  </div>
                  <p className="leading-relaxed">
                    {isEn ? (
                      <>
                        Scroll down and select <strong>Add to Home Screen</strong>.
                      </>
                    ) : isPl ? (
                      <>
                        Przewiń w dół i wybierz <strong>Do ekranu początkowego</strong>.
                      </>
                    ) : (
                      <>
                        Выберите пункт <strong>«На экран "Домой"»</strong> (Add to Home Screen).
                      </>
                    )}
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-2.5">
                  <div
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-bold text-[11px]"
                    style={{ backgroundColor: `${accentColor}25`, color: accentColor }}
                  >
                    3
                  </div>
                  <p className="leading-relaxed">
                    {isEn ? (
                      <>
                        Tap <strong>Add</strong> in the top right corner to create the icon.
                      </>
                    ) : isPl ? (
                      <>
                        Naciśnij <strong>Dodaj</strong> w prawym górnym rogu, aby utworzyć ikonę.
                      </>
                    ) : (
                      <>
                        Нажмите <strong>«Добавить»</strong> в правом верхнем углу — иконка появится на экране смартфона.
                      </>
                    )}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs text-slate-300">
                <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-2.5">
                  <div
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-bold text-[11px]"
                    style={{ backgroundColor: `${accentColor}25`, color: accentColor }}
                  >
                    1
                  </div>
                  <p className="leading-relaxed">
                    {isEn ? (
                      <>
                        On <strong>Android (Chrome)</strong>: tap the browser menu <strong>⋮</strong> (top right) and select <strong>Add to Home screen</strong> or <strong>Install app</strong>.
                      </>
                    ) : isPl ? (
                      <>
                        Na <strong>Androidzie (Chrome)</strong>: otwórz menu przeglądarki <strong>⋮</strong> i wybierz <strong>Dodaj do ekranu głównego</strong> lub <strong>Zainstaluj aplikację</strong>.
                      </>
                    ) : (
                      <>
                        На <strong>Android (Chrome)</strong>: нажмите меню браузера <strong>⋮</strong> (в правом верхнем углу) и выберите <strong>«Добавить на главный экран»</strong> или <strong>«Установить приложение»</strong>.
                      </>
                    )}
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-2.5">
                  <div
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-bold text-[11px]"
                    style={{ backgroundColor: `${accentColor}25`, color: accentColor }}
                  >
                    2
                  </div>
                  <p className="leading-relaxed">
                    {isEn ? (
                      <>
                        On <strong>iPhone (Safari)</strong>: tap <strong>Share</strong> <Share className="inline w-3.5 h-3.5 mx-0.5" /> and choose <strong>Add to Home Screen</strong>.
                      </>
                    ) : isPl ? (
                      <>
                        Na <strong>iPhone (Safari)</strong>: naciśnij <strong>Udostępnij</strong> <Share className="inline w-3.5 h-3.5 mx-0.5" /> i wybierz <strong>Do ekranu początkowego</strong>.
                      </>
                    ) : (
                      <>
                        На <strong>iPhone (Safari)</strong>: нажмите кнопку <strong>«Поделиться»</strong> <Share className="inline w-3.5 h-3.5 mx-0.5" /> и выберите <strong>«На экран "Домой"»</strong>.
                      </>
                    )}
                  </p>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              className="w-full rounded-xl py-2.5 text-xs font-bold text-slate-950 transition hover:opacity-90"
              style={{ backgroundColor: accentColor }}
            >
              {closeLabel}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

