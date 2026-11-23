import { useState } from 'react';
import {
  Check,
  Clock,
  Copy,
  Leaf,
  LogIn,
  MapPin,
  Minus,
  Plus,
  Share2,
  Ticket,
  Trash2,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import {
  DELIVERY_FEE_INR,
  QUADPASS_PRICE_INR,
  SCHEDULED_BREAK_SLOTS,
  TIFFIN_DISCOUNT_INR,
  formatINR,
  getCampusBadgeInfo,
} from '../data/campusData';
import {
  CampusPin,
  CartItem,
  GroupBatchCart,
  GroupBatchItem,
  UserProfile,
} from '../types/quadbite';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (cartItemId: string, delta: number) => void;
  onRemoveItem: (cartItemId: string) => void;
  selectedPin: CampusPin;
  pinDetail: string;
  onChangePinDetail: (detail: string) => void;
  scheduledSlot: string;
  onChangeScheduledSlot: (slot: string) => void;
  reusableTiffin: boolean;
  onToggleReusableTiffin: () => void;
  useLunchCredit: boolean;
  onToggleUseLunchCredit: () => void;
  hasQuadPass: boolean;
  onToggleQuadPass: () => void;
  paymentMethod: string;
  onChangePaymentMethod: (method: string) => void;
  profile: UserProfile | null;
  onSignIn: () => Promise<void>;
  onTopUpWallet: (amount: number) => Promise<void>;
  onPlaceOrder: () => Promise<void>;
  onOpenHistory: () => void;
  activeGroupBatch: GroupBatchCart | null;
  groupBatchItems: GroupBatchItem[];
  onCreateGroupBatch: () => Promise<void>;
  onSyncCartToGroupBatch: () => Promise<void>;
  onRemoveGroupItem: (itemId: string) => Promise<void>;
  onLeaveGroupBatch: () => void;
  onPlaceGroupBatchOrder: () => Promise<void>;
}

const PAYMENT_METHODS = [
  'Campus Meal Wallet',
  'UPI (GPay / PhonePe / Paytm)',
  'Debit / RuPay / Card',
];

