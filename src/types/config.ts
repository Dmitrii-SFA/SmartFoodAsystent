export type MetricCategory = 'energy' | 'macro' | 'fiber' | 'vitamin' | 'mineral' | 'hydration' | 'custom';

export interface MetricConfig {
  id: string; // e.g. 'calories', 'proteins', 'fats', 'carbs', 'fiber', 'vitaminC'
  label: string; // e.g. 'Калории', 'Белки'
  shortLabel?: string; // e.g. 'К', 'Б', 'Ж', 'У'
  unit: string; // 'ккал', 'г', 'мг', 'мкг', 'мл'
  target: number; // daily target value
  color: string; // e.g. '#f59e0b', '#ef4444', '#3b82f6', '#10b981'
  isMainMacro?: boolean; // prominent in top hero summary
  showInSummary: boolean; // shown in top summary cards
  showInDetailList: boolean; // shown in detailed metric grid
  showInFoodForm: boolean; // shown as input field in Add Food dialog
  showInProducts?: boolean; // shown on food library product cards and product details
  category: MetricCategory;
  icon?: string; // e.g. 'Flame', 'Beef', 'Droplet', 'Wheat', 'Apple', 'Pill', 'Sparkles', 'Shield'
  isProtected?: boolean; // protected base nutrient (cannot be deleted)
  isPrimary?: boolean; // primary metric (large font, thick bar) vs secondary (narrow bar, compact font)
}

export interface MealCategoryConfig {
  id: string; // 'breakfast', 'lunch', 'dinner', 'snack'
  name: string; // 'Завтрак', 'Обед', 'Ужин', 'Перекус'
  icon: string; // icon identifier
  targetCaloriesPercent?: number; // target share of daily calories (e.g. 25%)
  isProtected?: boolean; // protected base meal category (cannot be deleted or mutated by AI)
  time?: string; // optional time in 'HH:mm' format (empty/undefined by default)
  reminderEnabled?: boolean; // whether audio reminder on phone/PC is enabled for this meal
}

export type SoundMelodyId =
  | 'music_marimba'
  | 'music_waltz'
  | 'music_zen'
  | 'beep_classic'
  | 'beep_rapid'
  | 'beep_soft'
  | 'gong_strike'
  | 'spoon_pot';

export interface SoundSettingsConfig {
  cookingSoundId: SoundMelodyId;
  mealSoundId: SoundMelodyId;
  volume: number; // 0 to 1
  vibrate: boolean;
}

export type ThemeMode = 'dark' | 'light' | 'emerald' | 'sunset' | 'cyberpunk' | 'nord';

export interface ThemeConfig {
  mode: ThemeMode;
  accentColor: string; // hex color for buttons/accents, e.g. '#10b981'
  borderRadius: 'rounded-xl' | 'rounded-2xl' | 'rounded-3xl' | 'rounded-none';
  cardGlassEffect: boolean;
  density: 'compact' | 'comfortable' | 'spacious';
  fontScale: 'sm' | 'base' | 'lg';
  nutrientDisplayMode?: 'compact' | 'circles'; // 'compact' single-line rows or 'circles' circular gauge with macro rings
}

export interface SectionVisibilityConfig {
  heroSummary: boolean;
  macroRings: boolean;
  micronutrientsGrid: boolean;
  mealTimeline: boolean;
  quickStatsBar: boolean;
  aiChatWidget: boolean;
  jsonConfigPreview: boolean;
}

export interface LocalizationLabels {
  appTitle: string;
  todaySummary: string;
  dailyGoal: string;
  consumed: string;
  remaining: string;
  addFood: string;
  foodName: string;
  amountGrams: string;
  selectMeal: string;
  cancel: string;
  save: string;
  delete: string;
  chatTitle: string;
  chatPlaceholder: string;
  chatSend: string;
  applyChanges: string;
  revertChanges: string;
  configTitle: string;
  installApp: string;
  offlineMode: string;
  onlineMode: string;
  resetToDefault: string;
  exportConfig: string;
  importConfig: string;

  // Navigation tabs
  tabDailyMenu?: string;
  tabFoodLibrary?: string;
  tabFoodLibraryShort?: string;
  tabRecipes?: string;
  tabShoppingList?: string;
  tabShoppingListShort?: string;
  tabSettings?: string;

