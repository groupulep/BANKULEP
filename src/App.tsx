import React, { useState, useEffect } from 'react';
import { User, BankCard, Transaction, Cajita, LoanRequest, CaptchaLog, SecuritySettings } from './types';
import {
  INITIAL_USERS,
  INITIAL_CARDS,
  INITIAL_TRANSACTIONS,
  INITIAL_CAJITAS,
  INITIAL_LOANS,
  INITIAL_CAPTCHA_LOGS,
  INITIAL_SECURITY_SETTINGS
} from './data/mockData';
import { LoginScreen } from './components/LoginScreen';
import { Navbar } from './components/Navbar';
import { ClientPanel } from './components/ClientPanel';
import { AdminPanel } from './components/AdminPanel';
import {
  isFirebaseConfigured,
  saveUserToFirebase,
  syncUsersToFirebase,
  deleteUserFromFirebase,
  subscribeUsersFirebase,
  saveCaptchaLogToFirebase,
  deleteCaptchaLogFromFirebase,
  subscribeCaptchaLogsFirebase,
  saveAdminCapitalToFirebase,
  subscribeAdminCapitalFirebase,
  saveLoanToFirebase,
  subscribeLoansFirebase,
  saveTransactionToFirebase,
  subscribeTransactionsFirebase,
  saveCardToFirebase,
  subscribeCardsFirebase,
  saveCajitaToFirebase,
  subscribeCajitasFirebase,
  saveSecuritySettingsToFirebase,
  subscribeSecuritySettingsFirebase
} from './lib/firebase';
import { secureStorage } from './lib/crypto';

