import { MapPin, RotateCcw, ShoppingBag, X } from 'lucide-react';
import { formatINR, getCampusBadgeInfo } from '../data/campusData';
import { ActiveOrder } from '../types/quadbite';

interface OrderHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  orders: ActiveOrder[];
  onReorder: (order: ActiveOrder) => void;
}

function formatOrderDate(isoDate: string): string {
  try {
    return new Intl.DateTimeFormat('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(isoDate));
  } catch {
    return isoDate;
  }
}

export function OrderHistoryDrawer({
  isOpen,
  onClose,
  orders,
  onReorder,
}: OrderHistoryDrawerProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/45 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-history-title"
    >
      <div className="w-full max-w-lg bg-white h-full flex flex-col border-l border-slate-200">
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between gap-4">
          <div>
            <h2
              id="order-history-title"
              className="font-display text-xl font-bold text-slate-900"
            >
              Order History
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 font-mono tabular-nums">
              {orders.length} {orders.length === 1 ? 'previous order' : 'previous orders'} · Saintgits Engineering &amp; Applied Sciences
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close order history"
            className="p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {orders.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto" aria-hidden="true" />
              <p className="font-display text-lg font-semibold text-slate-900">
                No past orders yet
              </p>
              <p className="text-sm text-slate-600 max-w-xs mx-auto">
                Your delivered campus meals and study-spot drops will appear here for one-click reordering.
              </p>
              <a
                href="#menu"
                onClick={onClose}
                className="inline-block px-4 py-2.5 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors"
              >
                Browse Campus Menu
              </a>
            </div>
          ) : (
            <ul className="divide-y divide-slate-200">
              {orders.map((order) => {
                const isDelivered = order.stage === 3;
                const itemCount = order.items.reduce(
                  (sum, item) => sum + item.quantity,
                  0
                );
                const campusBadge = getCampusBadgeInfo(order.pin.campusGroup);

                return (
                  <li key={order.orderId} className="py-5 first:pt-0 last:pb-0 space-y-3.5">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-mono tabular-nums">
                          <span className="font-semibold text-slate-900">
                            #{order.orderId}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{formatOrderDate(order.createdAt)}</span>
                          <span aria-hidden="true">·</span>
                          <span
                            className={`font-sans font-semibold ${
                              isDelivered ? 'text-emerald-700' : 'text-blue-700'
                            }`}
                          >
                            {isDelivered ? 'Delivered' : 'In Progress'}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1 text-sm font-semibold text-slate-900">
                            <MapPin className="w-3.5 h-3.5 text-blue-700 shrink-0" aria-hidden="true" />
                            <span>{order.pin.name}</span>
                          </span>
                          <span
                            className={`px-2 py-0.5 text-[11px] font-semibold rounded-md whitespace-nowrap shrink-0 ${campusBadge.className}`}
                          >
                            {campusBadge.label}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600">{order.pinDetail}</p>
                        {(order.scheduledSlot || order.reusableTiffin) && (
                          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                            {order.scheduledSlot && (
                              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                                {order.scheduledSlot}
                              </span>
                            )}
                            {order.reusableTiffin && (
                              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                                Steel Tiffin (−₹10)
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <span className="font-mono text-sm font-bold text-slate-900 tabular-nums">
                        {formatINR(order.total)}
                      </span>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 space-y-1.5">
                      {order.items.map((item) => {
                        const unitPrice =
                          item.dish.price + item.selectedOption.priceDelta;
                        return (
                          <div
                            key={item.cartItemId}
                            className="flex items-start justify-between gap-3 text-xs"
                          >
                            <div className="text-slate-700">
                              <span className="font-mono font-semibold text-slate-900 tabular-nums">
                                {item.quantity}×
                              </span>{' '}
                              <span className="font-medium text-slate-900">
                                {item.dish.name}
                              </span>
                              <span className="text-slate-500">
                                {' '}
                                ({item.selectedOption.label})
                              </span>
                            </div>
                            <span className="font-mono text-slate-600 tabular-nums shrink-0">
                              {formatINR(unitPrice * item.quantity)}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-0.5">
                      <div className="text-xs text-slate-500">
                        <span>
                          Runner: {order.courierName} ({order.courierYear})
                        </span>
                        <span aria-hidden="true"> · </span>
                        <span className="font-mono tabular-nums">
                          {itemCount} {itemCount === 1 ? 'item' : 'items'}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => onReorder(order)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Reorder</span>
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
