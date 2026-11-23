import { useState } from 'react';
import {
  BookmarkPlus,
  Check,
  GraduationCap,
  LogIn,
  LogOut,
  MapPin,
  ShieldCheck,
  Trash2,
  UserCheck,
  Wallet,
  X,
} from 'lucide-react';
import { formatINR, getCampusBadgeInfo } from '../data/campusData';
import { CampusPin, UserProfile, WorkspaceRole } from '../types/quadbite';

interface AuthProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string | null;
  profile: UserProfile | null;
  authLoading: boolean;
  onSignIn: () => Promise<void>;
  onSignOut: () => Promise<void>;
  onUpdateProfile: (patch: Partial<UserProfile>) => Promise<void>;
  onTopUpWallet: (amount: number) => Promise<void>;
  selectedPin: CampusPin;
  onSelectPin: (pin: CampusPin) => void;
  onSaveCurrentPin: () => Promise<void>;
  onRemoveSavedPin: (pinId: string) => Promise<void>;
  onSwitchRole: (role: WorkspaceRole) => void;
}

export function AuthProfileDrawer({
  isOpen,
  onClose,
  userEmail,
  profile,
  authLoading,
  onSignIn,
  onSignOut,
  onUpdateProfile,
  onTopUpWallet,
  selectedPin,
  onSelectPin,
  onSaveCurrentPin,
  onRemoveSavedPin,
  onSwitchRole,
}: AuthProfileDrawerProps) {
  const [departmentInput, setDepartmentInput] = useState(
    profile?.departmentYear || ''
  );
  const [savingDept, setSavingDept] = useState(false);
  const [deptSaved, setDeptSaved] = useState(false);

  if (!isOpen) {
    return null;
  }

  const handleSaveDept = async () => {
    if (!profile) return;
    setSavingDept(true);
    try {
      await onUpdateProfile({
        departmentYear: departmentInput.trim() || "B.Tech CSE '27",
      });
      setDeptSaved(true);
      window.setTimeout(() => setDeptSaved(false), 1500);
    } finally {
      setSavingDept(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/45 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-drawer-title"
    >
      <div className="w-full max-w-md bg-white h-full flex flex-col border-l border-slate-200">
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between gap-4">
          <div>
            <h2
              id="profile-drawer-title"
              className="font-display text-xl font-bold text-slate-900"
            >
              Saintgits Campus Account
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Cross-device sync · Meal Wallet · Saved Pins · Role Access
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close campus profile drawer"
            className="p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!profile ? (
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
              <div className="w-10 h-10 rounded-lg bg-blue-700 text-white flex items-center justify-center">
                <GraduationCap className="w-5 h-5" aria-hidden="true" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-display text-lg font-bold text-slate-900">
                  Sign in with your Google Account
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Verify your Saintgits campus (Engineering vs Applied Sciences), sync Order History and QuadPass across devices, unlock Campus Meal Wallet, and join live group batch links.
                </p>
              </div>
              <button
                type="button"
                disabled={authLoading}
                onClick={() => void onSignIn()}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-60 rounded-lg transition-colors cursor-pointer"
              >
                <LogIn className="w-4 h-4" aria-hidden="true" />
                <span>
                  {authLoading ? 'Connecting Account...' : 'Continue with Google'}
                </span>
              </button>
            </div>
          ) : (
            <>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-display text-base font-bold text-slate-900">
                        {profile.displayName}
                      </p>
                      <span
                        className={`px-2 py-0.5 text-[11px] font-semibold rounded-md ${
                          getCampusBadgeInfo(profile.campus).className
                        }`}
                      >
                        {getCampusBadgeInfo(profile.campus).label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{userEmail}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md shrink-0">
                    <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                    Verified
                  </span>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <p className="text-xs font-semibold text-slate-700">
                    Verified Saintgits Campus Wing
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        'Engineering Campus',
                        'Applied Sciences Campus',
                      ] as const
                    ).map((campusOption) => {
                      const active = profile.campus === campusOption;
                      return (
                        <button
                          key={campusOption}
                          type="button"
                          onClick={() =>
                            void onUpdateProfile({ campus: campusOption })
                          }
                          className={`px-3 py-2 text-xs font-semibold rounded-lg border text-left transition-colors cursor-pointer ${
                            active
                              ? 'border-blue-700 bg-blue-50 text-blue-900'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          {campusOption === 'Engineering Campus'
                            ? 'Saintgits Engineering'
                            : 'Saintgits Applied Sciences'}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  <label
                    htmlFor="profile-dept-input"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    Department &amp; Batch Year
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="profile-dept-input"
                      type="text"
                      maxLength={60}
                      value={departmentInput || profile.departmentYear}
                      onChange={(e) => setDepartmentInput(e.target.value)}
                      placeholder="e.g. B.Tech CSE '27 or BCA AI '28"
                      className="flex-1 px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-700"
                    />
                    <button
                      type="button"
                      disabled={savingDept}
                      onClick={() => void handleSaveDept()}
                      className="px-3 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer shrink-0"
                    >
                      {deptSaved ? 'Saved' : 'Update'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-blue-700" aria-hidden="true" />
                    <h3 className="text-sm font-bold text-slate-900">
                      Campus Meal Wallet
                    </h3>
                  </div>
                  <span className="font-mono text-lg font-bold text-slate-900 tabular-nums">
                    {formatINR(profile.walletBalance)}
                  </span>
                </div>

                <p className="text-xs text-slate-600">
                  Instant 1-tap checkout across all Saintgits &amp; Pathamuttom kitchens with zero UPI redirects.
                </p>

                <div className="grid grid-cols-3 gap-2">
                  {[100, 250, 500].map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => void onTopUpWallet(amount)}
                      className="py-2 px-3 text-xs font-mono font-semibold text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer tabular-nums"
                    >
                      +{formatINR(amount)}
                    </button>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-200 grid grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="text-slate-500 block">Lunch Bundle</span>
                    <span className="font-mono font-bold text-slate-900 tabular-nums">
                      {profile.lunchBundleCredits} drops left
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="text-slate-500 block">Chai &amp; Snack</span>
                    <span className="font-mono font-bold text-slate-900 tabular-nums">
                      {profile.snackBundleCredits} drops left
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-slate-900">
                    Saved Drop-Off Pins ({profile.savedPins.length}/8)
                  </h3>
                  <button
                    type="button"
                    onClick={() => void onSaveCurrentPin()}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:underline cursor-pointer"
                  >
                    <BookmarkPlus className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Save Current Pin</span>
                  </button>
                </div>

                {profile.savedPins.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    Save your classroom, computer lab, or hostel room for 1-tap switching.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {profile.savedPins.map((pin) => {
                      const isCurrent = selectedPin.id === pin.id;
                      const badge = getCampusBadgeInfo(pin.campusGroup);
                      return (
                        <li
                          key={pin.id}
                          className="flex items-center justify-between gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              onSelectPin(pin);
                              onClose();
                            }}
                            className="flex-1 text-left min-w-0 cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <MapPin
                                className="w-3.5 h-3.5 text-blue-700 shrink-0"
                                aria-hidden="true"
                              />
                              <span className="text-xs font-semibold text-slate-900 truncate">
                                {pin.name}
                              </span>
                              {isCurrent && (
                                <Check
                                  className="w-3.5 h-3.5 text-emerald-700 shrink-0"
                                  aria-hidden="true"
                                />
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1 pl-5">
                              <span
                                className={`px-1.5 py-0.5 text-[10px] font-semibold rounded ${badge.className}`}
                              >
                                {badge.label}
                              </span>
                              <span className="text-[11px] text-slate-500 truncate">
                                {pin.defaultDetail}
                              </span>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => void onRemoveSavedPin(pin.id)}
                            aria-label={`Remove saved pin ${pin.name}`}
                            className="p-1.5 text-slate-400 hover:text-red-700 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-blue-700" aria-hidden="true" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Active Workspace Mode
                  </h3>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { id: 'student', label: 'Order Food' },
                      { id: 'runner', label: 'Runner Mode' },
                      { id: 'kitchen', label: 'Kitchen Portal' },
                    ] as const
                  ).map((roleOption) => {
                    const active = profile.activeRole === roleOption.id;
                    return (
                      <button
                        key={roleOption.id}
                        type="button"
                        onClick={() => {
                          onSwitchRole(roleOption.id);
                          onClose();
                        }}
                        className={`py-2 px-2.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                          active
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {roleOption.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {profile && (
          <div className="p-6 border-t border-slate-200 bg-slate-50">
            <button
              type="button"
              onClick={() => void onSignOut()}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:border-slate-400 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" aria-hidden="true" />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
