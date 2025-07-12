
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// Check for the essential service account environment variables.
if (
  !process.env.FIREBASE_PROJECT_ID ||
  !process.env.FIREBASE_CLIENT_EMAIL ||
  !process.env.FIREBASE_PRIVATE_KEY
) {
  // If the env vars aren't set, we can't proceed.
  // This is a common issue, so we provide a helpful error message.
  throw new Error(
    'Required Firebase Admin environment variables are not set. Please set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in your .env file.'
  );
}

// The private_key from .env might have escaped newlines (\\n) which need to be
// converted to actual newlines (\n) for the Firebase Admin SDK.
const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: privateKey,
};

/**
 * A singleton pattern to get or initialize the Firebase Admin app.
 * This prevents re-initialization errors in hot-reloading development environments.
 */
function getAdminApp() {
  if (getApps().length > 0) {
    return getApps()[0];
  }
  
  const credential = cert(serviceAccount);
  
  return initializeApp({
    credential,
  });
}

const adminApp = getAdminApp();
const db = getFirestore(adminApp);
const adminAuth = getAuth(adminApp);

export { adminApp, db, adminAuth };
