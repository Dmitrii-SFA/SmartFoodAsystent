import { LocalizationLabels } from '../types/config';

export interface ExtendedLocalizationLabels extends LocalizationLabels {
  // Navigation tabs
  tabDailyMenu: string;
  tabFoodLibrary: string;
  tabFoodLibraryShort: string;
  tabRecipes: string;
  tabShoppingList: string;
  tabShoppingListShort: string;
  tabSettings: string;

  // Water product name in 3 languages
  waterProductName: string;

  // Units
  unitKcal: string;
  unitGram: string;
  unitMg: string;
  unitMcg: string;
  unitMl: string;
  unitProtShort: string;
  unitFatShort: string;
  unitCarbShort: string;

  // Day swipe header
  todayBadge: string;
  swipeHint: string;
  prevDay: string;
  nextDay: string;
  returnToToday: string;

  // Daily target / compact nutrients list
  dailyNutrientNorm: string;
  visibleOnScreen: string;
  nutrientsTitle: string;
  quickNutrientSettings: string;
  gearModalTitle: string;
  gearModalSubtitle: string;
  searchNutrientPlaceholder: string;
  baseNutrientBadge: string;
  primaryBadge: string;
  secondaryBadge: string;
  aiAddNutrientBtn: string;
  allSettingsBtn: string;
  doneBtn: string;
  moveUp: string;
  moveDown: string;

  // Meal timeline
  dailyMenuTitle: string;
  addMealCategory: string;
  noFoodsLogged: string;
  targetLabel: string;
  addToShoppingListTitle: string;
  addProductToMealTitle: string;
  deleteMealCategoryTitle: string;

  // Food library
  searchFoodPlaceholder: string;
  byAiName: string;
  photoLabel: string;
  photoDish: string;
  manualAdd: string;
  totalInLibrary: string;
  productsUnit: string;
  logToDiary: string;
  quickLogHint: string;
  nutrientDisplay: string;
  per100gLabel: string;
  addNewProductBtn: string;
  addingProductForMealBanner: string;
  deleteFromLibraryTitle: string;
  sourcePhotoLabel: string;
  sourcePhotoDish: string;
  sourceBase: string;

  // Recipes & Share Modal
  searchRecipesPlaceholder: string;
  createRecipe: string;
  exportImportBtn: string;
  savedRecipesCount: string;
  recipeHint: string;
  perServing: string;
  servingsUnit: string;
  totalUnit: string;
  per100gFinishedDish: string;
  dishYieldLabel: string;
  finishedDishLabel: string;
  rawLabel: string;
  ingredientsTitle: string;
  cookingTimelineTitle: string;
  startCookingTimerBtn: string;
  vesselsShortUnit: string;
  editRecipeTitle: string;
  addBtn: string;

  // Shopping List
  shoppingItemsToBuy: string;
  hidePanelBtn: string;
  selectFromLibraryLabel: string;
  selectFromLibraryPlaceholder: string;
  quantityInputLabel: string;
  quantityInputPlaceholder: string;
  addToListBtn: string;
  shoppingEmptyTitle: string;
  shoppingEmptyDesc: string;
  colProduct: string;
  colHowMuchToBuy: string;
  colDelete: string;

  // Settings
  settingsSectionsTitle: string;
  expandAll: string;
  collapseAll: string;
  openCountOfTotal: string;
  secAiProvider: string;
  secAiProviderSub: string;
  secLanguage: string;
  secLanguageSub: string;
  secDailyNorm: string;
  secDailyNormSub: string;
  secMealCategories: string;
  secMealCategoriesSub: string;
  secNutrients: string;
  secNutrientsSub: string;
  secNutrientMode: string;
  secNutrientModeSub: string;
  secTheme: string;
  secThemeSub: string;
  secDataReset: string;
  secDataResetSub: string;
  activeProviderLabel: string;
  configureAiBtn: string;
  connectApiKeyBtn: string;
  openAssistantChatBtn: string;
  availableLanguagesLabel: string;
  tapToSwitchHint: string;
  compactBarsLabel: string;
  compactBarsDesc: string;
  circularRingLabel: string;
  circularRingDesc: string;
  openConfigJsonBtn: string;
  restoreProgramBtn: string;
  restoreOriginal: string;

  // Short unit & action aliases used across components
  kcalShort: string;
  gramsShort: string;
  mlShort: string;
  protShort: string;
  fatShort: string;
  carbShort: string;
  add: string;
  reset: string;

  // Extended DaySwipeHeader keys
  today: string;
  yesterday: string;
  tomorrow: string;
  selectDate: string;
  calendar: string;
  daysHistoryTitle: string;
  listLabel: string;
  itemsForDay: string;
  backToToday: string;
  swipeOrButtonsHint: string;
  dailyGoalReachedPct: string;
  noLoggedDays: string;
  itemsCountShort: string;

  // Extended CompactNutrientsList keys
  moveToSecondary: string;
  makePrimary: string;
  exceededBy: string;
  remainingLabel: string;
  dailySummaryTitle: string;
  primaryShort: string;
  secondaryShort: string;
  exceededNorm: string;
  allNutrientsInNorm: string;
  addNutrient: string;
  quickAddNutrientTitle: string;
  clickNutrientToAdd: string;
  allPresetsEnabledHint: string;
  createOwnNutrient: string;
  allNutrientsSettingsLink: string;
  nutrientNamePlaceholder: string;
  dailyNormPlaceholder: string;
  showInPrimaryBlock: string;
  secondaryNutrientsLabel: string;
  starHintMakePrimary: string;
  hideSecondaryNutrients: string;
  showSecondaryNutrients: string;

  // Extended ReorderableMealTimeline keys
  mealsTimelineTitle: string;
  dragMealHint: string;
  newMealCategoryTitle: string;
  mealCategoryNameLabel: string;
  mealCategoryNamePlaceholder: string;
  calorieSharePct: string;
  createButton: string;
  iconLabel: string;
  deleteMealConfirmTitle: string;
  deleteMealConfirmMsg: string;
  deleteFoodFromDiaryTitle: string;
  deleteFoodFromDiaryMsg: string;
  ofNormShort: string;
  noEntries: string;
  addToShoppingList: string;

  // Extended FoodLibraryTab keys
  perGrams: string;
  addProductCardTitle: string;
  addProductCardSub: string;
  addNewProductToLibraryBtn: string;
  saveToLibraryBtn: string;
  addToDiaryTitle: string;
  mealCategorySelectLabel: string;
  portionWeightGramsLabel: string;
  totalCaloriesPreview: string;
  logToDiaryBtn: string;
  deleteProductConfirmTitle: string;
  deleteProductConfirmMsg: string;

  // Extended RecipesTab keys
  shareRecipesAndMenu: string;
  vesselsCountShort: string;
  finishedDish: string;
  dishYield: string;
  editRecipe: string;
  newRecipe: string;
  per100gFinished: string;
  ingredientsLabel: string;
  cookingTimeline: string;
  evaporatedLabel: string;
  timeLabel: string;
  yieldShortLabel: string;
  startAtLabel: string;
  stepLabel: string;
  cookingContentsInVessel: string;
  aiAnalysisLabel: string;
  cookButton: string;
  editButton: string;
  toDiaryButton: string;
  modeWithAi: string;
  modeStepByStep: string;
  modeSimpleList: string;
  aiRecipeHeading: string;
  aiRecipeDescription: string;
  dishNamePromptLabel: string;
  dishNamePromptPlaceholder: string;
  generatingSteps: string;
  generateStepsWithAi: string;
  recipeNameLabel: string;
  recipeIngredientsTitle: string;
  removeFromRecipe: string;
  selectIngredientFromLibrary: string;
  searchLibraryPlaceholder: string;
  addedIngredientsAndWeight: string;
  noIngredientsSelected: string;
  saveChangesButton: string;
  saveRecipeButton: string;
  deleteRecipeConfirmTitle: string;
  deleteRecipeConfirmMsg: string;

  // Extended ShoppingListTab keys
  shoppingListTitle: string;
  shoppingListSubtitle: string;
  shoppingListEmptyTitle: string;
  shoppingListEmptyHint: string;
  addFromLibraryBtn: string;
  shoppingQuantityPlaceholder: string;
  selectProductForShoppingTitle: string;
  selectProductForShoppingHint: string;
  nothingFoundInLibrary: string;
  selectedBadge: string;
  selectBadge: string;
  productLabel: string;
  howMuchToBuyLabel: string;
  addToListButton: string;

  // Extended Language & Settings keys
  addLanguageBtn: string;
  selectLanguageHeader: string;
  aboutAppBtn: string;
  secBalanceTitle: string;
  infoBtn: string;
  topUpEnterKeyBtn: string;
  secSoundSettings: string;
  secSoundSettingsSub: string;
  secExportImport: string;
  secExportImportSub: string;
  secFeedback: string;
  secFeedbackSub: string;

  // Toast notifications & popups
  toastUpdatedPrefix: string;
  toastProfileAdded: string;
  toastProfileDeleted: string;
  toastAddedToShoppingList: string;
  toastProgramRestored: string;
  toastKeyActivationFailed: string;
  toastMasterKeyActivated: string;
  toastKeyActivatedCarryover: string;
  toastKeyPackageActivated: string;
  toastKeyActivatedRemaining: string;
  toastPreviousSettingsRestored: string;
  toastPortionWeightChanged: string;
  toastMealsAddedFromChat: string;
  toastCustomMealAddedForDay: string;
  toastCustomMealDeleted: string;
  toastMealDeletedFromSchedule: string;
  toastNutrientOrderUpdated: string;
  toastNutrientShownOnMain: string;
  toastNutrientHiddenFromMain: string;
  toastNutrientMovedToPrimary: string;
  toastNutrientMovedToSecondary: string;
  toastNewNutrientAdded: string;
  toastDailyMenuCopied: string;
  toastNutrientSettingsUpdated: string;
  toastProductUpdatedInLibrary: string;
  toastProductAddedToLibrary: string;
  toastFoodLoggedToDiary: string;
  toastRecipeChangesSaved: string;
  toastRecipeSaved: string;
  toastRecipeCopied: string;
  toastCircularViewEnabled: string;
  toastCompactBarsEnabled: string;
  toastDailyNormUpdated: string;
  toastGoalModeSwitched: string;
  goalModeLose: string;
  goalModeGain: string;
  goalModeMaintain: string;
  toastMealsOrderUpdated: string;
  toastResetToDefaults: string;
  toastNutrientVisibilityUpdated: string;
  toastNutrientPriorityUpdated: string;
  toastNutrientParamsUpdated: string;
  toastNutrientDeleted: string;
  toastMealParamsUpdated: string;
  toastMealTimeReminderUpdated: string;

  // Person & Profile popups
  addPersonTitle: string;
  personNamePlaceholder: string;
  deletePersonTitle: string;

  // FoodLibrary Add/Edit Product & Nutrient Visibility Modals
  editProductModalTitle: string;
  addProductModalTitle: string;
  editProductModalSub: string;
  addProductAiNameSub: string;
  addProductPhotoLabelSub: string;
  addProductPhotoDishSub: string;
  addProductManualSub: string;
  foodNameMandatoryLabel: string;
  mandatoryBadge: string;
  foodNameInputPlaceholder: string;
  photoLabelHeading: string;
  photoDishHeading: string;
  replacePhotoBtn: string;
  chooseFileCameraBtn: string;
  geminiAnalyzingPhoto: string;
  recognizeWithGeminiBtn: string;
  aiCalculatingNutrients: string;
  calculateMacrosByNameBtn: string;
  defaultPortionWeightLabel: string;
  coreNutrientsTitle: string;
  mandatoryPluralBadge: string;
  additionalNutrientsTitle: string;
  filledCountBadge: string;
  availableCountBadge: string;
  collapseBtn: string;
  expandBtn: string;
  vitaminsAndMineralsTitle: string;
  inFormCountSuffix: string;
  addNutrientToProductTitle: string;
  selectFromExistingNutrients: string;
  nutrientNotFoundQuestion: string;
  createNewNutrientBtn: string;
  creatingNewNutrientTitle: string;
  backToSelectionBtn: string;
  nutrientNameRequiredLabel: string;
  unitLabel: string;
  colorLabel: string;
  createAndAttachBtn: string;
  removeNutrientFromProductTitle: string;
  noAdditionalNutrientsSelected: string;
  errEnterNutrientName: string;
  errEnterFoodNameForAi: string;
  errFailedToCalculateNutrients: string;
  errEnterFoodNameForPhoto: string;
  errUploadPhotoFirst: string;
  errPhotoRecognitionFailed: string;
  errFoodNameRequiredToSave: string;
  nutrientCardsModalTitle: string;
  nutrientCardsModalSub: string;
  nutrientCardsRow1Title: string;
  nutrientCardsRow1Desc: string;
  nutrientCardsRow2Title: string;
  nutrientCardsRow2Desc: string;
  alwaysInRow1Badge: string;
  showBtn: string;
  hideBtn: string;

