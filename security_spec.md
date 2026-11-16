# Firestore Security Specification — LMS Mapel Diniyyah

## 1. Data Invariants
1. **Verified Admin Boundary**: Only `ridwanmuhmad25@gmail.com` with `email_verified == true` (or a pre-registered `/admins/{uid}` document created by that verified account) holds Guru/Admin privileges.
2. **No Self-Escalation**: A user creating or updating `/users/{uid}` cannot set `role` to `'guru'` unless `isAdmin()`.
3. **Roster Ownership**: Students in `/students/{nis}` can only claim an unclaimed record (`!('uid' in resource.data)`) with their own `request.auth.uid`, and can only modify `usingDefaultPassword` on their own claimed record.
4. **Private Tracking Isolation**: Documents in `/readRecords`, `/submissions`, `/tahfidzRecords`, and `/jilidProgress` can only be listed or read by the owning student (`uid == request.auth.uid` / `studentUid == request.auth.uid`) or `isAdmin()`.
5. **Referential Integrity**: `/readRecords` and `/submissions` require the referenced `/learningItems/{itemId}` to exist; `/jilidProgress` requires the referenced `/jilidBooks/{bookId}` to exist.
6. **Temporal Integrity**: All server timestamps (`createdAt` on `/admins`, `updatedAt`, `serverUpdatedAt`) must strictly equal `request.time`.

## 2. The "Dirty Dozen" Adversarial Payloads (Must Return PERMISSION_DENIED)
1. **Email Spoofing Admin**: Unverified token `{ email: "ridwanmuhmad25@gmail.com", email_verified: false }` trying to write `/admins/{uid}` or `/learningItems/x`.
2. **Self-Assigned Role Escalation**: Non-admin creating `/users/{uid}` with `{ uid, role: "guru", nama: "Hacker", updatedAt: serverTimestamp() }`.
3. **Ghost Field Injection (Shadow Update)**: Updating `/jilidProgress/{id}` with `{ lastPageRead: 2, totalPages: 5, updatedAt: "...", serverUpdatedAt: serverTimestamp(), adminBypass: true }`.
4. **UID Spoofing on Progress**: Student A (`uidA`) creating `/jilidProgress/jilid-1__241002` with `uid: "uidB"`.
5. **Cross-Student Record Hijack**: Student A attempting `list` or `get` on `/jilidProgress` where `uid == "uidB"`.
6. **Orphaned Progress Write**: Creating `/jilidProgress/fake__241001` referencing non-existent `bookId: "non-existent-book"`.
7. **ID Poisoning**: Creating `/jilidBooks/bad$id/with/chars` or >128 char ID failing `isValidId()`.
8. **Client-Forged Timestamp**: Writing `/jilidProgress/{id}` with `serverUpdatedAt: new Date("2099-01-01")` instead of `request.time`.
9. **Unauthorized Curriculum Delete**: Student attempting `delete` on `/jilidBooks/jilid-1` or `/learningItems/item-x-1`.
10. **Immutable NIS Tampering**: Student updating `/students/241001` to change `nis` or `kelas`.
11. **Oversized Payload (Denial of Wallet)**: Writing `judul` > 150 chars or `pages` list > 120 items on `/jilidBooks`.
12. **Blanket User Scrape**: Non-admin running `list` on `/users` or `/students`.
