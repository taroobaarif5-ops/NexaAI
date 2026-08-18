"use client";

import Link from "next/link";
import { useAuth } from "../components/AuthProvider";

export default function SettingsHomePage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] uppercase tracking-[0.16em] text-[#7d8a83]">Manage account</p>
        <h2 className="mt-2 text-2xl font-semibold text-[#edf3ee]">Account overview</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/settings/profile" className="rounded-2xl border border-[#2a362e] bg-[#171d19] p-4 transition hover:border-[#5ec782] hover:bg-[#1d271f]">
          <p className="text-[11px] uppercase tracking-[0.16em] text-[#7d8a83]">Profile</p>
          <h3 className="mt-3 text-xl font-semibold text-[#edf3ee]">{user?.name || "Nexora User"}</h3>
          <p className="mt-2 text-sm text-[#9aa79f]">{user?.email || "No email"}</p>
        </Link>

        <Link href="/settings/security" className="rounded-2xl border border-[#2a362e] bg-[#171d19] p-4 transition hover:border-[#5ec782] hover:bg-[#1d271f]">
          <p className="text-[11px] uppercase tracking-[0.16em] text-[#7d8a83]">Security</p>
          <h3 className="mt-3 text-xl font-semibold text-[#edf3ee]">Password & access</h3>
          <p className="mt-2 text-sm text-[#9aa79f]">Keep your account protected and verified.</p>
        </Link>
      </div>
    </div>
  );
}
