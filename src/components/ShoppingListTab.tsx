import React, { useState } from 'react';
import {
  ShoppingListItem,
  LibraryFoodItem,
  LocalizationLabels,
} from '../types/config';
import { ThemeStyles, getBorderRadiusClass } from '../utils/themeHelper';
import { getUITranslations } from '../utils/translations';
import {
  ShoppingCart,
  Plus,
  Trash2,
  Search,
  X,
  Droplet,
} from 'lucide-react';
import { isWaterFoodItem } from '../utils/culinaryPhysics';

interface ShoppingListTabProps {
  shoppingList: ShoppingListItem[];
  library: LibraryFoodItem[];
  themeStyles: ThemeStyles;
  accentColor: string;
  borderRadius: string;
  langCode?: string;
  labels?: Partial<LocalizationLabels>;
  onAddItem: (item: { name: string; quantity?: string; foodId?: string }) => void;
  onUpdateQuantity: (id: string, quantity: string) => void;
  onDeleteItem: (id: string) => void;
}

export const ShoppingListTab: React.FC<ShoppingListTabProps> = ({
  shoppingList,
  library,
  themeStyles,
  accentColor,
  borderRadius,
  langCode = 'ru',
  labels,
  onAddItem,
  onUpdateQuantity,
  onDeleteItem,
}) => {
  const radiusClass = getBorderRadiusClass(borderRadius);
  const t = getUITranslations(langCode, labels);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [librarySearch, setLibrarySearch] = useState('');
  const [selectedFood, setSelectedFood] = useState<LibraryFoodItem | null>(null);
  const [quantityInput, setQuantityInput] = useState('');

  const filteredLibrary = library.filter((f) =>
    f.name.toLowerCase().includes(librarySearch.toLowerCase())
  );

  const handleOpenAddModal = () => {
    setLibrarySearch('');
    setSelectedFood(null);
    setQuantityInput('');
    setIsAddModalOpen(true);
  };

  const handleConfirmAddFromLibrary = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFood) return;
    onAddItem({
      name: selectedFood.name,
      quantity: quantityInput.trim(),
      foodId: selectedFood.id,
    });
    setSelectedFood(null);
    setQuantityInput('');
    setIsAddModalOpen(false);
  };

  const handleQuickAddFromLibrary = (food: LibraryFoodItem) => {
    setSelectedFood(food);
  };

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <div
        className={`border ${themeStyles.borderColor} ${themeStyles.cardBg} ${radiusClass} p-3.5 shadow-sm space-y-3`}
      >
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${accentColor}25`, color: accentColor }}
            >
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className={`text-sm font-bold leading-tight ${themeStyles.textPrimary}`}>
                {t.shoppingListTitle}
              </h3>
              <p className="text-[11px] text-slate-400">
                {t.shoppingListSubtitle}{' '}
                <b className="text-slate-200">{shoppingList.length}</b>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="min-h-[42px] flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl text-white shadow-xs transition active:scale-95 whitespace-nowrap"
            style={{ backgroundColor: accentColor }}
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>{t.add}</span>
          </button>
        </div>
      </div>

      {/* Shopping Items List */}
      {shoppingList.length === 0 ? (
        <div
          className={`border ${themeStyles.borderColor} ${themeStyles.cardBg} ${radiusClass} p-8 text-center space-y-3`}
        >
          <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center mx-auto text-slate-400">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className={`text-sm font-bold ${themeStyles.textPrimary}`}>
              {t.shoppingListEmptyTitle}
            </h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              {t.shoppingListEmptyHint}
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="min-h-[40px] inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl text-white shadow-xs transition active:scale-95"
            style={{ backgroundColor: accentColor }}
          >
            <Plus className="w-4 h-4" />
            <span>{t.addFromLibraryBtn}</span>
          </button>
        </div>
      ) : (
        <div
          className={`border ${themeStyles.borderColor} ${themeStyles.cardBg} ${radiusClass} p-3.5 shadow-sm space-y-2`}
        >
          {shoppingList.map((item) => (
            <div
              key={item.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                </div>
                <span className={`text-xs font-bold break-words ${themeStyles.textPrimary}`}>
                  {item.name}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <input
                  type="text"
                  placeholder={t.shoppingQuantityPlaceholder}
                  value={item.quantity}
                  onChange={(e) => onUpdateQuantity(item.id, e.target.value)}
                  className="flex-1 sm:w-52 min-h-[38px] px-3 py-1.5 rounded-xl bg-slate-950/90 border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
                />

                <button
                  type="button"
                  onClick={() => onDeleteItem(item.id)}
                  className="p-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 text-red-300 hover:text-red-200 transition shrink-0"
                  title={t.delete}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Add product from user's Food Library */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg border border-slate-700 bg-slate-900 rounded-2xl shadow-2xl p-4 sm:p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <div
                  className="p-2 rounded-xl"
                  style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
                >
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {t.selectProductForShoppingTitle}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {t.selectProductForShoppingHint}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmAddFromLibrary} className="space-y-3.5 text-xs">
              {/* Search Library */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder={t.searchLibraryPlaceholder}
                  value={librarySearch}
                  onChange={(e) => setLibrarySearch(e.target.value)}
                  className="w-full min-h-[40px] pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              {/* Products list from library */}
              <div className="max-h-56 overflow-y-auto space-y-1.5 pr-0.5">
                {filteredLibrary.length === 0 ? (
                  <div className="p-4 text-center text-slate-400 border border-dashed border-slate-800 rounded-xl">
                    {t.nothingFoundInLibrary}
                  </div>
                ) : (
                  filteredLibrary.map((food) => {
                    const isSelected = selectedFood?.id === food.id;
                    return (
                      <div
                        key={food.id}
                        onClick={() => handleQuickAddFromLibrary(food)}
                        className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition ${
                          isSelected
                            ? 'bg-emerald-500/20 border-emerald-500 text-white'
                            : 'bg-slate-800/70 hover:bg-slate-800 border-slate-700/70 text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {isWaterFoodItem(food.id, food.name) && (
                            <Droplet className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          )}
                          <span className="font-semibold truncate">{food.name}</span>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 ${
                            isSelected
                              ? 'bg-emerald-500 text-white'
                              : 'bg-slate-700 text-slate-300'
                          }`}
                        >
                          {isSelected ? t.selectedBadge : t.selectBadge}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Quantity input once product is chosen */}
              {selectedFood && (
                <div className="p-3 rounded-xl bg-slate-950/80 border border-emerald-500/40 space-y-2 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300 font-semibold">
                      {t.productLabel}: <b className="text-emerald-400">{selectedFood.name}</b>
                    </span>
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      {t.howMuchToBuyLabel}
                    </label>
                    <input
                      type="text"
                      placeholder={t.shoppingQuantityPlaceholder}
                      value={quantityInput}
                      onChange={(e) => setQuantityInput(e.target.value)}
                      autoFocus
                      className="w-full min-h-[40px] px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-hidden focus:border-emerald-500"
                    />
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="min-h-[40px] px-3.5 py-2 text-xs rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={!selectedFood}
                  className="min-h-[40px] px-4 py-2 text-xs font-bold rounded-xl text-white shadow-md disabled:opacity-50"
                  style={{ backgroundColor: accentColor }}
                >
                  {t.addToListButton}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
