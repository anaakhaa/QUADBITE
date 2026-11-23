# QuadBite Security Specification (Phase 0)

## 1. Data Invariants
1. **User Profile PII Isolation**: User profiles (`/users/{userId}`) contain email addresses, meal wallet balances, and saved campus locations. Only the authenticated verified owner (`request.auth.uid == userId && request.auth.token.email_verified == true`) may read, create, or update their profile.
2. **Wallet & Bundle Integrity**: Wallet balances (`0..50000`) and meal bundle credits (`0..50`) are strictly bounded numeric values and cannot be modified by another user.
3. **Order Ownership & Terminal Locking**: Orders (`/orders/{orderId}`) must bind `customerUid == request.auth.uid` on creation with server timestamp `createdAt == request.time`. Once `status == 'delivered'` (`stage == 3`), the order is terminally locked against further updates.
4. **Delivered Order Privacy**: Historical delivered orders are readable/listable strictly by the customer or assigned runner; only active in-flight orders (`status in ['queued', 'preparing', 'ready', 'picked_up', 'en_route']`) are queryable by the Kitchen Queue and Student Runner board, and order documents store no email/phone PII.
5. **Group Batch Master Gate**: Items inside `/groupBatches/{batchId}/items/{itemId}` require the parent `/groupBatches/{batchId}` document to exist with `status == 'open'`, and only the item's `participantUid == request.auth.uid` (or batch host while open) can mutate/remove their item.
6. **Strict Schema & ID Hardening**: All document IDs match `^[a-zA-Z0-9_-]+$` (`<= 128` chars), every string has `.size()` bounds, every array has `.size()` bounds, and every create/update validates allowed keys via `hasAll`/`hasOnly` and `affectedKeys().hasOnly()`.

## 2. Adversarial "Dirty Dozen" Payloads (Expected: PERMISSION_DENIED)
1. **Shadow Field Injection on Profile Create**: `{ ...validUser, isAdmin: true }` -> Blocked by `keys().hasOnly(...)`.
2. **Cross-User Profile Read/Write**: Signed-in user `uid_A` attempting `get/update /users/uid_B` -> Blocked by `isOwner(userId)`.
3. **Unverified Email Write**: Account with `email_verified: false` attempting `create /orders/QB-999` -> Blocked by `isVerifiedSignedIn()`.
4. **Wallet Overflow Attack**: `{ walletBalance: 99999999 }` -> Blocked by range check `<= 50000`.
5. **Identity Spoofing on Order Create**: `uid_A` creating `/orders/QB-100` with `customerUid: "uid_B"` -> Blocked by `data.customerUid == request.auth.uid`.
6. **Client-Forged Timestamp**: `{ ...validOrder, createdAt: "2020-01-01T00:00:00Z" }` -> Blocked by `data.createdAt == request.time`.
7. **Post-Delivery Order Tampering**: Updating `total` or `status` on an order where `existing().status == 'delivered'` -> Blocked by terminal state lock.
8. **Runner Hijack**: Second runner attempting to overwrite `runnerUid` when `existing().runnerUid != ""` -> Blocked by `existing().runnerUid == ''`.
9. **Delivered Order Scraping**: `uid_C` running `list /orders` expecting delivered orders belonging to `uid_A` -> Blocked by `allow list` `resource.data` constraint.
10. **ID Poisoning**: Creating `/orders/../../admin/hack` or 1.5KB ID -> Blocked by `isValidId(orderId)`.
11. **Writing to Closed Group Batch**: Adding `/groupBatches/batch-1/items/item-9` when `groupBatches/batch-1.status == 'placed'` -> Blocked by Master Gate `get()` check.
12. **Mutating Another Student's Group Cart Item**: `uid_B` updating/deleting `/groupBatches/batch-1/items/item_of_uid_A` -> Blocked by `existing().participantUid == request.auth.uid`.