  // ResetConfirmModal & ConfigJsonModal
  resetModalTitle: string;
  resetModalSubtitle: string;
  resetModalWhatRestored: string;
  resetModalItem1: string;
  resetModalItem2: string;
  resetModalItem3: string;
  resetModalItem4: string;
  resetModalItem5: string;
  resetModalClearLogsLabel: string;
  resetModalClearLogsHint: string;
  resetModalConfirmBtn: string;
  copiedBadge: string;
  copyBtn: string;
  closeBtn: string;

  // Recipes & Cooking Timer Modal
  errEnterDishNameForAi: string;
  aiChefRecipeReadyBanner: string;
  errGenerateRecipeFailed: string;
  shareRecipeBtnTitle: string;
  timerPrepareByMinute: string;
  timerTestSoundTitle: string;
  timerStepCompleted: string;
  timerNextBtn: string;
  timerFinishBtn: string;
  timerPauseBtn: string;
  timerResumeBtn: string;
  timerStartBtn: string;
  timerResetStepTitle: string;
  errAllModelsOverloaded: string;
}

export const COMPLETE_RUSSIAN_LABELS: ExtendedLocalizationLabels = {
  appTitle: 'Smart Food Assistance — Умный ассистент питания',
  todaySummary: 'Сводка за день',
  dailyGoal: 'Цель на день',
  consumed: 'Употреблено',
  remaining: 'Осталось',
  addFood: 'Добавить блюдо',
  foodName: 'Название продукта или блюда',
  amountGrams: 'Вес порции (граммы)',
  selectMeal: 'Прием пищи',
  cancel: 'Отмена',
  save: 'Сохранить',
  delete: 'Удалить',
  chatTitle: 'Gemini Flash AI Ассистент',
  chatPlaceholder: 'Попросите Gemini изменить цели, тему, добавить витамины или записать еду...',
  chatSend: 'Отправить',
  applyChanges: 'Применить настройки',
  revertChanges: 'Отменить',
  configTitle: 'userConfig.json (Data-Driven UI)',
  installApp: 'Установить PWA',
  offlineMode: 'Офлайн режим — данные сохранены локально',
  onlineMode: 'Подключено к сети',
  resetToDefault: 'Сбросить к умолчанию',
  exportConfig: 'Экспорт JSON',
  importConfig: 'Импорт JSON',

  // Navigation tabs
  tabDailyMenu: 'Дневное меню',
  tabFoodLibrary: 'Список продуктов',
  tabFoodLibraryShort: 'Продукты',
  tabRecipes: 'Рецепты',
  tabShoppingList: 'Список покупок',
  tabShoppingListShort: 'Покупки',
  tabSettings: 'Настройки',

  // Water product name
  waterProductName: 'Вода',

  // Units
  unitKcal: 'ккал',
  unitGram: 'г',
  unitMg: 'мг',
  unitMcg: 'мкг',
  unitMl: 'мл',
  unitProtShort: 'Б',
  unitFatShort: 'Ж',
  unitCarbShort: 'У',

  // Day swipe header
  todayBadge: 'Сегодня',
  swipeHint: 'Переключайте стрелками или свайпом влево/вправо',
  prevDay: 'Предыдущий день',
  nextDay: 'Следующий день',
  returnToToday: 'Вернуться к сегодняшнему дню',

  // Daily target / compact nutrients list
  dailyNutrientNorm: 'Дневная норма нутриентов',
  visibleOnScreen: 'на экране',
  nutrientsTitle: 'Нутриенты',
  quickNutrientSettings: 'Быстрая настройка выведенных нутриентов',
  gearModalTitle: 'Настройка нутриентов на главном экране',
  gearModalSubtitle: 'Включайте/скрывайте нутриенты и задавайте им статус: Основной или Второстепенный',
  searchNutrientPlaceholder: 'Поиск нутриента (сахар, клетчатка, железо, цинк, калий...)',
  baseNutrientBadge: '(базовый)',
  primaryBadge: 'Основной',
  secondaryBadge: 'Второстепенный',
  aiAddNutrientBtn: '+ ИИ добавить',
  allSettingsBtn: 'Все настройки',
  doneBtn: 'Готово',
  moveUp: 'Выше',
  moveDown: 'Ниже',

  // Meal timeline
  dailyMenuTitle: 'Дневное меню',
  addMealCategory: 'Добавить приём пищи',
  noFoodsLogged: 'Нет добавленных блюд',
  targetLabel: 'Цель:',
  addToShoppingListTitle: 'Добавить в список покупок',
  addProductToMealTitle: 'Добавить продукт в приём пищи',
  deleteMealCategoryTitle: 'Удалить приём пищи',

  // Food library
  searchFoodPlaceholder: 'Поиск по библиотеке продуктов...',
  byAiName: 'По названию (ИИ)',
  photoLabel: 'Фото этикетки',
  photoDish: 'Фото тарелки',
  manualAdd: 'Вручную',
  totalInLibrary: 'Всего в вашей библиотеке:',
  productsUnit: 'продуктов',
  logToDiary: 'В дневник',
  quickLogHint: 'Нажмите «В дневник» для быстрой записи',
  nutrientDisplay: 'Отображение нутриентов',
  per100gLabel: 'на',
  addNewProductBtn: 'Добавить новый продукт в библиотеку',
  addingProductForMealBanner: 'Добавление продукта для приёма пищи:',
  deleteFromLibraryTitle: 'Удалить из библиотеки',
  sourcePhotoLabel: '📷 с этикетки',
  sourcePhotoDish: '🍽️ с фото',
  sourceBase: '⚡ база',

  // Recipes
  searchRecipesPlaceholder: 'Поиск по рецептам...',
  createRecipe: 'Создать рецепт',
  exportImportBtn: 'Экспорт / Импорт',
  savedRecipesCount: 'Сохраненных рецептов:',
  recipeHint: 'Рассчитывает КБЖУ на 100 г из ингредиентов библиотеки',
  perServing: 'КБЖУ на 1 порцию:',
  servingsUnit: 'порц.',
  totalUnit: 'всего',
  per100gFinishedDish: 'На 100 г готового блюда',
  dishYieldLabel: 'Выход блюда:',
  finishedDishLabel: 'Готовое блюдо',
  rawLabel: 'сырое',
  ingredientsTitle: 'Ингредиенты:',
  cookingTimelineTitle: 'Таймлайн готовки',
  startCookingTimerBtn: 'Таймер готовки',
  vesselsShortUnit: 'посуд.',
  editRecipeTitle: 'Изменить рецепт',
  addBtn: 'Добавить',

  // Shopping List
  shoppingItemsToBuy: 'Позиций к покупке:',
  hidePanelBtn: 'Скрыть панель',
  selectFromLibraryLabel: 'Продукт из вашей библиотеки продуктов:',
  selectFromLibraryPlaceholder: 'Начните вводить или выберите продукт из списка...',
  quantityInputLabel: 'Количество (г, шт, кг, бут...):',
  quantityInputPlaceholder: 'Например: 500 г, 2 шт, 1 кг...',
  addToListBtn: 'В список',
  shoppingEmptyTitle: 'Список покупок пока пуст',
  shoppingEmptyDesc: 'Нажмите кнопку «Добавить» выше, чтобы выбрать продукт из библиотеки, либо нажимайте на иконку корзины рядом с продуктами в Дневном меню и Рецептах.',
  colProduct: 'Продукт',
  colHowMuchToBuy: 'Сколько купить (число / вес / шт)',
  colDelete: 'Удалить',

  // Settings
  settingsSectionsTitle: 'Разделы настроек',
  expandAll: 'Развернуть все',
  collapseAll: 'Свернуть все',
  openCountOfTotal: 'открыто из',
  secAiProvider: 'ИИ-провайдер и нейросети',
  secAiProviderSub: 'Настройка провайдера (Gemini, OpenAI, OpenRouter), ключей, модели и baseURL',
  secLanguage: 'Язык интерфейса',
  secLanguageSub: 'Выбор языка (Русский, English, Polski) и локализация',
  secDailyNorm: 'Суточная норма',
  secDailyNormSub: 'Ручной ввод калорий, БЖУ и воды или расчёт с помощью ИИ',
  secMealCategories: 'Приёмы пищи и целевые % калорий',
  secMealCategoriesSub: 'Завтрак, обед, перекус, ужин — порядок, цвета и % нормы',
  secNutrients: 'Управление нутриентами и целями',
  secNutrientsSub: 'Настройка целей, единиц, цветов, порядка и отображения',
  secNutrientMode: 'Режим отображения нутриентов',
  secNutrientModeSub: 'Компактный строчный список или круговые кольца макронутриентов',
  secTheme: 'Тема оформления и дизайн',
  secThemeSub: 'Тёмная, светлая, изумрудная, закат, киберпанк, скандинавская и скругления',
  secDataReset: 'Управление данными и резервное копирование',
  secDataResetSub: 'Экспорт и импорт JSON-файла настроек, полный сброс к умолчанию',
  activeProviderLabel: 'Активный провайдер:',
  configureAiBtn: 'Настроить ИИ (Gemini, OpenAI, OpenRouter)',
  connectApiKeyBtn: 'Подключить свой API-ключ ИИ',
  openAssistantChatBtn: 'Открыть чат с ассистентом',
  availableLanguagesLabel: 'Доступные языки',
  tapToSwitchHint: 'нажмите для переключения',
  compactBarsLabel: 'Компактные полосы',
  compactBarsDesc: 'Каждый нутриент в отдельную строчку с прогресс-баром и процентами',
  circularRingLabel: 'Круговой вид',
  circularRingDesc: 'Калории в большом кольце со шкалами белков, жиров и углеводов',
  openConfigJsonBtn: 'Открыть userConfig.json',
  restoreProgramBtn: 'Восстановить первоначальную программу',
  restoreOriginal: 'Восстановить первоначальную программу',

  // Short unit & action aliases
  kcalShort: 'ккал',
  gramsShort: 'г',
  mlShort: 'мл',
  protShort: 'Б',
  fatShort: 'Ж',
  carbShort: 'У',
  add: 'Добавить',
  reset: 'Сброс',

  // Extended DaySwipeHeader keys
  today: 'Сегодня',
  yesterday: 'Вчера',
  tomorrow: 'Завтра',
  selectDate: 'Выбрать дату',
  calendar: 'Календарь',
  daysHistoryTitle: 'История дней',
  listLabel: 'Список',
  itemsForDay: 'блюд за день',
  backToToday: 'Вернуться на сегодня',
  swipeOrButtonsHint: 'Свайп влево/вправо или кнопки для смены дня',
  dailyGoalReachedPct: 'Выполнение цели дня:',
  noLoggedDays: 'Пока нет сохранённых записей в дневнике.',
  itemsCountShort: 'поз.',

  // Extended CompactNutrientsList keys
  moveToSecondary: 'Перенести во второстепенные',
  makePrimary: 'Сделать основным',
  exceededBy: 'Превышено на',
  remainingLabel: 'Осталось:',
  dailySummaryTitle: 'Сводка за день',
  primaryShort: 'осн.',
  secondaryShort: 'втор.',
  exceededNorm: 'Превышена норма:',
  allNutrientsInNorm: 'Все нутриенты в пределах дневной нормы',
  addNutrient: 'Нутриент',
  quickAddNutrientTitle: 'Быстрое добавление нутриента на экран',
  clickNutrientToAdd: 'Нажмите на нутриент, чтобы вывести его в сводку:',
  allPresetsEnabledHint: 'Все стандартные нутриенты уже включены!',
  createOwnNutrient: 'Создать свой нутриент',
  allNutrientsSettingsLink: 'Все настройки нутриентов →',
  nutrientNamePlaceholder: 'Название (напр. Омега-3)',
  dailyNormPlaceholder: 'Дневная норма',
  showInPrimaryBlock: 'Показывать сразу в основном блоке (иначе во второстепенных)',
  secondaryNutrientsLabel: 'Второстепенные нутриенты',
  starHintMakePrimary: 'Нажмите ★, чтобы сделать нутриент основным',
  hideSecondaryNutrients: 'Свернуть второстепенные нутриенты',
  showSecondaryNutrients: 'Показать второстепенные нутриенты',

  // Extended ReorderableMealTimeline keys
  mealsTimelineTitle: 'Приёмы пищи за день',
  dragMealHint: 'Перетаскивайте карточки или используйте стрелки',
  newMealCategoryTitle: 'Новый приём пищи (на этот день)',
  mealCategoryNameLabel: 'Название приёма пищи',
  mealCategoryNamePlaceholder: 'Напр.: Второй перекус / Перед тренировкой',
  calorieSharePct: 'Доля калорий (%)',
  createButton: 'Создать',
  iconLabel: 'Иконка:',
  deleteMealConfirmTitle: 'Удалить приём пищи?',
  deleteMealConfirmMsg: 'Вы уверены, что хотите удалить этот приём пищи и его записи за день?',
  deleteFoodFromDiaryTitle: 'Удалить продукт из дневника?',
  deleteFoodFromDiaryMsg: 'Запись будет удалена из выбранного приёма пищи.',
  ofNormShort: 'от нормы',
  noEntries: 'Нет записей',
  addToShoppingList: 'Добавить в список покупок',

  // Extended FoodLibraryTab keys
  perGrams: 'на',
  addProductCardTitle: 'Добавление продукта в библиотеку',
  addProductCardSub: 'Выберите удобный способ: ИИ по названию, фото этикетки, фото блюда или вручную',
  addNewProductToLibraryBtn: 'Добавить новый продукт в библиотеку',
  saveToLibraryBtn: 'Сохранить продукт в библиотеку',
  addToDiaryTitle: 'Записать в дневное меню',
  mealCategorySelectLabel: 'В какой приём пищи добавить?',
  portionWeightGramsLabel: 'Вес вашей порции (в граммах):',
  totalCaloriesPreview: 'Итого в порции:',
  logToDiaryBtn: 'Добавить в дневник',
  deleteProductConfirmTitle: 'Удалить продукт из библиотеки?',
  deleteProductConfirmMsg: 'Продукт будет удалён из вашей библиотеки продуктов.',

  // Extended RecipesTab keys
  shareRecipesAndMenu: 'Экспорт / Импорт',
  vesselsCountShort: 'посуд.',
  finishedDish: 'Готовое блюдо:',
  dishYield: 'Выход:',
  editRecipe: 'Редактировать рецепт',
  newRecipe: 'Новый рецепт',
  per100gFinished: 'КБЖУ на 100 г готового блюда',
  ingredientsLabel: 'Ингредиенты рецепта',
  cookingTimeline: 'Таймлайн и физика готовки',
  evaporatedLabel: 'выпарилось',
  timeLabel: 'Время:',
  yieldShortLabel: 'Выход:',
  startAtLabel: 'Старт:',
  stepLabel: 'Шаг',
  cookingContentsInVessel: 'Содержимое в этой посуде:',
  aiAnalysisLabel: 'Кулинарный ИИ-анализ',
  cookButton: 'Готовить',
  editButton: 'Изменить',
  toDiaryButton: 'В дневник',
  modeWithAi: 'С помощью ИИ',
  modeStepByStep: 'Пошаговая готовка',
  modeSimpleList: 'Простой список',
  aiRecipeHeading: 'Умная генерация рецепта с ИИ',
  aiRecipeDescription: 'Введите название блюда и особенности приготовления — ИИ подберёт ингредиенты, посуду и таймлайн.',
  dishNamePromptLabel: 'Название блюда и пожелания',
  dishNamePromptPlaceholder: 'Например: Домашний украинский борщ с говядиной на 4 литра...',
  generatingSteps: 'ИИ создаёт рецепт...',
  generateStepsWithAi: 'Сгенерировать с ИИ',
  recipeNameLabel: 'Название рецепта',
  recipeIngredientsTitle: 'Ингредиенты рецепта (из библиотеки)',
  removeFromRecipe: 'Убрать из рецепта',
  selectIngredientFromLibrary: 'Добавить ингредиент из библиотеки продуктов:',
  searchLibraryPlaceholder: 'Поиск продукта в библиотеке...',
  addedIngredientsAndWeight: 'Добавленные ингредиенты и вес (в граммах):',
  noIngredientsSelected: 'Пока не выбрано ни одного ингредиента из библиотеки.',
  saveChangesButton: 'Сохранить изменения',
  saveRecipeButton: 'Сохранить рецепт',
  deleteRecipeConfirmTitle: 'Удалить рецепт?',
  deleteRecipeConfirmMsg: 'Рецепт будет удалён из вашего списка рецептов.',

  // Extended ShoppingListTab keys
  shoppingListTitle: 'Список покупок',
  shoppingListSubtitle: 'Продукты, которые нужно купить в магазине',
  shoppingListEmptyTitle: 'Список покупок пуст',
  shoppingListEmptyHint: 'Добавляйте продукты из библиотеки, дневного меню или рецептов с помощью иконки тележки.',
  addFromLibraryBtn: 'Добавить продукт из библиотеки',
  shoppingQuantityPlaceholder: 'Сколько купить (напр. 500 г, 2 шт)',
  selectProductForShoppingTitle: 'Добавить продукт в список покупок',
  selectProductForShoppingHint: 'Выберите продукт из вашей библиотеки и укажите нужное количество',
  nothingFoundInLibrary: 'Ничего не найдено в библиотеке',
  selectedBadge: 'Выбрано',
  selectBadge: 'Выбрать',
  productLabel: 'Выбранный продукт:',
  howMuchToBuyLabel: 'Сколько купить (вес, штуки, упаковки):',
  addToListButton: 'Добавить в список покупок',

  // Extended Language & Settings keys
  addLanguageBtn: '+ Добавить язык',
  selectLanguageHeader: 'Выбор языка',
  aboutAppBtn: 'О приложении',
  secBalanceTitle: 'Баланс ИИ-запросов и ключ доступа',
  infoBtn: 'Информация',
  topUpEnterKeyBtn: 'Пополнить / Ввести ключ',
  secSoundSettings: 'Настройка звука',
  secSoundSettingsSub: 'Выбор разных мелодий при готовке и при приёмах пищи, громкость и вибрация на телефоне',
  secExportImport: 'Экспорт и импорт',
  secExportImportSub: 'Импорт рецептов и импорт-экспорт дневного меню для переноса на другой день или обмена',
  secFeedback: 'Обратная связь',
  secFeedbackSub: 'Вопросы, предложения и поддержка в Telegram и по электронной почте',

  // Toast notifications & popups
  toastUpdatedPrefix: 'Обновлено:',
  toastProfileAdded: 'Профиль «{name}» добавлен!',
  toastProfileDeleted: 'Профиль «{name}» удалён',
  toastAddedToShoppingList: '«{name}» добавлено в список покупок!',
  toastProgramRestored: 'Первоначальная программа полностью восстановлена!',
  toastKeyActivationFailed: 'Не удалось активировать ключ из ссылки',
  toastMasterKeyActivated: 'Мастер-ключ активирован! Полный безлимит запросов.',
  toastKeyActivatedCarryover: 'Ключ активирован! Остаток (+{carry}) прибавлен к 500 → доступно: {total}',
  toastKeyPackageActivated: 'Пакет на 500 ИИ-запросов успешно активирован! (Доступно: {total})',
  toastKeyActivatedRemaining: 'Ключ активирован! Доступно ИИ-запросов: {remaining} из {limit}.',
  toastPreviousSettingsRestored: 'Предыдущие настройки восстановлены',
  toastPortionWeightChanged: 'Вес порции изменён: {grams} г',
  toastMealsAddedFromChat: 'Добавлено {count} блюд из чата в дневник!',
  toastCustomMealAddedForDay: 'Разовый приём «{name}» добавлен для этого дня',
  toastCustomMealDeleted: 'Разовый приём пищи удален',
  toastMealDeletedFromSchedule: 'Приём пищи удален из расписания',
  toastNutrientOrderUpdated: 'Порядок нутриентов обновлен',
  toastNutrientShownOnMain: 'Нутриент выведен на главный экран',
  toastNutrientHiddenFromMain: 'Нутриент скрыт с главного экрана',
  toastNutrientMovedToPrimary: 'Нутриент переведен в Основные',
  toastNutrientMovedToSecondary: 'Нутриент переведен во Второстепенные',
  toastNewNutrientAdded: 'Добавлен новый нутриент: {name}',
  toastDailyMenuCopied: 'Дневное меню ({date}) скопировано в буфер обмена!',
  toastNutrientSettingsUpdated: 'Настройки нутриентов обновлены',
  toastProductUpdatedInLibrary: 'Продукт «{name}» обновлён в списке продуктов!',
  toastProductAddedToLibrary: 'Продукт «{name}» добавлен в библиотеку!',
  toastFoodLoggedToDiary: '«{name}» ({grams} г) записано в дневник!',
  toastRecipeChangesSaved: 'Изменения в рецепте «{name}» сохранены!',
  toastRecipeSaved: 'Рецепт «{name}» успешно сохранен!',
  toastRecipeCopied: 'Рецепт «{name}» скопирован в буфер обмена!',
  toastCircularViewEnabled: 'Включен круговой вид дневной нормы',
  toastCompactBarsEnabled: 'Включены компактные полосы нутриентов',
  toastDailyNormUpdated: 'Дневная норма калорий и БЖУ успешно обновлена!',
  toastGoalModeSwitched: 'Режим цели переключен: {mode}',
  goalModeLose: 'Похудение',
  goalModeGain: 'Набор',
  goalModeMaintain: 'Баланс',
  toastMealsOrderUpdated: 'Список и порядок приёмов пищи обновлен!',
  toastResetToDefaults: 'Сброшено к заводским настройкам',
  toastNutrientVisibilityUpdated: 'Видимость нутриента изменена',
  toastNutrientPriorityUpdated: 'Приоритет нутриента изменён',
  toastNutrientParamsUpdated: 'Параметры нутриента обновлены',
  toastNutrientDeleted: 'Нутриент удалён',
  toastMealParamsUpdated: 'Параметры приёма пищи обновлены',
  toastMealTimeReminderUpdated: 'Время и напоминание приёма пищи обновлены',

  // Person & Profile popups
  addPersonTitle: 'Добавить человека',
  personNamePlaceholder: 'Имя человека...',
  deletePersonTitle: 'Удалить человека',

  // FoodLibrary Add/Edit Product & Nutrient Visibility Modals
  editProductModalTitle: 'Изменить продукт',
  addProductModalTitle: 'Добавить продукт в библиотеку',
  editProductModalSub: 'Ручное изменение названия и нутриентов продукта',
  addProductAiNameSub: 'Расчет всех нутриентов через ИИ по названию',
  addProductPhotoLabelSub: 'Распознавание КБЖУ с фото этикетки + витамины по названию',
  addProductPhotoDishSub: 'Примерная визуальная оценка готового блюда по фото',
  addProductManualSub: 'Ручной ввод всех значений',
  foodNameMandatoryLabel: 'Название продукта / блюда *',
  mandatoryBadge: '(обязательно)',
  foodNameInputPlaceholder: 'например, Творог рассыпчатый 5%, Протеиновый батончик, Борщ...',
  photoLabelHeading: 'Фото этикетки с КБЖУ',
  photoDishHeading: 'Фото тарелки с едой',
  replacePhotoBtn: 'Заменить фото',
  chooseFileCameraBtn: 'Выбрать файл / камеру',
  geminiAnalyzingPhoto: 'ИИ анализирует изображение...',
  recognizeWithGeminiBtn: 'Распознать по фото',
  aiCalculatingNutrients: 'ИИ рассчитывает нутриенты...',
  calculateMacrosByNameBtn: 'Рассчитать КБЖУ и витамины по названию',
  defaultPortionWeightLabel: 'Вес порции (граммы, по умолчанию 100 г)',
  coreNutrientsTitle: 'Основные нутриенты (КБЖУ)',
  mandatoryPluralBadge: 'обязательные',
  additionalNutrientsTitle: 'Дополнительные нутриенты',
  filledCountBadge: 'заполнено:',
  availableCountBadge: 'доступно',
  collapseBtn: 'Свернуть',
  expandBtn: 'Развернуть',
  vitaminsAndMineralsTitle: 'Витамины, минералы и другие нутриенты',
  inFormCountSuffix: 'в форме',
  addNutrientToProductTitle: 'Добавить нутриент к продукту:',
  selectFromExistingNutrients: 'Выберите из существующих нутриентов:',
  nutrientNotFoundQuestion: 'Нужного нутриента нет в списке?',
  createNewNutrientBtn: '+ Создать новый нутриент',
  creatingNewNutrientTitle: 'Создание нового нутриента',
  backToSelectionBtn: '← Назад к выбору',
  nutrientNameRequiredLabel: 'Название нутриента *',
  unitLabel: 'Единица',
  colorLabel: 'Цвет:',
  createAndAttachBtn: 'Создать и привязать',
  removeNutrientFromProductTitle: 'Убрать нутриент из этого продукта',
  noAdditionalNutrientsSelected: 'Дополнительные нутриенты не выбраны. Нажмите «+ Добавить нутриент» выше.',
  errEnterNutrientName: 'Введите название нутриента',
  errEnterFoodNameForAi: 'Обязательно введите название продукта перед анализом ИИ!',
  errFailedToCalculateNutrients: 'Не удалось рассчитать нутриенты',
  errEnterFoodNameForPhoto: 'Обязательно введите название продукта перед анализом фотографии!',
  errUploadPhotoFirst: 'Загрузите или сфотографируйте изображение!',
  errPhotoRecognitionFailed: 'Ошибка распознавания фото',
  errFoodNameRequiredToSave: 'Нельзя сохранить продукт без указания названия!',
  nutrientCardsModalTitle: 'Отображение нутриентов в карточках',
  nutrientCardsModalSub: 'Настройте, что показывать во 2-й и 3-й строках продуктов',
  nutrientCardsRow1Title: 'Строка 1 (базовая):',
  nutrientCardsRow1Desc: 'Калории, Белки, Жиры и Углеводы всегда зафиксированы и отображаются первыми.',
  nutrientCardsRow2Title: 'Строки 2 и 3:',
  nutrientCardsRow2Desc: 'Включайте или скрывайте дополнительные нутриенты. Например, витамин С можно отслеживать в дневной норме, но скрыть в карточках продуктов, чтобы они оставались компактными.',
  alwaysInRow1Badge: 'Всегда в стр. 1',
  showBtn: 'Показывать',
  hideBtn: 'Скрыть',

  // ResetConfirmModal & ConfigJsonModal
  resetModalTitle: 'Восстановление первоначальной программы',
  resetModalSubtitle: 'Сброс всех настроек к заводскому состоянию',
  resetModalWhatRestored: 'Что будет восстановлено:',
  resetModalItem1: 'Все исходные цели КБЖУ и калорий (2200 ккал, 140г белка и т.д.)',
  resetModalItem2: 'Базовые приёмы пищи (Завтрак, Обед, Ужин, Перекус)',
  resetModalItem3: 'Защищённые языки: Русский, Английский, Польский',
  resetModalItem4: 'Оригинальная тёмная тема и изумрудный акцент',
  resetModalItem5: 'Все стандартные переключатели разделов интерфейса',
  resetModalClearLogsLabel: 'Очистить также дневник питания (записи съеденной еды)',
  resetModalClearLogsHint: 'Если флажок снят, ваши съеденные блюда и история питания за сегодня останутся нетронутыми.',
  resetModalConfirmBtn: 'Восстановить программу',
  copiedBadge: 'Скопировано!',
  copyBtn: 'Копировать',
  closeBtn: 'Закрыть',

  // Recipes & Cooking Timer Modal
  errEnterDishNameForAi: 'Пожалуйста, впишите название блюда (например: «Борщ с говядиной», «Плов с курицей» или «Цезарь»).',
  aiChefRecipeReadyBanner: '✨ ИИ-шеф расписал рецепт «{name}»: посуд — {vessels}, ингредиентов — {ingredients}. Вы можете сразу сохранить рецепт или скорректировать любой шаг.',
  errGenerateRecipeFailed: 'Ошибка при генерации рецепта с помощью ИИ',
  shareRecipeBtnTitle: 'Поделиться рецептом (скопировать код)',
  timerPrepareByMinute: 'Приготовить к {min}-й минуте',
  timerTestSoundTitle: 'Проверить звук',
  timerStepCompleted: 'Шаг {step} завершён!',
  timerNextBtn: 'Далее',
  timerFinishBtn: 'Завершить',
  timerPauseBtn: 'Пауза',
  timerResumeBtn: 'Продолжить',
  timerStartBtn: 'Старт',
  timerResetStepTitle: 'Сбросить шаг',
  errAllModelsOverloaded: 'Все модели ИИ сейчас перегружены (Gemini 3.5 Flash Lite → Gemini 3.1 Flash Lite → Gemini 2.5 Flash Lite → Gemini 2.0 Flash Lite). Запрос не был списан, пожалуйста, попробуйте чуть позже.',
};

