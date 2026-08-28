import React, { useState } from 'react';
import { User, BankCard, Transaction, Cajita, LoanRequest } from '../types';
import { ReceiptModal } from './ReceiptModal';
import { calculateCreditStatus } from '../lib/creditCalculations';
import {
  CheckCircle2,
  DollarSign,
  FileText,
  MessageCircle,
  AlertCircle,
  Sparkles,
  Send,
  Calendar,
  AlertTriangle,
  Clock,
  ChevronDown,
  ChevronUp,
  Info,
  ShieldCheck
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

  // CÁLCULO LÓGICO DEL ESTADO DEL CRÉDITO DIRECTAMENTE DEL USUARIO (CONECTADO AL ADMIN)
  const creditStatus = calculateCreditStatus(user);
  const currentDebt = user.creditUsed ?? 0;
  const hasActiveDebt = currentDebt > 0;

  const currentLoanQuota = creditStatus.installmentAmount > 0 
    ? creditStatus.installmentAmount 
    : user.loanQuota ?? Math.round(currentDebt / 2);

  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customAmount, setCustomAmount] = useState(currentLoanQuota > 0 ? currentLoanQuota.toString() : '500000');
  const [paySuccess, setPaySuccess] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  const SYSTEM_MAX_CREDIT = 5000000;
  const maxAvailableCredit = Math.min(
    user.creditLimit > 0 ? user.creditLimit : SYSTEM_MAX_CREDIT,
    SYSTEM_MAX_CREDIT
  );
  const [requestAmount, setRequestAmount] = useState<number>(2000000);
  const [requestDays, setRequestDays] = useState<number>(30); // 15 o 30 días (al mes)
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [extendDaysSelected, setExtendDaysSelected] = useState<number>(15);
  const [showPayOptions, setShowPayOptions] = useState(true);
  const [showCharacteristics, setShowCharacteristics] = useState(false);
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
      description: newCreditUsed === 0 ? `Liquidación Total Crédito` : `Pago Cuota Crédito`,
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

    const clampedAmount = Math.min(requestAmount, SYSTEM_MAX_CREDIT);
    // Tasa de interés aproximada para 15 días (2.5%) o 1 mes (5%)
    const estimatedQuota = requestDays === 15 
      ? Math.round(clampedAmount * 1.025)
      : Math.round(clampedAmount * 1.05);

    const newLoan: LoanRequest = {
      id: `SOL-${Math.floor(100000 + Math.random() * 900000)}`,
      userId: user.id,
      userName: user.name,
      amount: clampedAmount,
      months: requestDays === 15 ? 0.5 : 1,
      monthlyPayment: estimatedQuota,
      purpose: `Solicitud de Crédito (${requestDays === 15 ? '15 Días / Quincenal' : 'Al Mes / 30 Días'})`,
      status: 'pending',
      requestedAt: new Date().toISOString().split('T')[0]
    };

    onRequestLoan(newLoan);

    const message = `Solicitud de crédito por $${clampedAmount.toLocaleString('es-CO')} COP con plazo de ${requestDays === 15 ? '15 días (Pago quincenal)' : 'al mes (Pago mensual / 30 días)'} - Cédula: ${user.cedula}`;
    const whatsappUrl = `https://wa.me/573169008561?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');

    setLoanSuccess(true);
  };

  // VISTA ESPECIAL CUANDO EL CLIENTE ESTÁ CANCELADO O SIN DEUDA ($0)
  if (creditStatus.computedStatus === 'blocked' || !hasActiveDebt) {
    const estimatedBlockedQuota = requestDays === 15 
      ? Math.round(requestAmount * 1.025)
      : Math.round(requestAmount * 1.05);

    return (
      <div className="max-w-xl mx-auto space-y-6 py-6 pb-12 animate-fade-in-up">
        {/* Título simple y centrado */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-bold font-mono">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Sin Deuda Pendiente ($0 COP)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-purple-950 tracking-tight">
            Solicita otro crédito
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-md mx-auto">
            Hola <span className="font-bold text-purple-950">{user.name}</span>, calcula el monto (máximo ${maxAvailableCredit.toLocaleString('es-CO')} COP) y el plazo deseado en GRUPO ULEP S.A.S.
          </p>
        </div>

        {/* Simulador de Crédito */}
        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-purple-100 shadow-md space-y-5 animate-scale-in">
          <div className="flex items-center justify-between border-b border-purple-50 pb-3">
            <h2 className="text-sm font-extrabold text-purple-950 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-700" />
              Simulador de Crédito (Cupo: ${maxAvailableCredit.toLocaleString('es-CO')})
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
                min="100000"
                max={maxAvailableCredit}
                step="50000"
                value={requestAmount}
                onChange={(e) => setRequestAmount(Number(e.target.value))}
                className="w-full h-2.5 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-800"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono font-semibold">
                <span>$100.000</span>
                <span>Máx. ${maxAvailableCredit.toLocaleString('es-CO')}</span>
              </div>
            </div>

            {/* Plazo y Cuota */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-purple-950">
                  Modalidad de pago:
                </label>
                <select
                  value={requestDays}
                  onChange={(e) => setRequestDays(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-purple-50 border border-purple-200 rounded-xl text-xs font-bold text-purple-950 focus:outline-none focus:ring-2 focus:ring-purple-700 cursor-pointer"
                >
                  <option value={15}>Pago a 15 Días (Quincenal)</option>
                  <option value={30}>Pago al Mes (30 Días)</option>
                </select>
              </div>

              <div className="p-3 bg-purple-900 text-white rounded-xl text-center flex flex-col justify-center shadow-xs">
                <span className="text-[10px] uppercase font-bold text-purple-200 block">
                  {requestDays === 15 ? 'Cuota a 15 días aprox:' : 'Cuota mensual aprox:'}
                </span>
                <span className="text-sm sm:text-base font-black font-mono text-emerald-300 block mt-0.5">
                  ${estimatedBlockedQuota.toLocaleString('es-CO')} COP
                </span>
              </div>
            </div>

            {/* Botón enviar */}
            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-extrabold py-4 px-4 rounded-2xl text-sm transition-all duration-200 shadow-md flex items-center justify-center gap-2 cursor-pointer hover:shadow-lg mt-2"
            >
              <Send className="w-4 h-4 shrink-0" />
              <span>Solicitar (${requestAmount.toLocaleString('es-CO')} - {requestDays === 15 ? '15 Días' : 'Al Mes'})</span>
            </button>
          </form>

          {/* Nota directa de WhatsApp */}
          <div className="pt-2 text-center">
            <a
              href={`https://wa.me/573169008561?text=${encodeURIComponent(`Hola GRUPO ULEP S.A.S., deseo solicitar un nuevo crédito por $${requestAmount.toLocaleString('es-CO')} a ${requestDays === 15 ? '15 días' : 'al mes'}. Cédula: ${user.cedula} - Nombre: ${user.name}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-purple-900 hover:text-purple-950 font-bold hover:underline"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>O comunícate directo al WhatsApp (+57 3169008561)</span>
            </a>
          </div>
        </div>

        {/* Resumen Métricas */}
        <div className="grid grid-cols-3 gap-2 text-center animate-fade-in-up">
          <div className="bg-white p-3 rounded-xl border border-purple-100 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Línea Máx.</span>
            <span className="text-xs font-black font-mono text-purple-950 block mt-0.5">
              ${user.creditLimit.toLocaleString('es-CO')}
            </span>
          </div>

          <div className="bg-white p-3 rounded-xl border border-purple-100 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Estado</span>
            <span className="text-xs font-black font-mono text-emerald-700 block mt-0.5">
              Al Día ($0)
            </span>
          </div>

          <div className="bg-white p-3 rounded-xl border border-purple-100 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Plazo Disp.</span>
            <span className="text-xs font-black text-purple-950 block mt-0.5">
              15 a 30 Días
            </span>
          </div>
        </div>

        {/* Movimientos */}
        <div className="bg-white p-4 rounded-2xl border border-purple-100 shadow-xs space-y-2.5 transition-all duration-300">
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
        <div className="flex items-center justify-between p-3 bg-purple-50/70 rounded-xl border border-purple-100 text-xs">
          <span className="text-slate-600 font-medium">Soporte GRUPO ULEP S.A.S.</span>
          <a
            href={`https://wa.me/573169008561?text=${encodeURIComponent(`Hola GRUPO ULEP S.A.S., soporte - Cédula: ${user.cedula}`)}`}
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
  }

  // VISTA ESPECIAL CUANDO EL CLIENTE ESTÁ EN MORA (creditStatus.computedStatus === 'pending')
  if (creditStatus.computedStatus === 'pending' || creditStatus.isOverdue) {
    const debtToPay = currentDebt;
    const quotaToPay = Math.min(currentLoanQuota > 0 ? currentLoanQuota : debtToPay, debtToPay);

    return (
      <div className="max-w-xl mx-auto space-y-5 py-5 pb-12 animate-fade-in-up">
        {/* Mensaje de encabezado centrado */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-100 text-rose-900 border border-rose-300 rounded-full text-xs font-black uppercase tracking-wider">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-700" />
            <span>Crédito en mora ({creditStatus.daysOverdue} {creditStatus.daysOverdue === 1 ? 'día' : 'días'})</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-purple-950 tracking-tight">
            Paga tu deuda pendiente
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-md mx-auto">
            Hola <span className="font-bold text-purple-950">{user.name}</span>, tu crédito venció el <strong className="text-rose-900 font-mono">{creditStatus.dueDate}</strong>. Realiza el pago para normalizar tu estado con GRUPO ULEP S.A.S.
          </p>
        </div>

        {/* Tarjeta de Pago de Deuda */}
        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-rose-200 shadow-md space-y-5 animate-scale-in">
          <div className="flex items-center justify-between border-b border-purple-50 pb-3">
            <h2 className="text-sm font-extrabold text-purple-950 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-purple-900" />
              Saldo en Mora
            </h2>
            <span className="text-xs font-bold text-rose-900 bg-rose-50 border border-rose-300 px-3 py-0.5 rounded-md font-mono">
              Venció: {creditStatus.dueDate}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 p-4 bg-rose-50/60 border border-rose-200 rounded-2xl text-center">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Deuda Total</span>
              <p className="text-lg sm:text-xl font-black font-mono text-rose-950 mt-0.5">
                ${debtToPay.toLocaleString('es-CO')}
              </p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-purple-900 uppercase tracking-wide">
                {creditStatus.frequency === 'quincenal' ? 'Cuota Quincenal' : 'Cuota del Mes'}
              </span>
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

          {/* BOTONES DE PAGO */}
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

            {/* BOTÓN 3: LIQUIDACIÓN TOTAL */}
            <button
              type="button"
              onClick={() => executePayment(debtToPay)}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-xl font-bold text-xs transition-all duration-200 shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Liquidar Total Deuda (${debtToPay.toLocaleString('es-CO')} COP)</span>
            </button>

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
              href={`https://wa.me/573169008561?text=${encodeURIComponent(`Hola GRUPO ULEP S.A.S., soporte pago en mora - Cédula: ${user.cedula} - Nombre: ${user.name}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-xl text-xs transition-all shadow-2xs"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Soporte WhatsApp</span>
            </a>
          </div>
        </div>

        {/* Movimientos */}
        <div className="bg-white p-4 rounded-2xl border border-purple-100 shadow-xs space-y-2.5 transition-all duration-300">
          <div className="flex items-center justify-between border-b border-purple-50 pb-2">
            <h3 className="text-xs font-extrabold text-purple-950 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-purple-800" />
              Movimientos Recientes
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

        <ReceiptModal
          transaction={selectedReceiptTx}
          onClose={() => setSelectedReceiptTx(null)}
        />
      </div>
    );
  }

  // VISTA ACTIVA AL DÍA: CONECTADA DIRECTAMENTE CON LOS AJUSTES DEL ADMIN
  const totalDays = creditStatus.totalDays;
  const elapsedDays = creditStatus.elapsedDays;
  const remainingDays = creditStatus.remainingDays;
  
  // Circunferencia del círculo (r = 70, C = 2 * PI * 70 ≈ 439.82)
  const circleRadius = 70;
  const circumference = 2 * Math.PI * circleRadius;
  
  // Longitud de los segmentos:
  // Segmento 1: Días transcurridos (Gris)
  // Segmento 2: Días restantes (Morado)
  const elapsedRatio = totalDays > 0 ? elapsedDays / totalDays : 0;
  const remainingRatio = totalDays > 0 ? remainingDays / totalDays : 1;
  
  const elapsedDashLength = circumference * elapsedRatio;
  const remainingDashLength = circumference * remainingRatio;
  const remainingDashOffset = -elapsedDashLength;

  const displayLoanValue = currentDebt;
  const activeQuota = Math.min(currentLoanQuota > 0 ? currentLoanQuota : currentDebt, currentDebt);

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-10 animate-fade-in-up">
      {/* Saludo */}
      <div className="py-2 text-center transition-all duration-300">
        <h1 className="text-xl sm:text-2xl font-black text-purple-950 tracking-tight">
          Hola <span className="text-purple-800">{user.name}</span>, ya eres parte de ULEP.
        </h1>
      </div>

      {/* CÍRCULO CON DÍAS RESTANTES (MORADO) Y DÍAS TRANSCURRIDOS (GRIS) */}
      <div className="py-4 sm:py-6 flex flex-col items-center justify-center relative transition-all duration-300 animate-scale-in">
        {/* Resplandor ambiental suave */}
        <div className="absolute w-48 h-48 bg-purple-300/25 rounded-full blur-3xl -z-0 pointer-events-none animate-pulse-glow" />

        <div className="relative flex items-center justify-center z-10">
          <svg className="w-52 h-52 sm:w-56 sm:h-56 transform -rotate-90" viewBox="0 0 160 160">
            {/* Pista base suave */}
            <circle
              cx="80"
              cy="80"
              r={circleRadius}
              fill="transparent"
              stroke="#e2e8f0"
              strokeWidth="9"
            />

            {/* Segmento 1: DÍAS TRANSCURRIDOS (GRIS) */}
            {elapsedDays > 0 && (
              <circle
                cx="80"
                cy="80"
                r={circleRadius}
                fill="transparent"
                stroke="#94a3b8"
                strokeWidth="9"
                strokeDasharray={`${elapsedDashLength} ${circumference}`}
                strokeDashoffset={0}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            )}

            {/* Segmento 2: DÍAS RESTANTES POR PAGAR (MORADO) */}
            {remainingDays > 0 && (
              <circle
                cx="80"
                cy="80"
                r={circleRadius}
                fill="transparent"
                stroke="#7e22ce"
                strokeWidth="9"
                strokeDasharray={`${remainingDashLength} ${circumference}`}
                strokeDashoffset={remainingDashOffset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            )}
          </svg>

          {/* Contenido en el centro: Valor a pagar y estado de días */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              VALOR A PAGAR
            </span>
            <p className="text-2xl sm:text-3xl font-black font-mono text-purple-950 tracking-tight mt-0.5 transition-all duration-300 transform hover:scale-105">
              ${displayLoanValue.toLocaleString('es-CO')}
            </p>
            <div className="mt-2 inline-flex items-center gap-1.5 bg-purple-50 text-purple-900 border border-purple-200 px-3 py-1 rounded-full text-xs font-extrabold font-mono shadow-2xs transition-transform duration-200 hover:scale-105">
              <Clock className="w-3.5 h-3.5 text-purple-700" />
              <span>{remainingDays} {remainingDays === 1 ? 'día por vencer' : 'días por vencer'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2 BOTONES LARGOS AL INICIO: PAGAR Y EXTENDER */}
      <div className="space-y-2.5 animate-fade-in-up">
        {/* BOTÓN 1: PAGAR */}
        <button
          type="button"
          onClick={() => {
            setShowPayOptions(!showPayOptions);
          }}
          className="w-full py-4 px-6 bg-purple-900 hover:bg-purple-950 active:scale-[0.99] text-white rounded-2xl font-black text-base tracking-wider uppercase transition-all duration-200 shadow-md flex items-center justify-center gap-2 cursor-pointer"
        >
          <DollarSign className="w-5 h-5 text-emerald-300" />
          <span>PAGAR</span>
        </button>

        {/* BOTÓN 2: EXTENDER */}
        <button
          type="button"
          onClick={() => setShowExtendModal(true)}
          className="w-full py-3.5 px-6 bg-white hover:bg-purple-50 active:scale-[0.99] text-purple-950 border-2 border-purple-900/80 rounded-2xl font-black text-base tracking-wider uppercase transition-all duration-200 shadow-2xs flex items-center justify-center gap-2 cursor-pointer"
        >
          <Calendar className="w-5 h-5 text-purple-800" />
          <span>Extender</span>
        </button>
      </div>

      {/* MODAL / DIÁLOGO DE EXTENSIÓN DE CRÉDITO */}
      {showExtendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-950/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-purple-100 space-y-5 animate-scale-in">
            <div className="flex items-center justify-between border-b border-purple-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-100 text-purple-900 rounded-xl">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-purple-950">Extender Plazo de Crédito</h3>
                  <p className="text-xs text-slate-500 font-medium">GRUPO ULEP S.A.S.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowExtendModal(false)}
                className="p-1.5 text-slate-400 hover:text-purple-950 hover:bg-purple-50 rounded-lg cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-purple-50/70 rounded-2xl border border-purple-100 space-y-2 text-center">
              <span className="text-xs font-bold text-slate-600 uppercase">Deuda Actual a Extender</span>
              <p className="text-2xl font-black font-mono text-purple-950">
                ${currentDebt.toLocaleString('es-CO')} COP
              </p>
              <p className="text-[11px] text-purple-900 font-semibold">
                Fecha vencimiento actual: <span className="font-mono">{creditStatus.dueDate}</span>
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-extrabold text-purple-950">
                Selecciona los días de extensión:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setExtendDaysSelected(15)}
                  className={`p-3 rounded-xl border text-center font-bold text-xs cursor-pointer transition-all ${
                    extendDaysSelected === 15
                      ? 'bg-purple-900 text-white border-purple-900 shadow-xs'
                      : 'bg-white text-purple-950 border-purple-200 hover:bg-purple-50'
                  }`}
                >
                  <span className="block text-sm font-black">+15 Días</span>
                  <span className="text-[10px] opacity-80">Quincenal</span>
                </button>

                <button
                  type="button"
                  onClick={() => setExtendDaysSelected(30)}
                  className={`p-3 rounded-xl border text-center font-bold text-xs cursor-pointer transition-all ${
                    extendDaysSelected === 30
                      ? 'bg-purple-900 text-white border-purple-900 shadow-xs'
                      : 'bg-white text-purple-950 border-purple-200 hover:bg-purple-50'
                  }`}
                >
                  <span className="block text-sm font-black">+30 Días</span>
                  <span className="text-[10px] opacity-80">Mensual</span>
                </button>
              </div>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs">
              <p className="font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <span>Solicitud directa a tu asesor de crédito</span>
              </p>
              <p className="text-[11px] text-amber-800/90 mt-0.5">
                Tu solicitud será atendida y aprobada inmediatamente por un asesor asignado de GRUPO ULEP S.A.S.
              </p>
            </div>

            <div className="space-y-2 pt-1">
              <a
                href={`https://wa.me/573169008561?text=${encodeURIComponent(
                  `Hola GRUPO ULEP S.A.S., deseo solicitar una EXTENSIÓN de plazo de ${extendDaysSelected} DÍAS para mi crédito.\n\n👤 Cliente: ${user.name}\n🪪 Cédula: ${user.cedula}\n💰 Deuda: $${currentDebt.toLocaleString('es-CO')} COP\n📅 Días de prórroga deseados: ${extendDaysSelected} días adicionales`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowExtendModal(false)}
                className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-black text-sm rounded-xl transition-all duration-200 shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Solicitar Extensión (+{extendDaysSelected} Días)</span>
              </a>

              <button
                type="button"
                onClick={() => setShowExtendModal(false)}
                className="w-full py-2 text-xs font-bold text-slate-500 hover:text-purple-950 cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CASO: CRÉDITO ACTIVO */}
      {showPayOptions && (
        <div className="bg-white p-5 rounded-2xl border border-purple-100 shadow-xs space-y-4 transition-all duration-300 hover:shadow-md animate-fade-in-up">
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
            {/* BOTÓN LARGO: PAGAR OTRO VALOR CON FLECHA (V) */}
            <div>
              <button
                type="button"
                onClick={() => setShowCustomInput(!showCustomInput)}
                className={`w-full py-3.5 px-4 rounded-xl font-bold border transition-all duration-200 flex items-center justify-between cursor-pointer active:scale-[0.99] ${
                  showCustomInput
                    ? 'bg-purple-100 border-purple-400 text-purple-950 shadow-xs'
                    : 'bg-purple-50/80 hover:bg-purple-100/90 border-purple-200 text-purple-950'
                }`}
              >
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-purple-900" />
                  <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wide">
                    Pagar otro valor
                  </span>
                </div>
                <div className="flex items-center gap-1 text-purple-900 font-bold text-xs">
                  <span>{showCustomInput ? 'Ocultar' : 'Ingresar monto'}</span>
                  {showCustomInput ? (
                    <ChevronUp className="w-4 h-4 shrink-0 transition-transform" />
                  ) : (
                    <ChevronDown className="w-4 h-4 shrink-0 transition-transform" />
                  )}
                </div>
              </button>

              {/* DESPLIEGUE: COLOCAR OTRO VALOR Y PAGAR */}
              {showCustomInput && (
                <div className="mt-2 p-4 bg-purple-50/90 border border-purple-200 rounded-xl space-y-3 animate-scale-in">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-purple-950">
                      Monto a pagar ($ COP):
                    </label>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Máx: ${currentDebt.toLocaleString('es-CO')}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-2.5 text-slate-400 font-mono font-bold text-sm">$</span>
                      <input
                        type="number"
                        min="1"
                        max={currentDebt}
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                        placeholder="Ingresa valor deseado"
                        className="w-full pl-7 pr-3 py-2 bg-white border border-purple-200 rounded-xl font-mono text-sm font-bold text-purple-950 focus:outline-none focus:ring-2 focus:ring-purple-700"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => executePayment(parseFloat(customAmount || '0'))}
                      className="px-5 py-2 bg-purple-900 hover:bg-purple-950 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Pagar</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* BOTÓN LARGO: CARACTERÍSTICAS */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowCharacteristics(!showCharacteristics)}
                className={`w-full py-3.5 px-4 rounded-xl font-bold border transition-all duration-200 flex items-center justify-between cursor-pointer active:scale-[0.99] ${
                  showCharacteristics
                    ? 'bg-purple-900 text-white border-purple-900 shadow-xs'
                    : 'bg-white hover:bg-purple-50/70 border-purple-200 text-purple-950'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileText className={`w-4 h-4 ${showCharacteristics ? 'text-emerald-300' : 'text-purple-800'}`} />
                  <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wide">
                    Características
                  </span>
                </div>
                <div className="flex items-center gap-1 font-bold text-xs">
                  <span>{showCharacteristics ? 'Ocultar detalles' : 'Ver desglose'}</span>
                  {showCharacteristics ? (
                    <ChevronUp className="w-4 h-4 shrink-0 transition-transform" />
                  ) : (
                    <ChevronDown className="w-4 h-4 shrink-0 transition-transform" />
                  )}
                </div>
              </button>

              {/* DESPLIEGUE: INFORMACIÓN DE CARACTERÍSTICAS */}
              {showCharacteristics && (
                <div className="mt-2 p-4 bg-white border border-purple-200 rounded-xl space-y-3 animate-scale-in shadow-2xs">
                  <div className="flex items-center justify-between border-b border-purple-100 pb-2">
                    <span className="text-[11px] font-bold text-purple-950 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-purple-800" />
                      Desglose de Crédito
                    </span>
                    <span className="text-[10px] font-mono text-purple-900 bg-purple-50 px-2 py-0.5 rounded-full font-bold">
                      GRUPO ULEP S.A.S.
                    </span>
                  </div>

                  <div className="space-y-2 text-xs divide-y divide-purple-50">
                    {/* Monto Principal */}
                    <div className="pt-1.5 flex items-center justify-between">
                      <span className="text-slate-600 font-medium">Monto Principal:</span>
                      <span className="font-mono font-bold text-purple-950">
                        ${Math.round(currentDebt * 0.78).toLocaleString('es-CO')} COP
                      </span>
                    </div>

                    {/* Interés */}
                    <div className="pt-1.5 flex items-center justify-between">
                      <span className="text-slate-600 font-medium">Interés:</span>
                      <span className="font-mono font-bold text-purple-950">
                        ${Math.round(currentDebt * 0.05).toLocaleString('es-CO')} COP
                      </span>
                    </div>

                    {/* Fianza */}
                    <div className="pt-1.5 flex items-center justify-between">
                      <span className="text-slate-600 font-medium">Fianza:</span>
                      <span className="font-mono font-bold text-purple-950">
                        ${Math.round(currentDebt * 0.08).toLocaleString('es-CO')} COP
                      </span>
                    </div>

                    {/* Firma Electrónica */}
                    <div className="pt-1.5 flex items-center justify-between">
                      <span className="text-slate-600 font-medium">Firma Electrónica:</span>
                      <span className="font-mono font-bold text-purple-950">
                        ${(15000).toLocaleString('es-CO')} COP
                      </span>
                    </div>

                    {/* IVA */}
                    <div className="pt-1.5 flex items-center justify-between">
                      <span className="text-slate-600 font-medium">IVA:</span>
                      <span className="font-mono font-bold text-purple-950">
                        ${Math.max(0, currentDebt - Math.round(currentDebt * 0.78) - Math.round(currentDebt * 0.05) - Math.round(currentDebt * 0.08) - 15000).toLocaleString('es-CO')} COP
                      </span>
                    </div>

                    {/* Fecha Límite de Pago */}
                    <div className="pt-1.5 flex items-center justify-between">
                      <span className="text-slate-600 font-medium">Fecha Límite de Pago:</span>
                      <span className="font-mono font-bold text-purple-900 bg-purple-50 px-2 py-0.5 rounded">
                        {creditStatus.dueDate}
                      </span>
                    </div>

                    {/* Pago Total */}
                    <div className="pt-2 flex items-center justify-between border-t border-purple-200">
                      <span className="text-xs font-black text-purple-950 uppercase tracking-wide">
                        Pago Total:
                      </span>
                      <span className="text-sm font-black font-mono text-purple-950">
                        ${currentDebt.toLocaleString('es-CO')} COP
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}


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
        <span className="text-slate-600 font-medium">Soporte GRUPO ULEP S.A.S.</span>
        <a
          href={`https://wa.me/573169008561?text=${encodeURIComponent(`Hola GRUPO ULEP S.A.S., soporte - Cédula: ${user.cedula}`)}`}
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
