import React, { useState } from 'react';
import {
  RecipeItem,
  RecipeIngredient,
  LibraryFoodItem,
  MetricConfig,
  LocalizationLabels,
  CookwareVessel,
  CookingStepItem,
  CookingProcessConfig,
  HeatSource,
  GasLevel,
  OvenMode,
} from '../types/config';
import { ThemeStyles, getBorderRadiusClass } from '../utils/themeHelper';
import { getUITranslations } from '../utils/translations';
import { getNutrientColor } from '../utils/nutrientColors';
import {
  BookOpen,
  Plus,
  Trash2,
  Search,
  X,
  ChefHat,
  ChevronDown,
  ChevronUp,
  Clock,
  Droplet,
  ArrowRight,
  Play,
  Pencil,
  Sparkles,
  Loader2,
  ShoppingCart,
  Share2,
  Check,
} from 'lucide-react';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { CookwareTimelineEditor } from './recipes/CookwareTimelineEditor';
import { CookingTimerModal } from './recipes/CookingTimerModal';
import { CookwareIcon } from './recipes/CookwareIcon';
import { DayLog } from '../types/config';
import {
  calculateOverallCookingPhysics,
  calculateVesselStepItems,
  findVesselTransferDestination,
  formatDurationMinutes,
  formatCompactDurationMinutes,
  formatRegimeBadgeText,
  isWaterFoodItem,
  isVesselTransferItem,
  isRegimeOnlyStepItem,
  getVesselDisplayIcon,
  getVesselDisplayName,
} from '../utils/culinaryPhysics';

interface RecipesTabProps {
  recipes: RecipeItem[];
  library: LibraryFoodItem[];
  metrics?: MetricConfig[];
  themeStyles: ThemeStyles;
  accentColor: string;
  borderRadius: string;
  langCode?: string;
  labels?: Partial<LocalizationLabels>;
  apiKey?: string;
  aiConfig?: any;
  currentDateStr?: string;
  dayLogs?: Record<string, DayLog>;
  onSaveRecipe: (recipe: RecipeItem) => void;
  onDeleteRecipe: (recipeId: string) => void;
  onAddLibraryItems?: (items: LibraryFoodItem[]) => void;
  onRemoveLibraryItems?: (foodIds: string[]) => void;
  onLogRecipeToDay: (recipe: RecipeItem, servings: number) => void;
  onAddToShoppingList?: (item: { name: string; quantity?: string; foodId?: string }) => void;
  onShareRecipe?: (recipe: RecipeItem) => void;
  onImportSharedData?: (data: {
    recipes?: RecipeItem[];
    libraryItems?: LibraryFoodItem[];
    dayLogs?: Record<string, DayLog>;
  }) => void;
}