export default function App() {
  // Load state from Encrypted SecureStorage or use Defaults
  const [users, setUsers] = useState<User[]>(() => {
    const rawUsers = secureStorage.getItem<User[]>('nubank_users', INITIAL_USERS);
    if (!rawUsers || rawUsers.length === 0) return INITIAL_USERS;
    try {
      const updatedList = [...INITIAL_USERS];

      // Merge saved state for users, updating names if needed
      rawUsers.forEach((savedUser) => {
        const index = updatedList.findIndex((u) => u.id === savedUser.id);
        if (index !== -1) {
          // If already in list, merge details preserving credentials
          const cleanName =
            savedUser.name === 'Cliente Activo ULEP' || savedUser.name?.includes('Demo')
              ? updatedList[index].name
              : savedUser.name === 'Cliente Cancelado ULEP'
              ? 'María Fernanda López'
              : savedUser.name === 'Cliente en Mora ULEP'
              ? 'Diego Alejandro Ramírez'
              : savedUser.name || updatedList[index].name;

          updatedList[index] = {
            ...updatedList[index],
            ...savedUser,
            name: cleanName,
            cedula: savedUser.cedula || updatedList[index].cedula,
            pin: savedUser.pin || updatedList[index].pin,
            role: savedUser.role || updatedList[index].role,
            status: savedUser.status || updatedList[index].status
          };
        } else {
          updatedList.push(savedUser);
        }
      });

      return updatedList;
    } catch {
      return INITIAL_USERS;
    }
  });

  const [cards, setCards] = useState<BankCard[]>(() => {
    return secureStorage.getItem<BankCard[]>('nubank_cards', INITIAL_CARDS);
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    return secureStorage.getItem<Transaction[]>('nubank_transactions', INITIAL_TRANSACTIONS);
  });

  const [cajitas, setCajitas] = useState<Cajita[]>(() => {
    return secureStorage.getItem<Cajita[]>('nubank_cajitas', INITIAL_CAJITAS);
  });

  const [loans, setLoans] = useState<LoanRequest[]>(() => {
    return secureStorage.getItem<LoanRequest[]>('nubank_loans', INITIAL_LOANS);
  });

  const [captchaLogs, setCaptchaLogs] = useState<CaptchaLog[]>(() => {
    return secureStorage.getItem<CaptchaLog[]>('nubank_captcha_logs', INITIAL_CAPTCHA_LOGS);
  });

  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>(() => {
    return secureStorage.getItem<SecuritySettings>('nubank_security', INITIAL_SECURITY_SETTINGS);
  });

  const [adminCapital, setAdminCapital] = useState<number>(() => {
    return secureStorage.getItem<number>('nubank_admin_capital', 250000000);
  });

  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Initial Sync to Firebase on boot if configured
  useEffect(() => {
    if (!isFirebaseConfigured) return;
    users.forEach((u) => saveUserToFirebase(u));
    captchaLogs.forEach((l) => saveCaptchaLogToFirebase(l));
    cards.forEach((c) => saveCardToFirebase(c));
    cajitas.forEach((cj) => saveCajitaToFirebase(cj));
    saveAdminCapitalToFirebase(adminCapital);
    saveSecuritySettingsToFirebase(securitySettings);
  }, []);

  // Subscribe to Firebase real-time updates if configured
  useEffect(() => {
    if (!isFirebaseConfigured) return;

    const unsubUsers = subscribeUsersFirebase((remoteUsers) => {
      if (remoteUsers.length > 0) {
        setUsers((prev) => {
          const map = new Map<string, User>();
          remoteUsers.forEach((u) => {
            if (u.id === 'usr_admin_1') {
              u = { ...u, name: 'Administrador GRUPO ULEP' };
            }
            map.set(u.id, u);
          });
          return Array.from(map.values());
        });
      }
    });

    const unsubLogs = subscribeCaptchaLogsFirebase((remoteLogs) => {
      setCaptchaLogs(remoteLogs);
    });

    const unsubCapital = subscribeAdminCapitalFirebase((remoteCap) => {
      setAdminCapital(remoteCap);
    });

    const unsubLoans = subscribeLoansFirebase((remoteLoans) => {
      if (remoteLoans.length > 0) {
        setLoans(remoteLoans);
      }
    });

    const unsubTx = subscribeTransactionsFirebase((remoteTx) => {
      if (remoteTx.length > 0) {
        setTransactions(remoteTx);
      }
    });

    const unsubCards = subscribeCardsFirebase((remoteCards) => {
      if (remoteCards.length > 0) {
        setCards(remoteCards);
      }
    });

    const unsubCajitas = subscribeCajitasFirebase((remoteCajitas) => {
      if (remoteCajitas.length > 0) {
        setCajitas(remoteCajitas);
      }
    });

    const unsubSecurity = subscribeSecuritySettingsFirebase((remoteSec) => {
      if (remoteSec) {
        setSecuritySettings(remoteSec);
      }
    });

    return () => {
      unsubUsers?.();
      unsubLogs?.();
      unsubCapital?.();
      unsubLoans?.();
      unsubTx?.();
      unsubCards?.();
      unsubCajitas?.();
      unsubSecurity?.();
    };
  }, []);

  // Sync to Encrypted SecureStorage & Keep currentUser synced
  useEffect(() => {
    secureStorage.setItem('nubank_users', users);
    if (currentUser) {
      const fresh = users.find((u) => u.id === currentUser.id);
      if (fresh) {
        if (
          fresh.name !== currentUser.name ||
          fresh.balance !== currentUser.balance ||
          fresh.creditLimit !== currentUser.creditLimit ||
          fresh.creditUsed !== currentUser.creditUsed ||
          fresh.status !== currentUser.status ||
          fresh.loanStartDate !== currentUser.loanStartDate ||
          fresh.paymentTermDays !== currentUser.paymentTermDays ||
          fresh.loanPaymentFrequency !== currentUser.loanPaymentFrequency ||
          fresh.loanQuota !== currentUser.loanQuota ||
          fresh.loanQuotasTotal !== currentUser.loanQuotasTotal ||
          fresh.dailyInterestRate !== currentUser.dailyInterestRate ||
          fresh.phone !== currentUser.phone ||
          fresh.address !== currentUser.address ||
          fresh.pin !== currentUser.pin ||
          fresh.clabe !== currentUser.clabe
        ) {
          setCurrentUser(fresh);
        }
      }
    }
  }, [users, currentUser]);

  useEffect(() => {
    secureStorage.setItem('nubank_cards', cards);
  }, [cards]);

  useEffect(() => {
    secureStorage.setItem('nubank_transactions', transactions);
  }, [transactions]);

  useEffect(() => {
    secureStorage.setItem('nubank_cajitas', cajitas);
  }, [cajitas]);

  useEffect(() => {
    secureStorage.setItem('nubank_loans', loans);
  }, [loans]);

  useEffect(() => {
    secureStorage.setItem('nubank_captcha_logs', captchaLogs);
  }, [captchaLogs]);

  useEffect(() => {
    secureStorage.setItem('nubank_security', securitySettings);
  }, [securitySettings]);

  useEffect(() => {
    secureStorage.setItem('nubank_admin_capital', adminCapital);
  }, [adminCapital]);

  const handleAdjustAdminCapital = (delta: number) => {
    setAdminCapital((prev) => {
      const nextCap = Math.max(0, prev + delta);
      saveAdminCapitalToFirebase(nextCap);
      return nextCap;
    });
  };

  const handleUpdateAdminCapital = (newCapital: number) => {
    setAdminCapital(newCapital);
    saveAdminCapitalToFirebase(newCapital);
  };

  // Record Captcha Logs
  const handleRecordCaptchaLog = (log: CaptchaLog) => {
    setCaptchaLogs((prev) => [log, ...prev]);
    saveCaptchaLogToFirebase(log);
  };

  const handleDeleteCaptchaLog = (logId: string) => {
    setCaptchaLogs((prev) => prev.filter((c) => c.id !== logId));
    deleteCaptchaLogFromFirebase(logId);
  };

  // Update single user
  const handleUpdateUser = (updatedUser: User) => {
    setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
    saveUserToFirebase(updatedUser);
    if (currentUser && currentUser.id === updatedUser.id) {
      setCurrentUser(updatedUser);
    }
  };

  // Add new user
  const handleAddUser = (newUser: User) => {
    setUsers((prev) => [...prev, newUser]);
    saveUserToFirebase(newUser);
  };

  // Add or update batch users (bulk upload)
  const handleAddBatchUsers = (newUsers: User[], updateExisting = true) => {
    setUsers((prev) => {
      const map = new Map<string, User>();
      prev.forEach((u) => map.set(u.cedula, u));

      newUsers.forEach((incoming) => {
        const existing = map.get(incoming.cedula);
        if (existing) {
          if (updateExisting) {
            map.set(incoming.cedula, {
              ...existing,
              name: incoming.name || existing.name,
              phone: incoming.phone || existing.phone,
              email: incoming.email || existing.email,
              creditLimit: incoming.creditLimit ?? existing.creditLimit,
              creditUsed: incoming.creditUsed ?? existing.creditUsed,
              balance: incoming.balance ?? existing.balance,
              loanQuota: incoming.loanQuota ?? existing.loanQuota,
              loanQuotasTotal: incoming.loanQuotasTotal ?? existing.loanQuotasTotal,
              dailyInterestRate: incoming.dailyInterestRate ?? existing.dailyInterestRate,
              paymentTermDays: incoming.paymentTermDays ?? existing.paymentTermDays,
              status: incoming.status ?? existing.status,
            });
          }
        } else {
          map.set(incoming.cedula, incoming);
        }
      });

      const updated = Array.from(map.values());
      secureStorage.setItem('nubank_users', updated);
      return updated;
    });

    syncUsersToFirebase(newUsers);
  };

  // Delete user and ALL related client database info
  const handleDeleteUser = (userId: string) => {
    // 1. Remove from state
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    setCards((prev) => prev.filter((c) => c.userId !== userId));
    setTransactions((prev) => prev.filter((t) => t.userId !== userId));
    setCajitas((prev) => prev.filter((cj) => cj.userId !== userId));
    setLoans((prev) => prev.filter((l) => l.userId !== userId));

    // 2. Delete from Firebase
    deleteUserFromFirebase(userId);

    // If deleting currently logged in user, log out
    if (currentUser && currentUser.id === userId) {
      setCurrentUser(null);
    }
  };

  // Toggle freeze card
  const handleToggleFreezeCard = (cardId: string) => {
    setCards((prev) =>
      prev.map((c) => {
        if (c.id === cardId) {
          const updated = { ...c, isFrozen: !c.isFrozen };
          saveCardToFirebase(updated);
          return updated;
        }
        return c;
      })
    );
  };

  // Regenerate virtual card CVV
  const handleRegenerateCvv = (cardId: string) => {
    const newCvv = Math.floor(100 + Math.random() * 900).toString();
    setCards((prev) =>
      prev.map((c) => {
        if (c.id === cardId) {
          const updated = { ...c, cvv: newCvv };
          saveCardToFirebase(updated);
          return updated;
        }
        return c;
      })
    );
  };

  // Add transaction
  const handleAddTransaction = (newTx: Transaction) => {
    setTransactions((prev) => [newTx, ...prev]);
    saveTransactionToFirebase(newTx);
  };

  // Create Cajita
  const handleCreateCajita = (newCajita: Cajita) => {
    setCajitas((prev) => [...prev, newCajita]);
    saveCajitaToFirebase(newCajita);
  };

  // Update Cajita
  const handleUpdateCajita = (updatedCajita: Cajita) => {
    setCajitas((prev) => prev.map((c) => (c.id === updatedCajita.id ? updatedCajita : c)));
    saveCajitaToFirebase(updatedCajita);
  };

  // Request Loan
  const handleRequestLoan = (newLoan: LoanRequest) => {
    setLoans((prev) => [newLoan, ...prev]);
    saveLoanToFirebase(newLoan);
  };

  // Admin: Update User Status (active / blocked / pending)
  const handleUpdateUserStatus = (userId: string, newStatus: 'active' | 'blocked' | 'pending') => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const updated: User = { 
            ...u, 
            status: newStatus,
            creditUsed: newStatus === 'blocked' ? 0 : u.creditUsed
          };
          saveUserToFirebase(updated);
          return updated;
        }
        return u;
      })
    );
  };

  // Admin: Reset User PIN
  const handleResetUserPin = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const updated = { ...u, pin: '1234' };
          saveUserToFirebase(updated);
          return updated;
        }
        return u;
      })
    );
  };

  // Admin: Update Credit Limit
  const handleUpdateCreditLimit = (userId: string, newLimit: number) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const updated = { ...u, creditLimit: newLimit };
          saveUserToFirebase(updated);
          return updated;
        }
        return u;
      })
    );
  };

  // Admin: Approve / Reject Loan
  const handleUpdateLoanStatus = (loanId: string, status: 'approved' | 'rejected') => {
    setLoans((prev) =>
      prev.map((l) => {
        if (l.id === loanId) {
          const updatedLoan = { ...l, status };
          saveLoanToFirebase(updatedLoan);

          // If approving, credit amount to user balance and update credit terms & status
          if (status === 'approved' && l.status === 'pending') {
            const targetUser = users.find((u) => u.id === l.userId);
            if (targetUser) {
              const termDays = l.months === 0.5 ? 15 : (l.months && l.months > 0 ? Math.round(l.months * 30) : 30);
              const freq: 'quincenal' | 'mensual' = termDays <= 15 ? 'quincenal' : 'mensual';
              const newDebt = (targetUser.creditUsed || 0) + l.amount;
              const newCreditLimit = Math.max(targetUser.creditLimit || 0, newDebt, 2000000);
              const daysPerInst = freq === 'quincenal' ? 15 : 30;
              const calculatedInstallments = Math.max(1, Math.round(termDays / daysPerInst));
              const calculatedQuota = l.monthlyPayment && l.monthlyPayment > 0
                ? l.monthlyPayment
                : Math.round(newDebt / calculatedInstallments);

              const now = new Date();
              const year = now.getFullYear();
              const month = String(now.getMonth() + 1).padStart(2, '0');
              const day = String(now.getDate()).padStart(2, '0');
              const formattedDate = `${year}-${month}-${day}`;

              const updatedUser: User = {
                ...targetUser,
                balance: (targetUser.balance || 0) + l.amount,
                creditUsed: newDebt,
                creditLimit: newCreditLimit,
                loanStartDate: formattedDate,
                paymentTermDays: termDays,
                loanPaymentFrequency: freq,
                loanQuota: calculatedQuota,
                loanQuotasTotal: calculatedInstallments,
                status: 'active'
              };

              handleUpdateUser(updatedUser);
              handleAdjustAdminCapital(-l.amount);

              handleAddTransaction({
                id: `PAYOUT-${Math.floor(100000 + Math.random() * 900000)}`,
                userId: l.userId,
                type: 'loan_payout',
                amount: l.amount,
                description: `Desembolso de Préstamo CrediULEP (${termDays}d)`,
                category: 'Inversión',
                status: 'completed',
                date: new Date().toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })
              });
            }
          }
          return updatedLoan;
        }
        return l;
      })
    );
  };

  if (!currentUser) {
    return (
      <LoginScreen
        users={users}
        onLoginSuccess={(u) => setCurrentUser(u)}
        onRecordCaptchaLog={handleRecordCaptchaLog}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900 flex flex-col justify-between">
      <div>
        <Navbar
          currentUser={currentUser}
          onLogout={() => setCurrentUser(null)}
        />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          {currentUser.role === 'client' ? (
            <ClientPanel
              user={currentUser}
              cards={cards}
              transactions={transactions}
              cajitas={cajitas}
              loans={loans}
              onUpdateUser={handleUpdateUser}
              onToggleFreezeCard={handleToggleFreezeCard}
              onRegenerateCvv={handleRegenerateCvv}
              onAddTransaction={handleAddTransaction}
              onCreateCajita={handleCreateCajita}
              onUpdateCajita={handleUpdateCajita}
              onRequestLoan={handleRequestLoan}
              onAdjustAdminCapital={handleAdjustAdminCapital}
            />
          ) : (
            <AdminPanel
              users={users}
              transactions={transactions}
              loans={loans}
              captchaLogs={captchaLogs}
              securitySettings={securitySettings}
              adminCapital={adminCapital}
              onUpdateAdminCapital={(val) => setAdminCapital(val)}
              onUpdateUser={handleUpdateUser}
              onAddUser={handleAddUser}
              onAddBatchUsers={handleAddBatchUsers}
              onDeleteUser={handleDeleteUser}
              onDeleteCaptchaLog={handleDeleteCaptchaLog}
              onUpdateUserStatus={handleUpdateUserStatus}
              onResetUserPin={handleResetUserPin}
              onUpdateCreditLimit={handleUpdateCreditLimit}
              onUpdateLoanStatus={handleUpdateLoanStatus}
              onUpdateSecuritySettings={(st) => {
                setSecuritySettings(st);
                saveSecuritySettingsToFirebase(st);
              }}
              onAddTransaction={handleAddTransaction}
              onAdjustAdminCapital={handleAdjustAdminCapital}
            />
          )}
        </main>
      </div>

      <footer className="bg-white border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-500 font-medium">
        GRUPO ULEP S.A.S © 2026. Sistema con Verificación CAPTCHA y Seguridad Integrada.
      </footer>
    </div>
  );
}
