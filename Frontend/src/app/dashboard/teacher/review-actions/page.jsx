"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import {
    ArrowLeft,
    CheckCircle,
    AlertCircle,
    X,
    Loader2,
    ThumbsUp,
    ThumbsDown,
    Eye,
    Filter,
    Clock,
    Award,
    FileText,
    MapPin,
    Calendar,
    Sparkles
} from "lucide-react";

export default function ReviewActionsPage() {
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");
    const [selectedSubmission, setSelectedSubmission] = useState(null);
    const [apiCounts, setApiCounts] = useState({ all: 0, ai_flagged: 0, pending_review: 0, reviewed: 0 });
    const [teacherId, setTeacherId] = useState(null);
    const [processing, setProcessing] = useState(false);


    useEffect(() => {
        fetchTeacherAndSubmissions();
    }, [filter]);

    const fetchTeacherAndSubmissions = async () => {
        try {
            setLoading(true);

            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                console.error("No user found");
                return;
            }

            setTeacherId(user.id);

            // Fetch submissions from API
            const params = new URLSearchParams({
                teacherId: user.id,
                status: filter // Pass the filter directly
            });

            const response = await fetch(`/api/submissions?${params}`);
            const data = await response.json();

            if (data.success) {
                setSubmissions(data.submissions || []);
                if (data.counts) {
                    setApiCounts(data.counts);
                }
            }
        } catch (error) {
            console.error("Error fetching submissions:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (submission, customPoints = null) => {
        if (processing) return;
        setProcessing(true);

        try {
            const points = customPoints || submission.aiVerification?.suggestedPoints || 100;

            const response = await fetch("/api/review-action", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    submissionId: submission._id,
                    action: "approve",
                    points,
                    teacherId,
                    teacherNotes: ""
                })
            });

            const result = await response.json();

            if (result.success) {
                // If we are in restricted view, remove it. Otherwise refresh.
                if (filter === "pending_review" || filter === "ai_flagged") {
                    setSubmissions(prev => prev.filter(s => s._id !== submission._id));
                } else {
                    fetchTeacherAndSubmissions();
                }
                setSelectedSubmission(null);
                alert(`✅ Action approved! ${points} points awarded to ${submission.studentName}`);
            } else {
                alert("Failed to approve action: " + result.error);
            }
        } catch (error) {
            console.error("Approval error:", error);
            alert("Failed to approve action");
        } finally {
            setProcessing(false);
        }
    };

    const handleReject = async (submission) => {
        if (processing) return;

        const reason = prompt("Please provide a reason for rejection:");
        if (!reason) return;

        setProcessing(true);

        try {
            const response = await fetch("/api/review-action", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    submissionId: submission._id,
                    action: "reject",
                    teacherId,
                    teacherNotes: reason
                })
            });

            const result = await response.json();

            if (result.success) {
                if (filter === "pending_review" || filter === "ai_flagged") {
                    setSubmissions(prev => prev.filter(s => s._id !== submission._id));
                } else {
                    fetchTeacherAndSubmissions();
                }
                setSelectedSubmission(null);
                alert(`❌ Action rejected. Student has been notified.`);
            } else {
                alert("Failed to reject action: " + result.error);
            }
        } catch (error) {
            console.error("Rejection error:", error);
            alert("Failed to reject action");
        } finally {
            setProcessing(false);
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            ai_flagged: "bg-amber-500/15 text-amber-300 border-amber-500/30",
            pending_review: "bg-blue-500/15 text-blue-300 border-blue-500/30",
            approved: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
            rejected: "bg-red-500/15 text-red-300 border-red-500/30"
        };
        return badges[status] || badges.pending_review;
    };

    const getStatusLabel = (status) => {
        const labels = {
            ai_flagged: "AI Flagged",
            pending_review: "Pending Review",
            approved: "Approved",
            rejected: "Rejected"
        };
        return labels[status] || "Unknown";
    };


    return (
        <div className="min-h-screen bg-[#050505] text-gray-100 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
                    <div className="flex items-center gap-5">
                        <Link
                            href="/dashboard/teacher"
                            className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group"
                        >
                            <ArrowLeft className="h-5 w-5 text-gray-400 group-hover:text-white group-hover:-translate-x-1 transition-all" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500/20 rounded-lg">
                                    <FileText className="h-6 w-6 text-blue-400" />
                                </div>
                                <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-gray-500">
                                    Action Review Queue
                                </h1>
                            </div>
                            <p className="text-gray-400 mt-2 flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-blue-500/60" />
                                Review and approve student eco-action submissions
                            </p>
                        </div>
                    </div>

                    {/* Filter */}
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="bg-black/40 border border-white/10 text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                    >
                        <option value="all">All Submissions ({apiCounts.all})</option>
                        <option value="ai_flagged">AI Flagged ({apiCounts.ai_flagged})</option>
                        <option value="pending_review">Pending Review ({apiCounts.pending_review})</option>
                        <option value="reviewed">History / Reviewed ({apiCounts.reviewed})</option>
                    </select>
                </div>

                {/* Loading State */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
                        <p className="text-gray-400">Loading submissions...</p>
                    </div>
                ) : submissions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 px-6">
                        <div className="bg-white/5 p-6 rounded-full mb-6 border border-white/5">
                            <CheckCircle className="h-16 w-16 text-gray-700" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">All caught up!</h3>
                        <p className="text-gray-500 text-center max-w-md">
                            No submissions to review at the moment. Check back later for new student eco-actions.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {submissions.map((submission) => (
                            <div
                                key={submission._id}
                                className={`bg-white/5 backdrop-blur-xl rounded-3xl border p-6 md:p-8 transition-all hover:shadow-2xl ${submission.status === "ai_flagged"
                                    ? "border-amber-500/30 shadow-amber-500/10"
                                    : "border-white/10"
                                    }`}
                            >
                                <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
                                    {/* Left Section */}
                                    <div className="flex-1 space-y-4 w-full">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="text-2xl font-bold text-white">{submission.studentName}</h3>
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadge(submission.status)}`}>
                                                        {getStatusLabel(submission.status)}
                                                    </span>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
                                                    <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                                                        <Award className="h-4 w-4" />
                                                        {submission.actionType}
                                                    </span>
                                                    <span>•</span>
                                                    <span className="flex items-center gap-1.5">
                                                        <MapPin className="h-3.5 w-3.5" />
                                                        {submission.location}
                                                    </span>
                                                    <span>•</span>
                                                    <span className="flex items-center gap-1.5">
                                                        <Calendar className="h-3.5 w-3.5" />
                                                        {new Date(submission.date).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <p className="text-gray-300 leading-relaxed">{submission.description}</p>

                                        {submission.estimatedImpact && (
                                            <p className="text-sm text-gray-400">
                                                <span className="font-semibold text-blue-400">Estimated Impact:</span> {submission.estimatedImpact}
                                            </p>
                                        )}

                                        {/* AI Verification Summary */}
                                        {submission.aiVerification && (
                                            <div className={`p-5 rounded-2xl border ${submission.aiVerification.verified
                                                ? "bg-emerald-500/5 border-emerald-500/20"
                                                : "bg-amber-500/5 border-amber-500/20"
                                                }`}>
                                                <div className="flex items-start gap-3">
                                                    {submission.aiVerification.verified ? (
                                                        <CheckCircle className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                                                    ) : (
                                                        <AlertCircle className="h-5 w-5 text-amber-400 mt-0.5 flex-shrink-0" />
                                                    )}
                                                    <div className="flex-1">
                                                        <p className="font-bold text-white mb-2 flex items-center gap-2">
                                                            <Sparkles className="h-4 w-4" />
                                                            AI Confidence: {(submission.aiVerification.confidence * 100).toFixed(0)}%
                                                        </p>
                                                        <p className="text-sm text-gray-300 leading-relaxed">{submission.aiVerification.reasoning}</p>
                                                        {submission.aiVerification.flaggedIssues?.length > 0 && (
                                                            <div className="mt-3">
                                                                <p className="text-xs text-gray-400 mb-2 font-semibold">Flagged Issues:</p>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {submission.aiVerification.flaggedIssues.map((issue, idx) => (
                                                                        <span key={idx} className="px-3 py-1 bg-amber-500/20 text-amber-300 text-xs rounded-lg font-medium">
                                                                            {issue}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                        <p className="text-sm text-gray-400 mt-3">
                                                            Suggested Points: <span className="font-bold text-emerald-400 text-base">{submission.aiVerification.suggestedPoints}</span>
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Right Section - Images & Actions */}
                                    <div className="w-full lg:w-64 space-y-4">
                                        {/* Image Preview */}
                                        {submission.images?.length > 0 && (
                                            <div className="grid grid-cols-2 gap-3">
                                                {submission.images.slice(0, 4).map((img, idx) => (
                                                    <img
                                                        key={idx}
                                                        src={img}
                                                        alt={`Evidence ${idx + 1}`}
                                                        className="w-full h-28 object-cover rounded-xl border border-white/10 cursor-pointer hover:border-blue-500 transition-all hover:scale-105"
                                                        onClick={() => setSelectedSubmission(submission)}
                                                    />
                                                ))}
                                            </div>
                                        )}

                                        {/* Action Buttons */}
                                        <div className="space-y-3">
                                            {submission.status === 'approved' || submission.status === 'rejected' ? (
                                                <div className={`p-4 rounded-xl border flex flex-col gap-2 ${submission.status === 'approved'
                                                    ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-300'
                                                    : 'bg-red-500/5 border-red-500/20 text-red-300'
                                                    }`}>
                                                    <div className="flex items-center gap-2 font-bold uppercase text-xs tracking-widest">
                                                        {submission.status === 'approved' ? <ThumbsUp size={14} /> : <ThumbsDown size={14} />}
                                                        {submission.status.toUpperCase()}
                                                    </div>
                                                    {submission.status === 'approved' && (
                                                        <div className="text-sm font-semibold">
                                                            Awarded: {submission.finalPoints || submission.aiVerification?.suggestedPoints || 0} pts
                                                        </div>
                                                    )}
                                                    {submission.teacherNotes && (
                                                        <div className="text-xs italic opacity-80 mt-1">
                                                            " {submission.teacherNotes} "
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => setSelectedSubmission(submission)}
                                                        className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                        View Details
                                                    </button>
                                                    <button
                                                        onClick={() => handleApprove(submission)}
                                                        disabled={processing}
                                                        className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-gray-700 text-emerald-950 disabled:text-gray-500 py-3 rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                                                    >
                                                        <ThumbsUp className="h-4 w-4" />
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => handleReject(submission)}
                                                        disabled={processing}
                                                        className="w-full bg-red-500/20 hover:bg-red-500/30 disabled:bg-gray-700 text-red-300 disabled:text-gray-500 border border-red-500/30 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                                                    >
                                                        <ThumbsDown className="h-4 w-4" />
                                                        Reject
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Detailed Review Modal */}
                {selectedSubmission && (
                    <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 md:p-6 z-50 backdrop-blur-sm">
                        <div className="bg-[#0f0f0f] rounded-3xl border border-white/10 max-w-5xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6 md:p-8 space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-2xl md:text-3xl font-bold text-white">Detailed Review</h3>
                                    <button
                                        onClick={() => setSelectedSubmission(null)}
                                        className="text-gray-400 hover:text-white p-2 hover:bg-white/5 rounded-xl transition-all"
                                    >
                                        <X className="h-6 w-6" />
                                    </button>
                                </div>

                                {/* Full Images */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {selectedSubmission.images?.map((img, idx) => (
                                        <img
                                            key={idx}
                                            src={img}
                                            alt={`Evidence ${idx + 1}`}
                                            className="w-full h-80 object-cover rounded-2xl border border-white/10"
                                        />
                                    ))}
                                </div>

                                {/* Full Details */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-300">
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider font-bold">Student</p>
                                        <p className="font-semibold text-white text-lg">{selectedSubmission.studentName}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider font-bold">Action Type</p>
                                        <p className="font-semibold text-white text-lg">{selectedSubmission.actionType}</p>
                                    </div>
                                    <div className="md:col-span-2">
                                        <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider font-bold">Description</p>
                                        <p className="leading-relaxed">{selectedSubmission.description}</p>
                                    </div>
                                    <div className="md:col-span-2">
                                        <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider font-bold">AI Analysis</p>
                                        <p className="leading-relaxed">{selectedSubmission.aiVerification?.reasoning}</p>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                {selectedSubmission.status === 'approved' || selectedSubmission.status === 'rejected' ? (
                                    <div className={`mt-6 p-6 rounded-2xl border text-center ${selectedSubmission.status === 'approved'
                                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                        : 'bg-red-500/10 border-red-500/20 text-red-400'
                                        }`}>
                                        <div className="flex items-center justify-center gap-3 font-bold text-xl uppercase tracking-widest mb-2">
                                            {selectedSubmission.status === 'approved' ? <ThumbsUp size={24} /> : <ThumbsDown size={24} />}
                                            {selectedSubmission.status.toUpperCase()}
                                        </div>
                                        {selectedSubmission.status === 'approved' && (
                                            <p className="text-lg font-semibold mb-2">
                                                Awarded: {selectedSubmission.finalPoints || selectedSubmission.aiVerification?.suggestedPoints || 0} Points
                                            </p>
                                        )}
                                        {selectedSubmission.teacherNotes && (
                                            <div className="mt-4 pt-4 border-t border-white/10">
                                                <p className="text-xs text-gray-500 uppercase mb-2 font-bold">Your Notes</p>
                                                <p className="italic text-gray-300">"{selectedSubmission.teacherNotes}"</p>
                                            </div>
                                        )}
                                        <button
                                            onClick={() => setSelectedSubmission(null)}
                                            className="mt-6 px-8 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white font-semibold transition-all"
                                        >
                                            Close Record
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col md:flex-row gap-3 pt-4">
                                        <button
                                            onClick={() => handleApprove(selectedSubmission)}
                                            disabled={processing}
                                            className="flex-1 bg-emerald-500 hover:bg-emerald-400 disabled:bg-gray-700 text-emerald-950 disabled:text-gray-500 py-4 rounded-2xl font-bold transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
                                        >
                                            {processing ? "Processing..." : "Approve & Award Points"}
                                        </button>
                                        <button
                                            onClick={() => handleReject(selectedSubmission)}
                                            disabled={processing}
                                            className="flex-1 bg-red-500/20 hover:bg-red-500/30 disabled:bg-gray-700 text-red-300 disabled:text-gray-500 border border-red-500/30 py-4 rounded-2xl font-bold transition-all"
                                        >
                                            {processing ? "Processing..." : "Reject Submission"}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
