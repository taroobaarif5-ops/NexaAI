"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import BrandMark from "./BrandMark";
import { useAuth } from "./AuthProvider";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export default function AuthScreen({ register = false }: { register?: boolean }) {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    if (register && password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/${register ? "register" : "login"}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(register ? { name, email, password } : { email, password }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Unable to continue.");
      }

      if (!data.accessToken) {
        throw new Error("Authentication response was missing a token.");
      }

      localStorage.setItem("nexora_token", data.accessToken);

      const authenticated = await refreshUser();
      if (!authenticated) {
        throw new Error("Unable to load your account. Please try again.");
      }

      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to continue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-[#101411] px-5 text-[#edf3ee]">
      <div className="w-full max-w-md rounded-2xl border border-[#28332b] bg-[#171d19] p-7 shadow-2xl shadow-black/30">
        <div className="mb-7 flex items-center gap-3">
          <BrandMark className="h-10 w-10" />
          <div>
            <h1 className="text-lg font-semibold">Nexora</h1>
            <p className="text-xs text-[#8f9b93]">AI Workspace</p>
          </div>
        </div>

        <h2 className="text-2xl font-semibold">{register ? "Create your account" : "Welcome back"}</h2>
        <p className="mt-2 text-sm text-[#91a096]">
          {register ? "Start your private Nexora workspace." : "Sign in to continue your conversations."}
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          {register && (
            <label className="block text-sm">
              Name
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                minLength={2}
                className="mt-1.5 w-full rounded-xl border border-[#2c382f] bg-[#101411] px-3 py-2.5 outline-none focus:border-[#65cb88]"
              />
            </label>
          )}

          <label className="block text-sm">
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="mt-1.5 w-full rounded-xl border border-[#2c382f] bg-[#101411] px-3 py-2.5 outline-none focus:border-[#65cb88]"
            />
          </label>

          <label className="block text-sm">
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={8}
              className="mt-1.5 w-full rounded-xl border border-[#2c382f] bg-[#101411] px-3 py-2.5 outline-none focus:border-[#65cb88]"
            />
          </label>

          {register && (
            <label className="block text-sm">
              Confirm password
              <input
                type="password"
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                required
                className="mt-1.5 w-full rounded-xl border border-[#2c382f] bg-[#101411] px-3 py-2.5 outline-none focus:border-[#65cb88]"
              />
            </label>
          )}

          {error && (
            <p role="alert" className="rounded-lg bg-[#3b211e] px-3 py-2 text-sm text-[#ffaaa1]">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#55bf78] px-4 py-3 font-medium text-[#0e1711] transition hover:bg-[#73d494] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (register ? "Creating account..." : "Signing in...") : register ? "Create account" : "Sign in"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-[#91a096]">
          {register ? (
            <>
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-[#78d09a] transition hover:text-[#9be4b7]">
                Sign in
              </Link>
            </>
          ) : (
            <>
              Don&apos;t have an account?{" "}
              <Link href="/register" className="font-medium text-[#78d09a] transition hover:text-[#9be4b7]">
                Create account
              </Link>
            </>
          )}
        </p>
      </div>
    </main>
  );
}
