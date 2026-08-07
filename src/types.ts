export type Role = 'client' | 'admin';

export interface User {
  id: string;
  cedula: string;
  email: string;
  name: string;
  role: Role;
  cpfOrClabe: string;
  avatar?: string;
  status: 'active' | 'blocked' | 'pending';
  pin: string; // password/NIP
  balance: number;
  creditLimit: number;
  creditUsed: number;
  accountNumber: string;
  clabe: string;
  createdAt: string;
  phone?: string;
  loanQuota?: number;
  loanQuotasTotal?: number;
  dailyInterestRate?: number;
  paymentTermDays?: number;
}

export interface BankCard {
  id: string;
  userId: string;
  type: 'virtual' | 'physical';
  cardNumber: string;
  cardHolder: string;
  expiry: string;
  cvv: string;
  isFrozen: boolean;
  limit: number;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'transfer_out' | 'transfer_in' | 'card_purchase' | 'cajita_deposit' | 'cajita_withdraw' | 'loan_payout';
  amount: number;
  description: string;
  recipientName?: string;
  recipientBank?: string;
  recipientClabe?: string;
  category: 'Comida' | 'Servicios' | 'Transferencia' | 'Inversión' | 'Compras' | 'Entretenimiento';
  status: 'completed' | 'pending' | 'flagged' | 'rejected';
  date: string;
}

export interface Cajita {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  yieldRate: number; // e.g. 15.0 for 15%
  icon: string;
  createdAt: string;
}

export interface LoanRequest {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  months: number;
  monthlyPayment: number;
  purpose: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
}

export interface CaptchaLog {
  id: string;
  timestamp: string;
  ipAddress: string;
  type: 'code' | 'math' | 'slider';
  success: boolean;
  attempts: number;
  userEmail?: string;
}

export interface SecuritySettings {
  captchaType: 'code' | 'math' | 'slider';
  captchaRequired: boolean;
  maxLoginAttempts: number;
  requirePin2FA: boolean;
}
