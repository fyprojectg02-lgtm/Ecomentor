"use client";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function StudentDashboard() {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-[#060606] text-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-3xl bg-[#0b0b0b] border border-[#111] rounded-2xl p-8 shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm uppercase tracking-wide text-emerald-400">Admin</p>
            <h1 className="text-3xl font-bold text-white mt-1">Admin Dashboard</h1>
            <p className="text-gray-400 mt-2">
              Manage platform settings, users, and organization data.
            </p>
          </div>
          <div className="h-12 w-12 rounded-full bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-300 text-xl">
            🎓
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl p-4">
            <p className="text-sm text-gray-400">Users</p>
            <p className="text-2xl font-semibold text-white mt-1">Manage roles & access</p>
            <p className="text-sm text-gray-500 mt-2">
              View, approve, or update user roles across the platform.
            </p>
          </div>
          <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl p-4">
            <p className="text-sm text-gray-400">Content</p>
            <p className="text-2xl font-semibold text-white mt-1">Learning resources</p>
            <p className="text-sm text-gray-500 mt-2">
              Curate and update courses, tasks, and opportunities.
            </p>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={handleLogout}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#04210f] font-semibold transition-colors shadow-[0_10px_30px_rgba(16,185,129,0.35)]"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
