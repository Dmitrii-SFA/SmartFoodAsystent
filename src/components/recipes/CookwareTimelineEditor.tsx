import React, { useState } from 'react';
import {
  CookwareVessel,
  CookingStepItem,
  LibraryFoodItem,
  RecipeIngredient,
  CookingProcessConfig,
  HeatSource,
  GasLevel,
  OvenMode,
} from '../../types/config';
import { StoveController } from './StoveController';
import { CookwareIcon, getCookwareIconLabel } from './CookwareIcon';
import {
  COOKWARE_ICONS,
  calculateOverallCookingPhysics,
  calculateVesselStepItems,
  calculateSingleVesselCookedWeight,
  findVesselTransferDestination,
  formatCompactDurationMinutes,
  isWaterFoodItem,
  isVesselTransferItem,
  isRegimeOnlyStepItem,
  getVesselDisplayIcon,
  getVesselDisplayName,
  detectRegimeCookingMode,
} from '../../utils/culinaryPhysics';
import {
  Plus,
  Trash2,
  Clock,
  Sparkles,
  Loader2,
  ArrowRight,
  Droplet,
  Flame,
  Utensils,
  Check,
} from 'lucide-react';

interface CookwareTimelineEditorProps {
  vessels: CookwareVessel[];
  library: LibraryFoodItem[];
  ingredients: RecipeIngredient[];
  accentColor: string;
  langCode?: string;
  aiConfig?: any;
  onChangeVessels: (vessels: CookwareVessel[]) => void;
  onUpdateIngredients: (ingredients: RecipeIngredient[]) => void;
  cookingProcessConfig: CookingProcessConfig;
  onUpdateProcessConfig: (config: CookingProcessConfig) => void;
  sessionAiCreatedFoodIds?: string[];
  onRemoveAiCreatedFoodFromLibrary?: (foodId: string) => void;
}

interface StepRegimeDraft {
  heatSource: HeatSource;
  electricLevel: number;
  gasLevel: GasLevel;
  ovenTempC: number;
  ovenMode: OvenMode;
  extraMode?: string;
  hasLid: boolean;
}

