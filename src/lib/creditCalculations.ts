import { User, CreditStatusInfo, CreditInstallment } from '../types';

/**
 * Parsea una fecha en formato YYYY-MM-DD o ISO a objeto Date local
 */
export function parseDate(dateStr?: string): Date {
  if (!dateStr) return new Date();
  // Si viene como YYYY-MM-DD, parsear partes para evitar desfases de zona horaria UTC
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d, 12, 0, 0);
  }
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

/**
 * Formatea una fecha en formato legible en español (ej. "15 Ago 2026")
 */
export function formatReadableDate(date: Date | string): string {
  const d = typeof date === 'string' ? parseDate(date) : date;
  return d.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

/**
 * Formatea una fecha a formato estándar input YYYY-MM-DD
 */
export function formatInputDate(date: Date | string): string {
  const d = typeof date === 'string' ? parseDate(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calcula lógicamente todo el estado del crédito de un usuario:
 * - Fecha de otorgamiento específica
 * - Días totales del crédito (15, 30, 45, 60, etc.)
 * - Cantidad y calendario de pagos (quincenas o pagos mensuales)
 * - Estado dinámico calculado (Cancelado si saldo es 0, Al Día si está en plazo, En Mora si superó la fecha)
 */
export function calculateCreditStatus(user: User): CreditStatusInfo {
  const creditUsed = Number(user.creditUsed) || 0;
  const paymentTermDays = Number(user.paymentTermDays) || 30;
  
  // Frecuencia de pago: quincenal (15 días) o mensual (30 días)
  const frequency: 'quincenal' | 'mensual' = 
    user.loanPaymentFrequency || (paymentTermDays <= 15 ? 'quincenal' : 'mensual');
  
  const daysPerInstallment = frequency === 'quincenal' ? 15 : 30;
  
  // Número de cuotas/pagos calculados (quincenas o mensualidades)
  const calculatedInstallmentsCount = user.loanQuotasTotal && user.loanQuotasTotal > 0
    ? user.loanQuotasTotal
    : Math.max(1, Math.round(paymentTermDays / daysPerInstallment));

  // Fecha de inicio específica del crédito (si no existe, usa createdAt o una fecha reciente por defecto)
  const startRaw = user.loanStartDate || user.createdAt || formatInputDate(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000));
  const startDateObj = parseDate(startRaw);
  const now = new Date();

  // Fecha de vencimiento total
  const dueDateObj = new Date(startDateObj.getTime() + paymentTermDays * 24 * 60 * 60 * 1000);
  
  // Días transcurridos desde la fecha de inicio
  const diffTime = now.getTime() - startDateObj.getTime();
  const elapsedDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
  
  // Días restantes o días de atraso
  const remainingDays = Math.max(0, paymentTermDays - elapsedDays);
  const isOverdue = now.getTime() > dueDateObj.getTime() && creditUsed > 0;
  const daysOverdue = isOverdue
    ? Math.max(1, Math.floor((now.getTime() - dueDateObj.getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  // Monto por cuota (si está explícito o calculado dividiendo la deuda)
  const installmentAmount = user.loanQuota && user.loanQuota > 0
    ? user.loanQuota
    : creditUsed > 0
    ? Math.round(creditUsed / calculatedInstallmentsCount)
    : 0;

  // Generación del calendario de cuotas (quincenas o meses)
  const installments: CreditInstallment[] = [];
  for (let i = 1; i <= calculatedInstallmentsCount; i++) {
    const installmentDueTime = startDateObj.getTime() + (i * daysPerInstallment) * 24 * 60 * 60 * 1000;
    const instDueDate = new Date(installmentDueTime);
    const isPast = now.getTime() > installmentDueTime;
    const isCurrent = !isPast && (i === 1 || now.getTime() > (startDateObj.getTime() + ((i - 1) * daysPerInstallment) * 24 * 60 * 60 * 1000));
    
    installments.push({
      number: i,
      dueDate: formatReadableDate(instDueDate),
      amount: installmentAmount,
      daysFromStart: i * daysPerInstallment,
      isPast,
      isCurrent
    });
  }

  // CÁLCULO LÓGICO DEL ESTADO:
  // 1. Si no tiene deuda (creditUsed <= 0) -> Cancelado / Liquidado / Sin Deuda
  // 2. Si tiene deuda y no ha superado la fecha límite -> Activo (Al Día)
  // 3. Si tiene deuda y ya superó la fecha límite -> En Mora
  let computedStatus: 'active' | 'pending' | 'blocked';
  let statusLabel: string;
  let statusReason: string;
  let statusColor: string;
  let badgeBg: string;
  let badgeText: string;

  if (creditUsed <= 0) {
    computedStatus = 'blocked';
    statusLabel = 'Cancelado ($0)';
    statusReason = 'La deuda está totalmente saldada ($0 COP). El cliente puede solicitar una nueva línea.';
    statusColor = 'emerald';
    badgeBg = 'bg-slate-100 border border-slate-300';
    badgeText = 'text-slate-700';
  } else if (isOverdue) {
    computedStatus = 'pending';
    statusLabel = `En Mora (${daysOverdue} ${daysOverdue === 1 ? 'día' : 'días'})`;
    statusReason = `Superó la fecha límite del ${formatReadableDate(dueDateObj)} con un saldo de $${creditUsed.toLocaleString('es-CO')} COP.`;
    statusColor = 'amber';
    badgeBg = 'bg-rose-100 border border-rose-300';
    badgeText = 'text-rose-900';
  } else {
    computedStatus = 'active';
    statusLabel = 'Activo (Al Día)';
    statusReason = `Crédito dentro del período pactado. Quedan ${remainingDays} días antes de la fecha límite (${formatReadableDate(dueDateObj)}).`;
    statusColor = 'emerald';
    badgeBg = 'bg-emerald-100 border border-emerald-300';
    badgeText = 'text-emerald-900';
  }

  const frequencyLabel = frequency === 'quincenal' 
    ? `${calculatedInstallmentsCount} ${calculatedInstallmentsCount === 1 ? 'Quincena (15 Días)' : 'Quincenas'}`
    : `${calculatedInstallmentsCount} ${calculatedInstallmentsCount === 1 ? 'Pago Mensual (30 Días)' : 'Pagos Mensuales'}`;

  return {
    computedStatus,
    statusLabel,
    statusReason,
    statusColor,
    badgeBg,
    badgeText,
    isOverdue,
    startDate: formatReadableDate(startDateObj),
    dueDate: formatReadableDate(dueDateObj),
    totalDays: paymentTermDays,
    paymentTermDays,
    elapsedDays: Math.min(elapsedDays, paymentTermDays),
    remainingDays,
    daysOverdue,
    installmentsCount: calculatedInstallmentsCount,
    installmentAmount,
    frequency,
    frequencyLabel,
    installments
  };
}
