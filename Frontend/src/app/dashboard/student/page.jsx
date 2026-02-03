"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  MessageSquare,
  Trophy,
  BookOpen,
  Target,
  Upload,
  CheckCircle,
  Clock,
  Award,
  TrendingUp,
  ArrowRight,
  Zap,
  Briefcase,
  Gamepad2
} from "lucide-react";
import QuizGenerator from "./QuizGenerator.jsx";
import LearningPathGenerator from "./components/LearningPathGenerator.jsx";
import TaskRecommendations from "./components/TaskRecommendations.jsx";
import ImpactEstimator from "./components/ImpactEstimator.jsx";
import Leaderboard from "./leaderboard/page.jsx";

export default function StudentDashboard() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTab = searchParams.get("tab") || "home";
  const [user, setUser] = useState(null);
  const [educationLevel, setEducationLevel] = useState("");
  const [studentData, setStudentData] = useState({
    ecoPoints: 0,
    level: "school",
    classroom: null,
    rank: 0,
    completedTasks: 0,
    pendingSubmissions: 0,
    environmentalImpact: {
      co2Saved: 0,
      treesPlanted: 0,
      plasticReduced: 0
    }
  });
  const [learningPaths, setLearningPaths] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [leaderboardPreview, setLeaderboardPreview] = useState([]);
  const [fullLeaderboard, setFullLeaderboard] = useState([]);
  const [currentUserRank, setCurrentUserRank] = useState(null);

  useEffect(() => {
    fetchUserData();
    fetchLearningPaths();
    fetchSubmissions();
    fetchOpportunities();
    fetchLeaderboardPreview();
    fetchFullLeaderboard();
  }, []);

  const fetchUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUser(user);

      // Fetch education level and classroom
      const { data: details } = await supabase
        .from("user_details")
        .select("education_level, classroom_id")
        .eq("user_id", user.id)
        .single();

      if (details) {
        setEducationLevel(details.education_level);
      }

      // Fetch student stats
      const { data: stats } = await supabase
        .from("students")
        .select("eco_points, completed_tasks")
        .eq("id", user.id)
        .single();

      // Fetch global rank
      const { data: rankData } = await supabase
        .rpc('get_student_rank', { p_student_id: user.id });

      // Fetch environmental impact
      const { data: impact } = await supabase
        .from("impact_metrics")
        .select("*")
        .eq("student_id", user.id)
        .single();

      setStudentData({
        ecoPoints: stats?.eco_points || 0,
        level: details?.education_level?.toLowerCase().includes("college") ? "college" : "school",
        classroom: details?.classroom_id || "None",
        rank: rankData?.[0]?.rank || 0,
        completedTasks: stats?.completed_tasks || 0,
        pendingSubmissions: 0, // This could be calculated from submissions state
        environmentalImpact: {
          co2Saved: impact?.co2_saved_kg || 0,
          treesPlanted: impact?.trees_equivalent || 0,
          plasticReduced: impact?.plastic_reduced_kg || 0
        }
      });
    }
  };

  const fetchLearningPaths = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("student_learning_progress")
      .select(`
        *,
        learning_paths (*)
      `)
      .eq("student_id", user.id);

    if (data) {
      const formattedPaths = data.map(record => ({
        id: record.learning_path_id,
        title: record.learning_paths.title,
        progress: record.progress_percentage,
        difficulty: record.learning_paths.difficulty,
        points: record.learning_paths.total_points
      }));
      setLearningPaths(formattedPaths);
    }
  };

  const fetchSubmissions = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: completions } = await supabase
      .from("activity_completions")
      .select("*")
      .eq("student_id", user.id)
      .eq("activity_type", "task")
      .order("completed_at", { ascending: false });

    if (completions && completions.length > 0) {
      const taskIds = completions.map(c => c.activity_id);
      const { data: tasks } = await supabase
        .from("recommended_tasks")
        .select("id, title")
        .in("id", taskIds);

      const taskMap = (tasks || []).reduce((acc, t) => {
        acc[t.id] = t.title;
        return acc;
      }, {});

      const formattedSubmissions = completions.map(sub => ({
        id: sub.id,
        action: sub.completion_data?.task_title || taskMap[sub.activity_id] || "Unknown Task",
        status: sub.completion_data?.status || "completed",
        points: sub.points_awarded,
        date: new Date(sub.completed_at).toLocaleDateString()
      }));
      setSubmissions(formattedSubmissions);

      setStudentData(prev => ({
        ...prev,
        pendingSubmissions: formattedSubmissions.filter(s => s.status === "pending").length
      }));
    }
  };

  const fetchOpportunities = async () => {
    try {
      const response = await fetch("/api/opportunities");
      const data = await response.json();

      if (data.success) {
        // Transform and limit to 3 for dashboard preview
        const formattedOpportunities = data.opportunities
          .slice(0, 3)
          .map(opp => ({
            id: opp.id,
            title: opp.title,
            ngo: opp.ngo_name,
            duration: opp.duration,
            minPoints: opp.min_points
          }));
        setOpportunities(formattedOpportunities);
      }
    } catch (error) {
      console.error("Error fetching opportunities:", error);
      setOpportunities([]);
    }
  };

  const fetchLeaderboardPreview = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const response = await fetch(`/api/leaderboard?scope=global&timeframe=all_time&limit=3&userId=${user.id}`);
      const data = await response.json();

      if (data.success && data.leaderboard) {
        // Get top 3 for preview
        const topThree = data.leaderboard.slice(0, 3).map(student => ({
          rank: student.rank,
          name: student.name,
          points: student.ecoPoints
        }));
        setLeaderboardPreview(topThree);
      }
    } catch (error) {
      console.error("Error fetching leaderboard preview:", error);
      setLeaderboardPreview([]);
    }
  };

  const fetchFullLeaderboard = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const response = await fetch(`/api/leaderboard?scope=global&timeframe=all_time&limit=20&userId=${user.id}`);
      const data = await response.json();

      if (data.success) {
        setFullLeaderboard(data.leaderboard);
        if (data.currentUser) {
          setCurrentUserRank({
            rank: data.currentUser.rank,
            points: data.currentUser.ecoPoints
          });
        }
      }
    } catch (error) {
      console.error("Error fetching full leaderboard:", error);
      setFullLeaderboard([]);
    }
  };

  const renderHome = () => {

    return (
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6">
          <div>
            <h2 className="text-3xl font-bold mb-1 text-white">
              Welcome back, {user?.email?.split("@")[0] || "EcoMentor"}! 🌱
            </h2>
            <p className="text-gray-400">
              Continue your journey to make a positive environmental impact
            </p>
          </div>
          <button
            onClick={() => router.push("?tab=home&chat=true")}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-lg shadow-emerald-200/50 transition-colors"
          >
            <MessageSquare className="h-4 w-4" />
            Chat with EcoBot
          </button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#0f0f0f] rounded-2xl shadow-sm border border-[#1a1a1a] p-5 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between pb-1">
              <p className="text-sm text-gray-500">Total EcoPoints</p>
              <Award className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-emerald-400">{studentData.ecoPoints}</div>
            <p className="text-xs text-gray-500 mt-1">
              <span className="text-emerald-400 font-semibold">+125</span> this week
            </p>
          </div>

          <div className="bg-[#0f0f0f] rounded-2xl shadow-sm border border-[#1a1a1a] p-5 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between pb-1">
              <p className="text-sm text-gray-400">Learning Paths</p>
              <BookOpen className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-white">{learningPaths.length}</div>
            <p className="text-xs text-gray-500 mt-1">Active modules in progress</p>
          </div>

          <div className="bg-[#0f0f0f] rounded-2xl shadow-sm border border-[#1a1a1a] p-5 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between pb-1">
              <p className="text-sm text-gray-400">Tasks Completed</p>
              <Target className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-white">{studentData.completedTasks}</div>
            <p className="text-xs text-gray-500 mt-1">{studentData.pendingSubmissions} pending review</p>
          </div>

          <div className="bg-[#0f0f0f] rounded-2xl shadow-sm border border-[#1a1a1a] p-5 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between pb-1">
              <p className="text-sm text-gray-400">Global Rank</p>
              <Trophy className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-white">#{studentData.rank}</div>
            <p className="text-xs text-gray-500 mt-1">
              <span className="text-emerald-400 font-semibold">↑ 2</span> positions
            </p>
          </div>
        </div>

        {/* Impact Estimator */}
        <ImpactEstimator studentId={user?.id} compact={true} />

        {/* Learning Paths */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold text-white">Your Learning Paths</h3>
            <Link
              href="?tab=learning-paths"
              className="text-emerald-400 font-semibold inline-flex items-center gap-2 hover:text-emerald-300"
            >
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {learningPaths.slice(0, 2).map((path) => (
              <div key={path.id} className="bg-[#0f0f0f] rounded-2xl shadow-sm border border-[#1a1a1a] p-5 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-white mb-1">{path.title}</h4>
                    <p className="text-sm text-gray-400">Difficulty: {path.difficulty}</p>
                  </div>
                  <span className="px-3 py-1 text-xs rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    {path.points} pts
                  </span>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <span>Progress</span>
                    <span className="font-semibold text-emerald-300">{path.progress}%</span>
                  </div>
                  <div className="w-full bg-[#1a1a1a] rounded-full h-2">
                    <div
                      className="bg-emerald-400 h-2 rounded-full transition-all"
                      style={{ width: `${path.progress}%` }}
                    />
                  </div>
                </div>
                <a
                  href="/dashboard/student/learning"
                  className="mt-4 w-full inline-flex items-center justify-center bg-emerald-500 hover:bg-emerald-400 text-[#04210f] py-2 rounded-xl font-semibold transition-colors"
                >
                  {path.progress > 0 ? "Continue" : "Start Learning"}
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* Active Tasks & Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Tasks */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold text-white">Active Tasks</h3>
              <Link
                href="?tab=tasks"
                className="text-sm text-emerald-400 hover:text-emerald-300 font-semibold"
              >
                Go to tasks
              </Link>
            </div>
            {submissions.slice(0, 4).map((sub) => (
              <div key={sub.id} className="bg-[#0f0f0f] rounded-2xl border border-[#1a1a1a] p-4 shadow-sm hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-white">{sub.action}</h4>
                      <span
                        className={`text-xs px-3 py-1 rounded-full ${sub.status === "approved"
                          ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                          : sub.status === "pending"
                            ? "bg-amber-500/15 text-amber-200 border border-amber-500/30"
                            : "bg-blue-500/15 text-blue-200 border border-blue-500/30"
                          }`}
                      >
                        {sub.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mb-2">Points: {sub.points}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Zap className="h-3 w-3 text-emerald-400" />
                        {studentData.level}
                      </span>
                      <span>{sub.date}</span>
                    </div>
                  </div>
                  <Link
                    href="?tab=tasks"
                    className="text-sm font-semibold text-emerald-400 hover:text-emerald-300"
                  >
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Sidebar: EcoBot + Leaderboard */}
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-[#0f0f0f] to-[#0b0b0b] rounded-2xl border border-[#1a1a1a] shadow-sm p-5">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="h-5 w-5 text-emerald-400" />
                <h4 className="font-semibold text-white">EcoBot Assistant</h4>
              </div>
              <p className="text-sm text-gray-400 mb-3">
                "Based on your progress, explore renewable energy next!"
              </p>
              <button
                onClick={() => router.push("?tab=home&chat=true")}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-[#04210f] font-semibold py-2 rounded-xl shadow-md shadow-emerald-500/30"
              >
                Start Conversation
              </button>
            </div>

            <div className="bg-[#0f0f0f] rounded-2xl border border-[#1a1a1a] shadow-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <Trophy className="h-5 w-5 text-emerald-400" />
                <h4 className="font-semibold text-white">Top Performers</h4>
              </div>
              <div className="space-y-3">
                {leaderboardPreview.length > 0 ? (
                  leaderboardPreview.map((entry) => (
                    <div key={entry.rank} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm ${entry.rank === 1 ? "bg-yellow-500/20 text-yellow-300" :
                              entry.rank === 2 ? "bg-gray-400/20 text-gray-300" :
                                entry.rank === 3 ? "bg-orange-500/20 text-orange-300" :
                                  "bg-[#111] text-gray-300"
                            }`}
                        >
                          {entry.rank}
                        </div>
                        <span className="font-medium text-white">{entry.name}</span>
                      </div>
                      <span className="text-sm font-semibold text-emerald-300">{entry.points}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500 text-sm">Loading leaderboard...</div>
                )}
              </div>
              <a
                href="?tab=leaderboard"
                className="w-full mt-4 text-sm font-semibold text-emerald-400 hover:text-emerald-300 border border-[#1a1a1a] rounded-xl py-2 block text-center"
              >
                View Full Leaderboard
              </a>
            </div>
          </div>
        </div>

        {/* Educational Games Preview */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold text-white flex items-center gap-2">
              <Gamepad2 className="h-6 w-6 text-emerald-400" />
              Educational Games
            </h3>
            <Link
              href="?tab=games"
              className="text-emerald-400 font-semibold inline-flex items-center gap-2 hover:text-emerald-300"
            >
              Play All Games <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <a
              href="/dashboard/student/games/eco-quiz"
              className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 hover:shadow-lg hover:scale-105 transition-all"
            >
              <div className="text-5xl mb-3">🎯</div>
              <h4 className="text-lg font-bold text-white mb-1">Eco Quiz</h4>
              <p className="text-emerald-100 text-sm mb-3">Test your knowledge</p>
              <div className="flex items-center gap-2 text-white text-xs">
                <Zap className="h-3 w-3" />
                <span>10-30 pts</span>
              </div>
            </a>
            <a
              href="/dashboard/student/games/recycling-sorting"
              className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 hover:shadow-lg hover:scale-105 transition-all"
            >
              <div className="text-5xl mb-3">♻️</div>
              <h4 className="text-lg font-bold text-white mb-1">Recycling</h4>
              <p className="text-blue-100 text-sm mb-3">Sort waste correctly</p>
              <div className="flex items-center gap-2 text-white text-xs">
                <Zap className="h-3 w-3" />
                <span>10+ pts</span>
              </div>
            </a>
            <a
              href="/dashboard/student/games/carbon-footprint"
              className="bg-gradient-to-br from-green-500 to-blue-500 rounded-2xl p-6 hover:shadow-lg hover:scale-105 transition-all"
            >
              <div className="text-5xl mb-3">🌍</div>
              <h4 className="text-lg font-bold text-white mb-1">Carbon Track</h4>
              <p className="text-green-100 text-sm mb-3">Track your impact</p>
              <div className="flex items-center gap-2 text-white text-xs">
                <Zap className="h-3 w-3" />
                <span>Variable</span>
              </div>
            </a>
            <a
              href="/dashboard/student/games/energy-saver"
              className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl p-6 hover:shadow-lg hover:scale-105 transition-all"
            >
              <div className="text-5xl mb-3">⚡</div>
              <h4 className="text-lg font-bold text-white mb-1">Energy Saver</h4>
              <p className="text-yellow-100 text-sm mb-3">Save energy fast</p>
              <div className="flex items-center gap-2 text-white text-xs">
                <Zap className="h-3 w-3" />
                <span>Time-based</span>
              </div>
            </a>
            <a
              href="/dashboard/student/games/ocean-cleanup"
              className="bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl p-6 hover:shadow-lg hover:scale-105 transition-all"
            >
              <div className="text-5xl mb-3">🌊</div>
              <h4 className="text-lg font-bold text-white mb-1">Ocean Cleanup</h4>
              <p className="text-cyan-100 text-sm mb-3">Clean the ocean</p>
              <div className="flex items-center gap-2 text-white text-xs">
                <Zap className="h-3 w-3" />
                <span>500+ pts</span>
              </div>
            </a>
          </div>
        </div>

        {/* NGO Opportunities */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold text-white">NGO Opportunities</h3>
            <a
              href="/dashboard/student/opportunities"
              className="text-emerald-400 font-semibold inline-flex items-center gap-2 hover:text-emerald-300"
            >
              View all <ArrowRight className="h-4 w-4" />
            </a>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {opportunities.map((opportunity) => (
              <div key={opportunity.id} className="bg-[#0f0f0f] rounded-2xl shadow-sm border border-[#1a1a1a] p-5 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <span className="px-3 py-1 rounded-full text-xs bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    {opportunity.duration}
                  </span>
                  <span className="text-xs text-gray-500">+{opportunity.minPoints} pts</span>
                </div>
                <h4 className="text-lg font-semibold text-white">{opportunity.title}</h4>
                <p className="text-sm text-gray-400 mb-2">by {opportunity.ngo}</p>
                <p className="text-sm text-gray-500 mb-4">
                  Minimum required: {opportunity.minPoints} EcoPoints
                </p>
                <a
                  href="/dashboard/student/opportunities"
                  className="w-full text-sm font-semibold text-emerald-400 hover:text-emerald-300 border border-[#1a1a1a] rounded-xl py-2 block text-center transition-colors"
                >
                  Learn More
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderLeaderboard = () => {
    // Combine top students with current user if not in top 20
    const displayList = [...fullLeaderboard];
    if (currentUserRank && !displayList.find(s => s.studentId === user?.id)) {
      displayList.push({
        rank: currentUserRank.rank,
        name: "You",
        ecoPoints: currentUserRank.points,
        studentId: user?.id,
        highlight: true
      });
    }

    return (
      <div className="bg-[#18181b] rounded-2xl border border-zinc-800 p-6 shadow-xl">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-white">
          <Trophy className="text-yellow-500" />
          Community Leaderboard
        </h2>

        <div className="space-y-3">
          {displayList.length > 0 ? (
            displayList.map(student => {
              const isCurrentUser = student.studentId === user?.id || student.highlight;
              const avatar = isCurrentUser ? "ME" : (student.name || "U").substring(0, 2).toUpperCase();

              return (
                <div
                  key={student.rank || student.studentId}
                  className={`flex items-center justify-between p-4 rounded-lg border transition-all ${isCurrentUser
                    ? "bg-emerald-900/10 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                    : "bg-zinc-900/50 border-zinc-800 hover:bg-zinc-800"
                    }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 flex items-center justify-center rounded-full font-bold shadow-lg ${student.rank === 1 ? "bg-yellow-500 text-black" :
                      student.rank === 2 ? "bg-zinc-400 text-black" :
                        student.rank === 3 ? "bg-orange-500 text-black" :
                          "bg-zinc-800 text-gray-500"
                      }`}>
                      {student.rank}
                    </div>

                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border ${isCurrentUser
                      ? "bg-emerald-500 text-black border-emerald-400"
                      : "bg-zinc-800 text-emerald-400 border-zinc-700"
                      }`}>
                      {avatar}
                    </div>

                    <div>
                      <p className={`font-bold ${isCurrentUser ? "text-emerald-400" : "text-white"}`}>
                        {student.name}
                      </p>
                      <p className="text-sm text-gray-400">
                        <span className="text-emerald-500 font-medium">{student.ecoPoints || student.points}</span> EcoPoints
                      </p>
                    </div>
                  </div>

                  {student.rank <= 3 && (
                    <Trophy className={
                      student.rank === 1 ? "text-yellow-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]" :
                        student.rank === 2 ? "text-zinc-400" :
                          "text-orange-500"
                    } size={24} />
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-gray-500">Loading leaderboard...</div>
          )}
        </div>
      </div>
    );
  };

  const renderProfile = () => (
    <div className="bg-[#18181b] rounded-2xl border border-zinc-800 p-6 shadow-xl">
      <h2 className="text-2xl font-bold mb-6 text-white">Profile Settings</h2>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-400 mb-2">Email</label>
          <input
            type="email"
            value={user?.email || ""}
            disabled
            readOnly
            className="w-full bg-zinc-900/50 border border-zinc-800 text-gray-500 rounded-lg p-3 cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">Education Level</label>
          <select className="w-full bg-black border-2 border-zinc-700 text-white rounded-lg p-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all">
            <option value="school">School</option>
            <option value="college">College</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">Classroom Code</label>
          <input
            type="text"
            value={studentData.classroom || ""}
            readOnly
            className="w-full bg-black border-2 border-zinc-700 text-white rounded-lg p-3 placeholder-zinc-600 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
            placeholder="Enter classroom code"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">Interests</label>
          <input
            type="text"
            className="w-full bg-black border-2 border-zinc-700 text-white rounded-lg p-3 placeholder-zinc-600 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
            placeholder="e.g., Climate Change, Renewable Energy"
          />
        </div>

        <button className="w-full mt-4 bg-emerald-500 hover:bg-emerald-400 text-black py-3 rounded-lg font-bold text-lg transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]">
          Save Changes
        </button>
      </div>
    </div>
  );

  return (
    <>
      {activeTab === "home" && renderHome()}
      {activeTab === "leaderboard" && <Leaderboard />}
      {activeTab === "profile" && renderProfile()}
      {activeTab === "quiz" && <QuizGenerator />}
      {activeTab === "learning-paths" && user && (
        <LearningPathGenerator userId={user.id} />
      )}
      {activeTab === "tasks" && user && (
        <TaskRecommendations userId={user.id} educationLevel={educationLevel} />
      )}
    </>
  );
}