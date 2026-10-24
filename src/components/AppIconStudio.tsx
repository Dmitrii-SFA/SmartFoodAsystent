import React, { useState, useEffect } from 'react';
import { Check, Download, Smartphone, Monitor, Sparkles, X, ChevronDown } from 'lucide-react';
import { ThemeStyles, getBorderRadiusClass } from '../utils/themeHelper';

export interface SmartFoodIconVariant {
  id: number;
  code: string;
  title: {
    ru: string;
    en: string;
    pl: string;
  };
  subtitle: {
    ru: string;
    en: string;
    pl: string;
  };
  badge: {
    ru: string;
    en: string;
    pl: string;
  };
  accentHex: string;
  svgInner: string;
}

export const SMART_FOOD_ICONS: SmartFoodIconVariant[] = [
  {
    id: 1,
    code: 'emerald-leaf-spark',
    title: {
      ru: '1. Изумрудный лист и ИИ-искра',
      en: '1. Emerald Leaf & AI Spark',
      pl: '1. Szmaragdowy Liść i Iskra AI',
    },
    subtitle: {
      ru: 'Органический лист, переходящий в силуэт вилки со светящейся звездой искусственного интеллекта',
      en: 'Organic leaf seamlessly merging with a fork silhouette and glowing AI intelligence spark',
      pl: 'Organiczny liść przechodzący w sylwetkę widelca ze świecącą gwiazdą sztucznej inteligencji',
    },
    badge: {
      ru: 'Универсальная классика',
      en: 'Universal Flagship',
      pl: 'Uniwersalna klasyka',
    },
    accentHex: '#10b981',
    svgInner: `
      <defs>
        <linearGradient id="bg1" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#062019"/>
          <stop offset="50%" stop-color="#0b1528"/>
          <stop offset="100%" stop-color="#030712"/>
        </linearGradient>
        <linearGradient id="leaf1" x1="120" y1="400" x2="380" y2="110" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#059669"/>
          <stop offset="55%" stop-color="#10b981"/>
          <stop offset="100%" stop-color="#6ee7b7"/>
        </linearGradient>
        <linearGradient id="spark1" x1="300" y1="90" x2="430" y2="220" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#fde047"/>
          <stop offset="50%" stop-color="#38bdf8"/>
          <stop offset="100%" stop-color="#10b981"/>
        </linearGradient>
        <radialGradient id="glow1" cx="50%" cy="45%" r="48%">
          <stop offset="0%" stop-color="#10b981" stop-opacity="0.35"/>
          <stop offset="100%" stop-color="#10b981" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="512" height="512" rx="116" fill="url(#bg1)"/>
      <rect x="8" y="8" width="496" height="496" rx="108" fill="none" stroke="#10b981" stroke-opacity="0.28" stroke-width="4"/>
      <circle cx="256" cy="240" r="210" fill="url(#glow1)"/>
      <!-- Organic Leaf Body -->
      <path d="M136 376 C126 240, 210 132, 368 124 C362 276, 268 370, 136 376 Z" fill="url(#leaf1)"/>
      <!-- Leaf Vein + Fork Prongs Negative Space -->
      <path d="M132 380 C196 316, 258 252, 336 156" stroke="#062019" stroke-width="14" stroke-linecap="round" fill="none"/>
      <!-- Minimalist Fork Tines integrated at center-left -->
      <path d="M188 188 L188 264 M218 172 L218 264 M248 188 L248 264" stroke="#ecfdf5" stroke-width="12" stroke-linecap="round"/>
      <path d="M188 260 C188 292, 248 292, 248 260" stroke="#ecfdf5" stroke-width="12" stroke-linecap="round" fill="none"/>
      <path d="M218 286 L218 396" stroke="#ecfdf5" stroke-width="14" stroke-linecap="round"/>
      <!-- AI 4-Point Spark -->
      <path d="M372 84 Q372 148 436 148 Q372 148 372 212 Q372 148 308 148 Q372 148 372 84 Z" fill="url(#spark1)"/>
      <circle cx="372" cy="148" r="10" fill="#ffffff"/>
      <circle cx="312" cy="98" r="7" fill="#38bdf8"/>
    `,
  },
  {
    id: 2,
    code: 'smart-bowl-rings',
    title: {
      ru: '2. Умная чаша и кольца БЖУ',
      en: '2. Smart Bowl & Macro Rings',
      pl: '2. Inteligentna Misa i Pierścienie BWT',
    },
    subtitle: {
      ru: 'Чаша здорового питания в окружении трёх светящихся колец баланса белков, жиров и углеводов',
      en: 'Healthy bowl surrounded by three glowing macro rings for proteins, fats, and carbs',
      pl: 'Misa zdrowego żywienia otoczona trzema świecącymi pierścieniami białek, tłuszczów i węglowodanów',
    },
    badge: {
      ru: 'Фитнес и баланс',
      en: 'Fitness & Balance',
      pl: 'Fitness i bilans',
    },
    accentHex: '#38bdf8',
    svgInner: `
      <defs>
        <linearGradient id="bg2" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#0f172a"/>
          <stop offset="100%" stop-color="#020617"/>
        </linearGradient>
        <linearGradient id="ringProt" x1="80" y1="80" x2="432" y2="432" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#34d399"/>
          <stop offset="100%" stop-color="#059669"/>
        </linearGradient>
        <linearGradient id="ringCarb" x1="80" y1="432" x2="432" y2="80" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#38bdf8"/>
          <stop offset="100%" stop-color="#6366f1"/>
        </linearGradient>
        <linearGradient id="ringFat" x1="120" y1="120" x2="392" y2="392" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#fbbf24"/>
          <stop offset="100%" stop-color="#f97316"/>
        </linearGradient>
        <linearGradient id="bowl2" x1="156" y1="240" x2="356" y2="360" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#f8fafc"/>
          <stop offset="100%" stop-color="#94a3b8"/>
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="116" fill="url(#bg2)"/>
      <!-- 3 Glowing Macro Rings -->
      <circle cx="256" cy="256" r="196" fill="none" stroke="#1e293b" stroke-width="18"/>
      <circle cx="256" cy="256" r="196" fill="none" stroke="url(#ringProt)" stroke-width="18" stroke-dasharray="920 1240" stroke-linecap="round" transform="rotate(-90 256 256)"/>
      <circle cx="256" cy="256" r="166" fill="none" stroke="#1e293b" stroke-width="16"/>
      <circle cx="256" cy="256" r="166" fill="none" stroke="url(#ringCarb)" stroke-width="16" stroke-dasharray="740 1050" stroke-linecap="round" transform="rotate(-45 256 256)"/>
      <circle cx="256" cy="256" r="138" fill="none" stroke="#1e293b" stroke-width="14"/>
      <circle cx="256" cy="256" r="138" fill="none" stroke="url(#ringFat)" stroke-width="14" stroke-dasharray="560 900" stroke-linecap="round" transform="rotate(15 256 256)"/>
      <!-- Fresh leaves peeking above bowl -->
      <path d="M210 245 C195 195, 235 165, 256 215 C277 165, 317 195, 302 245 Z" fill="#10b981"/>
      <circle cx="256" cy="172" r="10" fill="#fde047"/>
      <!-- Ceramic Smart Bowl -->
      <path d="M156 252 H356 C356 322, 312 362, 256 362 C200 362, 156 322, 156 252 Z" fill="url(#bowl2)"/>
      <rect x="212" y="366" width="88" height="14" rx="7" fill="#64748b"/>
      <!-- AI Pulse Line on Bowl -->
      <path d="M192 298 H228 L242 272 L262 324 L278 290 L290 298 H320" fill="none" stroke="#059669" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>
    `,
  },
  {
    id: 3,
    code: 'neural-apple-core',
    title: {
      ru: '3. Нейро-яблоко и интеллект',
      en: '3. Neural Apple & Smart Core',
      pl: '3. Neuro-Jabłko i Rdzeń AI',
    },
    subtitle: {
      ru: 'Левая половина — сочное зелёное яблоко, правая — светящаяся нейросеть умного расчёта нутриентов',
      en: 'Left half is a crisp green apple, right half is a glowing neural circuit for nutrition analysis',
      pl: 'Lewa połowa to soczyste zielone jabłko, prawa to świecąca sieć neuronowa analizy żywienia',
    },
    badge: {
      ru: 'ИИ-нутрициология',
      en: 'AI Nutrition Science',
      pl: 'AI Dietetyka',
    },
    accentHex: '#14b8a6',
    svgInner: `
      <defs>
        <linearGradient id="bg3" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#042f2e"/>
          <stop offset="50%" stop-color="#0f172a"/>
          <stop offset="100%" stop-color="#090d16"/>
        </linearGradient>
        <linearGradient id="appleLeft" x1="110" y1="150" x2="256" y2="410" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#4ade80"/>
          <stop offset="100%" stop-color="#059669"/>
        </linearGradient>
        <linearGradient id="appleRight" x1="256" y1="150" x2="400" y2="410" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#22d3ee"/>
          <stop offset="100%" stop-color="#0284c7"/>
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="116" fill="url(#bg3)"/>
      <!-- Left Organic Apple Half -->
      <path d="M256 168 C215 140, 128 158, 128 258 C128 352, 196 416, 246 412 C252 411, 256 408, 256 408 Z" fill="url(#appleLeft)"/>
      <!-- Right Neural Circuit Apple Half -->
      <path d="M256 168 C297 140, 384 158, 384 258 C384 352, 316 416, 266 412 C260 411, 256 408, 256 408 Z" fill="#0f172a" stroke="url(#appleRight)" stroke-width="10"/>
      <!-- Top Leaf & Stem -->
      <path d="M256 162 C256 126, 274 102, 286 94" stroke="#a7f3d0" stroke-width="12" stroke-linecap="round" fill="none"/>
      <path d="M262 134 C288 94, 344 96, 348 134 C316 158, 280 152, 262 134 Z" fill="#34d399"/>
      <!-- Neural Nodes on Right Half -->
      <path d="M256 210 L316 210 L342 246 M256 268 L332 268 L354 304 M256 330 L308 330 L328 366 M316 210 L308 330" stroke="#38bdf8" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <circle cx="316" cy="210" r="11" fill="#22d3ee"/>
      <circle cx="342" cy="246" r="10" fill="#fde047"/>
      <circle cx="332" cy="268" r="11" fill="#38bdf8"/>
      <circle cx="354" cy="304" r="9" fill="#34d399"/>
      <circle cx="308" cy="330" r="11" fill="#22d3ee"/>
      <circle cx="328" cy="366" r="10" fill="#fde047"/>
      <!-- Center Spine Divider -->
      <line x1="256" y1="164" x2="256" y2="414" stroke="#ecfeff" stroke-width="6" stroke-dasharray="12 8"/>
    `,
  },
  {
    id: 4,
    code: 'ai-chef-star',
    title: {
      ru: '4. Умный шеф-ассистент и звезда',
      en: '4. Smart AI Chef & Star',
      pl: '4. Inteligentny Szef Kuchni AI',
    },
    subtitle: {
      ru: 'Колпак шеф-повара со звездой ИИ и листком зелени — идеально для конструктора рецептов и готовки',
      en: 'Modern chef toque with an AI star and fresh leaf — ideal for smart recipes and cooking physics',
      pl: 'Czapka szefa kuchni z gwiazdą AI i liściem — idealna dla kreatora przepisów i gotowania',
    },
    badge: {
      ru: 'Кулинария и рецепты',
      en: 'Cooking & Recipes',
      pl: 'Kuchnia i przepisy',
    },
    accentHex: '#8b5cf6',
    svgInner: `
      <defs>
        <linearGradient id="bg4" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#1e1b4b"/>
          <stop offset="55%" stop-color="#0f172a"/>
          <stop offset="100%" stop-color="#064e3b"/>
        </linearGradient>
        <linearGradient id="hat4" x1="140" y1="110" x2="372" y2="390" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="100%" stop-color="#cbd5e1"/>
        </linearGradient>
        <linearGradient id="star4" x1="200" y1="190" x2="312" y2="300" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#10b981"/>
          <stop offset="50%" stop-color="#38bdf8"/>
          <stop offset="100%" stop-color="#8b5cf6"/>
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="116" fill="url(#bg4)"/>
      <circle cx="256" cy="256" r="196" fill="none" stroke="#38bdf8" stroke-opacity="0.2" stroke-width="4"/>
      <!-- Chef Hat Cloud Crown -->
      <path d="M162 276 C118 268, 108 194, 158 176 C168 122, 232 104, 256 130 C280 104, 344 122, 354 176 C404 194, 394 268, 350 276 L338 372 C338 388, 322 398, 304 398 H208 C190 398, 174 388, 174 372 Z" fill="url(#hat4)"/>
      <!-- Hat Band -->
      <rect x="172" y="334" width="168" height="28" rx="10" fill="#0f172a"/>
      <rect x="172" y="344" width="168" height="8" fill="#10b981"/>
      <!-- Center AI Star on Chef Hat -->
      <path d="M256 168 Q256 232 320 232 Q256 232 256 296 Q256 232 192 232 Q256 232 256 168 Z" fill="url(#star4)"/>
      <!-- Fresh Green Leaf Badge on Hat Corner -->
      <path d="M332 140 C368 112, 412 126, 402 172 C372 192, 342 176, 332 140 Z" fill="#10b981"/>
    `,
  },
  {
    id: 5,
    code: 'smart-avocado-pulse',
    title: {
      ru: '5. Смарт-авокадо и пульс здоровья',
      en: '5. Smart Avocado & Health Pulse',
      pl: '5. Smart Awokado i Puls Zdrowia',
    },
    subtitle: {
      ru: 'Спелое авокадо со светящимся ИИ-ядром вместо косточки и импульсом жизненной энергии',
      en: 'Fresh halved avocado featuring a glowing cyan-emerald AI orb core and vitality pulse',
      pl: 'Świeże awokado ze świecącym rdzeniem AI zamiast pestki i impulsem energii',
    },
    badge: {
      ru: 'Яркая и современная',
      en: 'Vibrant & Friendly',
      pl: 'Nowoczesna i żywa',
    },
    accentHex: '#84cc16',
    svgInner: `
      <defs>
        <linearGradient id="bg5" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#142615"/>
          <stop offset="100%" stop-color="#090d16"/>
        </linearGradient>
        <linearGradient id="avoOuter" x1="140" y1="90" x2="372" y2="430" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#15803d"/>
          <stop offset="100%" stop-color="#064e3b"/>
        </linearGradient>
        <linearGradient id="avoFlesh" x1="160" y1="110" x2="352" y2="400" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#d9f99d"/>
          <stop offset="60%" stop-color="#84cc16"/>
          <stop offset="100%" stop-color="#22c55e"/>
        </linearGradient>
        <radialGradient id="avoCore" cx="50%" cy="45%" r="50%">
          <stop offset="0%" stop-color="#38bdf8"/>
          <stop offset="55%" stop-color="#0284c7"/>
          <stop offset="100%" stop-color="#1e1b4b"/>
        </radialGradient>
      </defs>
      <rect width="512" height="512" rx="116" fill="url(#bg5)"/>
      <!-- Avocado Rind -->
      <path d="M256 84 C312 84, 344 148, 366 232 C392 332, 346 428, 256 428 C166 428, 120 332, 146 232 C168 148, 200 84, 256 84 Z" fill="url(#avoOuter)"/>
      <!-- Avocado Creamy Green Flesh -->
      <path d="M256 106 C302 106, 328 160, 346 234 C368 318, 330 404, 256 404 C182 404, 144 318, 166 234 C184 160, 210 106, 256 106 Z" fill="url(#avoFlesh)"/>
      <!-- Glowing Smart AI Core Pit -->
      <circle cx="256" cy="298" r="68" fill="url(#avoCore)" stroke="#ecfccb" stroke-width="6"/>
      <!-- Pulse wave inside core -->
      <path d="M204 298 H230 L244 268 L264 328 L278 288 L288 298 H308" fill="none" stroke="#7dd3fc" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
      <!-- Top AI Spark -->
      <path d="M256 132 Q256 162 286 162 Q256 162 256 192 Q256 162 226 162 Q256 162 256 132 Z" fill="#064e3b"/>
    `,
  },
  {
    id: 6,
    code: 'golden-fork-leaf-s',
    title: {
      ru: '6. Золотая монограмма «S» (Smart Food)',
      en: '6. Golden «S» Fork & Leaf Monogram',
      pl: '6. Złoty Monogram «S» (Smart Food)',
    },
    subtitle: {
      ru: 'Элегантный изгиб буквы «S» из золотой вилки и живого изумрудного листа на чёрном обсидиане',
      en: 'Luxury «S» monogram formed by an intertwined golden fork and emerald leaf on obsidian',
      pl: 'Elegancki monogram «S» utworzony ze złotego widelca i szmaragdowego liścia na obsydianie',
    },
    badge: {
      ru: 'Премиум минимализм',
      en: 'Luxury Minimalist',
      pl: 'Premium minimalizm',
    },
    accentHex: '#f59e0b',
    svgInner: `
      <defs>
        <linearGradient id="bg6" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#18181b"/>
          <stop offset="100%" stop-color="#09090b"/>
        </linearGradient>
        <linearGradient id="gold6" x1="130" y1="90" x2="380" y2="420" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#fde68a"/>
          <stop offset="50%" stop-color="#f59e0b"/>
          <stop offset="100%" stop-color="#b45309"/>
        </linearGradient>
        <linearGradient id="em6" x1="140" y1="380" x2="370" y2="130" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#059669"/>
          <stop offset="100%" stop-color="#34d399"/>
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="116" fill="url(#bg6)"/>
      <rect x="14" y="14" width="484" height="484" rx="104" fill="none" stroke="url(#gold6)" stroke-opacity="0.35" stroke-width="4"/>
      <!-- S-Curve Golden Ribbon + Fork Crown -->
      <path d="M332 132 C240 92, 152 152, 186 226 C214 284, 344 274, 336 356 C328 420, 224 432, 168 384" fill="none" stroke="url(#gold6)" stroke-width="34" stroke-linecap="round"/>
      <!-- Fork Tines at Top Right of S -->
      <path d="M318 96 L354 132 M334 80 L370 116 M350 64 L386 100" stroke="#fde68a" stroke-width="10" stroke-linecap="round"/>
      <!-- Emerald Leaf Intertwined in Lower S Curve -->
      <path d="M142 356 C132 268, 212 222, 304 236 C288 326, 224 374, 142 356 Z" fill="url(#em6)" opacity="0.92"/>
      <path d="M152 348 C196 312, 240 278, 290 244" stroke="#064e3b" stroke-width="8" stroke-linecap="round" fill="none"/>
      <circle cx="364" cy="188" r="10" fill="#fde68a"/>
    `,
  },
  {
    id: 7,
    code: 'macro-radar-plate',
    title: {
      ru: '7. Умная тарелка-компас (Macro Radar)',
      en: '7. Smart Plate Macro Compass',
      pl: '7. Inteligentny Talerz-Kompas',
    },
    subtitle: {
      ru: 'Вид сверху на тарелку с неоновыми секторами нутриентов и стрелкой умного навигатора питания',
      en: 'Top-down smart plate divided into glowing macro sectors with a nutrition compass needle',
      pl: 'Widok z góry na talerz podzielony na świecące sektory makroskładników z igłą kompasu',
    },
    badge: {
      ru: 'Аналитика и точность',
      en: 'Data & Precision',
      pl: 'Analityka i precyzja',
    },
    accentHex: '#06b6d4',
    svgInner: `
      <defs>
        <linearGradient id="bg7" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#091526"/>
          <stop offset="100%" stop-color="#020617"/>
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="116" fill="url(#bg7)"/>
      <!-- Outer Plate Rim -->
      <circle cx="256" cy="256" r="188" fill="#0f172a" stroke="#334155" stroke-width="12"/>
      <!-- 3 Macro Sectors -->
      <!-- Protein Sector (Emerald) -->
      <path d="M256 244 L256 96 A148 148 0 0 1 388 322 Z" fill="#10b981" fill-opacity="0.88"/>
      <!-- Carbs Sector (Sky Blue) -->
      <path d="M244 252 L378 334 A148 148 0 0 1 124 334 Z" fill="#0ea5e9" fill-opacity="0.88"/>
      <!-- Fats Sector (Amber/Coral) -->
      <path d="M246 244 L118 320 A148 148 0 0 1 244 96 Z" fill="#f59e0b" fill-opacity="0.88"/>
      <!-- Inner Dark Hub -->
      <circle cx="256" cy="256" r="64" fill="#091526" stroke="#e2e8f0" stroke-width="6"/>
      <!-- Compass / Smart Dial Needle -->
      <polygon points="256,144 278,256 256,238 234,256" fill="#ffffff"/>
      <polygon points="256,368 274,256 256,274 238,256" fill="#38bdf8"/>
      <circle cx="256" cy="256" r="14" fill="#10b981"/>
    `,
  },
  {
    id: 8,
    code: 'friendly-food-bot',
    title: {
      ru: '8. Дружелюбный бот-нутрициолог',
      en: '8. Friendly AI Nutrition Bot',
      pl: '8. Przyjazny Bot Dietetyk AI',
    },
    subtitle: {
      ru: 'Персональный ИИ-помощник со светящимся экраном-визором и свежим зелёным ростком на макушке',
      en: 'Charming personal AI assistant with a glowing cyan visor and a fresh green sprout on top',
      pl: 'Osobisty asystent AI ze świecącym wizjerem i świeżym zielonym kiełkiem na czubku głowy',
    },
    badge: {
      ru: 'Умный помощник',
      en: 'Smart Companion',
      pl: 'Inteligentny asystent',
    },
    accentHex: '#22d3ee',
    svgInner: `
      <defs>
        <linearGradient id="bg8" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#0f172a"/>
          <stop offset="100%" stop-color="#042f2e"/>
        </linearGradient>
        <linearGradient id="botHead" x1="120" y1="150" x2="392" y2="410" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#f8fafc"/>
          <stop offset="100%" stop-color="#cbd5e1"/>
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="116" fill="url(#bg8)"/>
      <!-- Sprout Stem & Two Leaves on Bot Head -->
      <path d="M256 168 L256 112" stroke="#10b981" stroke-width="14" stroke-linecap="round"/>
      <path d="M256 122 C256 82, 318 72, 328 112 C298 138, 268 132, 256 122 Z" fill="#34d399"/>
      <path d="M256 130 C256 94, 198 86, 188 122 C214 144, 244 140, 256 130 Z" fill="#059669"/>
      <!-- Side Ear Pods -->
      <rect x="92" y="246" width="32" height="84" rx="16" fill="#10b981"/>
      <rect x="388" y="246" width="32" height="84" rx="16" fill="#10b981"/>
      <!-- Bot Head Squircle -->
      <rect x="116" y="168" width="280" height="236" rx="76" fill="url(#botHead)" stroke="#94a3b8" stroke-width="6"/>
      <!-- Dark Glass Visor -->
      <rect x="148" y="210" width="216" height="122" rx="44" fill="#091526" stroke="#22d3ee" stroke-width="6"/>
      <!-- Glowing Happy Eyes -->
      <path d="M188 268 C196 248, 220 248, 228 268" stroke="#22d3ee" stroke-width="14" stroke-linecap="round" fill="none"/>
      <path d="M284 268 C292 248, 316 248, 324 268" stroke="#22d3ee" stroke-width="14" stroke-linecap="round" fill="none"/>
      <!-- Friendly Smile -->
      <path d="M230 298 Q256 318 282 298" stroke="#34d399" stroke-width="10" stroke-linecap="round" fill="none"/>
    `,
  },
  {
    id: 9,
    code: 'culinary-flame-leaf',
    title: {
      ru: '9. Кулинарный огонь и свежесть',
      en: '9. Culinary Flame & Fresh Leaf',
      pl: '9. Kulinarny Ogień i Świeżość',
    },
    subtitle: {
      ru: 'Баланс тёплого огня готовки (конфорка/рецепты) и изумрудного листа с каплей воды (нутриенты)',
      en: 'Harmony of warm cooking flame (stove physics) and emerald nutrition leaf with water droplet',
      pl: 'Harmonia ciepłego płomienia gotowania oraz szmaragdowego liścia i kropli wody',
    },
    badge: {
      ru: 'Готовка + Вода + КБЖУ',
      en: 'Cooking + Water + Macros',
      pl: 'Gotowanie + Woda + BWT',
    },
    accentHex: '#f97316',
    svgInner: `
      <defs>
        <linearGradient id="bg9" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#1c1917"/>
          <stop offset="50%" stop-color="#0f172a"/>
          <stop offset="100%" stop-color="#062019"/>
        </linearGradient>
        <linearGradient id="flame9" x1="130" y1="390" x2="260" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#ea580c"/>
          <stop offset="55%" stop-color="#f97316"/>
          <stop offset="100%" stop-color="#fde047"/>
        </linearGradient>
        <linearGradient id="leaf9" x1="250" y1="400" x2="390" y2="130" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#0284c7"/>
          <stop offset="45%" stop-color="#10b981"/>
          <stop offset="100%" stop-color="#6ee7b7"/>
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="116" fill="url(#bg9)"/>
      <circle cx="256" cy="256" r="194" fill="none" stroke="#334155" stroke-width="5"/>
      <!-- Left Warm Cooking Flame -->
      <path d="M244 406 C152 396, 108 312, 142 224 C164 166, 218 134, 236 96 C252 146, 224 196, 248 238 C266 270, 260 342, 244 406 Z" fill="url(#flame9)"/>
      <!-- Right Emerald Leaf & Water Drop -->
      <path d="M268 406 C360 396, 404 312, 370 224 C348 166, 304 134, 280 112 C266 172, 292 222, 268 272 C252 308, 256 356, 268 406 Z" fill="url(#leaf9)"/>
      <!-- Inner Water Drop at bottom center -->
      <path d="M256 266 C256 266, 294 318, 294 348 C294 370, 277 386, 256 386 C235 386, 218 370, 218 348 C218 318, 256 266, 256 266 Z" fill="#38bdf8"/>
    `,
  },
  {
    id: 10,
    code: 'cyber-neon-badge',
    title: {
      ru: '10. Неоновый контур: Вилка и Лист',
      en: '10. Cyber-Organic Neon Line Badge',
      pl: '10. Neonowy Kontur: Widelec i Liść',
    },
    subtitle: {
      ru: 'Единая светящаяся неоновая линия на тёмном матовом стекле — максимальная чёткость в любом размере',
      en: 'Single continuous glowing neon line on frosted dark glass — razor-sharp at any icon size',
      pl: 'Pojedyncza świecąca linia neonowa na ciemnym matowym szkle — maksymalna ostrość',
    },
    badge: {
      ru: 'Неон и чёткость',
      en: 'High-Contrast Neon',
      pl: 'Neon i ostrość',
    },
    accentHex: '#34d399',
    svgInner: `
      <defs>
        <linearGradient id="bg10" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#020617"/>
          <stop offset="100%" stop-color="#091e1a"/>
        </linearGradient>
        <linearGradient id="neon10" x1="100" y1="412" x2="412" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#22d3ee"/>
          <stop offset="50%" stop-color="#34d399"/>
          <stop offset="100%" stop-color="#a3e635"/>
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="116" fill="url(#bg10)"/>
      <rect x="28" y="28" width="456" height="456" rx="96" fill="#0f172a" fill-opacity="0.6" stroke="url(#neon10)" stroke-width="6"/>
      <!-- Continuous Neon Line forming Leaf + Fork + Spark -->
      <path d="M148 384 C118 264, 184 136, 364 128 C364 288, 256 368, 148 384 Z" fill="none" stroke="url(#neon10)" stroke-width="18" stroke-linejoin="round"/>
      <path d="M196 196 V268 C196 296, 256 296, 256 268 V196 M226 184 V364" fill="none" stroke="#ecfeff" stroke-width="14" stroke-linecap="round"/>
      <circle cx="364" cy="128" r="18" fill="#a3e635"/>
      <circle cx="148" cy="384" r="14" fill="#22d3ee"/>
    `,
  },
];

