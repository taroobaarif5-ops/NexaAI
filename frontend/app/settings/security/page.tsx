"use client";

import { FormEvent, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export default function SecuritySettingsPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "idle" | "success" | "error"; message: string }>({ type: "idle", message: "" });

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!currentPassword.trim()) {
      setFeedback({ type: "error", message: "Current password is required." });
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      setFeedback({ type: "error", message: "New password must be at least 8 characters." });
      return;
    }

    if (newPassword !== confirmPassword) {
      setFeedback({ type: "error", message: "New passwords do not match." });
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
      const response = await fetch(`${API_URL}/auth/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      if (response.status === 401) {
        window.localStorage.removeItem("nexora_token");
        window.location.href = "/login";
        return;
      }

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Unable to change password.");
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setFeedback({ type: "success", message: "Password changed successfully." });
    } catch (error) {
      setFeedback({ type: "error", message: error instanceof Error ? error.message : "Unable to change password." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] uppercase tracking-[0.16em] text-[#7d8a83]">Security</p>
        <h2 className="mt-2 text-2xl font-semibold text-[#edf3ee]">Change password</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block text-sm text-[#dfe8e1]">
          Current password
          <input
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            className="mt-1.5 w-full rounded-xl border border-[#2c382f] bg-[#101411] px-3 py-2.5 text-[#edf3ee] outline-none transition focus:border-[#66ca88] focus:ring-3 focus:ring-[#2a5d3b]/50"
            placeholder="Current password"
          />
        </label>

        <label className="block text-sm text-[#dfe8e1]">
          New password
          <input
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            className="mt-1.5 w-full rounded-xl border border-[#2c382f] bg-[#101411] px-3 py-2.5 text-[#edf3ee] outline-none transition focus:border-[#66ca88] focus:ring-3 focus:ring-[#2a5d3b]/50"
            placeholder="New password"
          />
        </label>

        <label className="block text-sm text-[#dfe8e1]">
          Confirm new password
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className="mt-1.5 w-full rounded-xl border border-[#2c382f] bg-[#101411] px-3 py-2.5 text-[#edf3ee] outline-none transition focus:border-[#66ca88] focus:ring-3 focus:ring-[#2a5d3b]/50"
            placeholder="Confirm password"
          />
        </label>

        {feedback.type !== "idle" && (
          <p className={`rounded-lg px-3 py-2 text-sm ${feedback.type === "success" ? "bg-[#163a25] text-[#a8f0bf]" : "bg-[#341d1e] text-[#ffb5ae]"}`}>
            {feedback.message}
          </p>
        )}

        <button type="submit" disabled={saving} className="w-full rounded-xl bg-[#1d2a22] px-4 py-3 font-medium text-[#ecf6ef] transition hover:bg-[#24372d] disabled:cursor-not-allowed disabled:opacity-60">
          {saving ? "Updating..." : "Change Password"}
        </button>
      </form>
    </div>
  );
}
