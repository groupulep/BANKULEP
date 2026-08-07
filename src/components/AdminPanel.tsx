import React, { useState } from 'react';
import { User, Transaction, LoanRequest, CaptchaLog, SecuritySettings } from '../types';
import {
  Users,
  ShieldCheck,
  ShieldAlert,
  Search,
  CheckCircle2,
  XCircle,
  KeyRound,
  DollarSign,
  Activity,
  Sliders,
  Building2,
  Lock,
  Unlock,
  AlertTriangle,
  FileCheck,
  RefreshCw,
  BarChart3,
  SlidersHorizontal,
  CreditCard,
  Percent,
  Clock,
  X,
  Save,
  Phone,
  Mail,
  Edit3,
  UserPlus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Check
} from 'lucide-react';

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
  transactions,
  loans,
  captchaLogs,
  securitySettings,
  adminCapital,
  onUpdateAdminCapital,
  onUpdateUser,
  onAddUser,
  onDeleteUser,
  onDeleteCaptchaLog,
  onUpdateUserStatus,
  onResetUserPin,
  onUpdateCreditLimit,
  onUpdateLoanStatus,
  onUpdateSecuritySettings,
  onAddTransaction,
  onAdjustAdminCapital,
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'payments' | 'captcha'>('users');
  const [userSearch, setUserSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedUserIds, setExpandedUserIds] = useState<Record<string, boolean>>({});
  const [customPaymentAmounts, setCustomPaymentAmounts] = useState<Record<string, string>>({});
  const [paymentNotice, setPaymentNotice] = useState<string | null>(null);

  const toggleExpandUser = (userId: string) => {
    setExpandedUserIds((prev) => ({ ...prev, [userId]: !prev[userId] }));
  };

  const handleMarkPaymentAsPaid = (u: User, type: 'cuota' | 'total' | 'custom', amountToPay?: number) => {
    const payAmount =
      type === 'total'
        ? u.creditUsed
        : amountToPay !== undefined
        ? amountToPay
        : Math.min(u.creditUsed, u.loanQuota ?? 1250000);

    if (payAmount <= 0) {
      alert(`El monto a pagar debe ser mayor a 0.`);
      return;
    }

    if (payAmount > u.creditUsed) {
      alert(`El monto a pagar ($${payAmount.toLocaleString('es-CO')} COP) no puede ser mayor que la deuda del cliente ($${u.creditUsed.toLocaleString('es-CO')} COP).`);
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
      `✅ Se registró exitosamente el pago de ${
        type === 'total' ? 'TOTALIDAD' : type === 'custom' ? 'ABONO PERSONALIZADO' : 'CUOTA'
      } para ${u.name} ($${payAmount.toLocaleString('es-CO')} COP).`
    );

    if (type === 'custom') {
      setCustomPaymentAmounts((prev) => ({ ...prev, [u.id]: '' }));
    }

    setTimeout(() => {
      setPaymentNotice(null);
    }, 5000);
  };

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
    balance: 0,
    creditLimit: 1000000,
    clabe: '',
    pin: '1234',
    loanQuota: 1250000,
    loanQuotasTotal: 12,
    dailyInterestRate: 0.5,
    paymentTermDays: 30,
  });

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addFormData.name || !addFormData.cedula) return;
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newClabe = addFormData.clabe || `63818000${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    const newUser: User = {
      id: `usr_client_${Date.now()}`,
      name: addFormData.name,
      cedula: addFormData.cedula,
      email: addFormData.email || `cliente_${randomSuffix}@crediulep.com`,
      phone: addFormData.phone || '3169008561',
      clabe: newClabe,
      cpfOrClabe: newClabe,
      accountNumber: newClabe.slice(-10),
      pin: addFormData.pin || '1234',
      role: 'client',
      status: 'active',
      balance: Number(addFormData.balance) || 0,
      creditLimit: Number(addFormData.creditLimit) || 1000000,
      creditUsed: 0,
      createdAt: new Date().toISOString().split('T')[0],
      loanQuota: Number(addFormData.loanQuota) || 1250000,
      loanQuotasTotal: Number(addFormData.loanQuotasTotal) || 12,
      dailyInterestRate: Number(addFormData.dailyInterestRate) || 0.5,
      paymentTermDays: Number(addFormData.paymentTermDays) || 30,
    };
    onAddUser(newUser);
    setIsAddingUser(false);
    setAddFormData({
      name: '',
      cedula: '',
      email: '',
      phone: '3169008561',
      balance: 0,
      creditLimit: 1000000,
      clabe: '',
      pin: '1234',
      loanQuota: 1250000,
      loanQuotasTotal: 12,
      dailyInterestRate: 0.5,
      paymentTermDays: 30,
    });
  };

  // Single Edit Modal State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    cedula: '',
    email: '',
    phone: '',
    clabe: '',
    pin: '',
    status: 'active' as 'active' | 'blocked' | 'pending',
    balance: 0,
    creditLimit: 0,
    creditUsed: 0,
    loanQuota: 0,
    loanQuotasTotal: 12,
    dailyInterestRate: 0.5,
    paymentTermDays: 30,
  });

  const openEditModal = (u: User) => {
    setEditingUser(u);
    setFormData({
      name: u.name || '',
      cedula: u.cedula || '',
      email: u.email || '',
      phone: u.phone || '3169008561',
      clabe: u.clabe || '',
      pin: u.pin || '1234',
      status: u.status,
      balance: u.balance || 0,
      creditLimit: u.creditLimit || 0,
      creditUsed: u.creditUsed || 0,
      loanQuota: u.loanQuota ?? 1250000,
      loanQuotasTotal: u.loanQuotasTotal ?? 12,
      dailyInterestRate: u.dailyInterestRate ?? 0.5,
      paymentTermDays: u.paymentTermDays ?? 30,
    });
  };

  const handleSaveEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    const updated: User = {
      ...editingUser,
      name: formData.name,
      cedula: formData.cedula,
      email: formData.email,
      phone: formData.phone,
      clabe: formData.clabe,
      pin: formData.pin,
      status: formData.status,
      balance: Number(formData.balance) || 0,
      creditLimit: Number(formData.creditLimit) || 0,
      creditUsed: Number(formData.creditUsed) || 0,
      loanQuota: Number(formData.loanQuota) || 0,
      loanQuotasTotal: Number(formData.loanQuotasTotal) || 0,
      dailyInterestRate: Number(formData.dailyInterestRate) || 0,
      paymentTermDays: Number(formData.paymentTermDays) || 0,
    };
    onUpdateUser(updated);
    setEditingUser(null);
  };

  // Calculate global statistics
  const totalCapital = users.reduce((sum, u) => sum + u.balance, 0);
  const totalCreditAllocated = users.reduce((sum, u) => sum + u.creditLimit, 0);
  const totalClientsCount = users.filter((u) => u.role === 'client').length;
  const pendingLoansCount = loans.filter((l) => l.status === 'pending').length;
  const successfulCaptchas = captchaLogs.filter((c) => c.success).length;
  const captchaPassRate = captchaLogs.length > 0 ? Math.round((successfulCaptchas / captchaLogs.length) * 100) : 100;

  // Filtered users
  const filteredUsers = users.filter((u) => {
    const matchesRole = u.role === 'client';
    const matchesSearch =
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.clabe.includes(userSearch) ||
      u.cedula.includes(userSearch);
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
    return matchesRole && matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Admin Hero Header */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-purple-900 rounded-3xl p-6 text-white shadow-xl border border-purple-800 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs uppercase font-bold tracking-widest bg-purple-800 text-purple-200 px-3 py-1 rounded-full border border-purple-700">
                Panel de Administración Central
              </span>
              <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Sistema Operativo SPEI
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Control CrediULEP
            </h1>
            <p className="text-xs text-purple-200 mt-1">
              Supervisión de clientes, monitoreo de transacciones SPEI y auditoría de seguridad CAPTCHA.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-white/10 p-4 rounded-2xl border border-white/10 backdrop-blur-md">
            <div>
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] text-purple-200 uppercase font-semibold">Capital Administrado</p>
                <button
                  type="button"
                  onClick={() => {
                    setCapitalInputValue(adminCapital.toString());
                    setIsEditingCapital(true);
                  }}
                  className="text-amber-300 hover:text-amber-200 transition-colors p-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs flex items-center gap-1 font-bold"
                  title="Editar Capital Administrativo"
                >
                  ✏️
                </button>
              </div>
              <p className="text-2xl font-black font-mono text-white mt-0.5">
                ${adminCapital.toLocaleString('es-CO')} COP
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-purple-100 shadow-sm space-y-1">
          <div className="flex justify-between items-center text-purple-800">
            <span className="text-xs font-bold uppercase text-slate-500">Clientes Totales</span>
            <Users className="w-4 h-4" />
          </div>
          <p className="text-2xl font-extrabold text-purple-950 font-mono">{totalClientsCount}</p>
          <p className="text-[10px] text-slate-500 font-medium">Cuentas digitales registradas</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-purple-100 shadow-sm space-y-1">
          <div className="flex justify-between items-center text-emerald-600">
            <span className="text-xs font-bold uppercase text-slate-500">Cuentas Activas</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <p className="text-2xl font-extrabold text-purple-950 font-mono">
            {users.filter((u) => u.role === 'client' && u.status === 'active').length}
          </p>
          <p className="text-[10px] text-emerald-700 font-semibold">Cuentas sin restricciones</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-purple-100 shadow-sm space-y-1">
          <div className="flex justify-between items-center text-emerald-600">
            <span className="text-xs font-bold uppercase text-slate-500">Crédito Otorgado</span>
            <DollarSign className="w-4 h-4" />
          </div>
          <p className="text-2xl font-extrabold text-purple-950 font-mono">
            ${(totalCreditAllocated / 1000000).toFixed(1)}M <span className="text-xs">COP</span>
          </p>
          <p className="text-[10px] text-slate-500 font-medium">Línea aprobada global</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-purple-100 shadow-sm space-y-1">
          <div className="flex justify-between items-center text-purple-700">
            <span className="text-xs font-bold uppercase text-slate-500">CAPTCHA Health</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold text-purple-950 font-mono">{captchaPassRate}%</p>
          <p className="text-[10px] text-slate-500 font-medium">Tasa de éxito de validación</p>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-purple-100">
        {[
          { id: 'users', label: 'Gestión de Clientes', icon: Users },
          { id: 'payments', label: 'Pagos de Cuotas o Total', icon: CreditCard },
          { id: 'captcha', label: 'Seguridad y CAPTCHA', icon: ShieldCheck }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-purple-950 text-white shadow-md'
                  : 'bg-white text-purple-950 hover:bg-purple-50 border border-purple-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: GESTIÓN DE CLIENTES */}
      {activeTab === 'users' && (
        <div className="bg-white p-6 rounded-3xl border border-purple-100 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-extrabold text-purple-950">Directorio de Cuentas de Clientes</h2>
              <button
                type="button"
                onClick={() => setIsAddingUser(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-950 hover:bg-purple-900 text-white rounded-xl font-bold text-xs transition-all shadow-sm"
              >
                <UserPlus className="w-3.5 h-3.5 text-purple-300" />
                <span>Agregar Cliente</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-purple-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Buscar cliente, email o CLABE..."
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-purple-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-700"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-purple-200 rounded-xl text-xs font-bold text-purple-950 focus:outline-none"
              >
                <option value="all">Todos los estados</option>
                <option value="active">Activos</option>
                <option value="blocked">Bloqueados</option>
                <option value="pending">Pendientes</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-purple-50/80 text-purple-950 font-extrabold uppercase tracking-wider border-y border-purple-100">
                <tr>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Saldo Disponible</th>
                  <th className="py-3 px-4">Línea de Crédito</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones de Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-50">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-purple-50/30 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-bold text-purple-950">{u.name}</p>
                      <p className="text-[11px] text-slate-500 font-mono">{u.email} • CLABE: {u.clabe}</p>
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      ${u.balance.toLocaleString('es-CO')}
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-slate-800">
                      ${u.creditLimit.toLocaleString('es-CO')} COP
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                          u.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : u.status === 'blocked'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {u.status === 'active' ? 'Activo' : u.status === 'blocked' ? 'Bloqueado' : 'Pendiente'}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setActiveTab('payments');
                            setExpandedUserIds({ [u.id]: true });
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-950 border border-purple-200 rounded-xl font-bold text-xs transition-all shadow-sm"
                          title="Pagos de Cuotas o Total"
                        >
                          <CreditCard className="w-3.5 h-3.5 text-purple-800" />
                          <span>Pagos</span>
                        </button>
                        <button
                          onClick={() => openEditModal(u)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-950 hover:bg-purple-900 text-white rounded-xl font-bold text-xs transition-all shadow-sm"
                        >
                          <Sliders className="w-3.5 h-3.5 text-purple-300" />
                          <span>Editar Cliente</span>
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`¿Está seguro de eliminar al cliente ${u.name}?`)) {
                              onDeleteUser(u.id);
                            }
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 rounded-xl font-bold text-xs transition-all shadow-sm"
                          title="Eliminar Cliente"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          <span>Eliminar</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: PAGOS DE CUOTAS O TOTAL */}
      {activeTab === 'payments' && (
        <div className="bg-white p-6 rounded-3xl border border-purple-100 shadow-sm space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-100 pb-4">
            <div>
              <h2 className="text-xl font-extrabold text-purple-950 flex items-center gap-2">
                <CreditCard className="w-6 h-6 text-purple-800" />
                Directorio de Cuentas - Pagos de Cuotas o Total
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                Consulta los pagos pendientes de cada cliente y registra la recepción de cuotas o liquidaciones totales mediante el botón "Ya pagó".
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-purple-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Buscar cliente, cédula o CLABE..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-purple-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-700"
              />
            </div>
          </div>

          {/* Payment Action Notice Banner */}
          {paymentNotice && (
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center justify-between text-xs text-emerald-900 font-bold animate-in fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{paymentNotice}</span>
              </div>
              <button
                onClick={() => setPaymentNotice(null)}
                className="text-emerald-950 hover:underline text-xs"
              >
                Cerrar
              </button>
            </div>
          )}

          {/* Directory List of Client Accounts */}
          <div className="space-y-4">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs font-medium">
                No se encontraron cuentas de clientes registradas.
              </div>
            ) : (
              filteredUsers.map((u) => {
                const isExpanded = !!expandedUserIds[u.id];
                const cuotaAmount = Math.min(u.creditUsed, u.loanQuota ?? 1250000);
                const isDebtPaid = u.creditUsed <= 0;

                return (
                  <div
                    key={u.id}
                    className="bg-slate-50/70 border border-purple-100/80 rounded-3xl p-5 space-y-4 transition-all hover:border-purple-200"
                  >
                    {/* Top Client Info Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 bg-gradient-to-br from-purple-900 to-indigo-950 text-white font-black rounded-2xl flex items-center justify-center text-sm shadow-sm shrink-0">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-extrabold text-base text-purple-950">{u.name}</h3>
                            <span
                              className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                                u.status === 'active'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : u.status === 'blocked'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {u.status === 'active' ? 'Activo' : u.status === 'blocked' ? 'Bloqueado' : 'Pendiente'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 font-mono mt-0.5">
                            Cédula: <strong className="text-purple-900 font-bold">{u.cedula}</strong> • Tel: {u.phone || '3169008561'} • CLABE: {u.clabe}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 justify-between sm:justify-end">
                        <div className="text-right font-mono">
                          <p className="text-[10px] uppercase font-bold text-slate-400">Deuda Actual</p>
                          <p className={`text-base font-black ${u.creditUsed > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                            ${u.creditUsed.toLocaleString('es-CO')} COP
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleExpandUser(u.id)}
                          className={`px-4 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 transition-all shadow-sm ${
                            isExpanded
                              ? 'bg-purple-950 text-white shadow-purple-950/20'
                              : 'bg-white text-purple-950 hover:bg-purple-100 border border-purple-200'
                          }`}
                        >
                          <span>{isExpanded ? 'Ocultar Pagos' : 'Desplegar Pagos Pendientes'}</span>
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4 text-purple-700" />}
                        </button>
                      </div>
                    </div>

                    {/* Metrics Bar */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-white rounded-2xl text-xs border border-purple-100/60 shadow-2xs">
                      <div>
                        <p className="text-slate-400 font-bold text-[10px] uppercase">Deuda Pendiente</p>
                        <p className="font-extrabold font-mono text-purple-950 mt-0.5">
                          ${u.creditUsed.toLocaleString('es-CO')} COP
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-400 font-bold text-[10px] uppercase">Cuota Mensual</p>
                        <p className="font-extrabold font-mono text-indigo-900 mt-0.5">
                          ${(u.loanQuota ?? 1250000).toLocaleString('es-CO')} COP
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-400 font-bold text-[10px] uppercase">Límite Aprobado</p>
                        <p className="font-bold font-mono text-slate-700 mt-0.5">
                          ${u.creditLimit.toLocaleString('es-CO')} COP
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-400 font-bold text-[10px] uppercase">Saldo Disponible</p>
                        <p className="font-bold font-mono text-emerald-700 mt-0.5">
                          ${u.balance.toLocaleString('es-CO')} COP
                        </p>
                      </div>
                    </div>

                    {/* Expanded Pending Payments Options Dropdown */}
                    {isExpanded && (
                      <div className="pt-3 border-t border-purple-100 space-y-3 animate-in fade-in duration-150">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-black uppercase tracking-wider text-purple-950 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                            Opciones de Pago Pendientes para esta cuenta:
                          </h4>
                          <span className="text-[11px] text-slate-500 font-medium">
                            {isDebtPaid ? '✅ Esta cuenta se encuentra al día' : '⚠️ Saldo pendiente de pago'}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Option A: Pago de Cuota Programada */}
                          <div className="bg-white p-4 rounded-2xl border border-purple-200 shadow-sm flex flex-col justify-between gap-3">
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-bold text-xs text-purple-950">1. Pago de Cuota Programada</span>
                                <span
                                  className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                    !isDebtPaid ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                                  }`}
                                >
                                  {!isDebtPaid ? 'Cuota Pendiente' : 'Pagado'}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500">
                                Abono equivalente a la cuota periódica configurada.
                              </p>
                              <p className="text-xl font-black font-mono text-purple-950 mt-2">
                                ${cuotaAmount.toLocaleString('es-CO')} COP
                              </p>
                            </div>

                            <button
                              type="button"
                              disabled={isDebtPaid}
                              onClick={() => handleMarkPaymentAsPaid(u, 'cuota')}
                              className={`w-full py-3 px-4 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all shadow-sm ${
                                !isDebtPaid
                                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-900/10 active:scale-98'
                                  : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                              }`}
                            >
                              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                              <span>{!isDebtPaid ? 'Ya pagó Cuota' : 'Pagado'}</span>
                            </button>
                          </div>

                          {/* Option B: Liquidación Total */}
                          <div className="bg-white p-4 rounded-2xl border border-purple-200 shadow-sm flex flex-col justify-between gap-3">
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-bold text-xs text-purple-950">2. Liquidación de Deuda Total</span>
                                <span
                                  className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                    !isDebtPaid ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                                  }`}
                                >
                                  {!isDebtPaid ? 'Deuda Pendiente' : 'Totalmente Pagado'}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500">
                                Cancela el 100% de la deuda utilizada del crédito.
                              </p>
                              <p className="text-xl font-black font-mono text-purple-950 mt-2">
                                ${u.creditUsed.toLocaleString('es-CO')} COP
                              </p>
                            </div>

                            <button
                              type="button"
                              disabled={isDebtPaid}
                              onClick={() => handleMarkPaymentAsPaid(u, 'total')}
                              className={`w-full py-3 px-4 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all shadow-sm ${
                                !isDebtPaid
                                  ? 'bg-purple-950 hover:bg-purple-900 text-white shadow-purple-950/20 active:scale-98'
                                  : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                              }`}
                            >
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              <span>{!isDebtPaid ? 'Ya pagó Total' : 'Pagado'}</span>
                            </button>
                          </div>

                          {/* Option C: Abono Personalizado */}
                          <div className="bg-white p-4 rounded-2xl border border-purple-200 shadow-sm flex flex-col justify-between gap-3">
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-bold text-xs text-purple-950">3. Abono Personalizado</span>
                                <span
                                  className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                    !isDebtPaid ? 'bg-indigo-100 text-indigo-800' : 'bg-emerald-100 text-emerald-800'
                                  }`}
                                >
                                  {!isDebtPaid ? 'Monto Libre' : 'Pagado'}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 mb-2">
                                Ingresa un monto específico abonado por el cliente.
                              </p>

                              <div className="relative">
                                <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">$</span>
                                <input
                                  type="number"
                                  disabled={isDebtPaid}
                                  value={customPaymentAmounts[u.id] || ''}
                                  onChange={(e) =>
                                    setCustomPaymentAmounts((prev) => ({ ...prev, [u.id]: e.target.value }))
                                  }
                                  placeholder="Ej. 500000"
                                  className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-purple-200 rounded-xl text-xs font-mono font-bold text-purple-950 focus:outline-none focus:ring-2 focus:ring-purple-700 disabled:opacity-50"
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
                              className={`w-full py-3 px-4 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all shadow-sm ${
                                !isDebtPaid && parseFloat(customPaymentAmounts[u.id] || '0') > 0
                                  ? 'bg-indigo-900 hover:bg-indigo-950 text-white shadow-indigo-950/20 active:scale-98'
                                  : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                              }`}
                            >
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              <span>{!isDebtPaid ? 'Ya pagó Abono' : 'Pagado'}</span>
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

      {/* MODAL DE EDICIÓN INTEGRAL DE CLIENTE */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-purple-100 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-purple-900 text-white p-6 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold tracking-widest bg-purple-800 text-purple-200 px-2.5 py-0.5 rounded-full border border-purple-700">
                    Edición de Parámetros y Acciones de Admin
                  </span>
                </div>
                <h2 className="text-xl font-extrabold mt-1">{editingUser.name}</h2>
                <p className="text-xs text-purple-200 font-mono">Cédula: {editingUser.cedula} • ID: {editingUser.id}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditUser} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* 1. Bloquear y Activar */}
              <div className="bg-purple-50/60 p-4 rounded-2xl border border-purple-100 space-y-3">
                <div className="flex items-center gap-2 text-purple-950 font-extrabold text-sm">
                  <Lock className="w-4 h-4 text-purple-800" />
                  <span>1. Estado de Cuenta (Bloquear y Activar)</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'active', label: 'Activo', color: 'bg-emerald-600 text-white border-emerald-600' },
                    { value: 'blocked', label: 'Bloqueado', color: 'bg-rose-600 text-white border-rose-600' },
                    { value: 'pending', label: 'Pendiente', color: 'bg-amber-600 text-white border-amber-600' },
                  ].map((st) => (
                    <button
                      key={st.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, status: st.value as any })}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                        formData.status === st.value
                          ? st.color + ' shadow-sm scale-[1.02]'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-purple-50'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Saldo Disponible del Cliente y Crédito */}
              <div className="bg-purple-50/60 p-4 rounded-2xl border border-purple-100 space-y-3">
                <div className="flex items-center gap-2 text-purple-950 font-extrabold text-sm">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  <span>2. Saldo Disponible del Cliente y Línea de Crédito</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Saldo Disponible (COP)</label>
                    <input
                      type="number"
                      value={formData.balance}
                      onChange={(e) => setFormData({ ...formData, balance: parseFloat(e.target.value) || 0 })}
                      className="w-full p-2.5 bg-white border border-purple-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-purple-700 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Límite de Crédito (COP)</label>
                    <input
                      type="number"
                      value={formData.creditLimit}
                      onChange={(e) => setFormData({ ...formData, creditLimit: parseFloat(e.target.value) || 0 })}
                      className="w-full p-2.5 bg-white border border-purple-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-purple-700 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Crédito Utilizado (COP)</label>
                    <input
                      type="number"
                      value={formData.creditUsed}
                      onChange={(e) => setFormData({ ...formData, creditUsed: parseFloat(e.target.value) || 0 })}
                      className="w-full p-2.5 bg-white border border-purple-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-purple-700 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Cuotas del Préstamo */}
              <div className="bg-purple-50/60 p-4 rounded-2xl border border-purple-100 space-y-3">
                <div className="flex items-center gap-2 text-purple-950 font-extrabold text-sm">
                  <CreditCard className="w-4 h-4 text-purple-800" />
                  <span>3. Cuotas del Préstamo</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Valor de la Cuota (COP)</label>
                    <input
                      type="number"
                      value={formData.loanQuota}
                      onChange={(e) => setFormData({ ...formData, loanQuota: parseFloat(e.target.value) || 0 })}
                      className="w-full p-2.5 bg-white border border-purple-200 rounded-xl text-xs font-mono font-bold text-purple-950 focus:ring-2 focus:ring-purple-700 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Número Total de Cuotas</label>
                    <input
                      type="number"
                      value={formData.loanQuotasTotal}
                      onChange={(e) => setFormData({ ...formData, loanQuotasTotal: parseInt(e.target.value) || 0 })}
                      className="w-full p-2.5 bg-white border border-purple-200 rounded-xl text-xs font-mono font-bold text-purple-950 focus:ring-2 focus:ring-purple-700 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* 4. Porcentaje de préstamo por día */}
              <div className="bg-purple-50/60 p-4 rounded-2xl border border-purple-100 space-y-3">
                <div className="flex items-center gap-2 text-purple-950 font-extrabold text-sm">
                  <Percent className="w-4 h-4 text-indigo-700" />
                  <span>4. Porcentaje de Préstamo por Día (% / día)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Tasa de Interés Diario (%)</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        value={formData.dailyInterestRate}
                        onChange={(e) => setFormData({ ...formData, dailyInterestRate: parseFloat(e.target.value) || 0 })}
                        className="w-full p-2.5 bg-white border border-purple-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-purple-700 outline-none pr-8"
                      />
                      <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-500">%</span>
                    </div>
                  </div>
                  <div className="flex items-center text-xs text-slate-500 italic bg-white p-3 rounded-xl border border-purple-100">
                    Tasa de interés diaria aplicada sobre el saldo activo o financiado del cliente.
                  </div>
                </div>
              </div>

              {/* 5. Edición de Datos Personales del Cliente */}
              <div className="bg-purple-50/60 p-4 rounded-2xl border border-purple-100 space-y-3">
                <div className="flex items-center gap-2 text-purple-950 font-extrabold text-sm">
                  <Users className="w-4 h-4 text-purple-800" />
                  <span>5. Edición de Datos Personales del Cliente</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Nombre Completo</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full p-2.5 bg-white border border-purple-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-purple-700 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Número de Cédula / ID</label>
                    <input
                      type="text"
                      value={formData.cedula}
                      onChange={(e) => setFormData({ ...formData, cedula: e.target.value })}
                      className="w-full p-2.5 bg-white border border-purple-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-purple-700 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Correo Electrónico</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full p-2.5 bg-white border border-purple-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-purple-700 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Teléfono Móvil</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full p-2.5 bg-white border border-purple-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-purple-700 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Clave de Acceso / NIP</label>
                    <input
                      type="text"
                      value={formData.pin}
                      onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                      className="w-full p-2.5 bg-white border border-purple-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-purple-700 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">CLABE / Cuenta Interbancaria</label>
                    <input
                      type="text"
                      value={formData.clabe}
                      onChange={(e) => setFormData({ ...formData, clabe: e.target.value })}
                      className="w-full p-2.5 bg-white border border-purple-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-purple-700 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* 6. Tiempos de pago */}
              <div className="bg-purple-50/60 p-4 rounded-2xl border border-purple-100 space-y-3">
                <div className="flex items-center gap-2 text-purple-950 font-extrabold text-sm">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  <span>6. Tiempos y Plazo de Pago</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Plazo de Pago (Días)</label>
                    <input
                      type="number"
                      value={formData.paymentTermDays}
                      onChange={(e) => setFormData({ ...formData, paymentTermDays: parseInt(e.target.value) || 0 })}
                      className="w-full p-2.5 bg-white border border-purple-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-purple-700 outline-none"
                    />
                  </div>
                  <div className="flex items-center text-xs text-slate-500 italic bg-white p-3 rounded-xl border border-purple-100">
                    Define el número de días del ciclo de pago visible en la cuenta del cliente.
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-purple-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded-xl text-xs transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-purple-950 hover:bg-purple-900 text-white font-extrabold rounded-xl text-xs transition-all shadow-md flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar Cambios</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL AGREGAR CLIENTE */}
      {isAddingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-purple-100 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-purple-900 text-white p-6 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest bg-purple-800 text-purple-200 px-2.5 py-0.5 rounded-full border border-purple-700">
                  Nuevo Registro de Cuenta
                </span>
                <h2 className="text-xl font-extrabold mt-1">Agregar Nuevo Cliente</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsAddingUser(false)}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    value={addFormData.name}
                    onChange={(e) => setAddFormData({ ...addFormData, name: e.target.value })}
                    placeholder="Ej. Juan Pérez"
                    className="w-full p-2.5 bg-white border border-purple-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-purple-700 outline-none"
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
                    className="w-full p-2.5 bg-white border border-purple-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-purple-700 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    value={addFormData.email}
                    onChange={(e) => setAddFormData({ ...addFormData, email: e.target.value })}
                    placeholder="cliente@ejemplo.com"
                    className="w-full p-2.5 bg-white border border-purple-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-purple-700 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Teléfono Móvil</label>
                  <input
                    type="text"
                    value={addFormData.phone}
                    onChange={(e) => setAddFormData({ ...addFormData, phone: e.target.value })}
                    placeholder="3169008561"
                    className="w-full p-2.5 bg-white border border-purple-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-purple-700 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Saldo Inicial (COP)</label>
                  <input
                    type="number"
                    value={addFormData.balance}
                    onChange={(e) => setAddFormData({ ...addFormData, balance: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2.5 bg-white border border-purple-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-purple-700 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Límite de Crédito (COP)</label>
                  <input
                    type="number"
                    value={addFormData.creditLimit}
                    onChange={(e) => setAddFormData({ ...addFormData, creditLimit: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2.5 bg-white border border-purple-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-purple-700 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Clave / NIP (4 dígitos)</label>
                  <input
                    type="text"
                    value={addFormData.pin}
                    onChange={(e) => setAddFormData({ ...addFormData, pin: e.target.value })}
                    className="w-full p-2.5 bg-white border border-purple-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-purple-700 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Valor de la Cuota (COP)</label>
                  <input
                    type="number"
                    value={addFormData.loanQuota}
                    onChange={(e) => setAddFormData({ ...addFormData, loanQuota: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2.5 bg-white border border-purple-200 rounded-xl text-xs font-mono font-bold text-purple-950 focus:ring-2 focus:ring-purple-700 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-purple-100">
                <button
                  type="button"
                  onClick={() => setIsAddingUser(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded-xl text-xs transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-purple-950 hover:bg-purple-900 text-white font-extrabold rounded-xl text-xs transition-all shadow-md flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Crear Cliente</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDITAR CAPITAL ADMINISTRATIVO */}
      {isEditingCapital && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full border border-purple-100 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-purple-100 pb-3">
              <h3 className="text-lg font-extrabold text-purple-950 flex items-center gap-2">
                <span>✏️</span> Editar Capital Administrativo
              </h3>
              <button
                type="button"
                onClick={() => setIsEditingCapital(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Modifica el monto total de Capital Administrativo. Se incrementa automáticamente con pagos de clientes y disminuye al otorgar créditos.
            </p>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">Monto del Capital ($ COP)</label>
              <input
                type="number"
                value={capitalInputValue}
                onChange={(e) => setCapitalInputValue(e.target.value)}
                placeholder="250000000"
                className="w-full p-3 bg-purple-50 border border-purple-200 rounded-2xl font-mono text-lg font-bold text-purple-950 focus:outline-none focus:ring-2 focus:ring-purple-700"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setCapitalInputValue((prev) => (parseFloat(prev || '0') + 5000000).toString())}
                className="px-3 py-2 bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold rounded-xl hover:bg-emerald-100 transition-colors"
              >
                + $5,000,000 (Abono)
              </button>
              <button
                type="button"
                onClick={() => setCapitalInputValue((prev) => Math.max(0, parseFloat(prev || '0') - 5000000).toString())}
                className="px-3 py-2 bg-rose-50 text-rose-800 border border-rose-200 font-bold rounded-xl hover:bg-rose-100 transition-colors"
              >
                - $5,000,000 (Crédito)
              </button>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-purple-100">
              <button
                type="button"
                onClick={() => setIsEditingCapital(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-200 transition-colors"
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
                className="px-5 py-2 bg-purple-950 text-white font-extrabold rounded-xl text-xs hover:bg-purple-900 shadow-md transition-all flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>Guardar Capital</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CAPTCHA SECURITY LOGS & CONFIG */}
      {activeTab === 'captcha' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Security Rules Controls */}
          <div className="bg-white p-6 rounded-3xl border border-purple-100 shadow-sm space-y-4">
            <h3 className="text-base font-extrabold text-purple-950 flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5 text-purple-800" />
              Parámetros de Seguridad
            </h3>

            <div className="space-y-4 text-xs">
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

              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-2xl">
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

              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-2xl">
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

          {/* CAPTCHA Audit Logs */}
          <div className="md:col-span-2 bg-white p-6 rounded-3xl border border-purple-100 shadow-sm space-y-4">
            <h3 className="text-base font-extrabold text-purple-950">Registros de Verificación CAPTCHA</h3>

            <div className="divide-y divide-purple-50 text-xs">
              {captchaLogs.length === 0 ? (
                <p className="py-4 text-center text-slate-400 font-medium">No hay registros de CAPTCHA.</p>
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
                        className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${
                          log.success ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {log.success ? 'Verificado OK' : 'Fallido / Bot Bloqueado'}
                      </span>
                      <button
                        onClick={() => onDeleteCaptchaLog(log.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
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
      )}
    </div>
  );
};
