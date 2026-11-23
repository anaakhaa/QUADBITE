export type MenuCategory =
  | 'all'
  | 'kerala'
  | 'indian'
  | 'western'
  | 'under-120'
  | 'late-night';

export type CourierTransportMode = 'foot' | 'bike' | 'scooter';

export type OrderStage = 0 | 1 | 2 | 3;

export type OrderStatus =
  | 'queued'
  | 'preparing'
  | 'ready'
  | 'picked_up'
  | 'en_route'
  | 'delivered';

export type WorkspaceRole = 'student' | 'runner' | 'kitchen';

export interface CampusPin {
  id: string;
  name: string;
  campusGroup: 'Engineering Campus' | 'Applied Sciences Campus' | 'Shared Hostels & Grounds';
  zone: string;
  detailPlaceholder: string;
  defaultDetail: string;
  etaMinutes: number;
  keycardRequired: boolean;
  activeBatchCount: number;
  x: number;
  y: number;
  lat: number;
  lng: number;
}

export interface DishOption {
  id: string;
  label: string;
  priceDelta: number;
}

export interface Dish {
  id: string;
  kitchenId: string;
  kitchenName: string;
  name: string;
  description: string;
  price: number;
  regularPrice: number;
  calories: number;
  prepMinutes: number;
  categories: MenuCategory[];
  vegetarian?: boolean;
  lateNightEligible?: boolean;
  tiffinEligible?: boolean;
  imagePath: string;
  imageAlt: string;
  options: DishOption[];
}

export interface Kitchen {
  id: string;
  name: string;
  cuisine: string;
  styleGroup: 'Kerala & Indian' | 'Western & Bowls';
  locationNote: string;
  distanceKm: string;
  etaRange: string;
  batchCode: string;
  batchOrdersCount: number;
  batchLeavesInMin: number;
  imagePath: string;
  imageAlt: string;
  dishes: Dish[];
}

export interface KitchenOperationalState {
  kitchenId: string;
  prepTimeOffsetMin: number;
  busyLevel: 'normal' | 'busy' | 'rush';
  soldOutDishIds: string[];
  updatedByUid?: string;
}

export interface CartItem {
  cartItemId: string;
  dish: Dish;
  selectedOption: DishOption;
  quantity: number;
  note: string;
}

export interface ActiveOrder {
  orderId: string;
  customerUid?: string;
  customerName?: string;
  kitchenId?: string;
  kitchenName?: string;
  createdAt: string;
  items: CartItem[];
  pin: CampusPin;
  pinDetail: string;
  scheduledSlot: string;
  reusableTiffin: boolean;
  usedLunchCredit: boolean;
  groupBatchId: string;
  deliveryFee: number;
  tiffinDiscount: number;
  subtotal: number;
  total: number;
  paymentMethod: string;
  batchCode: string;
  batchedWithCount: number;
  status: OrderStatus;
  runnerUid?: string;
  courierName: string;
  courierYear: string;
  courierMode: CourierTransportMode;
  runnerPayout: number;
  stage: OrderStage;
}

export interface CourierBatchRun {
  id: string;
  batchCode: string;
  pickupKitchen: string;
  dropoffBuilding: string;
  ordersCount: number;
  distanceKm: number;
  estimatedMinutes: number;
  payout: number;
  recommendedMode: CourierTransportMode;
  claimed?: boolean;
  completed?: boolean;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  campus: 'Engineering Campus' | 'Applied Sciences Campus';
  departmentYear: string;
  activeRole: WorkspaceRole;
  runnerOnDuty: boolean;
  runnerTransportMode: CourierTransportMode;
  runnerShiftEarnings: number;
  runnerCompletedCount: number;
  assignedKitchenId: string;
  hasQuadPass: boolean;
  walletBalance: number;
  lunchBundleCredits: number;
  snackBundleCredits: number;
  savedPins: CampusPin[];
}

export interface GroupBatchCart {
  batchId: string;
  title: string;
  hostUid: string;
  hostName: string;
  pin: CampusPin;
  pinDetail: string;
  scheduledSlot: string;
  reusableTiffin: boolean;
  status: 'open' | 'placed' | 'closed';
  placedOrderId: string;
}

export interface GroupBatchItem {
  itemId: string;
  participantUid: string;
  participantName: string;
  participantCampus: string;
  dishId: string;
  dishName: string;
  kitchenId: string;
  kitchenName: string;
  optionId: string;
  optionLabel: string;
  unitPrice: number;
  quantity: number;
  note: string;
}

export interface BreakSlotOption {
  id: string;
  label: string;
  windowLabel: string;
  isInstant?: boolean;
}

export interface MealBundlePlan {
  id: 'lunch-5' | 'snack-10';
  title: string;
  subtitle: string;
  credits: number;
  price: number;
  regularValue: number;
  perDropSavings: string;
}
