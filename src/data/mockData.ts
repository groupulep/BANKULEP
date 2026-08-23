import { User, BankCard, Transaction, Cajita, LoanRequest, CaptchaLog, SecuritySettings } from '../types';

export const INITIAL_USERS: User[] = [
  {
    id: 'usr_admin_1',
    cedula: '902050377',
    email: 'admin@crediulep.com',
    name: 'Administrador GROUP ULEP',
    role: 'admin',
    cpfOrClabe: 'ADM-902050377',
    status: 'active',
    pin: '902050377.Ff',
    balance: 0,
    creditLimit: 0,
    creditUsed: 0,
    accountNumber: 'ADM-0001',
    clabe: '000000000000000000',
    createdAt: '2026-01-01',
    phone: '3169008561'
  },
  {
    id: 'usr_client_111',
    cedula: '111',
    email: 'carlos.gomez@crediulep.com',
    name: 'Carlos Andrés Gómez',
    role: 'client',
    cpfOrClabe: 'CLI-111',
    status: 'active',
    pin: '111',
    balance: 2500000,
    creditLimit: 6000000,
    creditUsed: 1250000,
    loanQuota: 350000,
    loanQuotasTotal: 12,
    dailyInterestRate: 0.05,
    paymentTermDays: 30,
    accountNumber: 'ULEP-111',
    clabe: '111000111222333444',
    createdAt: '2026-02-01',
    phone: '3110001111'
  },
  {
    id: 'usr_client_222',
    cedula: '222',
    email: 'maria.lopez@crediulep.com',
    name: 'María Fernanda López',
    role: 'client',
    cpfOrClabe: 'CLI-222',
    status: 'blocked',
    pin: '222',
    balance: 0,
    creditLimit: 0,
    creditUsed: 0,
    loanQuota: 0,
    loanQuotasTotal: 0,
    dailyInterestRate: 0,
    paymentTermDays: 0,
    accountNumber: 'ULEP-222',
    clabe: '222000222333444555',
    createdAt: '2026-01-15',
    phone: '3220002222'
  },
  {
    id: 'usr_client_333',
    cedula: '333',
    email: 'diego.ramirez@crediulep.com',
    name: 'Diego Alejandro Ramírez',
    role: 'client',
    cpfOrClabe: 'CLI-333',
    status: 'pending',
    pin: '333',
    balance: 150000,
    creditLimit: 5000000,
    creditUsed: 4750000,
    loanQuota: 850000,
    loanQuotasTotal: 12,
    dailyInterestRate: 0.15,
    paymentTermDays: 15,
    accountNumber: 'ULEP-333',
    clabe: '333000333444555666',
    createdAt: '2026-01-10',
    phone: '3330003333'
  }
];

export const INITIAL_CARDS: BankCard[] = [
  {
    id: 'card_111',
    userId: 'usr_client_111',
    type: 'virtual',
    cardNumber: '4111 2222 3333 4111',
    cardHolder: 'Carlos Andrés Gómez',
    expiry: '08/29',
    cvv: '111',
    isFrozen: false,
    limit: 6000000
  },
  {
    id: 'card_333',
    userId: 'usr_client_333',
    type: 'virtual',
    cardNumber: '4333 2222 3333 4333',
    cardHolder: 'Diego Alejandro Ramírez',
    expiry: '05/28',
    cvv: '333',
    isFrozen: true,
    limit: 5000000
  }
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'TX-11101',
    userId: 'usr_client_111',
    type: 'transfer_in',
    amount: 2500000,
    description: 'Desembolso de Crédito Aprobado',
    category: 'Transferencia',
    status: 'completed',
    date: '15/02/2026, 10:30'
  },
  {
    id: 'TX-33301',
    userId: 'usr_client_333',
    type: 'transfer_in',
    amount: 4750000,
    description: 'Desembolso Crédito Personal',
    category: 'Transferencia',
    status: 'completed',
    date: '10/01/2026, 14:20'
  }
];

export const INITIAL_CAJITAS: Cajita[] = [];

export const INITIAL_LOANS: LoanRequest[] = [
  {
    id: 'loan_111',
    userId: 'usr_client_111',
    userName: 'Carlos Andrés Gómez',
    amount: 6000000,
    months: 12,
    monthlyPayment: 350000,
    purpose: 'Crédito de Libre Inversión',
    status: 'approved',
    requestedAt: '2026-02-01'
  },
  {
    id: 'loan_333',
    userId: 'usr_client_333',
    userName: 'Diego Alejandro Ramírez',
    amount: 5000000,
    months: 12,
    monthlyPayment: 850000,
    purpose: 'Crédito Personal',
    status: 'approved',
    requestedAt: '2026-01-10'
  }
];

export const INITIAL_CAPTCHA_LOGS: CaptchaLog[] = [];

export const INITIAL_SECURITY_SETTINGS: SecuritySettings = {
  captchaType: 'code',
  captchaRequired: true,
  maxLoginAttempts: 3,
  requirePin2FA: false
};
