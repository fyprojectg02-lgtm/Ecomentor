"use client";
import { useState, useEffect } from "react";
import { Trophy, Home, Volume2, VolumeX, Flame, Recycle } from "lucide-react";
import audioManager from "@/lib/AudioManager";

const wasteItems = [
    { id: 1, name: "Plastic Bottle", type: "plastic", emoji: "🍾", fact: "Plastic bottles can be recycled into clothing, furniture, and new bottles!" },
    { id: 2, name: "Newspaper", type: "paper", emoji: "📰", fact: "Recycling one ton of paper saves 17 trees and 7,000 gallons of water!" },
    { id: 3, name: "Glass Jar", type: "glass", emoji: "🫙", fact: "Glass can be recycled endlessly without losing quality!" },
    { id: 4, name: "Banana Peel", type: "organic", emoji: "🍌", fact: "Organic waste can be composted to create nutrient-rich soil!" },
    { id: 5, name: "Aluminum Can", type: "metal", emoji: "🥫", fact: "Recycling aluminum saves 95% of the energy needed to make new cans!" },
    { id: 6, name: "Cardboard Box", type: "paper", emoji: "📦", fact: "Cardboard can be recycled 5-7 times before fibers become too short!" },
    { id: 7, name: "Apple Core", type: "organic", emoji: "🍎", fact: "Composting food waste reduces methane emissions from landfills!" },
    { id: 8, name: "Plastic Bag", type: "plastic", emoji: "🛍️", fact: "Plastic bags take 10-1000 years to decompose in landfills!" },
    { id: 9, name: "Wine Bottle", type: "glass", emoji: "🍷", fact: "Recycled glass uses 40% less energy than making new glass!" },
    { id: 10, name: "Office Paper", type: "paper", emoji: "📄", fact: "The average office worker uses 10,000 sheets of paper per year!" },
    { id: 11, name: "Food Scraps", type: "organic", emoji: "🥗", fact: "About 30-40% of the food supply in the US is wasted!" },
    { id: 12, name: "Soda Can", type: "metal", emoji: "🥤", fact: "A recycled aluminum can is back on the shelf in just 60 days!" },
    { id: 13, name: "Yogurt Container", type: "plastic", emoji: "🥛", fact: "Check the recycling number - not all plastics are recyclable everywhere!" },
    { id: 14, name: "Coffee Grounds", type: "organic", emoji: "☕", fact: "Coffee grounds make excellent compost and can repel garden pests!" },
    { id: 15, name: "Milk Jug", type: "plastic", emoji: "🧃", fact: "HDPE plastic jugs are highly recyclable and valuable!" }
];

const bins = [
    { type: "plastic", name: "Plastic", color: "from-blue-500 to-blue-600", emoji: "♻️" },
    { type: "paper", name: "Paper", color: "from-amber-500 to-amber-600", emoji: "📄" },
    { type: "glass", name: "Glass", color: "from-green-500 to-green-600", emoji: "🫙" },
    { type: "organic", name: "Organic", color: "from-emerald-500 to-emerald-600", emoji: "🌱" },
    { type: "metal", name: "Metal", color: "from-gray-500 to-gray-600", emoji: "🔩" }
];

