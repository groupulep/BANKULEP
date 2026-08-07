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
  saveUserToFirebase,
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

export default function App() {
  // Load state from LocalStorage or use Defaults
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('nubank_users');
    if (!saved) return INITIAL_USERS;
    try {
      const parsed = JSON.parse(saved) as User[];
      // Filter out legacy demo mock clients
      const realUsers = parsed.filter(
        (u) => u.id !== 'usr_client_1' && u.id !== 'usr_client_2' && u.id !== 'usr_client_3'
      );

      const updatedList = INITIAL_USERS.map((initUser) => {
        const existing = realUsers.find((u) => u.id === initUser.id);
        if (!existing) return initUser;
        return {
          ...existing,
          name: initUser.name,
          cedula: initUser.cedula,
          email: initUser.email,
          pin: initUser.pin,
          role: 'admin' as const,
          status: 'active' as const
        };
      });

      realUsers.forEach((pUser) => {
        if (!updatedList.some((u) => u.id === pUser.id)) {
          updatedList.push(pUser);
        }
      });

      return updatedList;
    } catch {
      return INITIAL_USERS;
    }
  });

  const [cards, setCards] = useState<BankCard[]>(() => {
    const saved = localStorage.getItem('nubank_cards');
    return saved ? JSON.parse(saved) : INITIAL_CARDS;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('nubank_transactions');
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  const [cajitas, setCajitas] = useState<Cajita[]>(() => {
    const saved = localStorage.getItem('nubank_cajitas');
    return saved ? JSON.parse(saved) : INITIAL_CAJITAS;
  });

  const [loans, setLoans] = useState<LoanRequest[]>(() => {
    const saved = localStorage.getItem('nubank_loans');
    return saved ? JSON.parse(saved) : INITIAL_LOANS;
  });

  const [captchaLogs, setCaptchaLogs] = useState<CaptchaLog[]>(() => {
    const saved = localStorage.getItem('nubank_captcha_logs');
    return saved ? JSON.parse(saved) : INITIAL_CAPTCHA_LOGS;
  });

  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>(() => {
    const saved = localStorage.getItem('nubank_security');
    return saved ? JSON.parse(saved) : INITIAL_SECURITY_SETTINGS;
  });

  const [adminCapital, setAdminCapital] = useState<number>(() => {
    const saved = localStorage.getItem('nubank_admin_capital');
    return saved ? JSON.parse(saved) : 250000000;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Initial Sync to Firebase on boot
  useEffect(() => {
    users.forEach((u) => saveUserToFirebase(u));
    captchaLogs.forEach((l) => saveCaptchaLogToFirebase(l));
    cards.forEach((c) => saveCardToFirebase(c));
    cajitas.forEach((cj) => saveCajitaToFirebase(cj));
    saveAdminCapitalToFirebase(adminCapital);
    saveSecuritySettingsToFirebase(securitySettings);
  }, []);

  // Subscribe to Firebase real-time updates
  useEffect(() => {
    const unsubUsers = subscribeUsersFirebase((remoteUsers) => {
      if (remoteUsers.length > 0) {
        setUsers((prev) => {
          const map = new Map<string, User>();
          remoteUsers.forEach((u) => {
            if (u.id === 'usr_admin_1') {
              u = { ...u, name: 'Administrador GROUP ULEP' };
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

  // Sync to LocalStorage & Keep currentUser synced
  useEffect(() => {
    localStorage.setItem('nubank_users', JSON.stringify(users));
    if (currentUser) {
      const fresh = users.find((u) => u.id === currentUser.id);
      if (fresh && fresh.name !== currentUser.name) {
        setCurrentUser(fresh);
      }
    }
  }, [users, currentUser]);

  useEffect(() => {
    localStorage.setItem('nubank_cards', JSON.stringify(cards));
  }, [cards]);

  useEffect(() => {
    localStorage.setItem('nubank_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('nubank_cajitas', JSON.stringify(cajitas));
  }, [cajitas]);

  useEffect(() => {
    localStorage.setItem('nubank_loans', JSON.stringify(loans));
  }, [loans]);

  useEffect(() => {
    localStorage.setItem('nubank_captcha_logs', JSON.stringify(captchaLogs));
  }, [captchaLogs]);

  useEffect(() => {
    localStorage.setItem('nubank_security', JSON.stringify(securitySettings));
  }, [securitySettings]);

  useEffect(() => {
    localStorage.setItem('nubank_admin_capital', JSON.stringify(adminCapital));
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
          const updated = { ...u, status: newStatus };
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

          // If approving, credit amount to user balance and subtract from capital
          if (status === 'approved' && l.status === 'pending') {
            const targetUser = users.find((u) => u.id === l.userId);
            if (targetUser) {
              handleUpdateUser({
                ...targetUser,
                balance: targetUser.balance + l.amount
              });

              handleAdjustAdminCapital(-l.amount);

              handleAddTransaction({
                id: `PAYOUT-${Math.floor(100000 + Math.random() * 900000)}`,
                userId: l.userId,
                type: 'loan_payout',
                amount: l.amount,
                description: `Desembolso de Préstamo CrediULEP (${l.months}m)`,
                category: 'Inversión',
                status: 'completed',
                date: new Date().toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })
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
          allUsers={users}
          onSwitchUser={(u) => setCurrentUser(u)}
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
        GROUP ULEP S.A.S © 2026. Sistema con Verificación CAPTCHA y Seguridad Integrada.
      </footer>
    </div>
  );
}
