"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  BookOpen,
  Users,
  TrendingUp,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  Award,
  Sparkles,
  Briefcase
} from "lucide-react";

export default function TeacherDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalStudents: 0,
    pendingReviews: 0,
    activeLessonPlans: 0,
    totalClassPoints: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);

        // Fetch all students count (not specific to teacher)
        const { count: totalStudentsCount, error: studentsError } = await supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('role', 'student');

        if (studentsError) {
          console.error('Error fetching total students:', studentsError);
        }

        // Fetch teacher's students for class points calculation
        const studentsRes = await fetch(`/api/teacher/students?teacherId=${user.id}`);
        const studentsData = await studentsRes.json();

        // Fetch pending submissions
        const submissionsRes = await fetch(`/api/teacher/submissions?teacherId=${user.id}`);
        const submissionsData = await submissionsRes.json();

        // Fetch lesson plans count
        const { data: lessonPlans } = await supabase
          .from('lesson_plans')
          .select('id')
          .eq('teacher_id', user.id);

        setStats({
          totalStudents: totalStudentsCount || 0,
          pendingReviews: submissionsData.submissions?.length || 0,
          activeLessonPlans: lessonPlans?.length || 0,
          totalClassPoints: studentsData.students?.reduce((sum, s) => sum + s.ecoPoints, 0) || 0
        });

        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060606] text-gray-100 flex items-center justify-center">
        <div className="text-emerald-400">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060606] text-gray-100 p-6 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] -z-10 translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px] -z-10 -translate-x-1/2 translate-y-1/2" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-6">
          <div className="animate-in fade-in slide-in-from-left duration-700">
            <div className="flex items-center gap-2 mb-2">
              <span className="h-[2px] w-8 bg-emerald-500" />
              <p className="text-xs uppercase tracking-widest text-emerald-400 font-bold">Teacher Portal</p>
            </div>
            <h1 className="text-5xl font-extrabold text-white tracking-tight">
              Dashboard
            </h1>
            <p className="text-gray-400 mt-3 text-lg">
              Welcome back, <span className="text-white font-semibold">{user?.email?.split("@")[0]}</span>! 👋
            </p>
          </div>
          <div className="flex items-center gap-5 p-2 bg-[#0f0f0f]/50 backdrop-blur-xl border border-white/5 rounded-3xl animate-in fade-in slide-in-from-right duration-700">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/40 flex items-center justify-center text-3xl shadow-lg shadow-emerald-500/10">
              🎓
            </div>
            <div className="pr-4">
              <button
                onClick={handleLogout}
                className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-[#04210f] font-bold transition-all hover:scale-105 active:scale-95 shadow-[0_10px_30px_rgba(16,185,129,0.3)] hover:shadow-emerald-500/40"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            { label: "Total Students", value: stats.totalStudents, icon: Users, color: "text-emerald-400", sub: "Global reach" },
            { label: "Pending Reviews", value: stats.pendingReviews, icon: AlertCircle, color: "text-amber-400", sub: "Tasks awaiting" },
            { label: "Lesson Plans", value: stats.activeLessonPlans, icon: BookOpen, color: "text-blue-400", sub: "Curated content" }
          ].map((item, i) => (
            <div key={i} className="group bg-[#0f0f0f]/40 backdrop-blur-md rounded-[2rem] border border-white/5 p-8 transition-all hover:bg-[#121212]/60 hover:border-emerald-500/20 hover:shadow-2xl hover:shadow-emerald-500/5 animate-in fade-in zoom-in duration-700 delay-100">
              <div className="flex items-center justify-between mb-6">
                <div className={`p-4 rounded-2xl bg-white/5 border border-white/10 group-hover:border-emerald-500/30 group-hover:bg-emerald-500/5 transition-all`}>
                  <item.icon className={`h-6 w-6 ${item.color}`} />
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-400 mb-1">{item.label}</p>
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <div className="text-4xl font-black text-white">{item.value}</div>
                <p className="text-xs text-gray-500 font-medium">{item.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mb-12 animate-in fade-in slide-in-from-bottom duration-1000">
          <div className="flex items-center gap-3 mb-8">
            <h2 className="text-2xl font-bold text-white tracking-tight">Quick Actions</h2>
            <div className="h-[1px] flex-1 bg-gradient-to-r from-white/10 to-transparent" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link
              href="/dashboard/teacher/lesson-planner"
              className="group relative overflow-hidden bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-[2.5rem] p-8 transition-all hover:scale-[1.02] hover:shadow-[0_20px_50px_rgba(16,185,129,0.4)]"
            >
              <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-110 transition-transform duration-500">
                <Sparkles className="h-32 w-32 text-white" />
              </div>
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                  <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-lg flex items-center justify-center mb-6 border border-white/30">
                    <Sparkles className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-black text-white mb-3">AI Lesson Planner</h3>
                  <p className="text-emerald-50/80 text-sm leading-relaxed max-w-[200px]">
                    Generate comprehensive lesson plans with AI assistance
                  </p>
                </div>
                <div className="mt-8 flex items-center gap-2 text-white font-bold group-hover:translate-x-2 transition-transform">
                  Launch <TrendingUp className="h-4 w-4" />
                </div>
              </div>
            </Link>

            <Link
              href="/dashboard/teacher/review-actions"
              className="group relative overflow-hidden bg-gradient-to-br from-amber-500 to-orange-600 rounded-[2.5rem] p-8 transition-all hover:scale-[1.02] hover:shadow-[0_20px_50px_rgba(245,158,11,0.4)]"
            >
              <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-110 transition-transform duration-500">
                <Clock className="h-32 w-32 text-white" />
              </div>
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                  <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-lg flex items-center justify-center mb-6 border border-white/30">
                    <Clock className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-black text-white mb-3">Review Queue</h3>
                  <p className="text-amber-50/80 text-sm leading-relaxed max-w-[200px]">
                    Review and approve student eco-action submissions
                  </p>
                </div>
                <div className="mt-8 flex items-center justify-between">
                  {stats.pendingReviews > 0 && (
                    <div className="px-4 py-1 rounded-full bg-white text-orange-600 text-xs font-black shadow-lg">
                      {stats.pendingReviews} NEW
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-white font-bold group-hover:translate-x-2 transition-transform">
                    Review <TrendingUp className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </Link>

            <Link
              href="/dashboard/teacher/opportunities"
              className="group relative overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2.5rem] p-8 transition-all hover:scale-[1.02] hover:shadow-[0_20px_50px_rgba(99,102,241,0.4)]"
            >
              <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-110 transition-transform duration-500">
                <Briefcase className="h-32 w-32 text-white" />
              </div>
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                  <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-lg flex items-center justify-center mb-6 border border-white/30">
                    <Briefcase className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-black text-white mb-3">NGO Connect</h3>
                  <p className="text-indigo-50/80 text-sm leading-relaxed max-w-[200px]">
                    Create and manage NGO opportunities for students
                  </p>
                </div>
                <div className="mt-8 flex items-center gap-2 text-white font-bold group-hover:translate-x-2 transition-transform">
                  Manage <TrendingUp className="h-4 w-4" />
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-[#0f0f0f]/40 backdrop-blur-md rounded-[2.5rem] border border-white/5 p-10 hover:bg-[#121212]/60 transition-all animate-in fade-in slide-in-from-bottom duration-1000 delay-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
            <div>
              <h2 className="text-3xl font-black text-white tracking-tight">System Status</h2>
              <p className="text-gray-500 text-sm mt-1">Real-time overview of your actions</p>
            </div>
            {stats.pendingReviews > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl px-5 py-2 flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-amber-400 text-xs font-bold uppercase tracking-wider">Action Required</span>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {stats.pendingReviews > 0 ? (
              <div className="group flex items-center gap-6 p-6 bg-white/5 hover:bg-white/[0.08] border border-white/5 rounded-[2rem] transition-all hover:translate-x-2">
                <div className="h-16 w-16 rounded-[1.25rem] bg-amber-500/20 flex items-center justify-center shrink-0">
                  <AlertCircle className="h-8 w-8 text-amber-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xl font-bold text-white mb-1">
                    {stats.pendingReviews} Submission{stats.pendingReviews > 1 ? 's' : ''} Awaiting
                  </p>
                  <p className="text-gray-400">Review student eco-actions to award points and provide feedback.</p>
                </div>
                <Link
                  href="/dashboard/teacher/review-actions"
                  className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-[#04210f] rounded-2xl font-black transition-all hover:scale-105 active:scale-95 shadow-xl shadow-emerald-500/20"
                >
                  REVIEW NOW
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-6 p-8 bg-white/5 border border-white/5 rounded-[2rem]">
                <div className="h-16 w-16 rounded-[1.25rem] bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <CheckCircle className="h-8 w-8 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xl font-bold text-white mb-1">Queue is Empty</p>
                  <p className="text-gray-500">Excellent! You've successfully reviewed all pending submissions.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
