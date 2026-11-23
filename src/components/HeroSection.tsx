import { ArrowRight, Clock, MapPin, ShieldCheck, Users } from 'lucide-react';
import {
  HERO_IMAGE_PATH,
  SCHEDULED_BREAK_SLOTS,
  getCampusBadgeInfo,
} from '../data/campusData';
import { CampusPin } from '../types/quadbite';
import { ResilientImage } from './ResilientImage';

interface HeroSectionProps {
  pins: CampusPin[];
  selectedPin: CampusPin;
  onSelectPin: (pin: CampusPin) => void;
  scheduledSlot: string;
  onChangeScheduledSlot: (slotLabel: string) => void;
  hasQuadPass: boolean;
  onToggleQuadPass: () => void;
  onOpenGroupBatch: () => void;
}

export function HeroSection({
  pins,
  selectedPin,
  onSelectPin,
  scheduledSlot,
  onChangeScheduledSlot,
  hasQuadPass,
  onToggleQuadPass,
  onOpenGroupBatch,
}: HeroSectionProps) {
  const campusBadge = getCampusBadgeInfo(selectedPin.campusGroup);

  return (
    <section id="top" className="border-b border-slate-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-12 lg:pt-14 lg:pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-between gap-7">
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
                <span>
                  Saintgits 40-Acre Estate · Kottukulam Hills, Pathamuttom, Kottayam
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">
                  {hasQuadPass ? '₹0 QuadPass Delivery' : '₹19 Flat Fee'}
                </span>
              </div>

              <h1
                className="font-display text-slate-900 font-bold tracking-tight leading-[1.06]"
                style={{
                  fontSize: 'clamp(2.2rem, 3.6vw, 3.35rem)',
                  textWrap: 'balance',
                }}
              >
                Kerala, Indian &amp; Western food at student prices.
              </h1>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
                Serving the separate <strong>Saintgits College of Engineering</strong> and{' '}
                <strong>Saintgits College of Applied Sciences</strong> campuses across the ~40-acre estate. Pre-schedule class-break drops, split hostel group carts, or track student runners on live Google Maps.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <a
                  href="#menu"
                  className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
                >
                  <span>Browse Student Menu</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </a>
                <a
                  href="#drop-pin"
                  className="inline-flex items-center gap-2 px-4 py-3 text-sm font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
                >
                  <MapPin className="w-4 h-4 text-blue-700" aria-hidden="true" />
                  <span>Live Campus Map</span>
                </a>
                <button
                  type="button"
                  onClick={onOpenGroupBatch}
                  className="inline-flex items-center gap-2 px-4 py-3 text-sm font-semibold text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Users className="w-4 h-4" aria-hidden="true" />
                  <span>Group / Hostel Batch</span>
                </button>
              </div>
            </div>

            <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium text-slate-500">
                      Active Drop-Off Spot
                    </span>
                    <span
                      className={`px-2 py-0.5 text-[11px] font-semibold rounded-md ${campusBadge.className}`}
                    >
                      {campusBadge.label}
                    </span>
                  </div>
                  <span className="block text-sm font-semibold text-slate-900">
                    {selectedPin.name} — {selectedPin.defaultDetail}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onToggleQuadPass}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-lg border transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                    hasQuadPass
                      ? 'bg-blue-700 text-white border-blue-700 hover:bg-blue-800'
                      : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                  }`}
                >
                  {hasQuadPass ? 'QuadPass Active (₹0 Fee)' : 'Try QuadPass (₹0 Fee)'}
                </button>
              </div>

              <div
                className="flex flex-wrap gap-2"
                role="group"
                aria-label="Quick campus drop-off spots"
              >
                {pins.slice(0, 4).map((pin) => {
                  const isActive = pin.id === selectedPin.id;
                  return (
                    <button
                      key={pin.id}
                      type="button"
                      onClick={() => onSelectPin(pin)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                        isActive
                          ? 'bg-slate-900 text-white'
                          : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300 hover:text-slate-900'
                      }`}
                    >
                      {pin.name}
                    </button>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-slate-200 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <Clock className="w-3.5 h-3.5 text-blue-700" aria-hidden="true" />
                  <span>Class-Break Pre-Order Window</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {SCHEDULED_BREAK_SLOTS.map((slot) => {
                    const active = scheduledSlot === slot.label;
                    return (
                      <button
                        key={slot.id}
                        type="button"
                        title={slot.windowLabel}
                        onClick={() => onChangeScheduledSlot(slot.label)}
                        className={`px-2.5 py-1.5 text-[11px] font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          active
                            ? 'bg-blue-700 text-white border-blue-700'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {slot.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1 border-t border-slate-200">
                <span className="inline-flex items-center gap-1.5 text-slate-700 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-700" aria-hidden="true" />
                  {selectedPin.keycardRequired
                    ? 'ID-verified Saintgits student runner access'
                    : 'Open courtyard & sports plaza drop-off'}
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">
                  {selectedPin.etaMinutes} min avg ETA
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">
                  {selectedPin.activeBatchCount} orders batched nearby
                </span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 flex">
            <div className="relative w-full min-h-[300px] lg:min-h-full rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
              <ResilientImage
                src={HERO_IMAGE_PATH}
                alt="Fresh smashburger, crispy waffle fries, and iced matcha latte on a sunlit Saintgits College campus quad table"
                fallbackLabel="Saintgits Campus Delivery"
                className="w-full h-full object-cover"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/25 to-transparent"
              />
              <div className="absolute bottom-0 inset-x-0 p-6 text-white">
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium text-slate-200">
                      {scheduledSlot} · Kottukulam Hills
                    </p>
                    <p className="font-display text-xl sm:text-2xl font-bold tracking-tight">
                      {selectedPin.name}
                    </p>
                    <p className="text-sm text-slate-200 mt-0.5">
                      Hand-delivered inside campus gates—no Pathamuttom road walks.
                    </p>
                  </div>
                  <div className="text-right font-mono tabular-nums">
                    <span className="block text-xs text-slate-300">Estimated Arrival</span>
                    <span className="text-2xl font-semibold text-white">
                      {selectedPin.etaMinutes} min
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-slate-200 grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <p className="font-mono text-2xl font-semibold text-slate-900 tabular-nums">
              ₹45–₹249
            </p>
            <p className="text-sm text-slate-600 mt-1">
              Exclusive student-offered menu prices (20–25% off)
            </p>
          </div>
          <div>
            <p className="font-mono text-2xl font-semibold text-slate-900 tabular-nums">
              ₹19
            </p>
            <p className="text-sm text-slate-600 mt-1">
              Flat delivery fee (₹0 with ₹49/mo QuadPass)
            </p>
          </div>
          <div>
            <p className="font-mono text-2xl font-semibold text-slate-900 tabular-nums">
              ~40 Acres
            </p>
            <p className="text-sm text-slate-600 mt-1">
              2 separate campuses &amp; 6 hostel blocks across Pathamuttom
            </p>
          </div>
          <div>
            <p className="font-mono text-2xl font-semibold text-slate-900 tabular-nums">
              100%
            </p>
            <p className="text-sm text-slate-600 mt-1">
              ID-verified Saintgits student couriers on campus
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
