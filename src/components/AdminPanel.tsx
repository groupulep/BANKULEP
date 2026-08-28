import React, { useState } from 'react';
import { User, Transaction, LoanRequest, CaptchaLog, SecuritySettings } from '../types';
import {
  Users,
  ShieldCheck,
  Search,
  CheckCircle2,
  DollarSign,
  Lock,
  AlertTriangle,
  CreditCard,
  Percent,
  Clock,
  X,
  Save,
  UserPlus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Check,
  SlidersHorizontal,
  Wallet,
  ArrowUpRight,
  Filter,
  RefreshCw,
  FileSpreadsheet,
  Download,
  Upload,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Info
} from 'lucide-react';
import { exportClientsToExcel, downloadBulkUploadTemplate } from '../utils/excelHelper';
import { BulkUploadModal } from './BulkUploadModal';
import { calculateCreditStatus, formatInputDate, formatReadableDate } from '../lib/creditCalculations';

interface AdminPanelProps {
  users: User[];
  transactions: Transaction[];
  loans: LoanRequest[];
  captchaLogs: CaptchaLog[];
  securitySettings: SecuritySettings;
  adminCapital: number;
  onUpdateAdminCapital: (newCapital: number) => void;
  onUpdateUser: (updatedUser: User) => void;
  onAddUser: (newUser: User) => void;
  onAddBatchUsers?: (newUsers: User[], updateExisting?: boolean) => void;
  onDeleteUser: (userId: string) => void;
  onDeleteCaptchaLog: (logId: string) => void;
  onUpdateUserStatus: (userId: string, newStatus: 'active' | 'blocked' | 'pending') => void;
  onResetUserPin: (userId: string) => void;
  onUpdateCreditLimit: (userId: string, newLimit: number) => void;
  onUpdateLoanStatus: (loanId: string, status: 'approved' | 'rejected') => void;
  onUpdateSecuritySettings: (settings: SecuritySettings) => void;
  onAddTransaction?: (tx: Transaction) => void;
  onAdjustAdminCapital?: (delta: number) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  users,
  captchaLogs,
  securitySettings,
  adminCapital,
  onUpdateAdminCapital,
  onUpdateUser,
  onAddUser,
  onAddBatchUsers,
  onDeleteUser,
  onDeleteCaptchaLog,
  onUpdateSecuritySettings,
  onAddTransaction,
  onAdjustAdminCapital,
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'payments' | 'captcha'>('users');
  const [userSearch, setUserSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [debtFilter, setDebtFilter] = useState<'all' | 'with_debt' | 'no_debt'>('all');
  const [expandedUserIds, setExpandedUserIds] = useState<Record<string, boolean>>({});
  const [customPaymentAmounts, setCustomPaymentAmounts] = useState<Record<string, string>>({});
  const [paymentNotice, setPaymentNotice] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deleteNotice, setDeleteNotice] = useState<string | null>(null);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [bulkSuccessNotice, setBulkSuccessNotice] = useState<string | null>(null);

  // Capital Editing Modal State
  const [isEditingCapital, setIsEditingCapital] = useState(false);
  const [capitalInputValue, setCapitalInputValue] = useState(adminCapital.toString());

  // Add User Modal State
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [addFormData, setAddFormData] = useState({
    name: '',
    cedula: '',
    email: '',
    phone: '3169008561',
    address: '',
    balance: 0,
    creditLimit: 2000000,
    creditUsed: 1000000,
    loanStartDate: formatInputDate(new Date()),
    paymentTermDays: 30,
    loanPaymentFrequency: 'quincenal' as 'quincenal' | 'mensual',
    clabe: '',
    pin: '1234',
    dailyInterestRate: 0.05,
  });

  // Single Edit Modal State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editTab, setEditTab] = useState<'credit' | 'schedule' | 'personal'>('credit');
  const [formData, setFormData] = useState({
    name: '',
    cedula: '',
    email: '',
    phone: '',
    address: '',
    clabe: '',
    pin: '',
    balance: 0,
    creditLimit: 0,
    creditUsed: 0,
    loanStartDate: '',
    paymentTermDays: 30,
    loanPaymentFrequency: 'quincenal' as 'quincenal' | 'mensual',
    dailyInterestRate: 0.05,
  });

  const toggleExpandUser = (userId: string) => {
    setExpandedUserIds((prev) => ({ ...prev, [userId]: !prev[userId] }));
  };

  const handleConfirmDeleteUser = () => {
    if (!userToDelete) return;
    const deletedName = userToDelete.name;
    const deletedId = userToDelete.id;
    onDeleteUser(deletedId);
    if (editingUser && editingUser.id === deletedId) {
      setEditingUser(null);
    }
    setUserToDelete(null);
    setDeleteNotice(`El cliente "${deletedName}" fue eliminado exitosamente del sistema.`);
    setTimeout(() => {
      setDeleteNotice(null);
    }, 4000);
  };

