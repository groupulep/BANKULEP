import { initializeApp, getApps, getApp } from 'firebase/app';
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
  writeBatch
} from 'firebase/firestore';
import { User, BankCard, Transaction, Cajita, LoanRequest, CaptchaLog, SecuritySettings } from '../types';

// Standard Firebase Config with fallback
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDemoConfigForCrediULEP2026Key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "crediulep-app.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "crediulep-app",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "crediulep-app.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "109876543210",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:109876543210:web:abcdef1234567890"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Utility to handle error quietly if rules/permission block or offline
const handleFirestoreError = (err: any, label: string) => {
  if (err?.code === 'unavailable' || err?.message?.includes('unavailable')) {
    // Expected in offline mode or pre-provisioned demo config
    return;
  }
  console.warn(`[Firebase Firestore ${label} Note]:`, err?.message || err);
};

// --- USERS ---
export const syncUsersToFirebase = async (users: User[]) => {
  try {
    const batch = writeBatch(db);
    users.forEach((user) => {
      const userRef = doc(db, 'users', user.id);
      batch.set(userRef, user, { merge: true });
    });
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, 'syncUsers');
  }
};

export const saveUserToFirebase = async (user: User) => {
  try {
    await setDoc(doc(db, 'users', user.id), user, { merge: true });
  } catch (err) {
    handleFirestoreError(err, 'saveUser');
  }
};

export const deleteUserFromFirebase = async (userId: string) => {
  try {
    // 1. Delete user document
    await deleteDoc(doc(db, 'users', userId));

    // 2. Cascade delete all user's transactions, loans, cards, cajitas from Firestore
    const collectionsToClean = ['transactions', 'loans', 'cards', 'cajitas'];
    for (const colName of collectionsToClean) {
      const q = query(collection(db, colName), where('userId', '==', userId));
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
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
  try {
    return onSnapshot(
      collection(db, 'users'),
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
  try {
    await setDoc(doc(db, 'captchaLogs', log.id), log, { merge: true });
  } catch (err) {
    handleFirestoreError(err, 'saveCaptchaLog');
  }
};

export const deleteCaptchaLogFromFirebase = async (logId: string) => {
  try {
    await deleteDoc(doc(db, 'captchaLogs', logId));
  } catch (err) {
    handleFirestoreError(err, 'deleteCaptchaLog');
  }
};

export const subscribeCaptchaLogsFirebase = (onData: (logs: CaptchaLog[]) => void) => {
  try {
    return onSnapshot(
      collection(db, 'captchaLogs'),
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
  try {
    await setDoc(doc(db, 'settings', 'adminCapital'), { amount: capital, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, 'saveAdminCapital');
  }
};

export const subscribeAdminCapitalFirebase = (onData: (amount: number) => void) => {
  try {
    return onSnapshot(
      doc(db, 'settings', 'adminCapital'),
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
  try {
    await setDoc(doc(db, 'settings', 'security'), settings, { merge: true });
  } catch (err) {
    handleFirestoreError(err, 'saveSecuritySettings');
  }
};

export const subscribeSecuritySettingsFirebase = (onData: (settings: SecuritySettings) => void) => {
  try {
    return onSnapshot(
      doc(db, 'settings', 'security'),
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
  try {
    await setDoc(doc(db, 'cards', card.id), card, { merge: true });
  } catch (err) {
    handleFirestoreError(err, 'saveCard');
  }
};

export const subscribeCardsFirebase = (onData: (cards: BankCard[]) => void) => {
  try {
    return onSnapshot(
      collection(db, 'cards'),
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
  try {
    await setDoc(doc(db, 'cajitas', cajita.id), cajita, { merge: true });
  } catch (err) {
    handleFirestoreError(err, 'saveCajita');
  }
};

export const subscribeCajitasFirebase = (onData: (cajitas: Cajita[]) => void) => {
  try {
    return onSnapshot(
      collection(db, 'cajitas'),
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
  try {
    await setDoc(doc(db, 'loans', loan.id), loan, { merge: true });
  } catch (err) {
    handleFirestoreError(err, 'saveLoan');
  }
};

export const subscribeLoansFirebase = (onData: (loans: LoanRequest[]) => void) => {
  try {
    return onSnapshot(
      collection(db, 'loans'),
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
  try {
    await setDoc(doc(db, 'transactions', tx.id), tx, { merge: true });
  } catch (err) {
    handleFirestoreError(err, 'saveTransaction');
  }
};

export const subscribeTransactionsFirebase = (onData: (txs: Transaction[]) => void) => {
  try {
    return onSnapshot(
      collection(db, 'transactions'),
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
