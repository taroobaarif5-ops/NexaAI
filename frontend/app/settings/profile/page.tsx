"use client";

import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "../../components/AuthProvider";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export default function ProfileSettingsPage() {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "idle" | "success" | "error"; message: string }>({ type: "idle", message: "" });

  useEffect(() => {
    setName(user?.name || "");
  }, [user?.name]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmedName = name.trim();

    if (!trimmedName || trimmedName.length < 2) {
      setFeedback({ type: "error", message: "Display name must be at least 2 characters." });
      return;
    }

    const token = window.localStorage.getItem("nexora_token");
    if (!token) {
      setFeedback({ type: "error", message: "Your session expired. Please sign in again." });
      return;
    }

    setSaving(true);
    setFeedback({ type: "idle", message: "" });

    try {
      const response = await fetch(`${API_URL}/auth/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: trimmedName }),
      });

      if (response.status === 401) {
        window.localStorage.removeItem("nexora_token");
        window.location.href = "/login";
        return;
      }

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Unable to update profile.");
      }

      const data = await response.json();
      setUser({ ...(user || { email: data.email }), id: data.id, name: data.name, email: data.email });
      setFeedback({ type: "success", message: "Profile updated successfully." });
    } catch (error) {
      setFeedback({ type: "error", message: error instanceof Error ? error.message : "Unable to update profile." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] uppercase tracking-[0.16em] text-[#7d8a83]">Profile</p>
        <h2 className="mt-2 text-2xl font-semibold text-[#edf3ee]">Personal details</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center gap-4 rounded-2xl border border-[#2a362e] bg-[#171d19] p-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#33543d] bg-[#162a1d] text-xl font-semibold text-[#8de0a5]">
            {(user?.name || "N").charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="text-sm text-[#8d9b95]">Display name</div>
            <div className="text-lg font-medium text-[#edf3ee]">{user?.name || "Nexora User"}</div>
          </div>
        </div>

        <label className="block text-sm text-[#dfe8e1]">
          Display name
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mt-1.5 w-full rounded-xl border border-[#2c382f] bg-[#101411] px-3 py-2.5 text-[#edf3ee] outline-none transition focus:border-[#66ca88] focus:ring-3 focus:ring-[#2a5d3b]/50"
            placeholder="Your name"
          />
        </label>

        <div className="rounded-xl border border-[#2c382f] bg-[#101411] px-3 py-2.5 text-sm text-[#9aa79f]">
          <span className="block text-[11px] uppercase tracking-[0.12em] text-[#7d8a83]">Email</span>
          <span className="mt-1 block text-[#edf3ee]">{user?.email || "No email"}</span>
        </div>

        {feedback.type !== "idle" && (
          <p className={`rounded-lg px-3 py-2 text-sm ${feedback.type === "success" ? "bg-[#163a25] text-[#a8f0bf]" : "bg-[#341d1e] text-[#ffb5ae]"}`}>
            {feedback.message}
          </p>
        )}

        <button type="submit" disabled={saving} className="w-full rounded-xl bg-[#55bf78] px-4 py-3 font-medium text-[#0d1711] transition hover:bg-[#73d494] disabled:cursor-not-allowed disabled:opacity-60">
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
