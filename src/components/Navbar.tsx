import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { User } from '../types';
import { LogOut, Bell, Menu, X, CheckCircle2, AlertTriangle, ShieldCheck, CreditCard } from 'lucide-react';

interface NavbarProps {
  currentUser: User;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onLogout,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: '1',
      title: currentUser.role === 'client' ? 'Línea de crédito activa' : 'Sistema de auditoría operativo',
      desc: currentUser.role === 'client' 
        ? `Tu cupo disponible es de $${(currentUser.creditLimit - currentUser.creditUsed).toLocaleString('es-CO')}` 
        : 'Todos los registros y logs de seguridad están sincronizados',
      time: 'Hace un momento',
      type: 'info',
      read: false,
    },
    {
      id: '2',
      title: 'Seguridad y Cifrado',
      desc: 'Tu sesión actual cuenta con protección AES-GCM y validación biométrica.',
      time: 'Hoy',
      type: 'security',
      read: false,
    },
    ...(currentUser.status === 'blocked' ? [{
      id: '3',
      title: 'Cuenta Bloqueada',
      desc: 'Comunícate con soporte de GRUPO ULEP para restablecer tu cuenta.',
      time: 'Importante',
      type: 'warning',
      read: false,
    }] : [])
  ]);

  const menuRef = useRef<HTMLDivElement>(null);
  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <header className="sticky top-0 z-40 bg-transparent backdrop-blur-md border-b border-purple-900/20 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between">
        {/* Logo wrapped in a styled Button */}
        <button
          id="navbar-logo-btn"
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex items-center px-3 py-1.5 bg-purple-900/80 hover:bg-purple-800/90 border border-purple-700/60 rounded-xl transition-all cursor-pointer shadow-sm active:scale-95 focus:outline-none"
          title="CrediULEP Inicio"
        >
          <img
            src="/imagulep/1_1.png"
            alt="CrediULEP Logo"
            referrerPolicy="no-referrer"
            className="w-[100px] h-[36px] object-contain drop-shadow-sm"
            onError={(e) => {
              const target = e.currentTarget;
              if (!target.src.includes('1_1.png')) {
                target.src = '/imagulep/1_1.png';
              }
            }}
          />
        </button>

        {/* Right side Actions: Menu */}
        <div className="flex items-center gap-2">
          {/* Menú Dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              id="navbar-menu-btn"
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center gap-2 px-3.5 py-2 bg-purple-900/80 hover:bg-purple-800/90 border border-purple-700/60 text-purple-100 rounded-xl text-sm font-semibold transition-all cursor-pointer shadow-sm active:scale-95"
              aria-expanded={isMenuOpen}
              aria-label="Abrir menú"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              <span className="hidden sm:inline">Menú</span>
            </button>

            {/* Dropdown Menu */}
            {isMenuOpen && (
              <div
                id="navbar-dropdown-menu"
                className="absolute right-0 mt-2 w-56 sm:w-60 bg-purple-950 border border-purple-800/80 rounded-2xl shadow-2xl overflow-hidden py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150"
              >
                {/* Menu Options */}
                <div className="p-1.5 space-y-1">
                  {/* Notificaciones Option */}
                  <button
                    id="menu-notifications-btn"
                    type="button"
                    onClick={() => {
                      setShowNotificationsModal(true);
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2.5 text-left text-sm font-semibold text-purple-100 hover:bg-purple-800/60 hover:text-white rounded-xl transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 bg-purple-800/50 rounded-lg text-white">
                        <Bell className="w-4 h-4 text-white" />
                      </div>
                      <span>Notificaciones</span>
                    </div>
                    {unreadCount > 0 && (
                      <span className="bg-white text-purple-950 font-black font-mono text-xs px-2 py-0.5 rounded-full shadow-xs">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Salir Option */}
                  <button
                    id="menu-logout-btn"
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onLogout();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-sm font-semibold text-rose-300 hover:bg-rose-500/20 hover:text-rose-100 rounded-xl transition-colors cursor-pointer"
                  >
                    <div className="p-1.5 bg-rose-500/20 rounded-lg text-rose-300">
                      <LogOut className="w-4 h-4" />
                    </div>
                    <span>Salir</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notifications Modal / Drawer (Rendered via Portal to avoid header clipping) */}
      {showNotificationsModal && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-[9999] bg-purple-950/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowNotificationsModal(false);
            }
          }}
        >
          <div 
            className="bg-white border border-purple-200 text-purple-950 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabecera Notificaciones */}
            <div className="px-5 py-4 border-b border-purple-100 flex items-center justify-between bg-purple-50/80">
              <h3 className="font-extrabold text-base text-purple-950">Notificaciones</h3>
              <button
                type="button"
                onClick={() => setShowNotificationsModal(false)}
                className="p-2 hover:bg-purple-100 rounded-xl text-slate-400 hover:text-purple-950 transition-colors cursor-pointer"
                title="Cerrar notificaciones"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Lista de Notificaciones */}
            <div className="p-4 sm:p-5 space-y-3 max-h-[65vh] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-sm">
                  <Bell className="w-8 h-8 mx-auto mb-2 text-slate-400 opacity-60" />
                  No tienes notificaciones pendientes.
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
                      n.read
                        ? 'bg-slate-50/80 border-slate-200/80 opacity-75'
                        : 'bg-purple-50/70 border-purple-200 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 shrink-0">
                        {n.type === 'security' ? (
                          <div className="p-1.5 bg-emerald-100 rounded-lg text-emerald-700 border border-emerald-200">
                            <ShieldCheck className="w-4 h-4" />
                          </div>
                        ) : n.type === 'warning' ? (
                          <div className="p-1.5 bg-rose-100 rounded-lg text-rose-700 border border-rose-200">
                            <AlertTriangle className="w-4 h-4" />
                          </div>
                        ) : (
                          <div className="p-1.5 bg-purple-100 rounded-lg text-purple-900 border border-purple-200">
                            <CreditCard className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-extrabold text-sm text-purple-950 truncate">{n.title}</h4>
                          <span className="text-[10px] text-purple-800 font-mono font-bold shrink-0">{n.time}</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.desc}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pie del modal */}
            <div className="px-5 py-3.5 border-t border-purple-100 bg-purple-50/50 flex items-center justify-between">
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-xs font-bold text-purple-900 hover:text-purple-950 flex items-center gap-1.5 cursor-pointer hover:underline"
              >
                <CheckCircle2 className="w-4 h-4 text-purple-900" />
                Marcar todas como leídas
              </button>
              <button
                type="button"
                onClick={() => setShowNotificationsModal(false)}
                className="px-4 py-2 bg-purple-900 hover:bg-purple-950 active:scale-95 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </header>
  );
};

