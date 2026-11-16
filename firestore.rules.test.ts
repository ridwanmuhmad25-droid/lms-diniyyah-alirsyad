/**
 * Firestore Security Rules Verification Matrix (Dirty Dozen Adversarial Suite)
 * Run with @firebase/rules-unit-testing when Firebase Emulator is active.
 */

export const DIRTY_DOZEN_CASES = [
  {
    name: '1. Email Spoofing Admin (unverified email)',
    collection: 'admins',
    auth: { uid: 'spoof-uid', token: { email: 'ridwanmuhmad25@gmail.com', email_verified: false } },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '2. Self-Assigned Role Escalation in /users',
    collection: 'users',
    auth: { uid: 'student-1', token: { email_verified: false } },
    payload: { uid: 'student-1', role: 'guru', nama: 'Attacker' },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '3. Ghost Field Injection in /jilidProgress',
    collection: 'jilidProgress',
    payload: { bookId: 'jilid-1', studentNis: '231001', uid: 'student-1', lastPageRead: 2, totalPages: 5, ghostField: true },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '4. UID Spoofing on /jilidProgress',
    collection: 'jilidProgress',
    auth: { uid: 'student-1' },
    payload: { bookId: 'jilid-1', studentNis: '231002', uid: 'student-2', lastPageRead: 3, totalPages: 5 },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '5. Cross-Student Record Scrape on /jilidProgress',
    collection: 'jilidProgress',
    auth: { uid: 'student-1' },
    queryTargetUid: 'student-2',
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '6. Orphaned Progress Write referencing non-existent bookId',
    collection: 'jilidProgress',
    payload: { bookId: 'non-existent-book', studentNis: '231001', uid: 'student-1', lastPageRead: 1, totalPages: 5 },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '7. ID Poisoning on /jilidBooks',
    collection: 'jilidBooks',
    docId: 'bad$id!with/invalid/chars',
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '8. Client-Forged Timestamp on /jilidProgress',
    collection: 'jilidProgress',
    payload: { serverUpdatedAt: '2099-01-01T00:00:00Z' },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '9. Unauthorized Curriculum Delete by Student',
    collection: 'jilidBooks',
    auth: { uid: 'student-1' },
    operation: 'delete',
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '10. Immutable NIS Tampering on /students',
    collection: 'students',
    auth: { uid: 'student-1' },
    payload: { nis: '999999', kelas: 'XII RPL' },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '11. Oversized Payload (Denial of Wallet) on /jilidBooks',
    collection: 'jilidBooks',
    payload: { judul: 'A'.repeat(200) },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '12. Blanket User Scrape on /users',
    collection: 'users',
    auth: { uid: 'student-1' },
    operation: 'list',
    expected: 'PERMISSION_DENIED',
  },
];