export default function RecyclingSortingGame() {
    const [gameStarted, setGameStarted] = useState(false);
    const [currentItem, setCurrentItem] = useState(null);
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);
    const [itemsProcessed, setItemsProcessed] = useState(0);
    const [showFeedback, setShowFeedback] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState("");
    const [isCorrect, setIsCorrect] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [gameComplete, setGameComplete] = useState(false);
    const [draggedOver, setDraggedOver] = useState(null);
    const [usedItems, setUsedItems] = useState([]);

    const startGame = () => {
        audioManager.play('click');
        setGameStarted(true);
        setScore(0);
        setStreak(0);
        setItemsProcessed(0);
        setGameComplete(false);
        setUsedItems([]);
        getNextItem();
    };

    const getNextItem = () => {
        const availableItems = wasteItems.filter(item => !usedItems.includes(item.id));
        if (availableItems.length === 0) {
            endGame();
            return;
        }
        const randomItem = availableItems[Math.floor(Math.random() * availableItems.length)];
        setCurrentItem(randomItem);
        setShowFeedback(false);
    };

    const handleSort = (binType) => {
        if (!currentItem || showFeedback) return;

        const correct = binType === currentItem.type;
        setIsCorrect(correct);
        setShowFeedback(true);

        if (correct) {
            audioManager.play('correct');
            const newStreak = streak + 1;
            const points = 10 * (1 + Math.floor(newStreak / 3) * 0.5);
            setScore(score + points);
            setStreak(newStreak);
            setFeedbackMessage(`✓ Correct! +${points} points ${newStreak >= 3 ? `(${newStreak}x streak!)` : ''}`);
        } else {
            audioManager.play('incorrect');
            setStreak(0);
            setFeedbackMessage(`✗ Wrong! ${currentItem.name} goes in ${bins.find(b => b.type === currentItem.type)?.name}`);
        }

        setUsedItems([...usedItems, currentItem.id]);
        setItemsProcessed(itemsProcessed + 1);

        setTimeout(() => {
            if (itemsProcessed + 1 >= 10) {
                endGame();
            } else {
                getNextItem();
            }
        }, 2000);
    };

    const endGame = () => {
        audioManager.play('success');
        setGameComplete(true);
        setGameStarted(false);
    };

    const toggleMute = () => {
        audioManager.toggleMute();
        setIsMuted(!isMuted);
    };

    if (!gameStarted && !gameComplete) {
        return (
            <div className="min-h-screen bg-black p-6">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center justify-between mb-8">
                        <h1 className="text-4xl font-bold text-white flex items-center gap-3">
                            ♻️ Recycling Sorting Challenge
                        </h1>
                        <a href="/dashboard/student?tab=home" className="text-emerald-400 hover:text-emerald-300 flex items-center gap-2">
                            <Home className="h-5 w-5" />
                            Back to Dashboard
                        </a>
                    </div>

                    <div className="bg-[#0f0f0f] rounded-2xl border border-[#1a1a1a] p-8 mb-6">
                        <h2 className="text-2xl font-bold text-white mb-4">How to Play</h2>
                        <ul className="text-gray-300 space-y-2 mb-6">
                            <li>• Sort waste items into the correct recycling bins</li>
                            <li>• Build streaks for bonus points</li>
                            <li>• Learn interesting recycling facts</li>
                            <li>• Complete 10 items to finish the game</li>
                        </ul>
                    </div>

                    <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-12 text-center">
                        <div className="text-8xl mb-6">♻️</div>
                        <h2 className="text-3xl font-bold text-white mb-4">Ready to Sort?</h2>
                        <p className="text-emerald-100 mb-8">Help save the planet by sorting waste correctly!</p>
                        <button
                            onClick={startGame}
                            className="bg-white hover:bg-emerald-50 text-emerald-600 font-bold text-xl px-12 py-4 rounded-xl transition-all transform hover:scale-105"
                        >
                            Start Sorting
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (gameComplete) {
        const accuracy = Math.round((score / (itemsProcessed * 10)) * 100);

        return (
            <div className="min-h-screen bg-black p-6">
                <div className="max-w-2xl mx-auto">
                    <div className="bg-gradient-to-br from-[#0f0f0f] to-[#1a1a1a] rounded-2xl border border-emerald-500/30 p-8 text-center">
                        <Recycle className="h-20 w-20 text-emerald-400 mx-auto mb-4" />
                        <h2 className="text-4xl font-bold text-white mb-4">Great Job! 🌍</h2>
                        <div className="text-6xl font-bold text-emerald-400 mb-2">{score}</div>
                        <p className="text-gray-400 mb-6">Total Points Earned</p>

                        <div className="bg-[#0a0a0a] rounded-xl p-6 mb-6">
                            <div className="grid grid-cols-2 gap-4 text-left">
                                <div>
                                    <p className="text-gray-400 text-sm">Items Sorted</p>
                                    <p className="text-2xl font-bold text-white">{itemsProcessed}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-sm">Accuracy</p>
                                    <p className="text-2xl font-bold text-white">{accuracy}%</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 mb-6">
                            <p className="text-emerald-300 text-sm">
                                🌱 You've learned how to properly sort {itemsProcessed} different types of waste!
                            </p>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={startGame}
                                className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3 rounded-xl transition-colors"
                            >
                                Play Again
                            </button>
                            <a
                                href="/dashboard/student?tab=home"
                                className="flex-1 bg-[#1a1a1a] hover:bg-[#222] text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center"
                            >
                                Back to Dashboard
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl px-4 py-2 flex items-center gap-2">
                            <Trophy className="h-5 w-5 text-emerald-400" />
                            <span className="text-white font-bold">{score}</span>
                        </div>
                        <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl px-4 py-2 flex items-center gap-2">
                            <Flame className={`h-5 w-5 ${streak >= 3 ? 'text-orange-400' : 'text-gray-400'}`} />
                            <span className={`font-bold ${streak >= 3 ? 'text-orange-400' : 'text-white'}`}>{streak} streak</span>
                        </div>
                        <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl px-4 py-2">
                            <span className="text-gray-400 text-sm">{itemsProcessed}/10 items</span>
                        </div>
                    </div>
                    <button
                        onClick={toggleMute}
                        className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl p-2 hover:bg-[#1a1a1a] transition-colors"
                    >
                        {isMuted ? <VolumeX className="h-5 w-5 text-gray-400" /> : <Volume2 className="h-5 w-5 text-emerald-400" />}
                    </button>
                </div>

                {/* Current Item */}
                {currentItem && (
                    <div className="bg-[#0f0f0f] rounded-2xl border border-[#1a1a1a] p-8 mb-6 text-center">
                        <p className="text-gray-400 mb-4">Sort this item:</p>
                        <div className="text-8xl mb-4">{currentItem.emoji}</div>
                        <h2 className="text-3xl font-bold text-white mb-2">{currentItem.name}</h2>
                        <p className="text-gray-400">Click the correct bin below</p>
                    </div>
                )}

                {/* Bins */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                    {bins.map((bin) => (
                        <button
                            key={bin.type}
                            onClick={() => handleSort(bin.type)}
                            onMouseEnter={() => setDraggedOver(bin.type)}
                            onMouseLeave={() => setDraggedOver(null)}
                            disabled={showFeedback}
                            className={`bg-gradient-to-br ${bin.color} rounded-2xl p-6 text-white transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${draggedOver === bin.type ? 'scale-105 ring-4 ring-white/50' : ''
                                }`}
                        >
                            <div className="text-5xl mb-2">{bin.emoji}</div>
                            <p className="font-bold">{bin.name}</p>
                        </button>
                    ))}
                </div>

                {/* Feedback */}
                {showFeedback && currentItem && (
                    <div className={`rounded-2xl border p-6 ${isCorrect ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                        <p className={`font-bold text-lg mb-2 ${isCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
                            {feedbackMessage}
                        </p>
                        <p className="text-gray-300 text-sm">{currentItem.fact}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
