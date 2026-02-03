"use client";
import { useEffect, useState } from "react";
import { Award, TrendingUp, X, Sparkles } from "lucide-react";
import Confetti from 'react-confetti';

export default function PointsNotification({
    show,
    onClose,
    pointsEarned,
    newTotal,
    rankChange,
    achievement,
    activityType = "activity"
}) {
    const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
    const [showConfetti, setShowConfetti] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setWindowSize({ width: window.innerWidth, height: window.innerHeight });
        }
    }, []);

    useEffect(() => {
        if (show) {
            // Show confetti for significant achievements
            if (pointsEarned >= 200 || achievement) {
                setShowConfetti(true);
                setTimeout(() => setShowConfetti(false), 5000);
            }

            // Auto-dismiss after 5 seconds
            const timer = setTimeout(() => {
                onClose();
            }, 5000);

            return () => clearTimeout(timer);
        }
    }, [show, pointsEarned, achievement, onClose]);

    if (!show) return null;

    const getActivityEmoji = (type) => {
        switch (type) {
            case 'quiz': return '📝';
            case 'task': return '✅';
            case 'learning_path': return '📚';
            case 'action': return '🌱';
            default: return '⭐';
        }
    };

    return (
        <>
            {showConfetti && (
                <Confetti
                    width={windowSize.width}
                    height={windowSize.height}
                    recycle={false}
                    numberOfPieces={200}
                    gravity={0.3}
                />
            )}

            <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 pointer-events-none">
                <div className="pointer-events-auto animate-slide-down">
                    <div className="bg-gradient-to-br from-emerald-900/95 to-green-900/95 backdrop-blur-lg rounded-2xl border-2 border-emerald-500/50 shadow-[0_0_40px_rgba(16,185,129,0.4)] p-6 max-w-md w-full">
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        {/* Header */}
                        <div className="flex items-center gap-3 mb-4">
                            <div className="h-12 w-12 rounded-full bg-emerald-500/20 flex items-center justify-center animate-pulse">
                                <Award className="h-6 w-6 text-emerald-400" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    Points Earned! {getActivityEmoji(activityType)}
                                </h3>
                                <p className="text-sm text-emerald-300">Great job on completing this {activityType}!</p>
                            </div>
                        </div>

                        {/* Points Display */}
                        <div className="bg-black/30 rounded-xl p-6 mb-4 text-center">
                            <div className="flex items-center justify-center gap-2 mb-2">
                                <Sparkles className="h-5 w-5 text-yellow-400 animate-pulse" />
                                <p className="text-5xl font-bold text-emerald-400 animate-bounce">
                                    +{pointsEarned}
                                </p>
                                <Sparkles className="h-5 w-5 text-yellow-400 animate-pulse" />
                            </div>
                            <p className="text-sm text-gray-300">EcoPoints</p>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="bg-black/20 rounded-xl p-3 text-center border border-emerald-500/20">
                                <p className="text-xs text-gray-400 mb-1">New Total</p>
                                <p className="text-2xl font-bold text-white">{newTotal}</p>
                            </div>

                            {rankChange !== undefined && rankChange !== null && (
                                <div className="bg-black/20 rounded-xl p-3 text-center border border-emerald-500/20">
                                    <p className="text-xs text-gray-400 mb-1">Rank Change</p>
                                    <div className="flex items-center justify-center gap-1">
                                        <TrendingUp className="h-4 w-4 text-emerald-400" />
                                        <p className="text-2xl font-bold text-emerald-400">
                                            {rankChange > 0 ? '+' : ''}{rankChange}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Achievement Badge */}
                        {achievement && (
                            <div className="bg-gradient-to-r from-yellow-900/30 to-orange-900/30 rounded-xl p-4 border border-yellow-500/50 text-center">
                                <p className="text-lg font-bold text-yellow-400 mb-1">{achievement}</p>
                                <p className="text-xs text-yellow-200/70">Achievement Unlocked!</p>
                            </div>
                        )}

                        {/* Progress Message */}
                        <div className="mt-4 text-center">
                            <p className="text-sm text-gray-300">
                                Keep going! Every action makes a difference 🌍
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
        @keyframes slide-down {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-down {
          animation: slide-down 0.5s ease-out;
        }
      `}</style>
        </>
    );
}
