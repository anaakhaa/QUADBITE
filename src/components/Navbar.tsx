import { History, MapPin, ShoppingBag, UserCircle2, Wallet } from 'lucide-react';
import { formatINR, getCampusBadgeInfo } from '../data/campusData';
import { CampusPin, UserProfile, WorkspaceRole } from '../types/quadbite';

interface NavbarProps {
  cartCount: number;
  selectedPin: CampusPin;
  activeRole: WorkspaceRole;
  onChangeRole: (role: WorkspaceRole) => void;
  profile: UserProfile | null;
  onOpenProfile: () => void;
  onOpenCart: () => void;
  onOpenHistory: () => void;
}

export function Navbar({
  cartCount,
  selectedPin,
  activeRole,
  onChangeRole,
  profile,
  onOpenProfile,
  onOpenCart,
  onOpenHistory,
}: NavbarProps) {
  const campusBadge = getCampusBadgeInfo(selectedPin.campusGroup);

  return (
    <header className="sticky top-0 z-40 bg-slate-50/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 lg:gap-5">
        <div className="flex items-center gap-4 shrink-0">
          <a
            href="#top"
            onClick={() => onChangeRole('student')}
            className="font-display text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-700 rounded-sm"
          >
            QuadBite
          </a>

          <div
            className="hidden md:flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg"
            role="tablist"
            aria-label="Workspace role mode"
          >
            {(
              [
                { id: 'student', label: 'Order Food' },
                { id: 'runner', label: 'Runner Mode' },
                { id: 'kitchen', label: 'Kitchen Portal' },
              ] as const
            ).map((tab) => {
              const active = activeRole === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => onChangeRole(tab.id)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 min-w-0">
          <a
            href="#drop-pin"
            onClick={() => onChangeRole('student')}
            title={`${selectedPin.name} (${campusBadge.label})`}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-slate-200 hover:border-slate-300 rounded-lg transition-colors min-w-0"
          >
            <MapPin className="w-3.5 h-3.5 text-blue-700 shrink-0" aria-hidden="true" />
            <span className="hidden xl:inline text-xs font-medium text-slate-800 truncate max-w-[130px]">
              {selectedPin.name}
            </span>
            <span
              className={`px-2 py-0.5 text-[11px] font-semibold rounded-md whitespace-nowrap shrink-0 ${campusBadge.className}`}
            >
              {campusBadge.label}
            </span>
          </a>

          <button
            type="button"
            onClick={onOpenHistory}
            title="Order History"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:border-slate-300 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <History className="w-3.5 h-3.5 text-slate-600" aria-hidden="true" />
            <span>Orders</span>
          </button>

          <button
            type="button"
            onClick={onOpenProfile}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-200 hover:border-slate-300 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {profile ? (
              <>
                <Wallet className="w-3.5 h-3.5 text-blue-700 shrink-0" aria-hidden="true" />
                <span className="hidden sm:inline max-w-[90px] truncate">
                  {profile.displayName.split(' ')[0]}
                </span>
                <span className="font-mono text-blue-700 tabular-nums">
                  {formatINR(profile.walletBalance)}
                </span>
              </>
            ) : (
              <>
                <UserCircle2 className="w-3.5 h-3.5 text-blue-700 shrink-0" aria-hidden="true" />
                <span>Sign In</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onOpenCart}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
          >
            <ShoppingBag className="w-4 h-4" aria-hidden="true" />
            <span className="tabular-nums">Bag ({cartCount})</span>
          </button>
        </div>
      </div>

      {/* Mobile role bar */}
      <div className="md:hidden px-4 pb-2.5 flex items-center gap-1.5 overflow-x-auto">
        {(
          [
            { id: 'student', label: 'Order Food' },
            { id: 'runner', label: 'Runner Mode' },
            { id: 'kitchen', label: 'Kitchen Portal' },
          ] as const
        ).map((tab) => {
          const active = activeRole === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChangeRole(tab.id)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md whitespace-nowrap shrink-0 cursor-pointer ${
                active
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
        <button
          type="button"
          onClick={onOpenHistory}
          className="px-2.5 py-1 text-xs font-semibold rounded-md bg-white text-slate-600 border border-slate-200 whitespace-nowrap shrink-0 cursor-pointer"
        >
          Order History
        </button>
      </div>
    </header>
  );
}