export const RecipesTab: React.FC<RecipesTabProps> = ({
  recipes,
  library,
  metrics,
  themeStyles,
  accentColor,
  borderRadius,
  langCode = 'ru',
  labels,
  aiConfig,
  onSaveRecipe,
  onDeleteRecipe,
  onAddLibraryItems,
  onRemoveLibraryItems,
  onLogRecipeToDay,
  onAddToShoppingList,
  onShareRecipe,
}) => {
  const radiusClass = getBorderRadiusClass(borderRadius);
  const t = getUITranslations(langCode, labels);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [copiedRecipeId, setCopiedRecipeId] = useState<string | null>(null);
  const [editingRecipeId, setEditingRecipeId] = useState<string | null>(null);
  const [expandedRecipeIds, setExpandedRecipeIds] = useState<Record<string, boolean>>({});
  const [activeTimerRecipe, setActiveTimerRecipe] = useState<RecipeItem | null>(null);

  // Delete Recipe modal state
  const [deleteRecipeModal, setDeleteRecipeModal] = useState<{
    isOpen: boolean;
    id: string;
    name: string;
  }>({
    isOpen: false,
    id: '',
    name: '',
  });

  // Modal Creation Mode: 'ai' | 'culinary' | 'simple'
  const [creationMode, setCreationMode] = useState<'ai' | 'culinary' | 'simple'>('culinary');

  // New Recipe Form State (no servings field — calculated per 100g of finished dish)
  const [recipeName, setRecipeName] = useState('');
  const [selectedIngredients, setSelectedIngredients] = useState<RecipeIngredient[]>([]);
  const [ingredientGramsStr, setIngredientGramsStr] = useState<Record<string, string>>({});
  const [ingredientSearch, setIngredientSearch] = useState('');

  // AI Recipe Generator State
  const [aiDishPrompt, setAiDishPrompt] = useState('');
  const [isGeneratingAiRecipe, setIsGeneratingAiRecipe] = useState(false);
  const [aiRecipeError, setAiRecipeError] = useState<string | null>(null);
  const [aiRecipeSuccessBanner, setAiRecipeSuccessBanner] = useState<string | null>(null);
  const [localGeneratedLibrary, setLocalGeneratedLibrary] = useState<LibraryFoodItem[]>([]);
  const [sessionAiCreatedFoodIds, setSessionAiCreatedFoodIds] = useState<string[]>([]);

  // Culinary Detailed Cooking State (empty name by default so user types manually)
  const [cookingVessels, setCookingVessels] = useState<CookwareVessel[]>([
    {
      id: 'vessel-1',
      name: '',
      icon: '🍲',
      type: 'custom',
      heatSource: 'electric',
      electricLevel: 3,
      gasLevel: 'low',
      waterAddedMl: 0,
      stepItems: [],
    },
  ]);

  const [cookingProcessConfig, setCookingProcessConfig] = useState<CookingProcessConfig>({
    isEnabled: true,
    vessels: [],
    rawWeightGrams: 0,
    evaporatedWaterMl: 0,
    weightDeltaGrams: 0,
    finalDishWeightGrams: 0,
  });

  // Ensure default "Вода" product with 0 nutrients and any newly AI-generated products are always in the library
  const enrichedLibrary: LibraryFoodItem[] = React.useMemo(() => {
    const merged = [...library];
    localGeneratedLibrary.forEach((genItem) => {
      if (
        !merged.some(
          (m) =>
            m.id === genItem.id ||
            m.name.trim().toLowerCase() === genItem.name.trim().toLowerCase()
        )
      ) {
        merged.push(genItem);
      }
    });
    const hasWater = merged.some((item) => isWaterFoodItem(item.id, item.name));
    if (hasWater) return merged;
    const waterItem: LibraryFoodItem = {
      id: 'lib-water',
      name: t.waterProductName,
      servingSizeGrams: 100,
      nutrients: { calories: 0, proteins: 0, fats: 0, carbs: 0 },
      category: 'drink',
      createdAt: 0,
      source: 'preset',
    };
    return [waterItem, ...merged];
  }, [library, localGeneratedLibrary, t.waterProductName]);

  const toggleRecipeExpanded = (id: string) => {
    setExpandedRecipeIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredRecipes = recipes.filter((r) =>
    r.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const availableLibrary = enrichedLibrary.filter((f) =>
    f.name.toLowerCase().includes(ingredientSearch.toLowerCase())
  );

  const handleAddIngredient = (food: LibraryFoodItem) => {
    const existing = selectedIngredients.find((i) => i.foodId === food.id);
    if (existing) return;

    const defaultWeight = isWaterFoodItem(food.id, food.name) ? 1000 : 100;
    setSelectedIngredients((prev) => [
      ...prev,
      {
        foodId: food.id,
        foodName: food.name,
        grams: defaultWeight,
        nutrientsPer100g: food.nutrients,
      },
    ]);
  };

  const handleUpdateIngredientGrams = (foodId: string, grams: number) => {
    setSelectedIngredients((prev) =>
      prev.map((i) => (i.foodId === foodId ? { ...i, grams } : i))
    );
  };

  // Purge a newly AI-created product from both localGeneratedLibrary and global library
  const handlePurgeAiCreatedFoodFromLibrary = (foodId: string) => {
    setLocalGeneratedLibrary((prev) => prev.filter((item) => item.id !== foodId));
    setSessionAiCreatedFoodIds((prev) => prev.filter((id) => id !== foodId));
    onRemoveLibraryItems?.([foodId]);
  };

  // Remove ingredient from the current recipe (both ingredients list and any steps in vessels),
  // and if it was just created by AI for this unsaved recipe, automatically delete it from the library
  const handleRemoveIngredient = (foodId: string) => {
    const nextIngredients = selectedIngredients.filter((i) => i.foodId !== foodId);
    setSelectedIngredients(nextIngredients);

    const nextVessels = cookingVessels.map((v) => ({
      ...v,
      stepItems: (v.stepItems || []).filter((s) => s.foodId !== foodId),
    }));
    setCookingVessels(nextVessels);

    const livePhys = calculateOverallCookingPhysics(nextVessels, nextIngredients);
    setCookingProcessConfig((prev) => ({
      ...prev,
      vessels: nextVessels,
      rawWeightGrams: livePhys.rawWeightGrams,
      evaporatedWaterMl: livePhys.evaporatedWaterMl,
      weightDeltaGrams: livePhys.weightDeltaGrams,
      finalDishWeightGrams: livePhys.finalDishWeightGrams,
    }));

    if (sessionAiCreatedFoodIds.includes(foodId)) {
      handlePurgeAiCreatedFoodFromLibrary(foodId);
    }
  };

  // Cancel / close the modal: if this is an unsaved recipe, clean up any AI-created products from this session
  const handleCloseCreateModal = () => {
    if (!editingRecipeId && sessionAiCreatedFoodIds.length > 0) {
      const idsToClean = [...sessionAiCreatedFoodIds];
      setLocalGeneratedLibrary((prev) => prev.filter((item) => !idsToClean.includes(item.id)));
      setSessionAiCreatedFoodIds([]);
      onRemoveLibraryItems?.(idsToClean);
    }
    setEditingRecipeId(null);
    setIsCreateModalOpen(false);
  };

  // Calculate total and per-100g of finished dish nutrients
  const calculateNutrients = () => {
    const total: Record<string, number> = {};
    let rawTotalGrams = 0;

    selectedIngredients.forEach((ing) => {
      rawTotalGrams += ing.grams;
      if (!isWaterFoodItem(ing.foodId, ing.foodName)) {
        const factor = ing.grams / 100;
        Object.entries(ing.nutrientsPer100g || {}).forEach(([k, v]) => {
          total[k] = (total[k] || 0) + (v || 0) * factor;
        });
      }
    });

    const livePhysics =
      creationMode === 'culinary'
        ? calculateOverallCookingPhysics(cookingVessels, selectedIngredients)
        : null;

    const finalGrams =
      creationMode === 'culinary' && livePhysics && livePhysics.finalDishWeightGrams > 0
        ? livePhysics.finalDishWeightGrams
        : rawTotalGrams;

    const per100g: Record<string, number> = {};
    const denom = Math.max(1, finalGrams);
    Object.entries(total).forEach(([k, v]) => {
      per100g[k] = Math.round(((v || 0) / denom) * 100 * 10) / 10;
    });

    return {
      total,
      per100g,
      totalGrams: finalGrams,
      rawTotalGrams: livePhysics ? livePhysics.rawWeightGrams : rawTotalGrams,
      totalTimeMinutes: livePhysics ? livePhysics.totalRecipeTimeMinutes : 0,
    };
  };

  const {
    total: totalNutrients,
    per100g: per100gNutrients,
    totalGrams,
    rawTotalGrams,
    totalTimeMinutes,
  } = calculateNutrients();

  const getRecipeNutrientsPer100g = (recipe: RecipeItem): Record<string, number> => {
    if (recipe.nutrientsPer100g && Object.keys(recipe.nutrientsPer100g).length > 0) {
      return recipe.nutrientsPer100g;
    }
    const weight = Math.max(1, recipe.totalGrams || recipe.rawGrams || 100);
    const per100: Record<string, number> = {};
    Object.entries(recipe.totalNutrients || {}).forEach(([k, val]) => {
      per100[k] = Math.round(((val || 0) / weight) * 100 * 10) / 10;
    });
    return per100;
  };

  const handleOpenCreateModal = () => {
    setEditingRecipeId(null);
    setRecipeName('');
    setAiDishPrompt('');
    setAiRecipeError(null);
    setAiRecipeSuccessBanner(null);
    setSessionAiCreatedFoodIds([]);
    setSelectedIngredients([]);
    setIngredientGramsStr({});
    setCreationMode('culinary');
    setCookingVessels([
      {
        id: `vessel-${Date.now()}-1`,
        name: '',
        icon: '🍲',
        type: 'custom',
        heatSource: 'electric',
        electricLevel: 3,
        gasLevel: 'low',
        waterAddedMl: 0,
        stepItems: [],
      },
    ]);
    setCookingProcessConfig({
      isEnabled: true,
      vessels: [],
      rawWeightGrams: 0,
      evaporatedWaterMl: 0,
      weightDeltaGrams: 0,
      finalDishWeightGrams: 0,
    });
    setIsCreateModalOpen(true);
  };

  const handleGenerateRecipeWithAI = async (customDishName?: string) => {
    const targetDish = (customDishName ?? aiDishPrompt ?? recipeName).trim();
    if (!targetDish) {
      setAiRecipeError('Пожалуйста, впишите название блюда (например: «Борщ с говядиной», «Плов с курицей» или «Цезарь»).');
      return;
    }

    setIsGeneratingAiRecipe(true);
    setAiRecipeError(null);
    setAiRecipeSuccessBanner(null);

    try {
      const response = await fetch('/api/recipes/generate-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dishName: targetDish,
          library: enrichedLibrary.map((f) => ({ id: f.id, name: f.name })),
          metrics: metrics || [],
          aiConfig,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data?.recipe) {
        throw new Error(data?.error || 'Не удалось сгенерировать рецепт');
      }

      const gen = data.recipe;
      const generatedTitle = (gen.name && String(gen.name).trim()) || targetDish;
      setRecipeName(generatedTitle);
      setAiDishPrompt(generatedTitle);

      // 1. Resolve ingredients and match/create library food items
      const newLibraryItems: LibraryFoodItem[] = [];
      const resolvedIngredientsMap = new Map<string, RecipeIngredient>();

      const findOrCreateFood = (
        rawName: string,
        rawNutrients?: Record<string, number>,
        category?: string
      ): LibraryFoodItem => {
        const cleanName = String(rawName || 'Продукт').trim();
        if (isWaterFoodItem('', cleanName)) {
          const waterFound = enrichedLibrary.find((f) => isWaterFoodItem(f.id, f.name));
          if (waterFound) return waterFound;
        }

        const existingInLib = enrichedLibrary.find(
          (f) => f.name.trim().toLowerCase() === cleanName.toLowerCase()
        );
        if (existingInLib) return existingInLib;

        const existingInNew = newLibraryItems.find(
          (f) => f.name.trim().toLowerCase() === cleanName.toLowerCase()
        );
        if (existingInNew) return existingInNew;

        const safeNutrients: Record<string, number> = {
          calories: Math.max(0, Number(rawNutrients?.calories) || 0),
          proteins: Math.max(0, Number(rawNutrients?.proteins) || 0),
          fats: Math.max(0, Number(rawNutrients?.fats) || 0),
          carbs: Math.max(0, Number(rawNutrients?.carbs) || 0),
          fiber: Math.max(0, Number(rawNutrients?.fiber) || 0),
          ...(rawNutrients || {}),
        };

        const created: LibraryFoodItem = {
          id: `lib-ai-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: cleanName,
          servingSizeGrams: 100,
          nutrients: safeNutrients,
          category: category || 'custom',
          createdAt: Date.now(),
          source: 'ai_name',
        };
        newLibraryItems.push(created);
        return created;
      };

      if (Array.isArray(gen.ingredients)) {
        gen.ingredients.forEach((ing: any) => {
          if (!ing || !ing.foodName) return;
          const matchedFood = findOrCreateFood(
            ing.foodName,
            ing.nutrientsPer100g,
            ing.category
          );
          const grams = Math.max(1, Math.round(Number(ing.grams) || 100));
          const prev = resolvedIngredientsMap.get(matchedFood.id);
          if (prev) {
            resolvedIngredientsMap.set(matchedFood.id, {
              ...prev,
              grams: prev.grams + grams,
            });
          } else {
            resolvedIngredientsMap.set(matchedFood.id, {
              foodId: matchedFood.id,
              foodName: matchedFood.name,
              grams,
              nutrientsPer100g: matchedFood.nutrients,
            });
          }
        });
      }

      // 2. Normalize vessels and steps
      const rawVessels = Array.isArray(gen.vessels) && gen.vessels.length > 0 ? gen.vessels : [];
      const vesselIdMap = new Map<string, string>();
      rawVessels.forEach((v: any, idx: number) => {
        const origId = v.id || `vessel-${idx + 1}`;
        vesselIdMap.set(origId, `vessel-ai-${Date.now()}-${idx + 1}`);
      });

      // Reset ingredient accumulation from steps to ensure ingredients list accurately matches step weights
      const stepIngredientsTotals = new Map<string, { food: LibraryFoodItem; grams: number }>();

      const normalizedVessels: CookwareVessel[] = rawVessels.map((v: any, idx: number) => {
        const origId = v.id || `vessel-${idx + 1}`;
        const mappedVesselId = vesselIdMap.get(origId) || `vessel-ai-${Date.now()}-${idx + 1}`;
        const heatSource: HeatSource = (v.heatSource as HeatSource) || 'electric';
        const electricLevel = Math.max(1, Math.min(9, Number(v.electricLevel) || 5));
        const gasLevel: GasLevel = (v.gasLevel as GasLevel) || 'medium';
        const ovenTempC = Math.max(30, Math.min(350, Number(v.ovenTempC) || 180));
        const ovenMode: OvenMode = (v.ovenMode as OvenMode) || 'top_bottom';
        const hasLid = v.hasLid !== undefined ? Boolean(v.hasLid) : true;

        const rawSteps = Array.isArray(v.stepItems) ? v.stepItems : [];
        const stepItems: CookingStepItem[] = rawSteps.map((s: any, sIdx: number) => {
          const addedAtMinute = Math.max(0, Math.round(Number(s.addedAtMinute) || 0));
          const durationMinutes = Math.max(1, Math.round(Number(s.durationMinutes) || 10));
          const hasThermalProcessing =
            s.hasThermalProcessing !== undefined ? Boolean(s.hasThermalProcessing) : true;
          const isRegimeOnly = Boolean(s.isRegimeOnly);

          // Check if this step transfers another vessel's contents
          if (s.sourceVesselId || String(s.foodId || '').startsWith('vessel-transfer:')) {
            const rawSourceId =
              s.sourceVesselId || String(s.foodId).replace('vessel-transfer:', '');
            const targetSourceVesselId = vesselIdMap.get(rawSourceId) || rawSourceId;
            const sourceVesselObj = rawVessels.find(
              (rv: any, rIdx: number) =>
                (rv.id || `vessel-${rIdx + 1}`) === rawSourceId ||
                vesselIdMap.get(rv.id || `vessel-${rIdx + 1}`) === targetSourceVesselId
            );
            const sourceVesselTitle = sourceVesselObj?.name || 'Посуда 2';

            return {
              id: `step-ai-${Date.now()}-${idx}-${sIdx}`,
              foodId: `vessel-transfer:${targetSourceVesselId}`,
              foodName: s.foodName || `Содержимое: ${sourceVesselTitle}`,
              grams: Math.max(1, Math.round(Number(s.grams) || 250)),
              addedAtMinute,
              durationMinutes,
              sourceVesselId: targetSourceVesselId,
              hasThermalProcessing,
              stepHeatSource: hasThermalProcessing
                ? ((s.stepHeatSource as HeatSource) || heatSource)
                : undefined,
              stepElectricLevel: hasThermalProcessing
                ? Math.max(1, Math.min(9, Number(s.stepElectricLevel) || electricLevel))
                : undefined,
              stepGasLevel: hasThermalProcessing
                ? ((s.stepGasLevel as GasLevel) || gasLevel)
                : undefined,
              stepOvenTempC: hasThermalProcessing
                ? Math.max(30, Math.min(350, Number(s.stepOvenTempC) || ovenTempC))
                : undefined,
              stepOvenMode: hasThermalProcessing
                ? ((s.stepOvenMode as OvenMode) || ovenMode)
                : undefined,
              stepExtraMode: hasThermalProcessing ? s.stepExtraMode : undefined,
              stepHasLid: hasThermalProcessing
                ? s.stepHasLid !== undefined
                  ? Boolean(s.stepHasLid)
                  : hasLid
                : undefined,
            };
          }

          if (isRegimeOnly) {
            return {
              id: `step-ai-${Date.now()}-${idx}-${sIdx}`,
              foodId: '__regime_only__',
              foodName: 'Готовка содержимого в посуде',
              grams: 0,
              addedAtMinute,
              durationMinutes,
              isRegimeOnly: true,
              hasThermalProcessing,
              stepHeatSource: (s.stepHeatSource as HeatSource) || heatSource,
              stepElectricLevel: Math.max(
                1,
                Math.min(9, Number(s.stepElectricLevel) || electricLevel)
              ),
              stepGasLevel: (s.stepGasLevel as GasLevel) || gasLevel,
              stepOvenTempC: Math.max(30, Math.min(350, Number(s.stepOvenTempC) || ovenTempC)),
              stepOvenMode: (s.stepOvenMode as OvenMode) || ovenMode,
              stepExtraMode: s.stepExtraMode,
              stepHasLid: s.stepHasLid !== undefined ? Boolean(s.stepHasLid) : hasLid,
            };
          }

          // Standard ingredient step
          const ingFromGen = Array.isArray(gen.ingredients)
            ? gen.ingredients.find(
                (gi: any) =>
                  String(gi.foodName || '').trim().toLowerCase() ===
                  String(s.foodName || '').trim().toLowerCase()
              )
            : undefined;

          const matchedFood = findOrCreateFood(
            s.foodName || 'Вода',
            ingFromGen?.nutrientsPer100g,
            ingFromGen?.category
          );
          const grams = Math.max(1, Math.round(Number(s.grams) || 100));

          const prevStepTotal = stepIngredientsTotals.get(matchedFood.id);
          stepIngredientsTotals.set(matchedFood.id, {
            food: matchedFood,
            grams: (prevStepTotal?.grams || 0) + grams,
          });

          return {
            id: `step-ai-${Date.now()}-${idx}-${sIdx}`,
            foodId: matchedFood.id,
            foodName: matchedFood.name,
            grams,
            addedAtMinute,
            durationMinutes,
            hasThermalProcessing,
            stepHeatSource: hasThermalProcessing
              ? ((s.stepHeatSource as HeatSource) || heatSource)
              : undefined,
            stepElectricLevel: hasThermalProcessing
              ? Math.max(1, Math.min(9, Number(s.stepElectricLevel) || electricLevel))
              : undefined,
            stepGasLevel: hasThermalProcessing
              ? ((s.stepGasLevel as GasLevel) || gasLevel)
              : undefined,
            stepOvenTempC: hasThermalProcessing
              ? Math.max(30, Math.min(350, Number(s.stepOvenTempC) || ovenTempC))
              : undefined,
            stepOvenMode: hasThermalProcessing
              ? ((s.stepOvenMode as OvenMode) || ovenMode)
              : undefined,
            stepExtraMode: hasThermalProcessing ? s.stepExtraMode : undefined,
            stepHasLid: hasThermalProcessing
              ? s.stepHasLid !== undefined
                ? Boolean(s.stepHasLid)
                : hasLid
              : undefined,
          };
        });

        return {
          id: mappedVesselId,
          name: v.name || `Посуда ${idx + 1}`,
          icon: v.icon || (idx === 0 ? '🍲' : '🍳'),
          type: v.type || 'custom',
          heatSource,
          electricLevel,
          gasLevel,
          ovenTempC,
          ovenMode,
          hasLid,
          waterAddedMl: 0,
          startOffsetMinutes: idx === 0 ? 0 : Math.max(0, Math.round(Number(v.startOffsetMinutes) || 0)),
          stepItems,
        };
      });

      // Merge step ingredients into resolvedIngredientsMap so all step items exist in selectedIngredients
      stepIngredientsTotals.forEach(({ food, grams }, foodId) => {
        resolvedIngredientsMap.set(foodId, {
          foodId: food.id,
          foodName: food.name,
          grams,
          nutrientsPer100g: food.nutrients,
        });
      });

      const finalIngredients = Array.from(resolvedIngredientsMap.values());
      const nextGramsStr: Record<string, string> = {};
      finalIngredients.forEach((ing) => {
        nextGramsStr[ing.foodId] = String(ing.grams);
      });

      // Clean up any previous unsaved AI-created library items before adding the new ones
      if (sessionAiCreatedFoodIds.length > 0) {
        const prevIds = [...sessionAiCreatedFoodIds];
        setLocalGeneratedLibrary((prev) => prev.filter((item) => !prevIds.includes(item.id)));
        onRemoveLibraryItems?.(prevIds);
      }

      if (newLibraryItems.length > 0) {
        const createdIds = newLibraryItems.map((it) => it.id);
        setSessionAiCreatedFoodIds(createdIds);
        setLocalGeneratedLibrary((prev) => [...newLibraryItems, ...prev]);
        onAddLibraryItems?.(newLibraryItems);
      } else {
        setSessionAiCreatedFoodIds([]);
      }

      setSelectedIngredients(finalIngredients);
      setIngredientGramsStr(nextGramsStr);

      if (normalizedVessels.length > 0) {
        setCookingVessels(normalizedVessels);
        const physics = calculateOverallCookingPhysics(normalizedVessels, finalIngredients);
        setCookingProcessConfig({
          isEnabled: true,
          vessels: normalizedVessels,
          rawWeightGrams: physics.rawWeightGrams,
          evaporatedWaterMl: physics.evaporatedWaterMl,
          weightDeltaGrams: physics.weightDeltaGrams,
          finalDishWeightGrams: physics.finalDishWeightGrams,
          aiAnalysis: gen.aiAnalysis
            ? {
                note: gen.aiAnalysis.note || '',
                nutrientImpact: gen.aiAnalysis.nutrientImpact || '',
                chefTips: gen.aiAnalysis.chefTips || '',
                analyzedAt: Date.now(),
              }
            : undefined,
        });
      }

      setCreationMode('culinary');
      setAiRecipeSuccessBanner(
        `✨ ИИ-шеф расписал рецепт «${generatedTitle}»: посуд — ${normalizedVessels.length}, ингредиентов — ${finalIngredients.length}. Вы можете сразу сохранить рецепт или скорректировать любой шаг.`
      );
    } catch (err: any) {
      setAiRecipeError(err?.message || 'Ошибка при генерации рецепта с помощью ИИ');
    } finally {
      setIsGeneratingAiRecipe(false);
    }
  };

  const handleOpenEditModal = (recipe: RecipeItem) => {
    setEditingRecipeId(recipe.id);
    setRecipeName(recipe.name);
    const clonedIngredients = (recipe.ingredients || []).map((ing) => ({
      ...ing,
      nutrientsPer100g: { ...(ing.nutrientsPer100g || {}) },
    }));
    setSelectedIngredients(clonedIngredients);

    const gramsMap: Record<string, string> = {};
    clonedIngredients.forEach((ing) => {
      gramsMap[ing.foodId] = String(ing.grams);
    });
    setIngredientGramsStr(gramsMap);

    const hasCooking = Boolean(
      recipe.isDetailedCooking ||
        (recipe.cookingProcess &&
          recipe.cookingProcess.vessels &&
          recipe.cookingProcess.vessels.length > 0)
    );
    setCreationMode(hasCooking ? 'culinary' : 'simple');

    if (
      recipe.cookingProcess &&
      recipe.cookingProcess.vessels &&
      recipe.cookingProcess.vessels.length > 0
    ) {
      const clonedVessels: CookwareVessel[] = recipe.cookingProcess.vessels.map((v) => ({
        ...v,
        stepItems: (v.stepItems || []).map((s) => ({ ...s })),
      }));
      setCookingVessels(clonedVessels);
      setCookingProcessConfig({
        ...recipe.cookingProcess,
        vessels: clonedVessels,
      });
    } else {
      setCookingVessels([
        {
          id: `vessel-${Date.now()}-1`,
          name: '',
          icon: '🍲',
          type: 'custom',
          heatSource: 'electric',
          electricLevel: 3,
          gasLevel: 'low',
          waterAddedMl: 0,
          stepItems: [],
        },
      ]);
      setCookingProcessConfig({
        isEnabled: true,
        vessels: [],
        rawWeightGrams: recipe.rawGrams || recipe.totalGrams || 0,
        evaporatedWaterMl: 0,
        weightDeltaGrams: 0,
        finalDishWeightGrams: recipe.totalGrams || 0,
      });
    }

    setIsCreateModalOpen(true);
  };

  const handleSaveRecipe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipeName.trim()) return;
    const hasSteps =
      creationMode === 'culinary' && cookingVessels.some((v) => (v.stepItems || []).length > 0);
    if (selectedIngredients.length === 0 && !hasSteps) return;

    const isDetailed = creationMode === 'culinary';
    const livePhysics = isDetailed
      ? calculateOverallCookingPhysics(cookingVessels, selectedIngredients)
      : null;

    const computedYieldGrams =
      isDetailed && livePhysics && livePhysics.finalDishWeightGrams > 0
        ? livePhysics.finalDishWeightGrams
        : rawTotalGrams;

    const existingRecipe = editingRecipeId
      ? recipes.find((r) => r.id === editingRecipeId)
      : undefined;

    const newRecipe: RecipeItem = {
      id:
        editingRecipeId ||
        `recipe-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: recipeName.trim(),
      totalGrams: computedYieldGrams,
      rawGrams: livePhysics ? livePhysics.rawWeightGrams : rawTotalGrams,
      ingredients: selectedIngredients,
      totalNutrients,
      nutrientsPer100g: per100gNutrients,
      nutrientsPerServing: per100gNutrients,
      createdAt: existingRecipe?.createdAt || Date.now(),
      isDetailedCooking: isDetailed,
      cookingProcess: isDetailed
        ? {
            ...cookingProcessConfig,
            isEnabled: true,
            vessels: cookingVessels,
            rawWeightGrams: livePhysics?.rawWeightGrams || rawTotalGrams,
            evaporatedWaterMl: livePhysics?.evaporatedWaterMl || 0,
            weightDeltaGrams: livePhysics?.weightDeltaGrams || 0,
            finalDishWeightGrams: computedYieldGrams,
          }
        : undefined,
    };

    onSaveRecipe(newRecipe);
    setSessionAiCreatedFoodIds([]);
    setEditingRecipeId(null);
    setIsCreateModalOpen(false);
  };

  const handleShareSingleRecipe = async (recipe: RecipeItem) => {
    const neededFoodIds = new Set<string>();
    const neededFoodNames = new Set<string>();
    (recipe.ingredients || []).forEach((ing) => {
      if (ing.foodId) neededFoodIds.add(ing.foodId);
      if (ing.foodName) neededFoodNames.add(ing.foodName.trim().toLowerCase());
    });

    const bundledLibraryItems = library.filter(
      (item) =>
        neededFoodIds.has(item.id) ||
        neededFoodNames.has(item.name.trim().toLowerCase())
    );

    const payload = {
      type: 'pwa_calorie_share_v1',
      exportedAt: new Date().toISOString(),
      recipes: [recipe],
      libraryItems: bundledLibraryItems.length > 0 ? bundledLibraryItems : undefined,
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      setCopiedRecipeId(recipe.id);
      setTimeout(() => {
        setCopiedRecipeId((prev) => (prev === recipe.id ? null : prev));
      }, 2500);
    } catch {
      // ignore clipboard fallback
    }
    if (onShareRecipe) {
      onShareRecipe(recipe);
    }
  };

  const shareRecipeTitle =
    langCode?.startsWith('en')
      ? 'Share recipe (copy code)'
      : langCode?.startsWith('pl')
      ? 'Udostępnij przepis (skopiuj kod)'
      : 'Поделиться рецептом (скопировать код)';

  return (
    <div className="space-y-4">
      {/* Header & Create Recipe */}
      <div
        className={`border ${themeStyles.borderColor} ${themeStyles.cardBg} ${radiusClass} p-3.5 shadow-sm space-y-3`}
      >
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder={t.searchRecipesPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full min-h-[42px] pl-9 pr-3 py-2 bg-slate-900/60 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="flex-1 sm:flex-initial min-h-[42px] flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl text-white shadow-xs transition active:scale-95"
              style={{ backgroundColor: accentColor }}
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span className="truncate">{t.createRecipe}</span>
            </button>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 flex items-center justify-between">
          <span>
            {t.savedRecipesCount} <b>{recipes.length}</b>
          </span>
        </div>
      </div>

      {/* Recipes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredRecipes.map((recipe) => {
          const isExpanded = Boolean(expandedRecipeIds[recipe.id]);
          const hasCookingProcess = Boolean(
            recipe.cookingProcess && recipe.cookingProcess.vessels.length > 0
          );
          const recipePhysics = hasCookingProcess
            ? calculateOverallCookingPhysics(
                recipe.cookingProcess!.vessels,
                recipe.ingredients
              )
            : null;
          const totalRecipeMinutes = recipePhysics?.totalRecipeTimeMinutes || 0;

          return (
            <div
              key={recipe.id}
              className={`border ${themeStyles.borderColor} ${themeStyles.cardBg} ${radiusClass} p-4 shadow-xs flex flex-col justify-between hover:border-slate-600 transition-all`}
            >
              <div className="space-y-2.5">
                {/* Title & Delete */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-base"
                      style={{ backgroundColor: `${accentColor}25`, color: accentColor }}
                    >
                      {hasCookingProcess && recipe.cookingProcess?.vessels[0] ? (
                        <CookwareIcon
                          icon={getVesselDisplayIcon(recipe.cookingProcess.vessels[0])}
                          vesselName={recipe.cookingProcess.vessels[0].name}
                          className="w-5 h-5"
                        />
                      ) : (
                        <BookOpen className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className={`text-sm font-bold leading-snug break-words ${themeStyles.textPrimary}`}>
                          {recipe.name}
                        </h4>
                        {hasCookingProcess && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                            {recipe.cookingProcess?.vessels.length} {t.vesselsCountShort}
                          </span>
                        )}
                        {totalRecipeMinutes > 0 && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono tabular-nums font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            {formatCompactDurationMinutes(totalRecipeMinutes)}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {recipe.rawGrams && recipe.rawGrams !== recipe.totalGrams ? (
                          <span>
                            {t.finishedDish}{' '}
                            <b className="text-emerald-400">
                              {recipe.totalGrams}
                              {t.gramsShort}
                            </b>{' '}
                            ({t.rawLabel} {recipe.rawGrams}
                            {t.gramsShort})
                          </span>
                        ) : (
                          <span>
                            {t.dishYield}{' '}
                            <b className="text-emerald-400">
                              {recipe.totalGrams}
                              {t.gramsShort}
                            </b>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(recipe)}
                      className="p-2 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-slate-800/70 transition"
                      title={t.editRecipe}
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setDeleteRecipeModal({
                          isOpen: true,
                          id: recipe.id,
                          name: recipe.name,
                        })
                      }
                      className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-950/30 transition"
                      title={t.delete}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Per-100g of Finished Dish Macros Strip */}
                {(() => {
                  const per100 = getRecipeNutrientsPer100g(recipe);
                  return (
                    <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-center font-mono text-xs">
                      <div className="text-[10px] text-slate-400 mb-1 font-sans flex items-center justify-between gap-1">
                        <span className="truncate">{t.per100gFinished}</span>
                        <span className="text-[9px] text-slate-500 font-mono tabular-nums shrink-0">
                          100{t.gramsShort}
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-1 tabular-nums">
                        <div>
                          <span
                            className="font-bold transition-colors"
                            style={{ color: getNutrientColor('calories', metrics, '#f97316') }}
                          >
                            {Math.round(per100['calories'] || 0)}
                          </span>
                          <span className="text-[9px] text-slate-400 block">{t.kcalShort}</span>
                        </div>
                        <div>
                          <span
                            className="font-bold transition-colors"
                            style={{ color: getNutrientColor('proteins', metrics, '#3b82f6') }}
                          >
                            {Math.round((per100['proteins'] || 0) * 10) / 10}
                            {t.gramsShort}
                          </span>
                          <span className="text-[9px] text-slate-400 block">{t.protShort}</span>
                        </div>
                        <div>
                          <span
                            className="font-bold transition-colors"
                            style={{ color: getNutrientColor('fats', metrics, '#eab308') }}
                          >
                            {Math.round((per100['fats'] || 0) * 10) / 10}
                            {t.gramsShort}
                          </span>
                          <span className="text-[9px] text-slate-400 block">{t.fatShort}</span>
                        </div>
                        <div>
                          <span
                            className="font-bold transition-colors"
                            style={{ color: getNutrientColor('carbs', metrics, '#ef4444') }}
                          >
                            {Math.round((per100['carbs'] || 0) * 10) / 10}
                            {t.gramsShort}
                          </span>
                          <span className="text-[9px] text-slate-400 block">{t.carbShort}</span>
                        </div>
                      </div>

                      {/* Secondary Nutrients */}
                      {(() => {
                        if (!metrics) return null;
                        const CORE_METRIC_IDS = ['calories', 'proteins', 'fats', 'carbs'];
                        const visibleSecondary = metrics.filter(
                          (m) =>
                            !CORE_METRIC_IDS.includes(m.id) &&
                            m.id !== 'water' &&
                            m.showInProducts !== false &&
                            per100[m.id] !== undefined &&
                            per100[m.id] > 0
                        );

                        if (visibleSecondary.length === 0) return null;

                        const rows: MetricConfig[][] = [];
                        for (let i = 0; i < visibleSecondary.length; i += 4) {
                          rows.push(visibleSecondary.slice(i, i + 4));
                        }

                        return (
                          <div className="mt-1.5 space-y-1">
                            {rows.map((rowChunk, rIdx) => (
                              <div
                                key={rIdx}
                                className="grid grid-cols-4 gap-1 p-1 rounded-lg bg-slate-950/40 border border-slate-800/80 text-center font-mono tabular-nums text-[10px]"
                              >
                                {rowChunk.map((m) => {
                                  const val = per100[m.id] || 0;
                                  const formatted = Math.round(val * 10) / 10;
                                  return (
                                    <div key={m.id} className="min-w-0 px-0.5">
                                      <div className="text-[8px] text-slate-400 truncate" title={m.label}>
                                        {m.shortLabel || m.label}
                                      </div>
                                      <div
                                        className="font-bold truncate"
                                        style={{ color: m.color || getNutrientColor(m.id, metrics) }}
                                      >
                                        {formatted}
                                        {m.unit}
                                      </div>
                                    </div>
                                  );
                                })}
                                {Array.from({ length: 4 - rowChunk.length }).map((_, emptyIdx) => (
                                  <div key={`empty-${emptyIdx}`} className="min-w-0" />
                                ))}
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  );
                })()}

                {/* Ingredients list with per-ingredient Add to Shopping List button */}
                <div className="text-[11px] text-slate-400 space-y-1.5">
                  <span className="font-semibold text-slate-300 block">{t.ingredientsLabel}</span>
                  <div className="flex flex-wrap gap-1.5">
                    {recipe.ingredients.map((i, ingIdx) => (
                      <div
                        key={`${i.foodId}-${ingIdx}`}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/70 border border-slate-800 text-slate-200 text-[11px]"
                      >
                        <span className="break-words">
                          {i.foodName}{' '}
                          <b className="text-slate-400 font-mono">
                            ({i.grams}
                            {t.gramsShort})
                          </b>
                        </span>
                        {onAddToShoppingList && (
                          <button
                            type="button"
                            onClick={() =>
                              onAddToShoppingList({
                                name: i.foodName,
                                quantity: `${i.grams} ${t.gramsShort}`,
                                foodId: i.foodId,
                              })
                            }
                            className="p-1 rounded text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/15 transition active:scale-90"
                            title={t.addToShoppingList}
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Expandable Cookware & Cooking Instruction */}
                {hasCookingProcess && (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => toggleRecipeExpanded(recipe.id)}
                      className="w-full min-h-[38px] flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] text-amber-300 hover:text-white transition font-medium"
                    >
                      <span className="flex items-center gap-1.5">
                        <ChefHat className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>
                          {t.cookingTimeline}{' '}
                          {totalRecipeMinutes > 0 && `(${formatDurationMinutes(totalRecipeMinutes)})`}
                        </span>
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5 shrink-0" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 shrink-0" />
                      )}
                    </button>

                    {isExpanded && recipe.cookingProcess && (
                      <div className="mt-2 p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3 animate-in fade-in duration-150 text-xs">
                        {/* Physics Loss Bar */}
                        <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono p-2 rounded-lg bg-slate-900 border border-slate-800">
                          <span className="text-slate-400">
                            {t.rawLabel}:{' '}
                            <b>
                              {recipe.rawGrams || recipe.totalGrams}
                              {t.gramsShort}
                            </b>
                          </span>
                          {recipe.cookingProcess.evaporatedWaterMl > 0 && (
                            <span className="text-blue-400">
                              {t.evaporatedLabel}:{' '}
                              <b>
                                -{recipe.cookingProcess.evaporatedWaterMl}
                                {t.mlShort}
                              </b>
                            </span>
                          )}
                          {totalRecipeMinutes > 0 && (
                            <span className="text-amber-300">
                              {t.timeLabel}: <b>{formatDurationMinutes(totalRecipeMinutes)}</b>
                            </span>
                          )}
                          <span className="text-emerald-400 font-bold">
                            {t.yieldShortLabel}:{' '}
                            <b>
                              {recipe.totalGrams}
                              {t.gramsShort}
                            </b>
                          </span>
                        </div>

                        {/* Vessels Breakdown */}
                        {recipe.cookingProcess.vessels.map((vessel, vIdx) => {
                          const {
                            groupedSteps,
                            totalTimeMinutes: vesselTotalTime,
                            startOffsetMinutes,
                            cookingMode,
                          } = calculateVesselStepItems(vessel, vIdx);
                          const vIcon = getVesselDisplayIcon(vessel);
                          const vName = getVesselDisplayName(vessel, vIdx);
                          return (
                            <div
                              key={vessel.id}
                              className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800/90 space-y-2"
                            >
                              <div className="space-y-1 border-b border-slate-800 pb-1.5">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-bold text-white flex items-center gap-1.5 text-xs flex-1 min-w-0">
                                    <CookwareIcon
                                      icon={vIcon}
                                      vesselName={vessel.name}
                                      className="w-4 h-4"
                                    />
                                    <span className="truncate flex-1 min-w-0">{vName}</span>
                                  </span>
                                  <span className="text-[10px] font-mono tabular-nums text-amber-400 shrink-0 font-bold">
                                    {formatCompactDurationMinutes(vesselTotalTime)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span
                                    className={`px-1.5 py-0.5 rounded border text-[9px] font-bold shrink-0 ${cookingMode.badgeColor}`}
                                  >
                                    {cookingMode.label}
                                  </span>
                                  <span className="text-[9px] font-mono tabular-nums text-slate-400">
                                    {t.startAtLabel}: {vIdx === 0 ? '0' : startOffsetMinutes}m
                                  </span>
                                </div>
                              </div>

                              {/* Grouped Chronological steps */}
                              <div className="space-y-1.5">
                                {groupedSteps.map((group, gIdx) => (
                                  <div
                                    key={gIdx}
                                    className="p-1.5 rounded bg-slate-950/60 border border-slate-800/60 space-y-1"
                                  >
                                    <div className="flex flex-wrap items-center justify-between gap-1 text-[9px] text-amber-300 font-mono tabular-nums">
                                      <div className="flex items-center gap-1 flex-wrap">
                                        <span className="font-bold">
                                          {t.stepLabel} {gIdx + 1} ({group.recipeStartMinute}–{group.recipeEndMinute}m)
                                        </span>
                                        <span className="px-1 py-0.2 rounded bg-slate-900 border border-slate-800 text-slate-300">
                                          {group.regimeBadgeText}
                                        </span>
                                        <span
                                          className={`px-1 py-0.2 rounded border font-sans font-bold ${group.stepCookingMode.badgeColor}`}
                                        >
                                          {group.stepCookingMode.label}
                                        </span>
                                      </div>
                                      <span>{formatCompactDurationMinutes(group.durationMinutes)}</span>
                                    </div>
                                    <div className="space-y-0.5">
                                      {group.items.map((step, sIdx) => {
                                        const isTransfer = isVesselTransferItem(step);
                                        const isRegimeOnly = isRegimeOnlyStepItem(step);
                                        return (
                                          <div
                                            key={step.id || sIdx}
                                            className={`flex items-center justify-between text-[11px] ${
                                              isTransfer
                                                ? 'text-cyan-300 font-semibold'
                                                : isRegimeOnly
                                                ? 'text-slate-400 italic'
                                                : 'text-slate-200'
                                            }`}
                                          >
                                            <div className="flex items-center gap-1 min-w-0">
                                              {isWaterFoodItem(step.foodId, step.foodName) && (
                                                <Droplet className="w-3 h-3 text-blue-400 shrink-0" />
                                              )}
                                              <span className="truncate">
                                                {isRegimeOnly
                                                  ? t.cookingContentsInVessel
                                                  : `${step.foodName} (${
                                                      isTransfer
                                                        ? `~${step.grams}${t.gramsShort}`
                                                        : `${step.grams}${t.gramsShort}`
                                                    })`}
                                              </span>
                                            </div>
                                            <span className="text-[9px] font-mono tabular-nums text-slate-400 shrink-0">
                                              {formatCompactDurationMinutes(
                                                step.cumulativeDurationMinutes || step.durationMinutes
                                              )}
                                            </span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}

                        {/* Chef AI Analysis note */}
                        {recipe.cookingProcess.aiAnalysis && (
                          <div className="p-2.5 rounded-lg bg-purple-950/30 border border-purple-500/40 text-[11px] text-slate-200 space-y-1.5">
                            <div className="font-bold text-purple-300 flex items-center gap-1">
                              <ChefHat className="w-3.5 h-3.5" />
                              <span>{t.aiAnalysisLabel}</span>
                            </div>
                            <p className="leading-relaxed">{recipe.cookingProcess.aiAnalysis.note}</p>
                            {recipe.cookingProcess.aiAnalysis.nutrientImpact && (
                              <p className="text-purple-200/90 text-[10px]">
                                🔬 {recipe.cookingProcess.aiAnalysis.nutrientImpact}
                              </p>
                            )}
                            {recipe.cookingProcess.aiAnalysis.chefTips && (
                              <p className="text-amber-200/90 text-[10px]">
                                💡 {recipe.cookingProcess.aiAnalysis.chefTips}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons: "Готовить", "Изменить", "В дневник" in one row + square "Поделиться рецептом" in bottom-right corner */}
              <div className="pt-3 border-t border-slate-800/80 mt-3 flex items-center justify-between gap-1.5 flex-nowrap">
                <div className="grid grid-cols-3 gap-1.5 flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => setActiveTimerRecipe(recipe)}
                    className="min-h-[38px] flex items-center justify-center gap-1 px-2 py-1.5 text-[11px] sm:text-xs font-bold rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition active:scale-95 min-w-0"
                    title={t.cookButton}
                  >
                    <Play className="w-3.5 h-3.5 fill-current shrink-0" />
                    <span className="truncate">{t.cookButton}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(recipe)}
                    className="min-h-[38px] flex items-center justify-center gap-1 px-2 py-1.5 text-[11px] sm:text-xs font-bold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition active:scale-95 min-w-0"
                    title={t.editButton}
                  >
                    <Pencil className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{t.editButton}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onLogRecipeToDay(recipe, 1)}
                    className="min-h-[38px] flex items-center justify-center gap-1 px-2 py-1.5 text-[11px] sm:text-xs font-bold rounded-xl text-white shadow-xs transition active:scale-95 min-w-0"
                    style={{ backgroundColor: accentColor }}
                    title={t.toDiaryButton}
                  >
                    <Plus className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{t.toDiaryButton}</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleShareSingleRecipe(recipe)}
                  className={`w-[38px] h-[38px] min-h-[38px] min-w-[38px] aspect-square rounded-xl border flex items-center justify-center transition active:scale-95 shrink-0 ${
                    copiedRecipeId === recipe.id
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                      : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-emerald-400 hover:text-white'
                  }`}
                  title={shareRecipeTitle}
                >
                  {copiedRecipeId === recipe.id ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Share2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* CREATE RECIPE MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl border border-slate-700 bg-slate-900 rounded-2xl shadow-2xl p-4 sm:p-5 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <ChefHat className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white">
                  {editingRecipeId ? t.editRecipe : t.newRecipe}
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCloseCreateModal}
                className="p-2 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Creation Mode Switcher */}
            <div className="grid grid-cols-3 p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs gap-1">
              <button
                type="button"
                onClick={() => {
                  setCreationMode('ai');
                  setAiRecipeError(null);
                }}
                className={`min-h-[40px] py-1.5 px-1.5 rounded-lg font-bold flex items-center justify-center gap-1 text-center leading-tight transition ${
                  creationMode === 'ai'
                    ? 'bg-purple-500/25 text-purple-200 border border-purple-500/50 shadow-xs'
                    : 'text-purple-300/80 hover:text-purple-200 hover:bg-purple-950/40'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span className="text-[11px] sm:text-xs">{t.modeWithAi}</span>
              </button>
              <button
                type="button"
                onClick={() => setCreationMode('culinary')}
                className={`min-h-[40px] py-1.5 px-1.5 rounded-lg font-bold flex items-center justify-center gap-1 text-center leading-tight transition ${
                  creationMode === 'culinary'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span className="shrink-0">🍲</span>
                <span className="text-[11px] sm:text-xs">{t.modeStepByStep}</span>
              </button>
              <button
                type="button"
                onClick={() => setCreationMode('simple')}
                className={`min-h-[40px] py-1.5 px-1.5 rounded-lg font-bold flex items-center justify-center gap-1 text-center leading-tight transition ${
                  creationMode === 'simple'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span className="shrink-0">📝</span>
                <span className="text-[11px] sm:text-xs">{t.modeSimpleList}</span>
              </button>
            </div>

            {aiRecipeSuccessBanner && creationMode === 'culinary' && (
              <div className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/40 text-purple-200 text-xs flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>{aiRecipeSuccessBanner}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setAiRecipeSuccessBanner(null)}
                  className="text-purple-300 hover:text-white p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <form onSubmit={handleSaveRecipe} className="space-y-4 text-xs">
              {creationMode === 'ai' ? (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-950/50 via-slate-900 to-slate-950 border border-purple-500/40 space-y-3.5">
                  <div className="flex items-start gap-2.5">
                    <div className="p-2 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-300 shrink-0">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="text-sm font-bold text-white">{t.aiRecipeHeading}</h4>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        {t.aiRecipeDescription}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-purple-200 font-bold mb-1.5">
                      {t.dishNamePromptLabel}
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        placeholder={t.dishNamePromptPlaceholder}
                        value={aiDishPrompt}
                        onChange={(e) => {
                          setAiDishPrompt(e.target.value);
                          setRecipeName(e.target.value);
                          if (aiRecipeError) setAiRecipeError(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleGenerateRecipeWithAI();
                          }
                        }}
                        className="flex-1 min-h-[42px] px-3 py-2.5 rounded-xl bg-slate-900/90 border border-purple-500/40 text-white font-medium focus:outline-none focus:border-purple-400"
                      />
                      <button
                        type="button"
                        disabled={isGeneratingAiRecipe}
                        onClick={() => handleGenerateRecipeWithAI()}
                        className="min-h-[42px] px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-60 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-purple-950/50 transition active:scale-95 shrink-0"
                      >
                        {isGeneratingAiRecipe ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>{t.generatingSteps}</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            <span>{t.generateStepsWithAi}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {aiRecipeError && (
                    <div className="p-2.5 rounded-xl bg-red-950/50 border border-red-500/40 text-red-200 text-[11px]">
                      {aiRecipeError}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-slate-300 font-bold mb-1">{t.recipeNameLabel}</label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Classic Beef Borscht"
                      value={recipeName}
                      onChange={(e) => {
                        setRecipeName(e.target.value);
                        setAiDishPrompt(e.target.value);
                        if (aiRecipeError) setAiRecipeError(null);
                      }}
                      className="flex-1 min-h-[40px] px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-medium"
                    />
                    <button
                      type="button"
                      disabled={isGeneratingAiRecipe}
                      onClick={() => handleGenerateRecipeWithAI(recipeName)}
                      className="min-h-[40px] px-3 py-2 rounded-xl bg-purple-600/25 hover:bg-purple-600/40 border border-purple-500/40 text-purple-200 font-bold flex items-center justify-center gap-1.5 transition active:scale-95 shrink-0"
                    >
                      {isGeneratingAiRecipe ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-300" />
                          <span>{t.generatingSteps}</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-purple-300" />
                          <span>{t.generateStepsWithAi}</span>
                        </>
                      )}
                    </button>
                  </div>
                  {aiRecipeError && (
                    <div className="mt-1.5 p-2 rounded-lg bg-red-950/50 border border-red-500/40 text-red-200 text-[11px]">
                      {aiRecipeError}
                    </div>
                  )}
                </div>
              )}

              {/* DETAILED CULINARY MODE */}
              {creationMode === 'culinary' ? (
                <div className="space-y-3">
                  {/* Ingredients in this recipe with 'Удалить из рецепта' (auto-deletes AI-created products from library) */}
                  {selectedIngredients.length > 0 && (
                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-[11px] font-bold text-slate-300">
                          {t.recipeIngredientsTitle} ({selectedIngredients.length})
                        </span>
                      </div>
                      <div className="space-y-1.5 max-h-44 overflow-y-auto pr-0.5">
                        {selectedIngredients.map((ing) => {
                          const isAiCreated = sessionAiCreatedFoodIds.includes(ing.foodId);
                          return (
                            <div
                              key={ing.foodId}
                              className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px]"
                            >
                              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                {isWaterFoodItem(ing.foodId, ing.foodName) && (
                                  <Droplet className="w-3 h-3 text-blue-400 shrink-0" />
                                )}
                                <span className="font-medium text-slate-200 truncate">
                                  {ing.foodName}
                                </span>
                                <span className="text-emerald-400 font-mono text-[10px] shrink-0">
                                  ({ing.grams}
                                  {t.gramsShort})
                                </span>
                                {isAiCreated && (
                                  <span className="px-1.5 py-0.2 rounded bg-purple-500/20 border border-purple-500/30 text-purple-300 text-[9px] font-bold shrink-0">
                                    AI
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                {onAddToShoppingList && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onAddToShoppingList({
                                        name: ing.foodName,
                                        quantity: `${ing.grams} ${t.gramsShort}`,
                                        foodId: ing.foodId,
                                      })
                                    }
                                    className="p-1.5 rounded-md bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 transition active:scale-90"
                                    title={t.addToShoppingList}
                                  >
                                    <ShoppingCart className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveIngredient(ing.foodId)}
                                  className="px-2 py-1 rounded-md bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 text-red-300 hover:text-red-200 text-[10px] font-semibold flex items-center gap-1 shrink-0 transition"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>{t.removeFromRecipe}</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <CookwareTimelineEditor
                    vessels={cookingVessels}
                    library={enrichedLibrary}
                    ingredients={selectedIngredients}
                    accentColor={accentColor}
                    langCode={langCode}
                    aiConfig={aiConfig}
                    onChangeVessels={setCookingVessels}
                    onUpdateIngredients={setSelectedIngredients}
                    cookingProcessConfig={cookingProcessConfig}
                    onUpdateProcessConfig={setCookingProcessConfig}
                    sessionAiCreatedFoodIds={sessionAiCreatedFoodIds}
                    onRemoveAiCreatedFoodFromLibrary={handlePurgeAiCreatedFoodFromLibrary}
                  />
                </div>
              ) : creationMode === 'simple' ? (
                /* SIMPLE INGREDIENT LIST MODE */
                <div className="space-y-3">
                  {/* Add Ingredients from Library */}
                  <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/40 space-y-2">
                    <span className="font-bold text-slate-300 block">
                      {t.selectIngredientFromLibrary}
                    </span>
                    <input
                      type="text"
                      placeholder={t.searchLibraryPlaceholder}
                      value={ingredientSearch}
                      onChange={(e) => setIngredientSearch(e.target.value)}
                      className="w-full min-h-[38px] px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs mb-2"
                    />
                    <div className="max-h-36 overflow-y-auto space-y-1">
                      {availableLibrary.slice(0, 12).map((food) => (
                        <div
                          key={food.id}
                          className="flex items-center justify-between p-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-200"
                        >
                          <span className="flex items-center gap-1.5 truncate pr-2">
                            {isWaterFoodItem(food.id, food.name) && (
                              <Droplet className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                            )}
                            <span className="truncate">{food.name}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleAddIngredient(food)}
                            className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold shrink-0"
                          >
                            + {t.add}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Selected Ingredients List */}
                  <div className="space-y-2">
                    <span className="font-bold text-slate-300 block">
                      {t.addedIngredientsAndWeight}
                    </span>
                    {selectedIngredients.length === 0 ? (
                      <div className="text-slate-500 italic p-3 text-center border border-dashed border-slate-800 rounded-xl">
                        {t.noIngredientsSelected}
                      </div>
                    ) : (
                      selectedIngredients.map((ing) => (
                        <div
                          key={ing.foodId}
                          className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700"
                        >
                          <span className="font-medium text-slate-200 flex-1 min-w-[120px] truncate">
                            {ing.foodName}
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <input
                              type="number"
                              min="1"
                              value={ingredientGramsStr[ing.foodId] ?? String(ing.grams)}
                              onChange={(e) => {
                                const v = e.target.value;
                                setIngredientGramsStr((prev) => ({ ...prev, [ing.foodId]: v }));
                                if (v !== '' && !isNaN(Number(v))) {
                                  handleUpdateIngredientGrams(ing.foodId, Number(v));
                                }
                              }}
                              onBlur={() => {
                                const cur = ingredientGramsStr[ing.foodId];
                                if (cur === '' || isNaN(Number(cur)) || Number(cur) <= 0) {
                                  setIngredientGramsStr((prev) => ({
                                    ...prev,
                                    [ing.foodId]: String(ing.grams || 100),
                                  }));
                                }
                              }}
                              className="w-16 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-white font-mono text-center text-xs"
                            />
                            <span className="text-slate-400">{t.gramsShort}</span>
                            {onAddToShoppingList && (
                              <button
                                type="button"
                                onClick={() =>
                                  onAddToShoppingList({
                                    name: ing.foodName,
                                    quantity: `${ing.grams} ${t.gramsShort}`,
                                    foodId: ing.foodId,
                                  })
                                }
                                className="p-1.5 rounded-md bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 transition active:scale-90"
                                title={t.addToShoppingList}
                              >
                                <ShoppingCart className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveIngredient(ing.foodId)}
                              className="px-2 py-1 rounded-md bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 text-red-300 hover:text-red-200 text-[10px] font-semibold flex items-center gap-1 transition"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>{t.removeFromRecipe}</span>
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : null}

              {/* Total Calculation Preview (strictly per 100g of finished dish) */}
              {selectedIngredients.length > 0 && (
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 font-mono tabular-nums text-center space-y-1">
                  <div className="text-[11px] text-slate-400">
                    {t.per100gFinished} • {t.dishYield}{' '}
                    <b>
                      {totalGrams}
                      {t.gramsShort}
                    </b>
                    {totalTimeMinutes > 0 && (
                      <>
                        {' '}
                        • {t.timeLabel}: <b>{formatCompactDurationMinutes(totalTimeMinutes)}</b>
                      </>
                    )}
                    :
                  </div>
                  <div className="text-sm font-bold">
                    <span style={{ color: getNutrientColor('calories', metrics, '#f97316') }}>
                      {Math.round(per100gNutrients['calories'] || 0)} {t.kcalShort}
                    </span>
                    <span className="text-slate-400 text-xs font-normal">
                      {' '}
                      (
                      <span
                        style={{ color: getNutrientColor('proteins', metrics, '#3b82f6') }}
                        className="font-semibold"
                      >
                        {t.protShort}: {Math.round((per100gNutrients['proteins'] || 0) * 10) / 10}
                        {t.gramsShort}
                      </span>
                      {' • '}
                      <span
                        style={{ color: getNutrientColor('fats', metrics, '#eab308') }}
                        className="font-semibold"
                      >
                        {t.fatShort}: {Math.round((per100gNutrients['fats'] || 0) * 10) / 10}
                        {t.gramsShort}
                      </span>
                      {' • '}
                      <span
                        style={{ color: getNutrientColor('carbs', metrics, '#ef4444') }}
                        className="font-semibold"
                      >
                        {t.carbShort}: {Math.round((per100gNutrients['carbs'] || 0) * 10) / 10}
                        {t.gramsShort}
                      </span>
                      )
                    </span>
                  </div>
                </div>
              )}

              {/* Modal Footer */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCloseCreateModal}
                  className="min-h-[40px] px-3.5 py-2 text-xs rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={
                    selectedIngredients.length === 0 &&
                    !(
                      creationMode === 'culinary' &&
                      cookingVessels.some((v) => (v.stepItems || []).length > 0)
                    )
                  }
                  className="min-h-[40px] px-4 py-2 text-xs font-bold rounded-xl text-white shadow-md disabled:opacity-50"
                  style={{ backgroundColor: accentColor }}
                >
                  {editingRecipeId ? t.saveChangesButton : t.saveRecipeButton}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Interactive Cooking Timer Assistant Modal */}
      <CookingTimerModal
        isOpen={Boolean(activeTimerRecipe)}
        recipe={activeTimerRecipe}
        accentColor={accentColor}
        onClose={() => setActiveTimerRecipe(null)}
      />

      {/* Delete Recipe Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteRecipeModal.isOpen}
        title={t.deleteRecipeConfirmTitle}
        message={t.deleteRecipeConfirmMsg}
        itemName={deleteRecipeModal.name}
        confirmLabel={t.delete}
        cancelLabel={t.cancel}
        themeStyles={themeStyles}
        onCancel={() => setDeleteRecipeModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={() => {
          onDeleteRecipe(deleteRecipeModal.id);
          setDeleteRecipeModal((prev) => ({ ...prev, isOpen: false }));
        }}
      />
    </div>
  );
};
