import { ArrowRight, Check, Ticket } from 'lucide-react';
import {
  MEAL_BUNDLES,
  QUADPASS_PRICE_INR,
  formatINR,
} from '../data/campusData';
import { MealBundlePlan, UserProfile } from '../types/quadbite';

interface CourierAndPassSectionProps {
  hasQuadPass: boolean;
  onToggleQuadPass: () => void;
  profile: UserProfile | null;
  onPurchaseBundle: (bundle: MealBundlePlan) => Promise<void>;
  onOpenRunnerMode: () => void;
  onOpenSignIn: () => Promise<void>;
}

export function CourierAndPassSection({
  hasQuadPass,
  onToggleQuadPass,
  profile,
  onPurchaseBundle,
  onOpenRunnerMode,
  onOpenSignIn,
}: CourierAndPassSectionProps) {
  return (
    <section
      id="student-courier"
      className="py-14 lg:py-16 bg-slate-50 border-b border-slate-200"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-slate-200">
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1.5">
                  Mess-Skip Weekly Bundles · Saintgits Commuters &amp; Hostellers
                </p>
                <h2
                  className="font-display text-2xl font-bold text-slate-900 tracking-tight"
                  style={{ textWrap: 'balance' }}
                >
                  Pre-pay weekly lunch &amp; tea drops at flat bundle rates
                </h2>
              </div>
              {profile && (
                <span className="px-3 py-1.5 text-xs font-mono font-semibold bg-blue-50 text-blue-800 border border-blue-200 rounded-lg tabular-nums">
                  {profile.lunchBundleCredits} lunch · {profile.snackBundleCredits}{' '}
                  snack credits
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {MEAL_BUNDLES.map((bundle) => {
                const currentCredits =
                  bundle.id === 'lunch-5'
                    ? profile?.lunchBundleCredits ?? 0
                    : profile?.snackBundleCredits ?? 0;

                return (
                  <div
                    key={bundle.id}
                    className="p-5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between gap-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700">
                          <Ticket className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>{bundle.credits} Campus Drops</span>
                        </span>
                        <span className="text-xs font-mono line-through text-slate-400 tabular-nums">
                          {formatINR(bundle.regularValue)}
                        </span>
                      </div>
                      <h3 className="font-display text-lg font-bold text-slate-900">
                        {bundle.title}
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {bundle.subtitle}
                      </p>
                    </div>

                    <div className="space-y-3 pt-2 border-t border-slate-200">
                      <div className="flex items-baseline justify-between">
                        <span className="font-mono text-xl font-bold text-slate-900 tabular-nums">
                          {formatINR(bundle.price)}
                        </span>
                        <span className="text-[11px] font-medium text-emerald-700">
                          {bundle.perDropSavings}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          profile
                            ? void onPurchaseBundle(bundle)
                            : void onOpenSignIn()
                        }
                        className="w-full py-2.5 px-3 text-xs font-semibold text-white bg-slate-900 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
                      >
                        {profile
                          ? currentCredits > 0
                            ? `Add +${bundle.credits} More Drops (${currentCredits} active)`
                            : `Get Bundle · ${formatINR(bundle.price)}`
                          : 'Sign In to Activate Bundle'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-slate-500">
                Verified Student Runner Network · Kottukulam Hills
              </p>
              <h3 className="font-display text-xl font-bold text-slate-900">
                Earn ₹220–₹280/hr walking or riding between classes
              </h3>
              <p className="text-sm text-slate-600">
                Switch to Student Runner Mode anytime to claim live batched orders across SCE, SCAS, and hostels.
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenRunnerMode}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>Open Runner Mode</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
          <div>
            <p className="text-xs font-medium text-slate-500 mb-1.5">
              Transparent Student Pricing · Why Batching Wins
            </p>
            <h3 className="font-display text-2xl font-bold text-slate-900 tracking-tight">
              Stop paying ₹245 for a ₹120 biriyani
            </h3>
            <p className="text-sm text-slate-600 mt-2">
              Exclusive Saintgits Engineering &amp; Applied Sciences student pricing, returnable steel tiffin discounts, and zero gate walks.
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-xs">
              <div className="flex items-center justify-between font-semibold text-slate-700 pb-1.5 border-b border-slate-200">
                <span>Mainstream Delivery App</span>
                <span className="font-mono tabular-nums text-slate-500">
                  45 min · Main Gate Pickup
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Thalassery Chicken Biriyani (Menu Price)</span>
                <span className="font-mono tabular-nums">₹155</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Delivery + Platform + Packaging Fees</span>
                <span className="font-mono tabular-nums">₹65</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Rain / Distance Surge</span>
                <span className="font-mono tabular-nums">₹25</span>
              </div>
              <div className="pt-1.5 border-t border-slate-200 flex justify-between font-semibold text-slate-900">
                <span>Total Paid</span>
                <span className="font-mono tabular-nums">₹245</span>
              </div>
            </div>

            <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-lg space-y-2 text-xs">
              <div className="flex items-center justify-between font-semibold text-blue-900 pb-1.5 border-b border-blue-200">
                <span>QuadBite Campus Batch + Steel Tiffin</span>
                <span className="font-mono tabular-nums text-blue-700">
                  14 min · Hostel / Library
                </span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>Thalassery Chicken Biriyani (Student Offer)</span>
                <span className="font-mono tabular-nums">₹120</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-medium">
                <span>Reusable Steel Tiffin Zero-Waste Discount</span>
                <span className="font-mono tabular-nums">−₹10</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>Batched Campus Delivery Fee</span>
                <span className="font-mono tabular-nums">
                  {hasQuadPass ? '₹0 (QuadPass)' : '₹19'}
                </span>
              </div>
              <div className="pt-1.5 border-t border-blue-200 flex justify-between font-bold text-slate-900 text-sm">
                <span>Total Paid</span>
                <span className="font-mono tabular-nums text-blue-700">
                  {hasQuadPass ? '₹110' : '₹129'}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onToggleQuadPass}
            className={`w-full inline-flex items-center justify-center gap-2 py-3 px-4 text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
              hasQuadPass
                ? 'bg-slate-900 text-white hover:bg-slate-800'
                : 'bg-blue-700 text-white hover:bg-blue-800'
            }`}
          >
            {hasQuadPass && <Check className="w-4 h-4" aria-hidden="true" />}
            <span>
              {hasQuadPass
                ? `QuadPass Active (${formatINR(QUADPASS_PRICE_INR)}/mo · ₹0 Delivery)`
                : `Activate QuadPass (${formatINR(QUADPASS_PRICE_INR)}/mo · ₹0 Delivery)`}
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}
