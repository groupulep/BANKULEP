import React, { useState } from 'react';
import { User, BankCard, Transaction, Cajita, LoanRequest } from '../types';
import { ReceiptModal } from './ReceiptModal';
import {
  CheckCircle2,
  DollarSign,
  FileText,
  MessageCircle,
  AlertCircle,
  Sparkles,
  Send,
  Calendar,
  AlertTriangle
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
  transactions,
  loans,
  onUpdateUser,
  onAddTransaction,
  onRequestLoan,
  onAdjustAdminCapital,
}) => {
  const [selectedReceiptTx, setSelectedReceiptTx] = useState<Transaction | null>(null);

  const currentDebt = user.creditUsed ?? 0;
  const hasActiveDebt = currentDebt > 0;

  const activeApprovedLoan = loans.find((l) => l.userId === user.id && l.status === 'approved');
  const currentLoanQuota = activeApprovedLoan?.monthlyPayment ?? user.loanQuota ?? 1250000;

  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customAmount, setCustomAmount] = useState(currentLoanQuota.toString());
  const [paySuccess, setPaySuccess] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  const maxAvailableCredit = Math.max(
    user.creditLimit > 0 ? user.creditLimit : 5000000,
    10000000
  );
  const [requestAmount, setRequestAmount] = useState<number>(2000000);
  const [requestMonths, setRequestMonths] = useState<number>(12);
  const [loanSuccess, setLoanSuccess] = useState(false);

  const userTransactions = transactions.filter((t) => t.userId === user.id);

  const executePayment = (payAmt: number) => {
    if (!payAmt || payAmt <= 0) {
      setPayError('Ingresa un monto válido.');
      setTimeout(() => setPayError(null), 3000);
      return;
    }

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
      id: `PAGO-${Math.floor(100000 + Math.random() * 900000)}`,
      userId: user.id,
      type: 'transfer_out',
      amount: payAmt,
      description: `Pago Cuota`,
      category: 'Servicios',
      status: 'completed',
      date: new Date().toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })
    };

    onAddTransaction(newTx);
    setPaySuccess(true);
    setSelectedReceiptTx(newTx);
  };

  const handleRequestNewLoan = (e: React.FormEvent) => {
    e.preventDefault();
    if (requestAmount <= 0) return;

    const estimatedQuota = Math.round((requestAmount / requestMonths) * 1.05);

    const newLoan: LoanRequest = {
      id: `SOL-${Math.floor(100000 + Math.random() * 900000)}`,
      userId: user.id,
      userName: user.name,
      amount: requestAmount,
      months: requestMonths,
      monthlyPayment: estimatedQuota,
      purpose: 'Solicitud de Crédito',
      status: 'pending',
      requestedAt: new Date().toISOString().split('T')[0]
    };

    onRequestLoan(newLoan);

    const message = `Solicitud de crédito por $${requestAmount.toLocaleString('es-CO')} COP a ${requestMonths} meses - Cédula: ${user.cedula}`;
    const whatsappUrl = `https://wa.me/573169008561?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');

    setLoanSuccess(true);
  };

  // VISTA ESPECIAL CUANDO EL CLIENTE ESTÁ CANCELADO (status === 'blocked')
  if (user.status === 'blocked') {
    return (
      <div className="max-w-xl mx-auto space-y-6 py-6 pb-12 animate-fade-in-up">
        {/* Título simple y centrado */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black text-purple-950 tracking-tight">
            Solicita otro crédito
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-md mx-auto">
            Calcula el monto y el plazo deseado para tu nuevo crédito en GROUP ULEP S.A.S.
          </p>
        </div>

        {/* Simulador de Crédito */}
        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-purple-100 shadow-md space-y-5 animate-scale-in">
          <div className="flex items-center justify-between border-b border-purple-50 pb-3">
            <h2 className="text-sm font-extrabold text-purple-950 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-700" />
              Simulador de Crédito
            </h2>
            <span className="text-[11px] font-bold text-purple-900 bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-full font-mono">
              WhatsApp Directo
            </span>
          </div>

          {loanSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex items-center justify-between text-xs text-emerald-800 font-semibold animate-scale-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Solicitud enviada a WhatsApp (+57 3169008561)</span>
              </div>
              <button
                type="button"
                onClick={() => setLoanSuccess(false)}
                className="text-emerald-950 underline text-[11px] cursor-pointer hover:opacity-80"
              >
                Cerrar
              </button>
            </div>
          )}

          <form onSubmit={handleRequestNewLoan} className="space-y-4">
            {/* Monto a solicitar */}
            <div className="space-y-2 p-4 bg-purple-50/70 border border-purple-100 rounded-2xl">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">Monto a solicitar:</span>
                <span className="font-black font-mono text-purple-950 text-base sm:text-lg">
                  ${requestAmount.toLocaleString('es-CO')} COP
                </span>
              </div>
              <input
                type="range"
                min="200000"
                max={maxAvailableCredit}
                step="100000"
                value={requestAmount}
                onChange={(e) => setRequestAmount(Number(e.target.value))}
                className="w-full h-2.5 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-800"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono font-semibold">
                <span>$200.000</span>
                <span>${maxAvailableCredit.toLocaleString('es-CO')}</span>
              </div>
            </div>

            {/* Plazo y Cuota */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-purple-950">
                  Plazo del crédito:
                </label>
                <select
                  value={requestMonths}
                  onChange={(e) => setRequestMonths(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-purple-50 border border-purple-200 rounded-xl text-xs font-bold text-purple-950 focus:outline-none focus:ring-2 focus:ring-purple-700 cursor-pointer"
                >
                  <option value={1}>1 Mes (30 Días)</option>
                  <option value={3}>3 Meses (90 Días)</option>
                  <option value={6}>6 Meses (180 Días)</option>
                  <option value={12}>12 Meses (360 Días)</option>
                  <option value={24}>24 Meses (720 Días)</option>
                  <option value={36}>36 Meses (1080 Días)</option>
                </select>
              </div>

              <div className="p-3 bg-purple-900 text-white rounded-xl text-center flex flex-col justify-center shadow-xs">
                <span className="text-[10px] uppercase font-bold text-purple-200 block">Cuota mensual aprox:</span>
                <span className="text-sm sm:text-base font-black font-mono text-emerald-300 block mt-0.5">
                  ${Math.round((requestAmount / requestMonths) * 1.05).toLocaleString('es-CO')} COP
                </span>
              </div>
            </div>

            {/* Botón enviar */}
            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-extrabold py-4 px-4 rounded-2xl text-sm transition-all duration-200 shadow-md flex items-center justify-center gap-2 cursor-pointer hover:shadow-lg mt-2"
            >
              <Send className="w-4 h-4 shrink-0" />
              <span>Solicitar</span>
            </button>
          </form>

          {/* Nota directa de WhatsApp */}
          <div className="pt-2 text-center">
            <a
              href={`https://wa.me/573169008561?text=${encodeURIComponent(`Hola GROUP ULEP S.A.S., deseo solicitar un nuevo crédito. Cédula: ${user.cedula} - Nombre: ${user.name}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-purple-900 hover:text-purple-950 font-bold hover:underline"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>O comunícate directo al WhatsApp (+57 3169008561)</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  // VISTA ESPECIAL CUANDO EL CLIENTE ESTÁ EN MORA (status === 'pending')
  if (user.status === 'pending') {
    const debtToPay = currentDebt > 0 ? currentDebt : (user.creditLimit || 1250000);
    const quotaToPay = Math.min(currentLoanQuota, debtToPay);

    return (
      <div className="max-w-xl mx-auto space-y-5 py-5 pb-12 animate-fade-in-up">
        {/* Mensaje de encabezado centrado */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-full text-xs font-black uppercase tracking-wider">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
            <span>Crédito en mora</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-purple-950 tracking-tight">
            Paga tu deuda pendiente
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-md mx-auto">
            Hola <span className="font-bold text-purple-950">{user.name}</span>, presenta retraso en tus pagos. Realiza el pago para normalizar tu estado con GROUP ULEP S.A.S.
          </p>
        </div>

        {/* Tarjeta de Pago de Deuda */}
        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-amber-200 shadow-md space-y-5 animate-scale-in">
          <div className="flex items-center justify-between border-b border-purple-50 pb-3">
            <h2 className="text-sm font-extrabold text-purple-950 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-purple-900" />
              Saldo a Pagar
            </h2>
            <span className="text-xs font-bold text-amber-900 bg-amber-50 border border-amber-300 px-3 py-0.5 rounded-md font-mono">
              En Mora
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 p-4 bg-amber-50/60 border border-amber-200 rounded-2xl text-center">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Deuda Total</span>
              <p className="text-lg sm:text-xl font-black font-mono text-amber-950 mt-0.5">
                ${debtToPay.toLocaleString('es-CO')}
              </p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-purple-900 uppercase tracking-wide">Cuota del Mes</span>
              <p className="text-lg sm:text-xl font-black font-mono text-purple-900 mt-0.5">
                ${quotaToPay.toLocaleString('es-CO')}
              </p>
            </div>
          </div>

          {paySuccess && (
            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex items-center justify-between text-xs text-emerald-800 font-semibold animate-scale-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Pago procesado exitosamente</span>
              </div>
              <button
                type="button"
                onClick={() => setPaySuccess(false)}
                className="text-emerald-950 underline text-[11px] cursor-pointer hover:opacity-80"
              >
                Cerrar
              </button>
            </div>
          )}

          {payError && (
            <div className="bg-rose-50 border border-rose-200 p-2.5 rounded-xl text-xs text-rose-800 font-semibold animate-scale-in">
              {payError}
            </div>
          )}

          {/* LOS 2 BOTONES DE PAGO */}
          <div className="space-y-3 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* BOTÓN 1: PAGAR CUOTA */}
              <button
                type="button"
                onClick={() => executePayment(quotaToPay)}
                className="p-4 bg-purple-900 hover:bg-purple-950 active:scale-[0.98] text-white rounded-2xl font-bold transition-all duration-200 shadow-sm flex flex-col items-center justify-center text-center cursor-pointer hover:shadow-md"
              >
                <span className="text-[11px] uppercase tracking-wide opacity-85">Pagar Cuota</span>
                <span className="text-sm sm:text-base font-black font-mono mt-0.5 text-emerald-300">
                  ${quotaToPay.toLocaleString('es-CO')} COP
                </span>
              </button>

              {/* BOTÓN 2: PAGAR CUOTA (PERSONALIZADA) */}
              <button
                type="button"
                onClick={() => setShowCustomInput(!showCustomInput)}
                className={`p-4 rounded-2xl font-bold border transition-all duration-200 text-center flex flex-col items-center justify-center cursor-pointer active:scale-[0.98] ${
                  showCustomInput
                    ? 'bg-purple-100 border-purple-400 text-purple-950 shadow-xs'
                    : 'bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-900'
                }`}
              >
                <span className="text-[11px] uppercase tracking-wide">Pagar Cuota (Personalizada)</span>
                <span className="text-xs font-semibold mt-0.5 opacity-80">
                  {showCustomInput ? 'Ocultar' : 'Otro Valor'}
                </span>
              </button>
            </div>

            {showCustomInput && (
              <div className="p-4 bg-purple-50/90 border border-purple-200 rounded-2xl space-y-2 animate-scale-in">
                <label className="block text-[11px] font-bold text-purple-950">
                  Ingresa el valor a pagar ($ COP):
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    max={debtToPay}
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    placeholder="Monto a pagar"
                    className="flex-1 px-3.5 py-2.5 bg-white border border-purple-200 rounded-xl font-mono text-sm font-bold text-purple-950 focus:outline-none focus:ring-2 focus:ring-purple-700"
                  />
                  <button
                    type="button"
                    onClick={() => executePayment(parseFloat(customAmount || '0'))}
                    className="px-5 py-2.5 bg-purple-900 hover:bg-purple-950 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                  >
                    Pagar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Soporte WhatsApp */}
          <div className="pt-2 border-t border-purple-50 flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">¿Dudas con tu pago?</span>
            <a
              href={`https://wa.me/573169008561?text=${encodeURIComponent(`Hola GROUP ULEP S.A.S., soporte pago en mora - Cédula: ${user.cedula} - Nombre: ${user.name}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-xl text-xs transition-all shadow-2xs"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Soporte WhatsApp</span>
            </a>
          </div>
        </div>

        <ReceiptModal
          transaction={selectedReceiptTx}
          onClose={() => setSelectedReceiptTx(null)}
        />
      </div>
    );
  }

  // Días del préstamo y cálculo de porcentaje para el círculo morado
  const activeLoanDays = user.paymentTermDays ?? 30;
  const simulatedDays = requestMonths * 30;
  const currentDays = hasActiveDebt ? activeLoanDays : simulatedDays;
  
  // Circunferencia del círculo (r = 70, C = 2 * PI * 70 ≈ 439.82)
  const circleRadius = 70;
  const circumference = 2 * Math.PI * circleRadius;
  
  // Proporción del borde morado según los días
  const maxBenchmarkDays = hasActiveDebt ? Math.max(activeLoanDays, 30) : 360;
  const progressRatio = Math.min(Math.max(currentDays / maxBenchmarkDays, 0.2), 1);
  const strokeDashoffset = circumference - (circumference * progressRatio);

  const displayLoanValue = hasActiveDebt ? currentDebt : requestAmount;

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-10 animate-fade-in-up">
      {/* Saludo */}
      <div className="py-2 text-center transition-all duration-300">
        <h1 className="text-xl sm:text-2xl font-black text-purple-950 tracking-tight">
          Hola <span className="text-purple-800">{user.name}</span>, ya eres parte de ULEP.
        </h1>
      </div>

      {/* CÍRCULO CON BORDE MORADO SEGÚN LOS DÍAS DEL PRÉSTAMO Y VALOR EN EL CENTRO */}
      <div className="bg-white p-6 rounded-2xl border border-purple-100 shadow-sm flex flex-col items-center justify-center relative overflow-hidden transition-all duration-300 hover:shadow-md animate-scale-in">
        {/* Resplandor ambiental suave */}
        <div className="absolute w-40 h-40 bg-purple-200/40 rounded-full blur-3xl -z-0 pointer-events-none animate-pulse-glow" />

        <div className="relative flex items-center justify-center z-10">
          <svg className="w-52 h-52 sm:w-56 sm:h-56 transform -rotate-90" viewBox="0 0 160 160">
            {/* Fondo del círculo suave */}
            <circle
              cx="80"
              cy="80"
              r={circleRadius}
              fill="transparent"
              stroke="#f3e8ff"
              strokeWidth="9"
            />
            {/* Borde morado animado según los días del préstamo */}
            <circle
              cx="80"
              cy="80"
              r={circleRadius}
              fill="transparent"
              stroke="#7e22ce"
              strokeWidth="9"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>

          {/* Contenido en el centro: Valor del préstamo y días */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {hasActiveDebt ? 'Valor del Préstamo' : 'Monto a Solicitar'}
            </span>
            <p className="text-2xl sm:text-3xl font-black font-mono text-purple-950 tracking-tight mt-0.5 transition-all duration-300 transform hover:scale-105">
              ${displayLoanValue.toLocaleString('es-CO')}
            </p>
            <div className="mt-1.5 inline-flex items-center gap-1.5 bg-purple-50 text-purple-900 border border-purple-200 px-3 py-0.5 rounded-full text-xs font-extrabold font-mono shadow-2xs transition-transform duration-200 hover:scale-105">
              <Calendar className="w-3 h-3 text-purple-700" />
              <span>{currentDays} Días</span>
            </div>
          </div>
        </div>
      </div>

      {/* CASO A: TIENE CRÉDITO ACTIVO */}
      {hasActiveDebt ? (
        <div className="bg-white p-5 rounded-2xl border border-purple-100 shadow-xs space-y-4 transition-all duration-300 hover:shadow-md animate-fade-in-up">
          <div className="flex items-center justify-between border-b border-purple-50 pb-3">
            <h2 className="text-sm font-extrabold text-purple-950 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-purple-900" />
              Pagar Crédito
            </h2>
            <span className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-md font-mono">
              Debes: ${currentDebt.toLocaleString('es-CO')}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 p-3 bg-purple-50/70 border border-purple-100 rounded-xl text-center">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase">Deuda Actual</span>
              <p className="text-base font-black font-mono text-purple-950 mt-0.5">
                ${currentDebt.toLocaleString('es-CO')}
              </p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-purple-900 uppercase">Cuota del Mes</span>
              <p className="text-base font-black font-mono text-purple-900 mt-0.5">
                ${currentLoanQuota.toLocaleString('es-CO')}
              </p>
            </div>
          </div>

          {paySuccess && (
            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex items-center justify-between text-xs text-emerald-800 font-semibold animate-scale-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Pago procesado exitosamente</span>
              </div>
              <button
                type="button"
                onClick={() => setPaySuccess(false)}
                className="text-emerald-950 underline text-[11px] cursor-pointer hover:opacity-80"
              >
                Cerrar
              </button>
            </div>
          )}

          {payError && (
            <div className="bg-rose-50 border border-rose-200 p-2.5 rounded-xl text-xs text-rose-800 font-semibold animate-scale-in">
              {payError}
            </div>
          )}

          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* BOTÓN 1: PAGAR CUOTA */}
              <button
                type="button"
                onClick={() => executePayment(Math.min(currentLoanQuota, currentDebt))}
                className="p-3.5 bg-purple-900 hover:bg-purple-950 active:scale-[0.98] text-white rounded-xl font-bold transition-all duration-200 shadow-xs flex flex-col items-center justify-center text-center cursor-pointer hover:shadow-md"
              >
                <span className="text-[11px] uppercase tracking-wide opacity-85">Pagar Cuota</span>
                <span className="text-sm font-black font-mono mt-0.5 text-emerald-300">
                  ${Math.min(currentLoanQuota, currentDebt).toLocaleString('es-CO')} COP
                </span>
              </button>

              {/* BOTÓN 2: PAGAR CUOTA (PERSONALIZADA) */}
              <button
                type="button"
                onClick={() => setShowCustomInput(!showCustomInput)}
                className={`p-3.5 rounded-xl font-bold border transition-all duration-200 text-center flex flex-col items-center justify-center cursor-pointer active:scale-[0.98] ${
                  showCustomInput
                    ? 'bg-purple-100 border-purple-400 text-purple-950 shadow-xs'
                    : 'bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-900'
                }`}
              >
                <span className="text-[11px] uppercase tracking-wide">Pagar Cuota (Personalizada)</span>
                <span className="text-xs font-semibold mt-0.5 opacity-75">
                  {showCustomInput ? 'Ocultar' : 'Otro Valor'}
                </span>
              </button>
            </div>

            {showCustomInput && (
              <div className="p-3 bg-purple-50/80 border border-purple-200 rounded-xl space-y-2 animate-scale-in">
                <label className="block text-[11px] font-bold text-purple-950">
                  Ingresa el valor a pagar ($ COP):
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    max={currentDebt}
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    placeholder="Monto a pagar"
                    className="flex-1 px-3 py-2 bg-white border border-purple-200 rounded-xl font-mono text-sm font-bold text-purple-950 focus:outline-none focus:ring-2 focus:ring-purple-700"
                  />
                  <button
                    type="button"
                    onClick={() => executePayment(parseFloat(customAmount || '0'))}
                    className="px-4 py-2 bg-purple-900 hover:bg-purple-950 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                  >
                    Pagar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* CASO B: NO TIENE DEUDA (SOLICITAR CRÉDITO) */
        <div className="bg-white p-5 rounded-2xl border border-purple-100 shadow-xs space-y-4 transition-all duration-300 hover:shadow-md animate-fade-in-up">
          <div className="flex items-center justify-between border-b border-purple-50 pb-3">
            <h2 className="text-sm font-extrabold text-purple-950 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              Solicitar Crédito
            </h2>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md font-mono">
              Disponible: ${maxAvailableCredit.toLocaleString('es-CO')}
            </span>
          </div>

          <div className="p-3.5 bg-purple-50/70 border border-purple-100 rounded-xl flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase">Cupo Disponible:</span>
            <span className="text-lg font-black font-mono text-purple-950">
              ${maxAvailableCredit.toLocaleString('es-CO')} COP
            </span>
          </div>

          {loanSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex items-center justify-between text-xs text-emerald-800 font-semibold animate-scale-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Solicitud enviada a WhatsApp</span>
              </div>
              <button
                type="button"
                onClick={() => setLoanSuccess(false)}
                className="text-emerald-950 underline text-[11px] cursor-pointer hover:opacity-80"
              >
                Cerrar
              </button>
            </div>
          )}

          <form onSubmit={handleRequestNewLoan} className="space-y-3">
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700">Monto:</span>
                <span className="font-black font-mono text-purple-950 text-sm">
                  ${requestAmount.toLocaleString('es-CO')} COP
                </span>
              </div>
              <input
                type="range"
                min="200000"
                max={maxAvailableCredit}
                step="100000"
                value={requestAmount}
                onChange={(e) => setRequestAmount(Number(e.target.value))}
                className="w-full h-2 bg-purple-100 rounded-lg appearance-none cursor-pointer accent-purple-800"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <select
                value={requestMonths}
                onChange={(e) => setRequestMonths(Number(e.target.value))}
                className="w-full px-3 py-2 bg-purple-50 border border-purple-200 rounded-xl text-xs font-bold text-purple-950 focus:outline-none cursor-pointer"
              >
                <option value={1}>1 Mes (30 Días)</option>
                <option value={3}>3 Meses (90 Días)</option>
                <option value={6}>6 Meses (180 Días)</option>
                <option value={12}>12 Meses (360 Días)</option>
                <option value={24}>24 Meses</option>
                <option value={36}>36 Meses</option>
              </select>

              <div className="p-2 bg-purple-50/80 border border-purple-100 rounded-xl text-center">
                <span className="text-[10px] text-slate-500 font-bold block">Cuota mensual:</span>
                <span className="text-xs font-black font-mono text-purple-950 block">
                  ${Math.round((requestAmount / requestMonths) * 1.05).toLocaleString('es-CO')}
                </span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-extrabold py-3.5 px-4 rounded-xl text-sm transition-all duration-200 shadow-xs flex items-center justify-center gap-2 cursor-pointer hover:shadow-md"
            >
              <Send className="w-4 h-4 shrink-0" />
              <span>Pedir ${requestAmount.toLocaleString('es-CO')} por WhatsApp</span>
            </button>
          </form>
        </div>
      )}

      {/* Resumen Métricas */}
      <div className="grid grid-cols-3 gap-2 text-center animate-fade-in-up">
        <div className="bg-white p-3 rounded-xl border border-purple-100 shadow-2xs hover:-translate-y-0.5 transition-transform duration-200">
          <span className="text-[10px] font-bold text-slate-500 uppercase block">Línea</span>
          <span className="text-xs font-black font-mono text-purple-950 block mt-0.5">
            ${user.creditLimit.toLocaleString('es-CO')}
          </span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-purple-100 shadow-2xs hover:-translate-y-0.5 transition-transform duration-200">
          <span className="text-[10px] font-bold text-slate-500 uppercase block">
            {hasActiveDebt ? 'Deuda' : 'Estado'}
          </span>
          <span className={`text-xs font-black font-mono block mt-0.5 ${hasActiveDebt ? 'text-amber-700' : 'text-emerald-700'}`}>
            {hasActiveDebt ? `$${user.creditUsed.toLocaleString('es-CO')}` : '$0'}
          </span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-purple-100 shadow-2xs hover:-translate-y-0.5 transition-transform duration-200">
          <span className="text-[10px] font-bold text-slate-500 uppercase block">Plazo</span>
          <span className="text-xs font-black text-purple-950 block mt-0.5">
            {currentDays} Días
          </span>
        </div>
      </div>

      {/* Movimientos */}
      <div className="bg-white p-4 rounded-2xl border border-purple-100 shadow-xs space-y-2.5 transition-all duration-300 hover:shadow-md animate-fade-in-up">
        <div className="flex items-center justify-between border-b border-purple-50 pb-2">
          <h3 className="text-xs font-extrabold text-purple-950 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-purple-800" />
            Movimientos
          </h3>
          <span className="text-[10px] text-slate-400 font-medium">
            {userTransactions.length}
          </span>
        </div>

        {userTransactions.length === 0 ? (
          <p className="text-xs text-slate-400 py-2 text-center">Sin movimientos.</p>
        ) : (
          <div className="divide-y divide-purple-50 text-xs">
            {userTransactions.slice(0, 4).map((tx) => (
              <div
                key={tx.id}
                className="py-2 flex items-center justify-between hover:bg-purple-50/50 px-1 rounded-lg transition-colors"
              >
                <div>
                  <p className="font-bold text-purple-950 text-xs">{tx.description}</p>
                  <p className="text-[10px] text-slate-400 font-mono">{tx.date}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold font-mono text-purple-950 text-xs">
                    ${tx.amount.toLocaleString('es-CO')}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedReceiptTx(tx)}
                    className="px-2 py-0.5 bg-purple-50 hover:bg-purple-100 active:scale-95 text-purple-900 font-bold rounded text-[10px] cursor-pointer transition-all"
                  >
                    Recibo
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Soporte */}
      <div className="flex items-center justify-between p-3 bg-purple-50/70 rounded-xl border border-purple-100 text-xs animate-fade-in-up">
        <span className="text-slate-600 font-medium">Soporte GROUP ULEP S.A.S.</span>
        <a
          href={`https://wa.me/573169008561?text=${encodeURIComponent(`Hola GROUP ULEP S.A.S., soporte - Cédula: ${user.cedula}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-lg text-[11px] transition-all shadow-2xs"
        >
          <MessageCircle className="w-3 h-3" />
          <span>3169008561</span>
        </a>
      </div>

      <ReceiptModal
        transaction={selectedReceiptTx}
        onClose={() => setSelectedReceiptTx(null)}
      />
    </div>
  );
};
