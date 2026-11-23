import {
  Bike,
  CheckCircle2,
  Clock,
  Footprints,
  LogIn,
  MapPin,
  Navigation,
  Zap,
} from 'lucide-react';
import { formatINR, getCampusBadgeInfo } from '../data/campusData';
import {
  ActiveOrder,
  CourierTransportMode,
  OrderStage,
  OrderStatus,
  UserProfile,
} from '../types/quadbite';

interface RunnerPortalViewProps {
  profile: UserProfile | null;
  onSignIn: () => Promise<void>;
  onDuty: boolean;
  transportMode: CourierTransportMode;
  onToggleOnDuty: () => void;
  onChangeTransportMode: (mode: CourierTransportMode) => void;
  liveOrders: ActiveOrder[];
  onClaimOrder: (orderId: string) => Promise<void>;
  onAdvanceOrderStatus: (
    orderId: string,
    nextStatus: OrderStatus,
    nextStage: OrderStage,
    payout?: number
  ) => Promise<void>;
  onBackToStudentMenu: () => void;
}

export function RunnerPortalView({
  profile,
  onSignIn,
  onDuty,
  transportMode,
  onToggleOnDuty,
  onChangeTransportMode,
  liveOrders,
  onClaimOrder,
  onAdvanceOrderStatus,
  onBackToStudentMenu,
}: RunnerPortalViewProps) {
  const openOrders = liveOrders.filter(
    (order) =>
      (!order.runnerUid || order.runnerUid === '') &&
      order.status !== 'delivered'
  );
  const myActiveRuns = liveOrders.filter(
    (order) =>
      profile &&
      order.runnerUid === profile.uid &&
      order.status !== 'delivered'
  );

  const shiftEarnings = profile?.runnerShiftEarnings ?? 0;
  const completedCount = profile?.runnerCompletedCount ?? 0;
  const estimatedHourlyRate =
    completedCount > 0 ? Math.round((shiftEarnings / (completedCount * 14)) * 60) : 250;

  return (
    <section className="py-10 lg:py-14 bg-slate-50 min-h-[75vh]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-md bg-emerald-50 text-emerald-800 border border-emerald-300">
                Student Runner Mode
              </span>
              <span className="text-xs font-mono text-slate-500">
                Saintgits Engineering ↔ Applied Sciences ↔ Hostels
              </span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Between-Class Courier Dispatch
            </h1>
            <p className="text-sm text-slate-600 max-w-2xl">
              Claim live batched student orders across the 40-acre Kottukulam Hills estate, bypass main-gate checkpoints with your student ID, and earn instant payouts into your wallet.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {profile ? (
              <button
                type="button"
                onClick={onToggleOnDuty}
                className={`px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
                  onDuty
                    ? 'bg-emerald-700 text-white hover:bg-emerald-800'
                    : 'bg-slate-900 text-white hover:bg-blue-700'
                }`}
              >
                {onDuty ? 'On Duty · Accepting Batches' : 'Go On Duty'}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void onSignIn()}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors cursor-pointer"
              >
                <LogIn className="w-4 h-4" aria-hidden="true" />
                <span>Sign In to Go On Duty</span>
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

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <span className="text-xs text-slate-500 block">Shift Earnings</span>
            <span className="font-mono text-2xl font-bold text-slate-900 tabular-nums mt-1 block">
              {formatINR(shiftEarnings)}
            </span>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <span className="text-xs text-slate-500 block">Completed Drops</span>
            <span className="font-mono text-2xl font-bold text-slate-900 tabular-nums mt-1 block">
              {completedCount}
            </span>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <span className="text-xs text-slate-500 block">Est. Hourly Pace</span>
            <span className="font-mono text-2xl font-bold text-blue-700 tabular-nums mt-1 block">
              {formatINR(estimatedHourlyRate)}/hr
            </span>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2">
            <span className="text-xs text-slate-500 block">Transport Mode</span>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
              {(
                [
                  { id: 'foot', label: 'Foot', Icon: Footprints },
                  { id: 'bike', label: 'Bike', Icon: Bike },
                  { id: 'scooter', label: 'Scooter', Icon: Zap },
                ] as const
              ).map(({ id, label, Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => onChangeTransportMode(id)}
                  className={`flex-1 inline-flex items-center justify-center gap-1 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                    transportMode === id
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h2 className="font-display text-lg font-bold text-slate-900">
                Available Campus Batches ({openOrders.length})
              </h2>
              <span className="text-xs font-mono text-slate-500">
                Live Firestore Dispatch
              </span>
            </div>

            {openOrders.length === 0 ? (
              <div className="py-10 text-center space-y-2">
                <Clock className="w-7 h-7 text-slate-300 mx-auto" aria-hidden="true" />
                <p className="text-sm font-semibold text-slate-800">
                  No unclaimed orders in queue right now
                </p>
                <p className="text-xs text-slate-500">
                  Place a student order from the menu to see it appear immediately in real-time dispatch.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-200">
                {openOrders.map((order) => {
                  const badge = getCampusBadgeInfo(order.pin.campusGroup);
                  return (
                    <li key={order.orderId} className="py-4 first:pt-0 last:pb-0 space-y-3">
                      <div className="flex items-start justify-between gap-3">
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
                              {order.status.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-slate-900">
                            {order.kitchenName || 'Campus Kitchen'} → {order.pin.name}
                          </p>
                          <p className="text-xs text-slate-600">
                            {order.pinDetail} · {order.scheduledSlot}
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-mono text-base font-bold text-emerald-700 tabular-nums">
                            +{formatINR(order.runnerPayout || 45)}
                          </span>
                          <span className="block text-[11px] text-slate-500">
                            {order.items.reduce((s, i) => s + i.quantity, 0)} items
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="button"
                          disabled={!profile}
                          onClick={() => void onClaimOrder(order.orderId)}
                          className="px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-50 rounded-lg transition-colors cursor-pointer"
                        >
                          Claim &amp; Pick Up Batch
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h2 className="font-display text-lg font-bold text-slate-900">
                My Active Runs ({myActiveRuns.length})
              </h2>
              <Navigation className="w-4 h-4 text-blue-700" aria-hidden="true" />
            </div>

            {myActiveRuns.length === 0 ? (
              <div className="py-10 text-center space-y-2">
                <MapPin className="w-7 h-7 text-slate-300 mx-auto" aria-hidden="true" />
                <p className="text-sm font-semibold text-slate-800">
                  No claimed drop-offs in progress
                </p>
                <p className="text-xs text-slate-500">
                  Claim an available campus batch on the left to start your delivery run.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-200">
                {myActiveRuns.map((order) => {
                  const badge = getCampusBadgeInfo(order.pin.campusGroup);
                  const isPickedUp = order.stage <= 1;
                  return (
                    <li key={order.orderId} className="py-4 first:pt-0 last:pb-0 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="font-mono font-bold text-blue-700">
                              #{order.orderId}
                            </span>
                            <span
                              className={`px-2 py-0.5 text-[11px] font-semibold rounded-md ${badge.className}`}
                            >
                              {badge.label}
                            </span>
                            {order.reusableTiffin && (
                              <span className="px-2 py-0.5 text-[11px] font-semibold rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                                Steel Tiffin Returnable
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-semibold text-slate-900">
                            Drop at {order.pin.name} ({order.pinDetail})
                          </p>
                          <p className="text-xs text-slate-500">
                            Student: {order.customerName || 'Saintgits Student'} ·{' '}
                            {order.scheduledSlot}
                          </p>
                        </div>

                        <span className="font-mono text-sm font-bold text-emerald-700 tabular-nums shrink-0">
                          +{formatINR(order.runnerPayout || 45)}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center justify-end gap-2">
                        {isPickedUp ? (
                          <button
                            type="button"
                            onClick={() =>
                              void onAdvanceOrderStatus(
                                order.orderId,
                                'en_route',
                                2
                              )
                            }
                            className="px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors cursor-pointer"
                          >
                            Mark En Route Across Estate
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              void onAdvanceOrderStatus(
                                order.orderId,
                                'delivered',
                                3,
                                order.runnerPayout || 45
                              )
                            }
                            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Complete Drop-Off (+{formatINR(order.runnerPayout || 45)})</span>
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
