import React, { useState } from 'react';
import { BankCard } from '../types';
import { Lock, Unlock, Eye, EyeOff, ShieldCheck, Sparkles, RefreshCw } from 'lucide-react';

interface NuCardProps {
  card: BankCard;
  onToggleFreeze?: (cardId: string) => void;
  onRegenerateCvv?: (cardId: string) => void;
}

export const NuCard: React.FC<NuCardProps> = ({ card, onToggleFreeze, onRegenerateCvv }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [showCvv, setShowCvv] = useState(false);

  return (
    <div className="group relative w-full max-w-sm mx-auto perspective-1000">
      {/* Container with flip effect */}
      <div
        className={`relative w-full h-52 rounded-3xl transition-transform duration-700 transform-style-3d cursor-pointer shadow-xl border border-purple-400/30 ${
          isFlipped ? 'rotate-y-180' : ''
        }`}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        {/* FRONT OF CARD */}
        <div
          className={`absolute inset-0 w-full h-full rounded-3xl p-6 flex flex-col justify-between overflow-hidden text-white backface-hidden ${
            card.isFrozen
              ? 'bg-gradient-to-br from-slate-800 via-purple-950 to-slate-900 grayscale-[0.5]'
              : 'bg-gradient-to-br from-purple-700 via-purple-800 to-purple-950'
          }`}
          style={{
            backgroundImage: card.isFrozen
              ? undefined
              : 'radial-gradient(circle at 80% 20%, rgba(161, 28, 240, 0.4) 0%, transparent 60%), linear-gradient(135deg, #8A05BE 0%, #4C0677 100%)'
          }}
        >
          {/* Subtle glossy background waves */}
          <div className="absolute -right-12 -bottom-12 w-48 h-48 rounded-full bg-white/5 blur-2xl pointer-events-none" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-400/10 rounded-full blur-xl pointer-events-none" />

          {/* Top row: Nu Logo + Card Type Badge + Contactless */}
          <div className="flex items-center justify-between z-10">
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tighter text-white font-sans drop-shadow-sm">
                CU
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-white/15 text-purple-100 backdrop-blur-md">
                {card.type === 'virtual' ? 'Virtual' : 'Física'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {card.isFrozen ? (
                <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-500/30 text-rose-200 border border-rose-400/40 backdrop-blur-md">
                  <Lock className="w-3 h-3" /> Congelada
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 backdrop-blur-md">
                  <ShieldCheck className="w-3 h-3" /> Activa
                </span>
              )}
              {/* Contactless Icon */}
              <svg className="w-5 h-5 text-white/80" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v2h-2zm0 4h2v6h-2z" />
              </svg>
            </div>
          </div>

          {/* Middle row: Metallic Chip */}
          <div className="my-auto z-10 flex items-center justify-between">
            <div className="w-11 h-8 bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-300 rounded-lg border border-yellow-500/50 shadow-inner relative overflow-hidden flex items-center justify-center">
              <div className="w-full h-[1px] bg-yellow-700/40 absolute top-2" />
              <div className="w-full h-[1px] bg-yellow-700/40 absolute bottom-2" />
              <div className="h-full w-[1px] bg-yellow-700/40 absolute left-3" />
              <div className="h-full w-[1px] bg-yellow-700/40 absolute right-3" />
            </div>
            <span className="text-xs text-purple-200/80 font-mono tracking-wider">
              Haz clic para voltear
            </span>
          </div>

          {/* Bottom row: Cardholder Name & Number */}
          <div className="z-10 space-y-1">
            <div className="text-lg font-mono tracking-widest text-white/90 drop-shadow">
              {card.cardNumber}
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[9px] uppercase tracking-wider text-purple-200/70 font-semibold">Titular</p>
                <p className="text-xs font-bold uppercase tracking-wider text-white">{card.cardHolder}</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] uppercase tracking-wider text-purple-200/70 font-semibold">Vence</p>
                <p className="text-xs font-mono font-bold text-white">{card.expiry}</p>
              </div>
            </div>
          </div>
        </div>

        {/* BACK OF CARD */}
        <div
          className="absolute inset-0 w-full h-full rounded-3xl p-6 flex flex-col justify-between overflow-hidden text-white bg-slate-950 border border-purple-500/30 rotate-y-180 backface-hidden shadow-2xl"
        >
          {/* Magnetic Strip */}
          <div className="-mx-6 -mt-1 h-10 bg-slate-800 border-y border-slate-700" />

          {/* Signature & CVV Panel */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-purple-300">
              <span className="font-semibold">Firma Autorizada</span>
              <span className="font-semibold font-mono">CVV / CVC</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-9 bg-slate-200 rounded-lg flex items-center px-3 font-serif italic text-slate-700 text-sm tracking-widest border border-slate-300">
                {card.cardHolder}
              </div>
              <div className="w-20 h-9 bg-white text-slate-950 font-mono font-bold rounded-lg flex items-center justify-center text-sm border border-slate-300 tracking-wider">
                {showCvv ? card.cvv : '•••'}
              </div>
            </div>
          </div>

          {/* Back Footer Actions */}
          <div className="flex items-center justify-between text-xs border-t border-slate-800 pt-3">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowCvv(!showCvv);
              }}
              className="flex items-center gap-1.5 text-purple-300 hover:text-white transition-colors"
            >
              {showCvv ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showCvv ? 'Ocultar CVV' : 'Ver CVV'}</span>
            </button>

            {card.type === 'virtual' && onRegenerateCvv && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRegenerateCvv(card.id);
                }}
                className="flex items-center gap-1 text-xs text-purple-300 hover:text-white transition-colors bg-purple-900/50 px-2 py-1 rounded-md"
              >
                <RefreshCw className="w-3 h-3" /> CVV dinámico
              </button>
            )}

            <span className="text-[10px] text-slate-500 font-mono">MasterCard / CrediULEP</span>
          </div>
        </div>
      </div>

      {/* Control buttons below card */}
      <div className="mt-4 flex items-center justify-center gap-3">
        {onToggleFreeze && (
          <button
            type="button"
            onClick={() => onToggleFreeze(card.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-sm ${
              card.isFrozen
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
            }`}
          >
            {card.isFrozen ? (
              <>
                <Unlock className="w-4 h-4" /> Descongelar tarjeta
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" /> Congelar tarjeta
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
