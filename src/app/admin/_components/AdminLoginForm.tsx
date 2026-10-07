"use client";

import React from "react";
import { Shield, AlertTriangle, ArrowRight, ChevronLeft } from "lucide-react";
import Link from "next/link";

export interface AdminLoginFormProps {
  authEmail: string;
  authError: string | null;
  authPassword: string;
  handleSupabaseLogin: (e: React.FormEvent<Element>) => Promise<void>;
  loading: boolean;
  setAuthEmail: React.Dispatch<React.SetStateAction<string>>;
  setAuthPassword: React.Dispatch<React.SetStateAction<string>>;
}

export function AdminLoginForm({ authEmail, authError, authPassword, handleSupabaseLogin, loading, setAuthEmail, setAuthPassword }: AdminLoginFormProps) {
  return (
    <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-slate-100">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <Shield size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Yönetim Paneli</h1>
            <p className="text-xs text-slate-400">Supabase Authentication</p>
          </div>
        </div>

        <p className="text-sm text-slate-300 mb-5 leading-relaxed">
          Maç skorlarını ve durumlarını manuel olarak düzeltmek için Supabase hesabınızla giriş yapın.
        </p>

        <form onSubmit={handleSupabaseLogin} className="space-y-4">
          <div>
            <label htmlFor="supabase-email" className="block text-xs font-semibold text-slate-400 mb-1.5">
              E-POSTA
            </label>
            <input
              id="supabase-email"
              type="email"
              value={authEmail}
              onChange={(event) => setAuthEmail(event.target.value)}
              placeholder="admin@example.com"
              aria-label="Supabase e-posta"
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-primary focus-visible:ring-2 focus-visible:ring-primary transition-colors"
              required
            />
          </div>
          <div>
            <label htmlFor="supabase-password" className="block text-xs font-semibold text-slate-400 mb-1.5">
              ŞİFRE
            </label>
            <input
              id="supabase-password"
              type="password"
              value={authPassword}
              onChange={(event) => setAuthPassword(event.target.value)}
              placeholder="••••••••"
              aria-label="Supabase şifre"
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-primary focus-visible:ring-2 focus-visible:ring-primary transition-colors"
              required
            />
          </div>

          {authError && (
            <div className="p-3 rounded-xl bg-red-950/70 border border-red-800/80 text-red-300 text-xs flex items-center gap-2">
              <AlertTriangle size={15} className="shrink-0 text-red-400" />
              <span>{authError}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-done hover:bg-done/90 text-done-fg font-semibold text-sm shadow transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? "Giriş Yapılıyor..." : "Supabase ile Giriş Yap"}
            <ArrowRight size={16} />
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-800 text-center">
          <Link prefetch={false}
            href="/"
            className="text-xs text-slate-400 hover:text-white transition-colors inline-flex items-center gap-1"
          >
            <ChevronLeft size={14} />
            Ana Sayfaya Dön
          </Link>
        </div>
      </div>
    </main>
  );
}
