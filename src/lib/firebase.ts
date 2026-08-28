import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  query,
  where,
  writeBatch,
  setLogLevel,
  Firestore
} from 'firebase/firestore';
import { User, BankCard, Transaction, Cajita, LoanRequest, CaptchaLog, SecuritySettings } from '../types';

// Silence verbose connection warnings when offline/local
try {
  setLogLevel('silent');
} catch {
  // Ignore in environments where setLogLevel might not be available
}

export const isFirebaseConfigured = Boolean(
  import.meta.env.VITE_FIREBASE_API_KEY &&
  import.meta.env.VITE_FIREBASE_PROJECT_ID &&
  !import.meta.env.VITE_FIREBASE_API_KEY.includes('Demo') &&
  !import.meta.env.VITE_FIREBASE_API_KEY.includes('your-firebase') &&
  import.meta.env.VITE_FIREBASE_PROJECT_ID !== 'crediulep-app' &&
  import.meta.env.VITE_FIREBASE_PROJECT_ID !== 'your-app'
);

let cachedApp: FirebaseApp | null = null;
let cachedDb: Firestore | null = null;

export const getDb = (): Firestore | null => {
  if (!isFirebaseConfigured) return null;
  try {
    if (!cachedDb) {
      cachedApp = getApps().length > 0
        ? getApp()
        : initializeApp({
            apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
            authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
            projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
            storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
            messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
            appId: import.meta.env.VITE_FIREBASE_APP_ID
          });
      cachedDb = getFirestore(cachedApp);
    }
    return cachedDb;
  } catch (err) {
    return null;
  }
};

// Export db for backwards compatibility if needed, but safe
export const db = isFirebaseConfigured ? getDb() : null;

// Utility to handle error quietly if rules/permission block or offline
const handleFirestoreError = (err: any, _label: string) => {
  if (
    err?.code === 'unavailable' ||
    err?.message?.includes('unavailable') ||
    err?.message?.includes('offline')
  ) {
    // Expected when offline or in standalone local storage mode
    return;
  }
};

// --- USERS ---
export const syncUsersToFirebase = async (users: User[]) => {
  const firestore = getDb();
  if (!firestore) return;
  try {
    const batch = writeBatch(firestore);
    users.forEach((user) => {
      const userRef = doc(firestore, 'users', user.id);
      batch.set(userRef, user, { merge: true });
    });
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, 'syncUsers');
  }
};

export const saveUserToFirebase = async (user: User) => {
  const firestore = getDb();
  if (!firestore) return;
  try {
    await setDoc(doc(firestore, 'users', user.id), user, { merge: true });
  } catch (err) {
    handleFirestoreError(err, 'saveUser');
  }
};

export const deleteUserFromFirebase = async (userId: string) => {
  const firestore = getDb();
  if (!firestore) return;
  try {
    // 1. Delete user document
    await deleteDoc(doc(firestore, 'users', userId));

    // 2. Cascade delete all user's transactions, loans, cards, cajitas from Firestore
    const collectionsToClean = ['transactions', 'loans', 'cards', 'cajitas'];
    for (const colName of collectionsToClean) {
      const q = query(collection(firestore, colName), where('userId', '==', userId));
      const snapshot = await getDocs(q);
      const batch = writeBatch(firestore);
      snapshot.forEach((docSnap) => {
        batch.delete(docSnap.ref);
      });
      if (!snapshot.empty) {
        await batch.commit();
      }
    }
  } catch (err) {
    handleFirestoreError(err, 'deleteUserCascade');
  }
};

export const subscribeUsersFirebase = (onData: (users: User[]) => void) => {
  const firestore = getDb();
  if (!firestore) return () => {};
  try {
    return onSnapshot(
      collection(firestore, 'users'),
      (snapshot) => {
        if (!snapshot.empty) {
          const list: User[] = [];
          snapshot.forEach((d) => list.push(d.data() as User));
          onData(list);
        }
      },
      (err) => handleFirestoreError(err, 'subscribeUsers')
    );
  } catch (err) {
    handleFirestoreError(err, 'subscribeUsersCatch');
    return () => {};
  }
};

// --- CAPTCHA LOGS ---
export const saveCaptchaLogToFirebase = async (log: CaptchaLog) => {
  const firestore = getDb();
  if (!firestore) return;
  try {
    await setDoc(doc(firestore, 'captchaLogs', log.id), log, { merge: true });
  } catch (err) {
    handleFirestoreError(err, 'saveCaptchaLog');
  }
};

export const deleteCaptchaLogFromFirebase = async (logId: string) => {
  const firestore = getDb();
  if (!firestore) return;
  try {
    await deleteDoc(doc(firestore, 'captchaLogs', logId));
  } catch (err) {
    handleFirestoreError(err, 'deleteCaptchaLog');
  }
};

export const subscribeCaptchaLogsFirebase = (onData: (logs: CaptchaLog[]) => void) => {
  const firestore = getDb();
  if (!firestore) return () => {};
  try {
    return onSnapshot(
      collection(firestore, 'captchaLogs'),
      (snapshot) => {
        const list: CaptchaLog[] = [];
        snapshot.forEach((d) => list.push(d.data() as CaptchaLog));
        onData(list);
      },
      (err) => handleFirestoreError(err, 'subscribeCaptchaLogs')
    );
  } catch (err) {
    handleFirestoreError(err, 'subscribeCaptchaLogsCatch');
    return () => {};
  }
};

