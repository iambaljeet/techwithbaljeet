import * as admin from 'firebase-admin';

// Prevent multiple initializations in Next.js dev mode
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: 'techwithbaljeet',
    storageBucket: 'techwithbaljeet.firebasestorage.app',
  });
}

export const adminDb = admin.firestore();
export const adminStorage = admin.storage();
export const adminAuth = admin.auth();