export const APP_ICON_STORAGE_KEY = 'sfa_selected_icon_id_v1';

export function getFullSvgMarkup(variant: SmartFoodIconVariant): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">${variant.svgInner}</svg>`;
}

export function getSvgDataUrl(variant: SmartFoodIconVariant): string {
  const svg = getFullSvgMarkup(variant);
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Keeps browser favicon, apple-touch-icon, and document title aligned with the
 * official icons located in /public.
 */
export function applyAppIconToDocument(_iconId: number, langCode: string = 'ru'): void {
  if (typeof document === 'undefined') return;

  let svgLink = document.querySelector("link[rel='icon'][type='image/svg+xml']") as HTMLLinkElement | null;
  if (!svgLink) {
    svgLink = document.createElement('link');
    svgLink.rel = 'icon';
    svgLink.type = 'image/svg+xml';
    document.head.appendChild(svgLink);
  }
  svgLink.href = '/icon.svg';

  let appleLink = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement | null;
  if (!appleLink) {
    appleLink = document.createElement('link');
    appleLink.rel = 'apple-touch-icon';
    document.head.appendChild(appleLink);
  }
  appleLink.href = '/apple-touch-icon.png';

  let icoLink = document.querySelector("link[rel='icon']:not([type='image/svg+xml'])") as HTMLLinkElement | null;
  if (!icoLink) {
    icoLink = document.createElement('link');
    icoLink.rel = 'icon';
    document.head.appendChild(icoLink);
  }
  icoLink.href = '/favicon.ico';

  // Update document title to Smart Food Assistance
  if (langCode === 'ru') {
    document.title = 'Smart Food Assistance — Умный ассистент питания';
  } else if (langCode === 'pl') {
    document.title = 'Smart Food Assistance — Inteligentny Asystent Żywienia';
  } else {
    document.title = 'Smart Food Assistance — Smart Nutrition Assistant';
  }
}

export function downloadIconAsPng(variant: SmartFoodIconVariant): void {
  const svgDataUrl = getSvgDataUrl(variant);
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(img, 0, 0, 512, 512);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `smart-food-assistance-icon-${variant.id}-${variant.code}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 'image/png');
  };
  img.src = svgDataUrl;
}

export function downloadIconAsSvg(variant: SmartFoodIconVariant): void {
  const svg = getFullSvgMarkup(variant);
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `smart-food-assistance-icon-${variant.id}-${variant.code}.svg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

interface AppIconSvgPreviewProps {
  variant: SmartFoodIconVariant;
  className?: string;
}

export const AppIconSvgPreview: React.FC<AppIconSvgPreviewProps> = ({
  variant,
  className = 'w-16 h-16',
}) => {
  return (
    <svg
      viewBox="0 0 512 512"
      className={`${className} select-none shrink-0 rounded-[22%] shadow-lg`}
      dangerouslySetInnerHTML={{ __html: variant.svgInner }}
    />
  );
};

interface AppIconStudioProps {
  selectedIconId: number;
  onSelectIcon: (iconId: number) => void;
  langCode?: string;
  themeStyles: ThemeStyles;
  borderRadius?: any;
  accentColor: string;
  isModal?: boolean;
  onCloseModal?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const AppIconStudio: React.FC<AppIconStudioProps> = ({
  selectedIconId,
  onSelectIcon,
  langCode = 'ru',
  themeStyles,
  borderRadius = 'rounded',
  accentColor,
  isModal = false,
  onCloseModal,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const [previewDevice, setPreviewDevice] = useState<'phone' | 'desktop'>('phone');
  const lang: 'ru' | 'en' | 'pl' =
    langCode === 'en' ? 'en' : langCode === 'pl' ? 'pl' : 'ru';
  const radiusClass = getBorderRadiusClass(borderRadius);

  const activeVariant =
    SMART_FOOD_ICONS.find((i) => i.id === selectedIconId) || SMART_FOOD_ICONS[0];

  useEffect(() => {
    applyAppIconToDocument(selectedIconId, lang);
  }, [selectedIconId, lang]);

  const ui = {
    ru: {
      sectionTitle: 'Иконка и бренд «Smart Food Assistance» (10 вариантов)',
      sectionSub:
        'Выберите любую из 10 иконок для рабочего стола смартфона или компьютера (Умный ассистент питания)',
      activeBadge: `Выбран вариант #${activeVariant.id}`,
      brandHeading: 'Smart Food Assistance',
      brandTranslation: 'Умный ассистент питания',
      previewPhoneBtn: 'Экран смартфона',
      previewDesktopBtn: 'Рабочий стол ПК',
      phoneCaption: 'Предпросмотр на главном экране iOS / Android',
      desktopCaption: 'Предпросмотр в панели задач macOS / Windows',
      choosePrompt: 'Нажмите на любую из 10 иконок ниже, чтобы примерить и установить её:',
      selectedBtn: 'Установлена',
      selectBtn: 'Выбрать иконку',
      downloadPng: 'Скачать PNG 512px',
      downloadSvg: 'SVG',
      doneClose: 'Готово — применить выбранную иконку',
    },
    en: {
      sectionTitle: 'App Icon & Brand «Smart Food Assistance» (10 Variants)',
      sectionSub:
        'Pick any of the 10 custom icons for your smartphone homescreen or computer desktop',
      activeBadge: `Selected #${activeVariant.id}`,
      brandHeading: 'Smart Food Assistance',
      brandTranslation: 'Smart Nutrition & Cooking Assistant',
      previewPhoneBtn: 'Smartphone Screen',
      previewDesktopBtn: 'Computer Desktop',
      phoneCaption: 'Live preview on iOS / Android Homescreen',
      desktopCaption: 'Live preview on macOS Dock / Windows Taskbar',
      choosePrompt: 'Tap any of the 10 icons below to preview and set it as your app icon:',
      selectedBtn: 'Active Icon',
      selectBtn: 'Select Icon',
      downloadPng: 'Download PNG 512px',
      downloadSvg: 'SVG',
      doneClose: 'Done — Apply Selected Icon',
    },
    pl: {
      sectionTitle: 'Ikona i marka «Smart Food Assistance» (10 wariantów)',
      sectionSub:
        'Wybierz jedną z 10 ikon na ekran główny smartfona lub pulpit komputera (Inteligentny Asystent Żywienia)',
      activeBadge: `Wybrano wariant #${activeVariant.id}`,
      brandHeading: 'Smart Food Assistance',
      brandTranslation: 'Inteligentny Asystent Żywienia',
      previewPhoneBtn: 'Ekran smartfona',
      previewDesktopBtn: 'Pulpit komputera',
      phoneCaption: 'Podgląd na ekranie głównym iOS / Android',
      desktopCaption: 'Podgląd w pasku zadań macOS / Windows',
      choosePrompt: 'Kliknij dowolną z 10 ikon poniżej, aby ją przetestować i ustawić:',
      selectedBtn: 'Aktywna ikona',
      selectBtn: 'Wybierz ikonę',
      downloadPng: 'Pobierz PNG 512px',
      downloadSvg: 'SVG',
      doneClose: 'Gotowe — zastosuj wybraną ikonę',
    },
  }[lang];

  const studioBody = (
    <div className="space-y-5">
      {/* Top Brand + Live Device Mockup Preview */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0">
            <AppIconSvgPreview variant={activeVariant} className="w-16 h-16 sm:w-20 sm:h-20" />
            <div className="min-w-0">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold mb-1">
                <Sparkles className="w-3 h-3 shrink-0" />
                <span>{ui.activeBadge}</span>
              </div>
              <h3 className="text-base sm:text-lg font-extrabold text-white leading-tight break-words">
                {ui.brandHeading}
              </h3>
              <p className="text-xs sm:text-sm text-emerald-400 font-medium leading-snug">
                {ui.brandTranslation}
              </p>
              <p className="text-xs text-slate-400 mt-0.5 leading-snug">
                {activeVariant.title[lang]}
              </p>
            </div>
          </div>

          {/* Device Toggle: Smartphone vs Desktop */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800">
            <button
              type="button"
              onClick={() => setPreviewDevice('phone')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                previewDevice === 'phone'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>{ui.previewPhoneBtn}</span>
            </button>
            <button
              type="button"
              onClick={() => setPreviewDevice('desktop')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                previewDevice === 'desktop'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>{ui.previewDesktopBtn}</span>
            </button>
          </div>
        </div>

        {/* Live Mockup Box */}
        {previewDevice === 'phone' ? (
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/50 border border-slate-800/90 flex flex-col items-center">
            <span className="text-[11px] text-slate-400 mb-3 font-medium">
              {ui.phoneCaption}
            </span>
            <div className="grid grid-cols-4 gap-4 sm:gap-6 items-start justify-items-center py-2 px-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 shadow-inner">
              {/* Mock Calendar App */}
              <div className="flex flex-col items-center gap-1.5 opacity-55">
                <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-[22%] bg-slate-800 border border-slate-700 flex flex-col items-center justify-center">
                  <span className="text-[9px] font-bold text-rose-400 uppercase">OCT</span>
                  <span className="text-base font-extrabold text-white leading-none">18</span>
                </div>
                <span className="text-[10px] text-slate-400">Calendar</span>
              </div>

              {/* ACTIVE SMART FOOD ASSISTANCE ICON */}
              <div className="flex flex-col items-center gap-1.5 scale-105">
                <div className="relative">
                  <AppIconSvgPreview
                    variant={activeVariant}
                    className="w-14 h-14 sm:w-15 sm:h-15 ring-2 ring-emerald-400/80 shadow-xl"
                  />
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-extrabold flex items-center justify-center shadow">
                    {activeVariant.id}
                  </span>
                </div>
                <span className="text-[10px] sm:text-[11px] font-bold text-white text-center leading-tight max-w-[76px] truncate">
                  Smart Food
                </span>
              </div>

              {/* Mock Notes App */}
              <div className="flex flex-col items-center gap-1.5 opacity-55">
                <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-[22%] bg-slate-800 border border-slate-700 flex items-center justify-center text-lg">
                  📝
                </div>
                <span className="text-[10px] text-slate-400">Notes</span>
              </div>

              {/* Mock Fitness App */}
              <div className="flex flex-col items-center gap-1.5 opacity-55">
                <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-[22%] bg-slate-800 border border-slate-700 flex items-center justify-center text-lg">
                  🏃
                </div>
                <span className="text-[10px] text-slate-400">Health</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 border border-slate-800/90 flex flex-col items-center">
            <span className="text-[11px] text-slate-400 mb-3 font-medium">
              {ui.desktopCaption}
            </span>
            {/* Floating Tooltip above Dock */}
            <div className="mb-2 px-3 py-1 rounded-lg bg-slate-800/95 border border-slate-700 text-xs font-bold text-white shadow-lg">
              Smart Food Assistance — {ui.brandTranslation}
            </div>
            {/* Desktop Dock Bar */}
            <div className="flex items-center gap-3 sm:gap-4 px-5 py-2.5 rounded-2xl bg-slate-950/85 border border-slate-800 shadow-2xl">
              <div className="w-11 h-11 rounded-xl bg-slate-800/80 flex items-center justify-center text-base opacity-60">
                🌐
              </div>
              <div className="w-11 h-11 rounded-xl bg-slate-800/80 flex items-center justify-center text-base opacity-60">
                📁
              </div>
              <div className="relative flex flex-col items-center -translate-y-1">
                <AppIconSvgPreview
                  variant={activeVariant}
                  className="w-13 h-13 ring-2 ring-emerald-400 shadow-xl"
                />
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1" />
              </div>
              <div className="w-11 h-11 rounded-xl bg-slate-800/80 flex items-center justify-center text-base opacity-60">
                ⚙️
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Prompt Label */}
      <div className="flex items-center justify-between gap-2 px-1">
        <p className="text-xs sm:text-sm font-semibold text-slate-300">
          {ui.choosePrompt}
        </p>
      </div>

      {/* 10 Icons Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {SMART_FOOD_ICONS.map((variant) => {
          const isSelected = variant.id === selectedIconId;
          return (
            <div
              key={variant.id}
              onClick={() => onSelectIcon(variant.id)}
              className={`group cursor-pointer p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                isSelected
                  ? 'bg-emerald-950/35 border-emerald-500/80 ring-1 ring-emerald-500/40 shadow-lg'
                  : 'bg-slate-900/65 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className="relative shrink-0">
                  <AppIconSvgPreview
                    variant={variant}
                    className="w-16 h-16 sm:w-18 sm:h-18 transition-transform group-hover:scale-105"
                  />
                  {isSelected && (
                    <span className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow-md">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      className="px-2 py-0.5 rounded-md text-[10px] font-bold border"
                      style={{
                        backgroundColor: `${variant.accentHex}18`,
                        borderColor: `${variant.accentHex}45`,
                        color: variant.accentHex,
                      }}
                    >
                      {variant.badge[lang]}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-100 leading-snug break-words">
                    {variant.title[lang]}
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed break-words">
                    {variant.subtitle[lang]}
                  </p>
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectIcon(variant.id);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    isSelected
                      ? 'bg-emerald-500 text-slate-950 shadow-xs'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isSelected ? ui.selectedBtn : ui.selectBtn}</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadIconAsPng(variant);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold border border-slate-700/80 transition"
                    title={ui.downloadPng}
                  >
                    <Download className="w-3 h-3 text-emerald-400" />
                    <span>PNG</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadIconAsSvg(variant);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold border border-slate-700/80 transition"
                    title={ui.downloadSvg}
                  >
                    <Download className="w-3 h-3 text-sky-400" />
                    <span>SVG</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {isModal && onCloseModal && (
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onCloseModal}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-sm text-white shadow-lg transition hover:opacity-95"
            style={{ backgroundColor: accentColor }}
          >
            {ui.doneClose}
          </button>
        </div>
      )}
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
        <div
          className={`w-full max-w-4xl max-h-[92vh] flex flex-col border ${themeStyles.borderColor} ${themeStyles.cardBg} ${radiusClass} shadow-2xl overflow-hidden`}
        >
          {/* Modal Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-900/90">
            <div className="flex items-center gap-3 min-w-0">
              <AppIconSvgPreview variant={activeVariant} className="w-10 h-10" />
              <div className="min-w-0">
                <h2 className="text-sm sm:text-base font-bold text-white leading-snug break-words">
                  {ui.sectionTitle}
                </h2>
                <p className="text-xs text-slate-400 leading-snug break-words">
                  {ui.sectionSub}
                </p>
              </div>
            </div>
            {onCloseModal && (
              <button
                type="button"
                onClick={onCloseModal}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Modal Scrollable Body */}
          <div className="p-4 overflow-y-auto flex-1">{studioBody}</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`border ${themeStyles.borderColor} ${themeStyles.cardBg} ${radiusClass} p-4 shadow-sm transition-all ${
        isCollapsed ? 'space-y-0' : 'space-y-4'
      }`}
    >
      <div
        onClick={onToggleCollapse}
        className="flex items-start justify-between gap-3 cursor-pointer select-none"
      >
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <AppIconSvgPreview variant={activeVariant} className="w-9 h-9 mt-0.5" />
          <div className="min-w-0 flex-1">
            <h4 className="text-sm sm:text-base font-bold leading-snug break-words">
              {ui.sectionTitle}
            </h4>
            <p className={`text-xs ${themeStyles.textMuted} mt-0.5 leading-relaxed break-words`}>
              {ui.sectionSub}
            </p>
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                {ui.activeBadge}: {activeVariant.title[lang]}
              </span>
            </div>
          </div>
        </div>
        {onToggleCollapse && (
          <button
            type="button"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition shrink-0 mt-0.5"
          >
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${
                isCollapsed ? '-rotate-90' : 'rotate-0'
              }`}
            />
          </button>
        )}
      </div>

      {!isCollapsed && (
        <div className="pt-2 border-t border-slate-800/80 animate-in fade-in duration-200">
          {studioBody}
        </div>
      )}
    </div>
  );
};
