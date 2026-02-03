"use client";
import { Gamepad2, Trophy, Zap, Brain } from "lucide-react";
import Link from "next/link";

const games = [
    {
        id: "quiz",
        title: "Eco Quiz Challenge",
        description: "Test your environmental knowledge with timed trivia questions",
        emoji: "🎯",
        difficulty: "Easy to Hard",
        points: "10-30 per question",
        color: "from-emerald-500 to-emerald-600",
        path: "/dashboard/student/games/eco-quiz"
    },
    {
        id: "recycling",
        title: "Recycling Sorting",
        description: "Sort waste into the correct bins and learn recycling facts",
        emoji: "♻️",
        difficulty: "Medium",
        points: "10+ with combos",
        color: "from-blue-500 to-blue-600",
        path: "/dashboard/student/games/recycling-sorting"
    },
    {
        id: "carbon",
        title: "Carbon Footprint Challenge",
        description: "Make daily decisions and track your environmental impact",
        emoji: "🌍",
        difficulty: "Medium",
        points: "Based on choices",
        color: "from-green-500 to-blue-500",
        path: "/dashboard/student/games/carbon-footprint"
    },
    {
        id: "energy",
        title: "Energy Saver",
        description: "Turn off appliances to save energy before time runs out",
        emoji: "⚡",
        difficulty: "Easy",
        points: "Based on energy saved",
        color: "from-yellow-500 to-orange-500",
        path: "/dashboard/student/games/energy-saver"
    },
    {
        id: "ocean",
        title: "Ocean Cleanup Challenge",
        description: "Click on floating trash to clean the ocean and build combos",
        emoji: "🌊",
        difficulty: "Medium",
        points: "500+ with combos",
        color: "from-blue-600 to-cyan-500",
        path: "/dashboard/student/games/ocean-cleanup"
    },
    {
        id: "tree",
        title: "Tree Planting Simulator",
        description: "Plant trees, manage resources, and grow a thriving forest",
        emoji: "🌲",
        difficulty: "Medium",
        points: "300 per round",
        color: "from-green-700 to-emerald-600",
        path: "/dashboard/student/games/tree-planting"
    },
    {
        id: "pollinator",
        title: "Pollinator Patrol",
        description: "Match pollinators with flowers in this educational puzzle game",
        emoji: "🐝",
        difficulty: "Easy to Medium",
        points: "225 per level",
        color: "from-pink-500 to-purple-600",
        path: "/dashboard/student/games/pollinator-patrol"
    }
];

export default function GamesPage() {
    return (
        <div className="min-h-screen bg-black p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <Gamepad2 className="h-10 w-10 text-emerald-400" />
                        <h1 className="text-5xl font-bold text-white">Educational Games</h1>
                    </div>
                    <p className="text-gray-400 text-lg">
                        Learn about sustainability while having fun! Earn EcoPoints by playing games.
                    </p>
                </div>

                {/* Stats Banner */}
                <div className="bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/30 rounded-2xl p-6 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="flex items-center gap-4">
                            <div className="bg-emerald-500/20 rounded-xl p-3">
                                <Gamepad2 className="h-8 w-8 text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-gray-400 text-sm">Available Games</p>
                                <p className="text-2xl font-bold text-white">{games.length}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="bg-yellow-500/20 rounded-xl p-3">
                                <Trophy className="h-8 w-8 text-yellow-400" />
                            </div>
                            <div>
                                <p className="text-gray-400 text-sm">Total Points Available</p>
                                <p className="text-2xl font-bold text-white">2000+</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="bg-blue-500/20 rounded-xl p-3">
                                <Brain className="h-8 w-8 text-blue-400" />
                            </div>
                            <div>
                                <p className="text-gray-400 text-sm">Learning Topics</p>
                                <p className="text-2xl font-bold text-white">15+</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Games Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {games.map((game) => (
                        <Link
                            key={game.id}
                            href={game.path}
                            className="group"
                        >
                            <div className={`bg-gradient-to-br ${game.color} rounded-2xl p-8 transition-all transform hover:scale-105 hover:shadow-2xl`}>
                                <div className="flex items-start justify-between mb-4">
                                    <div className="text-7xl">{game.emoji}</div>
                                    <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1">
                                        <p className="text-white text-xs font-semibold">{game.difficulty}</p>
                                    </div>
                                </div>

                                <h3 className="text-2xl font-bold text-white mb-2">{game.title}</h3>
                                <p className="text-white/90 mb-4">{game.description}</p>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Zap className="h-4 w-4 text-white" />
                                        <span className="text-white text-sm font-semibold">{game.points}</span>
                                    </div>
                                    <div className="bg-white text-black px-4 py-2 rounded-lg font-bold text-sm group-hover:bg-opacity-90 transition-all">
                                        Play Now →
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Tips Section */}
                <div className="bg-[#0f0f0f] rounded-2xl border border-[#1a1a1a] p-8">
                    <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                        <Brain className="h-6 w-6 text-emerald-400" />
                        Game Tips
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-[#1a1a1a] rounded-xl p-4">
                            <p className="text-emerald-400 font-semibold mb-2">🎯 Maximize Points</p>
                            <p className="text-gray-300 text-sm">Play on higher difficulties and answer quickly for bonus points!</p>
                        </div>
                        <div className="bg-[#1a1a1a] rounded-xl p-4">
                            <p className="text-blue-400 font-semibold mb-2">🔊 Sound Effects</p>
                            <p className="text-gray-300 text-sm">Enable sound for better feedback and a more immersive experience!</p>
                        </div>
                        <div className="bg-[#1a1a1a] rounded-xl p-4">
                            <p className="text-yellow-400 font-semibold mb-2">📚 Learn While Playing</p>
                            <p className="text-gray-300 text-sm">Read the facts and tips - they'll help you in future games!</p>
                        </div>
                        <div className="bg-[#1a1a1a] rounded-xl p-4">
                            <p className="text-purple-400 font-semibold mb-2">🏆 Challenge Yourself</p>
                            <p className="text-gray-300 text-sm">Try to beat your high scores and compete on the leaderboard!</p>
                        </div>
                    </div>
                </div>

                {/* Back Button */}
                <div className="mt-8 text-center">
                    <Link
                        href="/dashboard/student?tab=home"
                        className="inline-flex items-center gap-2 bg-[#1a1a1a] hover:bg-[#222] text-white font-semibold px-6 py-3 rounded-xl border border-[#2a2a2a] transition-colors"
                    >
                        ← Back to Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
}
