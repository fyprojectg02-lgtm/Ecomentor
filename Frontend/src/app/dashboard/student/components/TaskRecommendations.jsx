"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
    Target,
    Clock,
    Award,
    Zap,
    Leaf,
    ChevronRight,
    Loader2,
    RefreshCw,
    Filter,
    X,
    CheckCircle
} from "lucide-react";
import PointsNotification from "./PointsNotification";

export default function TaskRecommendations({ userId, educationLevel }) {
    const [recommendations, setRecommendations] = useState([]);
    const [completedTasks, setCompletedTasks] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [filter, setFilter] = useState({ difficulty: "all", actionType: "all" });
    const [showFilters, setShowFilters] = useState(false);
    const [showPointsNotification, setShowPointsNotification] = useState(false);
    const [pointsData, setPointsData] = useState(null);
    const [isCompletingTask, setIsCompletingTask] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            await fetchCompletedTasks();
            await fetchRecommendations();
        };
        loadData();
    }, [userId]);

    const fetchRecommendations = async (regenerate = false) => {
        setIsLoading(true);
        try {
            const response = await fetch("/api/tasks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId,
                    limit: 6,
                    regenerate
                })
            });

            const data = await response.json();
            if (data.success) {
                // Filter out completed tasks - fetch fresh completed tasks to ensure accuracy
                const { data: completions } = await supabase
                    .from('activity_completions')
                    .select('activity_id')
                    .eq('student_id', userId)
                    .eq('activity_type', 'task');

                const completedTaskIds = completions?.map(c => c.activity_id) || [];
                const filteredRecs = data.recommendations.filter(
                    task => !completedTaskIds.includes(task.id)
                );
                setRecommendations(filteredRecs);
            }
        } catch (error) {
            console.error("Error fetching recommendations:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchCompletedTasks = async () => {
        try {
            // Fetch completed tasks from activity_completions
            const { data: completions, error } = await supabase
                .from('activity_completions')
                .select('activity_id, completed_at, points_awarded, completion_data')
                .eq('student_id', userId)
                .eq('activity_type', 'task')
                .order('completed_at', { ascending: false });

            if (error) {
                console.error('Error fetching completed tasks:', error);
                return;
            }

            if (completions && completions.length > 0) {
                // Get task details for completed tasks
                const taskIds = completions.map(c => c.activity_id);
                const { data: tasks } = await supabase
                    .from('recommended_tasks')
                    .select('*')
                    .in('id', taskIds);

                // Map completions with task details
                const completedWithDetails = completions.map(completion => {
                    const task = tasks?.find(t => t.id === completion.activity_id);
                    return {
                        ...task,
                        id: completion.activity_id,
                        completedAt: completion.completed_at,
                        pointsEarned: completion.points_awarded,
                        completionData: completion.completion_data
                    };
                }).filter(task => task.id); // Filter out any null/undefined tasks

                setCompletedTasks(completedWithDetails);
            }
        } catch (error) {
            console.error('Error fetching completed tasks:', error);
        }
    };

    const completeTask = async (taskId) => {
        setIsCompletingTask(true);
        try {
            const response = await fetch('/api/complete-task', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ studentId: userId, taskId })
            });

            const data = await response.json();
            if (data.success) {
                setPointsData({
                    pointsEarned: data.pointsEarned,
                    newTotal: data.newTotalPoints,
                    rankChange: null,
                    achievement: null,
                    activityType: 'task'
                });
                setShowPointsNotification(true);
                setSelectedTask(null);
                // Refresh both recommendations and completed tasks
                await fetchCompletedTasks();
                await fetchRecommendations();
            }
        } catch (error) {
            console.error('Error completing task:', error);
            alert('Failed to complete task. Please try again.');
        } finally {
            setIsCompletingTask(false);
        }
    };

    const getDifficultyColor = (difficulty) => {
        switch (difficulty?.toLowerCase()) {
            case "easy": return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
            case "medium": return "bg-amber-500/15 text-amber-300 border-amber-500/30";
            case "hard": return "bg-red-500/15 text-red-300 border-red-500/30";
            default: return "bg-gray-500/15 text-gray-300 border-gray-500/30";
        }
    };

    const getActionTypeIcon = (type) => {
        const iconClass = "h-5 w-5";
        switch (type?.toLowerCase()) {
            case "recycling": return <Target className={iconClass} />;
            case "energy_conservation": return <Zap className={iconClass} />;
            case "tree_planting": return <Leaf className={iconClass} />;
            default: return <Target className={iconClass} />;
        }
    };

    const filteredRecommendations = recommendations.filter(task => {
        if (filter.difficulty !== "all" && task.difficulty !== filter.difficulty) return false;
        if (filter.actionType !== "all" && task.action_type !== filter.actionType) return false;
        return true;
    });

    const actionTypes = [...new Set(recommendations.map(t => t.action_type || t.actionType))];

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Target className="h-6 w-6 text-emerald-400" />
                        Recommended Tasks for You
                    </h3>
                    <p className="text-sm text-gray-400 mt-1">
                        Personalized eco-actions based on your education level and interests
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="px-4 py-2 bg-[#1a1a1a] hover:bg-[#222] text-white rounded-xl border border-[#2a2a2a] transition-colors flex items-center gap-2"
                    >
                        <Filter className="h-4 w-4" />
                        Filter
                    </button>
                    <button
                        onClick={() => fetchRecommendations(true)}
                        disabled={isLoading}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-[#04210f] font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <RefreshCw className="h-4 w-4" />
                        )}
                        Generate New Tasks
                    </button>
                </div>
            </div>

            {/* Filters */}
            {showFilters && (
                <div className="bg-[#0f0f0f] rounded-2xl border border-[#1a1a1a] p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm text-gray-400 mb-2 block">Difficulty</label>
                            <select
                                value={filter.difficulty}
                                onChange={(e) => setFilter({ ...filter, difficulty: e.target.value })}
                                className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
                            >
                                <option value="all">All Levels</option>
                                <option value="easy">Easy</option>
                                <option value="medium">Medium</option>
                                <option value="hard">Hard</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-sm text-gray-400 mb-2 block">Action Type</label>
                            <select
                                value={filter.actionType}
                                onChange={(e) => setFilter({ ...filter, actionType: e.target.value })}
                                className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
                            >
                                <option value="all">All Types</option>
                                {actionTypes.map(type => (
                                    <option key={type} value={type}>{type.replace(/_/g, " ")}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            )}

            {/* Task Grid */}
            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 text-emerald-400 animate-spin" />
                </div>
            ) : filteredRecommendations.length === 0 ? (
                <div className="bg-[#0f0f0f] rounded-2xl border border-[#1a1a1a] p-8 text-center">
                    <Target className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400">No tasks match your filters. Try adjusting them!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredRecommendations.map((task, index) => (
                        <div
                            key={task.id || index}
                            className="bg-[#0f0f0f] rounded-2xl border border-[#1a1a1a] p-5 hover:shadow-lg hover:border-emerald-500/30 transition-all cursor-pointer group"
                            onClick={() => setSelectedTask(task)}
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between mb-3">
                                <div className="h-10 w-10 rounded-full bg-emerald-500/15 flex items-center justify-center text-emerald-400">
                                    {getActionTypeIcon(task.action_type || task.actionType)}
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs border ${getDifficultyColor(task.difficulty)}`}>
                                    {task.difficulty}
                                </span>
                            </div>

                            {/* Title & Description */}
                            <h4 className="text-lg font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">
                                {task.title}
                            </h4>
                            <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                                {task.description}
                            </p>

                            {/* Metadata */}
                            <div className="space-y-2 mb-4">
                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                    <Clock className="h-4 w-4 text-emerald-400" />
                                    {task.estimated_time || task.estimatedTime}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                    <Award className="h-4 w-4 text-emerald-400" />
                                    {task.estimated_points || task.estimatedPoints} points
                                </div>
                            </div>

                            {/* Tags */}
                            {(task.tags || []).length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-4">
                                    {(task.tags || []).slice(0, 3).map((tag, i) => (
                                        <span
                                            key={i}
                                            className="px-2 py-0.5 rounded-full bg-[#1a1a1a] text-gray-400 text-xs"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Action Button */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedTask(task);
                                }}
                                className="w-full bg-emerald-500/10 hover:bg-emerald-500 hover:text-[#04210f] text-emerald-300 font-semibold py-2 rounded-xl border border-emerald-500/30 transition-all flex items-center justify-center gap-2 group-hover:bg-emerald-500 group-hover:text-[#04210f]"
                            >
                                View Details
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Task Details Modal */}
            {selectedTask && (
                <div
                    className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
                    onClick={() => setSelectedTask(null)}
                >
                    <div
                        className="bg-[#0f0f0f] rounded-2xl border border-[#1a1a1a] p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="h-12 w-12 rounded-full bg-emerald-500/15 flex items-center justify-center text-emerald-400">
                                        {getActionTypeIcon(selectedTask.action_type || selectedTask.actionType)}
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-white">{selectedTask.title}</h3>
                                        <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs border ${getDifficultyColor(selectedTask.difficulty)}`}>
                                            {selectedTask.difficulty}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedTask(null)}
                                className="text-gray-400 hover:text-white text-2xl"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        {/* Description */}
                        <p className="text-gray-300 mb-6">{selectedTask.description}</p>

                        {/* Metadata Grid */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="bg-[#1a1a1a] rounded-xl p-4">
                                <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
                                    <Clock className="h-4 w-4 text-emerald-400" />
                                    Estimated Time
                                </div>
                                <p className="text-white font-semibold">{selectedTask.estimated_time || selectedTask.estimatedTime}</p>
                            </div>
                            <div className="bg-[#1a1a1a] rounded-xl p-4">
                                <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
                                    <Award className="h-4 w-4 text-emerald-400" />
                                    Points Reward
                                </div>
                                <p className="text-white font-semibold">{selectedTask.estimated_points || selectedTask.estimatedPoints} points</p>
                            </div>
                        </div>

                        {/* Required Resources */}
                        {(selectedTask.required_resources || selectedTask.requiredResources) && (
                            <div className="mb-6">
                                <h4 className="text-lg font-bold text-white mb-3">Required Resources</h4>
                                <div className="flex flex-wrap gap-2">
                                    {(selectedTask.required_resources || selectedTask.requiredResources).map((resource, i) => (
                                        <span
                                            key={i}
                                            className="px-3 py-1.5 rounded-full bg-[#1a1a1a] text-gray-300 text-sm border border-[#2a2a2a]"
                                        >
                                            {resource}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Impact Metrics */}
                        {(selectedTask.impact_metrics || selectedTask.impactMetrics) && (
                            <div className="mb-6">
                                <h4 className="text-lg font-bold text-white mb-3">Environmental Impact</h4>
                                <div className="grid grid-cols-3 gap-3">
                                    {Object.entries(selectedTask.impact_metrics || selectedTask.impactMetrics).map(([key, value]) => (
                                        <div key={key} className="bg-emerald-500/10 rounded-xl p-3 border border-emerald-500/30">
                                            <p className="text-2xl font-bold text-emerald-400">{value}</p>
                                            <p className="text-xs text-gray-400 mt-1">{key.replace(/_/g, " ")}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Instructions */}
                        {selectedTask.instructions && (
                            <div className="mb-6">
                                <h4 className="text-lg font-bold text-white mb-3">Step-by-Step Instructions</h4>
                                <div className="bg-[#1a1a1a] rounded-xl p-4">
                                    <pre className="text-sm text-gray-300 whitespace-pre-wrap font-sans">
                                        {selectedTask.instructions}
                                    </pre>
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => completeTask(selectedTask.id)}
                                disabled={isCompletingTask}
                                className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-[#04210f] font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isCompletingTask ? (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        Completing...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="h-5 w-5" />
                                        Complete Task
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Completed Tasks Section */}
            {completedTasks.length > 0 && (
                <div className="mt-8 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                            <CheckCircle className="h-6 w-6 text-emerald-400" />
                            Completed Tasks
                        </h3>
                        <span className="text-sm text-gray-400">
                            {completedTasks.length} task{completedTasks.length !== 1 ? 's' : ''} completed
                        </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {completedTasks.map((task, index) => (
                            <div
                                key={task.id || index}
                                className="bg-[#0f0f0f] rounded-2xl border border-emerald-500/30 p-5 opacity-75"
                            >
                                {/* Header */}
                                <div className="flex items-start justify-between mb-3">
                                    <div className="h-10 w-10 rounded-full bg-emerald-500/15 flex items-center justify-center text-emerald-400">
                                        {getActionTypeIcon(task.action_type || task.actionType)}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4 text-emerald-400" />
                                        <span className="px-3 py-1 rounded-full text-xs bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                            Completed
                                        </span>
                                    </div>
                                </div>

                                {/* Title & Description */}
                                <h4 className="text-lg font-bold text-white mb-2">
                                    {task.title}
                                </h4>
                                <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                                    {task.description}
                                </p>

                                {/* Metadata */}
                                <div className="space-y-2 mb-4">
                                    <div className="flex items-center gap-2 text-sm text-emerald-400">
                                        <Award className="h-4 w-4" />
                                        {task.pointsEarned || task.estimated_points || task.estimatedPoints} points earned
                                    </div>
                                    {task.completedAt && (
                                        <div className="flex items-center gap-2 text-sm text-gray-400">
                                            <Clock className="h-4 w-4" />
                                            {new Date(task.completedAt).toLocaleDateString()}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Points Notification */}
            {showPointsNotification && pointsData && (
                <PointsNotification
                    show={showPointsNotification}
                    onClose={() => setShowPointsNotification(false)}
                    pointsEarned={pointsData.pointsEarned}
                    newTotal={pointsData.newTotal}
                    rankChange={pointsData.rankChange}
                    achievement={pointsData.achievement}
                    activityType={pointsData.activityType}
                />
            )}
        </div>
    );
}
