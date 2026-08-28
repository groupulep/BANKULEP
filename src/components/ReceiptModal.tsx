import React from 'react';
import { Transaction } from '../types';
import { CheckCircle2, Download, X, Copy, Check, ShieldCheck } from 'lucide-react';

interface ReceiptModalProps {
  transaction: Transaction | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ transaction, onClose }) => {
  const [copied, setCopied] = React.useState(false);

  if (!transaction) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(`Comprobante ULEP - Folio: ${transaction.id} | Monto: $${transaction.amount.toLocaleString('es-CO')} COP`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-purple-950/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-purple-100 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-800 to-purple-900 text-white p-6 relative text-center">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-purple-200 hover:text-white p-1 rounded-full hover:bg-purple-700/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="inline-flex items-center px-4 py-2 bg-purple-950/60 border border-purple-700/50 rounded-2xl shadow-inner">
              <img
                src="/imagulep/1_1.png"
                alt="CrediULEP Logo"
                referrerPolicy="no-referrer"
                className="h-9 w-auto max-w-[140px] object-contain drop-shadow"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.src.includes('1_1.png')) {
                    target.src = '/imagulep/1_1.png';
                  }
                }}
              />
            </div>
          </div>

          <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-2 backdrop-blur-md border border-white/20">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          </div>

          <h3 className="text-xl font-bold font-sans tracking-tight">Comprobante de Operación</h3>
          <p className="text-xs text-purple-200 font-medium mt-1">
            GRUPO ULEP S.A.S. - Red de Pagos Digitales
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="text-center bg-purple-50 p-4 rounded-2xl border border-purple-100">
            <span className="text-xs text-purple-700 uppercase tracking-wider font-semibold">Monto Procesado</span>
            <div className="text-3xl font-extrabold text-purple-950 mt-1 font-mono">
              ${transaction.amount.toLocaleString('es-CO')} <span className="text-xs font-normal">COP</span>
            </div>
          </div>

          <div className="space-y-3 text-sm text-slate-700 divide-y divide-purple-50">
            <div className="flex justify-between items-center pt-2">
              <span className="text-slate-500 font-medium">Concepto:</span>
              <span className="font-semibold text-purple-950">{transaction.description}</span>
            </div>

            {transaction.recipientName && (
              <div className="flex justify-between items-center pt-2">
                <span className="text-slate-500 font-medium">Beneficiario:</span>
                <span className="font-semibold text-purple-950">{transaction.recipientName}</span>
              </div>
            )}

            {transaction.recipientBank && (
              <div className="flex justify-between items-center pt-2">
                <span className="text-slate-500 font-medium">Banco Destino:</span>
                <span className="font-semibold text-purple-950">{transaction.recipientBank}</span>
              </div>
            )}

            <div className="flex justify-between items-center pt-2">
              <span className="text-slate-500 font-medium">Fecha y Hora:</span>
              <span className="font-mono text-xs font-semibold text-slate-800">{transaction.date}</span>
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-slate-500 font-medium">Folio de Rastreo SPEI:</span>
              <span className="font-mono text-xs font-bold text-purple-800">{transaction.id}</span>
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-slate-500 font-medium">Estado:</span>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                <ShieldCheck className="w-3.5 h-3.5" /> Exitoso
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-4 flex gap-3">
            <button
              onClick={handleCopy}
              className="flex-1 flex items-center justify-center gap-2 bg-purple-50 border border-purple-200 text-purple-800 py-2.5 px-4 rounded-xl text-xs font-semibold hover:bg-purple-100 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              {copied ? '¡Copiado!' : 'Copiar Folio'}
            </button>
            <button
              onClick={() => {
                alert('Descargando comprobante en PDF...');
              }}
              className="flex-1 flex items-center justify-center gap-2 bg-purple-800 text-white py-2.5 px-4 rounded-xl text-xs font-semibold hover:bg-purple-900 transition-colors shadow-md"
            >
              <Download className="w-4 h-4" />
              Descargar PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
