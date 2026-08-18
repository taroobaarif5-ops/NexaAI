"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { RequireAuth, useAuth } from "../components/AuthProvider";
import BrandMark from "../components/BrandMark";

const navItems = [
  { href: "/settings", label: "Overview" },
  { href: "/settings/profile", label: "Profile" },
  { href: "/settings/security", label: "Security" },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <RequireAuth>
      <div className="min-h-[100dvh] bg-[#101411] text-[#edf3ee]">
        <div className="mx-auto flex min-h-[100dvh] max-w-6xl flex-col gap-6 p-4 md:p-6">
          <header className="flex items-center justify-between rounded-2xl border border-[#27312b] bg-[#141a17] px-4 py-3 shadow-lg shadow-black/20">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#2d382f] bg-[#101711]">
                <BrandMark className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.16em] text-[#7d8a83]">Account</p>
                <h1 className="text-lg font-semibold text-[#edf3ee]">Settings</h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link href="/" className="rounded-xl border border-[#2c382f] bg-[#1a211c] px-3 py-2 text-sm text-[#ecf5ee] transition hover:border-[#5ec782] hover:bg-[#203129]">
                Back to chat
              </Link>
              <button
                type="button"
                onClick={() => logout()}
                className="rounded-xl border border-[#4d3633] bg-[#2d2121] px-3 py-2 text-sm font-medium text-[#f8c3bf] transition hover:bg-[#3b2a2a]"
              >
                Log out
              </button>
            </div>
          </header>

          <div className="grid flex-1 gap-6 md:grid-cols-[240px_minmax(0,1fr)]">
            <aside className="rounded-2xl border border-[#27312b] bg-[#141a17] p-3">
              <div className="mb-4 flex items-center gap-3 rounded-xl border border-[#2b342d] bg-[#171d19] p-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#33543d] bg-[#162a1d] text-lg font-semibold text-[#8de0a5]">
                  {(user?.name || "N").charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-[#edf3ee]">{user?.name || "Nexora User"}</div>
                  <div className="truncate text-xs text-[#8d9b95]">{user?.email || "No email"}</div>
                </div>
              </div>

              <nav className="space-y-2">
                {navItems.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`block rounded-xl px-3 py-2.5 text-sm transition ${
                        active
                          ? "border border-[#3a5846] bg-[#1b2d24] text-[#e8f7ec]"
                          : "border border-transparent bg-[#171d19] text-[#b5c1b7] hover:border-[#2d382f] hover:bg-[#1e2622]"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </aside>

            <main className="rounded-2xl border border-[#27312b] bg-[#141a17] p-4 md:p-6">{children}</main>
          </div>
        </div>
      </div>
    </RequireAuth>
  );
}
