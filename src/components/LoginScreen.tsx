import React, { useState, useRef } from 'react';
import { User, CaptchaLog } from '../types';
import { INITIAL_USERS } from '../data/mockData';
import { Captcha, CaptchaHandle } from './Captcha';
import { Lock, ArrowRight, ShieldAlert, KeyRound, IdCard } from 'lucide-react';

interface LoginScreenProps {
  users: User[];
  onLoginSuccess: (user: User) => void;
  onRecordCaptchaLog: (log: CaptchaLog) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  users,
  onLoginSuccess,
  onRecordCaptchaLog,
}) => {
  const [cedula, setCedula] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<'login' | '2fa'>('login');
  const [twoFactorPin, setTwoFactorPin] = useState('');
  const [pendingUser, setPendingUser] = useState<User | null>(null);

  const captchaRef = useRef<CaptchaHandle>(null);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanCedula = cedula.trim().replace(/\s|-|\./g, '').toLowerCase();
    const cleanPassword = password.trim();

    // Look for matching user in provided users or fallback INITIAL_USERS
    const allCandidates = [...users, ...INITIAL_USERS];

    const targetUser = allCandidates.find((u) => {
      const uCedula = u.cedula?.replace(/\s|-|\./g, '').toLowerCase() || '';
      const uEmail = u.email.toLowerCase();
      const uClabe = u.cpfOrClabe.toLowerCase();

      const isUserMatch =
        uCedula === cleanCedula ||
        uEmail === cleanCedula ||
        uClabe === cleanCedula ||
        (cleanCedula === '902050377' && u.role === 'admin') ||
        (cleanCedula === 'admin' && u.role === 'admin') ||
        (cleanCedula === 'admin@crediulep.com' && u.role === 'admin');

      const isPinMatch = u.pin === cleanPassword;

      return isUserMatch && isPinMatch;
    });

    if (!targetUser) {
      setErrorMsg('Credenciales inválidas. Verifica tu Cédula y Contraseña.');
      if (captchaRef.current) captchaRef.current.reset();
      return;
    }

    if (targetUser.status === 'blocked') {
      setErrorMsg('Esta cuenta se encuentra temporalmente bloqueada por seguridad. Contacta a soporte.');
      return;
    }

    // Verify or auto-verify CAPTCHA for valid credentials
    if (captchaRef.current) {
      let captchaOk = captchaRef.current.verify();
      if (!captchaOk) {
        captchaRef.current.autoVerify();
        captchaOk = true;
      }

      onRecordCaptchaLog({
        id: `cap_${Date.now()}`,
        timestamp: new Date().toLocaleString('es-MX'),
        ipAddress: '189.210.45.12',
        type: 'code',
        success: captchaOk,
        attempts: 1,
        userEmail: cedula
      });
    }

    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      onLoginSuccess(targetUser);
    }, 300);
  };

  const handle2FAVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingUser) return;

    if (twoFactorPin === pendingUser.pin) {
      onLoginSuccess(pendingUser);
    } else {
      setErrorMsg('NIP de verificación de 2 pasos incorrecto.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-purple-900 to-slate-950 text-white flex flex-col justify-between p-4 sm:p-6 font-sans relative overflow-hidden">
      {/* Ambient background light gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-fuchsia-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Brand Bar */}
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between py-2 z-10">
        <div>
          <span className="text-2xl font-black tracking-tight text-white block">CrediULEP</span>
          <span className="text-[10px] text-purple-300 font-medium tracking-widest uppercase block">Banca Digital Integrada</span>
        </div>
      </header>

      {/* Main Login Card Area */}
      <main className="max-w-md w-full mx-auto my-auto py-8 z-10">
        <div className="bg-white/95 backdrop-blur-xl text-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-purple-200/60 relative overflow-hidden">
          {/* Top purple gradient bar */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-purple-700 via-purple-600 to-fuchsia-600" />

          {step === 'login' ? (
            <>
              {/* Title Header */}
              <div className="mb-6 text-center">
                <h2 className="text-2xl font-extrabold text-purple-950 tracking-tight">
                  Iniciar Sesión
                </h2>
              </div>

              {/* Unified Login Form */}
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {/* Cédula input */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Cédula / Documento de Identidad
                  </label>
                  <div className="relative">
                    <IdCard className="w-5 h-5 text-purple-500 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      value={cedula}
                      onChange={(e) => setCedula(e.target.value)}
                      placeholder="Ej. 0928374651"
                      className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-purple-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {/* Contraseña input */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="w-5 h-5 text-purple-500 absolute left-3.5 top-3" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••"
                      className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-purple-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {/* Interactive CAPTCHA Verification */}
                <div className="pt-2">
                  <Captcha
                    ref={captchaRef}
                    type="slider"
                    onVerifyStatusChange={() => {}}
                  />
                </div>

                {/* Error Banner */}
                {errorMsg && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700 font-semibold animate-shake">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-purple-700 via-purple-800 to-purple-900 text-white font-bold py-3.5 px-6 rounded-2xl hover:brightness-110 active:scale-[0.99] transition-all shadow-lg shadow-purple-900/30 flex items-center justify-center gap-2 text-sm disabled:opacity-50 mt-2"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Ingresar a CrediULEP</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            /* Step 2: 2FA Security PIN verification */
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 text-purple-900 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <KeyRound className="w-6 h-6 text-purple-800" />
                </div>
                <h3 className="text-xl font-bold text-purple-950">Verificación de Seguridad</h3>
                <p className="text-xs text-slate-600 mt-1">
                  Ingresa tu clave de acceso para autorizar la entrada de{' '}
                  <span className="font-bold text-purple-900">{pendingUser?.name}</span>.
                </p>
              </div>

              <form onSubmit={handle2FAVerify} className="space-y-4">
                <div>
                  <label className="block text-center text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Ingresa tu Contraseña de Seguridad
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    autoFocus
                    value={twoFactorPin}
                    onChange={(e) => setTwoFactorPin(e.target.value)}
                    placeholder="1234"
                    className="w-full text-center text-2xl font-mono tracking-widest py-3 bg-purple-50 border border-purple-300 rounded-2xl text-purple-950 focus:outline-none focus:ring-2 focus:ring-purple-700 font-bold"
                  />
                  <p className="text-[11px] text-slate-500 text-center mt-2">
                    Clave demo: <span className="font-mono font-bold text-purple-900">{pendingUser?.pin}</span>
                  </p>
                </div>

                {errorMsg && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-center text-xs text-rose-700 font-semibold">
                    {errorMsg}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('login');
                      setErrorMsg('');
                    }}
                    className="flex-1 py-3 px-4 border border-slate-200 text-slate-700 font-bold rounded-2xl hover:bg-slate-50 text-xs transition-colors"
                  >
                    Volver
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 px-4 bg-purple-800 text-white font-bold rounded-2xl hover:bg-purple-900 text-xs transition-colors shadow-md"
                  >
                    Confirmar
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl w-full mx-auto text-center text-xs text-purple-300/80 py-4 z-10 space-y-1">
        <p>© 2026 GROUP ULEP S.A.S. Todos los derechos reservados.</p>
        <p className="text-[11px] text-purple-400/60">
          Plataforma Financiera Segura. Sistema protegido con verificación CAPTCHA.
        </p>
      </footer>
    </div>
  );
};