  // Day swipe header
  todayBadge?: string;
  swipeHint?: string;
  prevDay?: string;
  nextDay?: string;
  returnToToday?: string;

  // Daily target / compact nutrients list
  dailyNutrientNorm?: string;
  visibleOnScreen?: string;
  nutrientsTitle?: string;
  quickNutrientSettings?: string;

  // Meal timeline
  dailyMenuTitle?: string;
  addMealCategory?: string;
  noFoodsLogged?: string;

  // Food library
  searchFoodPlaceholder?: string;
  byAiName?: string;
  photoLabel?: string;
  photoDish?: string;
  manualAdd?: string;
  totalInLibrary?: string;
  productsUnit?: string;
  logToDiary?: string;
  quickLogHint?: string;
  nutrientDisplay?: string;

  // Recipes
  searchRecipesPlaceholder?: string;
  createRecipe?: string;
  savedRecipesCount?: string;
  recipeHint?: string;
  perServing?: string;
  servingsUnit?: string;
  totalUnit?: string;

  // Settings
  settingsSectionsTitle?: string;
  expandAll?: string;
  collapseAll?: string;
  openCountOfTotal?: string;
  secAiProvider?: string;
  secAiProviderSub?: string;
  secLanguage?: string;
  secLanguageSub?: string;
  secDailyNorm?: string;
  secDailyNormSub?: string;
  secMealCategories?: string;
  secMealCategoriesSub?: string;
  secNutrients?: string;
  secNutrientsSub?: string;
  secNutrientMode?: string;
  secNutrientModeSub?: string;
  secTheme?: string;
  secThemeSub?: string;
  secDataReset?: string;
  secDataResetSub?: string;
}

export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  flag?: string;
  isProtected?: boolean;
  labels: LocalizationLabels;
}

export interface LocalizationConfig {
  code: string;
  labels: LocalizationLabels;
}

export type NutritionGoalMode = 'lose' | 'maintain' | 'gain';

export interface UserConfig {
  version: number;
  userName: string;
  language: LocalizationConfig;
  installedLanguages: LanguageOption[];
  theme: ThemeConfig;
  metrics: MetricConfig[];
  mealCategories: MealCategoryConfig[];
  sections: SectionVisibilityConfig;
  soundSettings?: SoundSettingsConfig;
  goalMode?: NutritionGoalMode;
}

export interface LoggedFoodItem {
  id: string;
  mealCategoryId: string;
  name: string;
  amountGrams: number;
  timestamp: number;
  nutrients: Record<string, number>; // keyed by metric.id
}

export type FoodItem = LoggedFoodItem;


export interface DayLog {
  date: string; // 'YYYY-MM-DD'
  waterMl?: number;
  items: LoggedFoodItem[];
  customDayCategories?: MealCategoryConfig[]; // single-day meal categories specific only to this day
}

export interface PersonProfile {
  id: string;
  name: string;
  logs: Record<string, DayLog>;
  metrics: MetricConfig[];
  mealCategories: MealCategoryConfig[];
  goalMode?: NutritionGoalMode;
}


export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  configDiffSummary?: string;
  proposedConfig?: UserConfig;
  suggestedMeals?: Array<{
    mealCategoryId: string;
    name: string;
    amountGrams: number;
    nutrients: Record<string, number>;
  }>;
  isLimitReached?: boolean;
  action?: 'open_api_key_modal';
}

export type AIProvider = 'gemini' | 'openai' | 'openrouter' | 'custom';

export interface AIConfig {
  provider: AIProvider;
  apiKey: string;
  baseURL?: string;
  model?: string;
}

export type AppTab = 'diary' | 'library' | 'recipes' | 'shopping' | 'settings';

export interface ShoppingListItem {
  id: string;
  foodId?: string;
  name: string;
  quantity: string; // free-form quantity string (e.g., '500 г', '2 шт', '1 кг', '2 бутылки', or '3')
  addedAt: number;
}