  const handleMarkPaymentAsPaid = (u: User, type: 'cuota' | 'total' | 'custom', amountToPay?: number) => {
    const statusInfo = calculateCreditStatus(u);
    const cuotaAmount = statusInfo.installmentAmount > 0 ? statusInfo.installmentAmount : Math.min(u.creditUsed, 1250000);
    const payAmount =
      type === 'total'
        ? u.creditUsed
        : amountToPay !== undefined
        ? amountToPay
        : Math.min(u.creditUsed, cuotaAmount);

    if (payAmount <= 0) {
      setPaymentNotice(`El monto a pagar debe ser mayor a 0.`);
      setTimeout(() => setPaymentNotice(null), 4000);
      return;
    }

    if (payAmount > u.creditUsed) {
      setPaymentNotice(`El monto ($${payAmount.toLocaleString('es-CO')} COP) supera la deuda del cliente ($${u.creditUsed.toLocaleString('es-CO')} COP).`);
      setTimeout(() => setPaymentNotice(null), 4000);
      return;
    }

    const newCreditUsed = Math.max(0, u.creditUsed - payAmount);
    const updatedUser: User = {
      ...u,
      creditUsed: newCreditUsed,
    };

    onUpdateUser(updatedUser);

    if (onAdjustAdminCapital) {
      onAdjustAdminCapital(payAmount);
    } else {
      onUpdateAdminCapital(adminCapital + payAmount);
    }

    if (onAddTransaction) {
      onAddTransaction({
        id: `PAY-ADMIN-${Date.now()}`,
        userId: u.id,
        type: 'transfer_in',
        amount: payAmount,
        description:
          type === 'total'
            ? `Pago Total de Crédito registrado por Admin (${u.name})`
            : type === 'custom'
            ? `Abono Personalizado registrado por Admin (${u.name})`
            : `Pago de Cuota de Crédito registrado por Admin (${u.name})`,
        category: 'Servicios',
        status: 'completed',
        date: new Date().toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' }),
      });
    }

    setPaymentNotice(
      `Pago de ${
        type === 'total' ? 'LIQUIDACIÓN TOTAL' : type === 'custom' ? 'ABONO' : 'CUOTA'
      } registrado para ${u.name} ($${payAmount.toLocaleString('es-CO')} COP).`
    );

    if (type === 'custom') {
      setCustomPaymentAmounts((prev) => ({ ...prev, [u.id]: '' }));
    }

    setTimeout(() => {
      setPaymentNotice(null);
    }, 4000);
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addFormData.name || !addFormData.cedula) return;
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newClabe = addFormData.clabe || `63818000${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    const parsedLimit = Math.min(5000000, Math.max(0, Number(addFormData.creditLimit) || 1000000));
    const parsedDebt = Math.min(parsedLimit, Math.max(0, Number(addFormData.creditUsed) || 0));
    const parsedDays = Number(addFormData.paymentTermDays) || 30;
    const freq = addFormData.loanPaymentFrequency || (parsedDays <= 15 ? 'quincenal' : 'mensual');
    const daysPerInst = freq === 'quincenal' ? 15 : 30;
    const calculatedInstallments = Math.max(1, Math.round(parsedDays / daysPerInst));
    const calculatedQuota = parsedDebt > 0 ? Math.round(parsedDebt / calculatedInstallments) : 0;

    const newUser: User = {
      id: `usr_client_${Date.now()}`,
      name: addFormData.name,
      cedula: addFormData.cedula,
      email: addFormData.email || `cliente_${randomSuffix}@crediulep.com`,
      phone: addFormData.phone || '3169008561',
      address: addFormData.address || '',
      clabe: newClabe,
      cpfOrClabe: newClabe,
      accountNumber: newClabe.slice(-10),
      pin: addFormData.pin || '1234',
      role: 'client',
      balance: Number(addFormData.balance) || 0,
      creditLimit: parsedLimit,
      creditUsed: parsedDebt,
      createdAt: new Date().toISOString().split('T')[0],
      loanStartDate: addFormData.loanStartDate || formatInputDate(new Date()),
      loanPaymentFrequency: freq,
      loanQuota: calculatedQuota,
      loanQuotasTotal: calculatedInstallments,
      dailyInterestRate: Number(addFormData.dailyInterestRate) || 0.05,
      paymentTermDays: parsedDays,
    };

    onAddUser(newUser);
    setIsAddingUser(false);
    setAddFormData({
      name: '',
      cedula: '',
      email: '',
      phone: '3169008561',
      address: '',
      balance: 0,
      creditLimit: 2000000,
      creditUsed: 1000000,
      loanStartDate: formatInputDate(new Date()),
      paymentTermDays: 30,
      loanPaymentFrequency: 'quincenal',
      clabe: '',
      pin: '1234',
      dailyInterestRate: 0.05,
    });
  };

  const openEditModal = (u: User) => {
    setEditingUser(u);
    setEditTab('credit');
    const termDays = u.paymentTermDays || 30;
    const freq = u.loanPaymentFrequency || (termDays <= 15 ? 'quincenal' : 'mensual');
    setFormData({
      name: u.name || '',
      cedula: u.cedula || '',
      email: u.email || '',
      phone: u.phone || '3169008561',
      address: u.address || '',
      clabe: u.clabe || '',
      pin: u.pin || '1234',
      balance: u.balance || 0,
      creditLimit: Math.min(5000000, u.creditLimit || 0),
      creditUsed: u.creditUsed || 0,
      loanStartDate: u.loanStartDate || u.createdAt || formatInputDate(new Date()),
      paymentTermDays: termDays,
      loanPaymentFrequency: freq,
      dailyInterestRate: u.dailyInterestRate ?? 0.05,
    });
  };

  const handleSaveEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    const parsedLimit = Math.min(5000000, Math.max(0, Number(formData.creditLimit) || 0));
    const parsedDebt = Math.min(parsedLimit, Math.max(0, Number(formData.creditUsed) || 0));
    const parsedDays = Number(formData.paymentTermDays) || 30;
    const freq = formData.loanPaymentFrequency || (parsedDays <= 15 ? 'quincenal' : 'mensual');
    const daysPerInst = freq === 'quincenal' ? 15 : 30;
    const calculatedInstallments = Math.max(1, Math.round(parsedDays / daysPerInst));
    const calculatedQuota = parsedDebt > 0 ? Math.round(parsedDebt / calculatedInstallments) : 0;

    const updated: User = {
      ...editingUser,
      name: formData.name,
      cedula: formData.cedula,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      clabe: formData.clabe,
      pin: formData.pin,
      balance: Number(formData.balance) || 0,
      creditLimit: parsedLimit,
      creditUsed: parsedDebt,
      loanStartDate: formData.loanStartDate || editingUser.loanStartDate || formatInputDate(new Date()),
      paymentTermDays: parsedDays,
      loanPaymentFrequency: freq,
      loanQuota: calculatedQuota,
      loanQuotasTotal: calculatedInstallments,
      dailyInterestRate: Number(formData.dailyInterestRate) || 0.05,
    };
    onUpdateUser(updated);
    setEditingUser(null);
  };

  const handleBulkUploadConfirm = (importedUsers: User[], updateExisting: boolean) => {
    if (onAddBatchUsers) {
      onAddBatchUsers(importedUsers, updateExisting);
    } else {
      importedUsers.forEach((u) => onAddUser(u));
    }
    setBulkSuccessNotice(`¡Carga masiva completada! Se procesaron ${importedUsers.length} clientes en el sistema.`);
    setTimeout(() => {
      setBulkSuccessNotice(null);
    }, 5000);
  };

  // Global calculations
  const totalCreditAllocated = users.reduce((sum, u) => sum + (u.creditLimit || 0), 0);
  const totalDebtOutstanding = users.reduce((sum, u) => sum + (u.creditUsed || 0), 0);
  const totalClientsCount = users.filter((u) => u.role === 'client').length;
  const activeClientsCount = users.filter((u) => u.role === 'client' && calculateCreditStatus(u).computedStatus === 'active').length;
  const overdueClientsCount = users.filter((u) => u.role === 'client' && calculateCreditStatus(u).computedStatus === 'pending').length;
  const blockedClientsCount = users.filter((u) => u.role === 'client' && calculateCreditStatus(u).computedStatus === 'blocked').length;

  const successfulCaptchas = captchaLogs.filter((c) => c.success).length;
  const captchaPassRate = captchaLogs.length > 0 ? Math.round((successfulCaptchas / captchaLogs.length) * 100) : 100;

  // Filtered users
  const filteredUsers = users.filter((u) => {
    const matchesRole = u.role === 'client';
    const matchesSearch =
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.clabe.includes(userSearch) ||
      u.cedula.includes(userSearch) ||
      (u.address && u.address.toLowerCase().includes(userSearch.toLowerCase()));
    const userComputedStatus = calculateCreditStatus(u).computedStatus;
    const matchesStatus = statusFilter === 'all' || userComputedStatus === statusFilter;
    const matchesDebt =
      debtFilter === 'all' ||
      (debtFilter === 'with_debt' && u.creditUsed > 0) ||
      (debtFilter === 'no_debt' && u.creditUsed <= 0);
    return matchesRole && matchesSearch && matchesStatus && matchesDebt;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* HEADER PRINCIPAL ORGANIZADO */}
      <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl border border-purple-900/50 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-[10px] uppercase font-black tracking-widest bg-purple-900/80 text-purple-200 px-3 py-0.5 rounded-full border border-purple-700/60">
                Panel Administrativo
              </span>
              <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1.5 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Sistema Conectado
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Gestión Integral CrediULEP
            </h1>
            <p className="text-xs text-purple-200/80 mt-1 max-w-xl">
              Supervisión de clientes, control de cartera de créditos y configuración de seguridad.
            </p>
          </div>

          {/* Capital Administrado y Acciones Rápidas */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="bg-white/10 px-4 py-2.5 rounded-2xl border border-white/10 backdrop-blur-md flex items-center gap-3">
              <div>
                <p className="text-[10px] text-purple-200 uppercase font-bold tracking-wider">Capital Administrado</p>
                <p className="text-lg sm:text-xl font-black font-mono text-emerald-300 mt-0.5">
                  ${adminCapital.toLocaleString('es-CO')} <span className="text-[10px] text-purple-200 font-normal">COP</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCapitalInputValue(adminCapital.toString());
                  setIsEditingCapital(true);
                }}
                className="p-1.5 rounded-xl bg-purple-800/80 hover:bg-purple-700 text-purple-200 hover:text-white transition-all text-xs flex items-center gap-1 font-bold cursor-pointer"
                title="Editar Capital"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Botón Descargar Excel */}
            <button
              type="button"
              onClick={() => exportClientsToExcel(users)}
              className="px-3.5 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-2xl font-bold text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer hover:scale-102 active:scale-98"
              title="Descargar base de datos completa de clientes en formato Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
              <span>Descargar Excel</span>
            </button>

            {/* Botón Carga Masiva */}
            <button
              type="button"
              onClick={() => setIsBulkUploadOpen(true)}
              className="px-3.5 py-2.5 bg-purple-700 hover:bg-purple-600 text-white rounded-2xl font-bold text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer hover:scale-102 active:scale-98"
              title="Cargar clientes masivamente desde archivo Excel o CSV"
            >
              <Upload className="w-4 h-4 text-purple-200" />
              <span>Carga Masiva</span>
            </button>

            {/* Botón Descargar Plantilla */}
            <button
              type="button"
              onClick={downloadBulkUploadTemplate}
              className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-purple-100 hover:text-white border border-white/20 rounded-2xl font-bold text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              title="Descargar plantilla oficial de Excel para carga masiva"
            >
              <Download className="w-4 h-4 text-purple-200" />
              <span>Plantilla Excel</span>
            </button>

            {/* Botón Nuevo Cliente */}
            <button
              type="button"
              onClick={() => setIsAddingUser(true)}
              className="px-3.5 py-2.5 bg-purple-500 hover:bg-purple-400 text-white rounded-2xl font-black text-xs transition-all shadow-lg flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              <span>Nuevo Cliente</span>
            </button>
          </div>
        </div>
      </div>

      {/* METRIC CARDS ROW ORDENADA */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-purple-100 shadow-xs space-y-1">
          <div className="flex justify-between items-center text-purple-900">
            <span className="text-[11px] font-bold uppercase text-slate-500">Clientes Totales</span>
            <Users className="w-4 h-4 text-purple-800" />
          </div>
          <p className="text-2xl font-black text-purple-950 font-mono">{totalClientsCount}</p>
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 font-mono">
            <span className="text-emerald-700">{activeClientsCount} activos</span>
            <span>•</span>
            <span className="text-amber-700">{overdueClientsCount} mora</span>
            <span>•</span>
            <span className="text-rose-700">{blockedClientsCount} canc.</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-purple-100 shadow-xs space-y-1">
          <div className="flex justify-between items-center text-purple-900">
            <span className="text-[11px] font-bold uppercase text-slate-500">Deuda por Cobrar</span>
            <Wallet className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-amber-700 font-mono">
            ${(totalDebtOutstanding / 1000000).toFixed(2)}M <span className="text-xs">COP</span>
          </p>
          <p className="text-[10px] text-slate-500 font-medium font-mono">
            ${totalDebtOutstanding.toLocaleString('es-CO')}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-purple-100 shadow-xs space-y-1">
          <div className="flex justify-between items-center text-purple-900">
            <span className="text-[11px] font-bold uppercase text-slate-500">Línea Otorgada</span>
            <DollarSign className="w-4 h-4 text-purple-700" />
          </div>
          <p className="text-2xl font-black text-purple-950 font-mono">
            ${(totalCreditAllocated / 1000000).toFixed(2)}M <span className="text-xs">COP</span>
          </p>
          <p className="text-[10px] text-slate-500 font-medium">Cupo total global asignado</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-purple-100 shadow-xs space-y-1">
          <div className="flex justify-between items-center text-purple-900">
            <span className="text-[11px] font-bold uppercase text-slate-500">Seguridad CAPTCHA</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-purple-950 font-mono">{captchaPassRate}%</p>
          <p className="text-[10px] text-emerald-700 font-semibold">Tasa de aprobación efectiva</p>
        </div>
      </div>

      {/* PESTAÑAS DE NAVEGACIÓN ORGANIZADAS */}
      <div className="flex items-center gap-2 border-b border-purple-100 pb-2 overflow-x-auto">
        {[
          { id: 'users', label: 'Directorio de Clientes', count: totalClientsCount, icon: Users },
          { id: 'payments', label: 'Gestión y Registro de Pagos', count: users.filter((u) => u.creditUsed > 0).length, icon: CreditCard },
          { id: 'captcha', label: 'Seguridad y Cifrado', count: captchaLogs.length, icon: ShieldCheck }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-purple-950 text-white shadow-sm'
                  : 'bg-white text-purple-950 hover:bg-purple-50 border border-purple-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  isActive ? 'bg-purple-800 text-purple-200' : 'bg-purple-100 text-purple-900'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* AVISOS DE ACCIÓN */}
      {bulkSuccessNotice && (
        <div className="bg-purple-50 border border-purple-200 p-4 rounded-2xl flex items-center justify-between text-xs text-purple-950 font-bold animate-in fade-in shadow-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{bulkSuccessNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setBulkSuccessNotice(null)}
            className="text-purple-800 hover:underline text-xs cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      )}

      {deleteNotice && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center justify-between text-xs text-emerald-900 font-bold animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{deleteNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setDeleteNotice(null)}
            className="text-emerald-950 hover:underline text-xs cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      )}

      {paymentNotice && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center justify-between text-xs text-emerald-900 font-bold animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{paymentNotice}</span>
          </div>
          <button
            onClick={() => setPaymentNotice(null)}
            className="text-emerald-950 hover:underline text-xs cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* TAB 1: DIRECTORIO DE CLIENTES */}
      {activeTab === 'users' && (
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-purple-100 shadow-xs space-y-4">
          {/* Barra Superior de Búsqueda, Filtros y Acciones Rápidas */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-purple-50 pb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-purple-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Buscar por nombre, cédula, correo o CLABE..."
                className="w-full pl-9 pr-3 py-2 bg-purple-50/50 border border-purple-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-700"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 bg-purple-50/70 border border-purple-200 px-2.5 py-1 rounded-xl text-xs">
                <Filter className="w-3.5 h-3.5 text-purple-800" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-transparent text-xs font-bold text-purple-950 focus:outline-none cursor-pointer"
                >
                  <option value="all">Todos los estados</option>
                  <option value="active">Activos</option>
                  <option value="pending">En Mora</option>
                  <option value="blocked">Cancelados</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 bg-purple-50/70 border border-purple-200 px-2.5 py-1 rounded-xl text-xs">
                <select
                  value={debtFilter}
                  onChange={(e) => setDebtFilter(e.target.value as any)}
                  className="bg-transparent text-xs font-bold text-purple-950 focus:outline-none cursor-pointer"
                >
                  <option value="all">Toda la cartera</option>
                  <option value="with_debt">Con deuda activa</option>
                  <option value="no_debt">Sin deuda ($0)</option>
                </select>
              </div>

              {/* Botones rápidos de Excel / Carga Masiva */}
              <div className="flex items-center gap-1.5 border-l border-purple-100 pl-2">
                <button
                  type="button"
                  onClick={() => exportClientsToExcel(users)}
                  className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl font-bold text-xs flex items-center gap-1 transition-all cursor-pointer"
                  title="Descargar base de datos en Excel"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Excel</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsBulkUploadOpen(true)}
                  className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 rounded-xl font-bold text-xs flex items-center gap-1 transition-all cursor-pointer"
                  title="Carga masiva de clientes"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Carga Masiva</span>
                </button>

                <button
                  type="button"
                  onClick={downloadBulkUploadTemplate}
                  className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-bold text-xs flex items-center gap-1 transition-all cursor-pointer"
                  title="Descargar plantilla de Excel"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Plantilla</span>
                </button>
              </div>
            </div>
          </div>

          {/* Tabla de Clientes Organizada */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-purple-50/80 text-purple-950 font-black uppercase tracking-wider border-y border-purple-100">
                <tr>
                  <th className="py-3 px-4">Cliente / Identificación</th>
                  <th className="py-3 px-4">Crédito & Fechas</th>
                  <th className="py-3 px-4">Línea Cupo</th>
                  <th className="py-3 px-4">Deuda Actual</th>
                  <th className="py-3 px-4">Estado Calculado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-50">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                      No se encontraron clientes con los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const statusInfo = calculateCreditStatus(u);
                    return (
                      <tr key={u.id} className="hover:bg-purple-50/40 transition-colors">
                        <td className="py-3.5 px-4">
                          <p className="font-extrabold text-purple-950 text-sm">{u.name}</p>
                          <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                            CC: <strong className="text-purple-900 font-bold">{u.cedula}</strong> {u.phone ? `• Tel: ${u.phone}` : ''}
                          </p>
                          {u.address && (
                            <p className="text-[10px] text-slate-400 truncate max-w-[200px]">
                              📍 {u.address}
                            </p>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5">
                            <span className="inline-block font-bold text-purple-900 bg-purple-100/70 border border-purple-200 px-2 py-0.5 rounded-md text-[10px]">
                              {statusInfo.frequencyLabel}
                            </span>
                            <p className="text-[10px] text-slate-500 font-mono">
                              Inicio: {statusInfo.startDate}
                            </p>
                            {u.creditUsed > 0 && (
                              <p className="text-[10px] text-slate-500 font-mono">
                                Vence: <strong className="text-purple-950">{statusInfo.dueDate}</strong>
                              </p>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-mono font-bold text-purple-950">
                          ${u.creditLimit.toLocaleString('es-CO')}
                        </td>

                        <td className="py-3.5 px-4 font-mono font-bold">
                          <span className={u.creditUsed > 0 ? 'text-amber-700 font-extrabold' : 'text-slate-400'}>
                            ${u.creditUsed.toLocaleString('es-CO')}
                          </span>
                          {statusInfo.installmentAmount > 0 && (
                            <p className="text-[10px] font-normal text-slate-500 font-sans mt-0.5">
                              Cuota: ${statusInfo.installmentAmount.toLocaleString('es-CO')}
                            </p>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="space-y-1">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] ${statusInfo.badgeBg} ${statusInfo.badgeText}`}
                            >
                              {statusInfo.statusLabel}
                            </span>
                            <p className="text-[10px] text-slate-500 max-w-[170px] leading-tight">
                              {statusInfo.statusReason}
                            </p>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveTab('payments');
                                setExpandedUserIds({ [u.id]: true });
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 rounded-xl font-bold text-xs transition-all cursor-pointer"
                              title="Gestionar Pagos"
                            >
                              <CreditCard className="w-3.5 h-3.5 text-purple-800" />
                              <span>Pagos</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => openEditModal(u)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-purple-950 hover:bg-purple-900 text-white rounded-xl font-bold text-xs transition-all cursor-pointer shadow-xs"
                              title="Editar Parámetros y Crédito"
                            >
                              <SlidersHorizontal className="w-3.5 h-3.5 text-purple-300" />
                              <span>Editar</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setUserToDelete(u)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold text-xs transition-all cursor-pointer"
                              title="Eliminar Cliente"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: GESTIÓN Y REGISTRO DE PAGOS */}
      {activeTab === 'payments' && (
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-purple-100 shadow-xs space-y-5">
          {/* Encabezado */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-100 pb-4">
            <div>
              <h2 className="text-lg font-black text-purple-950 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-purple-800" />
                Control de Pagos y Liquidaciones
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Registra la recepción de cuotas calculadas (quincenas o mensualidades), abonos o cancelación total.
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-purple-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Buscar cliente por nombre o cédula..."
                className="w-full pl-9 pr-3 py-2 bg-purple-50/50 border border-purple-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-700"
              />
            </div>
          </div>

          {/* Tarjetas de Clientes para Pagos */}
          <div className="space-y-4">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs font-medium">
                No se encontraron cuentas de clientes registradas.
              </div>
            ) : (
              filteredUsers.map((u) => {
                const isExpanded = !!expandedUserIds[u.id];
                const statusInfo = calculateCreditStatus(u);
                const cuotaAmount = statusInfo.installmentAmount > 0 ? statusInfo.installmentAmount : Math.min(u.creditUsed, 1250000);
                const isDebtPaid = u.creditUsed <= 0;

                return (
                  <div
                    key={u.id}
                    className="bg-purple-50/40 border border-purple-100 rounded-2xl p-4 sm:p-5 space-y-3 transition-all hover:border-purple-200"
                  >
                    {/* Barra Superior del Cliente */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-950 text-white font-black rounded-xl flex items-center justify-center text-sm shadow-xs shrink-0">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-extrabold text-sm sm:text-base text-purple-950">{u.name}</h3>
                            <span
                              className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${statusInfo.badgeBg} ${statusInfo.badgeText}`}
                            >
                              {statusInfo.statusLabel}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                            Cédula: <strong className="text-purple-900 font-bold">{u.cedula}</strong> • Tel: {u.phone || '3169008561'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 justify-between sm:justify-end">
                        <div className="text-right font-mono">
                          <p className="text-[10px] uppercase font-bold text-slate-400">Deuda Actual</p>
                          <p className={`text-base font-black ${u.creditUsed > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                            ${u.creditUsed.toLocaleString('es-CO')} COP
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleExpandUser(u.id)}
                          className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                            isExpanded
                              ? 'bg-purple-950 text-white'
                              : 'bg-white text-purple-950 hover:bg-purple-100 border border-purple-200'
                          }`}
                        >
                          <span>{isExpanded ? 'Ocultar Opciones' : 'Opciones de Pago'}</span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5 text-purple-700" />}
                        </button>
                      </div>
                    </div>

                    {/* Fila de Datos Rápidos */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-2.5 bg-white rounded-xl text-xs border border-purple-100">
                      <div>
                        <p className="text-slate-400 font-bold text-[10px] uppercase">Plan de Pagos</p>
                        <p className="font-extrabold font-mono text-purple-950 mt-0.5">
                          {statusInfo.frequencyLabel}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-400 font-bold text-[10px] uppercase">Cuota Calculada</p>
                        <p className="font-extrabold font-mono text-purple-900 mt-0.5">
                          ${cuotaAmount.toLocaleString('es-CO')}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-400 font-bold text-[10px] uppercase">Fecha Otorgamiento</p>
                        <p className="font-bold font-mono text-slate-700 mt-0.5">
                          {statusInfo.startDate}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-400 font-bold text-[10px] uppercase">Fecha Límite / Vence</p>
                        <p className={`font-bold font-mono mt-0.5 ${statusInfo.isOverdue ? 'text-rose-600 font-black' : 'text-purple-900'}`}>
                          {statusInfo.dueDate}
                        </p>
                      </div>
                    </div>

                    {/* Desplegable de Opciones de Pago */}
                    {isExpanded && (
                      <div className="pt-3 border-t border-purple-100 space-y-3 animate-in fade-in duration-150">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-black uppercase tracking-wider text-purple-950 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                            Registrar recepción de pago:
                          </h4>
                          <span className="text-[11px] font-bold text-slate-600">
                            {isDebtPaid ? 'Esta cuenta está al día ($0)' : statusInfo.statusReason}
                          </span>
                        </div>

                        {/* Tabla de cuotas calculadas */}
                        {statusInfo.installments.length > 0 && !isDebtPaid && (
                          <div className="bg-white p-3 rounded-xl border border-purple-100">
                            <p className="text-[11px] font-bold text-purple-950 mb-2">Calendario de Cuotas Programadas:</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                              {statusInfo.installments.map((inst) => (
                                <div
                                  key={inst.number}
                                  className="p-2 bg-purple-50/50 border border-purple-100 rounded-lg text-[11px] flex justify-between items-center"
                                >
                                  <div>
                                    <p className="font-bold text-purple-950">Cuota #{inst.number} ({inst.daysFromStart}d)</p>
                                    <p className="text-[10px] text-slate-500 font-mono">Vence: {inst.dueDate}</p>
                                  </div>
                                  <div className="text-right font-mono">
                                    <p className="font-bold text-purple-900">${inst.amount.toLocaleString('es-CO')}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {/* Opción 1: Cuota */}
                          <div className="bg-white p-3.5 rounded-2xl border border-purple-200 shadow-xs flex flex-col justify-between gap-2.5">
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-extrabold text-xs text-purple-950">1. Pago de Cuota ({statusInfo.frequency === 'quincenal' ? '15d' : '30d'})</span>
                                <span
                                  className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                    !isDebtPaid ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                                  }`}
                                >
                                  {!isDebtPaid ? 'Cuota' : 'Al día'}
                                </span>
                              </div>
                              <p className="text-lg font-black font-mono text-purple-950 mt-1">
                                ${cuotaAmount.toLocaleString('es-CO')} COP
                              </p>
                            </div>

                            <button
                              type="button"
                              disabled={isDebtPaid}
                              onClick={() => handleMarkPaymentAsPaid(u, 'cuota')}
                              className={`w-full py-2.5 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                                !isDebtPaid
                                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-98'
                                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                              }`}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{!isDebtPaid ? 'Registrar Pago Cuota' : 'Pagado'}</span>
                            </button>
                          </div>

                          {/* Opción 2: Liquidación Total */}
                          <div className="bg-white p-3.5 rounded-2xl border border-purple-200 shadow-xs flex flex-col justify-between gap-2.5">
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-extrabold text-xs text-purple-950">2. Liquidación Total</span>
                                <span
                                  className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                    !isDebtPaid ? 'bg-purple-100 text-purple-800' : 'bg-emerald-100 text-emerald-800'
                                  }`}
                                >
                                  {!isDebtPaid ? 'Total' : 'Cancelado'}
                                </span>
                              </div>
                              <p className="text-lg font-black font-mono text-purple-950 mt-1">
                                ${u.creditUsed.toLocaleString('es-CO')} COP
                              </p>
                            </div>

                            <button
                              type="button"
                              disabled={isDebtPaid}
                              onClick={() => handleMarkPaymentAsPaid(u, 'total')}
                              className={`w-full py-2.5 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                                !isDebtPaid
                                  ? 'bg-purple-950 hover:bg-purple-900 text-white active:scale-98'
                                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                              }`}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{!isDebtPaid ? 'Ya pagó Total' : 'Pagado'}</span>
                            </button>
                          </div>

                          {/* Opción 3: Abono Personalizado */}
                          <div className="bg-white p-3.5 rounded-2xl border border-purple-200 shadow-xs flex flex-col justify-between gap-2.5">
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-extrabold text-xs text-purple-950">3. Abono Libre</span>
                                <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-slate-100 text-slate-700">
                                  Monto libre
                                </span>
                              </div>
                              <div className="relative mt-1">
                                <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-400">$</span>
                                <input
                                  type="number"
                                  disabled={isDebtPaid}
                                  value={customPaymentAmounts[u.id] || ''}
                                  onChange={(e) =>
                                    setCustomPaymentAmounts((prev) => ({ ...prev, [u.id]: e.target.value }))
                                  }
                                  placeholder="Ej. 300000"
                                  className="w-full pl-6 pr-2.5 py-1.5 bg-purple-50/50 border border-purple-200 rounded-xl text-xs font-mono font-bold text-purple-950 focus:outline-none focus:ring-2 focus:ring-purple-700 disabled:opacity-50"
                                />
                              </div>
                            </div>

                            <button
                              type="button"
                              disabled={
                                isDebtPaid ||
                                !customPaymentAmounts[u.id] ||
                                parseFloat(customPaymentAmounts[u.id]) <= 0
                              }
                              onClick={() => {
                                const amt = parseFloat(customPaymentAmounts[u.id] || '0');
                                handleMarkPaymentAsPaid(u, 'custom', amt);
                              }}
                              className={`w-full py-2.5 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                                !isDebtPaid && parseFloat(customPaymentAmounts[u.id] || '0') > 0
                                  ? 'bg-purple-800 hover:bg-purple-900 text-white active:scale-98'
                                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                              }`}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Registrar Abono</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 3: SEGURIDAD Y CIFRADO */}
      {activeTab === 'captcha' && (
        <div className="space-y-5">
          {/* Banner de Cifrado */}
          <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-purple-950 text-white p-6 rounded-3xl shadow-md border border-purple-800/40">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-400 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold tracking-tight">Cifrado Bancario y Seguridad Activa</h3>
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold rounded-full">
                      AES-256 Activo
                    </span>
                  </div>
                  <p className="text-xs text-purple-200/80 mt-0.5">
                    Todos los datos de clientes, cuentas, saldos y claves se protegen con cifrado de nivel bancario.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mt-4 pt-4 border-t border-purple-800/50 text-xs">
              <div className="p-2.5 bg-white/5 rounded-xl border border-white/5">
                <p className="text-purple-300 text-[10px] font-medium">Cifrado en Reposo</p>
                <p className="font-bold text-white mt-0.5 flex items-center gap-1 text-xs">
                  <Check className="w-3 h-3 text-emerald-400" />
                  AES-256 Auth
                </p>
              </div>
              <div className="p-2.5 bg-white/5 rounded-xl border border-white/5">
                <p className="text-purple-300 text-[10px] font-medium">Cédulas y PIN</p>
                <p className="font-bold text-white mt-0.5 flex items-center gap-1 text-xs">
                  <Check className="w-3 h-3 text-emerald-400" />
                  Ofuscación SHA-256
                </p>
              </div>
              <div className="p-2.5 bg-white/5 rounded-xl border border-white/5">
                <p className="text-purple-300 text-[10px] font-medium">Bóveda de Datos</p>
                <p className="font-bold text-white mt-0.5 flex items-center gap-1 text-xs">
                  <Check className="w-3 h-3 text-emerald-400" />
                  SecureStorage Vault
                </p>
              </div>
              <div className="p-2.5 bg-white/5 rounded-xl border border-white/5">
                <p className="text-purple-300 text-[10px] font-medium">Conexión de Red</p>
                <p className="font-bold text-white mt-0.5 flex items-center gap-1 text-xs">
                  <Check className="w-3 h-3 text-emerald-400" />
                  TLS 1.3 / HTTPS
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Parámetros de Seguridad */}
            <div className="bg-white p-5 rounded-3xl border border-purple-100 shadow-xs space-y-4">
              <h3 className="text-sm font-black text-purple-950 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-purple-800" />
                Parámetros de Seguridad
              </h3>

              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tipo de CAPTCHA por defecto</label>
                  <select
                    value={securitySettings.captchaType}
                    onChange={(e) =>
                      onUpdateSecuritySettings({
                        ...securitySettings,
                        captchaType: e.target.value as any
                      })
                    }
                    className="w-full p-2 bg-purple-50 border border-purple-200 rounded-xl font-bold text-purple-950"
                  >
                    <option value="code">Código Alfanumérico Distorsionado</option>
                    <option value="math">Desafío Matemático</option>
                    <option value="slider">Deslizador Interactivo Puzzle</option>
                  </select>
                </div>

                <div className="flex items-center justify-between p-3 bg-purple-50/70 border border-purple-100 rounded-xl">
                  <span className="font-bold text-purple-950">CAPTCHA Obligatorio</span>
                  <input
                    type="checkbox"
                    checked={securitySettings.captchaRequired}
                    onChange={(e) =>
                      onUpdateSecuritySettings({
                        ...securitySettings,
                        captchaRequired: e.target.checked
                      })
                    }
                    className="w-4 h-4 accent-purple-800 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-purple-50/70 border border-purple-100 rounded-xl">
                  <span className="font-bold text-purple-950">Verificación NIP 2FA</span>
                  <input
                    type="checkbox"
                    checked={securitySettings.requirePin2FA}
                    onChange={(e) =>
                      onUpdateSecuritySettings({
                        ...securitySettings,
                        requirePin2FA: e.target.checked
                      })
                    }
                    className="w-4 h-4 accent-purple-800 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Registros de Auditoría */}
            <div className="md:col-span-2 bg-white p-5 rounded-3xl border border-purple-100 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-purple-50 pb-2">
                <h3 className="text-sm font-black text-purple-950">Registros de Auditoría CAPTCHA</h3>
                <span className="text-[11px] text-slate-400 font-mono font-bold">
                  {captchaLogs.length} eventos
                </span>
              </div>

              <div className="divide-y divide-purple-50 text-xs max-h-72 overflow-y-auto">
                {captchaLogs.length === 0 ? (
                  <p className="py-6 text-center text-slate-400 font-medium">No hay registros de CAPTCHA.</p>
                ) : (
                  captchaLogs.map((log) => (
                    <div key={log.id} className="py-2.5 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-purple-950">{log.userEmail || 'Intento Anónimo'}</p>
                        <p className="text-[10px] text-slate-500 font-mono">
                          IP: {log.ipAddress} • Tipo: {log.type} • Hora: {log.timestamp}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            log.success ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {log.success ? 'OK' : 'Bloqueado'}
                        </span>
                        <button
                          type="button"
                          onClick={() => onDeleteCaptchaLog(log.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                          title="Eliminar Registro"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE EDICIÓN INTEGRAL DE CLIENTE BIEN ORGANIZADO */}
      {editingUser && (() => {
        // Compute current simulated status for the editing form
        const tempUser: User = {
          ...editingUser,
          creditUsed: Number(formData.creditUsed) || 0,
          loanStartDate: formData.loanStartDate || editingUser.loanStartDate || formatInputDate(new Date()),
          paymentTermDays: Number(formData.paymentTermDays) || 30,
          loanPaymentFrequency: formData.loanPaymentFrequency,
        };
        const computedInfo = calculateCreditStatus(tempUser);

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-2xl w-full border border-purple-100 shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
              {/* Encabezado del Modal */}
              <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-purple-900">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-black tracking-widest bg-purple-900 text-purple-200 px-2.5 py-0.5 rounded-full">
                      Edición de Cliente y Crédito
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${computedInfo.badgeBg} ${computedInfo.badgeText}`}>
                      {computedInfo.statusLabel}
                    </span>
                  </div>
                  <h2 className="text-lg font-black mt-1 text-white">{editingUser.name}</h2>
                  <p className="text-xs text-purple-200 font-mono">CC: {editingUser.cedula} • ID: {editingUser.id}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Banner de Estado Calculado Automáticamente */}
              <div className="bg-purple-50/90 border-b border-purple-100 p-4 flex items-start gap-3">
                <Info className="w-4 h-4 text-purple-800 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-bold text-purple-950">
                    Estado Calculado Automáticamente:{' '}
                    <span className="font-extrabold underline">{computedInfo.statusLabel}</span>
                  </p>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    {computedInfo.statusReason}. El estado se define automáticamente según la fecha de inicio del crédito, el plazo asignado y el saldo adeudado.
                  </p>
                </div>
              </div>

              {/* Pestañas internas del Modal */}
              <div className="flex border-b border-purple-100 bg-white px-5 pt-3 gap-2 overflow-x-auto">
                {[
                  { id: 'credit', label: '1. Parámetros del Crédito', icon: CreditCard },
                  { id: 'schedule', label: '2. Calendario de Pagos', icon: Calendar },
                  { id: 'personal', label: '3. Datos Personales', icon: Users },
                ].map((t) => {
                  const Icon = t.icon;
                  const isSelected = editTab === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setEditTab(t.id as any)}
                      className={`flex items-center gap-1.5 pb-2.5 px-3 text-xs font-black border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                        isSelected
                          ? 'border-purple-900 text-purple-950'
                          : 'border-transparent text-slate-500 hover:text-purple-900'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>

              <form onSubmit={handleSaveEditUser} className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
                {/* SECCIÓN 1: PARÁMETROS DEL CRÉDITO */}
                {editTab === 'credit' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 bg-purple-50/60 rounded-2xl border border-purple-100 space-y-1">
                        <label className="block text-[11px] font-bold text-slate-700">
                          Fecha de Otorgamiento / Inicio *
                        </label>
                        <input
                          type="date"
                          required
                          value={formData.loanStartDate}
                          onChange={(e) => setFormData({ ...formData, loanStartDate: e.target.value })}
                          className="w-full p-2 bg-white border border-purple-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-purple-700 outline-none"
                        />
                        <p className="text-[10px] text-slate-400">Fecha exacta en que se entrega el crédito</p>
                      </div>

                      <div className="p-3 bg-purple-50/60 rounded-2xl border border-purple-100 space-y-1">
                        <label className="block text-[11px] font-bold text-slate-700">
                          Modalidad de Pago *
                        </label>
                        <select
                          value={formData.loanPaymentFrequency}
                          onChange={(e) => setFormData({ ...formData, loanPaymentFrequency: e.target.value as any })}
                          className="w-full p-2 bg-white border border-purple-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-purple-700 outline-none cursor-pointer"
                        >
                          <option value="quincenal">Quincenal (Pagos cada 15 días)</option>
                          <option value="mensual">Mensual (Pagos cada 30 días / al mes)</option>
                        </select>
                        <p className="text-[10px] text-slate-400">Determina el ciclo de cada cuota</p>
                      </div>

                      <div className="p-3 bg-purple-50/60 rounded-2xl border border-purple-100 space-y-1">
                        <label className="block text-[11px] font-bold text-slate-700">
                          Plazo Total del Crédito (Días) *
                        </label>
                        <select
                          value={formData.paymentTermDays}
                          onChange={(e) => setFormData({ ...formData, paymentTermDays: parseInt(e.target.value) || 30 })}
                          className="w-full p-2 bg-white border border-purple-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-purple-700 outline-none cursor-pointer"
                        >
                          <option value={15}>15 Días (1 Quincena)</option>
                          <option value={30}>30 Días (2 Quincenas o 1 Mes)</option>
                          <option value={45}>45 Días (3 Quincenas)</option>
                          <option value={60}>60 Días (4 Quincenas o 2 Meses)</option>
                          <option value={90}>90 Días (6 Quincenas o 3 Meses)</option>
                        </select>
                        <p className="text-[10px] text-slate-400">Duración total pactada</p>
                      </div>

                      <div className="p-3 bg-purple-50/60 rounded-2xl border border-purple-100 space-y-1">
                        <label className="block text-[11px] font-bold text-slate-700">
                          Deuda Actual / Saldo Deudor ($ COP)
                        </label>
                        <input
                          type="number"
                          max="5000000"
                          value={formData.creditUsed}
                          onChange={(e) => setFormData({ ...formData, creditUsed: parseFloat(e.target.value) || 0 })}
                          className="w-full p-2 bg-white border border-purple-200 rounded-xl text-xs font-mono font-bold text-amber-900 focus:ring-2 focus:ring-purple-700 outline-none"
                        />
                        <p className="text-[10px] text-slate-400">Si es 0, el crédito se considerará Cancelado</p>
                      </div>

                      <div className="p-3 bg-purple-50/60 rounded-2xl border border-purple-100 space-y-1">
                        <label className="block text-[11px] font-bold text-slate-700">
                          Cupo Línea de Crédito (Máx. $5.000.000 COP)
                        </label>
                        <input
                          type="number"
                          max="5000000"
                          value={formData.creditLimit}
                          onChange={(e) => setFormData({ ...formData, creditLimit: Math.min(5000000, parseFloat(e.target.value) || 0) })}
                          className="w-full p-2 bg-white border border-purple-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-purple-700 outline-none"
                        />
                      </div>

                      <div className="p-3 bg-purple-50/60 rounded-2xl border border-purple-100 space-y-1">
                        <label className="block text-[11px] font-bold text-slate-700">
                          Tasa de Interés Diaria (%)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.dailyInterestRate}
                          onChange={(e) => setFormData({ ...formData, dailyInterestRate: parseFloat(e.target.value) || 0 })}
                          className="w-full p-2 bg-white border border-purple-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-purple-700 outline-none"
                        />
                      </div>
                    </div>

                    {/* Resumen Calculado en Tiempo Real */}
                    <div className="p-3.5 bg-gradient-to-r from-purple-900 to-indigo-950 text-white rounded-2xl space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-purple-200">Cálculo Automático de Cuotas:</span>
                        <span className="font-mono bg-white/10 px-2 py-0.5 rounded-md font-bold">
                          {computedInfo.frequencyLabel}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs pt-1 border-t border-white/10">
                        <div>
                          <p className="text-[10px] text-purple-300">Cuota Estimada</p>
                          <p className="font-extrabold font-mono text-sm">${computedInfo.installmentAmount.toLocaleString('es-CO')}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-purple-300">Fecha Vencimiento</p>
                          <p className="font-extrabold font-mono text-xs">{computedInfo.dueDate}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-purple-300">Días Transcurridos</p>
                          <p className="font-extrabold font-mono text-xs">{computedInfo.elapsedDays} / {computedInfo.paymentTermDays} días</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* SECCIÓN 2: CALENDARIO Y CUOTAS CALCULADAS */}
                {editTab === 'schedule' && (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-600 font-medium">
                      El sistema calcula automáticamente cada fecha de pago sumando los períodos (15 o 30 días) a partir de la fecha de inicio ({computedInfo.startDate}):
                    </p>

                    <div className="space-y-2 max-h-56 overflow-y-auto">
                      {computedInfo.installments.length === 0 ? (
                        <p className="text-xs text-slate-400 py-4 text-center">No hay cuotas activas (deuda en $0).</p>
                      ) : (
                        computedInfo.installments.map((inst) => (
                          <div
                            key={inst.number}
                            className="p-3 bg-purple-50/60 border border-purple-100 rounded-xl flex items-center justify-between text-xs"
                          >
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-purple-950">
                                  Cuota #{inst.number} ({inst.daysFromStart} días del crédito)
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                    inst.isPast
                                      ? 'bg-rose-100 text-rose-800'
                                      : 'bg-emerald-100 text-emerald-800'
                                  }`}
                                >
                                  {inst.isPast ? 'Vencida' : 'Al día'}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 font-mono">
                                Vencimiento: <strong className="text-purple-900">{inst.dueDate}</strong>
                              </p>
                            </div>
                            <div className="text-right font-mono">
                              <p className="text-sm font-black text-purple-950">
                                ${inst.amount.toLocaleString('es-CO')}
                              </p>
                              <p className="text-[10px] text-slate-400">Valor de cuota</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* SECCIÓN 3: DATOS PERSONALES */}
                {editTab === 'personal' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 bg-purple-50/60 rounded-2xl border border-purple-100 space-y-1">
                      <label className="block text-[11px] font-bold text-slate-700">Nombre Completo *</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full p-2 bg-white border border-purple-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-purple-700 outline-none"
                      />
                    </div>
                    <div className="p-3 bg-purple-50/60 rounded-2xl border border-purple-100 space-y-1">
                      <label className="block text-[11px] font-bold text-slate-700">Cédula / Identificación *</label>
                      <input
                        type="text"
                        required
                        value={formData.cedula}
                        onChange={(e) => setFormData({ ...formData, cedula: e.target.value })}
                        className="w-full p-2 bg-white border border-purple-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-purple-700 outline-none"
                      />
                    </div>
                    <div className="p-3 bg-purple-50/60 rounded-2xl border border-purple-100 space-y-1">
                      <label className="block text-[11px] font-bold text-slate-700">Teléfono Móvil</label>
                      <input
                        type="text"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="3169008561"
                        className="w-full p-2 bg-white border border-purple-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-purple-700 outline-none"
                      />
                    </div>
                    <div className="p-3 bg-purple-50/60 rounded-2xl border border-purple-100 space-y-1">
                      <label className="block text-[11px] font-bold text-slate-700">Correo Electrónico</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full p-2 bg-white border border-purple-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-purple-700 outline-none"
                      />
                    </div>
                    <div className="sm:col-span-2 p-3 bg-purple-50/60 rounded-2xl border border-purple-100 space-y-1">
                      <label className="block text-[11px] font-bold text-slate-700">Dirección de Residencia / Ubicación</label>
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="Ej. Calle 45 # 12-34, Bogotá"
                        className="w-full p-2 bg-white border border-purple-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-purple-700 outline-none"
                      />
                    </div>
                    <div className="p-3 bg-purple-50/60 rounded-2xl border border-purple-100 space-y-1">
                      <label className="block text-[11px] font-bold text-slate-700">Clave / NIP (4 dígitos)</label>
                      <input
                        type="text"
                        value={formData.pin}
                        onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                        className="w-full p-2 bg-white border border-purple-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-purple-700 outline-none"
                      />
                    </div>
                    <div className="p-3 bg-purple-50/60 rounded-2xl border border-purple-100 space-y-1">
                      <label className="block text-[11px] font-bold text-slate-700">Saldo Disponible en Cuenta ($ COP)</label>
                      <input
                        type="number"
                        value={formData.balance}
                        onChange={(e) => setFormData({ ...formData, balance: parseFloat(e.target.value) || 0 })}
                        className="w-full p-2 bg-white border border-purple-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-purple-700 outline-none"
                      />
                    </div>
                    <div className="sm:col-span-2 p-3 bg-purple-50/60 rounded-2xl border border-purple-100 space-y-1">
                      <label className="block text-[11px] font-bold text-slate-700">Cuenta CLABE / Cuenta Bancaria</label>
                      <input
                        type="text"
                        value={formData.clabe}
                        onChange={(e) => setFormData({ ...formData, clabe: e.target.value })}
                        className="w-full p-2 bg-white border border-purple-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-purple-700 outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Botones de acción del Modal */}
                <div className="flex items-center justify-between gap-3 pt-4 border-t border-purple-100">
                  <button
                    type="button"
                    onClick={() => setUserToDelete(editingUser)}
                    className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-extrabold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>Eliminar Cliente</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingUser(null)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-purple-950 hover:bg-purple-900 text-white font-extrabold rounded-xl text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Guardar Parámetros</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* MODAL AGREGAR CLIENTE CON CÁLCULO DE CRÉDITO Y FECHAS */}
      {isAddingUser && (() => {
        const tempAddUser: User = {
          id: 'temp_add',
          name: addFormData.name || 'Cliente Nuevo',
          cedula: addFormData.cedula || '0000000000',
          email: addFormData.email || '',
          role: 'client',
          balance: addFormData.balance,
          creditLimit: addFormData.creditLimit,
          creditUsed: addFormData.creditUsed,
          clabe: '012180000000000000',
          cpfOrClabe: addFormData.cedula || '',
          accountNumber: '•••• 0000',
          createdAt: formatInputDate(new Date()),
          pin: addFormData.pin,
          loanStartDate: addFormData.loanStartDate,
          paymentTermDays: addFormData.paymentTermDays,
          loanPaymentFrequency: addFormData.loanPaymentFrequency,
        };
        const addComputedInfo = calculateCreditStatus(tempAddUser);

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-2xl w-full border border-purple-100 shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
              <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-purple-900">
                <div>
                  <span className="text-[10px] uppercase font-black tracking-widest bg-purple-900 text-purple-200 px-2.5 py-0.5 rounded-full">
                    Alta de Usuario
                  </span>
                  <h2 className="text-lg font-black mt-1">Registrar Nuevo Cliente y Crédito</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddingUser(false)}
                  className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="space-y-4">
                  {/* SECCIÓN 1: DATOS PERSONALES */}
                  <div>
                    <h3 className="text-xs font-black text-purple-950 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-purple-800" />
                      1. Datos Personales
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Nombre Completo *</label>
                        <input
                          type="text"
                          required
                          value={addFormData.name}
                          onChange={(e) => setAddFormData({ ...addFormData, name: e.target.value })}
                          placeholder="Ej. Carlos Martínez"
                          className="w-full p-2 bg-purple-50/50 border border-purple-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-purple-700 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Cédula / Documento *</label>
                        <input
                          type="text"
                          required
                          value={addFormData.cedula}
                          onChange={(e) => setAddFormData({ ...addFormData, cedula: e.target.value })}
                          placeholder="Ej. 1098765432"
                          className="w-full p-2 bg-purple-50/50 border border-purple-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-purple-700 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Teléfono Móvil</label>
                        <input
                          type="text"
                          value={addFormData.phone}
                          onChange={(e) => setAddFormData({ ...addFormData, phone: e.target.value })}
                          placeholder="3169008561"
                          className="w-full p-2 bg-purple-50/50 border border-purple-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-purple-700 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Correo Electrónico</label>
                        <input
                          type="email"
                          value={addFormData.email}
                          onChange={(e) => setAddFormData({ ...addFormData, email: e.target.value })}
                          placeholder="cliente@crediulep.com"
                          className="w-full p-2 bg-purple-50/50 border border-purple-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-purple-700 outline-none"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Dirección de Residencia</label>
                        <input
                          type="text"
                          value={addFormData.address}
                          onChange={(e) => setAddFormData({ ...addFormData, address: e.target.value })}
                          placeholder="Ej. Cra 15 # 45-67, Bogotá"
                          className="w-full p-2 bg-purple-50/50 border border-purple-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-purple-700 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Clave NIP (4 dígitos)</label>
                        <input
                          type="text"
                          value={addFormData.pin}
                          onChange={(e) => setAddFormData({ ...addFormData, pin: e.target.value })}
                          className="w-full p-2 bg-purple-50/50 border border-purple-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-purple-700 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Saldo Inicial en Cuenta ($ COP)</label>
                        <input
                          type="number"
                          value={addFormData.balance}
                          onChange={(e) => setAddFormData({ ...addFormData, balance: parseFloat(e.target.value) || 0 })}
                          className="w-full p-2 bg-purple-50/50 border border-purple-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-purple-700 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* SECCIÓN 2: PARÁMETROS DEL CRÉDITO */}
                  <div className="pt-3 border-t border-purple-100">
                    <h3 className="text-xs font-black text-purple-950 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-purple-800" />
                      2. Condiciones del Crédito
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Fecha de Otorgamiento *</label>
                        <input
                          type="date"
                          required
                          value={addFormData.loanStartDate}
                          onChange={(e) => setAddFormData({ ...addFormData, loanStartDate: e.target.value })}
                          className="w-full p-2 bg-purple-50/50 border border-purple-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-purple-700 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Modalidad de Pago</label>
                        <select
                          value={addFormData.loanPaymentFrequency}
                          onChange={(e) => setAddFormData({ ...addFormData, loanPaymentFrequency: e.target.value as any })}
                          className="w-full p-2 bg-purple-50/50 border border-purple-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-purple-700 outline-none cursor-pointer"
                        >
                          <option value="quincenal">Quincenal (Pagos cada 15 días)</option>
                          <option value="mensual">Mensual (Pagos cada 30 días / al mes)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Plazo de Pago (Ciclo)</label>
                        <select
                          value={addFormData.paymentTermDays}
                          onChange={(e) => setAddFormData({ ...addFormData, paymentTermDays: parseInt(e.target.value) || 30 })}
                          className="w-full p-2 bg-purple-50/50 border border-purple-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-purple-700 outline-none cursor-pointer"
                        >
                          <option value={15}>15 Días (1 Quincena)</option>
                          <option value={30}>30 Días (2 Quincenas o 1 Mes)</option>
                          <option value={45}>45 Días (3 Quincenas)</option>
                          <option value={60}>60 Días (4 Quincenas o 2 Meses)</option>
                          <option value={90}>90 Días (6 Quincenas o 3 Meses)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Monto Otorgado / Deuda Inicial ($ COP)</label>
                        <input
                          type="number"
                          max="5000000"
                          value={addFormData.creditUsed}
                          onChange={(e) => setAddFormData({ ...addFormData, creditUsed: parseFloat(e.target.value) || 0 })}
                          className="w-full p-2 bg-purple-50/50 border border-purple-200 rounded-xl text-xs font-mono font-bold text-amber-900 focus:ring-2 focus:ring-purple-700 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Cupo Línea de Crédito (Máx. $5.000.000 COP)</label>
                        <input
                          type="number"
                          max="5000000"
                          value={addFormData.creditLimit}
                          onChange={(e) => setAddFormData({ ...addFormData, creditLimit: Math.min(5000000, parseFloat(e.target.value) || 0) })}
                          className="w-full p-2 bg-purple-50/50 border border-purple-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-purple-700 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Resumen Calculado en Vivo */}
                  <div className="p-3 bg-purple-950 text-white rounded-2xl space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-purple-200">Plan Calculado:</span>
                      <span className="font-mono bg-white/10 px-2 py-0.5 rounded font-bold">{addComputedInfo.frequencyLabel}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs pt-1 border-t border-white/10">
                      <span className="text-purple-300">Cuota: <strong>${addComputedInfo.installmentAmount.toLocaleString('es-CO')}</strong></span>
                      <span className="text-purple-300">Vence: <strong>{addComputedInfo.dueDate}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-purple-100">
                  <button
                    type="button"
                    onClick={() => setIsAddingUser(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-purple-950 hover:bg-purple-900 text-white font-extrabold rounded-xl text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Crear Cliente</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* MODAL EDITAR CAPITAL */}
      {isEditingCapital && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full border border-purple-100 shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-purple-100 pb-3">
              <h3 className="text-base font-black text-purple-950 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-purple-800" />
                Capital Administrativo
              </h3>
              <button
                type="button"
                onClick={() => setIsEditingCapital(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Ajusta el capital global de la entidad. Se actualiza automáticamente al registrar pagos o desembolsar préstamos.
            </p>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Monto Capital ($ COP)</label>
              <input
                type="number"
                value={capitalInputValue}
                onChange={(e) => setCapitalInputValue(e.target.value)}
                className="w-full p-2.5 bg-purple-50 border border-purple-200 rounded-xl font-mono text-base font-bold text-purple-950 focus:outline-none focus:ring-2 focus:ring-purple-700"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setCapitalInputValue((prev) => (parseFloat(prev || '0') + 5000000).toString())}
                className="px-3 py-2 bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold rounded-xl hover:bg-emerald-100 transition-colors cursor-pointer"
              >
                + $5.000.000 (Abono)
              </button>
              <button
                type="button"
                onClick={() => setCapitalInputValue((prev) => Math.max(0, parseFloat(prev || '0') - 5000000).toString())}
                className="px-3 py-2 bg-rose-50 text-rose-800 border border-rose-200 font-bold rounded-xl hover:bg-rose-100 transition-colors cursor-pointer"
              >
                - $5.000.000 (Desembolso)
              </button>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-purple-100">
              <button
                type="button"
                onClick={() => setIsEditingCapital(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const num = parseFloat(capitalInputValue || '0');
                  onUpdateAdminCapital(num);
                  setIsEditingCapital(false);
                }}
                className="px-4 py-2 bg-purple-950 text-white font-extrabold rounded-xl text-xs hover:bg-purple-900 shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Guardar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMACIÓN ELIMINAR CLIENTE */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full border border-rose-100 shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-slate-900">
                ¿Eliminar cliente definitivamente?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Esta acción eliminará de forma permanente al cliente y todos sus registros.
              </p>
            </div>

            <div className="bg-rose-50/60 border border-rose-100 rounded-2xl p-3 text-xs space-y-0.5 font-mono">
              <p className="font-extrabold text-rose-950 font-sans text-sm">{userToDelete.name}</p>
              <p className="text-slate-600">CC: <strong>{userToDelete.cedula}</strong></p>
              <p className="text-slate-600">Email: {userToDelete.email}</p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteUser}
                className="flex-1 py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl text-xs transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Eliminar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CARGA MASIVA DE CLIENTES */}
      <BulkUploadModal
        isOpen={isBulkUploadOpen}
        existingUsers={users}
        onClose={() => setIsBulkUploadOpen(false)}
        onConfirmImport={handleBulkUploadConfirm}
      />
    </div>
  );
};