export const CookwareTimelineEditor: React.FC<CookwareTimelineEditorProps> = ({
  vessels,
  library,
  ingredients,
  accentColor,
  langCode = 'ru',
  aiConfig,
  onChangeVessels,
  onUpdateIngredients,
  cookingProcessConfig,
  onUpdateProcessConfig,
  sessionAiCreatedFoodIds = [],
  onRemoveAiCreatedFoodFromLibrary,
}) => {
  const [activeAddStepVesselId, setActiveAddStepVesselId] = useState<string | null>(null);
  const [stepFoodSearch, setStepFoodSearch] = useState('');
  const [selectedFoodId, setSelectedFoodId] = useState<string>('');
  const [stepGramsStr, setStepGramsStr] = useState<string>('100');
  const [stepAddedAtStr, setStepAddedAtStr] = useState<string>('0');
  const [stepDurationStr, setStepDurationStr] = useState<string>('15');
  const [stepIsExtracted, setStepIsExtracted] = useState<boolean>(false);

  // Two independent toggles inside the new step form:
  // 1) "Добавить продукты" (showProductsSection)
  // 2) "Добавить термообработку" (showThermalSection)
  const [showProductsSection, setShowProductsSection] = useState<boolean>(false);
  const [showThermalSection, setShowThermalSection] = useState<boolean>(false);
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState<boolean>(false);

  // Products already queued inside the currently open "+ Шаг" form before closing
  const [queuedStepProducts, setQueuedStepProducts] = useState<
    Array<{
      id: string;
      foodId: string;
      foodName: string;
      grams: number;
      sourceVesselId?: string;
      isExtracted?: boolean;
    }>
  >([]);

  // Draft cooking regime inside the "+ Шаг" form (only applied if showThermalSection === true)
  const [stepRegimeDraft, setStepRegimeDraft] = useState<StepRegimeDraft>({
    heatSource: 'electric',
    electricLevel: 5,
    gasLevel: 'medium',
    ovenTempC: 180,
    ovenMode: 'top_bottom',
    extraMode: undefined,
    hasLid: false,
  });

  // Track which existing step group has its thermal regime editor expanded: key = `${vesselId}:${addedAtMinute}`
  const [expandedStepRegimeKey, setExpandedStepRegimeKey] = useState<string | null>(null);

  // Track which vessel has its icon picker popover open
  const [openIconPickerVesselId, setOpenIconPickerVesselId] = useState<string | null>(null);

  // Local string state for inline editing of step item grams, step durations, and vessel start offsets
  const [inlineGramsStr, setInlineGramsStr] = useState<Record<string, string>>({});
  const [inlineStepDurationStr, setInlineStepDurationStr] = useState<Record<string, string>>({});
  const [inlineVesselOffsetStr, setInlineVesselOffsetStr] = useState<Record<string, string>>({});

  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);

  // Live physics calculation
  const physics = calculateOverallCookingPhysics(vessels, ingredients);

  // Default water item from library
  const defaultWaterItem =
    library.find((item) => isWaterFoodItem(item.id, item.name)) || library[0];

  // Sync physics numbers back to parent config when vessels change
  const syncVesselsAndPhysics = (
    nextVessels: CookwareVessel[],
    nextIngredients: RecipeIngredient[] = ingredients
  ) => {
    onChangeVessels(nextVessels);
    const nextPhys = calculateOverallCookingPhysics(nextVessels, nextIngredients);
    onUpdateProcessConfig({
      ...cookingProcessConfig,
      isEnabled: true,
      vessels: nextVessels,
      rawWeightGrams: nextPhys.rawWeightGrams,
      evaporatedWaterMl: nextPhys.evaporatedWaterMl,
      weightDeltaGrams: nextPhys.weightDeltaGrams,
      finalDishWeightGrams: nextPhys.finalDishWeightGrams,
    });
  };

  // Helper to get the last active thermal regime in a vessel (for smart defaults when enabling thermal processing)
  const getDefaultStepRegimeForVessel = (
    vessel: CookwareVessel,
    vesselIdx: number,
    targetMinute: number
  ): StepRegimeDraft => {
    const { groupedSteps } = calculateVesselStepItems(vessel, vesselIdx);
    const priorThermalGroups = groupedSteps.filter(
      (g) => g.addedAtMinute <= targetMinute && g.hasThermalProcessing
    );
    if (priorThermalGroups.length > 0) {
      const lastGrp = priorThermalGroups[priorThermalGroups.length - 1];
      return {
        heatSource: lastGrp.effectiveHeatSource,
        electricLevel: lastGrp.effectiveElectricLevel,
        gasLevel: lastGrp.effectiveGasLevel,
        ovenTempC: lastGrp.effectiveOvenTempC,
        ovenMode: lastGrp.effectiveOvenMode,
        extraMode: lastGrp.effectiveExtraMode,
        hasLid: lastGrp.effectiveHasLid,
      };
    }
    return {
      heatSource: vessel.heatSource || 'electric',
      electricLevel: vessel.electricLevel || 5,
      gasLevel: vessel.gasLevel || 'medium',
      ovenTempC: vessel.ovenTempC || 180,
      ovenMode: vessel.ovenMode || 'top_bottom',
      extraMode: undefined,
      hasLid: Boolean(vessel.hasLid),
    };
  };

  // Add a new cookware vessel with empty name so user types manually
  const handleAddVessel = () => {
    const firstVesselSummary = physics.vesselSummaries[0];
    const defaultStartMinute =
      vessels.length === 0 ? 0 : firstVesselSummary?.recipeEndMinute || 0;

    const newVessel: CookwareVessel = {
      id: `vessel-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: '',
      icon: COOKWARE_ICONS[vessels.length % COOKWARE_ICONS.length] || 'pan_classic',
      type: 'custom',
      heatSource: 'electric',
      electricLevel: 5,
      gasLevel: 'medium',
      ovenTempC: 180,
      ovenMode: 'top_bottom',
      hasLid: false,
      waterAddedMl: 0,
      startOffsetMinutes: vessels.length === 0 ? 0 : defaultStartMinute,
      stepItems: [],
    };
    syncVesselsAndPhysics([...vessels, newVessel]);
  };

  const handleRemoveVessel = (vesselId: string) => {
    if (vessels.length <= 1) return;
    const next = vessels.filter((v) => v.id !== vesselId);
    if (next.length > 0) {
      next[0] = { ...next[0], startOffsetMinutes: 0 };
    }
    syncVesselsAndPhysics(next);
  };

  const handleUpdateVessel = (vesselId: string, patch: Partial<CookwareVessel>) => {
    const next = vessels.map((v, idx) =>
      v.id === vesselId
        ? { ...v, ...patch, startOffsetMinutes: idx === 0 ? 0 : (patch.startOffsetMinutes ?? v.startOffsetMinutes ?? 0) }
        : v
    );
    syncVesselsAndPhysics(next);
  };

  // Update or toggle thermal regime on an existing step group (at a specific addedAtMinute)
  const handleUpdateStepGroupRegime = (
    vesselId: string,
    addedAtMinute: number,
    regimePatch: {
      hasThermalProcessing?: boolean;
      stepHeatSource?: HeatSource;
      stepElectricLevel?: number;
      stepGasLevel?: GasLevel;
      stepOvenTempC?: number;
      stepOvenMode?: OvenMode;
      stepExtraMode?: string;
      stepHasLid?: boolean;
    }
  ) => {
    const vesselIdx = vessels.findIndex((v) => v.id === vesselId);
    const vessel = vessels[vesselIdx];
    if (!vessel) return;

    const { groupedSteps } = calculateVesselStepItems(vessel, vesselIdx);
    const currentGroup = groupedSteps.find((g) => g.addedAtMinute === addedAtMinute);

    const nextHasThermal =
      regimePatch.hasThermalProcessing !== undefined
        ? regimePatch.hasThermalProcessing
        : currentGroup
        ? currentGroup.hasThermalProcessing
        : true;

    const nextHeatSource =
      regimePatch.stepHeatSource ??
      currentGroup?.effectiveHeatSource ??
      vessel.heatSource ??
      'electric';
    const nextElectricLevel =
      regimePatch.stepElectricLevel ??
      currentGroup?.effectiveElectricLevel ??
      vessel.electricLevel ??
      5;
    const nextGasLevel =
      regimePatch.stepGasLevel ??
      currentGroup?.effectiveGasLevel ??
      vessel.gasLevel ??
      'medium';
    const nextOvenTempC =
      regimePatch.stepOvenTempC ??
      currentGroup?.effectiveOvenTempC ??
      vessel.ovenTempC ??
      180;
    const nextOvenMode =
      regimePatch.stepOvenMode ??
      currentGroup?.effectiveOvenMode ??
      vessel.ovenMode ??
      'top_bottom';
    const nextExtraMode =
      regimePatch.stepExtraMode !== undefined
        ? regimePatch.stepExtraMode
        : currentGroup?.effectiveExtraMode;
    const nextHasLid =
      regimePatch.stepHasLid !== undefined
        ? regimePatch.stepHasLid
        : currentGroup?.effectiveHasLid ?? Boolean(vessel.hasLid);

    const nextVessels = vessels.map((v) => {
      if (v.id !== vesselId) return v;
      return {
        ...v,
        stepItems: v.stepItems.map((item) => {
          const itemMin = Math.max(0, Math.round(Number(item.addedAtMinute) || 0));
          if (itemMin !== addedAtMinute) return item;
          if (!nextHasThermal) {
            return {
              ...item,
              hasThermalProcessing: false,
              stepHeatSource: undefined,
              stepElectricLevel: undefined,
              stepGasLevel: undefined,
              stepOvenTempC: undefined,
              stepOvenMode: undefined,
              stepExtraMode: undefined,
              stepHasLid: undefined,
            };
          }
          return {
            ...item,
            hasThermalProcessing: true,
            stepHeatSource: nextHeatSource,
            stepElectricLevel: nextElectricLevel,
            stepGasLevel: nextGasLevel,
            stepOvenTempC: nextOvenTempC,
            stepOvenMode: nextOvenMode,
            stepExtraMode: nextExtraMode,
            stepHasLid: nextHasLid,
          };
        }),
      };
    });

    syncVesselsAndPhysics(nextVessels);
  };

  // Reset step regime override back to previous step's regime
  const handleResetStepGroupRegime = (vesselId: string, addedAtMinute: number) => {
    const nextVessels = vessels.map((v) => {
      if (v.id !== vesselId) return v;
      return {
        ...v,
        stepItems: v.stepItems.map((item) => {
          const itemMin = Math.max(0, Math.round(Number(item.addedAtMinute) || 0));
          if (itemMin !== addedAtMinute) return item;
          return {
            ...item,
            stepHeatSource: undefined,
            stepElectricLevel: undefined,
            stepGasLevel: undefined,
            stepOvenTempC: undefined,
            stepOvenMode: undefined,
            stepExtraMode: undefined,
            stepHasLid: undefined,
          };
        }),
      };
    });
    syncVesselsAndPhysics(nextVessels);
  };

  // Queue a product inside the open "+ Шаг" form
  const handleQueueProductInForm = (vesselId: string) => {
    if (!selectedFoodId) return;

    if (selectedFoodId.startsWith('vessel-transfer:')) {
      const sourceVesselId = selectedFoodId.replace('vessel-transfer:', '');
      const sourceVesselIdx = vessels.findIndex((v) => v.id === sourceVesselId);
      const sourceVessel = vessels[sourceVesselIdx];
      if (!sourceVessel) return;

      const { cookedWeightGrams } = calculateSingleVesselCookedWeight(
        sourceVessel,
        sourceVesselIdx
      );
      const grams = Math.max(1, Math.round(Number(stepGramsStr) || cookedWeightGrams));
      const sIcon = getVesselDisplayIcon(sourceVessel);
      const sName = getVesselDisplayName(sourceVessel, sourceVesselIdx);

      setQueuedStepProducts((prev) => [
        ...prev,
        {
          id: `q-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          foodId: selectedFoodId,
          foodName: `Содержимое: ${sIcon} ${sName}`,
          grams,
          sourceVesselId,
          isExtracted: false,
        },
      ]);
      setSelectedFoodId(defaultWaterItem?.id || 'lib-water');
      setStepFoodSearch(defaultWaterItem?.name || 'Вода');
      setStepGramsStr('1000');
      setIsProductDropdownOpen(false);
      return;
    }

    const food = library.find((f) => f.id === selectedFoodId);
    if (!food) return;

    const isWater = isWaterFoodItem(food.id, food.name);
    const grams = Math.max(1, Number(stepGramsStr) || (isWater ? 500 : 100));

    setQueuedStepProducts((prev) => [
      ...prev,
      {
        id: `q-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        foodId: food.id,
        foodName: food.name,
        grams,
        isExtracted: isWater ? false : stepIsExtracted,
      },
    ]);
    setSelectedFoodId(defaultWaterItem?.id || 'lib-water');
    setStepFoodSearch(defaultWaterItem?.name || 'Вода');
    setStepGramsStr('1000');
    setIsProductDropdownOpen(false);
  };

  // Commit the new step (products and/or thermal processing) to the vessel
  const handleAddStepItem = (vesselId: string) => {
    const addedAtMinute = Math.max(0, Math.round(Number(stepAddedAtStr) || 0));
    const durationMinutes = Math.max(0, Math.round(Number(stepDurationStr) || 0));

    // Collect all products: queued products + any currently selected product in the dropdown
    const finalProducts = [...queuedStepProducts];

    if (showProductsSection && selectedFoodId) {
      if (selectedFoodId.startsWith('vessel-transfer:')) {
        const sourceVesselId = selectedFoodId.replace('vessel-transfer:', '');
        const sourceVesselIdx = vessels.findIndex((v) => v.id === sourceVesselId);
        const sourceVessel = vessels[sourceVesselIdx];
        if (sourceVessel) {
          const { cookedWeightGrams } = calculateSingleVesselCookedWeight(
            sourceVessel,
            sourceVesselIdx
          );
          const grams = Math.max(1, Math.round(Number(stepGramsStr) || cookedWeightGrams));
          const sIcon = getVesselDisplayIcon(sourceVessel);
          const sName = getVesselDisplayName(sourceVessel, sourceVesselIdx);
          finalProducts.push({
            id: `q-${Date.now()}-sel`,
            foodId: selectedFoodId,
            foodName: `Содержимое: ${sIcon} ${sName}`,
            grams,
            sourceVesselId,
            isExtracted: false,
          });
        }
      } else {
        const food = library.find((f) => f.id === selectedFoodId);
        if (food) {
          const isWater = isWaterFoodItem(food.id, food.name);
          const grams = Math.max(1, Number(stepGramsStr) || (isWater ? 500 : 100));
          finalProducts.push({
            id: `q-${Date.now()}-sel`,
            foodId: food.id,
            foodName: food.name,
            grams,
            isExtracted: isWater ? false : stepIsExtracted,
          });
        }
      }
    }

    const hasThermal = showThermalSection;

    // Must have either at least one product OR thermal processing enabled
    if (finalProducts.length === 0 && !hasThermal) {
      return;
    }

    const regimeProps = hasThermal
      ? {
          hasThermalProcessing: true,
          stepHeatSource: stepRegimeDraft.heatSource,
          stepElectricLevel: stepRegimeDraft.electricLevel,
          stepGasLevel: stepRegimeDraft.gasLevel,
          stepOvenTempC: stepRegimeDraft.ovenTempC,
          stepOvenMode: stepRegimeDraft.ovenMode,
          stepExtraMode: stepRegimeDraft.extraMode,
          stepHasLid: stepRegimeDraft.hasLid,
        }
      : {
          hasThermalProcessing: false,
          stepHeatSource: undefined,
          stepElectricLevel: undefined,
          stepGasLevel: undefined,
          stepOvenTempC: undefined,
          stepOvenMode: undefined,
          stepExtraMode: undefined,
          stepHasLid: undefined,
        };

    // Case A: Thermal processing only (no new products added in this step)
    if (finalProducts.length === 0 && hasThermal) {
      const regimeStep: CookingStepItem = {
        id: `step-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        foodId: 'step-regime-only',
        foodName: 'Термообработка содержимого в посуде',
        grams: 0,
        addedAtMinute,
        durationMinutes: Math.max(1, durationMinutes || 15),
        isRegimeOnly: true,
        ...regimeProps,
      };

      const nextVessels = vessels.map((v) => {
        if (v.id !== vesselId) return v;
        const existingAtMin = v.stepItems.filter(
          (it) => Math.max(0, Math.round(Number(it.addedAtMinute) || 0)) === addedAtMinute
        );
        if (existingAtMin.length > 0) {
          return {
            ...v,
            stepItems: v.stepItems.map((it) => {
              const itMin = Math.max(0, Math.round(Number(it.addedAtMinute) || 0));
              if (itMin !== addedAtMinute) return it;
              return {
                ...it,
                durationMinutes: Math.max(1, durationMinutes || it.durationMinutes),
                ...regimeProps,
              };
            }),
          };
        }
        return {
          ...v,
          stepItems: [...v.stepItems, regimeStep],
        };
      });

      syncVesselsAndPhysics(nextVessels, ingredients);
      setActiveAddStepVesselId(null);
      setSelectedFoodId('');
      setQueuedStepProducts([]);
      return;
    }

    // Case B: One or more products added (with or without thermal processing)
    const createdItems: CookingStepItem[] = finalProducts.map((prod, idx) => ({
      id: `step-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 5)}`,
      foodId: prod.foodId,
      foodName: prod.foodName,
      grams: prod.grams,
      addedAtMinute,
      durationMinutes,
      sourceVesselId: prod.sourceVesselId,
      isExtracted: prod.isExtracted,
      ...regimeProps,
    }));

    const nextVessels = vessels.map((v) => {
      if (v.id !== vesselId) return v;
      // Remove any regime-only placeholder at this same minute since we now have real product items
      const filteredExisting = v.stepItems
        .filter(
          (it) =>
            !(
              Math.max(0, Math.round(Number(it.addedAtMinute) || 0)) === addedAtMinute &&
              isRegimeOnlyStepItem(it)
            )
        )
        .map((it) => {
          const itMin = Math.max(0, Math.round(Number(it.addedAtMinute) || 0));
          if (itMin !== addedAtMinute) return it;
          return {
            ...it,
            ...regimeProps,
          };
        });
      return { ...v, stepItems: [...filteredExisting, ...createdItems] };
    });

    // Also synchronize into main recipe ingredients list (for non-transfer items)
    let nextIngredients = [...ingredients];
    for (const prod of finalProducts) {
      if (prod.sourceVesselId || prod.foodId.startsWith('vessel-transfer:')) continue;
      const food = library.find((f) => f.id === prod.foodId);
      if (!food) continue;
      const existingIngIndex = nextIngredients.findIndex((i) => i.foodId === food.id);
      if (existingIngIndex >= 0) {
        nextIngredients[existingIngIndex] = {
          ...nextIngredients[existingIngIndex],
          grams: nextIngredients[existingIngIndex].grams + prod.grams,
        };
      } else {
        nextIngredients.push({
          foodId: food.id,
          foodName: food.name,
          grams: prod.grams,
          nutrientsPer100g: food.nutrients,
        });
      }
    }

    onUpdateIngredients(nextIngredients);
    syncVesselsAndPhysics(nextVessels, nextIngredients);

    setActiveAddStepVesselId(null);
    setSelectedFoodId('');
    setQueuedStepProducts([]);
    setStepGramsStr('100');
    setStepIsExtracted(false);
  };

  // Update grams of an existing step item inline
  const handleUpdateStepItemGrams = (vesselId: string, stepId: string, newGrams: number) => {
    const clampedGrams = Math.max(1, Math.round(newGrams || 1));
    let targetFoodId = '';
    let isTransfer = false;

    const nextVessels = vessels.map((v) => {
      if (v.id !== vesselId) return v;
      return {
        ...v,
        stepItems: v.stepItems.map((s) => {
          if (s.id === stepId) {
            targetFoodId = s.foodId;
            isTransfer = isVesselTransferItem(s);
            return { ...s, grams: clampedGrams };
          }
          return s;
        }),
      };
    });

    let nextIngredients = [...ingredients];
    if (targetFoodId && !isTransfer) {
      let totalFoodGramsAcrossVessels = 0;
      for (const v of nextVessels) {
        for (const s of v.stepItems) {
          if (s.foodId === targetFoodId) {
            totalFoodGramsAcrossVessels += Math.max(0, Number(s.grams) || 0);
          }
        }
      }
      nextIngredients = nextIngredients.map((ing) =>
        ing.foodId === targetFoodId ? { ...ing, grams: totalFoodGramsAcrossVessels } : ing
      );
      onUpdateIngredients(nextIngredients);
    }

    syncVesselsAndPhysics(nextVessels, nextIngredients);
  };

  // Update step duration for all items added at a specific minute in a vessel
  const handleUpdateStepGroupDuration = (
    vesselId: string,
    addedAtMinute: number,
    newDurationMinutes: number
  ) => {
    const clampedDur = Math.max(0, Math.round(newDurationMinutes || 0));
    const vesselIdx = vessels.findIndex((v) => v.id === vesselId);
    const vessel = vessels[vesselIdx];
    if (!vessel) return;

    const { groupedSteps } = calculateVesselStepItems(vessel, vesselIdx);
    const groupIdx = groupedSteps.findIndex((g) => g.addedAtMinute === addedAtMinute);
    if (groupIdx < 0) return;

    const currentGroup = groupedSteps[groupIdx];
    const delta = clampedDur - currentGroup.durationMinutes;

    const nextVessels = vessels.map((v) => {
      if (v.id !== vesselId) return v;
      return {
        ...v,
        stepItems: v.stepItems.map((item) => {
          const itemMin = Math.max(0, Math.round(Number(item.addedAtMinute) || 0));
          if (itemMin === addedAtMinute) {
            return { ...item, durationMinutes: clampedDur };
          }
          if (groupIdx < groupedSteps.length - 1 && itemMin > addedAtMinute) {
            return { ...item, addedAtMinute: Math.max(addedAtMinute + 1, itemMin + delta) };
          }
          return item;
        }),
      };
    });

    syncVesselsAndPhysics(nextVessels);
  };

  const handleRemoveStepItem = (vesselId: string, stepId: string) => {
    let removedStep: CookingStepItem | undefined;
    const nextVessels = vessels.map((v) => {
      if (v.id !== vesselId) return v;
      removedStep = v.stepItems.find((s) => s.id === stepId);
      return {
        ...v,
        stepItems: v.stepItems.filter((s) => s.id !== stepId),
      };
    });

    let nextIngredients = [...ingredients];
    if (
      removedStep &&
      !isVesselTransferItem(removedStep) &&
      !isRegimeOnlyStepItem(removedStep)
    ) {
      let remainingGrams = 0;
      for (const v of nextVessels) {
        for (const s of v.stepItems) {
          if (s.foodId === removedStep.foodId) {
            remainingGrams += Math.max(0, Number(s.grams) || 0);
          }
        }
      }
      if (remainingGrams <= 0) {
        nextIngredients = nextIngredients.filter((i) => i.foodId !== removedStep!.foodId);
        if (sessionAiCreatedFoodIds.includes(removedStep.foodId)) {
          onRemoveAiCreatedFoodFromLibrary?.(removedStep.foodId);
        }
      } else {
        nextIngredients = nextIngredients.map((i) =>
          i.foodId === removedStep!.foodId ? { ...i, grams: remainingGrams } : i
        );
      }
      onUpdateIngredients(nextIngredients);
    }

    syncVesselsAndPhysics(nextVessels, nextIngredients);
  };

  // Run Chef AI Analysis on the multi-vessel cooking timeline
  const handleRunChefAiAnalysis = async () => {
    if (vessels.length === 0) return;
    setIsAiAnalyzing(true);

    try {
      const res = await fetch('/api/recipes/analyze-cooking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vessels,
          ingredients,
          physics,
          aiConfig,
        }),
      });

      if (!res.ok) throw new Error('AI analysis failed');
      const data = await res.json();

      onUpdateProcessConfig({
        ...cookingProcessConfig,
        isEnabled: true,
        vessels,
        rawWeightGrams: physics.rawWeightGrams,
        evaporatedWaterMl: data.evaporatedWaterMl ?? physics.evaporatedWaterMl,
        weightDeltaGrams: data.weightDeltaGrams ?? physics.weightDeltaGrams,
        finalDishWeightGrams: data.finalDishWeightGrams ?? physics.finalDishWeightGrams,
        aiAnalysis: {
          note: data.note || 'Анализ термообработки выполнен.',
          nutrientImpact: data.nutrientImpact,
          chefTips: data.chefTips,
          analyzedAt: Date.now(),
        },
      });
    } catch {
      onUpdateProcessConfig({
        ...cookingProcessConfig,
        isEnabled: true,
        vessels,
        rawWeightGrams: physics.rawWeightGrams,
        evaporatedWaterMl: physics.evaporatedWaterMl,
        weightDeltaGrams: physics.weightDeltaGrams,
        finalDishWeightGrams: physics.finalDishWeightGrams,
        aiAnalysis: {
          note: `Термический расчёт: время готовки ${formatCompactDurationMinutes(
            physics.totalRecipeTimeMinutes
          )}, испарение влаги ~${physics.evaporatedWaterMl} мл, выход готового блюда ${
            physics.finalDishWeightGrams
          } г.`,
          nutrientImpact:
            'Водорастворимые минералы и экстрактивные вещества переходят в бульон; при жарке с маслом повышается биодоступность жирорастворимых витаминов.',
          chefTips:
            'Соблюдайте очерёдность закладки ингредиентов по минутам для сохранения текстуры овощей.',
          analyzedAt: Date.now(),
        },
      });
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  // Sort matching library items: prefix matches (by first letters) first, then substring matches
  const filteredFoodLibrary = React.useMemo(() => {
    const q = stepFoodSearch.trim().toLowerCase();
    // If query equals the currently selected item's exact name, show all items (with prefix matches if user is typing)
    const selectedFoodObj = library.find((f) => f.id === selectedFoodId);
    const isExactSelectedName =
      Boolean(selectedFoodObj && selectedFoodObj.name.toLowerCase() === q) ||
      q.startsWith('содержимое «');

    if (!q || isExactSelectedName) {
      return library;
    }

    const prefixMatches = library.filter((item) =>
      item.name.toLowerCase().startsWith(q)
    );
    const substringMatches = library.filter(
      (item) =>
        !item.name.toLowerCase().startsWith(q) && item.name.toLowerCase().includes(q)
    );
    return [...prefixMatches, ...substringMatches];
  }, [library, stepFoodSearch, selectedFoodId]);

  return (
    <div className="space-y-3">
      {/* VESSELS LIST */}
      <div className="space-y-3">
        {vessels.map((vessel, vIdx) => {
          const {
            groupedSteps,
            totalTimeMinutes: vesselTotalTime,
            startOffsetMinutes,
            recipeEndMinute,
            waterFromStepsMl,
            cookingMode,
          } = calculateVesselStepItems(vessel, vIdx);

          const otherVessels = vessels
            .map((ov, ovIdx) => ({ vessel: ov, index: ovIdx }))
            .filter((entry) => entry.vessel.id !== vessel.id);
          const transferredDestination = findVesselTransferDestination(vessel.id, vessels);
          const currentIcon = getVesselDisplayIcon(vessel);
          const hasSteps = (vessel.stepItems || []).length > 0;

          return (
            <div
              key={vessel.id}
              className="p-3 rounded-2xl bg-slate-900/90 border border-slate-700/80 space-y-3 shadow-md"
            >
              {/* Clean Vessel Header (NO base stove panel — thermal processing is configured inside steps) */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-md bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-mono font-bold text-amber-400 shrink-0">
                    #{vIdx + 1}
                  </span>

                  {/* Icon selector button */}
                  <div className="relative shrink-0">
                    <button
                      type="button"
                      title={getCookwareIconLabel(currentIcon)}
                      onClick={() =>
                        setOpenIconPickerVesselId(
                          openIconPickerVesselId === vessel.id ? null : vessel.id
                        )
                      }
                      className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center transition"
                    >
                      <CookwareIcon icon={currentIcon} vesselName={vessel.name} className="w-5 h-5" />
                    </button>

                    {openIconPickerVesselId === vessel.id && (
                      <div className="absolute left-0 top-9 z-30 p-2 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl grid grid-cols-6 gap-1.5 w-60">
                        {COOKWARE_ICONS.map((ic) => (
                          <button
                            key={ic}
                            type="button"
                            title={getCookwareIconLabel(ic)}
                            onClick={() => {
                              handleUpdateVessel(vessel.id, { icon: ic });
                              setOpenIconPickerVesselId(null);
                            }}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${
                              currentIcon === ic
                                ? 'bg-amber-500/30 border border-amber-500/60'
                                : 'hover:bg-slate-800 border border-transparent'
                            }`}
                          >
                            <CookwareIcon icon={ic} className="w-5 h-5" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Cookware Name Input — Maximum Width */}
                  <input
                    type="text"
                    value={vessel.name}
                    onChange={(e) => handleUpdateVessel(vessel.id, { name: e.target.value })}
                    placeholder="Введите название посуды..."
                    className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg bg-slate-800/90 border border-slate-700 text-xs font-bold text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-500"
                  />

                  {vessels.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveVessel(vessel.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800 transition shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Compact secondary sub-bar: start minute for 2nd+ cookware + status badge + ultra-small time */}
                <div className="flex flex-wrap items-center justify-between gap-1.5 text-[9px] font-mono tabular-nums text-slate-400 pl-0.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {vIdx === 0 ? (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 font-bold">
                        Старт: 0м
                      </span>
                    ) : (
                      <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded">
                        <span className="text-amber-300 font-sans">Старт на:</span>
                        <input
                          type="number"
                          min={0}
                          value={
                            inlineVesselOffsetStr[vessel.id] ?? String(startOffsetMinutes)
                          }
                          onChange={(e) => {
                            const val = e.target.value;
                            setInlineVesselOffsetStr((prev) => ({
                              ...prev,
                              [vessel.id]: val,
                            }));
                            if (val !== '' && !isNaN(Number(val))) {
                              handleUpdateVessel(vessel.id, {
                                startOffsetMinutes: Math.max(0, Math.round(Number(val))),
                              });
                            }
                          }}
                          onBlur={() => {
                            const cur = inlineVesselOffsetStr[vessel.id];
                            if (cur === '' || isNaN(Number(cur)) || Number(cur) < 0) {
                              setInlineVesselOffsetStr((prev) => {
                                const copy = { ...prev };
                                delete copy[vessel.id];
                                return copy;
                              });
                            }
                          }}
                          className="w-10 px-1 py-0.2 rounded bg-slate-900 border border-amber-500/40 text-amber-300 text-center font-bold text-[9px]"
                        />
                        <span className="text-amber-300">м</span>
                      </div>
                    )}

                    {hasSteps && (
                      <span
                        className={`px-1.5 py-0.5 rounded border text-[9px] font-sans font-bold ${cookingMode.badgeColor}`}
                      >
                        {cookingMode.label}
                      </span>
                    )}

                    {waterFromStepsMl > 0 && (
                      <span className="text-blue-400 flex items-center gap-0.5">
                        <Droplet className="w-2.5 h-2.5" />
                        {waterFromStepsMl}мл
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-amber-400 font-bold">
                    <Clock className="w-2.5 h-2.5" />
                    <span>{formatCompactDurationMinutes(vesselTotalTime)}</span>
                    {vIdx > 0 && vesselTotalTime > 0 && (
                      <span className="text-slate-500 font-normal">
                        ({startOffsetMinutes}–{recipeEndMinute}м)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Chronological Steps (Ingredients and/or Thermal Processing) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-300">
                    Шаги ({groupedSteps.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (activeAddStepVesselId === vessel.id) {
                        setActiveAddStepVesselId(null);
                      } else {
                        setActiveAddStepVesselId(vessel.id);
                        setSelectedFoodId(defaultWaterItem?.id || 'lib-water');
                        setStepFoodSearch(defaultWaterItem?.name || 'Вода');
                        setQueuedStepProducts([]);
                        setStepGramsStr('1000');
                        setStepAddedAtStr(String(vesselTotalTime));
                        setStepDurationStr('15');
                        setShowProductsSection(false);
                        setShowThermalSection(false);
                        setIsProductDropdownOpen(false);
                        setStepRegimeDraft(
                          getDefaultStepRegimeForVessel(vessel, vIdx, vesselTotalTime)
                        );
                      }
                    }}
                    className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Шаг</span>
                  </button>
                </div>

                {groupedSteps.length === 0 ? (
                  <div className="p-2.5 rounded-xl border border-dashed border-slate-800 text-center text-[11px] text-slate-500">
                    Нажмите «+ Шаг», чтобы добавить продукты (для смешивания или готовки) и/или термообработку
                  </div>
                ) : (
                  <div className="space-y-2">
                    {groupedSteps.map((group, gIdx) => {
                      const stepDurationKey = `${vessel.id}-step-${group.addedAtMinute}`;
                      const stepRegimeKey = `${vessel.id}:${group.addedAtMinute}`;
                      const isStepRegimeOpen = expandedStepRegimeKey === stepRegimeKey;

                      return (
                        <div
                          key={group.addedAtMinute}
                          className="p-2 rounded-xl bg-slate-950/75 border border-slate-800/90 space-y-1.5"
                        >
                          {/* Step Header: Step # + Compact Time + Thermal Regime or Mixing Badge + Duration */}
                          <div className="flex flex-wrap items-center justify-between gap-1.5 pb-1 border-b border-slate-800/80">
                            <div className="flex items-center gap-1 flex-wrap">
                              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono tabular-nums text-[9px] font-bold">
                                Шаг {gIdx + 1} · {group.recipeStartMinute}–{group.recipeEndMinute}м
                              </span>

                              {group.hasThermalProcessing ? (
                                <>
                                  {/* Interactive Regime & Lid Badge for this step */}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setExpandedStepRegimeKey(
                                        isStepRegimeOpen ? null : stepRegimeKey
                                      )
                                    }
                                    className={`px-1.5 py-0.5 rounded text-[9px] font-mono tabular-nums font-bold border transition flex items-center gap-1 ${
                                      group.hasCustomRegime || isStepRegimeOpen
                                        ? 'bg-amber-500/15 text-amber-200 border-amber-500/40'
                                        : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-600'
                                    }`}
                                  >
                                    <span>{group.regimeBadgeText}</span>
                                    <span className="text-[8px] text-amber-400 underline ml-0.5 font-sans">
                                      {isStepRegimeOpen ? 'скрыть' : 'изм.'}
                                    </span>
                                  </button>

                                  {/* Step-specific Cooking Mode badge */}
                                  <span
                                    className={`px-1.5 py-0.5 rounded border text-[9px] font-bold ${group.stepCookingMode.badgeColor}`}
                                  >
                                    {group.stepCookingMode.label}
                                  </span>
                                </>
                              ) : (
                                <>
                                  <span className="px-1.5 py-0.5 rounded border text-[9px] font-bold bg-slate-500/15 text-slate-300 border-slate-500/30">
                                    🥣 Смешивание (без нагрева)
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const defRegime = getDefaultStepRegimeForVessel(
                                        vessel,
                                        vIdx,
                                        group.addedAtMinute
                                      );
                                      handleUpdateStepGroupRegime(
                                        vessel.id,
                                        group.addedAtMinute,
                                        {
                                          hasThermalProcessing: true,
                                          stepHeatSource: defRegime.heatSource,
                                          stepElectricLevel: defRegime.electricLevel,
                                          stepGasLevel: defRegime.gasLevel,
                                          stepOvenTempC: defRegime.ovenTempC,
                                          stepOvenMode: defRegime.ovenMode,
                                          stepExtraMode: defRegime.extraMode,
                                          stepHasLid: defRegime.hasLid,
                                        }
                                      );
                                      setExpandedStepRegimeKey(stepRegimeKey);
                                    }}
                                    className="px-1.5 py-0.5 rounded bg-orange-500/15 hover:bg-orange-500/25 text-orange-300 border border-orange-500/30 text-[9px] font-bold flex items-center gap-0.5"
                                  >
                                    <Flame className="w-2.5 h-2.5" />
                                    <span>+ Термообработка</span>
                                  </button>
                                </>
                              )}
                            </div>

                            <div className="flex items-center gap-1">
                              {/* Button to quickly add another ingredient into THIS same step */}
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveAddStepVesselId(vessel.id);
                                  setStepAddedAtStr(String(group.addedAtMinute));
                                  setStepDurationStr(String(group.durationMinutes || 15));
                                  setSelectedFoodId(defaultWaterItem?.id || 'lib-water');
                                  setStepFoodSearch(defaultWaterItem?.name || 'Вода');
                                  setQueuedStepProducts([]);
                                  setStepGramsStr('1000');
                                  setShowProductsSection(true);
                                  setIsProductDropdownOpen(false);
                                  setShowThermalSection(group.hasThermalProcessing);
                                  setStepRegimeDraft({
                                    heatSource: group.effectiveHeatSource,
                                    electricLevel: group.effectiveElectricLevel,
                                    gasLevel: group.effectiveGasLevel,
                                    ovenTempC: group.effectiveOvenTempC,
                                    ovenMode: group.effectiveOvenMode,
                                    extraMode: group.effectiveExtraMode,
                                    hasLid: group.effectiveHasLid,
                                  });
                                }}
                                className="px-1.5 py-0.5 rounded bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-[9px] font-bold"
                              >
                                + Продукт
                              </button>

                              {/* Editable duration for this step */}
                              <div className="flex items-center gap-0.5 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700 text-[9px] font-mono tabular-nums">
                                <input
                                  type="number"
                                  min={0}
                                  value={
                                    inlineStepDurationStr[stepDurationKey] ??
                                    String(group.durationMinutes)
                                  }
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setInlineStepDurationStr((prev) => ({
                                      ...prev,
                                      [stepDurationKey]: val,
                                    }));
                                    if (val !== '' && !isNaN(Number(val))) {
                                      handleUpdateStepGroupDuration(
                                        vessel.id,
                                        group.addedAtMinute,
                                        Number(val)
                                      );
                                    }
                                  }}
                                  onBlur={() => {
                                    const cur = inlineStepDurationStr[stepDurationKey];
                                    if (cur === '' || isNaN(Number(cur)) || Number(cur) < 0) {
                                      setInlineStepDurationStr((prev) => {
                                        const copy = { ...prev };
                                        delete copy[stepDurationKey];
                                        return copy;
                                      });
                                    }
                                  }}
                                  className="w-8 bg-transparent text-amber-300 font-bold text-center focus:outline-hidden"
                                />
                                <span className="text-slate-400">м</span>
                              </div>
                            </div>
                          </div>

                          {/* Expandable per-step Stove & Lid Controller */}
                          {isStepRegimeOpen && group.hasThermalProcessing && (
                            <div className="pt-1 animate-in fade-in duration-150">
                              <StoveController
                                vesselType={vessel.type}
                                heatSource={group.effectiveHeatSource}
                                electricLevel={group.effectiveElectricLevel}
                                gasLevel={group.effectiveGasLevel}
                                ovenTempC={group.effectiveOvenTempC}
                                ovenMode={group.effectiveOvenMode}
                                extraMode={group.effectiveExtraMode}
                                hasLid={group.effectiveHasLid}
                                cookingMode={group.stepCookingMode}
                                isStepOverride={true}
                                hasCustomStepRegime={group.hasCustomRegime}
                                langCode={langCode}
                                onResetStepRegime={() =>
                                  handleResetStepGroupRegime(vessel.id, group.addedAtMinute)
                                }
                                onRemoveThermal={() => {
                                  handleUpdateStepGroupRegime(vessel.id, group.addedAtMinute, {
                                    hasThermalProcessing: false,
                                  });
                                  setExpandedStepRegimeKey(null);
                                }}
                                onHeatSourceChange={(heatSource) =>
                                  handleUpdateStepGroupRegime(vessel.id, group.addedAtMinute, {
                                    hasThermalProcessing: true,
                                    stepHeatSource: heatSource,
                                    stepOvenTempC:
                                      heatSource === 'oven' ? group.effectiveOvenTempC || 180 : undefined,
                                    stepOvenMode:
                                      heatSource === 'oven'
                                        ? group.effectiveOvenMode || 'top_bottom'
                                        : undefined,
                                  })
                                }
                                onElectricLevelChange={(electricLevel) =>
                                  handleUpdateStepGroupRegime(vessel.id, group.addedAtMinute, {
                                    hasThermalProcessing: true,
                                    stepElectricLevel: electricLevel,
                                  })
                                }
                                onGasLevelChange={(gasLevel) =>
                                  handleUpdateStepGroupRegime(vessel.id, group.addedAtMinute, {
                                    hasThermalProcessing: true,
                                    stepGasLevel: gasLevel,
                                  })
                                }
                                onOvenTempChange={(ovenTempC) =>
                                  handleUpdateStepGroupRegime(vessel.id, group.addedAtMinute, {
                                    hasThermalProcessing: true,
                                    stepOvenTempC: ovenTempC,
                                  })
                                }
                                onOvenModeChange={(ovenMode) =>
                                  handleUpdateStepGroupRegime(vessel.id, group.addedAtMinute, {
                                    hasThermalProcessing: true,
                                    stepOvenMode: ovenMode,
                                  })
                                }
                                onExtraModeChange={(extraMode) =>
                                  handleUpdateStepGroupRegime(vessel.id, group.addedAtMinute, {
                                    hasThermalProcessing: true,
                                    stepExtraMode: extraMode,
                                  })
                                }
                                onHasLidChange={(hasLid) =>
                                  handleUpdateStepGroupRegime(vessel.id, group.addedAtMinute, {
                                    hasThermalProcessing: true,
                                    stepHasLid: hasLid,
                                  })
                                }
                              />
                            </div>
                          )}

                          {/* Items inside this step */}
                          <div className="space-y-1">
                            {group.items.map((step) => {
                              const isWater = isWaterFoodItem(step.foodId, step.foodName);
                              const isTransfer = isVesselTransferItem(step);
                              const isRegimeOnly = isRegimeOnlyStepItem(step);

                              if (isRegimeOnly) {
                                return (
                                  <div
                                    key={step.id}
                                    className="flex items-center justify-between gap-2 px-2 py-1 rounded-lg bg-amber-950/20 border border-amber-500/20 text-[11px]"
                                  >
                                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                      <Flame className="w-3 h-3 text-amber-400 shrink-0" />
                                      <span className="text-amber-200/90 font-medium truncate">
                                        Готовка содержимого в посуде ({group.regimeBadgeText})
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <span className="text-[9px] font-mono tabular-nums text-amber-300 font-bold">
                                        {formatCompactDurationMinutes(group.durationMinutes)}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveStepItem(vessel.id, step.id)}
                                        className="p-0.5 text-slate-500 hover:text-red-400"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                );
                              }

                              return (
                                <div
                                  key={step.id}
                                  className={`flex items-center justify-between gap-2 px-2 py-1 rounded-lg border text-[11px] ${
                                    isTransfer
                                      ? 'bg-cyan-950/30 border-cyan-500/30'
                                      : 'bg-slate-900/70 border-slate-800/70'
                                  }`}
                                >
                                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                    {isWater && (
                                      <Droplet className="w-3 h-3 text-blue-400 shrink-0" />
                                    )}
                                    <span
                                      className={`font-semibold truncate ${
                                        isTransfer ? 'text-cyan-300' : 'text-slate-200'
                                      }`}
                                    >
                                      {step.foodName}
                                    </span>

                                    {/* Inline editable weight in grams */}
                                    <div className="flex items-center gap-0.5 shrink-0">
                                      <input
                                        type="number"
                                        min="1"
                                        value={inlineGramsStr[step.id] ?? String(step.grams)}
                                        onChange={(e) => {
                                          const v = e.target.value;
                                          setInlineGramsStr((prev) => ({
                                            ...prev,
                                            [step.id]: v,
                                          }));
                                          if (v !== '' && !isNaN(Number(v))) {
                                            handleUpdateStepItemGrams(
                                              vessel.id,
                                              step.id,
                                              Number(v)
                                            );
                                          }
                                        }}
                                        onBlur={() => {
                                          const cur = inlineGramsStr[step.id];
                                          if (
                                            cur === '' ||
                                            isNaN(Number(cur)) ||
                                            Number(cur) <= 0
                                          ) {
                                            setInlineGramsStr((prev) => {
                                              const copy = { ...prev };
                                              delete copy[step.id];
                                              return copy;
                                            });
                                          }
                                        }}
                                        className="w-12 px-1 py-0.5 rounded bg-slate-950 border border-slate-700 text-emerald-400 font-mono tabular-nums text-[10px] text-center"
                                      />
                                      <span className="text-[9px] text-slate-400 font-mono">
                                        {isWater ? 'мл' : 'г'}
                                      </span>
                                    </div>

                                    {step.isExtracted && (
                                      <span className="px-1 py-0.2 rounded bg-purple-500/20 text-purple-300 text-[8px]">
                                        вынуть
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-1.5 shrink-0">
                                    {sessionAiCreatedFoodIds.includes(step.foodId) && (
                                      <span
                                        title="Новый продукт, добавленный ИИ для этого рецепта (при удалении из рецепта удалится и из библиотеки)"
                                        className="px-1 py-0.2 rounded bg-purple-500/20 border border-purple-500/30 text-purple-300 text-[8px] font-bold"
                                      >
                                        ИИ
                                      </span>
                                    )}
                                    <span className="text-[9px] font-mono tabular-nums text-emerald-400 font-bold">
                                      {formatCompactDurationMinutes(
                                        step.cumulativeDurationMinutes || step.durationMinutes
                                      )}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveStepItem(vessel.id, step.id)}
                                      title={
                                        sessionAiCreatedFoodIds.includes(step.foodId)
                                          ? 'Удалить из рецепта и автоматически удалить созданный ИИ продукт из библиотеки'
                                          : 'Удалить из рецепта'
                                      }
                                      className="px-1.5 py-0.5 rounded bg-red-950/30 hover:bg-red-900/50 border border-red-500/25 text-red-300 hover:text-red-200 flex items-center gap-1 text-[9px] font-medium transition"
                                    >
                                      <Trash2 className="w-2.5 h-2.5" />
                                      <span className="hidden sm:inline">Удалить</span>
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* ADD STEP FORM: Time + [Добавить продукты] + [Добавить термообработку] */}
                {activeAddStepVesselId === vessel.id && (
                  <div className="p-3 rounded-xl bg-slate-950 border border-emerald-500/40 space-y-3 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-emerald-400">
                        Новый шаг в «{getVesselDisplayName(vessel, vIdx)}»
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveAddStepVesselId(null);
                          setQueuedStepProducts([]);
                          setSelectedFoodId('');
                        }}
                        className="text-[10px] text-slate-400 hover:text-white"
                      >
                        Закрыть
                      </button>
                    </div>

                    {/* 1. Time Row (Always shown even for mixing without thermal processing) */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] text-slate-400 mb-0.5 font-mono">
                          На минуте посуды (0 = старт):
                        </label>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min={0}
                            value={stepAddedAtStr}
                            onChange={(e) => {
                              const v = e.target.value;
                              setStepAddedAtStr(v);
                              if (v !== '' && !isNaN(Number(v))) {
                                setStepRegimeDraft(
                                  getDefaultStepRegimeForVessel(vessel, vIdx, Number(v))
                                );
                              }
                            }}
                            onBlur={() => {
                              if (stepAddedAtStr === '' || isNaN(Number(stepAddedAtStr))) {
                                setStepAddedAtStr('0');
                              }
                            }}
                            className="w-full px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs text-amber-300 font-mono tabular-nums"
                          />
                          <span className="text-[9px] text-slate-400 font-mono">м</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[9px] text-slate-400 mb-0.5 font-mono">
                          Длительность шага:
                        </label>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min={0}
                            value={stepDurationStr}
                            onChange={(e) => setStepDurationStr(e.target.value)}
                            onBlur={() => {
                              if (stepDurationStr === '' || isNaN(Number(stepDurationStr))) {
                                setStepDurationStr('0');
                              }
                            }}
                            className="w-full px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs text-emerald-300 font-mono tabular-nums"
                          />
                          <span className="text-[9px] text-slate-400 font-mono">м</span>
                        </div>
                      </div>
                    </div>

                    {/* 2. Two Action Buttons inside the Step: [Добавить продукты] & [Добавить термообработку] */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const next = !showProductsSection;
                          setShowProductsSection(next);
                          if (next && !selectedFoodId && defaultWaterItem) {
                            setSelectedFoodId(defaultWaterItem.id);
                            setStepFoodSearch(defaultWaterItem.name);
                            setStepGramsStr(
                              isWaterFoodItem(defaultWaterItem.id, defaultWaterItem.name)
                                ? '1000'
                                : '150'
                            );
                          }
                        }}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                          showProductsSection || queuedStepProducts.length > 0
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-xs'
                            : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        {showProductsSection || queuedStepProducts.length > 0 ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Plus className="w-3.5 h-3.5 text-emerald-400" />
                        )}
                        <Utensils className="w-3.5 h-3.5" />
                        <span>
                          Добавить продукты
                          {queuedStepProducts.length > 0 && ` (${queuedStepProducts.length})`}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowThermalSection((prev) => !prev)}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                          showThermalSection
                            ? 'bg-orange-500/20 text-orange-300 border-orange-500/50 shadow-xs'
                            : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        {showThermalSection ? (
                          <Check className="w-3.5 h-3.5 text-orange-400" />
                        ) : (
                          <Plus className="w-3.5 h-3.5 text-orange-400" />
                        )}
                        <Flame className="w-3.5 h-3.5" />
                        <span>Добавить термообработку</span>
                      </button>
                    </div>

                    {/* Status hint showing whether this step will be cold mixing or thermal cooking */}
                    <div className="text-[10px] px-2 py-1 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                      <span className="text-slate-400">Режим этого шага:</span>
                      {showThermalSection ? (
                        <span className="font-bold text-orange-300 flex items-center gap-1">
                          <Flame className="w-3 h-3" />
                          <span>С термообработкой</span>
                        </span>
                      ) : (
                        <span className="font-bold text-slate-300">
                          🥣 Смешивание / Без термообработки (выкипание 0 мл)
                        </span>
                      )}
                    </div>

                    {/* SECTION A: ADD PRODUCTS (shown when "Добавить продукты" is toggled on) */}
                    {showProductsSection && (
                      <div className="p-2.5 rounded-xl bg-slate-900/90 border border-emerald-500/30 space-y-2.5 animate-in fade-in duration-150">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider">
                            Продукты для добавления / смешивания в шаге
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setShowProductsSection(false);
                              setSelectedFoodId('');
                            }}
                            className="text-[10px] text-slate-400 hover:text-white"
                          >
                            Скрыть
                          </button>
                        </div>

                        {/* Queued products already added to this step draft */}
                        {queuedStepProducts.length > 0 && (
                          <div className="space-y-1">
                            {queuedStepProducts.map((qp) => (
                              <div
                                key={qp.id}
                                className="flex items-center justify-between px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px]"
                              >
                                <span className="text-slate-200 font-medium truncate">
                                  {qp.foodName}{' '}
                                  <b className="text-emerald-400 font-mono">({qp.grams}г)</b>
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setQueuedStepProducts((prev) =>
                                      prev.filter((item) => item.id !== qp.id)
                                    )
                                  }
                                  className="text-slate-500 hover:text-red-400 p-0.5"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* SINGLE UNIFIED ROW: Ingredient or other cookware contents (Water by default, searches by first letters on typing) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div className="relative">
                            <label className="block text-[9px] text-slate-400 mb-0.5">
                              Ингредиент или содержимое другой посуды:
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                value={stepFoodSearch}
                                placeholder="Вода (или введите первые буквы продукта...)"
                                onFocus={(e) => {
                                  e.target.select();
                                  setIsProductDropdownOpen(true);
                                }}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setStepFoodSearch(val);
                                  setIsProductDropdownOpen(true);

                                  const q = val.trim().toLowerCase();
                                  if (!q) {
                                    setSelectedFoodId('');
                                    return;
                                  }

                                  // Automatically match the best prefix or exact match from library as user types
                                  const exactOrPrefix =
                                    library.find((item) => item.name.toLowerCase() === q) ||
                                    library.find((item) => item.name.toLowerCase().startsWith(q)) ||
                                    library.find((item) => item.name.toLowerCase().includes(q));

                                  if (exactOrPrefix) {
                                    setSelectedFoodId(exactOrPrefix.id);
                                    if (isWaterFoodItem(exactOrPrefix.id, exactOrPrefix.name)) {
                                      setStepGramsStr('1000');
                                    } else if (stepGramsStr === '1000') {
                                      setStepGramsStr('150');
                                    }
                                  } else {
                                    setSelectedFoodId('');
                                  }
                                }}
                                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white focus:outline-hidden focus:border-emerald-500"
                              />
                            </div>

                            {/* Dropdown list of matching library products & other cookware contents */}
                            {isProductDropdownOpen && (
                              <div className="absolute left-0 right-0 top-14 z-30 max-h-48 overflow-y-auto rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-1 space-y-0.5">
                                {otherVessels.length > 0 && (
                                  <div className="pb-1 mb-1 border-b border-slate-800">
                                    <div className="px-2 py-0.5 text-[9px] font-bold text-cyan-400">
                                      Переложить содержимое другой посуды:
                                    </div>
                                    {otherVessels.map(({ vessel: ov, index: ovIdx }) => {
                                      const { cookedWeightGrams, totalTimeMinutes: ovDur } =
                                        calculateSingleVesselCookedWeight(ov, ovIdx);
                                      const ovStart =
                                        ovIdx === 0 ? 0 : Number(ov.startOffsetMinutes) || 0;
                                      const ovEnd = ovStart + ovDur;
                                      const ovIcon = getVesselDisplayIcon(ov);
                                      const ovName = getVesselDisplayName(ov, ovIdx);
                                      const transferId = `vessel-transfer:${ov.id}`;
                                      return (
                                        <button
                                          key={transferId}
                                          type="button"
                                          onClick={() => {
                                            setSelectedFoodId(transferId);
                                            setStepFoodSearch(`Содержимое «${ovName}»`);
                                            setStepGramsStr(String(cookedWeightGrams));
                                            setIsProductDropdownOpen(false);
                                          }}
                                          className={`w-full text-left px-2 py-1.5 rounded-lg text-xs flex items-center justify-between transition ${
                                            selectedFoodId === transferId
                                              ? 'bg-cyan-500/20 text-cyan-200 font-bold'
                                              : 'text-cyan-300 hover:bg-slate-800'
                                          }`}
                                        >
                                          <span className="truncate flex items-center gap-1.5">
                                            <CookwareIcon icon={ovIcon} vesselName={ov.name} className="w-4 h-4" />
                                            <span>Содержимое «{ovName}»</span>
                                          </span>
                                          <span className="text-[10px] font-mono text-cyan-400 shrink-0 ml-1">
                                            ~{cookedWeightGrams}г ({ovEnd}м)
                                          </span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}

                                {filteredFoodLibrary.length === 0 ? (
                                  <div className="px-2 py-2 text-[11px] text-slate-500 text-center">
                                    Продукты не найдены
                                  </div>
                                ) : (
                                  filteredFoodLibrary.map((f) => {
                                    const isWater = isWaterFoodItem(f.id, f.name);
                                    const isSelected = selectedFoodId === f.id;
                                    return (
                                      <button
                                        key={f.id}
                                        type="button"
                                        onClick={() => {
                                          setSelectedFoodId(f.id);
                                          setStepFoodSearch(f.name);
                                          setStepGramsStr(isWater ? '1000' : '150');
                                          setIsProductDropdownOpen(false);
                                        }}
                                        className={`w-full text-left px-2 py-1.5 rounded-lg text-xs flex items-center justify-between transition ${
                                          isSelected
                                            ? 'bg-emerald-500/20 text-emerald-200 font-bold'
                                            : 'text-slate-200 hover:bg-slate-800'
                                        }`}
                                      >
                                        <span className="truncate">
                                          {isWater ? `💧 ${f.name}` : f.name}
                                        </span>
                                        <span className="text-[10px] font-mono text-slate-400 shrink-0 ml-1">
                                          {Math.round(f.nutrients?.calories || 0)} ккал
                                        </span>
                                      </button>
                                    );
                                  })
                                )}
                              </div>
                            )}
                          </div>

                          <div>
                            <label className="block text-[9px] text-slate-400 mb-0.5">
                              Вес / объём (г / мл):
                            </label>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                min={1}
                                value={stepGramsStr}
                                onChange={(e) => setStepGramsStr(e.target.value)}
                                onBlur={() => {
                                  if (
                                    stepGramsStr === '' ||
                                    isNaN(Number(stepGramsStr)) ||
                                    Number(stepGramsStr) <= 0
                                  ) {
                                    setStepGramsStr('100');
                                  }
                                }}
                                className="flex-1 px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white font-mono tabular-nums"
                              />
                              <button
                                type="button"
                                disabled={!selectedFoodId}
                                onClick={() => handleQueueProductInForm(vessel.id)}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold whitespace-nowrap"
                              >
                                + Ещё продукт
                              </button>
                            </div>
                          </div>
                        </div>

                        {selectedFoodId &&
                          !selectedFoodId.startsWith('vessel-transfer:') && (
                            <label className="flex items-center gap-1.5 text-[11px] text-slate-300 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={stepIsExtracted}
                                onChange={(e) => setStepIsExtracted(e.target.checked)}
                                className="rounded accent-emerald-500"
                              />
                              <span>Вынуть продукт из посуды после готовки</span>
                            </label>
                          )}
                      </div>
                    )}

                    {/* SECTION B: ADD THERMAL PROCESSING (shown ONLY when "Добавить термообработку" is toggled on) */}
                    {showThermalSection && (
                      <div className="space-y-1.5 animate-in fade-in duration-150">
                        <div className="flex items-center justify-between text-[10px] text-orange-300 px-0.5">
                          <span className="font-bold">
                            Настройка термообработки и крышки для этого шага:
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowThermalSection(false)}
                            className="text-slate-400 hover:text-white"
                          >
                            Убрать термообработку
                          </button>
                        </div>
                        <StoveController
                          vesselType={vessel.type}
                          heatSource={stepRegimeDraft.heatSource}
                          electricLevel={stepRegimeDraft.electricLevel}
                          gasLevel={stepRegimeDraft.gasLevel}
                          ovenTempC={stepRegimeDraft.ovenTempC}
                          ovenMode={stepRegimeDraft.ovenMode}
                          extraMode={stepRegimeDraft.extraMode}
                          hasLid={stepRegimeDraft.hasLid}
                          langCode={langCode}
                          cookingMode={detectRegimeCookingMode(
                            {
                              hasThermalProcessing: true,
                              heatSource: stepRegimeDraft.heatSource,
                              electricLevel: stepRegimeDraft.electricLevel,
                              gasLevel: stepRegimeDraft.gasLevel,
                              ovenTempC: stepRegimeDraft.ovenTempC,
                              ovenMode: stepRegimeDraft.ovenMode,
                              extraMode: stepRegimeDraft.extraMode,
                              hasLid: stepRegimeDraft.hasLid,
                            },
                            waterFromStepsMl,
                            100
                          )}
                          isStepOverride={true}
                          onHeatSourceChange={(heatSource) =>
                            setStepRegimeDraft((prev) => ({
                              ...prev,
                              heatSource,
                              ovenTempC:
                                heatSource === 'oven' ? prev.ovenTempC || 180 : prev.ovenTempC,
                              ovenMode:
                                heatSource === 'oven'
                                  ? prev.ovenMode || 'top_bottom'
                                  : prev.ovenMode,
                            }))
                          }
                          onElectricLevelChange={(electricLevel) =>
                            setStepRegimeDraft((prev) => ({ ...prev, electricLevel }))
                          }
                          onGasLevelChange={(gasLevel) =>
                            setStepRegimeDraft((prev) => ({ ...prev, gasLevel }))
                          }
                          onOvenTempChange={(ovenTempC) =>
                            setStepRegimeDraft((prev) => ({ ...prev, ovenTempC }))
                          }
                          onOvenModeChange={(ovenMode) =>
                            setStepRegimeDraft((prev) => ({ ...prev, ovenMode }))
                          }
                          onExtraModeChange={(extraMode) =>
                            setStepRegimeDraft((prev) => ({ ...prev, extraMode }))
                          }
                          onHasLidChange={(hasLid) =>
                            setStepRegimeDraft((prev) => ({ ...prev, hasLid }))
                          }
                        />
                      </div>
                    )}

                    <button
                      type="button"
                      disabled={
                        !showThermalSection &&
                        queuedStepProducts.length === 0 &&
                        !(showProductsSection && Boolean(selectedFoodId))
                      }
                      onClick={() => handleAddStepItem(vessel.id)}
                      className="w-full py-2 rounded-xl text-xs font-bold text-white shadow-sm transition active:scale-98 disabled:opacity-40"
                      style={{ backgroundColor: accentColor }}
                    >
                      {showThermalSection &&
                      queuedStepProducts.length === 0 &&
                      !(showProductsSection && Boolean(selectedFoodId))
                        ? 'Сохранить шаг термообработки'
                        : showThermalSection
                        ? 'Сохранить шаг (продукты + термообработка)'
                        : 'Сохранить шаг смешивания (без термообработки)'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* INTUITIVE "+ ДОБАВИТЬ ПОСУДУ" BUTTON AT THE BOTTOM UNDER THE LAST COOKWARE */}
      <button
        type="button"
        onClick={handleAddVessel}
        className="w-full py-2.5 px-4 rounded-xl border border-dashed border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-98 shadow-xs"
      >
        <Plus className="w-4 h-4" />
        <span>Добавить посуду</span>
      </button>

      {/* LIVE PHYSICS & WEIGHT CHANGE DASHBOARD */}
      <div className="p-3 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-bold text-white flex items-center gap-1.5">
            <span>⚖️</span>
            <span>Итог термообработки</span>
          </span>

          <button
            type="button"
            onClick={handleRunChefAiAnalysis}
            disabled={isAiAnalyzing}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 text-[11px] font-bold transition"
          >
            {isAiAnalyzing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-purple-300" />
            )}
            <span>ИИ-анализ</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-center font-mono tabular-nums">
          <div className="p-1.5 rounded-xl bg-slate-900/90 border border-slate-800">
            <div className="text-[9px] text-slate-400 font-sans">Сырой вес</div>
            <div className="text-xs font-bold text-slate-200">{physics.rawWeightGrams}г</div>
          </div>

          <div className="p-1.5 rounded-xl bg-slate-900/90 border border-slate-800">
            <div className="text-[9px] text-slate-400 font-sans">Выкипание</div>
            <div className="text-xs font-bold text-blue-400">
              {physics.evaporatedWaterMl > 0 ? `-${physics.evaporatedWaterMl}мл` : '0мл'}
            </div>
          </div>

          <div className="p-1.5 rounded-xl bg-slate-900/90 border border-slate-800">
            <div className="text-[9px] text-slate-400 font-sans">Время</div>
            <div className="text-xs font-bold text-amber-300">
              {formatCompactDurationMinutes(physics.totalRecipeTimeMinutes)}
            </div>
          </div>

          <div className="p-1.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30">
            <div className="text-[9px] text-emerald-300/80 font-sans">Готовое</div>
            <div className="text-xs font-bold text-emerald-400">
              {physics.finalDishWeightGrams}г
            </div>
          </div>
        </div>

        {/* AI Chef Analysis Note if present */}
        {cookingProcessConfig.aiAnalysis && (
          <div className="p-2.5 rounded-xl bg-purple-950/30 border border-purple-500/40 text-[11px] text-slate-200 space-y-1 animate-in fade-in duration-200">
            <div className="font-bold text-purple-300">Заключение ИИ-шефа:</div>
            <p className="text-slate-300 leading-relaxed">
              {cookingProcessConfig.aiAnalysis.note}
            </p>
            {cookingProcessConfig.aiAnalysis.nutrientImpact && (
              <p className="text-purple-200/90 text-[10px]">
                🔬 <b>Нутриенты:</b> {cookingProcessConfig.aiAnalysis.nutrientImpact}
              </p>
            )}
            {cookingProcessConfig.aiAnalysis.chefTips && (
              <p className="text-amber-200/90 text-[10px]">
                💡 <b>Совет:</b> {cookingProcessConfig.aiAnalysis.chefTips}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
