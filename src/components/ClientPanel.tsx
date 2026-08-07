import React, { useState } from 'react';
import { User, BankCard, Transaction, Cajita, LoanRequest } from '../types';
import { ReceiptModal } from './ReceiptModal';
import {
  Eye,
  EyeOff,
  TrendingUp,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  Copy,
  Check,
  CreditCard,
  Building2,
  Gift,
  Award,
  Users,
  Info,
  Calendar,
  DollarSign,
  FileText,
  MessageCircle
} from 'lucide-react';

interface ClientPanelProps {
  user: User;
  cards: BankCard[];
  transactions: Transaction[];
  cajitas: Cajita[];
  loans: LoanRequest[];
  onUpdateUser: (updatedUser: User) => void;
  onToggleFreezeCard: (cardId: string) => void;
  onRegenerateCvv: (cardId: string) => void;
  onAddTransaction: (tx: Transaction) => void;
  onCreateCajita: (cajita: Cajita) => void;
  onUpdateCajita: (cajita: Cajita) => void;
  onRequestLoan: (loan: LoanRequest) => void;
  onAdjustAdminCapital?: (delta: number) => void;
}

export const ClientPanel: React.FC<ClientPanelProps> = ({
  user,
  cards,
  transactions,
  cajitas,
  loans,
  onUpdateUser,
  onToggleFreezeCard,
  onRegenerateCvv,
  onAddTransaction,
  onCreateCajita,
  onUpdateCajita,
  onRequestLoan,
  onAdjustAdminCapital,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'pay_cuotas' | 'conocenos' | 'beneficios'>('overview');
  const [showBalance, setShowBalance] = useState(true);
  const [copiedClabe, setCopiedClabe] = useState(false);
  const [selectedReceiptTx, setSelectedReceiptTx] = useState<Transaction | null>(null);

  // Cuota Payment state
  const [cuotaOption, setCuotaOption] = useState<'full' | 'custom'>('full');
  const activeApprovedLoan = loans.find((l) => l.userId === user.id && l.status === 'approved');
  const currentLoanQuota = activeApprovedLoan?.monthlyPayment ?? user.loanQuota ?? 1250000;
  const currentLoanQuotasTotal = activeApprovedLoan?.months ?? user.loanQuotasTotal ?? 12;
  const currentDebt = user.creditUsed ?? (activeApprovedLoan?.amount ?? 5000000);

  const [customCuotaAmount, setCustomCuotaAmount] = useState(currentLoanQuota.toString());
  const [cuotaPaySuccess, setCuotaPaySuccess] = useState(false);
  const [paidCuotasCount, setPaidCuotasCount] = useState(0);

  const userTransactions = transactions.filter((t) => t.userId === user.id);

  const handleCopyClabe = () => {
    navigator.clipboard.writeText(user.clabe);
    setCopiedClabe(true);
    setTimeout(() => setCopiedClabe(false), 2000);
  };

  // Pay Cuota Action - Sends to WhatsApp 3169008561 with payment amount and cedula ONLY
  const handlePayCuota = (e: React.FormEvent) => {
    e.preventDefault();
    const payAmt =
      cuotaOption === 'full'
        ? currentDebt
        : parseFloat(customCuotaAmount || '0');

    if (!payAmt || payAmt <= 0) {
      alert('Ingresa un monto válido para pagar.');
      return;
    }

    // Message containing ONLY value to pay and cedula
    const message = `Valor a pagar: $${payAmt.toLocaleString('es-CO')} - Cédula: ${user.cedula}`;
    const whatsappUrl = `https://wa.me/573169008561?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');

    const newBalance = user.balance - payAmt;
    const newCreditUsed = Math.max(0, currentDebt - payAmt);

    const updatedUser: User = {
      ...user,
      balance: newBalance,
      creditUsed: newCreditUsed
    };

    onUpdateUser(updatedUser);
    onAdjustAdminCapital?.(payAmt);

    const newTx: Transaction = {
      id: `CUOTA-${Math.floor(100000 + Math.random() * 900000)}`,
      userId: user.id,
      type: 'transfer_out',
      amount: payAmt,
      description: `Pago de Cuota GROUP ULEP S.A.S. (#${paidCuotasCount + 1})`,
      category: 'Servicios',
      status: 'completed',
      date: new Date().toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })
    };

    onAddTransaction(newTx);
    setCuotaPaySuccess(true);
    setPaidCuotasCount((prev) => prev + 1);
    setSelectedReceiptTx(newTx);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Client Sub-Header Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-purple-800 to-slate-900 rounded-3xl p-6 text-white shadow-xl border border-purple-700/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs uppercase tracking-widest text-purple-300 font-bold bg-white/10 px-3 py-1 rounded-full border border-white/10">
                Cuenta ULEP
              </span>
              <span className="text-xs text-purple-200 font-mono">
                No. {user.accountNumber}
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              ¡Hola, {user.name.split(' ')[0]}!
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <p className="text-xs text-purple-200 font-mono">
                CLABE: <span className="font-bold text-white">{user.clabe}</span>
              </p>
              <button
                type="button"
                onClick={handleCopyClabe}
                className="text-purple-300 hover:text-white p-1 rounded-md transition-colors"
                title="Copiar CLABE"
              >
                {copiedClabe ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Quick Balance Hero Box */}
          <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/20 min-w-[260px] text-right">
            <div className="flex items-center justify-end gap-2 text-purple-200 text-xs font-semibold">
              <span>Saldo Disponible</span>
              <button
                onClick={() => setShowBalance(!showBalance)}
                className="hover:text-white transition-colors"
              >
                {showBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="text-3xl font-black font-mono tracking-tight text-white mt-1">
              {showBalance ? `$${user.balance.toLocaleString('es-CO')} COP` : '••••••••'}
            </div>
            <div className="mt-2 text-[11px] text-purple-200/90 font-medium flex items-center justify-end gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Ahorra a plazo fijo y obtén hasta un 15 % de rendimiento anual.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-purple-100">
        {[
          { id: 'overview', label: 'Resumen', icon: TrendingUp },
          { id: 'pay_cuotas', label: 'Pagar', icon: CreditCard },
          { id: 'conocenos', label: 'Conócenos', icon: Building2 },
          { id: 'beneficios', label: 'Beneficios', icon: Gift }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-purple-800 text-white shadow-md shadow-purple-900/20'
                  : 'bg-white text-purple-950 hover:bg-purple-50 border border-purple-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Content Column */}
          <div className="md:col-span-2 space-y-6">
            {/* Block 1: Línea de Crédito ULEP */}
            <div className="bg-white p-6 rounded-3xl border border-purple-100 shadow-sm space-y-5 text-purple-950">
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-lg text-purple-950">Línea de Crédito ULEP</span>
                <span className="bg-purple-100 text-purple-800 font-semibold font-mono px-2.5 py-1 rounded-full text-[10px]">
                  GROUP ULEP S.A.S.
                </span>
              </div>

              <div>
                <div className="flex justify-between items-baseline">
                  <p className="text-3xl font-black font-mono text-purple-950">
                    ${(user.creditLimit - user.creditUsed).toLocaleString('es-CO')}{' '}
                    <span className="text-xs font-normal text-slate-500">disponible</span>
                  </p>
                </div>
                <div className="w-full bg-purple-100 rounded-full h-3 mt-2 overflow-hidden">
                  <div
                    className="bg-purple-800 h-3 rounded-full transition-all"
                    style={{ width: `${(user.creditUsed / user.creditLimit) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-500 mt-2 font-mono font-medium">
                  <span>Usado: ${user.creditUsed.toLocaleString('es-CO')} COP</span>
                  <span>Límite Total: ${user.creditLimit.toLocaleString('es-CO')} COP</span>
                </div>
              </div>

              {/* Circular Indicators for Debt Owed and Payment Term */}
              <div className="flex items-center justify-around py-4 gap-4 border-t border-b border-purple-100 bg-purple-50/50 rounded-2xl">
                {/* Circle 1: Cuánto se debe */}
                <div className="w-32 h-32 rounded-full bg-white border-2 border-amber-400 flex flex-col items-center justify-center text-center p-2 shadow-sm group hover:scale-105 transition-transform">
                  <span className="text-[10px] font-extrabold text-purple-950 uppercase tracking-tight">Cuánto se debe</span>
                  <p className="text-sm font-black font-mono text-amber-600 leading-tight mt-0.5">
                    ${currentDebt.toLocaleString('es-CO')}
                  </p>
                  <span className="text-[9px] text-slate-500 font-mono">COP</span>
                </div>

                {/* Circle 2: En cuánto tiempo se debe pagar */}
                <div className="w-32 h-32 rounded-full bg-white border-2 border-emerald-500 flex flex-col items-center justify-center text-center p-2 shadow-sm group hover:scale-105 transition-transform">
                  <span className="text-[10px] font-extrabold text-purple-950 uppercase tracking-tight">Tiempo a Pagar</span>
                  <p className="text-base font-black text-emerald-700 leading-tight mt-0.5">
                    {user.paymentTermDays ?? 30} Días
                  </p>
                  <span className="text-[9px] text-emerald-600 font-medium">Hasta 15 Ago</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-600 font-medium text-sm">Próxima cuota mensual:</span>
                <span className="font-extrabold text-purple-950 font-mono text-base">
                  ${currentLoanQuota.toLocaleString('es-CO')} COP
                </span>
              </div>

              <button
                onClick={() => {
                  setActiveTab('pay_cuotas');
                }}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3.5 px-4 rounded-2xl text-sm transition-all text-center flex items-center justify-center gap-2 shadow-md shadow-emerald-900/10"
              >
                <CreditCard className="w-5 h-5" />
                <span>Ir a Pagar Cuotas de Crédito</span>
              </button>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Information Banner (Aviso Importante) */}
            <div className="bg-gradient-to-r from-purple-900 to-indigo-950 p-6 rounded-3xl text-white shadow-sm space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-white/10 px-2.5 py-1 rounded-full border border-white/10 text-purple-200">
                Aviso Importante
              </span>
              <h3 className="text-base font-bold">Mantén tus cuotas al día con GROUP ULEP S.A.S.</h3>
              <p className="text-xs text-purple-200 leading-relaxed">
                Recuerda realizar tus pagos a tiempo para mantener tu buen historial crediticio y desbloquear incrementos en tu línea de crédito.
              </p>
            </div>

            {/* Block 2: Acciones Rápidas (placed directly below Aviso Importante) */}
            <div className="bg-white p-6 rounded-3xl border border-purple-100 shadow-sm space-y-4">
              <h2 className="text-lg font-extrabold text-purple-950 flex items-center justify-between">
                <span>Acciones Rápidas</span>
                <span className="text-xs text-purple-600 font-semibold">Cuenta Digital ULEP</span>
              </h2>

              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={() => setActiveTab('pay_cuotas')}
                  className="p-4 bg-purple-50 hover:bg-purple-100/80 rounded-2xl text-purple-950 text-left transition-all border border-purple-100 group flex items-center gap-3"
                >
                  <div className="w-10 h-10 bg-purple-800 text-white rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-xs">Pagar</p>
                    <p className="text-[10px] text-slate-500">Abonos y cuotas de crédito</p>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('conocenos')}
                  className="p-4 bg-purple-50 hover:bg-purple-100/80 rounded-2xl text-purple-950 text-left transition-all border border-purple-100 group flex items-center gap-3"
                >
                  <div className="w-10 h-10 bg-indigo-700 text-white rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-xs">Conócenos</p>
                    <p className="text-[10px] text-slate-500">GROUP ULEP S.A.S.</p>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('beneficios')}
                  className="p-4 bg-purple-50 hover:bg-purple-100/80 rounded-2xl text-purple-950 text-left transition-all border border-purple-100 group flex items-center gap-3"
                >
                  <div className="w-10 h-10 bg-fuchsia-700 text-white rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Gift className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-xs">Beneficios</p>
                    <p className="text-[10px] text-slate-500">Recompensas ULEP</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PAGAR CUOTAS */}
      {activeTab === 'pay_cuotas' && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-purple-100 shadow-sm space-y-6">
            <div className="border-b border-purple-100 pb-4">
              <h2 className="text-xl font-extrabold text-purple-950 flex items-center gap-2">
                <CreditCard className="w-6 h-6 text-purple-800" />
                Pagar Cuotas de Crédito
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                Al hacer clic en pagar serás redirigido a WhatsApp (3169008561) con el monto a abonar y tu número de cédula.
              </p>
            </div>

            {cuotaPaySuccess && (
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center justify-between text-xs text-emerald-800 font-semibold animate-in fade-in">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>¡Solicitud enviada a WhatsApp 3169008561 correctamente!</span>
                </div>
                <button
                  onClick={() => setCuotaPaySuccess(false)}
                  className="text-emerald-900 underline ml-2 shrink-0"
                >
                  Realizar otro pago
                </button>
              </div>
            )}

            {/* Cuotas Summary Box */}
            <div className="bg-purple-50/70 border border-purple-100 rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <p className="text-slate-500 font-medium">Próxima Cuota (#{paidCuotasCount + 1} de {currentLoanQuotasTotal})</p>
                <p className="text-base font-black font-mono text-purple-950 mt-0.5">
                  ${currentLoanQuota.toLocaleString('es-CO')} COP
                </p>
              </div>
              <div>
                <p className="text-slate-500 font-medium">Fecha Límite de Pago</p>
                <p className="text-sm font-bold text-slate-800 mt-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-purple-700" /> 15 de Agosto, 2026
                </p>
              </div>
              <div>
                <p className="text-slate-500 font-medium">Deuda de Crédito Utilizada</p>
                <p className="text-base font-black font-mono text-slate-900 mt-0.5">
                  ${currentDebt.toLocaleString('es-CO')} COP
                </p>
              </div>
            </div>

            <form onSubmit={handlePayCuota} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Selecciona la opción de pago
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setCuotaOption('full')}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      cuotaOption === 'full'
                        ? 'bg-purple-800 text-white border-purple-800 shadow-md'
                        : 'bg-slate-50 text-slate-800 border-purple-100 hover:bg-purple-50'
                    }`}
                  >
                    <p className="text-xs font-bold">Liquidar Total</p>
                    <p className={`text-base font-mono font-black mt-1 ${cuotaOption === 'full' ? 'text-amber-300' : 'text-purple-900'}`}>
                      ${currentDebt.toLocaleString('es-CO')} COP
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCuotaOption('custom')}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      cuotaOption === 'custom'
                        ? 'bg-purple-800 text-white border-purple-800 shadow-md'
                        : 'bg-slate-50 text-slate-800 border-purple-100 hover:bg-purple-50'
                    }`}
                  >
                    <p className="text-xs font-bold">Abono Personalizado</p>
                    <p className={`text-xs mt-1 ${cuotaOption === 'custom' ? 'text-purple-200' : 'text-slate-500'}`}>
                      Ingresar monto libre
                    </p>
                  </button>
                </div>
              </div>

              {cuotaOption === 'custom' && (
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Monto a Abonar ($ COP)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    required
                    value={customCuotaAmount}
                    onChange={(e) => setCustomCuotaAmount(e.target.value)}
                    placeholder="1250000"
                    className="w-full px-4 py-3 bg-purple-50/50 border border-purple-200 rounded-2xl font-mono text-lg font-bold text-purple-950 focus:outline-none focus:ring-2 focus:ring-purple-700"
                  />
                </div>
              )}

              <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs border border-slate-200">
                <span className="text-slate-600 font-medium">Cédula del Titular:</span>
                <span className="font-bold font-mono text-purple-950">
                  {user.cedula}
                </span>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-extrabold py-4 px-6 rounded-2xl transition-all shadow-lg shadow-emerald-900/30 text-sm flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-5 h-5" />
                <span>Pagar</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 3: CONÓCENOS */}
      {activeTab === 'conocenos' && (
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header Hero Box */}
          <div className="bg-gradient-to-r from-purple-950 via-purple-900 to-slate-900 p-8 rounded-3xl text-white shadow-xl space-y-3 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
            <span className="text-xs uppercase font-bold tracking-widest bg-white/10 px-3 py-1 rounded-full border border-white/10 text-purple-200">
              GROUP ULEP S.A.S.
            </span>
            <h2 className="text-3xl font-black tracking-tight">Conócenos</h2>
            <p className="text-sm text-purple-200 max-w-2xl leading-relaxed">
              Somos una institución financiera tecnológica enfocada en otorgar créditos transparentes, seguros y accesibles para familias y emprendedores en Colombia.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-purple-100 shadow-sm space-y-3">
              <div className="w-10 h-10 bg-purple-100 text-purple-800 rounded-2xl flex items-center justify-center font-bold">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-extrabold text-purple-950">Nuestra Misión</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Facilitar el acceso al financiamiento responsable combinando plataformas digitales de respuesta inmediata con altos estándares de ciberseguridad y soporte humano constante.
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-purple-100 shadow-sm space-y-3">
              <div className="w-10 h-10 bg-purple-100 text-purple-800 rounded-2xl flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-extrabold text-purple-950">Seguridad y Garantía</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Todos tus movimientos en la plataforma GROUP ULEP S.A.S. cuentan con encriptación SSL/TLS de 256 bits, verificación dinámica biométrica y monitoreo anti-fraude 24/7.
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-purple-100 shadow-sm space-y-3">
              <div className="w-10 h-10 bg-purple-100 text-purple-800 rounded-2xl flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-base font-extrabold text-purple-950">Atención Personalizada</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Nuestro equipo administrativo atiende consultas de pagos, estados de cuenta y aclaraciones de manera inmediata vía canal digital o número de atención telefónico.
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-purple-100 shadow-sm space-y-3">
              <div className="w-10 h-10 bg-purple-100 text-purple-800 rounded-2xl flex items-center justify-center font-bold">
                <Info className="w-5 h-5" />
              </div>
              <h3 className="text-base font-extrabold text-purple-950">Contacto y Canales Directos</h3>
              <div className="text-xs text-slate-600 space-y-1 font-mono">
                <p>• Email: crediulep@gmail.com</p>
                <p>• WhatsApp: 3169008561</p>
                <p>• Horario: Lunes a Domingo 24/7</p>
              </div>
              <a
                href={`https://wa.me/573169008561?text=${encodeURIComponent(`Hola GROUP ULEP S.A.S., solicito información - Cédula: ${user.cedula}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-md text-white"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Contactar por WhatsApp (3169008561)</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: BENEFICIOS */}
      {activeTab === 'beneficios' && (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-gradient-to-r from-fuchsia-950 via-purple-900 to-indigo-950 p-8 rounded-3xl text-white shadow-xl space-y-3">
            <span className="text-xs uppercase font-bold tracking-widest bg-fuchsia-500/30 text-fuchsia-200 px-3 py-1 rounded-full border border-fuchsia-400/30">
              Programa de Recompensas
            </span>
            <h2 className="text-3xl font-black tracking-tight">Beneficios Exclusivos ULEP</h2>
            <p className="text-sm text-purple-200 max-w-2xl leading-relaxed">
              Por ser cliente de GROUP ULEP S.A.S. disfrutas de ventajas únicas diseñadas para cuidar tus finanzas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-purple-100 shadow-sm space-y-3">
              <div className="w-10 h-10 bg-emerald-100 text-emerald-800 rounded-2xl flex items-center justify-center font-bold">
                <Gift className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-extrabold text-purple-950">Cashback Puntual (2%)</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Recibe el 2% de retorno directo a tu saldo disponible en cada cuota abonada antes de tu fecha límite.
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-purple-100 shadow-sm space-y-3">
              <div className="w-10 h-10 bg-purple-100 text-purple-800 rounded-2xl flex items-center justify-center font-bold">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-extrabold text-purple-950">Aumento de Línea</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Al cumplir con 3 cuotas consecutivas a tiempo, accedes a evaluaciones automáticas para incrementar tu crédito.
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-purple-100 shadow-sm space-y-3">
              <div className="w-10 h-10 bg-fuchsia-100 text-fuchsia-800 rounded-2xl flex items-center justify-center font-bold">
                <DollarSign className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-extrabold text-purple-950">Sin Comisiones Ocultas</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                $0 en gastos de administración, $0 anualidad y $0 comisiones por apertura de cuenta.
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-purple-100 shadow-sm space-y-3">
              <div className="w-10 h-10 bg-indigo-100 text-indigo-800 rounded-2xl flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-extrabold text-purple-950">Protección Biométrica</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Seguridad reforzada con slider puzzle interactivo que protege tu inicio de sesión y tus transferencias.
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-purple-100 shadow-sm space-y-3">
              <div className="w-10 h-10 bg-amber-100 text-amber-800 rounded-2xl flex items-center justify-center font-bold">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-extrabold text-purple-950">Abono Libre a Capital</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Puedes realizar adelantamiento de cuotas sin penalizaciones ni cobros adicionales en ningún momento.
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-purple-100 shadow-sm space-y-3">
              <div className="w-10 h-10 bg-purple-100 text-purple-800 rounded-2xl flex items-center justify-center font-bold">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-extrabold text-purple-950">Comprobantes Oficiales</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Generación inmediata de comprobantes y recibos imprimibles para cada uno de tus movimientos y pagos.
              </p>
            </div>
          </div>
        </div>
      )}



      {/* Printable Receipt Voucher Modal */}
      <ReceiptModal
        transaction={selectedReceiptTx}
        onClose={() => setSelectedReceiptTx(null)}
      />
    </div>
  );
};