// --- CAPITAL ---
export const saveAdminCapitalToFirebase = async (capital: number) => {
  const firestore = getDb();
  if (!firestore) return;
  try {
    await setDoc(doc(firestore, 'settings', 'adminCapital'), { amount: capital, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, 'saveAdminCapital');
  }
};

export const subscribeAdminCapitalFirebase = (onData: (amount: number) => void) => {
  const firestore = getDb();
  if (!firestore) return () => {};
  try {
    return onSnapshot(
      doc(firestore, 'settings', 'adminCapital'),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (typeof data.amount === 'number') {
            onData(data.amount);
          }
        }
      },
      (err) => handleFirestoreError(err, 'subscribeAdminCapital')
    );
  } catch (err) {
    handleFirestoreError(err, 'subscribeAdminCapitalCatch');
    return () => {};
  }
};

// --- SECURITY SETTINGS ---
export const saveSecuritySettingsToFirebase = async (settings: SecuritySettings) => {
  const firestore = getDb();
  if (!firestore) return;
  try {
    await setDoc(doc(firestore, 'settings', 'security'), settings, { merge: true });
  } catch (err) {
    handleFirestoreError(err, 'saveSecuritySettings');
  }
};

export const subscribeSecuritySettingsFirebase = (onData: (settings: SecuritySettings) => void) => {
  const firestore = getDb();
  if (!firestore) return () => {};
  try {
    return onSnapshot(
      doc(firestore, 'settings', 'security'),
      (snapshot) => {
        if (snapshot.exists()) {
          onData(snapshot.data() as SecuritySettings);
        }
      },
      (err) => handleFirestoreError(err, 'subscribeSecuritySettings')
    );
  } catch (err) {
    handleFirestoreError(err, 'subscribeSecuritySettingsCatch');
    return () => {};
  }
};

// --- CARDS ---
export const saveCardToFirebase = async (card: BankCard) => {
  const firestore = getDb();
  if (!firestore) return;
  try {
    await setDoc(doc(firestore, 'cards', card.id), card, { merge: true });
  } catch (err) {
    handleFirestoreError(err, 'saveCard');
  }
};

export const subscribeCardsFirebase = (onData: (cards: BankCard[]) => void) => {
  const firestore = getDb();
  if (!firestore) return () => {};
  try {
    return onSnapshot(
      collection(firestore, 'cards'),
      (snapshot) => {
        if (!snapshot.empty) {
          const list: BankCard[] = [];
          snapshot.forEach((d) => list.push(d.data() as BankCard));
          onData(list);
        }
      },
      (err) => handleFirestoreError(err, 'subscribeCards')
    );
  } catch (err) {
    handleFirestoreError(err, 'subscribeCardsCatch');
    return () => {};
  }
};

// --- CAJITAS ---
export const saveCajitaToFirebase = async (cajita: Cajita) => {
  const firestore = getDb();
  if (!firestore) return;
  try {
    await setDoc(doc(firestore, 'cajitas', cajita.id), cajita, { merge: true });
  } catch (err) {
    handleFirestoreError(err, 'saveCajita');
  }
};

export const subscribeCajitasFirebase = (onData: (cajitas: Cajita[]) => void) => {
  const firestore = getDb();
  if (!firestore) return () => {};
  try {
    return onSnapshot(
      collection(firestore, 'cajitas'),
      (snapshot) => {
        if (!snapshot.empty) {
          const list: Cajita[] = [];
          snapshot.forEach((d) => list.push(d.data() as Cajita));
          onData(list);
        }
      },
      (err) => handleFirestoreError(err, 'subscribeCajitas')
    );
  } catch (err) {
    handleFirestoreError(err, 'subscribeCajitasCatch');
    return () => {};
  }
};

export const saveLoanToFirebase = async (loan: LoanRequest) => {
  const firestore = getDb();
  if (!firestore) return;
  try {
    await setDoc(doc(firestore, 'loans', loan.id), loan, { merge: true });
  } catch (err) {
    handleFirestoreError(err, 'saveLoan');
  }
};

export const subscribeLoansFirebase = (onData: (loans: LoanRequest[]) => void) => {
  const firestore = getDb();
  if (!firestore) return () => {};
  try {
    return onSnapshot(
      collection(firestore, 'loans'),
      (snapshot) => {
        if (!snapshot.empty) {
          const list: LoanRequest[] = [];
          snapshot.forEach((d) => list.push(d.data() as LoanRequest));
          onData(list);
        }
      },
      (err) => handleFirestoreError(err, 'subscribeLoans')
    );
  } catch (err) {
    handleFirestoreError(err, 'subscribeLoansCatch');
    return () => {};
  }
};

// --- TRANSACTIONS ---
export const saveTransactionToFirebase = async (tx: Transaction) => {
  const firestore = getDb();
  if (!firestore) return;
  try {
    await setDoc(doc(firestore, 'transactions', tx.id), tx, { merge: true });
  } catch (err) {
    handleFirestoreError(err, 'saveTransaction');
  }
};

export const subscribeTransactionsFirebase = (onData: (txs: Transaction[]) => void) => {
  const firestore = getDb();
  if (!firestore) return () => {};
  try {
    return onSnapshot(
      collection(firestore, 'transactions'),
      (snapshot) => {
        if (!snapshot.empty) {
          const list: Transaction[] = [];
          snapshot.forEach((d) => list.push(d.data() as Transaction));
          onData(list);
        }
      },
      (err) => handleFirestoreError(err, 'subscribeTransactions')
    );
  } catch (err) {
    handleFirestoreError(err, 'subscribeTransactionsCatch');
    return () => {};
  }
};
