"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
    Trophy,
    Medal,
    Crown,
    TrendingUp,
    Filter,
    Search,
    Loader2,
    Award,
    Target,
    Leaf,
    ChevronDown
} from "lucide-react";

export default function Leaderboard() {
    const [leaderboardData, setLeaderboardData] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [filters, setFilters] = useState({
        scope: 'global',
        educationLevel: null,
        timeframe: 'all_time'
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [userId, setUserId] = useState(null);

    useEffect(() => {
        // Get current user ID
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserId(user.id);
            }
        };
        fetchUser();
    }, []);

    useEffect(() => {
        if (userId) {
            fetchLeaderboard();
        }
    }, [filters, userId]);

    const fetchLeaderboard = async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                scope: filters.scope,
                timeframe: filters.timeframe,
                limit: '100',
                userId: userId
            });

            if (filters.educationLevel) {
                params.append('educationLevel', filters.educationLevel);
            }

            const response = await fetch(`/api/leaderboard?${params.toString()}`);
            const data = await response.json();

            if (data.success) {
                setLeaderboardData(data.leaderboard);
                setCurrentUser(data.currentUser);
            }
        } catch (error) {
            console.error("Error fetching leaderboard:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const getRankIcon = (rank) => {
        if (rank === 1) return <Crown className="h-6 w-6 text-yellow-500" />;
        if (rank === 2) return <Medal className="h-6 w-6 text-gray-400" />;
        if (rank === 3) return <Medal className="h-6 w-6 text-orange-500" />;
        return null;
    };

    const getRankBadgeColor = (rank) => {
        if (rank === 1) return "bg-yellow-500 text-black";
        if (rank === 2) return "bg-gray-400 text-black";
        if (rank === 3) return "bg-orange-500 text-black";
        return "bg-[#1a1a1a] text-gray-400";
    };

    const filteredData = leaderboardData.filter(student =>
        student.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const topThree = filteredData.slice(0, 3);
    const restOfLeaderboard = filteredData.slice(3);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-br from-yellow-900/20 to-orange-900/20 rounded-2xl border border-yellow-500/30 p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                            <Trophy className="h-6 w-6 text-yellow-500" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white">Leaderboard</h1>
                            <p className="text-sm text-gray-400">See how you rank among eco-warriors</p>
                        </div>
                    </div>

                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="px-4 py-2 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 rounded-xl border border-yellow-500/30 transition-colors flex items-center gap-2"
                    >
                        <Filter className="h-4 w-4" />
                        Filters
                        <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                    </button>
                </div>

                {/* Filters Panel */}
                {showFilters && (
                    <div className="bg-[#0f0f0f]/50 rounded-xl p-4 border border-yellow-500/20 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="text-sm text-gray-400 mb-2 block">Timeframe</label>
                                <select
                                    value={filters.timeframe}
                                    onChange={(e) => setFilters({ ...filters, timeframe: e.target.value })}
                                    className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-yellow-500/60"
                                >
                                    <option value="all_time">All Time</option>
                                    <option value="monthly">This Month</option>
                                    <option value="weekly">This Week</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-sm text-gray-400 mb-2 block">Education Level</label>
                                <select
                                    value={filters.educationLevel || ''}
                                    onChange={(e) => setFilters({ ...filters, educationLevel: e.target.value || null })}
                                    className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-yellow-500/60"
                                >
                                    <option value="">All Levels</option>
                                    <option value="school">School</option>
                                    <option value="college">College</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-sm text-gray-400 mb-2 block">Search</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                                    <input
                                        type="text"
                                        placeholder="Search students..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/60"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Current User Stats */}
                {currentUser && (
                    <div className="mt-4 bg-emerald-900/20 rounded-xl p-4 border border-emerald-500/30">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`h-12 w-12 rounded-full flex items-center justify-center font-bold text-lg ${getRankBadgeColor(currentUser.rank)}`}>
                                    #{currentUser.rank}
                                </div>
                                <div>
                                    <p className="text-white font-semibold">Your Rank</p>
                                    <p className="text-sm text-gray-400">
                                        Top {currentUser.percentile}% • {currentUser.ecoPoints} points
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-emerald-400 font-bold text-2xl">{currentUser.ecoPoints}</p>
                                <p className="text-xs text-gray-400">EcoPoints</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 text-yellow-500 animate-spin" />
                </div>
            ) : (
                <>
                    {/* Podium - Top 3 */}
                    {topThree.length > 0 && (
                        <div className="bg-[#0f0f0f] rounded-2xl border border-[#1a1a1a] p-6">
                            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <Crown className="h-5 w-5 text-yellow-500" />
                                Top Performers
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {topThree.map((student, index) => {
                                    const isCurrentUser = student.studentId === userId;
                                    const podiumOrder = index === 0 ? 1 : index === 1 ? 0 : 2; // 2nd, 1st, 3rd visual order

                                    return (
                                        <div
                                            key={student.studentId}
                                            className={`relative ${podiumOrder === 1 ? 'md:order-1' : podiumOrder === 0 ? 'md:order-0' : 'md:order-2'}`}
                                        >
                                            <div className={`bg-gradient-to-br rounded-2xl p-6 border-2 transition-all ${student.rank === 1
                                                ? 'from-yellow-900/30 to-yellow-800/20 border-yellow-500/50 shadow-[0_0_30px_rgba(234,179,8,0.2)]'
                                                : student.rank === 2
                                                    ? 'from-gray-700/30 to-gray-600/20 border-gray-400/50'
                                                    : 'from-orange-900/30 to-orange-800/20 border-orange-500/50'
                                                } ${isCurrentUser ? 'ring-2 ring-emerald-500' : ''}`}>
                                                {/* Rank Badge */}
                                                <div className="flex justify-center mb-4">
                                                    <div className={`h-16 w-16 rounded-full flex items-center justify-center font-bold text-2xl ${getRankBadgeColor(student.rank)} shadow-lg`}>
                                                        {student.rank === 1 ? <Crown className="h-8 w-8" /> : `#${student.rank}`}
                                                    </div>
                                                </div>

                                                {/* Student Info */}
                                                <div className="text-center mb-4">
                                                    <h3 className="text-xl font-bold text-white mb-1">
                                                        {isCurrentUser ? 'You' : student.name}
                                                    </h3>
                                                    <p className="text-sm text-gray-400 capitalize">{student.educationLevel}</p>
                                                </div>

                                                {/* Points */}
                                                <div className="bg-[#0f0f0f]/50 rounded-xl p-4 mb-3">
                                                    <p className="text-3xl font-bold text-center text-yellow-400">{student.ecoPoints}</p>
                                                    <p className="text-xs text-gray-400 text-center mt-1">EcoPoints</p>
                                                </div>

                                                {/* Impact Metrics */}
                                                <div className="grid grid-cols-2 gap-2 text-xs">
                                                    <div className="bg-[#0f0f0f]/50 rounded-lg p-2 text-center">
                                                        <Leaf className="h-3 w-3 text-emerald-400 mx-auto mb-1" />
                                                        <p className="text-emerald-400 font-semibold">{student.impactMetrics.co2_saved_kg} kg</p>
                                                        <p className="text-gray-500">CO₂</p>
                                                    </div>
                                                    <div className="bg-[#0f0f0f]/50 rounded-lg p-2 text-center">
                                                        <Target className="h-3 w-3 text-blue-400 mx-auto mb-1" />
                                                        <p className="text-blue-400 font-semibold">{student.completedTasks}</p>
                                                        <p className="text-gray-500">Tasks</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Rest of Leaderboard */}
                    {restOfLeaderboard.length > 0 && (
                        <div className="bg-[#0f0f0f] rounded-2xl border border-[#1a1a1a] p-6">
                            <h2 className="text-xl font-bold text-white mb-4">Rankings</h2>

                            <div className="space-y-2">
                                {restOfLeaderboard.map((student) => {
                                    const isCurrentUser = student.studentId === userId;

                                    return (
                                        <div
                                            key={student.studentId}
                                            className={`flex items-center justify-between p-4 rounded-xl border transition-all ${isCurrentUser
                                                ? 'bg-emerald-900/10 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                                                : 'bg-[#1a1a1a] border-[#2a2a2a] hover:bg-[#222] hover:border-[#333]'
                                                }`}
                                        >
                                            <div className="flex items-center gap-4 flex-1">
                                                {/* Rank */}
                                                <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold ${getRankBadgeColor(student.rank)}`}>
                                                    {student.rank}
                                                </div>

                                                {/* Student Info */}
                                                <div className="flex-1">
                                                    <h4 className={`font-semibold ${isCurrentUser ? 'text-emerald-400' : 'text-white'}`}>
                                                        {isCurrentUser ? 'You' : student.name}
                                                    </h4>
                                                    <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                                                        <span className="capitalize">{student.educationLevel}</span>
                                                        <span>•</span>
                                                        <span>{student.completedTasks} tasks</span>
                                                    </div>
                                                </div>

                                                {/* Impact Preview */}
                                                <div className="hidden md:flex items-center gap-4 text-sm">
                                                    <div className="text-center">
                                                        <p className="text-emerald-400 font-semibold">{student.impactMetrics.co2_saved_kg}</p>
                                                        <p className="text-gray-500 text-xs">CO₂ (kg)</p>
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-green-400 font-semibold">{student.impactMetrics.trees_equivalent}</p>
                                                        <p className="text-gray-500 text-xs">Trees</p>
                                                    </div>
                                                </div>

                                                {/* Points */}
                                                <div className="text-right">
                                                    <p className="text-2xl font-bold text-yellow-400">{student.ecoPoints}</p>
                                                    <p className="text-xs text-gray-500">points</p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {filteredData.length === 0 && (
                        <div className="bg-[#0f0f0f] rounded-2xl border border-[#1a1a1a] p-12 text-center">
                            <Trophy className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                            <p className="text-gray-400">No students found matching your filters.</p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
