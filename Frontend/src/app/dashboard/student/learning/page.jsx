"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Compass,
  Flame,
  ShieldCheck,
  Sparkles,
  Target,
  Zap
} from "lucide-react";

const learningPaths = [
  {
    id: 1,
    title: "Climate Change Fundamentals",
    description: "Understand the science behind climate change and its global impact.",
    progress: 65,
    completedModules: 5,
    totalModules: 8,
    difficulty: "beginner",
    tags: ["climate", "science"],
    points: 180
  },
  {
    id: 2,
    title: "Renewable Energy Solutions",
    description: "Explore solar, wind, and other renewable energy technologies.",
    progress: 40,
    completedModules: 4,
    totalModules: 10,
    difficulty: "intermediate",
    tags: ["energy", "technology"],
    points: 240
  },
  {
    id: 3,
    title: "Sustainable Cities",
    description: "Design urban spaces with low emissions and high livability.",
    progress: 0,
    completedModules: 0,
    totalModules: 6,
    difficulty: "advanced",
    tags: ["cities", "policy"],
    points: 200
  },
  {
    id: 4,
    title: "Water Conservation",
    description: "Practical strategies to reduce water use and protect watersheds.",
    progress: 80,
    completedModules: 8,
    totalModules: 10,
    difficulty: "beginner",
    tags: ["water", "conservation"],
    points: 160
  }
];

const difficultyStyles = {
  beginner: "bg-emerald-500/12 text-emerald-200 border border-emerald-500/25",
  intermediate: "bg-teal-500/12 text-teal-200 border border-teal-500/25",
  advanced: "bg-indigo-500/12 text-indigo-200 border border-indigo-500/25"
};

export default function LearningPathsPage() {
  const [filter, setFilter] = useState("all");

  const filteredPaths = useMemo(() => {
    if (filter === "all") return learningPaths;
    return learningPaths.filter((p) => p.difficulty === filter);
  }, [filter]);

  return (
    <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 text-sm text-emerald-300">
            <Sparkles className="h-4 w-4" />
            <span>Student · Learning Paths</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-3xl md:text-4xl font-bold text-white">
                Personalized Learning Paths
              </h1>
              <p className="text-gray-400 max-w-2xl">
                Advance through curated modules that grow your sustainability impact. Continue where you left off or start something new.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#04210f] font-semibold transition-colors shadow-[0_10px_30px_rgba(16,185,129,0.35)]">
                <Compass className="h-4 w-4" />
                AI Recommend Path
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            icon={<BookOpen className="h-4 w-4 text-emerald-300" />}
            label="Active Paths"
            value="4"
            note="2 in progress"
          />
          <StatCard
            icon={<Target className="h-4 w-4 text-emerald-300" />}
            label="Modules Completed"
            value="17"
            note="+5 this week"
          />
          <StatCard
            icon={<Zap className="h-4 w-4 text-emerald-300" />}
            label="EcoPoints Earned"
            value="820"
            note="+120 this week"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {["all", "beginner", "intermediate", "advanced"].map((key) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-2 rounded-full border text-sm transition-colors ${
                filter === key
                  ? "border-emerald-400 bg-emerald-500/12 text-emerald-200"
                  : "border-[#1a1a1a] bg-[#0b0b0b] text-gray-300 hover:border-emerald-500/40"
              }`}
            >
              {key === "all" ? "All" : key.charAt(0).toUpperCase() + key.slice(1)}
            </button>
          ))}
        </div>

        {/* Paths Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPaths.map((path) => (
            <div
              key={path.id}
              className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-2xl p-5 space-y-4 hover:shadow-[0_20px_60px_rgba(0,0,0,0.4)] transition-shadow"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-3 py-1 text-xs rounded-full border border-emerald-500/25 bg-emerald-500/10 text-emerald-200">
                      {path.points} pts
                    </span>
                    <span className={`px-3 py-1 text-xs rounded-full ${difficultyStyles[path.difficulty]}`}>
                      {path.difficulty}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-white">{path.title}</h3>
                  <p className="text-sm text-gray-400 mt-1">{path.description}</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {path.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 text-xs rounded-full border border-[#1f1f1f] bg-[#111] text-gray-300"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="h-12 w-12 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-200">
                  <BookOpen className="h-5 w-5" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-gray-400">
                  <span>Progress</span>
                  <span className="font-semibold text-emerald-200">{path.progress}%</span>
                </div>
                <div className="w-full bg-[#1a1a1a] rounded-full h-2">
                  <div
                    className="bg-emerald-400 h-2 rounded-full transition-all"
                    style={{ width: `${path.progress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  {path.completedModules} / {path.totalModules} modules
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <ShieldCheck className="h-4 w-4 text-emerald-300" />
                  Guided by mentors
                </div>
                <div className="flex gap-2">
                  <button className="px-4 py-2 rounded-xl border border-[#1a1a1a] bg-[#0b0b0b] text-gray-200 hover:border-emerald-500/40 transition-colors">
                    View Details
                  </button>
                  <button className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#04210f] font-semibold transition-colors">
                    {path.progress > 0 ? "Continue" : "Start"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-emerald-400/15 via-emerald-500/10 to-transparent border border-emerald-500/25 rounded-2xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 text-xs border border-emerald-500/40">
              <Flame className="h-4 w-4" />
              Continue building your streak
            </div>
            <h3 className="text-xl font-semibold text-white">Finish a module today</h3>
            <p className="text-gray-300 max-w-xl">
              Earn bonus EcoPoints by completing one module before midnight. Your progress syncs across devices.
            </p>
          </div>
          <div className="flex gap-2">
            <button className="px-5 py-3 rounded-xl border border-[#1a1a1a] bg-[#0b0b0b] text-gray-200 hover:border-emerald-500/40 transition-colors">
              View Streaks
            </button>
            <button className="px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#04210f] font-semibold transition-colors flex items-center gap-2">
              Resume Learning <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
    </div>
  );
}

function StatCard({ icon, label, value, note }) {
  return (
    <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-2xl p-5 flex items-center justify-between">
      <div className="space-y-1">
        <p className="text-sm text-gray-400">{label}</p>
        <p className="text-2xl font-semibold text-white">{value}</p>
        <p className="text-xs text-gray-500">{note}</p>
      </div>
      <div className="h-10 w-10 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
        {icon}
      </div>
    </div>
  );
}