export const COMPLETE_ENGLISH_LABELS: ExtendedLocalizationLabels = {
  appTitle: 'Smart Food Assistance',
  todaySummary: 'Daily Summary',
  dailyGoal: 'Daily Goal',
  consumed: 'Consumed',
  remaining: 'Remaining',
  addFood: 'Add Food',
  foodName: 'Food or Meal Name',
  amountGrams: 'Portion weight (g)',
  selectMeal: 'Meal Category',
  cancel: 'Cancel',
  save: 'Save',
  delete: 'Delete',
  chatTitle: 'Gemini Flash AI Assistant',
  chatPlaceholder: 'Ask Gemini to adjust targets, theme, add vitamins or log food...',
  chatSend: 'Send',
  applyChanges: 'Apply Changes',
  revertChanges: 'Revert',
  configTitle: 'userConfig.json (Data-Driven UI)',
  installApp: 'Install PWA',
  offlineMode: 'Offline Mode — using cached local data',
  onlineMode: 'Connected to network',
  resetToDefault: 'Reset to Default',
  exportConfig: 'Export JSON',
  importConfig: 'Import JSON',

  // Navigation tabs
  tabDailyMenu: 'Daily Menu',
  tabFoodLibrary: 'Food Library',
  tabFoodLibraryShort: 'Foods',
  tabRecipes: 'Recipes',
  tabShoppingList: 'Shopping List',
  tabShoppingListShort: 'Shopping',
  tabSettings: 'Settings',

  // Water product name
  waterProductName: 'Water',

  // Units
  unitKcal: 'kcal',
  unitGram: 'g',
  unitMg: 'mg',
  unitMcg: 'mcg',
  unitMl: 'ml',
  unitProtShort: 'P',
  unitFatShort: 'F',
  unitCarbShort: 'C',

  // Day swipe header
  todayBadge: 'Today',
  swipeHint: 'Navigate with arrows or swipe left/right',
  prevDay: 'Previous day',
  nextDay: 'Next day',
  returnToToday: 'Back to today',

  // Daily target / compact nutrients list
  dailyNutrientNorm: 'Daily Nutrient Targets',
  visibleOnScreen: 'visible',
  nutrientsTitle: 'Nutrients',
  quickNutrientSettings: 'Quick nutrient display settings',
  gearModalTitle: 'Customize Main Screen Nutrients',
  gearModalSubtitle: 'Show or hide nutrients and mark them as Primary or Secondary',
  searchNutrientPlaceholder: 'Search nutrient (sugar, fiber, iron, zinc, potassium...)',
  baseNutrientBadge: '(core)',
  primaryBadge: 'Primary',
  secondaryBadge: 'Secondary',
  aiAddNutrientBtn: '+ AI Add',
  allSettingsBtn: 'All settings',
  doneBtn: 'Done',
  moveUp: 'Move up',
  moveDown: 'Move down',

  // Meal timeline
  dailyMenuTitle: 'Daily Menu',
  addMealCategory: 'Add Meal Category',
  noFoodsLogged: 'No food logged yet',
  targetLabel: 'Target:',
  addToShoppingListTitle: 'Add to Shopping List',
  addProductToMealTitle: 'Add food to meal',
  deleteMealCategoryTitle: 'Delete meal category',

  // Food library
  searchFoodPlaceholder: 'Search food library...',
  byAiName: 'By Name (AI)',
  photoLabel: 'Nutrition Label',
  photoDish: 'Meal Photo',
  manualAdd: 'Manual',
  totalInLibrary: 'Total in library:',
  productsUnit: 'items',
  logToDiary: 'Log to Diary',
  quickLogHint: 'Tap «Log to Diary» for quick logging',
  nutrientDisplay: 'Nutrient Display',
  per100gLabel: 'per',
  addNewProductBtn: 'Add New Food to Library',
  addingProductForMealBanner: 'Adding food to meal:',
  deleteFromLibraryTitle: 'Delete from library',
  sourcePhotoLabel: '📷 from label',
  sourcePhotoDish: '🍽️ from photo',
  sourceBase: '⚡ library',

  // Recipes
  searchRecipesPlaceholder: 'Search recipes...',
  createRecipe: 'Create Recipe',
  exportImportBtn: 'Export / Import',
  savedRecipesCount: 'Saved recipes:',
  recipeHint: 'Calculates macros per 100g from library ingredients',
  perServing: 'Macros per 1 serving:',
  servingsUnit: 'serv.',
  totalUnit: 'total',
  per100gFinishedDish: 'Per 100 g of finished dish',
  dishYieldLabel: 'Dish yield:',
  finishedDishLabel: 'Finished dish',
  rawLabel: 'raw',
  ingredientsTitle: 'Ingredients:',
  cookingTimelineTitle: 'Cooking Timeline',
  startCookingTimerBtn: 'Cooking Timer',
  vesselsShortUnit: 'cookware',
  editRecipeTitle: 'Edit recipe',
  addBtn: 'Add',

  // Shopping List
  shoppingItemsToBuy: 'Items to buy:',
  hidePanelBtn: 'Hide panel',
  selectFromLibraryLabel: 'Select product from your Food Library:',
  selectFromLibraryPlaceholder: 'Start typing or pick a food item...',
  quantityInputLabel: 'Quantity (g, pcs, kg, bottles...):',
  quantityInputPlaceholder: 'e.g. 500 g, 2 pcs, 1 kg...',
  addToListBtn: 'Add to list',
  shoppingEmptyTitle: 'Your shopping list is empty',
  shoppingEmptyDesc: 'Tap «Add» above to pick a food from your library, or tap the cart icon next to items in Daily Menu and Recipes.',
  colProduct: 'Product',
  colHowMuchToBuy: 'Quantity (amount / weight / pcs)',
  colDelete: 'Delete',

  // Settings
  settingsSectionsTitle: 'Settings Sections',
  expandAll: 'Expand All',
  collapseAll: 'Collapse All',
  openCountOfTotal: 'open of',
  secAiProvider: 'AI Provider & Models',
  secAiProviderSub: 'Configure provider (Gemini, OpenAI, OpenRouter), keys and model',
  secLanguage: 'Interface Language',
  secLanguageSub: 'Choose language (Русский, English, Polski) and localization',
  secDailyNorm: 'Daily Norm',
  secDailyNormSub: 'Manual entry of calories, macros, and water or calculation with AI',
  secMealCategories: 'Meal Categories & Target %',
  secMealCategoriesSub: 'Breakfast, lunch, dinner, snack — order, colors and % targets',
  secNutrients: 'Nutrient Targets & Management',
  secNutrientsSub: 'Set targets, units, colors, ordering and display on screen',
  secNutrientMode: 'Nutrient Display Mode',
  secNutrientModeSub: 'Compact row list or circular macro rings',
  secTheme: 'Theme & Visual Design',
  secThemeSub: 'Dark, light, emerald, sunset, cyberpunk, nord and rounded corners',
  secDataReset: 'Data Management & Backup',
  secDataResetSub: 'Export and import settings JSON, full reset to defaults',
  activeProviderLabel: 'Active provider:',
  configureAiBtn: 'Configure AI (Gemini, OpenAI, OpenRouter)',
  connectApiKeyBtn: 'Connect Custom AI API Key',
  openAssistantChatBtn: 'Open AI Assistant Chat',
  availableLanguagesLabel: 'Available languages',
  tapToSwitchHint: 'tap to switch',
  compactBarsLabel: 'Compact Bars',
  compactBarsDesc: 'Each nutrient in a clean row with progress bar and percentage',
  circularRingLabel: 'Circular Ring',
  circularRingDesc: 'Calories in a large ring with protein, fat and carb bars below',
  openConfigJsonBtn: 'Open userConfig.json',
  restoreProgramBtn: 'Restore Factory Defaults',
  restoreOriginal: 'Restore Factory Defaults',

  // Short unit & action aliases
  kcalShort: 'kcal',
  gramsShort: 'g',
  mlShort: 'ml',
  protShort: 'P',
  fatShort: 'F',
  carbShort: 'C',
  add: 'Add',
  reset: 'Reset',

  // Extended DaySwipeHeader keys
  today: 'Today',
  yesterday: 'Yesterday',
  tomorrow: 'Tomorrow',
  selectDate: 'Select date',
  calendar: 'Calendar',
  daysHistoryTitle: 'Days History',
  listLabel: 'List',
  itemsForDay: 'items for the day',
  backToToday: 'Back to Today',
  swipeOrButtonsHint: 'Swipe left/right or use buttons to change day',
  dailyGoalReachedPct: 'Daily goal progress:',
  noLoggedDays: 'No logged days in diary yet.',
  itemsCountShort: 'items',

  // Extended CompactNutrientsList keys
  moveToSecondary: 'Move to secondary',
  makePrimary: 'Make primary',
  exceededBy: 'Exceeded by',
  remainingLabel: 'Remaining:',
  dailySummaryTitle: 'Daily Summary',
  primaryShort: 'prim.',
  secondaryShort: 'sec.',
  exceededNorm: 'Exceeded target:',
  allNutrientsInNorm: 'All nutrients within daily target',
  addNutrient: 'Nutrient',
  quickAddNutrientTitle: 'Quick Add Nutrient to Screen',
  clickNutrientToAdd: 'Tap a nutrient to display it in summary:',
  allPresetsEnabledHint: 'All preset nutrients are already enabled!',
  createOwnNutrient: 'Create custom nutrient',
  allNutrientsSettingsLink: 'All nutrient settings →',
  nutrientNamePlaceholder: 'Name (e.g. Omega-3)',
  dailyNormPlaceholder: 'Daily target',
  showInPrimaryBlock: 'Show in primary section (otherwise in secondary)',
  secondaryNutrientsLabel: 'Secondary nutrients',
  starHintMakePrimary: 'Tap ★ to make a nutrient primary',
  hideSecondaryNutrients: 'Hide secondary nutrients',
  showSecondaryNutrients: 'Show secondary nutrients',

  // Extended ReorderableMealTimeline keys
  mealsTimelineTitle: 'Meals of the Day',
  dragMealHint: 'Drag cards or use arrows to reorder',
  newMealCategoryTitle: 'New Meal Category (for today)',
  mealCategoryNameLabel: 'Meal category name',
  mealCategoryNamePlaceholder: 'e.g. Late Snack / Pre-workout',
  calorieSharePct: 'Calorie share (%)',
  createButton: 'Create',
  iconLabel: 'Icon:',
  deleteMealConfirmTitle: 'Delete meal category?',
  deleteMealConfirmMsg: 'Are you sure you want to delete this meal category and its entries?',
  deleteFoodFromDiaryTitle: 'Remove food from diary?',
  deleteFoodFromDiaryMsg: 'This entry will be removed from the selected meal.',
  ofNormShort: 'of target',
  noEntries: 'No entries',
  addToShoppingList: 'Add to shopping list',

  // Extended FoodLibraryTab keys
  perGrams: 'per',
  addProductCardTitle: 'Add Product to Library',
  addProductCardSub: 'Choose method: AI by name, nutrition label photo, dish photo, or manual',
  addNewProductToLibraryBtn: 'Add New Food to Library',
  saveToLibraryBtn: 'Save Food to Library',
  addToDiaryTitle: 'Log to Daily Menu',
  mealCategorySelectLabel: 'Select meal category:',
  portionWeightGramsLabel: 'Your portion weight (grams):',
  totalCaloriesPreview: 'Total in portion:',
  logToDiaryBtn: 'Add to Diary',
  deleteProductConfirmTitle: 'Delete food from library?',
  deleteProductConfirmMsg: 'This product will be removed from your food library.',

  // Extended RecipesTab keys
  shareRecipesAndMenu: 'Export / Import',
  vesselsCountShort: 'vessels',
  finishedDish: 'Finished dish:',
  dishYield: 'Yield:',
  editRecipe: 'Edit Recipe',
  newRecipe: 'New Recipe',
  per100gFinished: 'Macros per 100g of finished dish',
  ingredientsLabel: 'Recipe Ingredients',
  cookingTimeline: 'Cooking Timeline & Physics',
  evaporatedLabel: 'evaporated',
  timeLabel: 'Time:',
  yieldShortLabel: 'Yield:',
  startAtLabel: 'Start:',
  stepLabel: 'Step',
  cookingContentsInVessel: 'Contents in this cookware:',
  aiAnalysisLabel: 'Culinary AI Analysis',
  cookButton: 'Cook',
  editButton: 'Edit',
  toDiaryButton: 'To Diary',
  modeWithAi: 'With AI',
  modeStepByStep: 'Full Cooking',
  modeSimpleList: 'Simple List',
  aiRecipeHeading: 'Smart AI Recipe Generator',
  aiRecipeDescription: 'Enter dish name and preferences — AI will build ingredients, cookware, and cooking timeline.',
  dishNamePromptLabel: 'Dish name & preferences',
  dishNamePromptPlaceholder: 'e.g. Classic Homemade Beef Borscht in a 4L pot...',
  generatingSteps: 'AI is generating recipe...',
  generateStepsWithAi: 'Generate with AI',
  recipeNameLabel: 'Recipe Name',
  recipeIngredientsTitle: 'Recipe Ingredients (from library)',
  removeFromRecipe: 'Remove from recipe',
  selectIngredientFromLibrary: 'Add ingredient from Food Library:',
  searchLibraryPlaceholder: 'Search product in library...',
  addedIngredientsAndWeight: 'Added ingredients & weight (in grams):',
  noIngredientsSelected: 'No ingredients selected from library yet.',
  saveChangesButton: 'Save Changes',
  saveRecipeButton: 'Save Recipe',
  deleteRecipeConfirmTitle: 'Delete recipe?',
  deleteRecipeConfirmMsg: 'This recipe will be removed from your saved recipes.',

  // Extended ShoppingListTab keys
  shoppingListTitle: 'Shopping List',
  shoppingListSubtitle: 'Groceries and products you need to buy',
  shoppingListEmptyTitle: 'Shopping list is empty',
  shoppingListEmptyHint: 'Add products from your library, daily menu, or recipes using the cart icon.',
  addFromLibraryBtn: 'Add Product from Library',
  shoppingQuantityPlaceholder: 'Quantity (e.g. 500 g, 2 pcs)',
  selectProductForShoppingTitle: 'Add Product to Shopping List',
  selectProductForShoppingHint: 'Pick a product from your library and enter the quantity to buy',
  nothingFoundInLibrary: 'Nothing found in library',
  selectedBadge: 'Selected',
  selectBadge: 'Select',
  productLabel: 'Selected product:',
  howMuchToBuyLabel: 'Quantity to buy (weight, pcs, packs):',
  addToListButton: 'Add to Shopping List',

  // Extended Language & Settings keys
  addLanguageBtn: '+ Add language',
  selectLanguageHeader: 'Select Language',
  aboutAppBtn: 'About',
  secBalanceTitle: 'AI Requests Balance & Key',
  infoBtn: 'Info',
  topUpEnterKeyBtn: 'Top up / Enter Key',
  secSoundSettings: 'Sound Settings',
  secSoundSettingsSub: 'Choose melodies for cooking timers and meal reminders, adjust volume and phone vibration',
  secExportImport: 'Export & Import',
  secExportImportSub: 'Import recipes and export or import your daily menu to transfer to another day or share',
  secFeedback: 'Feedback & Support',
  secFeedbackSub: 'Questions, suggestions, or support via Telegram and Email',

  // Toast notifications & popups
  toastUpdatedPrefix: 'Updated:',
  toastProfileAdded: 'Profile "{name}" added!',
  toastProfileDeleted: 'Profile "{name}" deleted',
  toastAddedToShoppingList: '"{name}" added to shopping list!',
  toastProgramRestored: 'Factory defaults have been fully restored!',
  toastKeyActivationFailed: 'Failed to activate access key from link',
  toastMasterKeyActivated: 'Master key activated! Unlimited requests.',
  toastKeyActivatedCarryover: 'Key activated! Remaining (+{carry}) added to 500 → available: {total}',
  toastKeyPackageActivated: '500 AI requests package activated! (Available: {total})',
  toastKeyActivatedRemaining: 'Key activated! Available AI requests: {remaining} of {limit}.',
  toastPreviousSettingsRestored: 'Previous settings restored',
  toastPortionWeightChanged: 'Portion weight updated: {grams} g',
  toastMealsAddedFromChat: 'Added {count} dishes from chat to diary!',
  toastCustomMealAddedForDay: 'Custom meal "{name}" added for today',
  toastCustomMealDeleted: 'Custom meal deleted',
  toastMealDeletedFromSchedule: 'Meal category removed from schedule',
  toastNutrientOrderUpdated: 'Nutrient order updated',
  toastNutrientShownOnMain: 'Nutrient shown on main screen',
  toastNutrientHiddenFromMain: 'Nutrient hidden from main screen',
  toastNutrientMovedToPrimary: 'Nutrient moved to Primary',
  toastNutrientMovedToSecondary: 'Nutrient moved to Secondary',
  toastNewNutrientAdded: 'Added new nutrient: {name}',
  toastDailyMenuCopied: 'Daily menu ({date}) copied to clipboard!',
  toastNutrientSettingsUpdated: 'Nutrient settings updated',
  toastProductUpdatedInLibrary: 'Food "{name}" updated in library!',
  toastProductAddedToLibrary: 'Food "{name}" added to library!',
  toastFoodLoggedToDiary: '"{name}" ({grams}g) logged to diary!',
  toastRecipeChangesSaved: 'Changes to recipe "{name}" saved!',
  toastRecipeSaved: 'Recipe "{name}" saved!',
  toastRecipeCopied: 'Recipe "{name}" copied to clipboard!',
  toastCircularViewEnabled: 'Circular daily norm view enabled',
  toastCompactBarsEnabled: 'Compact nutrient bars enabled',
  toastDailyNormUpdated: 'Daily calorie and macro targets updated!',
  toastGoalModeSwitched: 'Goal mode switched: {mode}',
  goalModeLose: 'Weight Loss',
  goalModeGain: 'Muscle Gain',
  goalModeMaintain: 'Maintenance',
  toastMealsOrderUpdated: 'Meal categories list and order updated!',
  toastResetToDefaults: 'Reset to factory defaults',
  toastNutrientVisibilityUpdated: 'Nutrient visibility updated',
  toastNutrientPriorityUpdated: 'Nutrient priority updated',
  toastNutrientParamsUpdated: 'Nutrient parameters updated',
  toastNutrientDeleted: 'Nutrient deleted',
  toastMealParamsUpdated: 'Meal category settings updated',
  toastMealTimeReminderUpdated: 'Meal time and reminder updated',

  // Person & Profile popups
  addPersonTitle: 'Add person',
  personNamePlaceholder: 'Person name...',
  deletePersonTitle: 'Delete person',

  // FoodLibrary Add/Edit Product & Nutrient Visibility Modals
  editProductModalTitle: 'Edit Food Item',
  addProductModalTitle: 'Add Food to Library',
  editProductModalSub: 'Manually edit product name and nutrient values',
  addProductAiNameSub: 'Calculate all nutrients via AI by product name',
  addProductPhotoLabelSub: 'Extract macros from nutrition label photo + vitamins by name',
  addProductPhotoDishSub: 'Visual estimation of a prepared dish from a photo',
  addProductManualSub: 'Manual entry of all nutritional values',
  foodNameMandatoryLabel: 'Food / Dish Name *',
  mandatoryBadge: '(required)',
  foodNameInputPlaceholder: 'e.g. Cottage Cheese 5%, Protein Bar, Beef Borscht...',
  photoLabelHeading: 'Nutrition Label Photo',
  photoDishHeading: 'Prepared Dish Photo',
  replacePhotoBtn: 'Replace photo',
  chooseFileCameraBtn: 'Choose file / camera',
  geminiAnalyzingPhoto: 'AI is analyzing image...',
  recognizeWithGeminiBtn: 'Recognize from photo',
  aiCalculatingNutrients: 'AI is calculating nutrients...',
  calculateMacrosByNameBtn: 'Calculate Macros & Vitamins by Name',
  defaultPortionWeightLabel: 'Serving weight (grams, default 100 g)',
  coreNutrientsTitle: 'Core Nutrients (Macros)',
  mandatoryPluralBadge: 'required',
  additionalNutrientsTitle: 'Additional Nutrients',
  filledCountBadge: 'filled:',
  availableCountBadge: 'available',
  collapseBtn: 'Collapse',
  expandBtn: 'Expand',
  vitaminsAndMineralsTitle: 'Vitamins, Minerals & Other Nutrients',
  inFormCountSuffix: 'in form',
  addNutrientToProductTitle: 'Add nutrient to product:',
  selectFromExistingNutrients: 'Select from existing nutrients:',
  nutrientNotFoundQuestion: 'Nutrient not in the list?',
  createNewNutrientBtn: '+ Create new nutrient',
  creatingNewNutrientTitle: 'Create New Nutrient',
  backToSelectionBtn: '← Back to selection',
  nutrientNameRequiredLabel: 'Nutrient name *',
  unitLabel: 'Unit',
  colorLabel: 'Color:',
  createAndAttachBtn: 'Create & attach',
  removeNutrientFromProductTitle: 'Remove nutrient from this product',
  noAdditionalNutrientsSelected: 'No additional nutrients selected. Tap "+ Add nutrient" above.',
  errEnterNutrientName: 'Please enter a nutrient name',
  errEnterFoodNameForAi: 'Please enter the food name before running AI analysis!',
  errFailedToCalculateNutrients: 'Failed to calculate nutrients',
  errEnterFoodNameForPhoto: 'Please enter the food name before analyzing the photo!',
  errUploadPhotoFirst: 'Please upload or take a photo first!',
  errPhotoRecognitionFailed: 'Photo recognition failed',
  errFoodNameRequiredToSave: 'Cannot save a food item without a name!',
  nutrientCardsModalTitle: 'Nutrient Display on Cards',
  nutrientCardsModalSub: 'Customize which nutrients appear on rows 2 and 3 of food cards',
  nutrientCardsRow1Title: 'Row 1 (Core):',
  nutrientCardsRow1Desc: 'Calories, Protein, Fat, and Carbs are always pinned and displayed first.',
  nutrientCardsRow2Title: 'Rows 2 & 3:',
  nutrientCardsRow2Desc: 'Show or hide additional nutrients on food cards so they stay clean and compact.',
  alwaysInRow1Badge: 'Always in Row 1',
  showBtn: 'Show',
  hideBtn: 'Hide',

  // ResetConfirmModal & ConfigJsonModal
  resetModalTitle: 'Restore Factory Defaults',
  resetModalSubtitle: 'Reset all settings back to their original state',
  resetModalWhatRestored: 'What will be restored:',
  resetModalItem1: 'All default calorie and macro targets (2200 kcal, 140g protein, etc.)',
  resetModalItem2: 'Default meal categories (Breakfast, Lunch, Dinner, Snack)',
  resetModalItem3: 'Protected languages: Russian, English, Polish',
  resetModalItem4: 'Original dark theme and emerald accent',
  resetModalItem5: 'All standard interface section toggles',
  resetModalClearLogsLabel: 'Also clear food diary logs (logged meals)',
  resetModalClearLogsHint: 'If unchecked, your logged meals and nutrition history will remain intact.',
  resetModalConfirmBtn: 'Restore Defaults',
  copiedBadge: 'Copied!',
  copyBtn: 'Copy',
  closeBtn: 'Close',

  // Recipes & Cooking Timer Modal
  errEnterDishNameForAi: 'Please enter a dish name (e.g. "Beef Borscht", "Chicken Pilaf", or "Caesar Salad").',
  aiChefRecipeReadyBanner: '✨ AI Chef created recipe "{name}": cookware — {vessels}, ingredients — {ingredients}. You can save it right away or adjust any step.',
  errGenerateRecipeFailed: 'Failed to generate recipe with AI',
  shareRecipeBtnTitle: 'Share recipe (copy code)',
  timerPrepareByMinute: 'Prepare by minute {min}',
  timerTestSoundTitle: 'Test sound',
  timerStepCompleted: 'Step {step} completed!',
  timerNextBtn: 'Next',
  timerFinishBtn: 'Finish',
  timerPauseBtn: 'Pause',
  timerResumeBtn: 'Resume',
  timerStartBtn: 'Start',
  timerResetStepTitle: 'Reset step',
  errAllModelsOverloaded: 'All AI models are currently overloaded (Gemini 3.5 Flash Lite → Gemini 3.1 Flash Lite → Gemini 2.5 Flash Lite → Gemini 2.0 Flash Lite). No request was deducted, please try again shortly.',
};

