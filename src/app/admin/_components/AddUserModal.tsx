"use client";

import React from "react";
import { X, UserPlus } from "lucide-react";

export interface AddUserModalProps {
  handleAddUser: (e: React.FormEvent<Element>) => Promise<void>;
  newUserEmail: string;
  newUserPassword: string;
  newUserRole: "admin" | "editor" | "viewer";
  setNewUserEmail: React.Dispatch<React.SetStateAction<string>>;
  setNewUserPassword: React.Dispatch<React.SetStateAction<string>>;
  setNewUserRole: React.Dispatch<React.SetStateAction<"admin" | "editor" | "viewer">>;
  setShowAddUserModal: React.Dispatch<React.SetStateAction<boolean>>;
  userOperationLoading: boolean;
}

export function AddUserModal({ handleAddUser, newUserEmail, newUserPassword, newUserRole, setNewUserEmail, setNewUserPassword, setNewUserRole, setShowAddUserModal, userOperationLoading }: AddUserModalProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-start justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white">Yeni Kullanıcı Ekle</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Supabase Auth ile yeni kullanıcı oluştur
            </p>
          </div>
          <button
            onClick={() => setShowAddUserModal(false)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleAddUser} className="space-y-4">
          <div>
            <label htmlFor="new-user-email" className="block text-xs font-semibold text-slate-300 mb-1">
              Email
            </label>
            <input
              id="new-user-email"
              type="email"
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              placeholder="ornek@email.com"
              required
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-primary focus-visible:ring-1 focus-visible:ring-primary"
            />
          </div>

          <div>
            <label htmlFor="new-user-password" className="block text-xs font-semibold text-slate-300 mb-1">
              Şifre
            </label>
            <input
              id="new-user-password"
              type="password"
              value={newUserPassword}
              onChange={(e) => setNewUserPassword(e.target.value)}
              placeholder="Minimum 6 karakter"
              required
              minLength={6}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-primary focus-visible:ring-1 focus-visible:ring-primary"
            />
          </div>

          <div>
            <label htmlFor="new-user-role" className="block text-xs font-semibold text-slate-300 mb-1">
              Rol
            </label>
            <select
              id="new-user-role"
              value={newUserRole}
              onChange={(e) => setNewUserRole(e.target.value as "admin" | "editor" | "viewer")}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-primary focus-visible:ring-1 focus-visible:ring-primary"
            >
              <option value="viewer">Viewer (Sadece görüntüleme)</option>
              <option value="editor">Editor (Düzenleme yapabilir)</option>
              <option value="admin">Admin (Tam yetki)</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setShowAddUserModal(false)}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={userOperationLoading}
              className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-primary-fg font-bold text-xs font-semibold shadow flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <UserPlus size={14} />
              {userOperationLoading ? "Ekleniyor..." : "Kullanıcı Ekle"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
