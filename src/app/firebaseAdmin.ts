import admin from 'firebase-admin';

// Configuration du compte de service Firebase Admin
const serviceAccount = {
  project_id: process.env.FIREBASE_ADMIN_PROJECT_ID,
  private_key_id: process.env.FIREBASE_ADMIN_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_ADMIN_CLIENT_ID,
  auth_uri: process.env.FIREBASE_ADMIN_AUTH_URI,
  token_uri: process.env.FIREBASE_ADMIN_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_ADMIN_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_ADMIN_CLIENT_X509_CERT_URL,
};

// Initialisation de l'app Firebase Admin si elle n'est pas déjà faite
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET, // Ajoutez votre bucket Firebase Storage
  });
}

// Initialisation des services Firebase Admin
export const authAdmin = admin.auth();
export const firestoreAdmin = admin.firestore();
export const storageAdmin = admin.storage(); // Nouvelle ligne pour initialiser Firebase Storage
export const FieldValue = admin.firestore.FieldValue;
export const FieldPath = admin.firestore.FieldPath;

// Fonction pour obtenir le rôle d'un utilisateur depuis Firestore
export async function getUserRole(uid: string): Promise<string | null> {
  const userDoc = await firestoreAdmin.collection('users').doc(uid).get();
  if (userDoc.exists) {
    return userDoc.data()?.role ?? null;
  }
  return null;
}