export const COMPLETE_POLISH_LABELS: ExtendedLocalizationLabels = {
  appTitle: 'Smart Food Assistance — Inteligentny Asystent Żywienia',
  todaySummary: 'Podsumowanie dnia',
  dailyGoal: 'Cel dzienny',
  consumed: 'Spożyto',
  remaining: 'Pozostało',
  addFood: 'Dodaj produkt',
  foodName: 'Nazwa produktu lub dania',
  amountGrams: 'Waga porcji (gramy)',
  selectMeal: 'Kategoria posiłku',
  cancel: 'Anuluj',
  save: 'Zapisz',
  delete: 'Usuń',
  chatTitle: 'Asystent AI Gemini Flash',
  chatPlaceholder: 'Poproś Gemini o zmianę celów, motywu, dodanie witamin lub posiłku...',
  chatSend: 'Wyślij',
  applyChanges: 'Zastosuj zmiany',
  revertChanges: 'Cofnij',
  configTitle: 'userConfig.json (Data-Driven UI)',
  installApp: 'Zainstaluj PWA',
  offlineMode: 'Tryb offline — dane zapisane lokalnie',
  onlineMode: 'Połączono z siecią',
  resetToDefault: 'Przywróć domyślne',
  exportConfig: 'Eksportuj JSON',
  importConfig: 'Importuj JSON',

  // Navigation tabs
  tabDailyMenu: 'Dzienne menu',
  tabFoodLibrary: 'Baza produktów',
  tabFoodLibraryShort: 'Produkty',
  tabRecipes: 'Przepisy',
  tabShoppingList: 'Lista zakupów',
  tabShoppingListShort: 'Zakupy',
  tabSettings: 'Ustawienia',

  // Water product name
  waterProductName: 'Woda',

  // Units
  unitKcal: 'kcal',
  unitGram: 'g',
  unitMg: 'mg',
  unitMcg: 'µg',
  unitMl: 'ml',
  unitProtShort: 'B',
  unitFatShort: 'T',
  unitCarbShort: 'W',

  // Day swipe header
  todayBadge: 'Dzisiaj',
  swipeHint: 'Przełączaj strzałkami lub przesuwaj w lewo/prawo',
  prevDay: 'Poprzedni dzień',
  nextDay: 'Następny dzień',
  returnToToday: 'Wróć do dzisiaj',

  // Daily target / compact nutrients list
  dailyNutrientNorm: 'Dzienna norma składników odżywczych',
  visibleOnScreen: 'widocznych',
  nutrientsTitle: 'Składniki',
  quickNutrientSettings: 'Szybkie ustawienia składników',
  gearModalTitle: 'Ustawienia składników na ekranie głównym',
  gearModalSubtitle: 'Włączaj/ukrywaj składniki i ustawiaj status: Główny lub Dodatkowy',
  searchNutrientPlaceholder: 'Szukaj składnika (cukier, błonnik, żelazo, cynk, potas...)',
  baseNutrientBadge: '(bazowy)',
  primaryBadge: 'Główny',
  secondaryBadge: 'Dodatkowy',
  aiAddNutrientBtn: '+ Dodaj z AI',
  allSettingsBtn: 'Wszystkie ustawienia',
  doneBtn: 'Gotowe',
  moveUp: 'Wyżej',
  moveDown: 'Niżej',

  // Meal timeline
  dailyMenuTitle: 'Dzienne menu',
  addMealCategory: 'Dodaj posiłek',
  noFoodsLogged: 'Brak dodanych produktów',
  targetLabel: 'Cel:',
  addToShoppingListTitle: 'Dodaj do listy zakupów',
  addProductToMealTitle: 'Dodaj produkt do posiłku',
  deleteMealCategoryTitle: 'Usuń posiłek',

  // Food library
  searchFoodPlaceholder: 'Szukaj w bazie produktów...',
  byAiName: 'Wg nazwy (AI)',
  photoLabel: 'Zdjęcie etykiety',
  photoDish: 'Zdjęcie dania',
  manualAdd: 'Ręcznie',
  totalInLibrary: 'Łącznie w bazie:',
  productsUnit: 'produktów',
  logToDiary: 'Do dziennika',
  quickLogHint: 'Dotknij «Do dziennika», aby szybko dodać',
  nutrientDisplay: 'Wyświetlanie składników',
  per100gLabel: 'na',
  addNewProductBtn: 'Dodaj nowy produkt do bazy',
  addingProductForMealBanner: 'Dodawanie produktu do posiłku:',
  deleteFromLibraryTitle: 'Usuń z bazy',
  sourcePhotoLabel: '📷 z etykiety',
  sourcePhotoDish: '🍽️ ze zdjęcia',
  sourceBase: '⚡ baza',

  // Recipes
  searchRecipesPlaceholder: 'Szukaj przepisów...',
  createRecipe: 'Utwórz przepis',
  exportImportBtn: 'Eksport / Import',
  savedRecipesCount: 'Zapisanych przepisów:',
  recipeHint: 'Oblicza makroskładniki na 100 g ze składników bazy',
  perServing: 'W 1 porcji:',
  servingsUnit: 'porcji',
  totalUnit: 'łącznie',
  per100gFinishedDish: 'Na 100 g gotowego dania',
  dishYieldLabel: 'Waga gotowego dania:',
  finishedDishLabel: 'Gotowe danie',
  rawLabel: 'surowe',
  ingredientsTitle: 'Składniki:',
  cookingTimelineTitle: 'Oś czasu gotowania',
  startCookingTimerBtn: 'Minutnik gotowania',
  vesselsShortUnit: 'naczyn.',
  editRecipeTitle: 'Edytuj przepis',
  addBtn: 'Dodaj',

  // Shopping List
  shoppingItemsToBuy: 'Pozycji do kupienia:',
  hidePanelBtn: 'Ukryj panel',
  selectFromLibraryLabel: 'Produkt z Twojej bazy produktów:',
  selectFromLibraryPlaceholder: 'Zacznij pisać lub wybierz produkt z listy...',
  quantityInputLabel: 'Ilość (g, szt., kg, but...):',
  quantityInputPlaceholder: 'Np. 500 g, 2 szt., 1 kg...',
  addToListBtn: 'Do listy',
  shoppingEmptyTitle: 'Lista zakupów jest pusta',
  shoppingEmptyDesc: 'Kliknij przycisk «Dodaj» powyżej, aby wybrać produkt z bazy, lub kliknij ikonę koszyka obok produktów w Dziennym menu i Przepisach.',
  colProduct: 'Produkt',
  colHowMuchToBuy: 'Ile kupić (ilość / waga / szt.)',
  colDelete: 'Usuń',

  // Settings
  settingsSectionsTitle: 'Sekcje ustawień',
  expandAll: 'Rozwiń wszystko',
  collapseAll: 'Zwiń wszystko',
  openCountOfTotal: 'otwartych z',
  secAiProvider: 'Dostawca AI i modele',
  secAiProviderSub: 'Konfiguracja dostawcy (Gemini, OpenAI, OpenRouter), kluczy i modeli',
  secLanguage: 'Język interfejsu',
  secLanguageSub: 'Wybór języka (Русский, English, Polski) i lokalizacja',
  secDailyNorm: 'Dzienna norma',
  secDailyNormSub: 'Ręczne wprowadzanie kalorii, makroskładników i wody lub obliczenie z AI',
  secMealCategories: 'Posiłki i docelowy % kalorii',
  secMealCategoriesSub: 'Śniadanie, obiad, przekąska, kolacja — kolejność, kolory i % normy',
  secNutrients: 'Zarządzanie składnikami odżywczymi i celami',
  secNutrientsSub: 'Cele, jednostki, kolory, kolejność i wyświetlanie na ekranie',
  secNutrientMode: 'Tryb wyświetlania składników',
  secNutrientModeSub: 'Kompaktowa lista lub kołowe pierścienie makroskładników',
  secTheme: 'Motyw i wygląd',
  secThemeSub: 'Ciemny, jasny, szmaragdowy, zachód słońca, cyberpunk, nord i zaokrąglenia',
  secDataReset: 'Zarządzanie danymi i kopie zapasowe',
  secDataResetSub: 'Eksport i import pliku JSON z ustawieniami, reset do domyślnych',
  activeProviderLabel: 'Aktywny dostawca:',
  configureAiBtn: 'Konfiguruj AI (Gemini, OpenAI, OpenRouter)',
  connectApiKeyBtn: 'Podłącz własny klucz API AI',
  openAssistantChatBtn: 'Otwórz czat z asystentem',
  availableLanguagesLabel: 'Dostępne języki',
  tapToSwitchHint: 'dotknij, aby przełączyć',
  compactBarsLabel: 'Kompaktowe paski',
  compactBarsDesc: 'Każdy składnik w osobnym wierszu z paskiem postępu i procentami',
  circularRingLabel: 'Widok kołowy',
  circularRingDesc: 'Kalorie w dużym pierścieniu z paskami białek, tłuszczów i węglowodanów',
  openConfigJsonBtn: 'Otwórz userConfig.json',
  restoreProgramBtn: 'Przywróć ustawienia fabryczne',
  restoreOriginal: 'Przywróć ustawienia fabryczne',

  // Short unit & action aliases
  kcalShort: 'kcal',
  gramsShort: 'g',
  mlShort: 'ml',
  protShort: 'B',
  fatShort: 'T',
  carbShort: 'W',
  add: 'Dodaj',
  reset: 'Resetuj',

  // Extended DaySwipeHeader keys
  today: 'Dzisiaj',
  yesterday: 'Wczoraj',
  tomorrow: 'Jutro',
  selectDate: 'Wybierz datę',
  calendar: 'Kalendarz',
  daysHistoryTitle: 'Historia dni',
  listLabel: 'Lista',
  itemsForDay: 'pozycji w ciągu dnia',
  backToToday: 'Wróć do dzisiaj',
  swipeOrButtonsHint: 'Przesuń w lewo/prawo lub użyj przycisków, aby zmienić dzień',
  dailyGoalReachedPct: 'Realizacja celu dnia:',
  noLoggedDays: 'Brak zapisanych dni w dzienniku.',
  itemsCountShort: 'poz.',

  // Extended CompactNutrientsList keys
  moveToSecondary: 'Przenieś do dodatkowych',
  makePrimary: 'Ustaw jako główny',
  exceededBy: 'Przekroczono o',
  remainingLabel: 'Pozostało:',
  dailySummaryTitle: 'Podsumowanie dnia',
  primaryShort: 'gł.',
  secondaryShort: 'dod.',
  exceededNorm: 'Przekroczono normę:',
  allNutrientsInNorm: 'Wszystkie składniki w granicach normy',
  addNutrient: 'Składnik',
  quickAddNutrientTitle: 'Szybkie dodawanie składnika na ekran',
  clickNutrientToAdd: 'Dotknij składnika, aby wyświetlić go w podsumowaniu:',
  allPresetsEnabledHint: 'Wszystkie domyślne składniki są już włączone!',
  createOwnNutrient: 'Utwórz własny składnik',
  allNutrientsSettingsLink: 'Wszystkie ustawienia składników →',
  nutrientNamePlaceholder: 'Nazwa (np. Omega-3)',
  dailyNormPlaceholder: 'Dzienna norma',
  showInPrimaryBlock: 'Pokaż w głównej sekcji (inaczej w dodatkowych)',
  secondaryNutrientsLabel: 'Dodatkowe składniki',
  starHintMakePrimary: 'Dotknij ★, aby ustawić składnik jako główny',
  hideSecondaryNutrients: 'Ukryj dodatkowe składniki',
  showSecondaryNutrients: 'Pokaż dodatkowe składniki',

  // Extended ReorderableMealTimeline keys
  mealsTimelineTitle: 'Posiłki w ciągu dnia',
  dragMealHint: 'Przeciągaj karty lub używaj strzałek',
  newMealCategoryTitle: 'Nowy posiłek (na ten dzień)',
  mealCategoryNameLabel: 'Nazwa posiłku',
  mealCategoryNamePlaceholder: 'Np. Druga przekąska / Przed treningiem',
  calorieSharePct: 'Udział kalorii (%)',
  createButton: 'Utwórz',
  iconLabel: 'Ikona:',
  deleteMealConfirmTitle: 'Usunąć posiłek?',
  deleteMealConfirmMsg: 'Czy na pewno chcesz usunąć ten posiłek i przypisane produkty?',
  deleteFoodFromDiaryTitle: 'Usunąć produkt z dziennika?',
  deleteFoodFromDiaryMsg: 'Wpis zostanie usunięty z wybranego posiłku.',
  ofNormShort: 'normy',
  noEntries: 'Brak wpisów',
  addToShoppingList: 'Dodaj do listy zakupów',

  // Extended FoodLibraryTab keys
  perGrams: 'na',
  addProductCardTitle: 'Dodawanie produktu do bazy',
  addProductCardSub: 'Wybierz metodę: AI wg nazwy, zdjęcie etykiety, zdjęcie dania lub ręcznie',
  addNewProductToLibraryBtn: 'Dodaj nowy produkt do bazy',
  saveToLibraryBtn: 'Zapisz produkt w bazie',
  addToDiaryTitle: 'Dodaj do dziennego menu',
  mealCategorySelectLabel: 'Do którego posiłku dodać?',
  portionWeightGramsLabel: 'Waga Twojej porcji (w gramach):',
  totalCaloriesPreview: 'Razem w porcji:',
  logToDiaryBtn: 'Dodaj do dziennika',
  deleteProductConfirmTitle: 'Usunąć produkt z bazy?',
  deleteProductConfirmMsg: 'Produkt zostanie usunięty z Twojej bazy produktów.',

  // Extended RecipesTab keys
  shareRecipesAndMenu: 'Eksport / Import',
  vesselsCountShort: 'naczyn.',
  finishedDish: 'Gotowe danie:',
  dishYield: 'Wydajność:',
  editRecipe: 'Edytuj przepis',
  newRecipe: 'Nowy przepis',
  per100gFinished: 'Makro na 100 g gotowego dania',
  ingredientsLabel: 'Składniki przepisu',
  cookingTimeline: 'Oś czasu i fizyka gotowania',
  evaporatedLabel: 'odparowało',
  timeLabel: 'Czas:',
  yieldShortLabel: 'Wyjście:',
  startAtLabel: 'Start:',
  stepLabel: 'Krok',
  cookingContentsInVessel: 'Zawartość w tym naczyniu:',
  aiAnalysisLabel: 'Kulinarna analiza AI',
  cookButton: 'Gotuj',
  editButton: 'Edytuj',
  toDiaryButton: 'Do dziennika',
  modeWithAi: 'Z pomocą AI',
  modeStepByStep: 'Pełne gotowanie',
  modeSimpleList: 'Prosta lista',
  aiRecipeHeading: 'Inteligentny generator przepisów AI',
  aiRecipeDescription: 'Wpisz nazwę dania i szczegóły — AI dobierze składniki, naczynia i oś czasu.',
  dishNamePromptLabel: 'Nazwa dania i wskazówki',
  dishNamePromptPlaceholder: 'Np. Domowy barszcz ukraiński z wołowiną...',
  generatingSteps: 'AI tworzy przepis...',
  generateStepsWithAi: 'Wygeneruj z AI',
  recipeNameLabel: 'Nazwa przepisu',
  recipeIngredientsTitle: 'Składniki przepisu (z bazy)',
  removeFromRecipe: 'Usuń z przepisu',
  selectIngredientFromLibrary: 'Dodaj składnik z bazy produktów:',
  searchLibraryPlaceholder: 'Szukaj produktu w bazie...',
  addedIngredientsAndWeight: 'Dodane składniki i waga (w gramach):',
  noIngredientsSelected: 'Nie wybrano jeszcze żadnych składników z bazy.',
  saveChangesButton: 'Zapisz zmiany',
  saveRecipeButton: 'Zapisz przepis',
  deleteRecipeConfirmTitle: 'Usunąć przepis?',
  deleteRecipeConfirmMsg: 'Przepis zostanie usunięty z Twojej listy przepisów.',

  // Extended ShoppingListTab keys
  shoppingListTitle: 'Lista zakupów',
  shoppingListSubtitle: 'Produkty, które musisz kupić w sklepie',
  shoppingListEmptyTitle: 'Lista zakupów jest pusta',
  shoppingListEmptyHint: 'Dodawaj produkty z bazy, dziennego menu lub przepisów za pomocą ikony koszyka.',
  addFromLibraryBtn: 'Dodaj produkt z bazy',
  shoppingQuantityPlaceholder: 'Ile kupić (np. 500 g, 2 szt.)',
  selectProductForShoppingTitle: 'Dodaj produkt do listy zakupów',
  selectProductForShoppingHint: 'Wybierz produkt z bazy i wpisz potrzebną ilość',
  nothingFoundInLibrary: 'Nic nie znaleziono w bazie',
  selectedBadge: 'Wybrano',
  selectBadge: 'Wybierz',
  productLabel: 'Wybrany produkt:',
  howMuchToBuyLabel: 'Ile kupić (waga, sztuki, opakowania):',
  addToListButton: 'Dodaj do listy zakupów',

  // Extended Language & Settings keys
  addLanguageBtn: '+ Dodaj język',
  selectLanguageHeader: 'Wybór języka',
  aboutAppBtn: 'O aplikacji',
  secBalanceTitle: 'Bilans zapytań AI i klucz',
  infoBtn: 'Informacja',
  topUpEnterKeyBtn: 'Doładuj / Wpisz klucz',
  secSoundSettings: 'Ustawienia dźwięku',
  secSoundSettingsSub: 'Wybierz melodie dla minutnika gotowania i przypomnień o posiłkach, głośność i wibracje',
  secExportImport: 'Eksport i Import',
  secExportImportSub: 'Import przepisów oraz eksport i import dziennego menu na inny dzień lub do udostępnienia',
  secFeedback: 'Kontakt i opinie',
  secFeedbackSub: 'Pytania, sugestie lub wsparcie przez Telegram i Email',

  // Toast notifications & popups
  toastUpdatedPrefix: 'Zaktualizowano:',
  toastProfileAdded: 'Profil „{name}” dodany!',
  toastProfileDeleted: 'Profil „{name}” usunięty',
  toastAddedToShoppingList: '„{name}” dodano do listy zakupów!',
  toastProgramRestored: 'Ustawienia fabryczne zostały w pełni przywrócone!',
  toastKeyActivationFailed: 'Nie udało się aktywować klucza z linku',
  toastMasterKeyActivated: 'Klucz główny aktywowany! Pełny brak limitów.',
  toastKeyActivatedCarryover: 'Klucz aktywowany! Pozostałe (+{carry}) dodano do 500 → dostępne: {total}',
  toastKeyPackageActivated: 'Pakiet 500 zapytań AI został aktywowany! (Dostępne: {total})',
  toastKeyActivatedRemaining: 'Klucz aktywowany! Dostępne zapytania AI: {remaining} z {limit}.',
  toastPreviousSettingsRestored: 'Przywrócono poprzednie ustawienia',
  toastPortionWeightChanged: 'Zmieniono wagę porcji: {grams} g',
  toastMealsAddedFromChat: 'Dodano {count} dań z czatu do dziennika!',
  toastCustomMealAddedForDay: 'Dodatkowy posiłek „{name}” dodany na ten dzień',
  toastCustomMealDeleted: 'Dodatkowy posiłek usunięty',
  toastMealDeletedFromSchedule: 'Posiłek usunięty z harmonogramu',
  toastNutrientOrderUpdated: 'Kolejność składników zaktualizowana',
  toastNutrientShownOnMain: 'Składnik wyświetlony na ekranie głównym',
  toastNutrientHiddenFromMain: 'Składnik ukryty z ekranu głównego',
  toastNutrientMovedToPrimary: 'Składnik przeniesiony do Głównych',
  toastNutrientMovedToSecondary: 'Składnik przeniesiony do Dodatkowych',
  toastNewNutrientAdded: 'Dodano nowy składnik: {name}',
  toastDailyMenuCopied: 'Dzienne menu ({date}) skopiowano do schowka!',
  toastNutrientSettingsUpdated: 'Ustawienia składników odżywczych zaktualizowane',
  toastProductUpdatedInLibrary: 'Produkt „{name}” zaktualizowany w bazie!',
  toastProductAddedToLibrary: 'Produkt „{name}” dodany do bazy!',
  toastFoodLoggedToDiary: '„{name}” ({grams}g) zapisano w dzienniku!',
  toastRecipeChangesSaved: 'Zmiany w przepisie „{name}” zapisane!',
  toastRecipeSaved: 'Przepis „{name}” zapisany!',
  toastRecipeCopied: 'Przepis „{name}” skopiowano do schowka!',
  toastCircularViewEnabled: 'Włączono widok kołowy dziennej normy',
  toastCompactBarsEnabled: 'Włączono kompaktowe paski składników',
  toastDailyNormUpdated: 'Dzienna norma kalorii i makroskładników zaktualizowana!',
  toastGoalModeSwitched: 'Tryb celu przełączony: {mode}',
  goalModeLose: 'Redukcja',
  goalModeGain: 'Budowa masy',
  goalModeMaintain: 'Utrzymanie',
  toastMealsOrderUpdated: 'Lista i kolejność posiłków zaktualizowana!',
  toastResetToDefaults: 'Przywrócono ustawienia fabryczne',
  toastNutrientVisibilityUpdated: 'Widoczność składnika zmieniona',
  toastNutrientPriorityUpdated: 'Priorytet składnika zmieniony',
  toastNutrientParamsUpdated: 'Parametry składnika zaktualizowane',
  toastNutrientDeleted: 'Składnik usunięty',
  toastMealParamsUpdated: 'Parametry posiłku zaktualizowane',
  toastMealTimeReminderUpdated: 'Godzina i przypomnienie posiłku zaktualizowane',

  // Person & Profile popups
  addPersonTitle: 'Dodaj osobę',
  personNamePlaceholder: 'Imię osoby...',
  deletePersonTitle: 'Usuń osobę',

  // FoodLibrary Add/Edit Product & Nutrient Visibility Modals
  editProductModalTitle: 'Edytuj produkt',
  addProductModalTitle: 'Dodaj produkt do bazy',
  editProductModalSub: 'Ręczna zmiana nazwy i składników odżywczych produktu',
  addProductAiNameSub: 'Obliczanie wszystkich składników przez AI wg nazwy',
  addProductPhotoLabelSub: 'Rozpoznawanie makro ze zdjęcia etykiety + witaminy wg nazwy',
  addProductPhotoDishSub: 'Szacunkowa ocena gotowego dania ze zdjęcia',
  addProductManualSub: 'Ręczne wprowadzanie wszystkich wartości',
  foodNameMandatoryLabel: 'Nazwa produktu / dania *',
  mandatoryBadge: '(wymagane)',
  foodNameInputPlaceholder: 'np. Twaróg 5%, Baton proteinowy, Barszcz...',
  photoLabelHeading: 'Zdjęcie etykiety z makro',
  photoDishHeading: 'Zdjęcie talerza z jedzeniem',
  replacePhotoBtn: 'Zmień zdjęcie',
  chooseFileCameraBtn: 'Wybierz plik / aparat',
  geminiAnalyzingPhoto: 'AI analizuje zdjęcie...',
  recognizeWithGeminiBtn: 'Rozpoznaj ze zdjęcia',
  aiCalculatingNutrients: 'AI oblicza składniki...',
  calculateMacrosByNameBtn: 'Oblicz makro i witaminy wg nazwy',
  defaultPortionWeightLabel: 'Waga porcji (gramy, domyślnie 100 g)',
  coreNutrientsTitle: 'Główne składniki (Makro)',
  mandatoryPluralBadge: 'wymagane',
  additionalNutrientsTitle: 'Dodatkowe składniki',
  filledCountBadge: 'wypełniono:',
  availableCountBadge: 'dostępnych',
  collapseBtn: 'Zwiń',
  expandBtn: 'Rozwiń',
  vitaminsAndMineralsTitle: 'Witaminy, minerały i inne składniki',
  inFormCountSuffix: 'w formularzu',
  addNutrientToProductTitle: 'Dodaj składnik do produktu:',
  selectFromExistingNutrients: 'Wybierz z istniejących składników:',
  nutrientNotFoundQuestion: 'Brak szukanego składnika na liście?',
  createNewNutrientBtn: '+ Utwórz nowy składnik',
  creatingNewNutrientTitle: 'Tworzenie nowego składnika',
  backToSelectionBtn: '← Powrót do wyboru',
  nutrientNameRequiredLabel: 'Nazwa składnika *',
  unitLabel: 'Jednostka',
  colorLabel: 'Kolor:',
  createAndAttachBtn: 'Utwórz i przypisz',
  removeNutrientFromProductTitle: 'Usuń składnik z tego produktu',
  noAdditionalNutrientsSelected: 'Nie wybrano dodatkowych składników. Kliknij „+ Dodaj składnik” powyżej.',
  errEnterNutrientName: 'Wpisz nazwę składnika',
  errEnterFoodNameForAi: 'Wpisz nazwę produktu przed analizą AI!',
  errFailedToCalculateNutrients: 'Nie udało się obliczyć składników',
  errEnterFoodNameForPhoto: 'Wpisz nazwę produktu przed analizą zdjęcia!',
  errUploadPhotoFirst: 'Prześlij lub zrób zdjęcie!',
  errPhotoRecognitionFailed: 'Błąd rozpoznawania zdjęcia',
  errFoodNameRequiredToSave: 'Nie można zapisać produktu bez podania nazwy!',
  nutrientCardsModalTitle: 'Wyświetlanie składników na kartach',
  nutrientCardsModalSub: 'Ustaw, co pokazywać w 2. i 3. wierszu kart produktów',
  nutrientCardsRow1Title: 'Wiersz 1 (bazowy):',
  nutrientCardsRow1Desc: 'Kalorie, Białka, Tłuszcze i Węglowodany są zawsze przypięte i wyświetlane jako pierwsze.',
  nutrientCardsRow2Title: 'Wiersze 2 i 3:',
  nutrientCardsRow2Desc: 'Włączaj lub ukrywaj dodatkowe składniki na kartach produktów, aby pozostały czytelne i kompaktowe.',
  alwaysInRow1Badge: 'Zawsze w w. 1',
  showBtn: 'Pokazuj',
  hideBtn: 'Ukryj',

  // ResetConfirmModal & ConfigJsonModal
  resetModalTitle: 'Przywracanie ustawień fabrycznych',
  resetModalSubtitle: 'Reset wszystkich ustawień do stanu początkowego',
  resetModalWhatRestored: 'Co zostanie przywrócone:',
  resetModalItem1: 'Wszystkie domyślne cele kalorii i makroskładników (2200 kcal, 140g białka itd.)',
  resetModalItem2: 'Podstawowe posiłki (Śniadanie, Obiad, Kolacja, Przekąska)',
  resetModalItem3: 'Chronione języki: Rosyjski, Angielski, Polski',
  resetModalItem4: 'Oryginalny ciemny motyw i szmaragdowy akcent',
  resetModalItem5: 'Wszystkie standardowe przełączniki sekcji interfejsu',
  resetModalClearLogsLabel: 'Wyczyść także dziennik żywienia (zapisane posiłki)',
  resetModalClearLogsHint: 'Jeśli odznaczone, Twoje zapisane posiłki i historia żywienia pozostaną nienaruszone.',
  resetModalConfirmBtn: 'Przywróć ustawienia',
  copiedBadge: 'Skopiowano!',
  copyBtn: 'Kopiuj',
  closeBtn: 'Zamknij',

  // Recipes & Cooking Timer Modal
  errEnterDishNameForAi: 'Wpisz nazwę dania (np. „Barszcz z wołowiną”, „Pilaw z kurczakiem” lub „Sałatka Cezar”).',
  aiChefRecipeReadyBanner: '✨ Szef AI rozpisał przepis „{name}”: naczyń — {vessels}, składników — {ingredients}. Możesz od razu zapisać przepis lub edytować dowolny krok.',
  errGenerateRecipeFailed: 'Błąd podczas generowania przepisu przez AI',
  shareRecipeBtnTitle: 'Udostępnij przepis (skopiuj kod)',
  timerPrepareByMinute: 'Przygotować do {min}. minuty',
  timerTestSoundTitle: 'Sprawdź dźwięk',
  timerStepCompleted: 'Krok {step} zakończony!',
  timerNextBtn: 'Dalej',
  timerFinishBtn: 'Zakończ',
  timerPauseBtn: 'Pauza',
  timerResumeBtn: 'Wznów',
  timerStartBtn: 'Start',
  timerResetStepTitle: 'Resetuj krok',
  errAllModelsOverloaded: 'Wszystkie modele AI są obecnie przeciążone (Gemini 3.5 Flash Lite → Gemini 3.1 Flash Lite → Gemini 2.5 Flash Lite → Gemini 2.0 Flash Lite). Zapytanie nie zostało pobrane, spróbuj ponownie za chwilę.',
};

