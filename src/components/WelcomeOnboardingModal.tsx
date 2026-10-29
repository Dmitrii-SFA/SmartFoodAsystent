import React from 'react';
import { ThemeStyles } from '../utils/themeHelper';
import {
  Sparkles,
  FolderOpen,
  ChefHat,
  ShoppingCart,
  Globe,
  Wrench,
  Send,
  Mail,
  Check,
  X,
} from 'lucide-react';

export const WELCOME_MODAL_SEEN_STORAGE_KEY = 'sfa_welcome_modal_seen_v1';

export function hasSeenWelcomeModal(): boolean {
  try {
    return localStorage.getItem(WELCOME_MODAL_SEEN_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function markWelcomeModalSeen(): void {
  try {
    localStorage.setItem(WELCOME_MODAL_SEEN_STORAGE_KEY, 'true');
  } catch {
    // ignore storage errors
  }
}

interface WelcomeOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  themeStyles: ThemeStyles;
  langCode?: string;
  onSwitchLanguage?: (code: 'en' | 'ru' | 'pl') => void;
}

export const WelcomeOnboardingModal: React.FC<WelcomeOnboardingModalProps> = ({
  isOpen,
  onClose,
  themeStyles,
  langCode = 'en',
  onSwitchLanguage,
}) => {
  if (!isOpen) return null;

  const c = (langCode || 'en').toLowerCase();
  const isRu = c.startsWith('ru');
  const isPl = c.startsWith('pl');
  const activeLang: 'en' | 'ru' | 'pl' = isRu ? 'ru' : isPl ? 'pl' : 'en';

  const handleConfirm = () => {
    markWelcomeModalSeen();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`w-full max-w-lg max-h-[88vh] sm:max-h-[85vh] border ${themeStyles.borderColor} ${themeStyles.cardBg} rounded-3xl shadow-2xl overflow-hidden flex flex-col`}
      >
        {/* Top Header */}
        <div className="shrink-0 flex items-center justify-between gap-2 px-5 py-3.5 border-b border-slate-800/80 bg-slate-900/70">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/35 text-emerald-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
                Smart Food Assistant
              </span>
              <h2 className="text-sm sm:text-base font-extrabold text-white truncate">
                {isRu
                  ? 'О приложении'
                  : isPl
                  ? 'O aplikacji'
                  : 'Welcome & Quick Guide'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {onSwitchLanguage && (
              <div className="flex items-center rounded-xl bg-slate-800/90 border border-slate-700/80 p-0.5 text-[11px] font-bold">
                {(['en', 'ru', 'pl'] as const).map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => onSwitchLanguage(code)}
                    className={`px-2 py-1 rounded-lg uppercase transition ${
                      activeLang === code
                        ? 'bg-emerald-500 text-slate-950 shadow-xs'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    {code}
                  </button>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={handleConfirm}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              aria-label={isRu ? 'Закрыть' : isPl ? 'Zamknij' : 'Close'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Smooth Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto scroll-smooth px-5 py-4 space-y-4 text-xs sm:text-sm leading-relaxed">
          {isRu ? (
            <>
              {/* Russian (Exact Author Text) */}
              <div className="space-y-2.5">
                <h3 className={`text-base sm:text-lg font-extrabold ${themeStyles.textPrimary}`}>
                  Привет! Добро пожаловать в Smart Food Assistant 👋
                </h3>
                <p className={themeStyles.textSecondary}>
                  Я создал это приложение в одиночку — в первую очередь для самого себя, опираясь на многолетний опыт подсчета калорий в других трекерах. Со временем оно стало настолько удобным в быту, что я просто решил поделиться им с другими. Здесь нет рекламы, навязчивого маркетинга или цели заработать миллионы — только практичный инструмент, сделанный с душой и вниманием к деталям.
                </p>
                <p className={`font-semibold ${themeStyles.textPrimary}`}>
                  Чем это приложение отличается от привычных счетчиков калорий и как выжать из него максимум:
                </p>
              </div>

              {/* 1. Чистая база продуктов */}
              <div className="p-3.5 rounded-2xl border border-slate-800/80 bg-slate-900/45 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-emerald-400">
                  <FolderOpen className="w-4 h-4 shrink-0" />
                  <span>🗂 Чистая база продуктов — только под вас и на вашем языке</span>
                </div>
                <p className={themeStyles.textSecondary}>
                  Вы начинаете с пустой библиотеки, и это сделано намеренно. В общих пользовательских базах других приложений царит хаос: кто-то ошибся в граммовках или БЖУ, кто-то сделал опечатку, а один и тот же продукт из магазина (например, из Biedronka или Lidl) записан десятком разных людей вперемешку на польском, русском, украинском и английском языках.
                </p>
                <p className={themeStyles.textSecondary}>
                  Здесь вы собираете свою идеальную, проверенную базу из тех продуктов, которые реально едите, и называете их на том языке, на котором удобно искать именно вам. А встроенный ИИ-сканер поможет заполнить нутриенты за пару секунд по фото этикетки или названию.
                </p>
              </div>

              {/* 2. Умные рецепты */}
              <div className="p-3.5 rounded-2xl border border-slate-800/80 bg-slate-900/45 space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-400">
                  <ChefHat className="w-4 h-4 shrink-0" />
                  <span>🍲 Умные рецепты: от расчета уварки до кулинарной шпаргалки</span>
                </div>
                <p className={themeStyles.textSecondary}>
                  Раздел рецептов здесь решает сразу три задачи:
                </p>
                <ul className={`list-disc pl-5 space-y-1.5 ${themeStyles.textSecondary}`}>
                  <li>
                    Точный расчет КБЖУ готового блюда с учетом изменения веса после варки или запекания.
                  </li>
                  <li>
                    Удобная шпаргалка на кухне, в которую можно заглянуть прямо во время готовки, чтобы не держать пропорции и шаги в голове.
                  </li>
                  <li>
                    Помощь ИИ и обмен с друзьями: вы можете генерировать и адаптировать рецепты с помощью нейросети, а удачными блюдами — легко делиться с другими пользователями приложения.
                  </li>
                </ul>
              </div>

              {/* 3. Единый список покупок */}
              <div className="p-3.5 rounded-2xl border border-slate-800/80 bg-slate-900/45 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-cyan-400">
                  <ShoppingCart className="w-4 h-4 shrink-0" />
                  <span>🛒 Единый список покупок (даже для зубной пасты)</span>
                </div>
                <p className={themeStyles.textSecondary}>
                  Больше не нужно прыгать между трекером калорий и заметками в телефоне. Планируете меню или видите, что закончился продукт? Нажмите одну кнопку, и он сразу попадет в список покупок. Лайфхак: вы можете занести в свою библиотеку бытовые мелочи с нулевой калорийностью (например, мыло, губки или зубную пасту) и точно так же в один клик добавлять их в список перед походом в магазин, чтобы ничего не забыть.
                </p>
              </div>

              {/* 4. Язык интерфейса */}
              <div className="p-3.5 rounded-2xl border border-slate-800/80 bg-slate-900/45 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-purple-400">
                  <Globe className="w-4 h-4 shrink-0" />
                  <span>🌍 Язык интерфейса</span>
                </div>
                <p className={themeStyles.textSecondary}>
                  Вы в любой момент можете переключить язык самого приложения в настройках на тот, который вам комфортнее.
                </p>
              </div>

              {/* 5. Активное тестирование и контакты */}
              <div className="p-3.5 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 space-y-2.5">
                <div className="flex items-center gap-2 font-bold text-emerald-400">
                  <Wrench className="w-4 h-4 shrink-0" />
                  <span>🛠 Приложение в стадии активного тестирования</span>
                </div>
                <p className={themeStyles.textSecondary}>
                  Проект живой и продолжает развиваться, поэтому местами еще могут встречаться мелкие шероховатости или неполадки. Если вы заметите ошибку, захотите предложить крутую идею или просто поделиться впечатлениями — напишите мне напрямую:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <a
                    href="https://t.me/smartfoodasystent"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-300 font-semibold text-xs transition"
                  >
                    <Send className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Telegram: @smartfoodasystent</span>
                  </a>
                  <a
                    href="mailto:smartfoodasystent@gmail.com"
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-semibold text-xs transition"
                  >
                    <Mail className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">smartfoodasystent@gmail.com</span>
                  </a>
                </div>
              </div>

              <p className={`text-center font-bold pt-1 ${themeStyles.textPrimary}`}>
                Приятного и удобного пользования!
              </p>
            </>
          ) : isPl ? (
            <>
              {/* Polish Version */}
              <div className="space-y-2.5">
                <h3 className={`text-base sm:text-lg font-extrabold ${themeStyles.textPrimary}`}>
                  Cześć! Witaj w Smart Food Assistant 👋
                </h3>
                <p className={themeStyles.textSecondary}>
                  Stworzyłem tę aplikację w pojedynkę — przede wszystkim dla самого siebie, opierając się na wieloletnim doświadczeniu w liczeniu kalorii w innych aplikacjach. Z czasem stała się tak wygodna na co dzień, że postanowiłem podzielić się nią z innymi. Nie ma tu reklam, nachalnego marketingu ani celu zarobienia milionów — to po prostu praktyczne narzędzie stworzone z sercem i dbałością o szczegóły.
                </p>
                <p className={`font-semibold ${themeStyles.textPrimary}`}>
                  Czym ta aplikacja różni się od zwykłych liczników kalorii i jak wycisnąć z niej maksimum:
                </p>
              </div>

              <div className="p-3.5 rounded-2xl border border-slate-800/80 bg-slate-900/45 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-emerald-400">
                  <FolderOpen className="w-4 h-4 shrink-0" />
                  <span>🗂 Czysta baza produktów — tylko pod Ciebie i w Twoim języku</span>
                </div>
                <p className={themeStyles.textSecondary}>
                  Zaczynasz z przejrzystą biblioteką i jest to działanie celowe. W ogólnych bazach innych aplikacji panuje chaos: ktoś pomylił gramaturę lub makroskładniki, ktoś zrobił literówkę, a ten sam produkt ze sklepu (np. z Biedronki czy Lidla) jest wpisany przez dziesięć osób na przemian po polsku, rosyjsku, ukraińsku i angielsku.
                </p>
                <p className={themeStyles.textSecondary}>
                  Tutaj budujesz własną, sprawdzoną bazę produktów, które naprawdę jesz, i nazywasz je w języku, w którym najwygodniej Ci je wyszukiwać. Wbudowany skaner AI pomoże uzupełnić wartości odżywcze w kilka sekund na podstawie zdjęcia etykiety lub nazwy.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl border border-slate-800/80 bg-slate-900/45 space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-400">
                  <ChefHat className="w-4 h-4 shrink-0" />
                  <span>🍲 Inteligentne przepisy: od obliczania odparowania wody po kulinarną ściągawkę</span>
                </div>
                <p className={themeStyles.textSecondary}>
                  Sekcja przepisów rozwiązuje tutaj od razu trzy zadania:
                </p>
                <ul className={`list-disc pl-5 space-y-1.5 ${themeStyles.textSecondary}`}>
                  <li>
                    Dokładne obliczanie kalorii i makroskładników gotowego dania z uwzględnieniem zmiany wagi po gotowaniu, smażeniu lub pieczeniu.
                  </li>
                  <li>
                    Wygodna ściągawka w kuchni, do której możesz zajrzeć w trakcie gotowania, aby nie trzymać proporcji i kroków w głowie.
                  </li>
                  <li>
                    Pomoc AI i udostępnianie znajomym: możesz generować i dostosowywać przepisy za pomocą sztucznej inteligencji, a udanymi daniami łatwo dzielić się z innymi użytkownikami.
                  </li>
                </ul>
              </div>

              <div className="p-3.5 rounded-2xl border border-slate-800/80 bg-slate-900/45 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-cyan-400">
                  <ShoppingCart className="w-4 h-4 shrink-0" />
                  <span>🛒 Wspólna lista zakupów (nawet na pastę do zębów)</span>
                </div>
                <p className={themeStyles.textSecondary}>
                  Nie musisz już переłączać się między licznikiem kalorii a notatnikiem w telefonie. Planujesz menu lub widzisz, że skończył się produkt? Kliknij jeden przycisk, a od razu trafi na listę zakupów. Lifehack: możesz dodać do swojej biblioteki artykuły domowe z zerową kalorycznością (np. mydło, gąbki czy pastę do zębów) i jednym kliknięciem dodawać je do listy przed wyjściem do sklepu.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl border border-slate-800/80 bg-slate-900/45 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-purple-400">
                  <Globe className="w-4 h-4 shrink-0" />
                  <span>🌍 Język interfejsu</span>
                </div>
                <p className={themeStyles.textSecondary}>
                  W każdej chwili możesz zmienić język aplikacji w ustawieniach (lub na górze tego okna) na ten, który jest dla Ciebie najwygodniejszy.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 space-y-2.5">
                <div className="flex items-center gap-2 font-bold text-emerald-400">
                  <Wrench className="w-4 h-4 shrink-0" />
                  <span>🛠 Aplikacja w fazie aktywnego rozwoju</span>
                </div>
                <p className={themeStyles.textSecondary}>
                  Projekt żyje i stale się rozwija, dlatego miejscami mogą pojawić się drobne niedociągnięcia. Jeśli zauważysz błąd, chcesz zaproponować świetny pomysł lub po prostu podzielić się wrażeniami — napisz do mnie bezpośrednio:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <a
                    href="https://t.me/smartfoodasystent"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-300 font-semibold text-xs transition"
                  >
                    <Send className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Telegram: @smartfoodasystent</span>
                  </a>
                  <a
                    href="mailto:smartfoodasystent@gmail.com"
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-semibold text-xs transition"
                  >
                    <Mail className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">smartfoodasystent@gmail.com</span>
                  </a>
                </div>
              </div>

              <p className={`text-center font-bold pt-1 ${themeStyles.textPrimary}`}>
                Miłego i wygodnego korzystania!
              </p>
            </>
          ) : (
            <>
              {/* English Version */}
              <div className="space-y-2.5">
                <h3 className={`text-base sm:text-lg font-extrabold ${themeStyles.textPrimary}`}>
                  Hi! Welcome to Smart Food Assistant 👋
                </h3>
                <p className={themeStyles.textSecondary}>
                  I built this app solo — first and foremost for myself, drawing on years of experience tracking calories in other apps. Over time it became so convenient in daily life that I decided to share it with others. There are no ads, pushy marketing, or schemes to make millions here — just a practical tool crafted with care and attention to detail.
                </p>
                <p className={`font-semibold ${themeStyles.textPrimary}`}>
                  What makes this app different from ordinary calorie trackers and how to get the most out of it:
                </p>
              </div>

              <div className="p-3.5 rounded-2xl border border-slate-800/80 bg-slate-900/45 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-emerald-400">
                  <FolderOpen className="w-4 h-4 shrink-0" />
                  <span>🗂 Clean food database — tailored to you and in your language</span>
                </div>
                <p className={themeStyles.textSecondary}>
                  You start with a clean library on purpose. Public crowd-sourced databases in other apps are chaotic: someone entered wrong macros or weights, someone made a typo, and the exact same store product (e.g., from Biedronka or Lidl) is listed ten times mixed across Polish, Russian, Ukrainian, and English.
                </p>
                <p className={themeStyles.textSecondary}>
                  Here, you build your own trusted database of the foods you actually eat, named in whichever language you prefer to search. And the built-in AI scanner fills in nutrients in seconds from a nutrition label photo or product name.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl border border-slate-800/80 bg-slate-900/45 space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-400">
                  <ChefHat className="w-4 h-4 shrink-0" />
                  <span>🍲 Smart recipes: from cooking weight-loss math to kitchen cheat-sheet</span>
                </div>
                <p className={themeStyles.textSecondary}>
                  The recipes section solves three problems at once:
                </p>
                <ul className={`list-disc pl-5 space-y-1.5 ${themeStyles.textSecondary}`}>
                  <li>
                    Accurate calories &amp; macros for the finished dish, accounting for moisture evaporation during boiling, frying, or baking.
                  </li>
                  <li>
                    A handy kitchen cheat-sheet you can check right while cooking so you don’t have to memorize proportions and steps.
                  </li>
                  <li>
                    AI assistance &amp; sharing with friends: generate and adapt step-by-step recipes with AI, and easily share your favorite dishes with other app users.
                  </li>
                </ul>
              </div>

              <div className="p-3.5 rounded-2xl border border-slate-800/80 bg-slate-900/45 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-cyan-400">
                  <ShoppingCart className="w-4 h-4 shrink-0" />
                  <span>🛒 Unified shopping list (even for toothpaste)</span>
                </div>
                <p className={themeStyles.textSecondary}>
                  No more jumping between your calorie tracker and phone notes. Planning a menu or just ran out of an item? Tap one button and it goes straight to your shopping list. Lifehack: you can add zero-calorie household essentials (like soap, sponges, or toothpaste) to your library and add them to your shopping list in one tap before heading to the store.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl border border-slate-800/80 bg-slate-900/45 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-purple-400">
                  <Globe className="w-4 h-4 shrink-0" />
                  <span>🌍 Interface language</span>
                </div>
                <p className={themeStyles.textSecondary}>
                  You can switch the app language at any time in Settings (or using the EN / RU / PL switcher at the top of this window) to whichever language is most comfortable for you.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 space-y-2.5">
                <div className="flex items-center gap-2 font-bold text-emerald-400">
                  <Wrench className="w-4 h-4 shrink-0" />
                  <span>🛠 Active testing &amp; direct feedback</span>
                </div>
                <p className={themeStyles.textSecondary}>
                  This project is alive and actively evolving, so you may occasionally spot minor rough edges. If you notice a bug, want to suggest a cool feature, or just share your thoughts — reach out to me directly:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <a
                    href="https://t.me/smartfoodasystent"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-300 font-semibold text-xs transition"
                  >
                    <Send className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Telegram: @smartfoodasystent</span>
                  </a>
                  <a
                    href="mailto:smartfoodasystent@gmail.com"
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-semibold text-xs transition"
                  >
                    <Mail className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">smartfoodasystent@gmail.com</span>
                  </a>
                </div>
              </div>

              <p className={`text-center font-bold pt-1 ${themeStyles.textPrimary}`}>
                Enjoy using Smart Food Assistant!
              </p>
            </>
          )}
        </div>

        {/* Pinned Bottom CTA Button (Always under the user's thumb) */}
        <div className="shrink-0 p-4 border-t border-slate-800/80 bg-slate-900/90 backdrop-blur-md">
          <button
            type="button"
            onClick={handleConfirm}
            className="w-full min-h-[48px] py-3 px-5 rounded-2xl font-extrabold text-sm text-white shadow-lg flex items-center justify-center gap-2 transition active:scale-[0.98] hover:opacity-95"
            style={{
              background: 'linear-gradient(135deg, #10b981, #059669)',
            }}
          >
            <Check className="w-4 h-4 shrink-0" />
            <span>
              {isRu
                ? 'Понятно, начать работу'
                : isPl
                ? 'Rozumiem, zaczynamy'
                : 'Got it, start using'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
