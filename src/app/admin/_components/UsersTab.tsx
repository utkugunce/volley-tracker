"use client";

import React from "react";
import { Users, UserPlus, Trash2 } from "lucide-react";
import { type AdminUser } from "./types";

export interface UsersTabProps {
  handleDeleteUser: (userId: string, userEmail: string) => Promise<void>;
  handleUpdateUserRole: (userId: string, newRole: "admin" | "editor" | "viewer") => Promise<void>;
  setShowAddUserModal: React.Dispatch<React.SetStateAction<boolean>>;
  userOperationLoading: boolean;
  users: AdminUser[];
}

export function UsersTab({ handleDeleteUser, handleUpdateUserRole, setShowAddUserModal, userOperationLoading, users }: UsersTabProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Users size={18} className="text-ink-2" />
          Kullanıcı Yönetimi
        </h2>
        <button
          onClick={() => setShowAddUserModal(true)}
          className="px-3 py-1.5 bg-primary hover:bg-primary-hover text-primary-fg font-bold rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
        >
          <UserPlus size={13} />
          Kullanıcı Ekle
        </button>
      </div>

      {users.length === 0 ? (
        <div className="py-12 text-center text-slate-400 text-xs">
          Henüz kayıtlı kullanıcı bulunmuyor.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-2 px-3 text-slate-400 font-semibold">Email</th>
                <th className="text-left py-2 px-3 text-slate-400 font-semibold">Rol</th>
                <th className="text-left py-2 px-3 text-slate-400 font-semibold">Kayıt Tarihi</th>
                <th className="text-left py-2 px-3 text-slate-400 font-semibold">Son Giriş</th>
                <th className="text-right py-2 px-3 text-slate-400 font-semibold">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                  <td className="py-2 px-3 text-white">{user.email}</td>
                  <td className="py-2 px-3">
                    <select
                      value={user.role}
                      onChange={(e) => handleUpdateUserRole(user.id, e.target.value as "admin" | "editor" | "viewer")}
                      disabled={userOperationLoading}
                      className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-white text-xs focus:outline-none focus:border-primary"
                    >
                      <option value="viewer">Viewer</option>
                      <option value="editor">Editor</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="py-2 px-3 text-slate-400">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString("tr-TR") : "-"}
                  </td>
                  <td className="py-2 px-3 text-slate-400">
                    {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString("tr-TR") : "-"}
                  </td>
                  <td className="py-2 px-3 text-right">
                    <button
                      onClick={() => handleDeleteUser(user.id, user.email)}
                      disabled={userOperationLoading}
                      className="text-red-400 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
