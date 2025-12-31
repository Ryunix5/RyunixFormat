import React from 'react';
import { Crown, Zap, Shield } from 'lucide-react';

export function YuGiOhHeader() {
  return (
    <header className="header-yugioh relative border-b-4 border-yellow-500 bg-gradient-to-r from-blue-900 via-purple-900 to-slate-900 px-6 py-6 shadow-2xl">
      <div className="max-w-7xl mx-auto">
        {/* Top line accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent opacity-60"></div>
        
        <div className="flex items-center justify-between">
          {/* Logo/Title */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Crown className="w-10 h-10 text-yellow-500 drop-shadow-lg" />
              <div>
                <h1 className="text-4xl font-black uppercase tracking-widest bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-300 bg-clip-text text-transparent drop-shadow-lg">
                  Ryunix Format
                </h1>
                <p className="text-xs uppercase tracking-widest text-yellow-500/80 font-mono">
                  Banlist Management System
                </p>
              </div>
            </div>
          </div>
          
          {/* Right side icons */}
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-900/30 border border-purple-500/30">
              <Zap className="w-5 h-5 text-yellow-500" />
              <span className="text-sm font-semibold text-purple-200">Live System</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-900/30 border border-blue-500/30">
              <Shield className="w-5 h-5 text-blue-400" />
              <span className="text-sm font-semibold text-blue-200">Secure</span>
            </div>
          </div>
        </div>
        
        {/* Subtitle/Description */}
        <p className="mt-4 text-sm text-gray-300 max-w-2xl">
          Manage the official Yu-Gi-Oh! TCG banlist with real-time updates from the community database.
        </p>
      </div>
    </header>
  );
}
