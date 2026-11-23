/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useMemo, useState } from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';
import { onAuthStateChanged, type User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { AuthProfileDrawer } from './components/AuthProfileDrawer';
import { CampusMapTracker } from './components/CampusMapTracker';
import { CartDrawer } from './components/CartDrawer';
import { CourierAndPassSection } from './components/CourierAndPassSection';
import { DishModal } from './components/DishModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Footer } from './components/Footer';
import { HeroSection } from './components/HeroSection';
import { KitchenPortalView } from './components/KitchenPortalView';
import { MarketplaceSection } from './components/MarketplaceSection';
import { Navbar } from './components/Navbar';
import { OrderHistoryDrawer } from './components/OrderHistoryDrawer';
import { RunnerPortalView } from './components/RunnerPortalView';
import {
  CAMPUS_KITCHENS,
  CAMPUS_PINS,
  DELIVERY_FEE_INR,
  INITIAL_ORDER_HISTORY,
  SCHEDULED_BREAK_SLOTS,
  TIFFIN_DISCOUNT_INR,
} from './data/campusData';
import {
  OperationType,
  auth,
  clampNumber,
  clampString,
  db,
  handleFirestoreError,
  sanitizeId,
  sanitizePinForFirestore,
  signInWithGoogle,
  signOutUser,
  testFirestoreConnection,
  timestampToIso,
} from './lib/firebase';
import {
  ActiveOrder,
  CampusPin,
  CartItem,
  CourierTransportMode,
  Dish,
  DishOption,
  GroupBatchCart,
  GroupBatchItem,
  KitchenOperationalState,
  MealBundlePlan,
  OrderStage,
  OrderStatus,
  UserProfile,
  WorkspaceRole,
} from './types/quadbite';

const MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

const STORAGE_KEYS = {
  CART: 'quadbite_cart_v7',
  QUADPASS: 'quadbite_pass_v7',
  SLOT: 'quadbite_slot_v7',
  TIFFIN: 'quadbite_tiffin_v7',
};

function mapOrderDoc(data: Record<string, unknown>): ActiveOrder {
  return {
    orderId: String(data.orderId || ''),
    customerUid: String(data.customerUid || ''),
    customerName: String(data.customerName || 'Saintgits Student'),
    kitchenId: String(data.kitchenId || ''),
    kitchenName: String(data.kitchenName || ''),
    createdAt: timestampToIso(data.createdAt),
    items: Array.isArray(data.items) ? (data.items as CartItem[]) : [],
    pin: (data.pin as CampusPin) || CAMPUS_PINS[0],
    pinDetail: String(data.pinDetail || ''),
    scheduledSlot: String(data.scheduledSlot || SCHEDULED_BREAK_SLOTS[0].label),
    reusableTiffin: Boolean(data.reusableTiffin),
    usedLunchCredit: Boolean(data.usedLunchCredit),
    groupBatchId: String(data.groupBatchId || ''),
    deliveryFee: Number(data.deliveryFee ?? DELIVERY_FEE_INR),
    tiffinDiscount: Number(data.tiffinDiscount ?? 0),
    subtotal: Number(data.subtotal ?? 0),
    total: Number(data.total ?? 0),
    paymentMethod: String(data.paymentMethod || 'UPI (GPay / PhonePe / Paytm)'),
    batchCode: String(data.batchCode || 'B-401'),
    batchedWithCount: Number(data.batchedWithCount ?? 4),
    status: (data.status as OrderStatus) || 'queued',
    runnerUid: String(data.runnerUid || ''),
    courierName: String(data.runnerName || 'Assigning Student Runner'),
    courierYear: String(data.runnerYear || 'Saintgits Dispatch'),
    courierMode: (data.runnerMode as CourierTransportMode) || 'scooter',
    runnerPayout: Number(data.runnerPayout ?? 45),
    stage: (Number(data.stage ?? 0) as OrderStage) || 0,
  };
}

export default function App() {
  const [gmpQuotaExceeded, setGmpQuotaExceeded] = useState(false);

  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const [activeRole, setActiveRole] = useState<WorkspaceRole>('student');
  const [selectedPin, setSelectedPin] = useState<CampusPin>(CAMPUS_PINS[0]);
  const [pinDetail, setPinDetail] = useState<string>(CAMPUS_PINS[0].defaultDetail);
  const [scheduledSlot, setScheduledSlot] = useState<string>(() => {
    try {
      return (
        localStorage.getItem(STORAGE_KEYS.SLOT) || SCHEDULED_BREAK_SLOTS[0].label
      );
    } catch {
      return SCHEDULED_BREAK_SLOTS[0].label;
    }
  });
  const [reusableTiffin, setReusableTiffin] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.TIFFIN) === 'true';
    } catch {
      return false;
    }
  });
  const [useLunchCredit, setUseLunchCredit] = useState(false);

  const [guestQuadPass, setGuestQuadPass] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.QUADPASS) === 'true';
    } catch {
      return false;
    }
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CART);
      return saved ? (JSON.parse(saved) as CartItem[]) : [];
    } catch {
      return [];
    }
  });

  const [userOrders, setUserOrders] = useState<ActiveOrder[]>([]);
  const [campusQueueOrders, setCampusQueueOrders] = useState<ActiveOrder[]>([]);
  const [kitchenStatuses, setKitchenStatuses] = useState<
    Record<string, KitchenOperationalState>
  >({});

  const [activeBatchId, setActiveBatchId] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('batch');
    return id ? sanitizeId(id, 64) : '';
  });
  const [activeGroupBatch, setActiveGroupBatch] =
    useState<GroupBatchCart | null>(null);
  const [groupBatchItems, setGroupBatchItems] = useState<GroupBatchItem[]>([]);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [modalDish, setModalDish] = useState<Dish | null>(null);
  const [recentlyAddedId, setRecentlyAddedId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('Campus Meal Wallet');

  const hasQuadPass = profile ? profile.hasQuadPass : guestQuadPass;

  // Google Maps Demo Quota Event Listener
  useEffect(() => {
    const handleQuotaExceeded = () => setGmpQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    return () =>
      window.removeEventListener('gmp-quota-exceeded', handleQuotaExceeded);
  }, []);

  // Firestore Startup Connection Check & Auth Observer
  useEffect(() => {
    void testFirestoreConnection();
    const unsub = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setAuthReady(true);
      if (!user) {
        setProfile(null);
        setUserOrders([]);
        setCampusQueueOrders([]);
      }
    });
    return () => unsub();
  }, []);

  // Local Cart & Preferences Persistence
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
    } catch {
      // Ignore storage error
    }
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SLOT, scheduledSlot);
    } catch {
      // Ignore storage error
    }
  }, [scheduledSlot]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TIFFIN, String(reusableTiffin));
    } catch {
      // Ignore storage error
    }
  }, [reusableTiffin]);

  // Sync User Profile (/users/{uid})
  useEffect(() => {
    if (!authReady || !firebaseUser) return;

    const userPath = `users/${firebaseUser.uid}`;
    const userRef = doc(db, 'users', firebaseUser.uid);

    const unsub = onSnapshot(
      userRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          const loadedProfile: UserProfile = {
            uid: String(data.uid || firebaseUser.uid),
            displayName: String(
              data.displayName || firebaseUser.displayName || 'Saintgits Student'
            ),
            email: String(data.email || firebaseUser.email || ''),
            campus:
              data.campus === 'Applied Sciences Campus'
                ? 'Applied Sciences Campus'
                : 'Engineering Campus',
            departmentYear: String(data.departmentYear || "B.Tech CSE '27"),
            activeRole: (data.activeRole as WorkspaceRole) || 'student',
            runnerOnDuty: Boolean(data.runnerOnDuty),
            runnerTransportMode:
              (data.runnerTransportMode as CourierTransportMode) || 'scooter',
            runnerShiftEarnings: Number(data.runnerShiftEarnings ?? 0),
            runnerCompletedCount: Number(data.runnerCompletedCount ?? 0),
            assignedKitchenId: String(
              data.assignedKitchenId || CAMPUS_KITCHENS[0].id
            ),
            hasQuadPass: Boolean(data.hasQuadPass),
            walletBalance: Number(data.walletBalance ?? 500),
            lunchBundleCredits: Number(data.lunchBundleCredits ?? 0),
            snackBundleCredits: Number(data.snackBundleCredits ?? 0),
            savedPins: Array.isArray(data.savedPins)
              ? (data.savedPins as CampusPin[])
              : [],
          };
          setProfile(loadedProfile);
        } else {
          const defaultProfile = {
            uid: sanitizeId(firebaseUser.uid, 128),
            displayName: clampString(
              firebaseUser.displayName || 'Saintgits Student',
              80,
              'Saintgits Student'
            ),
            email: clampString(
              firebaseUser.email || 'student@saintgits.org',
              120,
              'student@saintgits.org'
            ),
            campus: 'Engineering Campus' as const,
            departmentYear: "B.Tech CSE '27",
            activeRole: 'student' as const,
            runnerOnDuty: false,
            runnerTransportMode: 'scooter' as const,
            runnerShiftEarnings: 0,
            runnerCompletedCount: 0,
            assignedKitchenId: CAMPUS_KITCHENS[0].id,
            hasQuadPass: false,
            walletBalance: 500,
            lunchBundleCredits: 0,
            snackBundleCredits: 0,
            savedPins: [
              sanitizePinForFirestore(CAMPUS_PINS[2]),
              sanitizePinForFirestore(CAMPUS_PINS[0]),
            ],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };
          setDoc(userRef, defaultProfile).catch((err) =>
            handleFirestoreError(err, OperationType.WRITE, userPath)
          );
        }
      },
      (err) => handleFirestoreError(err, OperationType.GET, userPath)
    );

    return () => unsub();
  }, [authReady, firebaseUser]);

  // Sync User Orders (/orders where customerUid == uid)
  useEffect(() => {
    if (!authReady || !firebaseUser) return;

    const ordersQuery = query(
      collection(db, 'orders'),
      where('customerUid', '==', firebaseUser.uid)
    );
    const unsub = onSnapshot(
      ordersQuery,
      (snapshot) => {
        const list = snapshot.docs
          .map((d) => mapOrderDoc(d.data() as Record<string, unknown>))
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        setUserOrders(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'orders')
    );

    return () => unsub();
  }, [authReady, firebaseUser]);

  // Sync Live Campus Dispatch Queue (Runner & Kitchen Portals)
  useEffect(() => {
    if (!authReady || !firebaseUser) return;

    const queueQuery = query(
      collection(db, 'orders'),
      where('status', 'in', [
        'queued',
        'preparing',
        'ready',
        'picked_up',
        'en_route',
      ])
    );
    const unsub = onSnapshot(
      queueQuery,
      (snapshot) => {
        const list = snapshot.docs
          .map((d) => mapOrderDoc(d.data() as Record<string, unknown>))
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        setCampusQueueOrders(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'orders')
    );

    return () => unsub();
  }, [authReady, firebaseUser]);

  // Sync Kitchen Operational Statuses (Sold-out dishes & Prep delays)
  useEffect(() => {
    if (!authReady || !firebaseUser) return;

    const unsub = onSnapshot(
      collection(db, 'kitchenStatuses'),
      (snapshot) => {
        const nextMap: Record<string, KitchenOperationalState> = {};
        for (const d of snapshot.docs) {
          const data = d.data();
          nextMap[d.id] = {
            kitchenId: String(data.kitchenId || d.id),
            prepTimeOffsetMin: Number(data.prepTimeOffsetMin ?? 0),
            busyLevel:
              (data.busyLevel as 'normal' | 'busy' | 'rush') || 'normal',
            soldOutDishIds: Array.isArray(data.soldOutDishIds)
              ? (data.soldOutDishIds as string[])
              : [],
            updatedByUid: String(data.updatedByUid || ''),
          };
        }
        setKitchenStatuses(nextMap);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'kitchenStatuses')
    );

    return () => unsub();
  }, [authReady, firebaseUser]);

  // Sync Active Group / Hostel Batch Room (?batch=...)
  useEffect(() => {
    if (!authReady || !firebaseUser || !activeBatchId) {
      setActiveGroupBatch(null);
      setGroupBatchItems([]);
      return;
    }

    const batchPath = `groupBatches/${activeBatchId}`;
    const itemsPath = `groupBatches/${activeBatchId}/items`;

    const unsubBatch = onSnapshot(
      doc(db, 'groupBatches', activeBatchId),
      (snap) => {
        if (!snap.exists()) {
          setActiveGroupBatch(null);
          return;
        }
        const data = snap.data();
        setActiveGroupBatch({
          batchId: String(data.batchId || activeBatchId),
          title: String(data.title || 'Group Campus Batch'),
          hostUid: String(data.hostUid || ''),
          hostName: String(data.hostName || 'Host'),
          pin: (data.pin as CampusPin) || CAMPUS_PINS[0],
          pinDetail: String(data.pinDetail || ''),
          scheduledSlot: String(
            data.scheduledSlot || SCHEDULED_BREAK_SLOTS[0].label
          ),
          reusableTiffin: Boolean(data.reusableTiffin),
          status: (data.status as 'open' | 'placed' | 'closed') || 'open',
          placedOrderId: String(data.placedOrderId || ''),
        });
      },
      (err) => handleFirestoreError(err, OperationType.GET, batchPath)
    );

    const unsubItems = onSnapshot(
      collection(db, 'groupBatches', activeBatchId, 'items'),
      (snap) => {
        const list: GroupBatchItem[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            itemId: String(data.itemId || d.id),
            participantUid: String(data.participantUid || ''),
            participantName: String(data.participantName || 'Student'),
            participantCampus: String(
              data.participantCampus || 'Engineering Campus'
            ),
            dishId: String(data.dishId || ''),
            dishName: String(data.dishName || ''),
            kitchenId: String(data.kitchenId || ''),
            kitchenName: String(data.kitchenName || ''),
            optionId: String(data.optionId || ''),
            optionLabel: String(data.optionLabel || ''),
            unitPrice: Number(data.unitPrice ?? 0),
            quantity: Number(data.quantity ?? 1),
            note: String(data.note || ''),
          };
        });
        setGroupBatchItems(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, itemsPath)
    );

    return () => {
      unsubBatch();
      unsubItems();
    };
  }, [authReady, firebaseUser, activeBatchId]);

  const handleSignIn = async () => {
    setAuthLoading(true);
    try {
      await signInWithGoogle();
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOutUser();
    setActiveRole('student');
    setIsProfileOpen(false);
  };

  const updateUserProfile = async (patch: Partial<UserProfile>) => {
    if (!firebaseUser) return;
    const path = `users/${firebaseUser.uid}`;
    try {
      await updateDoc(doc(db, 'users', firebaseUser.uid), {
        ...patch,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const handleTopUpWallet = async (amount: number) => {
    if (!profile) return;
    const nextBalance = clampNumber(
      profile.walletBalance + amount,
      0,
      50000
    );
    await updateUserProfile({ walletBalance: nextBalance });
  };

  const handleSaveCurrentPin = async () => {
    if (!profile) return;
    const sanitized = sanitizePinForFirestore({
      ...selectedPin,
      defaultDetail: pinDetail.trim() || selectedPin.defaultDetail,
    });
    const withoutDupes = profile.savedPins.filter((p) => p.id !== sanitized.id);
    const nextPins = [sanitized, ...withoutDupes].slice(0, 8);
    await updateUserProfile({ savedPins: nextPins });
  };

  const handleRemoveSavedPin = async (pinId: string) => {
    if (!profile) return;
    const nextPins = profile.savedPins.filter((p) => p.id !== pinId);
    await updateUserProfile({ savedPins: nextPins });
  };

  const handleToggleQuadPass = async () => {
    if (profile) {
      await updateUserProfile({ hasQuadPass: !profile.hasQuadPass });
    } else {
      setGuestQuadPass((prev) => {
        const next = !prev;
        try {
          localStorage.setItem(STORAGE_KEYS.QUADPASS, String(next));
        } catch {
          // Ignore storage error
        }
        return next;
      });
    }
  };

  const handlePurchaseBundle = async (bundle: MealBundlePlan) => {
    if (!profile) return;
    const patch: Partial<UserProfile> =
      bundle.id === 'lunch-5'
        ? {
            lunchBundleCredits: clampNumber(
              profile.lunchBundleCredits + bundle.credits,
              0,
              50
            ),
          }
        : {
            snackBundleCredits: clampNumber(
              profile.snackBundleCredits + bundle.credits,
              0,
              50
            ),
          };
    await updateUserProfile(patch);
  };

  const handleSelectPin = (pin: CampusPin) => {
    setSelectedPin(pin);
    setPinDetail(pin.defaultDetail);
  };

  const handleDropCustomPinLatLng = (lat: number, lng: number) => {
    // Infer campus wing relative to Saintgits estate longitude split
    const inferredGroup: CampusPin['campusGroup'] =
      lat >= 9.5092 && lng <= 76.5502
        ? 'Applied Sciences Campus'
        : lat >= 9.5092 && lng > 76.5502
        ? 'Engineering Campus'
        : 'Shared Hostels & Grounds';

    const customPin: CampusPin = {
      id: `custom-${Math.round(lat * 100000)}-${Math.round(lng * 100000)}`,
      name: 'Custom Estate Pin',
      campusGroup: inferredGroup,
      zone: '40-Acre Saintgits Estate · Kottukulam Hills',
      detailPlaceholder: 'Bench, block entrance, or study spot nearby',
      defaultDetail: `Campus Pin (${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E)`,
      etaMinutes: 14,
      keycardRequired: false,
      activeBatchCount: 4,
      x: 50,
      y: 50,
      lat,
      lng,
    };
    setSelectedPin(customPin);
    setPinDetail(customPin.defaultDetail);
  };

  const addItemToCart = (
    dish: Dish,
    option: DishOption,
    quantity: number,
    note: string
  ) => {
    const itemKey = `${dish.id}::${option.id}::${note}`;
    setCart((prev) => {
      const existing = prev.find((item) => item.cartItemId === itemKey);
      if (existing) {
        return prev.map((item) =>
          item.cartItemId === itemKey
            ? { ...item, quantity: Math.min(10, item.quantity + quantity) }
            : item
        );
      }
      return [
        ...prev,
        {
          cartItemId: itemKey,
          dish,
          selectedOption: option,
          quantity,
          note,
        },
      ];
    });

    setRecentlyAddedId(dish.id);
    window.setTimeout(() => {
      setRecentlyAddedId((curr) => (curr === dish.id ? null : curr));
    }, 1200);
  };

  const handleQuickAddDish = (dish: Dish) => {
    addItemToCart(dish, dish.options[0], 1, '');
  };

  const handleUpdateQuantity = (cartItemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.cartItemId === cartItemId
            ? { ...item, quantity: item.quantity + delta }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const handleRemoveItem = (cartItemId: string) => {
    setCart((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0 || !profile || !firebaseUser) return;

    const subtotal = cart.reduce(
      (sum, item) =>
        sum + (item.dish.price + item.selectedOption.priceDelta) * item.quantity,
      0
    );
    const tiffinDiscount = reusableTiffin ? TIFFIN_DISCOUNT_INR : 0;
    const deliveryFee = hasQuadPass || useLunchCredit ? 0 : DELIVERY_FEE_INR;
    const creditApplied = useLunchCredit ? Math.min(subtotal, 150) : 0;
    const total = clampNumber(
      subtotal - tiffinDiscount - creditApplied + deliveryFee,
      0,
      50000
    );

    const orderId = `QB-${Math.floor(2000 + Math.random() * 7900)}`;
    const batchNumber = Math.floor(400 + Math.random() * 90);
    const primaryKitchen = cart[0].dish;

    const orderPath = `orders/${orderId}`;
    const orderPayload = {
      orderId,
      customerUid: firebaseUser.uid,
      customerName: clampString(profile.displayName, 80, 'Saintgits Student'),
      kitchenId: sanitizeId(primaryKitchen.kitchenId, 64),
      kitchenName: clampString(primaryKitchen.kitchenName, 80, 'Campus Kitchen'),
      items: cart.slice(0, 25),
      pin: sanitizePinForFirestore(selectedPin),
      pinDetail: clampString(
        pinDetail,
        140,
        selectedPin.defaultDetail || 'Campus Entrance'
      ),
      scheduledSlot: clampString(scheduledSlot, 60, 'Deliver Now'),
      reusableTiffin: Boolean(reusableTiffin),
      usedLunchCredit: Boolean(useLunchCredit),
      groupBatchId: '',
      subtotal,
      tiffinDiscount,
      deliveryFee,
      total,
      paymentMethod: clampString(paymentMethod, 60, 'UPI'),
      batchCode: `B-${batchNumber}`,
      batchedWithCount: Math.max(3, selectedPin.activeBatchCount),
      status: 'queued' as const,
      stage: 0 as const,
      runnerUid: '',
      runnerName: '',
      runnerYear: '',
      runnerMode: 'scooter' as const,
      runnerPayout: 45,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'orders', orderId), orderPayload);

      const userPatch: Record<string, unknown> = {
        updatedAt: serverTimestamp(),
      };
      if (paymentMethod === 'Campus Meal Wallet' && total > 0) {
        userPatch.walletBalance = clampNumber(
          profile.walletBalance - total,
          0,
          50000
        );
      }
      if (useLunchCredit && profile.lunchBundleCredits > 0) {
        userPatch.lunchBundleCredits = clampNumber(
          profile.lunchBundleCredits - 1,
          0,
          50
        );
      }
      batch.update(doc(db, 'users', firebaseUser.uid), userPatch);
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, orderPath);
    }

    setCart([]);
    setUseLunchCredit(false);
    setIsCartOpen(false);
    const trackerEl = document.getElementById('batch-tracker');
    if (trackerEl) {
      trackerEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleCreateGroupBatch = async () => {
    if (!profile || !firebaseUser) return;
    const batchId = `GB-${Math.floor(10000 + Math.random() * 89999)}`;
    const path = `groupBatches/${batchId}`;

    try {
      await setDoc(doc(db, 'groupBatches', batchId), {
        batchId,
        title: clampString(`${selectedPin.name} Group Batch`, 80, 'Group Batch'),
        hostUid: firebaseUser.uid,
        hostName: clampString(profile.displayName, 80, 'Host'),
        pin: sanitizePinForFirestore(selectedPin),
        pinDetail: clampString(pinDetail, 140, selectedPin.defaultDetail),
        scheduledSlot: clampString(scheduledSlot, 60, 'Deliver Now'),
        reusableTiffin: Boolean(reusableTiffin),
        status: 'open',
        placedOrderId: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setActiveBatchId(batchId);
      const url = new URL(window.location.href);
      url.searchParams.set('batch', batchId);
      window.history.replaceState({}, '', url.toString());
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  const handleSyncCartToGroupBatch = async () => {
    if (!profile || !firebaseUser || !activeGroupBatch || cart.length === 0)
      return;

    const batch = writeBatch(db);
    for (const item of cart) {
      const itemId = sanitizeId(
        `${firebaseUser.uid.slice(0, 8)}-${item.dish.id}-${item.selectedOption.id}-${Date.now()}`,
        128
      );
      batch.set(
        doc(db, 'groupBatches', activeGroupBatch.batchId, 'items', itemId),
        {
          itemId,
          participantUid: firebaseUser.uid,
          participantName: clampString(profile.displayName, 80, 'Student'),
          participantCampus: profile.campus,
          dishId: sanitizeId(item.dish.id, 64),
          dishName: clampString(item.dish.name, 100, 'Campus Dish'),
          kitchenId: sanitizeId(item.dish.kitchenId, 64),
          kitchenName: clampString(item.dish.kitchenName, 80, 'Campus Kitchen'),
          optionId: sanitizeId(item.selectedOption.id, 64),
          optionLabel: clampString(item.selectedOption.label, 80, 'Standard'),
          unitPrice: clampNumber(
            item.dish.price + item.selectedOption.priceDelta,
            0,
            5000
          ),
          quantity: clampNumber(item.quantity, 1, 10),
          note: clampString(item.note, 140, ''),
          createdAt: serverTimestamp(),
        }
      );
    }

    try {
      await batch.commit();
      setCart([]);
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.WRITE,
        `groupBatches/${activeGroupBatch.batchId}/items`
      );
    }
  };

  const handleRemoveGroupItem = async (itemId: string) => {
    if (!activeGroupBatch) return;
    const path = `groupBatches/${activeGroupBatch.batchId}/items/${itemId}`;
    try {
      await deleteDoc(
        doc(db, 'groupBatches', activeGroupBatch.batchId, 'items', itemId)
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const handleLeaveGroupBatch = () => {
    setActiveBatchId('');
    const url = new URL(window.location.href);
    url.searchParams.delete('batch');
    window.history.replaceState({}, '', url.toString());
  };

  const handlePlaceGroupBatchOrder = async () => {
    if (
      !profile ||
      !firebaseUser ||
      !activeGroupBatch ||
      groupBatchItems.length === 0
    ) {
      return;
    }

    const mappedItems: CartItem[] = groupBatchItems.slice(0, 25).map((g) => {
      const foundKitchen =
        CAMPUS_KITCHENS.find((k) => k.id === g.kitchenId) || CAMPUS_KITCHENS[0];
      const foundDish =
        foundKitchen.dishes.find((d) => d.id === g.dishId) ||
        foundKitchen.dishes[0];
      return {
        cartItemId: g.itemId,
        dish: foundDish,
        selectedOption: {
          id: g.optionId,
          label: g.optionLabel,
          priceDelta: g.unitPrice - foundDish.price,
        },
        quantity: g.quantity,
        note: `${g.participantName}: ${g.note}`.slice(0, 140),
      };
    });

    const subtotal = groupBatchItems.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0
    );
    const tiffinDiscount = activeGroupBatch.reusableTiffin
      ? TIFFIN_DISCOUNT_INR
      : 0;
    const deliveryFee = hasQuadPass ? 0 : DELIVERY_FEE_INR;
    const total = clampNumber(subtotal - tiffinDiscount + deliveryFee, 0, 50000);
    const orderId = `QB-${Math.floor(2000 + Math.random() * 7900)}`;

    try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'orders', orderId), {
        orderId,
        customerUid: firebaseUser.uid,
        customerName: clampString(profile.displayName, 80, 'Group Host'),
        kitchenId: sanitizeId(groupBatchItems[0].kitchenId, 64),
        kitchenName: clampString(
          groupBatchItems[0].kitchenName,
          80,
          'Campus Kitchen'
        ),
        items: mappedItems,
        pin: sanitizePinForFirestore(activeGroupBatch.pin),
        pinDetail: clampString(
          activeGroupBatch.pinDetail,
          140,
          activeGroupBatch.pin.defaultDetail
        ),
        scheduledSlot: clampString(
          activeGroupBatch.scheduledSlot,
          60,
          'Deliver Now'
        ),
        reusableTiffin: Boolean(activeGroupBatch.reusableTiffin),
        usedLunchCredit: false,
        groupBatchId: activeGroupBatch.batchId,
        subtotal,
        tiffinDiscount,
        deliveryFee,
        total,
        paymentMethod: 'Group UPI Split',
        batchCode: `B-${Math.floor(400 + Math.random() * 90)}`,
        batchedWithCount: Math.max(4, groupBatchItems.length),
        status: 'queued',
        stage: 0,
        runnerUid: '',
        runnerName: '',
        runnerYear: '',
        runnerMode: 'scooter',
        runnerPayout: 55,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      batch.update(doc(db, 'groupBatches', activeGroupBatch.batchId), {
        status: 'placed',
        placedOrderId: orderId,
        updatedAt: serverTimestamp(),
      });

      await batch.commit();
      handleLeaveGroupBatch();
      setIsCartOpen(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `orders/${orderId}`);
    }
  };

  const handleClaimOrder = async (orderId: string) => {
    if (!profile || !firebaseUser) return;
    const path = `orders/${orderId}`;
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        runnerUid: firebaseUser.uid,
        runnerName: clampString(profile.displayName, 80, 'Student Runner'),
        runnerYear: clampString(profile.departmentYear, 60, 'Saintgits Runner'),
        runnerMode: profile.runnerTransportMode,
        status: 'picked_up',
        stage: 1,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const handleAdvanceOrderStatus = async (
    orderId: string,
    nextStatus: OrderStatus,
    nextStage: OrderStage,
    payout?: number
  ) => {
    if (!firebaseUser) return;
    const path = `orders/${orderId}`;
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, 'orders', orderId), {
        status: nextStatus,
        stage: nextStage,
        updatedAt: serverTimestamp(),
      });

      if (nextStatus === 'delivered' && payout && profile) {
        batch.update(doc(db, 'users', firebaseUser.uid), {
          runnerShiftEarnings: clampNumber(
            profile.runnerShiftEarnings + payout,
            0,
            50000
          ),
          runnerCompletedCount: clampNumber(
            profile.runnerCompletedCount + 1,
            0,
            5000
          ),
          walletBalance: clampNumber(profile.walletBalance + payout, 0, 50000),
          updatedAt: serverTimestamp(),
        });
      }
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const handleUpdateKitchenStatus = async (
    kitchenId: string,
    nextState: Omit<KitchenOperationalState, 'kitchenId' | 'updatedByUid'>
  ) => {
    if (!firebaseUser) return;
    const path = `kitchenStatuses/${kitchenId}`;
    try {
      await setDoc(doc(db, 'kitchenStatuses', kitchenId), {
        kitchenId: sanitizeId(kitchenId, 64),
        prepTimeOffsetMin: clampNumber(nextState.prepTimeOffsetMin, 0, 45),
        busyLevel: nextState.busyLevel,
        soldOutDishIds: nextState.soldOutDishIds.slice(0, 20),
        updatedByUid: firebaseUser.uid,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const handleReorder = (pastOrder: ActiveOrder) => {
    setCart((prev) => {
      const next = [...prev];
      for (const pastItem of pastOrder.items) {
        const existingIndex = next.findIndex(
          (item) => item.cartItemId === pastItem.cartItemId
        );
        if (existingIndex >= 0) {
          next[existingIndex] = {
            ...next[existingIndex],
            quantity: Math.min(10, next[existingIndex].quantity + pastItem.quantity),
          };
        } else {
          next.push({ ...pastItem });
        }
      }
      return next;
    });

    setSelectedPin(pastOrder.pin);
    setPinDetail(pastOrder.pinDetail);
    setIsHistoryOpen(false);
    setIsCartOpen(true);
  };

  const combinedHistory = useMemo(() => {
    return userOrders.length > 0 ? userOrders : INITIAL_ORDER_HISTORY;
  }, [userOrders]);

  const activeOrder = useMemo(() => {
    return userOrders.find((order) => order.status !== 'delivered') || null;
  }, [userOrders]);

  const totalBagItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <ErrorBoundary>
      <APIProvider
        apiKey={MAPS_API_KEY}
        language="en"
        region="IN"
        libraries={['marker', 'routes']}
      >
        <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
          {gmpQuotaExceeded && (
            <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
              <span>
                Google Maps Platform quota reached. If you are the app owner, visit{' '}
                <a
                  href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline font-semibold text-amber-950 hover:text-amber-800"
                >
                  maps developer site
                </a>{' '}
                for instructions to update your account.
              </span>
            </div>
          )}

          <Navbar
            cartCount={totalBagItems}
            selectedPin={selectedPin}
            activeRole={activeRole}
            onChangeRole={(role) => {
              setActiveRole(role);
              if (profile) {
                void updateUserProfile({ activeRole: role });
              }
            }}
            profile={profile}
            onOpenProfile={() => setIsProfileOpen(true)}
            onOpenCart={() => setIsCartOpen(true)}
            onOpenHistory={() => setIsHistoryOpen(true)}
          />

          <main className="flex-1">
            {activeRole === 'runner' ? (
              <RunnerPortalView
                profile={profile}
                onSignIn={handleSignIn}
                onDuty={profile?.runnerOnDuty ?? false}
                transportMode={profile?.runnerTransportMode ?? 'scooter'}
                onToggleOnDuty={() => {
                  if (profile) {
                    void updateUserProfile({
                      runnerOnDuty: !profile.runnerOnDuty,
                    });
                  }
                }}
                onChangeTransportMode={(mode) => {
                  if (profile) {
                    void updateUserProfile({ runnerTransportMode: mode });
                  }
                }}
                liveOrders={campusQueueOrders}
                onClaimOrder={handleClaimOrder}
                onAdvanceOrderStatus={handleAdvanceOrderStatus}
                onBackToStudentMenu={() => setActiveRole('student')}
              />
            ) : activeRole === 'kitchen' ? (
              <KitchenPortalView
                profile={profile}
                onSignIn={handleSignIn}
                liveOrders={campusQueueOrders}
                kitchenStatuses={kitchenStatuses}
                onUpdateKitchenStatus={handleUpdateKitchenStatus}
                onAdvanceOrderStatus={handleAdvanceOrderStatus}
                onBackToStudentMenu={() => setActiveRole('student')}
              />
            ) : (
              <>
                <HeroSection
                  pins={CAMPUS_PINS}
                  selectedPin={selectedPin}
                  onSelectPin={handleSelectPin}
                  scheduledSlot={scheduledSlot}
                  onChangeScheduledSlot={setScheduledSlot}
                  hasQuadPass={hasQuadPass}
                  onToggleQuadPass={() => void handleToggleQuadPass()}
                  onOpenGroupBatch={() => setIsCartOpen(true)}
                />

                <MarketplaceSection
                  onQuickAddDish={handleQuickAddDish}
                  onSelectDishForModal={(dish) => setModalDish(dish)}
                  recentlyAddedId={recentlyAddedId}
                  kitchenStatuses={kitchenStatuses}
                  selectedPin={selectedPin}
                  onSelectPin={handleSelectPin}
                />

                <CampusMapTracker
                  mapsApiKeyAvailable={Boolean(MAPS_API_KEY)}
                  pins={CAMPUS_PINS}
                  selectedPin={selectedPin}
                  pinDetail={pinDetail}
                  onSelectPin={handleSelectPin}
                  onChangePinDetail={setPinDetail}
                  onDropCustomPin={handleDropCustomPinLatLng}
                  activeOrder={activeOrder}
                  onAdvanceOrderStage={() => {
                    if (!activeOrder) return;
                    const nextStage = Math.min(
                      3,
                      activeOrder.stage + 1
                    ) as OrderStage;
                    const nextStatus: OrderStatus =
                      nextStage === 1
                        ? 'picked_up'
                        : nextStage === 2
                        ? 'en_route'
                        : 'delivered';
                    void handleAdvanceOrderStatus(
                      activeOrder.orderId,
                      nextStatus,
                      nextStage
                    );
                  }}
                  onClearOrder={() => setIsHistoryOpen(true)}
                  onOpenHistory={() => setIsHistoryOpen(true)}
                />

                <CourierAndPassSection
                  hasQuadPass={hasQuadPass}
                  onToggleQuadPass={() => void handleToggleQuadPass()}
                  profile={profile}
                  onPurchaseBundle={handlePurchaseBundle}
                  onOpenRunnerMode={() => setActiveRole('runner')}
                  onOpenSignIn={handleSignIn}
                />
              </>
            )}
          </main>

          <Footer onOpenHistory={() => setIsHistoryOpen(true)} />

          {modalDish && (
            <DishModal
              key={modalDish.id}
              dish={modalDish}
              onClose={() => setModalDish(null)}
              onAddToCart={addItemToCart}
            />
          )}

          <CartDrawer
            isOpen={isCartOpen}
            onClose={() => setIsCartOpen(false)}
            items={cart}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            selectedPin={selectedPin}
            pinDetail={pinDetail}
            onChangePinDetail={setPinDetail}
            scheduledSlot={scheduledSlot}
            onChangeScheduledSlot={setScheduledSlot}
            reusableTiffin={reusableTiffin}
            onToggleReusableTiffin={() => setReusableTiffin((prev) => !prev)}
            useLunchCredit={useLunchCredit}
            onToggleUseLunchCredit={() => setUseLunchCredit((prev) => !prev)}
            hasQuadPass={hasQuadPass}
            onToggleQuadPass={() => void handleToggleQuadPass()}
            paymentMethod={paymentMethod}
            onChangePaymentMethod={setPaymentMethod}
            profile={profile}
            onSignIn={handleSignIn}
            onTopUpWallet={handleTopUpWallet}
            onPlaceOrder={handlePlaceOrder}
            onOpenHistory={() => setIsHistoryOpen(true)}
            activeGroupBatch={activeGroupBatch}
            groupBatchItems={groupBatchItems}
            onCreateGroupBatch={handleCreateGroupBatch}
            onSyncCartToGroupBatch={handleSyncCartToGroupBatch}
            onRemoveGroupItem={handleRemoveGroupItem}
            onLeaveGroupBatch={handleLeaveGroupBatch}
            onPlaceGroupBatchOrder={handlePlaceGroupBatchOrder}
          />

          <OrderHistoryDrawer
            isOpen={isHistoryOpen}
            onClose={() => setIsHistoryOpen(false)}
            orders={combinedHistory}
            onReorder={handleReorder}
          />

          <AuthProfileDrawer
            isOpen={isProfileOpen}
            onClose={() => setIsProfileOpen(false)}
            userEmail={firebaseUser?.email ?? null}
            profile={profile}
            authLoading={authLoading}
            onSignIn={handleSignIn}
            onSignOut={handleSignOut}
            onUpdateProfile={updateUserProfile}
            onTopUpWallet={handleTopUpWallet}
            selectedPin={selectedPin}
            onSelectPin={handleSelectPin}
            onSaveCurrentPin={handleSaveCurrentPin}
            onRemoveSavedPin={handleRemoveSavedPin}
            onSwitchRole={(role) => setActiveRole(role)}
          />
        </div>
      </APIProvider>
    </ErrorBoundary>
  );
}
