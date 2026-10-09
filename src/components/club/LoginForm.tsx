"use client";

import React, { useEffect, useState } from "react";
import { Mail } from "lucide-react";
import { SetupNotice } from "./ClubShell";

const ERROR_TEXT: Record<string, string> = {
  gecersiz: "Giriş bağlantısı geçersiz veya süresi dolmuş. Bağlantıyı isteğin yapıldığı tarayıcıda açtığınızdan emin olun ya da yeni bir bağlantı isteyin.",
  kurulum: "Giriş sistemi şu anda yapılandırılmamış.",
};

export function LoginForm({ next, errorKey }: { next: string; errorKey?: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState<string | null>(errorKey ? ERROR_TEXT[errorKey] ?? ERROR_TEXT.gecersiz : null);
  const [setup, setSetup] = useState<"not_configured" | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/panel/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && d?.state === "not_configured") setSetup("not_configured");
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  if (setup) return <SetupNotice kind={setup} />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    setMessage(null);
    try {
      const res = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, next }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setStatus("sent");
        return;
      }
      if (res.status === 503) {
        setSetup("not_configured");
        return;
      }
      setStatus("error");
      setMessage(data?.error || "Bağlantı gönderilemedi.");
    } catch {
      setStatus("error");
      setMessage("Bağlantı kurulamadı. İnternet bağlantınızı kontrol edin.");
    }
  };

  if (status === "sent") {
    return (
      <div role="status" className="rounded-2xl border border-line bg-panel p-6 text-sm">
        <p className="font-black text-base mb-2">E-postanızı kontrol edin</p>
        <p className="text-ink-2">
          <strong>{email}</strong> adresine bir giriş bağlantısı gönderdik. Bağlantı kısa süre geçerlidir; gelen kutunuzda
          görünmezse spam klasörüne bakın. Bağlantıyı bu cihazdaki aynı tarayıcıda açmanız önerilir.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-line bg-panel p-6 space-y-4" noValidate>
      <p className="text-sm text-ink-2">
        Şifre gerekmez. E-posta adresinizi girin, size tek kullanımlık bir giriş bağlantısı gönderelim.
      </p>
      <label className="block text-xs font-bold text-ink-2" htmlFor="login-email">
        E-posta adresi
      </label>
      <div className="flex items-center gap-2 rounded-xl border border-line bg-surface-muted px-3">
        <Mail size={16} className="text-ink-3" aria-hidden />
        <input
          id="login-email"
          type="email"
          autoComplete="email"
          required
          maxLength={254}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="ornek@kulup.com"
          className="w-full bg-transparent py-3 text-sm outline-none"
        />
      </div>
      {message && (
        <p role="alert" className="text-xs text-live font-bold">
          {message}
        </p>
      )}
      <button
        type="submit"
        disabled={status === "sending" || email.trim().length < 5}
        className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-fg hover:bg-primary-hover disabled:opacity-50"
      >
        {status === "sending" ? "Gönderiliyor…" : "Giriş bağlantısı gönder"}
      </button>
      <p className="text-[11px] text-ink-3 leading-relaxed">
        Giriş yaparak{" "}
        <a
          href="/gizlilik"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline font-semibold"
        >
          Gizlilik Politikası ve KVKK Aydınlatma Metni
        </a>
        ’ni okuduğunuzu ve kabul ettiğinizi beyan edersiniz.
      </p>
    </form>
  );
}
