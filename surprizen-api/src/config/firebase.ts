import * as admin from 'firebase-admin';
import dotenv from 'dotenv';
import serviceAccount from './serviceAccount.json';

// Load environment variables
dotenv.config();

// Initialize Firebase Admin SDK
let firebaseApp: admin.app.App;

console.log('Initializing Firebase Admin SDK with service account file...');

try {
  // Check if Firebase Admin SDK is already initialized
  firebaseApp = admin.app();
  console.log('Firebase Admin SDK already initialized');
} catch (error) {
  try {
    // Initialize with service account file
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL || `https://${serviceAccount.project_id}-default-rtdb.firebaseio.com`,
    });
    
    console.log('Firebase Admin SDK initialized successfully with service account file');
  } catch (initError) {
    console.error('Error initializing Firebase Admin SDK:', initError);
    throw initError;
  }
}

// Export Firebase Admin SDK services
export const auth = admin.auth(firebaseApp);
export const firestore = admin.firestore(firebaseApp);

export default firebaseApp;