export function CartDrawer({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  selectedPin,
  pinDetail,
  onChangePinDetail,
  scheduledSlot,
  onChangeScheduledSlot,
  reusableTiffin,
  onToggleReusableTiffin,
  useLunchCredit,
  onToggleUseLunchCredit,
  hasQuadPass,
  onToggleQuadPass,
  paymentMethod,
  onChangePaymentMethod,
  profile,
  onSignIn,
  onTopUpWallet,
  onPlaceOrder,
  onOpenHistory,
  activeGroupBatch,
  groupBatchItems,
  onCreateGroupBatch,
  onSyncCartToGroupBatch,
  onRemoveGroupItem,
  onLeaveGroupBatch,
  onPlaceGroupBatchOrder,
}: CartDrawerProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedSplit, setCopiedSplit] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) {
    return null;
  }

  const subtotal = items.reduce(
    (sum, item) =>
      sum + (item.dish.price + item.selectedOption.priceDelta) * item.quantity,
    0
  );
  const regularSubtotal = items.reduce(
    (sum, item) =>
      sum +
      (item.dish.regularPrice + item.selectedOption.priceDelta) * item.quantity,
    0
  );
  const studentSavings = Math.max(0, regularSubtotal - subtotal);
  const tiffinDiscount =
    items.length > 0 && reusableTiffin ? TIFFIN_DISCOUNT_INR : 0;
  const deliveryFee =
    items.length === 0
      ? 0
      : hasQuadPass || useLunchCredit
      ? 0
      : DELIVERY_FEE_INR;
  const creditAppliedAmount =
    items.length > 0 && useLunchCredit ? Math.min(subtotal, 150) : 0;
  const total = Math.max(
    0,
    subtotal - tiffinDiscount - creditAppliedAmount + deliveryFee
  );

  const isWalletPayment = paymentMethod === 'Campus Meal Wallet';
  const walletBalance = profile?.walletBalance ?? 0;
  const walletShortfall = isWalletPayment && total > walletBalance;

  // Group Batch Split Calculation
  const groupSubtotal = groupBatchItems.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );
  const groupDelivery =
    groupBatchItems.length > 0 ? (hasQuadPass ? 0 : DELIVERY_FEE_INR) : 0;
  const groupTiffinDiscount =
    groupBatchItems.length > 0 && activeGroupBatch?.reusableTiffin
      ? TIFFIN_DISCOUNT_INR
      : 0;
  const groupTotal = Math.max(
    0,
    groupSubtotal - groupTiffinDiscount + groupDelivery
  );

  const participantTotals: Record<
    string,
    { name: string; campus: string; itemsTotal: number }
  > = {};
  for (const item of groupBatchItems) {
    const existing = participantTotals[item.participantUid];
    if (existing) {
      existing.itemsTotal += item.unitPrice * item.quantity;
    } else {
      participantTotals[item.participantUid] = {
        name: item.participantName,
        campus: item.participantCampus,
        itemsTotal: item.unitPrice * item.quantity,
      };
    }
  }
  const participantList = Object.entries(participantTotals);
  const perPersonFeeDelta =
    participantList.length > 0
      ? Math.round((groupDelivery - groupTiffinDiscount) / participantList.length)
      : 0;

  const shareUrl = activeGroupBatch
    ? `${window.location.origin}${window.location.pathname}?batch=${activeGroupBatch.batchId}`
    : '';

  const handleCopyBatchLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      window.setTimeout(() => setCopiedLink(false), 1800);
    } catch {
      // Clipboard fallback ignored
    }
  };

  const handleCopyUpiSplit = async () => {
    if (participantList.length === 0) return;
    const lines = participantList.map(([, p]) => {
      const share = Math.max(0, p.itemsTotal + perPersonFeeDelta);
      return `${p.name} (${p.campus}): ${formatINR(share)}`;
    });
    const summary = `QuadBite Group Batch (${activeGroupBatch?.pin.name || selectedPin.name}) · Total ${formatINR(groupTotal)}\n${lines.join('\n')}`;
    try {
      await navigator.clipboard.writeText(summary);
      setCopiedSplit(true);
      window.setTimeout(() => setCopiedSplit(false), 1800);
    } catch {
      // Clipboard fallback ignored
    }
  };

  const campusBadge = getCampusBadgeInfo(selectedPin.campusGroup);

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/45 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cart-drawer-title"
    >
      <div className="w-full max-w-md bg-white h-full flex flex-col border-l border-slate-200">
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2
              id="cart-drawer-title"
              className="font-display text-xl font-bold text-slate-900"
            >
              Your Campus Bag
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 font-mono tabular-nums">
              {selectedPin.name} · {scheduledSlot}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close bag drawer"
            className="p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-900">
                  <MapPin className="w-3.5 h-3.5 text-blue-700" aria-hidden="true" />
                  {selectedPin.name}
                </span>
                <span
                  className={`px-2 py-0.5 text-[11px] font-semibold rounded-md whitespace-nowrap shrink-0 ${campusBadge.className}`}
                >
                  {campusBadge.label}
                </span>
              </div>
              <a
                href="#drop-pin"
                onClick={onClose}
                className="text-xs font-medium text-blue-700 hover:underline shrink-0"
              >
                Change Pin
              </a>
            </div>

            <input
              type="text"
              maxLength={140}
              value={pinDetail}
              onChange={(e) => onChangePinDetail(e.target.value)}
              placeholder={selectedPin.detailPlaceholder}
              aria-label="Exact hostel room or study spot details"
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-700"
            />

            <div>
              <label
                htmlFor="cart-break-slot"
                className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 mb-1"
              >
                <Clock className="w-3 h-3 text-blue-700" aria-hidden="true" />
                <span>Break-Slot Schedule</span>
              </label>
              <select
                id="cart-break-slot"
                value={scheduledSlot}
                onChange={(e) => onChangeScheduledSlot(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-700"
              >
                {SCHEDULED_BREAK_SLOTS.map((slot) => (
                  <option key={slot.id} value={slot.label}>
                    {slot.label} — {slot.windowLabel}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Group / Hostel Batch Room */}
          <div className="p-4 bg-blue-50/40 border border-blue-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-700" aria-hidden="true" />
                <h3 className="text-xs font-bold text-slate-900">
                  Group / Hostel Batch Link
                </h3>
              </div>
              {activeGroupBatch && (
                <button
                  type="button"
                  onClick={onLeaveGroupBatch}
                  className="text-[11px] font-medium text-slate-500 hover:text-slate-900 cursor-pointer"
                >
                  Leave Batch
                </button>
              )}
            </div>

            {!activeGroupBatch ? (
              <div className="space-y-2.5">
                <p className="text-xs text-slate-600">
                  Share one live cart link with lab classmates or hostel roommates and split the UPI bill automatically.
                </p>
                {profile ? (
                  <button
                    type="button"
                    onClick={() => void onCreateGroupBatch()}
                    className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold text-blue-800 bg-white hover:bg-blue-50 border border-blue-300 rounded-lg transition-colors cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Create Shareable Group Batch</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => void onSignIn()}
                    className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors cursor-pointer"
                  >
                    <LogIn className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Sign In to Start Group Batch</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2 bg-white border border-blue-200 rounded-lg px-3 py-2">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900 truncate">
                      {activeGroupBatch.title}
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono">
                      Host: {activeGroupBatch.hostName} · {activeGroupBatch.status}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleCopyBatchLink()}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md shrink-0 cursor-pointer"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-3 h-3" aria-hidden="true" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" aria-hidden="true" />
                        <span>Invite Link</span>
                      </>
                    )}
                  </button>
                </div>

                {items.length > 0 && (
                  <button
                    type="button"
                    onClick={() => void onSyncCartToGroupBatch()}
                    className="w-full py-2 px-3 text-xs font-semibold text-white bg-slate-900 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
                  >
                    Add My Bag Items ({items.reduce((s, i) => s + i.quantity, 0)}) to Group Batch
                  </button>
                )}

                {groupBatchItems.length > 0 && (
                  <div className="space-y-2">
                    <ul className="space-y-1.5 max-h-40 overflow-y-auto">
                      {groupBatchItems.map((gItem) => (
                        <li
                          key={gItem.itemId}
                          className="flex items-center justify-between gap-2 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs"
                        >
                          <div className="min-w-0">
                            <p className="font-medium text-slate-900 truncate">
                              {gItem.quantity}× {gItem.dishName}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              {gItem.participantName} ·{' '}
                              <span className="font-mono">
                                {formatINR(gItem.unitPrice * gItem.quantity)}
                              </span>
                            </p>
                          </div>
                          {profile &&
                            (gItem.participantUid === profile.uid ||
                              activeGroupBatch.hostUid === profile.uid) && (
                              <button
                                type="button"
                                onClick={() => void onRemoveGroupItem(gItem.itemId)}
                                aria-label="Remove group item"
                                className="p-1 text-slate-400 hover:text-red-700 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                              </button>
                            )}
                        </li>
                      ))}
                    </ul>

                    <div className="p-2.5 bg-white border border-slate-200 rounded-lg space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-800">
                        <span>Per-Person UPI Split ({formatINR(groupTotal)})</span>
                        <button
                          type="button"
                          onClick={() => void handleCopyUpiSplit()}
                          className="text-blue-700 hover:underline cursor-pointer"
                        >
                          {copiedSplit ? 'Copied Split!' : 'Copy Split'}
                        </button>
                      </div>
                      {participantList.map(([uid, info]) => {
                        const share = Math.max(0, info.itemsTotal + perPersonFeeDelta);
                        return (
                          <div
                            key={uid}
                            className="flex items-center justify-between text-[11px] text-slate-600"
                          >
                            <span>
                              {info.name} ({info.campus === 'Engineering Campus' ? 'SCE' : 'SCAS'})
                            </span>
                            <span className="font-mono font-semibold text-slate-900 tabular-nums">
                              {formatINR(share)}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {profile &&
                      activeGroupBatch.hostUid === profile.uid &&
                      activeGroupBatch.status === 'open' && (
                        <button
                          type="button"
                          onClick={() => void onPlaceGroupBatchOrder()}
                          className="w-full py-2.5 px-3 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors cursor-pointer"
                        >
                          Place Combined Group Order · {formatINR(groupTotal)}
                        </button>
                      )}
                  </div>
                )}
              </div>
            )}
          </div>

          {items.length === 0 ? (
            <div className="py-8 text-center space-y-3">
              <p className="font-display text-lg font-semibold text-slate-900">
                Your personal bag is empty
              </p>
              <p className="text-sm text-slate-600">
                Add Kerala biriyani, pazham pori, smashburgers, or iced matcha from the menu.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <a
                  href="#menu"
                  onClick={onClose}
                  className="inline-block px-4 py-2.5 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors"
                >
                  Explore Campus Menu
                </a>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenHistory();
                  }}
                  className="inline-block px-4 py-2.5 text-sm font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  View Order History
                </button>
              </div>
            </div>
          ) : (
            <>
              <ul className="divide-y divide-slate-200">
                {items.map((item) => {
                  const unitPrice =
                    item.dish.price + item.selectedOption.priceDelta;
                  return (
                    <li key={item.cartItemId} className="py-4 first:pt-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900">
                            {item.dish.name}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {item.dish.kitchenName} · {item.selectedOption.label}
                          </p>
                          {item.note && (
                            <p className="text-xs text-slate-600 mt-1 italic">
                              Note: {item.note}
                            </p>
                          )}
                        </div>
                        <span className="text-sm font-mono font-semibold text-slate-900 tabular-nums shrink-0">
                          {formatINR(unitPrice * item.quantity)}
                        </span>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <div className="inline-flex items-center border border-slate-200 rounded-lg bg-slate-50">
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.cartItemId, -1)}
                            aria-label={`Decrease ${item.dish.name} quantity`}
                            className="p-1.5 text-slate-600 hover:text-slate-900 cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                          <span className="px-2.5 text-xs font-mono font-semibold text-slate-900 tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.cartItemId, 1)}
                            aria-label={`Increase ${item.dish.name} quantity`}
                            className="p-1.5 text-slate-600 hover:text-slate-900 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => onRemoveItem(item.cartItemId)}
                          className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-red-700 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Remove</span>
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>

              {/* Reusable Steel Tiffin Toggle */}
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <Leaf
                    className="w-4 h-4 text-emerald-700 mt-0.5 shrink-0"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="text-xs font-semibold text-slate-900">
                      Returnable Steel Tiffin / BYO Box
                    </p>
                    <p className="text-[11px] text-slate-600">
                      Automatic ₹10 zero-waste discount · drop box at hostel/canteen
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onToggleReusableTiffin}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    reusableTiffin
                      ? 'bg-emerald-700 text-white border-emerald-700'
                      : 'bg-white text-slate-800 border-slate-300 hover:border-slate-400'
                  }`}
                >
                  {reusableTiffin ? '−₹10 Applied' : 'Apply −₹10'}
                </button>
              </div>

              {/* Weekly Lunch Bundle Credit Toggle */}
              {profile && profile.lunchBundleCredits > 0 && (
                <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <Ticket
                      className="w-4 h-4 text-blue-700 mt-0.5 shrink-0"
                      aria-hidden="true"
                    />
                    <div>
                      <p className="text-xs font-semibold text-slate-900">
                        Lunch Bundle Pass ({profile.lunchBundleCredits} drops left)
                      </p>
                      <p className="text-[11px] text-slate-600">
                        Redeem 1 credit for up to ₹150 off + ₹0 delivery
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onToggleUseLunchCredit}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      useLunchCredit
                        ? 'bg-blue-700 text-white border-blue-700'
                        : 'bg-white text-slate-800 border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    {useLunchCredit ? 'Credit Active' : 'Use 1 Credit'}
                  </button>
                </div>
              )}

              {/* QuadPass Membership */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-slate-900">
                    QuadPass Student Membership
                  </p>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {hasQuadPass
                      ? `₹0 delivery applied (${formatINR(QUADPASS_PRICE_INR)}/mo)`
                      : `Switch to ₹0 delivery for ${formatINR(QUADPASS_PRICE_INR)}/mo`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onToggleQuadPass}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    hasQuadPass
                      ? 'bg-blue-700 text-white border-blue-700'
                      : 'bg-white text-slate-800 border-slate-300 hover:border-slate-400'
                  }`}
                >
                  {hasQuadPass ? 'Active' : 'Apply ₹0 Fee'}
                </button>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-900">
                    Payment Method
                  </label>
                  {profile && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-600 tabular-nums">
                      <Wallet className="w-3 h-3 text-blue-700" aria-hidden="true" />
                      Wallet: {formatINR(profile.walletBalance)}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {PAYMENT_METHODS.map((method) => {
                    const isSelected = paymentMethod === method;
                    return (
                      <button
                        key={method}
                        type="button"
                        onClick={() => onChangePaymentMethod(method)}
                        className={`px-3.5 py-2.5 text-xs text-left rounded-lg border transition-colors cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'border-blue-700 bg-blue-50/50 text-slate-900 font-semibold'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <span>{method}</span>
                        {method === 'Campus Meal Wallet' && profile && (
                          <span className="font-mono text-blue-700 tabular-nums">
                            {formatINR(profile.walletBalance)}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {walletShortfall && profile && (
                  <div className="mt-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between gap-2 text-xs">
                    <span className="text-amber-900">
                      Wallet needs {formatINR(total - walletBalance)} more
                    </span>
                    <button
                      type="button"
                      onClick={() => void onTopUpWallet(250)}
                      className="px-2.5 py-1 font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-md cursor-pointer shrink-0"
                    >
                      Top Up +₹250
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {items.length > 0 && (
          <div className="p-6 border-t border-slate-200 bg-slate-50 space-y-4">
            <div className="space-y-1.5 text-sm">
              <div className="flex items-center justify-between text-slate-600">
                <span>Menu Subtotal (Student Prices)</span>
                <span className="font-mono tabular-nums">{formatINR(subtotal)}</span>
              </div>
              {studentSavings > 0 && (
                <div className="flex items-center justify-between text-xs text-blue-700 font-medium">
                  <span>Saintgits Student Offer Savings</span>
                  <span className="font-mono tabular-nums">
                    −{formatINR(studentSavings)}
                  </span>
                </div>
              )}
              {tiffinDiscount > 0 && (
                <div className="flex items-center justify-between text-xs text-emerald-700 font-medium">
                  <span>Reusable Steel Tiffin Discount</span>
                  <span className="font-mono tabular-nums">
                    −{formatINR(tiffinDiscount)}
                  </span>
                </div>
              )}
              {creditAppliedAmount > 0 && (
                <div className="flex items-center justify-between text-xs text-blue-700 font-medium">
                  <span>Lunch Bundle Credit Redeemed</span>
                  <span className="font-mono tabular-nums">
                    −{formatINR(creditAppliedAmount)}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between text-slate-600">
                <span>Batched Campus Delivery</span>
                <span className="font-mono tabular-nums">
                  {deliveryFee === 0 ? '₹0' : formatINR(deliveryFee)}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between font-semibold text-slate-900">
                <span>Total</span>
                <span className="font-mono text-base tabular-nums">
                  {formatINR(total)}
                </span>
              </div>
            </div>

            {profile ? (
              <button
                type="button"
                disabled={submitting || walletShortfall}
                onClick={async () => {
                  setSubmitting(true);
                  try {
                    await onPlaceOrder();
                  } finally {
                    setSubmitting(false);
                  }
                }}
                className="w-full py-3.5 px-5 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-50 rounded-lg transition-colors cursor-pointer"
              >
                {submitting
                  ? 'Dispatching Order...'
                  : `Place Campus Order · ${formatINR(total)}`}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void onSignIn()}
                className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-5 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors cursor-pointer"
              >
                <LogIn className="w-4 h-4" aria-hidden="true" />
                <span>Sign In to Place Order · {formatINR(total)}</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
