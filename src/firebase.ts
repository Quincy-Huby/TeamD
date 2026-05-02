import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  initializeAuth,
  browserLocalPersistence,
  browserPopupRedirectResolver,
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail, 
  updateProfile 
} from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence, doc, getDocFromServer, getDoc, setDoc, updateDoc, addDoc, collection, query, where, getDocs, orderBy, serverTimestamp, onSnapshot, or, deleteDoc } from 'firebase/firestore';

// Importação opcional do config (evita erro no Vercel se o arquivo não existir)
const configs = import.meta.glob('../firebase-applet-config.json', { eager: true });
const localConfig = configs['../firebase-applet-config.json'] ? (configs['../firebase-applet-config.json'] as any).default || configs['../firebase-applet-config.json'] : {};

// Mescla o config do arquivo com possíveis variáveis de ambiente (Vercel)
const firebaseConfig = {
  apiKey: (import.meta.env.VITE_FIREBASE_API_KEY as string) || localConfig.apiKey || "",
  authDomain: (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string) || localConfig.authDomain || "",
  projectId: (import.meta.env.VITE_FIREBASE_PROJECT_ID as string) || localConfig.projectId || "",
  storageBucket: (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string) || localConfig.storageBucket || "",
  messagingSenderId: (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string) || localConfig.messagingSenderId || "",
  appId: (import.meta.env.VITE_FIREBASE_APP_ID as string) || localConfig.appId || "",
  firestoreDatabaseId: (import.meta.env.VITE_FIREBASE_DATABASE_ID as string) || localConfig.firestoreDatabaseId || "(default)"
};

console.log("Firebase Config Initialization:", {
  hasApiKey: !!firebaseConfig.apiKey,
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  source: (import.meta.env.VITE_FIREBASE_API_KEY) ? "Env Vars" : (localConfig.apiKey ? "Local Config" : "None")
});

let app, db: any, auth: any, googleProvider: any;
let isFirebaseConfigured = false;

try {
  if (!firebaseConfig.apiKey) {
    throw new Error("Chaves do Firebase ausentes. Verifique suas variáveis de ambiente no Vercel ou o arquivo firebase-applet-config.json.");
  }
  
  app = initializeApp(firebaseConfig);
  db = getFirestore(app, firebaseConfig.firestoreDatabaseId || "(default)");

  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code == 'failed-precondition') {
        console.warn("Multiple tabs open, persistence can only be enabled in one tab at a a time.");
    } else if (err.code == 'unimplemented') {
        console.warn("The current browser does not support all of the features required to enable persistence");
    }
  });

  // Use initializeAuth for better control over persistence and resolvers, especially in iframes
  try {
    auth = initializeAuth(app, {
      persistence: browserLocalPersistence,
      popupRedirectResolver: browserPopupRedirectResolver,
    });
  } catch (e) {
    // If already initialized, just get it
    auth = getAuth(app);
  }

  googleProvider = new GoogleAuthProvider();
  // Optional: suggest account selection to avoid auth/invalid-credential if multiple accounts are messy
  googleProvider.setCustomParameters({ prompt: 'select_account' });
  
  isFirebaseConfigured = true;
} catch (error) {
  console.error("FIREBASE INIT ERROR:", error);
}

export { app, db, auth, googleProvider, isFirebaseConfigured };

export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

export { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, updateProfile, doc, getDoc, setDoc, updateDoc, addDoc, collection, query, where, getDocs, orderBy, serverTimestamp, onSnapshot, or, deleteDoc };
export const logout = () => signOut(auth);

export interface FirestoreErrorInfo {
  error: string;
  operationType: 'create' | 'update' | 'delete' | 'list' | 'get' | 'write';
  path: string | null;
  authInfo: {
    userId: string;
    email: string;
    emailVerified: boolean;
    isAnonymous: boolean;
    providerInfo: { providerId: string; displayName: string; email: string; }[];
  }
}

export function handleFirestoreError(error: any, operationType: FirestoreErrorInfo['operationType'], path: string | null = null) {
  const user = auth.currentUser;
  
  if (error?.code === 'permission-denied' || error?.message?.includes('Missing or insufficient permissions')) {
    const errorInfo: FirestoreErrorInfo = {
      error: error.message,
      operationType,
      path,
      authInfo: {
        userId: user?.uid || 'unauthenticated',
        email: user?.email || '',
        emailVerified: user?.emailVerified || false,
        isAnonymous: user?.isAnonymous || false,
        providerInfo: user?.providerData.map(p => ({
          providerId: p.providerId,
          displayName: p.displayName || '',
          email: p.email || ''
        })) || []
      }
    };
    throw new Error(JSON.stringify(errorInfo));
  }
  
  throw error;
}
