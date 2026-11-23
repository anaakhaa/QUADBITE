import { useCallback, useEffect, useRef, useState } from 'react';
import {
  APILoadingStatus,
  AdvancedMarker,
  InfoWindow,
  Map as GoogleMap,
  Pin,
  useAdvancedMarkerRef,
  useApiLoadingStatus,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import {
  Bike,
  CheckCircle2,
  Footprints,
  KeyRound,
  Layers,
  MapPin,
  Navigation,
  Receipt,
  Zap,
} from 'lucide-react';
import {
  KITCHEN_HUB_COORDS,
  SAINTGITS_MAP_CENTER,
  formatINR,
  getCampusBadgeInfo,
} from '../data/campusData';
import { ActiveOrder, CampusPin, OrderStage } from '../types/quadbite';

interface CampusMapTrackerProps {
  mapsApiKeyAvailable: boolean;
  pins: CampusPin[];
  selectedPin: CampusPin;
  pinDetail: string;
  onSelectPin: (pin: CampusPin) => void;
  onChangePinDetail: (detail: string) => void;
  onDropCustomPin: (lat: number, lng: number) => void;
  activeOrder: ActiveOrder | null;
  onAdvanceOrderStage: () => void;
  onClearOrder: () => void;
  onOpenHistory: () => void;
}

const CAMPUS_FILTERS = [
  'All 40 Acres',
  'Applied Sciences Campus',
  'Engineering Campus',
  'Shared Hostels & Grounds',
] as const;

type CampusFilter = (typeof CAMPUS_FILTERS)[number];

const ORDER_STAGES: { stage: OrderStage; title: string; subtitle: string }[] = [
  {
    stage: 0,
    title: 'Order Confirmed at Kitchen',
    subtitle: 'Queued into the next 5-minute campus batch window',
  },
  {
    stage: 1,
    title: 'Batched & Picked Up by Student Runner',
    subtitle: 'Grouped with nearby campus & hostel orders in one trip',
  },
  {
    stage: 2,
    title: 'Crossing Kottukulam Hills Estate Paths',
    subtitle: 'Bypassing main road traffic across the 40-acre property',
  },
  {
    stage: 3,
    title: 'Hand-Delivered to Your Pin',
    subtitle: 'Dropped right at your college block, lab, or hostel',
  },
];

interface CampusMarkerProps {
  pin: CampusPin;
  isSelected: boolean;
  onSelect: (pin: CampusPin, marker: google.maps.marker.AdvancedMarkerElement) => void;
}

function CampusAdvancedMarker({ pin, isSelected, onSelect }: CampusMarkerProps) {
  const [markerRef, marker] = useAdvancedMarkerRef();

  const background = isSelected
    ? '#1D4ED8'
    : pin.campusGroup === 'Engineering Campus'
    ? '#047857'
    : pin.campusGroup === 'Applied Sciences Campus'
    ? '#2563EB'
    : '#0F172A';

  const borderColor = isSelected ? '#1E3A8A' : '#FFFFFF';

  return (
    <AdvancedMarker
      ref={markerRef}
      position={{ lat: pin.lat, lng: pin.lng }}
      zIndex={isSelected ? 1000 : 10}
      title={`${pin.name} (${pin.campusGroup})`}
      onClick={() => {
        if (marker) {
          onSelect(pin, marker);
        }
      }}
    >
      <Pin
        background={background}
        borderColor={borderColor}
        glyphColor="#FFFFFF"
        scale={isSelected ? 1.2 : 0.95}
      />
    </AdvancedMarker>
  );
}

interface CampusRouteOverlayProps {
  origin: google.maps.LatLngLiteral;
  destination: google.maps.LatLngLiteral;
  onRouteMetrics: (metrics: { distanceMeters?: number; durationText?: string } | null) => void;
}

function CampusRouteOverlay({
  origin,
  destination,
  onRouteMetrics,
}: CampusRouteOverlayProps) {
  const map = useMap();
  const routesLib = useMapsLibrary('routes');
  const polylinesRef = useRef<google.maps.Polyline[]>([]);

  useEffect(() => {
    if (!routesLib || !map) return;

    let cancelled = false;

    const clearPolylines = () => {
      polylinesRef.current.forEach((line) => line.setMap(null));
      polylinesRef.current = [];
    };

    clearPolylines();

    const computeCampusRoute = async () => {
      try {
        const request: google.maps.routes.ComputeRoutesRequest = {
          origin,
          destination,
          travelMode: 'WALKING',
          fields: ['distanceMeters', 'localizedValues', 'path'],
        };
        const response = await routesLib.Route.computeRoutes(request);
        if (cancelled) return;

        if (response.routes && response.routes.length > 0) {
          const route = response.routes[0];
          const created = route.createPolylines({
            polylineOptions: {
              geodesic: true,
              strokeColor: '#1D4ED8',
              strokeOpacity: 0.9,
              strokeWeight: 4,
            },
          });
          if (created.length > 0) {
            created.forEach((line) => line.setMap(map));
            polylinesRef.current = created;
          } else if (route.path && route.path.length > 0) {
            const pathLine = new google.maps.Polyline({
              path: route.path.map((pt) => ({ lat: pt.lat, lng: pt.lng })),
              geodesic: true,
              strokeColor: '#1D4ED8',
              strokeOpacity: 0.9,
              strokeWeight: 4,
              map,
            });
            polylinesRef.current = [pathLine];
          }
          onRouteMetrics({
            distanceMeters: route.distanceMeters,
            durationText: route.localizedValues?.duration ?? undefined,
          });
          return;
        }
      } catch {
        // Fallback straight estate walkway line if inside private campus footpath
      }

      if (cancelled) return;
      const fallbackLine = new google.maps.Polyline({
        path: [origin, destination],
        geodesic: true,
        strokeColor: '#1D4ED8',
        strokeOpacity: 0.85,
        strokeWeight: 3,
        map,
      });
      polylinesRef.current = [fallbackLine];
      onRouteMetrics(null);
    };

    void computeCampusRoute();

    return () => {
      cancelled = true;
      clearPolylines();
    };
  }, [routesLib, map, origin, destination, onRouteMetrics]);

  return null;
}

export function CampusMapTracker({
  mapsApiKeyAvailable,
  pins,
  selectedPin,
  pinDetail,
  onSelectPin,
  onChangePinDetail,
  onDropCustomPin,
  activeOrder,
  onAdvanceOrderStage,
  onClearOrder,
  onOpenHistory,
}: CampusMapTrackerProps) {
  const [campusFilter, setCampusFilter] = useState<CampusFilter>('All 40 Acres');
  const [mapTypeId, setMapTypeId] = useState<'hybrid' | 'roadmap'>('hybrid');
  const [infoAnchor, setInfoAnchor] =
    useState<google.maps.marker.AdvancedMarkerElement | null>(null);
  const [infoPin, setInfoPin] = useState<CampusPin | null>(null);
  const [routeMetrics, setRouteMetrics] = useState<{
    distanceMeters?: number;
    durationText?: string;
  } | null>(null);

  const apiLoadingStatus = useApiLoadingStatus();
  const displayPin = activeOrder ? activeOrder.pin : selectedPin;
  const stageProgress = activeOrder ? activeOrder.stage : 0;

  const progressRatio = activeOrder
    ? stageProgress === 0
      ? 0.06
      : stageProgress === 1
      ? 0.35
      : stageProgress === 2
      ? 0.72
      : 1
    : 0;

  const courierLat =
    KITCHEN_HUB_COORDS.lat +
    (displayPin.lat - KITCHEN_HUB_COORDS.lat) * progressRatio;
  const courierLng =
    KITCHEN_HUB_COORDS.lng +
    (displayPin.lng - KITCHEN_HUB_COORDS.lng) * progressRatio;

  const visiblePins =
    campusFilter === 'All 40 Acres'
      ? pins
      : pins.filter((pin) => pin.campusGroup === campusFilter);

  const handleMarkerSelect = useCallback(
    (pin: CampusPin, marker: google.maps.marker.AdvancedMarkerElement) => {
      onSelectPin(pin);
      setInfoPin(pin);
      setInfoAnchor(marker);
    },
    [onSelectPin]
  );

  const handleRouteMetrics = useCallback(
    (metrics: { distanceMeters?: number; durationText?: string } | null) => {
      setRouteMetrics(metrics);
    },
    []
  );

  const mapReady =
    mapsApiKeyAvailable &&
    apiLoadingStatus !== APILoadingStatus.AUTH_FAILURE &&
    apiLoadingStatus !== APILoadingStatus.FAILED;

  return (
    <section
      id="drop-pin"
      className="py-14 lg:py-16 bg-white border-b border-slate-200"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-8">
          <p className="text-xs font-medium text-slate-500 mb-2">
            Google Maps Platform · ~40 Acres at Kottukulam Hills, Pathamuttom
          </p>
          <h2
            className="font-display text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight"
            style={{ textWrap: 'balance' }}
          >
            Two separate campuses on one live Google Map
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mt-2">
            Saintgits College of Applied Sciences (West Terrace) and Saintgits College of Engineering (East Terrace) occupy separate wings of the estate. Select a verified block marker or tap anywhere on the map to drop your delivery pin.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-7 flex flex-col bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-slate-900">
                  Saintgits Estate · Kottayam, Kerala
                </span>
                {routeMetrics?.distanceMeters && (
                  <span className="px-2 py-0.5 text-[11px] font-mono font-semibold rounded-md bg-blue-50 text-blue-800 border border-blue-200 tabular-nums">
                    {(routeMetrics.distanceMeters / 1000).toFixed(2)} km route
                    {routeMetrics.durationText ? ` · ${routeMetrics.durationText}` : ''}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setMapTypeId((prev) =>
                      prev === 'hybrid' ? 'roadmap' : 'hybrid'
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                >
                  <Layers className="w-3.5 h-3.5 text-blue-700" aria-hidden="true" />
                  <span>{mapTypeId === 'hybrid' ? 'Satellite View' : 'Road View'}</span>
                </button>
              </div>
            </div>

            <div className="relative w-full h-[400px] sm:h-[460px] bg-slate-100">
              {mapReady ? (
                <GoogleMap
                  defaultCenter={SAINTGITS_MAP_CENTER}
                  defaultZoom={17}
                  mapId="DEMO_MAP_ID"
                  mapTypeId={mapTypeId}
                  gestureHandling="greedy"
                  disableDefaultUI={false}
                  streetViewControl={false}
                  internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                  onClick={(ev) => {
                    const ll = ev.detail.latLng;
                    if (ll) {
                      onDropCustomPin(ll.lat, ll.lng);
                      setInfoPin(null);
                    }
                  }}
                  className="w-full h-full"
                >
                  <CampusRouteOverlay
                    origin={KITCHEN_HUB_COORDS}
                    destination={{ lat: displayPin.lat, lng: displayPin.lng }}
                    onRouteMetrics={handleRouteMetrics}
                  />

                  <AdvancedMarker
                    position={KITCHEN_HUB_COORDS}
                    title="Pathamuttom Kitchen Hub"
                    zIndex={5}
                  >
                    <Pin
                      background="#1E293B"
                      borderColor="#FFFFFF"
                      glyphColor="#FFFFFF"
                      scale={0.95}
                    />
                  </AdvancedMarker>

                  {pins.map((pin) => (
                    <CampusAdvancedMarker
                      key={pin.id}
                      pin={pin}
                      isSelected={displayPin.id === pin.id}
                      onSelect={handleMarkerSelect}
                    />
                  ))}

                  {displayPin.id.startsWith('custom-') && (
                    <AdvancedMarker
                      position={{ lat: displayPin.lat, lng: displayPin.lng }}
                      title="Custom Estate Drop Pin"
                      zIndex={1000}
                    >
                      <Pin
                        background="#1D4ED8"
                        borderColor="#FFFFFF"
                        glyphColor="#FFFFFF"
                        scale={1.2}
                      />
                    </AdvancedMarker>
                  )}

                  {activeOrder && (
                    <AdvancedMarker
                      position={{ lat: courierLat, lng: courierLng }}
                      title={`Runner: ${activeOrder.courierName}`}
                      zIndex={1100}
                    >
                      <Pin
                        background="#047857"
                        borderColor="#FFFFFF"
                        glyphColor="#FFFFFF"
                        scale={1.15}
                      />
                    </AdvancedMarker>
                  )}

                  {infoPin && infoAnchor && (
                    <InfoWindow
                      anchor={infoAnchor}
                      onCloseClick={() => setInfoPin(null)}
                    >
                      <div className="p-1 space-y-1 max-w-[210px]">
                        <p className="text-xs font-bold text-slate-900">
                          {infoPin.name}
                        </p>
                        <p className="text-[11px] text-slate-600">
                          {infoPin.campusGroup}
                        </p>
                        <p className="text-[11px] font-mono text-blue-700">
                          {infoPin.etaMinutes} min ETA · {infoPin.activeBatchCount}{' '}
                          active batch orders
                        </p>
                      </div>
                    </InfoWindow>
                  )}
                </GoogleMap>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-3 bg-slate-100">
                  <MapPin className="w-8 h-8 text-blue-700" aria-hidden="true" />
                  <div className="max-w-sm space-y-1">
                    <p className="font-display text-base font-bold text-slate-900">
                      Google Maps Campus View Ready After Server Refresh
                    </p>
                    <p className="text-xs text-slate-600">
                      Select any verified Engineering, Applied Sciences, or Hostel drop-off pin on the right to route your campus batch.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="px-5 py-3.5 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-700" aria-hidden="true" />
                  <strong className="text-slate-900">{displayPin.name}</strong>
                </span>
                <span
                  className={`px-2 py-0.5 text-[11px] font-semibold rounded-md ${
                    getCampusBadgeInfo(displayPin.campusGroup).className
                  }`}
                >
                  {getCampusBadgeInfo(displayPin.campusGroup).label}
                </span>
                <span className="inline-flex items-center gap-1">
                  <KeyRound className="w-3.5 h-3.5 text-slate-600" aria-hidden="true" />
                  {displayPin.keycardRequired
                    ? 'Saintgits Student ID Access'
                    : 'Open Grounds Drop-Off'}
                </span>
              </div>
              <span className="font-mono tabular-nums text-slate-900 font-medium">
                {displayPin.etaMinutes} min avg ETA
              </span>
            </div>
          </div>

          <div id="batch-tracker" className="lg:col-span-5 flex flex-col gap-6">
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-display text-lg font-bold text-slate-900">
                  Select Campus &amp; Block Pin
                </h3>
                <span className="font-mono text-xs text-slate-500 tabular-nums">
                  {displayPin.activeBatchCount} active orders
                </span>
              </div>

              <div
                className="flex flex-wrap gap-1.5 p-1 bg-slate-200/70 rounded-lg"
                role="tablist"
                aria-label="Filter Saintgits campus zones"
              >
                {CAMPUS_FILTERS.map((filter) => {
                  const isActive = campusFilter === filter;
                  return (
                    <button
                      key={filter}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setCampusFilter(filter)}
                      className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        isActive
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {filter === 'Shared Hostels & Grounds'
                        ? 'Hostels & Grounds'
                        : filter === 'Applied Sciences Campus'
                        ? 'Applied Sciences'
                        : filter === 'Engineering Campus'
                        ? 'Engineering'
                        : filter}
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap gap-2">
                {visiblePins.map((pin) => {
                  const active = selectedPin.id === pin.id;
                  return (
                    <button
                      key={pin.id}
                      type="button"
                      onClick={() => onSelectPin(pin)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        active
                          ? 'bg-blue-700 text-white'
                          : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {pin.name}
                    </button>
                  );
                })}
              </div>

              <div>
                <label
                  htmlFor="map-pin-detail"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Exact Room, Lab, Studio, or Hostel Spot
                </label>
                <input
                  id="map-pin-detail"
                  type="text"
                  maxLength={140}
                  value={pinDetail}
                  onChange={(e) => onChangePinDetail(e.target.value)}
                  placeholder={selectedPin.detailPlaceholder}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-700"
                />
              </div>
            </div>

            <div className="flex-1 p-6 bg-white border border-slate-200 rounded-xl flex flex-col justify-between gap-5">
              {activeOrder ? (
                <>
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200">
                      <div>
                        <p className="text-xs font-mono text-blue-700 font-semibold tabular-nums">
                          Order #{activeOrder.orderId} · Batch {activeOrder.batchCode}
                        </p>
                        <h3 className="font-display text-lg font-bold text-slate-900 mt-0.5">
                          Live Campus Batch Tracker
                        </h3>
                      </div>
                      <span className="text-xs font-mono text-slate-600 tabular-nums">
                        {activeOrder.scheduledSlot}
                      </span>
                    </div>

                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
                          {activeOrder.courierMode === 'bike' ? (
                            <Bike className="w-4 h-4" aria-hidden="true" />
                          ) : activeOrder.courierMode === 'scooter' ? (
                            <Zap className="w-4 h-4" aria-hidden="true" />
                          ) : (
                            <Footprints className="w-4 h-4" aria-hidden="true" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {activeOrder.courierName}
                          </p>
                          <p className="text-xs text-slate-500">
                            {activeOrder.courierYear} · Verified Student Runner
                          </p>
                        </div>
                      </div>
                      <Navigation
                        className="w-4 h-4 text-blue-700 shrink-0"
                        aria-hidden="true"
                      />
                    </div>

                    <ol className="space-y-3 pt-1">
                      {ORDER_STAGES.map((step) => {
                        const isDone = activeOrder.stage >= step.stage;
                        const isCurrent = activeOrder.stage === step.stage;
                        return (
                          <li key={step.stage} className="flex items-start gap-3">
                            <CheckCircle2
                              className={`w-4 h-4 mt-0.5 shrink-0 ${
                                isDone ? 'text-blue-700' : 'text-slate-300'
                              }`}
                              aria-hidden="true"
                            />
                            <div>
                              <p
                                className={`text-sm font-semibold ${
                                  isCurrent
                                    ? 'text-blue-700'
                                    : isDone
                                    ? 'text-slate-900'
                                    : 'text-slate-400'
                                }`}
                              >
                                {step.title}
                              </p>
                              <p className="text-xs text-slate-500">{step.subtitle}</p>
                            </div>
                          </li>
                        );
                      })}
                    </ol>
                  </div>

                  <div className="pt-4 border-t border-slate-200 space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-600 font-mono tabular-nums">
                      <span>
                        {activeOrder.pin.name} · {activeOrder.pinDetail}
                      </span>
                      <span className="font-semibold text-slate-900">
                        Paid {formatINR(activeOrder.total)}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {activeOrder.stage < 3 ? (
                        <button
                          type="button"
                          onClick={onAdvanceOrderStage}
                          className="flex-1 py-2.5 px-4 text-xs sm:text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors cursor-pointer"
                        >
                          Advance Courier Progress
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={onClearOrder}
                          className="flex-1 py-2.5 px-4 text-xs sm:text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        >
                          Order Delivered · Start New Order
                        </button>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="h-full flex flex-col justify-between gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                      <Receipt className="w-4 h-4 text-blue-700" aria-hidden="true" />
                      <span>No Active Order Yet</span>
                    </div>
                    <h3 className="font-display text-lg font-bold text-slate-900">
                      Smart Batching keeps fees at ₹19
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      When students at {selectedPin.name} ({selectedPin.campusGroup}) order during break hours, one student runner carries 5 to 10 batched meals across the 40-acre hillside estate in one trip.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-xs text-slate-600">
                    <div className="flex items-center justify-between">
                      <span>Campus Zone</span>
                      <span className="font-semibold text-slate-900">
                        {selectedPin.campusGroup}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Selected Spot</span>
                      <span className="font-semibold text-slate-900">
                        {selectedPin.name}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Nearby Batched Orders</span>
                      <span className="font-mono font-semibold text-slate-900 tabular-nums">
                        {selectedPin.activeBatchCount} students
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <a
                      href="#menu"
                      className="flex-1 py-2.5 px-4 text-center text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors"
                    >
                      Order From Menu
                    </a>
                    <button
                      type="button"
                      onClick={onOpenHistory}
                      className="py-2.5 px-4 text-sm font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Order History
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