export interface LibraryFoodItem {
  id: string;
  name: string;
  brand?: string;
  servingSizeGrams: number; // reference portion, usually 100g
  nutrients: Record<string, number>; // per servingSizeGrams
  category?: string; // 'protein' | 'grain' | 'dairy' | 'vegetable' | 'fruit' | 'snack' | 'drink' | 'custom'
  createdAt: number;
  source?: 'manual' | 'ai_name' | 'photo_label' | 'photo_dish' | 'preset';
  photoUrl?: string;
}

export type CookwareType = 'pot' | 'pan' | 'oven' | 'saucepan' | 'steamer' | 'grill' | 'custom';
export type HeatSource =
  | 'electric'
  | 'gas'
  | 'oven'
  | 'steamer'
  | 'grill'
  | 'airfryer'
  | 'multicooker'
  | 'pressure'
  | 'sousvide'
  | 'deepfryer'
  | 'microwave'
  | 'wok'
  | 'smoker'
  | 'bainmarie'
  | 'toaster';
export type GasLevel = 'simmer' | 'low' | 'medium' | 'high' | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | number;
export type OvenMode = 'top_bottom' | 'convection' | 'grill' | 'turbo_grill' | 'bottom_only';

export interface CookingStepItem {
  id: string;
  foodId: string;
  foodName: string;
  grams: number;
  addedAtMinute: number; // relative minute within this vessel (e.g. 0, 90, 110)
  durationMinutes: number; // base cooking duration for this step
  cumulativeDurationMinutes?: number; // automatically calculated accumulated cooking time in this vessel
  isExtracted?: boolean; // if removed from vessel (e.g. pulled meat from broth)
  extractedAtMinute?: number;
  sourceVesselId?: string; // if this item represents transferring the cooked contents of another vessel into this step
  isRegimeOnly?: boolean; // if true, this step only changes/continues cooking regime/lid without adding new ingredients
  hasThermalProcessing?: boolean; // if false, ingredients are mixed/prepared in this step without heat; if true, thermal processing is applied
  notes?: string;
  // Per-step cooking regime & lid settings
  stepHeatSource?: HeatSource;
  stepElectricLevel?: number;
  stepGasLevel?: GasLevel;
  stepOvenTempC?: number;
  stepOvenMode?: OvenMode;
  stepExtraMode?: string; // program/power for multicooker, microwave, pressure cooker, smoker, etc.
  stepHasLid?: boolean;
}

export interface VesselTransfer {
  targetVesselId: string;
  atMinute: number;
  additionalCookingMinutes: number;
}

export interface CookwareVessel {
  id: string;
  name: string; // user-entered name, empty by default
  icon?: string; // user-selected icon (e.g. '🍲', '🍳', '🥘', '♨️')
  type: CookwareType;
  heatSource: HeatSource;
  electricLevel?: number; // 1 to 9
  gasLevel?: GasLevel; // simmer, low, medium, high
  ovenTempC?: number; // 30 to 350
  ovenMode?: OvenMode;
  hasLid?: boolean; // whether the cookware is covered with a lid by default
  waterAddedMl: number;
  startOffsetMinutes?: number; // 0 for first vessel; recipe minute when 2nd/3rd vessel starts cooking (e.g. 90)
  stepItems: CookingStepItem[];
  transfer?: VesselTransfer;
}

export interface CookingProcessConfig {
  isEnabled: boolean;
  vessels: CookwareVessel[];
  rawWeightGrams: number;
  evaporatedWaterMl: number;
  weightDeltaGrams: number;
  finalDishWeightGrams: number;
  aiAnalysis?: {
    note: string;
    nutrientImpact?: string;
    chefTips?: string;
    analyzedAt?: number;
  };
}

export interface RecipeIngredient {
  foodId: string;
  foodName: string;
  grams: number;
  nutrientsPer100g: Record<string, number>;
}

export interface RecipeItem {
  id: string;
  name: string;
  servings?: number;
  totalGrams: number; // final cooked weight (or raw if simple)
  rawGrams?: number; // initial raw ingredients weight
  ingredients: RecipeIngredient[];
  totalNutrients: Record<string, number>; // calculated for the whole dish
  nutrientsPer100g?: Record<string, number>; // calculated per 100g of finished dish
  nutrientsPerServing?: Record<string, number>; // legacy fallback
  instructions?: string;
  createdAt: number;
  isDetailedCooking?: boolean;
  cookingProcess?: CookingProcessConfig;
}


