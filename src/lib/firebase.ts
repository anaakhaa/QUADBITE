import { initializeApp } from 'firebase/app';
import {
  GoogleAuthProvider,
  getAuth,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import {
  doc,
  getDocFromServer,
  getFirestore,
  type Timestamp,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { CampusPin } from '../types/quadbite';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function testFirestoreConnection(): Promise<void> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('the client is offline')
    ) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

export async function signInWithGoogle(): Promise<User> {
  const credential = await signInWithPopup(auth, googleProvider);
  return credential.user;
}

export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

// Defensive helpers matching firebase-blueprint.json boundaries
export function clampString(value: string, maxLen: number, fallback = ''): string {
  const clean = value.trim();
  if (!clean) return fallback;
  return clean.slice(0, maxLen);
}

export function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

export function sanitizeId(value: string, maxLen = 64): string {
  const cleaned = value.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, maxLen);
  return cleaned || 'id-default';
}

export function sanitizePinForFirestore(pin: CampusPin): CampusPin {
  return {
    id: sanitizeId(pin.id, 64),
    name: clampString(pin.name, 80, 'Campus Drop Pin'),
    campusGroup: pin.campusGroup,
    zone: clampString(pin.zone, 120, '40-Acre Saintgits Estate'),
    detailPlaceholder: clampString(pin.detailPlaceholder, 140, 'Room, lab, or hostel'),
    defaultDetail: clampString(pin.defaultDetail, 140, 'Campus Entrance'),
    etaMinutes: clampNumber(Math.round(pin.etaMinutes), 1, 120),
    keycardRequired: Boolean(pin.keycardRequired),
    activeBatchCount: clampNumber(Math.round(pin.activeBatchCount), 0, 500),
    x: clampNumber(pin.x, 0, 100),
    y: clampNumber(pin.y, 0, 100),
    lat: clampNumber(pin.lat, -90, 90),
    lng: clampNumber(pin.lng, -180, 180),
  };
}

export function timestampToIso(ts: unknown): string {
  if (!ts) return new Date().toISOString();
  if (typeof ts === 'string') return ts;
  if (typeof ts === 'object' && ts !== null && 'toDate' in ts) {
    try {
      return (ts as Timestamp).toDate().toISOString();
    } catch {
      return new Date().toISOString();
    }
  }
  return new Date().toISOString();
}
