import { useState } from 'react';
import {
  ChefHat,
  Clock,
  LogIn,
  PackageCheck,
  UtensilsCrossed,
} from 'lucide-react';
import {
  CAMPUS_KITCHENS,
  formatINR,
  getCampusBadgeInfo,
} from '../data/campusData';
import {
  ActiveOrder,
  KitchenOperationalState,
  OrderStage,
  OrderStatus,
  UserProfile,
} from '../types/quadbite';

interface KitchenPortalViewProps {
  profile: UserProfile | null;
  onSignIn: () => Promise<void>;
  liveOrders: ActiveOrder[];
  kitchenStatuses: Record<string, KitchenOperationalState>;
  onUpdateKitchenStatus: (
    kitchenId: string,
    nextState: Omit<KitchenOperationalState, 'kitchenId' | 'updatedByUid'>
  ) => Promise<void>;
  onAdvanceOrderStatus: (
    orderId: string,
    nextStatus: OrderStatus,
    nextStage: OrderStage
  ) => Promise<void>;
  onBackToStudentMenu: () => void;
}

export function KitchenPortalView({
  profile,
  onSignIn,
  liveOrders,
  kitchenStatuses,
  onUpdateKitchenStatus,
  onAdvanceOrderStatus,
  onBackToStudentMenu,
}: KitchenPortalViewProps) {
  const [selectedKitchenId, setSelectedKitchenId] = useState(
    profile?.assignedKitchenId || CAMPUS_KITCHENS[0].id
  );

  const activeKitchen =
    CAMPUS_KITCHENS.find((k) => k.id === selectedKitchenId) ||
    CAMPUS_KITCHENS[0];

  const currentStatus: KitchenOperationalState = kitchenStatuses[
    activeKitchen.id
  ] || {
    kitchenId: activeKitchen.id,
    prepTimeOffsetMin: 0,
    busyLevel: 'normal',
    soldOutDishIds: [],
  };

  const kitchenOrders = liveOrders.filter(
    (order) =>
      order.status !== 'delivered' &&
      (order.kitchenId === activeKitchen.id ||
        order.items.some((item) => item.dish.kitchenId === activeKitchen.id))
  );

  const toggleDishSoldOut = async (dishId: string) => {
    const isSoldOut = currentStatus.soldOutDishIds.includes(dishId);
    const nextSoldOut = isSoldOut
      ? currentStatus.soldOutDishIds.filter((id) => id !== dishId)
      : [...currentStatus.soldOutDishIds, dishId].slice(0, 20);

    await onUpdateKitchenStatus(activeKitchen.id, {
      prepTimeOffsetMin: currentStatus.prepTimeOffsetMin,
      busyLevel: currentStatus.busyLevel,
      soldOutDishIds: nextSoldOut,
    });
  };

  const setPrepDelay = async (
    offset: number,
    busyLevel: 'normal' | 'busy' | 'rush'
  ) => {
    await onUpdateKitchenStatus(activeKitchen.id, {
      prepTimeOffsetMin: offset,
      busyLevel,
      soldOutDishIds: currentStatus.soldOutDishIds,
    });
  };

  return (
    <section className="py-10 lg:py-14 bg-slate-50 min-h-[75vh]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-md bg-blue-50 text-blue-800 border border-blue-300">
                Kitchen Partner Portal
              </span>
              <span className="text-xs font-mono text-slate-500">
                Pathamuttom &amp; Saintgits Canteen Operations
              </span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {activeKitchen.name}
            </h1>
            <p className="text-sm text-slate-600">
              Accept incoming campus batches, mark dishes sold out during class breaks, and push live prep-time updates to student menus.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <select
              aria-label="Select managed kitchen"
              value={activeKitchen.id}
              onChange={(e) => setSelectedKitchenId(e.target.value)}
              className="px-3.5 py-2.5 text-xs sm:text-sm font-semibold bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-700"
            >
              {CAMPUS_KITCHENS.map((kitchen) => (
                <option key={kitchen.id} value={kitchen.id}>
                  {kitchen.name}
                </option>
              ))}
            </select>

            {!profile && (
              <button
                type="button"
                onClick={() => void onSignIn()}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors cursor-pointer"
              >
                <LogIn className="w-4 h-4" aria-hidden="true" />
                <span>Sign In to Manage Queue</span>
              </button>
            )}

            <button
              type="button"
              onClick={onBackToStudentMenu}
              className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Back to Menu
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <ChefHat className="w-5 h-5 text-blue-700" aria-hidden="true" />
                <h2 className="font-display text-lg font-bold text-slate-900">
                  Incoming Order Queue ({kitchenOrders.length})
                </h2>
              </div>
              <span className="text-xs font-mono text-slate-500">
                Real-Time Sync
              </span>
            </div>

            {kitchenOrders.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <PackageCheck
                  className="w-8 h-8 text-slate-300 mx-auto"
                  aria-hidden="true"
                />
                <p className="text-sm font-semibold text-slate-800">
                  No active orders queued for {activeKitchen.name}
                </p>
                <p className="text-xs text-slate-500">
                  New orders placed for this kitchen will show up here for prep and runner handoff.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-200">
                {kitchenOrders.map((order) => {
                  const badge = getCampusBadgeInfo(order.pin.campusGroup);
                  return (
                    <li key={order.orderId} className="py-4 first:pt-0 last:pb-0 space-y-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="font-mono font-bold text-slate-900">
                              #{order.orderId}
                            </span>
                            <span
                              className={`px-2 py-0.5 text-[11px] font-semibold rounded-md ${badge.className}`}
                            >
                              {badge.label}
                            </span>
                            <span className="px-2 py-0.5 text-[11px] font-semibold rounded-md bg-slate-100 text-slate-700">
                              {order.scheduledSlot}
                            </span>
                            {order.reusableTiffin && (
                              <span className="px-2 py-0.5 text-[11px] font-semibold rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                                Pack in Returnable Steel Tiffin
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-semibold text-slate-900">
                            {order.customerName || 'Saintgits Student'} → {order.pin.name}
                          </p>
                          <p className="text-xs text-slate-600">{order.pinDetail}</p>
                        </div>

                        <span className="font-mono text-sm font-bold text-slate-900 tabular-nums">
                          {formatINR(order.total)}
                        </span>
                      </div>

                      <div className="bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-700 space-y-1">
                        {order.items.map((item) => (
                          <div
                            key={item.cartItemId}
                            className="flex items-center justify-between gap-2"
                          >
                            <span>
                              <strong className="font-mono">{item.quantity}×</strong>{' '}
                              {item.dish.name} ({item.selectedOption.label})
                            </span>
                            {item.note && (
                              <span className="italic text-slate-500">
                                “{item.note}”
                              </span>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <span className="text-xs font-mono text-slate-500">
                          Status: <strong className="text-slate-900">{order.status}</strong>
                        </span>
                        <div className="flex items-center gap-2">
                          {order.status === 'queued' && (
                            <button
                              type="button"
                              disabled={!profile}
                              onClick={() =>
                                void onAdvanceOrderStatus(
                                  order.orderId,
                                  'preparing',
                                  0
                                )
                              }
                              className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors cursor-pointer"
                            >
                              Accept &amp; Start Prep
                            </button>
                          )}
                          {(order.status === 'queued' ||
                            order.status === 'preparing') && (
                            <button
                              type="button"
                              disabled={!profile}
                              onClick={() =>
                                void onAdvanceOrderStatus(
                                  order.orderId,
                                  'ready',
                                  1
                                )
                              }
                              className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 rounded-lg transition-colors cursor-pointer"
                            >
                              Mark Ready for Runner
                            </button>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
                <Clock className="w-4 h-4 text-blue-700" aria-hidden="true" />
                <h2 className="font-display text-lg font-bold text-slate-900">
                  Live Prep Time &amp; Rush Load
                </h2>
              </div>
              <p className="text-xs text-slate-600">
                Adding a rush buffer updates the estimated prep time shown on every student’s menu card in real time.
              </p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { offset: 0, busy: 'normal' as const, label: '+0m Normal' },
                  { offset: 5, busy: 'busy' as const, label: '+5m Break Rush' },
                  { offset: 12, busy: 'rush' as const, label: '+12m Heavy Queue' },
                ].map((opt) => {
                  const active =
                    currentStatus.prepTimeOffsetMin === opt.offset &&
                    currentStatus.busyLevel === opt.busy;
                  return (
                    <button
                      key={opt.label}
                      type="button"
                      disabled={!profile}
                      onClick={() => void setPrepDelay(opt.offset, opt.busy)}
                      className={`py-2.5 px-2 text-xs font-semibold rounded-lg border transition-colors cursor-pointer disabled:opacity-50 ${
                        active
                          ? 'bg-blue-700 text-white border-blue-700'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
                <UtensilsCrossed
                  className="w-4 h-4 text-blue-700"
                  aria-hidden="true"
                />
                <h2 className="font-display text-lg font-bold text-slate-900">
                  Dish Stock Controls
                </h2>
              </div>

              <ul className="divide-y divide-slate-200">
                {activeKitchen.dishes.map((dish) => {
                  const soldOut = currentStatus.soldOutDishIds.includes(dish.id);
                  return (
                    <li
                      key={dish.id}
                      className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {dish.name}
                        </p>
                        <p className="text-xs font-mono text-slate-500 tabular-nums">
                          {formatINR(dish.price)} · {dish.prepMinutes + currentStatus.prepTimeOffsetMin} min prep
                        </p>
                      </div>

                      <button
                        type="button"
                        disabled={!profile}
                        onClick={() => void toggleDishSoldOut(dish.id)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50 ${
                          soldOut
                            ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                        }`}
                      >
                        {soldOut ? 'Sold Out (Tap to Restock)' : 'In Stock'}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
