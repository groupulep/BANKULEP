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
    const updatedStatusInfo = calculateCreditStatus({ ...user, creditUsed: newCreditUsed });
    const newStatus: 'active' | 'blocked' | 'pending' = newCreditUsed <= 0 ? 'blocked' : (updatedStatusInfo.isOverdue ? 'pending' : 'active');

    const updatedUser: User = {
      ...user,
      balance: newBalance,
      creditUsed: newCreditUsed,
      status: newStatus
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
    return (
      <div className="max-w-xl mx-auto space-y-6 py-6 pb-12 animate-fade-in-up">
        {/* Título simple y centrado */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black text-purple-950 tracking-tight">
            Solicita otro crédito
          </h1>
        </div>

        {/* Simulador de Crédito */}
        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-purple-100 shadow-md space-y-5 animate-scale-in">
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

          <form onSubmit={handleRequestNewLoan} className="space-y-6">
            {/* Línea de Monto a solicitar */}
            <div className="space-y-3 p-5 sm:p-6 bg-purple-50/80 border border-purple-100 rounded-3xl">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700 uppercase tracking-wider text-xs sm:text-sm">Monto a solicitar:</span>
                <span className="font-black font-mono text-purple-950 text-lg sm:text-2xl">
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
                className="w-full h-3 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-800"
              />
              <div className="flex justify-between text-xs text-slate-400 font-mono font-bold pt-1">
                <span>$100.000</span>
                <span>Máximo ${maxAvailableCredit.toLocaleString('es-CO')} COP</span>
              </div>
            </div>

            {/* Botón de solicitar grande */}
            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-black py-4 sm:py-5 px-6 rounded-2xl text-base sm:text-lg transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-3 cursor-pointer"
            >
              <Send className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
              <span>Solicitar ${requestAmount.toLocaleString('es-CO')} COP</span>
            </button>
          </form>
        </div>

        {/* Pie de página sencillo */}
        <footer className="pt-6 pb-2 border-t border-purple-100/80 text-center space-y-1.5 text-xs text-slate-500">
          <p className="font-semibold text-purple-950/80">
            © {new Date().getFullYear()} GRUPO ULEP S.A.S. Todos los derechos reservados.
          </p>
          <p className="text-[11px] text-slate-400">
            Créditos responsables y seguros • Vigilado y protegido
          </p>
        </footer>

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
      <div className="max-w-xl mx-auto space-y-6 py-6 pb-14 animate-fade-in-up">
        {/* Contenedor con brillo rojo ambiental */}
        <div className="relative p-1">
          <div className="absolute inset-0 bg-red-500/15 blur-3xl -z-10 rounded-full pointer-events-none animate-pulse-glow" />

          {/* Mensaje de encabezado centrado con tono rojo intenso */}
          <div className="text-center space-y-2 mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-red-600 text-white border-2 border-red-400 rounded-full text-xs sm:text-sm font-black uppercase tracking-widest shadow-xl shadow-red-600/40 animate-pulse">
              <AlertTriangle className="w-4 h-4 text-white" />
              <span>Crédito en mora ({creditStatus.daysOverdue} {creditStatus.daysOverdue === 1 ? 'día' : 'días'})</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-red-950 tracking-tight pt-1">
              Paga tu deuda pendiente
            </h1>
            <p className="text-xs sm:text-sm text-red-900/90 font-semibold max-w-md mx-auto">
              Hola <span className="font-black text-red-950">{user.name}</span>, tu crédito venció el <strong className="text-red-700 bg-red-100 px-2 py-0.5 rounded-md font-mono border border-red-300">{creditStatus.dueDate}</strong>. Realiza el pago de inmediato para normalizar tu historial con GRUPO ULEP S.A.S.
            </p>
          </div>

          {/* Tarjeta de Pago de Deuda con estilo rojo brillante */}
          <div className="bg-white/95 backdrop-blur-md p-6 sm:p-8 rounded-3xl border-2 border-red-500 shadow-2xl shadow-red-600/25 space-y-6 relative overflow-hidden animate-scale-in">
            {/* Resplandor decorativo interno */}
            <div className="absolute -top-16 -right-16 w-40 h-40 bg-red-500/15 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between border-b border-red-100 pb-3 relative z-10">
              <h2 className="text-sm font-black text-red-950 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-red-600" />
                Saldo en Mora
              </h2>
              <span className="text-xs font-black text-white bg-red-600 border border-red-400 px-3.5 py-1 rounded-full font-mono shadow-md shadow-red-500/30 animate-pulse">
                Venció: {creditStatus.dueDate}
              </span>
            </div>

            {/* Panel de Saldos en Rojo Intenso */}
            <div className="grid grid-cols-2 gap-3 p-5 sm:p-6 bg-gradient-to-br from-red-700 via-rose-800 to-red-900 text-white border-2 border-red-400/60 rounded-3xl text-center shadow-xl shadow-red-900/30 relative z-10">
              <div className="border-r border-red-500/50 pr-2">
                <span className="text-[11px] font-bold text-red-200 uppercase tracking-wider block">Deuda Total</span>
                <p className="text-xl sm:text-2xl font-black font-mono text-white mt-1 drop-shadow-md">
                  ${debtToPay.toLocaleString('es-CO')}
                </p>
              </div>
              <div className="pl-2">
                <span className="text-[11px] font-bold text-amber-200 uppercase tracking-wider block">
                  {creditStatus.frequency === 'quincenal' ? 'Cuota Quincenal' : 'Cuota del Mes'}
                </span>
                <p className="text-xl sm:text-2xl font-black font-mono text-amber-300 mt-1 drop-shadow-md">
                  ${quotaToPay.toLocaleString('es-CO')}
                </p>
              </div>
            </div>

            {paySuccess && (
              <div className="bg-emerald-50 border-2 border-emerald-400 p-4 rounded-2xl flex items-center justify-between text-xs text-emerald-900 font-bold shadow-lg shadow-emerald-200 animate-scale-in relative z-10">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>Pago procesado exitosamente</span>
                </div>
                <button
                  type="button"
                  onClick={() => setPaySuccess(false)}
                  className="text-emerald-950 underline text-xs font-black cursor-pointer hover:opacity-80"
                >
                  Cerrar
                </button>
              </div>
            )}

            {payError && (
              <div className="bg-red-50 border-2 border-red-400 p-3.5 rounded-2xl text-xs text-red-900 font-bold shadow-md animate-scale-in relative z-10">
                {payError}
              </div>
            )}

            {/* BOTONES DE PAGO GRANDES E ILUMINADOS */}
            <div className="space-y-4 pt-1 relative z-10">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* BOTÓN 1: PAGAR CUOTA (GRANDE E ILUMINADO) */}
                <button
                  type="button"
                  onClick={() => executePayment(quotaToPay)}
                  className="p-5 sm:p-6 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 active:scale-[0.98] text-white rounded-3xl font-black transition-all duration-300 shadow-xl shadow-red-600/50 ring-4 ring-red-400/60 hover:ring-red-300 hover:shadow-2xl hover:shadow-red-500/80 flex flex-col items-center justify-center text-center cursor-pointer relative overflow-hidden group"
                >
                  <span className="text-xs uppercase tracking-widest font-extrabold text-red-100 drop-shadow-xs">Pagar Cuota</span>
                  <span className="text-lg sm:text-xl font-black font-mono mt-1 text-amber-300 drop-shadow-md">
                    ${quotaToPay.toLocaleString('es-CO')} COP
                  </span>
                </button>

                {/* BOTÓN 2: PAGAR CUOTA PERSONALIZADA (GRANDE E ILUMINADO) */}
                <button
                  type="button"
                  onClick={() => setShowCustomInput(!showCustomInput)}
                  className={`p-5 sm:p-6 rounded-3xl font-black border-2 transition-all duration-300 text-center flex flex-col items-center justify-center cursor-pointer active:scale-[0.98] ${
                    showCustomInput
                      ? 'bg-red-100 border-red-500 text-red-950 ring-4 ring-red-400/60 shadow-xl shadow-red-400/40'
                      : 'bg-rose-50 hover:bg-rose-100 border-red-400 text-red-900 ring-2 ring-red-300/50 shadow-lg shadow-rose-300/30 hover:shadow-xl hover:shadow-red-400/50 hover:ring-red-400'
                  }`}
                >
                  <span className="text-xs uppercase tracking-widest font-extrabold">Pagar Otro Valor</span>
                  <span className="text-sm font-bold mt-1 text-red-700">
                    {showCustomInput ? '▲ Ocultar campo' : '▼ Cuota personalizada'}
                  </span>
                </button>
              </div>

              {/* BOTÓN 3: LIQUIDACIÓN TOTAL (GRANDE, BRILLANTE E ILUMINADO) */}
              <button
                type="button"
                onClick={() => executePayment(debtToPay)}
                className="w-full py-5 sm:py-6 px-6 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.98] text-white rounded-3xl font-black text-base sm:text-lg tracking-wide transition-all duration-300 shadow-xl shadow-emerald-600/50 ring-4 ring-emerald-400/50 hover:ring-emerald-300 hover:shadow-2xl hover:shadow-emerald-500/80 flex items-center justify-center gap-3 cursor-pointer"
              >
                <CheckCircle2 className="w-6 h-6 shrink-0" />
                <span>Liquidar Total Deuda (${debtToPay.toLocaleString('es-CO')} COP)</span>
              </button>

              {showCustomInput && (
                <div className="p-5 bg-red-50 border-2 border-red-400 rounded-3xl space-y-3 shadow-xl shadow-red-200/50 animate-scale-in">
                  <label className="block text-xs font-black text-red-950 uppercase tracking-wider">
                    Ingresa el valor a abonar ($ COP):
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="1"
                      max={debtToPay}
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      placeholder="Monto a pagar"
                      className="flex-1 px-4 py-3.5 bg-white border-2 border-red-400 rounded-2xl font-mono text-base font-black text-red-950 focus:outline-none focus:ring-4 focus:ring-red-400/50"
                    />
                    <button
                      type="button"
                      onClick={() => executePayment(parseFloat(customAmount || '0'))}
                      className="px-7 py-3.5 bg-red-700 hover:bg-red-800 active:scale-95 text-white font-black text-sm rounded-2xl shadow-xl shadow-red-700/50 ring-2 ring-red-400 transition-all cursor-pointer"
                    >
                      Pagar
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Soporte WhatsApp Destacado */}
            <div className="pt-3 border-t border-red-100 flex items-center justify-between text-xs relative z-10">
              <span className="text-red-900 font-bold">¿Tienes dudas o necesitas un acuerdo?</span>
              <a
                href={`https://wa.me/573169008561?text=${encodeURIComponent(`Hola GRUPO ULEP S.A.S., soporte pago en mora - Cédula: ${user.cedula} - Nombre: ${user.name}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black rounded-2xl text-xs sm:text-sm transition-all shadow-lg shadow-emerald-600/40 ring-2 ring-emerald-300"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Soporte WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Movimientos */}
          <div className="bg-white/90 backdrop-blur-xs p-5 rounded-3xl border border-red-200 shadow-md space-y-3 mt-6 transition-all duration-300">
            <div className="flex items-center justify-between border-b border-red-50 pb-2">
              <h3 className="text-xs font-black text-red-950 flex items-center gap-2">
                <FileText className="w-4 h-4 text-red-600" />
                Movimientos Recientes
              </h3>
              <span className="text-[11px] text-red-800/70 font-bold">
                {userTransactions.length} transacciones
              </span>
            </div>

            {userTransactions.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">Sin movimientos registrados.</p>
            ) : (
              <div className="divide-y divide-red-50 text-xs">
                {userTransactions.slice(0, 4).map((tx) => (
                  <div
                    key={tx.id}
                    className="py-2.5 flex items-center justify-between hover:bg-red-50/60 px-2 rounded-xl transition-colors"
                  >
                    <div>
                      <p className="font-bold text-red-950 text-xs">{tx.description}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{tx.date}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-black font-mono text-red-950 text-xs">
                        ${tx.amount.toLocaleString('es-CO')}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedReceiptTx(tx)}
                        className="px-2.5 py-1 bg-red-50 hover:bg-red-100 active:scale-95 text-red-900 font-bold rounded-lg text-[10px] cursor-pointer transition-all border border-red-200"
                      >
                        Recibo
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Pie de página */}
        <footer className="pt-6 pb-2 border-t border-red-200/60 text-center space-y-1.5 text-xs text-red-950/70">
          <p className="font-bold text-red-950">
            © {new Date().getFullYear()} GRUPO ULEP S.A.S. Todos los derechos reservados.
          </p>
          <p className="text-[11px] text-red-800/60">
            Créditos responsables y seguros • Vigilado y protegido
          </p>
        </footer>

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
        {/* BOTÓN 1: PAGAR DIRECTAMENTE LA CUOTA */}
        <button
          type="button"
          onClick={() => executePayment(activeQuota)}
          className="w-full py-4 px-6 bg-purple-900 hover:bg-purple-950 active:scale-[0.99] text-white rounded-2xl font-black text-base tracking-wider uppercase transition-all duration-200 shadow-md flex items-center justify-center gap-2 cursor-pointer"
        >
          <DollarSign className="w-5 h-5 text-emerald-300" />
          <span>PAGAR CUOTA</span>
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

      {/* OPCIONES DE PAGO Y DETALLES DEL CRÉDITO SIEMPRE VISIBLES */}
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

      {/* Pie de página sencillo */}
      <footer className="pt-6 pb-2 border-t border-purple-100/80 text-center space-y-1.5 text-xs text-slate-500 animate-fade-in-up">
        <p className="font-semibold text-purple-950/80">
          © {new Date().getFullYear()} GRUPO ULEP S.A.S. Todos los derechos reservados.
        </p>
        <p className="text-[11px] text-slate-400">
          Créditos responsables y seguros • Vigilado y protegido
        </p>
      </footer>

      <ReceiptModal
        transaction={selectedReceiptTx}
        onClose={() => setSelectedReceiptTx(null)}
      />
    </div>
  );
};
