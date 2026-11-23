import { useMemo, useState } from 'react';
import {
  Check,
  Leaf,
  Moon,
  Plus,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import { CAMPUS_KITCHENS, CAMPUS_PINS, formatINR } from '../data/campusData';
import {
  CampusPin,
  Dish,
  KitchenOperationalState,
  MenuCategory,
} from '../types/quadbite';
import { ResilientImage } from './ResilientImage';

interface MarketplaceSectionProps {
  onQuickAddDish: (dish: Dish) => void;
  onSelectDishForModal: (dish: Dish) => void;
  recentlyAddedId: string | null;
  kitchenStatuses: Record<string, KitchenOperationalState>;
  selectedPin: CampusPin;
  onSelectPin: (pin: CampusPin) => void;
}

const CATEGORY_TABS: { id: MenuCategory; label: string }[] = [
  { id: 'all', label: 'All Menus' },
  { id: 'kerala', label: 'Kerala Classics' },
  { id: 'indian', label: 'Indian & Tiffin' },
  { id: 'western', label: 'Western & Bowls' },
  { id: 'under-120', label: 'Under ₹120' },
  { id: 'late-night', label: 'Hostel Exam & Night' },
];

export function MarketplaceSection({
  onQuickAddDish,
  onSelectDishForModal,
  recentlyAddedId,
  kitchenStatuses,
  selectedPin,
  onSelectPin,
}: MarketplaceSectionProps) {
  const [activeCategory, setActiveCategory] = useState<MenuCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [vegetarianOnly, setVegetarianOnly] = useState(false);

  const isHostelPin = selectedPin.campusGroup === 'Shared Hostels & Grounds';
  const boysHostelPin = CAMPUS_PINS.find((p) => p.id === 'boys-hostels');
  const girlsHostelPin = CAMPUS_PINS.find(
    (p) => p.id === 'girls-hostel-grounds'
  );

  const filteredKitchens = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return CAMPUS_KITCHENS.map((kitchen) => {
      const matchingDishes = kitchen.dishes.filter((dish) => {
        const matchesCategory =
          activeCategory === 'all' ||
          (activeCategory === 'late-night'
            ? Boolean(dish.lateNightEligible)
            : dish.categories.includes(activeCategory));
        const matchesVeg = !vegetarianOnly || Boolean(dish.vegetarian);
        const matchesSearch =
          !query ||
          dish.name.toLowerCase().includes(query) ||
          dish.description.toLowerCase().includes(query) ||
          kitchen.name.toLowerCase().includes(query) ||
          kitchen.cuisine.toLowerCase().includes(query) ||
          kitchen.styleGroup.toLowerCase().includes(query);

        return matchesCategory && matchesVeg && matchesSearch;
      });

      return {
        ...kitchen,
        dishes: matchingDishes,
      };
    }).filter((kitchen) => kitchen.dishes.length > 0);
  }, [activeCategory, searchQuery, vegetarianOnly]);

  return (
    <section id="menu" className="py-14 lg:py-16 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
          <div className="max-w-2xl">
            <p className="text-xs font-medium text-slate-500 mb-2">
              Kerala, Indian &amp; Western Kitchens · Live Stock &amp; Prep Sync
            </p>
            <h2
              className="font-display text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight"
              style={{ textWrap: 'balance' }}
            >
              Student-offered prices across local &amp; western favorites
            </h2>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1 sm:w-64">
              <Search
                className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search biriyani, appam, dosa..."
                aria-label="Search campus menu"
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-700"
              />
            </div>

            <button
              type="button"
              onClick={() => setVegetarianOnly((prev) => !prev)}
              aria-pressed={vegetarianOnly}
              className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                vegetarianOnly
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
              <span>Vegetarian</span>
            </button>
          </div>
        </div>

        <div
          className="flex items-center gap-1.5 p-1.5 bg-slate-200/70 rounded-xl overflow-x-auto mb-6 w-fit max-w-full"
          role="tablist"
          aria-label="Menu categories"
        >
          {CATEGORY_TABS.map((tab) => {
            const isActive = activeCategory === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveCategory(tab.id)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.id === 'late-night' && (
                  <Moon className="w-3.5 h-3.5 text-blue-700" aria-hidden="true" />
                )}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {activeCategory === 'late-night' && (
          <div className="mb-8 p-4 sm:p-5 bg-slate-900 text-white rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-300">
                <Moon className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Hostel Late-Night &amp; Exam Week Dispatch (6:30 PM – 11:30 PM)</span>
              </div>
              <p className="text-sm text-slate-200">
                {isHostelPin
                  ? `Delivering direct to ${selectedPin.name}. Hot chai, kothu parotta, ramen, and exam boxes stay open for residential blocks.`
                  : 'Late-night & exam combos deliver exclusively to Saintgits residential Girls’ and Boys’ Hostel pins.'}
              </p>
            </div>
            {!isHostelPin && (
              <div className="flex flex-wrap gap-2 shrink-0">
                {girlsHostelPin && (
                  <button
                    type="button"
                    onClick={() => onSelectPin(girlsHostelPin)}
                    className="px-3 py-2 text-xs font-semibold bg-white text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  >
                    Switch to Girls’ Hostels
                  </button>
                )}
                {boysHostelPin && (
                  <button
                    type="button"
                    onClick={() => onSelectPin(boysHostelPin)}
                    className="px-3 py-2 text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
                  >
                    Switch to Boys’ Hostels
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {filteredKitchens.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
            <p className="font-display text-lg font-semibold text-slate-900">
              No dishes match your current filters
            </p>
            <p className="text-sm text-slate-600 mt-1 mb-5">
              Try clearing your search or switching back to all campus menus.
            </p>
            <button
              type="button"
              onClick={() => {
                setActiveCategory('all');
                setSearchQuery('');
                setVegetarianOnly(false);
              }}
              className="px-4 py-2.5 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors cursor-pointer"
            >
              Reset Menu Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {filteredKitchens.map((kitchen) => {
              const opState = kitchenStatuses[kitchen.id];
              const prepOffset = opState?.prepTimeOffsetMin ?? 0;
              const busyLevel = opState?.busyLevel ?? 'normal';
              const soldOutIds = opState?.soldOutDishIds ?? [];

              return (
                <article
                  key={kitchen.id}
                  className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col transition-transform duration-150 hover:-translate-y-0.5"
                >
                  <div className="aspect-4/3 w-full bg-slate-100 overflow-hidden">
                    <ResilientImage
                      src={kitchen.imagePath}
                      alt={kitchen.imageAlt}
                      fallbackLabel={kitchen.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="p-6 flex-1 flex flex-col">
                    <div className="pb-4 border-b border-slate-200">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-1.5">
                        <span className="font-semibold text-slate-700">
                          {kitchen.styleGroup}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{kitchen.cuisine}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">
                          {kitchen.distanceKm}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">
                          {kitchen.etaRange}
                        </span>
                        {prepOffset > 0 && (
                          <span className="px-2 py-0.5 text-[11px] font-semibold rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                            {busyLevel === 'rush' ? 'Heavy Rush' : 'Break Rush'} (+
                            {prepOffset}m)
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <h3 className="font-display text-xl font-bold text-slate-900">
                          {kitchen.name}
                        </h3>
                        <span className="text-xs font-mono text-blue-700 font-medium tabular-nums">
                          Batch {kitchen.batchCode} · {kitchen.batchOrdersCount}{' '}
                          orders · Leaves in {kitchen.batchLeavesInMin}m
                        </span>
                      </div>
                    </div>

                    <ul className="divide-y divide-slate-100 mt-2 flex-1">
                      {kitchen.dishes.map((dish) => {
                        const isJustAdded = recentlyAddedId === dish.id;
                        const savings = Math.max(
                          0,
                          dish.regularPrice - dish.price
                        );
                        const isSoldOut = soldOutIds.includes(dish.id);
                        const adjustedPrep = dish.prepMinutes + prepOffset;

                        return (
                          <li
                            key={dish.id}
                            className={`py-4 first:pt-3 last:pb-0 flex items-start justify-between gap-4 ${
                              isSoldOut ? 'opacity-60' : ''
                            }`}
                          >
                            <button
                              type="button"
                              disabled={isSoldOut}
                              onClick={() => onSelectDishForModal(dish)}
                              aria-label={`Customize ${dish.name}`}
                              className="w-24 sm:w-28 aspect-4/3 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0 cursor-pointer group disabled:cursor-not-allowed"
                            >
                              <ResilientImage
                                src={dish.imagePath}
                                alt={dish.imageAlt}
                                fallbackLabel={dish.name}
                                className="w-full h-full object-cover transition-transform duration-150 group-hover:scale-105"
                              />
                            </button>

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <button
                                  type="button"
                                  disabled={isSoldOut}
                                  onClick={() => onSelectDishForModal(dish)}
                                  className="text-left text-sm sm:text-base font-semibold text-slate-900 hover:text-blue-700 transition-colors cursor-pointer disabled:cursor-not-allowed"
                                >
                                  {dish.name}
                                </button>
                                {isSoldOut && (
                                  <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-red-50 text-red-700 border border-red-200">
                                    Sold Out
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                                {dish.description}
                              </p>
                              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-2 font-mono tabular-nums">
                                <span className="text-sm font-bold text-slate-900">
                                  {formatINR(dish.price)}
                                </span>
                                <span className="line-through text-slate-400">
                                  {formatINR(dish.regularPrice)}
                                </span>
                                {savings > 0 && (
                                  <span className="font-sans font-medium text-blue-700">
                                    Save {formatINR(savings)}
                                  </span>
                                )}
                                <span aria-hidden="true">·</span>
                                <span>{adjustedPrep}m</span>
                                {dish.vegetarian && (
                                  <>
                                    <span aria-hidden="true">·</span>
                                    <span className="font-sans text-emerald-700 font-medium">
                                      Veg
                                    </span>
                                  </>
                                )}
                                {dish.tiffinEligible && (
                                  <>
                                    <span aria-hidden="true">·</span>
                                    <span className="inline-flex items-center gap-0.5 font-sans text-emerald-700 font-medium">
                                      <Leaf className="w-3 h-3" aria-hidden="true" />
                                      Tiffin −₹10
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-2 shrink-0">
                              <button
                                type="button"
                                disabled={isSoldOut}
                                onClick={() => onQuickAddDish(dish)}
                                className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed ${
                                  isJustAdded
                                    ? 'bg-emerald-700 text-white'
                                    : 'bg-slate-900 text-white hover:bg-blue-700'
                                }`}
                              >
                                {isSoldOut ? (
                                  <span>Sold Out</span>
                                ) : isJustAdded ? (
                                  <>
                                    <Check className="w-3.5 h-3.5" aria-hidden="true" />
                                    <span>Added</span>
                                  </>
                                ) : (
                                  <>
                                    <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                                    <span>Add</span>
                                  </>
                                )}
                              </button>
                              {!isSoldOut && (
                                <button
                                  type="button"
                                  onClick={() => onSelectDishForModal(dish)}
                                  className="text-xs font-medium text-slate-500 hover:text-slate-900 underline underline-offset-2 cursor-pointer"
                                >
                                  Customize
                                </button>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
