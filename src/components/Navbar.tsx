import React from 'react';
import { User } from '../types';
import { LogOut, UserCheck, ShieldCheck, RefreshCw, ArrowLeftRight } from 'lucide-react';

interface NavbarProps {
  currentUser: User;
  allUsers: User[];
  onSwitchUser: (newUser: User) => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  allUsers,
  onSwitchUser,
  onLogout,
}) => {
  const otherRoleUser = allUsers.find(
    (u) => u.role !== currentUser.role && u.status === 'active'
  );

  return (
    <header className="sticky top-0 z-40 bg-purple-950/90 backdrop-blur-md border-b border-purple-800/60 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        {/* Logo */}
        <div>
          <span className="font-extrabold text-base tracking-tight text-white block leading-none">
            CrediULEP
          </span>
          <span className="text-[10px] text-purple-300 font-semibold tracking-wider uppercase block">
            {currentUser.role === 'client' ? 'Portal de Cliente' : 'Panel Administrador'}
          </span>
        </div>

        {/* Current user pill & Quick Role Switcher */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 bg-purple-900/80 border border-purple-700/50 px-3 py-1.5 rounded-2xl text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="font-bold text-purple-100">{currentUser.name}</span>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-purple-800 text-purple-200">
              {currentUser.role === 'client' ? 'Cliente' : 'Admin'}
            </span>
          </div>

          {/* Quick role switcher button for easy demo evaluation */}
          {otherRoleUser && (
            <button
              onClick={() => onSwitchUser(otherRoleUser)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-800 hover:bg-purple-700 text-purple-100 rounded-xl text-xs font-bold transition-all border border-purple-600 shadow-sm"
              title={`Cambiar directamente a modo ${otherRoleUser.role === 'client' ? 'Cliente' : 'Admin'}`}
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden md:inline">
                Ir a Panel {otherRoleUser.role === 'client' ? 'Cliente' : 'Admin'}
              </span>
              <span className="md:hidden">
                {otherRoleUser.role === 'client' ? 'Cliente' : 'Admin'}
              </span>
            </button>
          )}

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/30 rounded-xl text-xs font-bold transition-all"
            title="Cerrar Sesión"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </div>
    </header>
  );
};