export function getWaterProductName(langCode: string = 'ru', customWaterName?: string): string {
  if (customWaterName && customWaterName.trim()) {
    return customWaterName.trim();
  }
  const code = (langCode || 'ru').slice(0, 2).toLowerCase();
  if (code === 'ru') return 'Вода';
  if (code === 'pl') return 'Woda';
  return 'Water';
}

export function translateUnit(
  unit: string = '',
  langCode: string = 'ru',
  customUnits?: Record<string, string>
): string {
  const code = (langCode || 'ru').slice(0, 2).toLowerCase();
  const u = (unit || '').trim().toLowerCase();

  let canonicalKey = '';
  if (u === 'ккал' || u === 'kcal' || u === 'cal') canonicalKey = 'kcal';
  else if (u === 'г' || u === 'g' || u === 'гр') canonicalKey = 'g';
  else if (u === 'мг' || u === 'mg') canonicalKey = 'mg';
  else if (u === 'мкг' || u === 'mcg' || u === 'µg' || u === 'ug') canonicalKey = 'mcg';
  else if (u === 'мл' || u === 'ml') canonicalKey = 'ml';
  else if (u === 'ед' || u === 'units' || u === 'j.') canonicalKey = 'units';

  if (canonicalKey && customUnits && customUnits[canonicalKey]) {
    return customUnits[canonicalKey];
  }

  if (code === 'ru') {
    if (canonicalKey === 'kcal') return 'ккал';
    if (canonicalKey === 'g') return 'г';
    if (canonicalKey === 'mg') return 'мг';
    if (canonicalKey === 'mcg') return 'мкг';
    if (canonicalKey === 'ml') return 'мл';
    if (canonicalKey === 'units') return 'ед';
  } else if (code === 'pl') {
    if (canonicalKey === 'kcal') return 'kcal';
    if (canonicalKey === 'g') return 'g';
    if (canonicalKey === 'mg') return 'mg';
    if (canonicalKey === 'mcg') return 'µg';
    if (canonicalKey === 'ml') return 'ml';
    if (canonicalKey === 'units') return 'j.';
  } else {
    if (canonicalKey === 'kcal') return 'kcal';
    if (canonicalKey === 'g') return 'g';
    if (canonicalKey === 'mg') return 'mg';
    if (canonicalKey === 'mcg') return 'mcg';
    if (canonicalKey === 'ml') return 'ml';
    if (canonicalKey === 'units') return 'units';
  }
  return unit;
}

export function getUITranslations(
  langCode: string = 'ru',
  customLabels?: Partial<LocalizationLabels>
): ExtendedLocalizationLabels {
  const code = (langCode || 'ru').slice(0, 2).toLowerCase();
  let base: ExtendedLocalizationLabels;

  if (code === 'ru') {
    base = COMPLETE_RUSSIAN_LABELS;
  } else if (code === 'pl') {
    base = COMPLETE_POLISH_LABELS;
  } else {
    base = COMPLETE_ENGLISH_LABELS;
  }

  if (!customLabels) {
    return base;
  }

  return {
    ...base,
    ...customLabels,
  };
}

export function getDateLocale(langCode: string = 'ru'): string {
  const code = (langCode || 'ru').slice(0, 2).toLowerCase();
  if (code === 'pl') return 'pl-PL';
  if (code === 'en') return 'en-US';
  if (code === 'ru') return 'ru-RU';
  return code;
}
