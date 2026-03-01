import admin from 'firebase-admin';

function initAdmin() {
  if (!admin.apps.length) {
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
    if (!privateKey) {
      console.error('FIREBASE_ADMIN_PRIVATE_KEY is not set');
      return;
    }
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
    });
  }
}

export function getAdminAuth() {
  initAdmin();
  return admin.auth();
}

export function getAdminDb() {
  initAdmin();
  return admin.firestore();
}

export default admin;
