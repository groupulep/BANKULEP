import React, { useState, useImperativeHandle, forwardRef } from 'react';
import { RefreshCw, ShieldCheck, CheckCircle2, AlertCircle, MoveRight } from 'lucide-react';

export interface CaptchaHandle {
  verify: () => boolean;
  reset: () => void;
  autoVerify: () => void;
}

interface CaptchaProps {
  type?: 'slider';
  onVerifyStatusChange?: (isValid: boolean) => void;
}

export const Captcha = forwardRef<CaptchaHandle, CaptchaProps>(({
  onVerifyStatusChange
}, ref) => {
  const [sliderPos, setSliderPos] = useState(0);
  const [sliderTarget] = useState(88); // Target percentage
  const [isVerified, setIsVerified] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const resetCaptcha = () => {
    setSliderPos(0);
    setIsVerified(false);
    setErrorMsg('');
    if (onVerifyStatusChange) onVerifyStatusChange(false);
  };

  const handleVerify = (): boolean => {
    setErrorMsg('');
    // Check slider precision
    if (Math.abs(sliderPos - sliderTarget) <= 6) {
      setIsVerified(true);
      if (onVerifyStatusChange) onVerifyStatusChange(true);
      return true;
    } else {
      setIsVerified(false);
      setErrorMsg('No encajó el deslizador. Inténtalo otra vez.');
      setSliderPos(0);
      if (onVerifyStatusChange) onVerifyStatusChange(false);
      return false;
    }
  };

  const autoVerify = () => {
    setSliderPos(sliderTarget);
    setIsVerified(true);
    setErrorMsg('');
    if (onVerifyStatusChange) onVerifyStatusChange(true);
  };

  useImperativeHandle(ref, () => ({
    verify: handleVerify,
    reset: resetCaptcha,
    autoVerify
  }));

  return (
    <div className="bg-purple-50/80 border border-purple-200/80 rounded-2xl p-4 transition-all duration-200 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-purple-700" />
          <span className="text-sm font-semibold text-purple-950">
            Verificación de Seguridad (CAPTCHA)
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={resetCaptcha}
            className="p-1.5 text-purple-700 hover:text-purple-900 rounded-lg hover:bg-purple-100 transition-colors"
            title="Recargar CAPTCHA"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Slider Puzzle Only */}
      <div className="space-y-3">
        <div className="relative h-12 bg-white rounded-xl border border-purple-200 overflow-hidden flex items-center px-2 select-none shadow-inner">
          {/* Target Area Indicator */}
          <div
            className="absolute top-1 bottom-1 bg-purple-200 border-2 border-dashed border-purple-600 rounded-lg flex items-center justify-center text-[10px] font-bold text-purple-800"
            style={{ left: `${sliderTarget - 5}%`, width: '12%' }}
          >
            AQUÍ
          </div>

          {/* Slider track line */}
          <div className="w-full h-1 bg-purple-100 rounded-full" />

          {/* Slider handle */}
          <input
            type="range"
            min="0"
            max="100"
            value={sliderPos}
            onChange={(e) => {
              setSliderPos(Number(e.target.value));
              setErrorMsg('');
            }}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
          />

          <div
            className={`absolute h-9 w-9 rounded-xl flex items-center justify-center shadow-md transition-transform duration-75 pointer-events-none z-0 ${
              Math.abs(sliderPos - sliderTarget) <= 6
                ? 'bg-emerald-600 text-white'
                : 'bg-purple-700 text-white'
            }`}
            style={{ left: `calc(${sliderPos}% - ${(sliderPos / 100) * 32}px)` }}
          >
            {Math.abs(sliderPos - sliderTarget) <= 6 ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <MoveRight className="w-5 h-5" />
            )}
          </div>
        </div>
        <p className="text-xs text-purple-700 text-center font-medium">
          Desliza el botón morado hacia el recuadro "AQUÍ"
        </p>
      </div>

      {errorMsg && (
        <div className="mt-2.5 flex items-center gap-1.5 text-xs text-rose-600 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {isVerified && (
        <div className="mt-2.5 flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Verificación de seguridad completada con éxito.</span>
        </div>
      )}
    </div>
  );
});

Captcha.displayName = 'Captcha';
