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
    phone: '3000000000'
  }
];

export const INITIAL_CARDS: BankCard[] = [];

export const INITIAL_TRANSACTIONS: Transaction[] = [];

export const INITIAL_CAJITAS: Cajita[] = [];

export const INITIAL_LOANS: LoanRequest[] = [];

export const INITIAL_CAPTCHA_LOGS: CaptchaLog[] = [];

export const INITIAL_SECURITY_SETTINGS: SecuritySettings = {
  captchaType: 'code',
  captchaRequired: true,
  maxLoginAttempts: 3,
  requirePin2FA: false
};

