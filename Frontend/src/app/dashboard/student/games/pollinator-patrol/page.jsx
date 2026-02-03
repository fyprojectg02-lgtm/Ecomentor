"use client";
import { useState, useEffect } from "react";
import { Flower2, Trophy, Heart, Volume2, VolumeX, Home, Sparkles } from "lucide-react";
import audioManager from "@/lib/AudioManager";

const pollinators = [
    { id: 1, emoji: "🐝", name: "Bee", type: "bee", fact: "Bees pollinate 80% of flowering plants worldwide!" },
    { id: 2, emoji: "🦋", name: "Butterfly", type: "butterfly", fact: "Butterflies can see colors humans can't, including ultraviolet!" },
    { id: 3, emoji: "🐦", name: "Hummingbird", type: "bird", fact: "Hummingbirds can visit up to 2,000 flowers per day!" },
];

const flowers = [
    { id: 1, emoji: "🌻", name: "Sunflower", type: "bee", color: "yellow" },
    { id: 2, emoji: "🌺", name: "Hibiscus", type: "butterfly", color: "red" },
    { id: 3, emoji: "🌸", name: "Cherry Blossom", type: "bird", color: "pink" },
    { id: 4, emoji: "🌼", name: "Daisy", type: "bee", color: "white" },
    { id: 5, emoji: "🌷", name: "Tulip", type: "butterfly", color: "red" },
    { id: 6, emoji: "🏵️", name: "Rosette", type: "bird", color: "pink" },
];

export default function PollinatorPatrolGame() {
    const [gameActive, setGameActive] = useState(false);
    const [score, setScore] = useState(0);
    const [level, setLevel] = useState(1);
    const [currentFlowers, setCurrentFlowers] = useState([]);
    const [selectedPollinator, setSelectedPollinator] = useState(null);
    const [matches, setMatches] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [gameComplete, setGameComplete] = useState(false);
    const [showFact, setShowFact] = useState(null);
    const [gardenGrowth, setGardenGrowth] = useState(0);

    useEffect(() => {
        if (gameActive && currentFlowers.length === 0) {
            if (level > 5) {
                endGame();
            } else {
                generateFlowers();
            }
        }
    }, [currentFlowers, gameActive, level]);

    const generateFlowers = () => {
        const numFlowers = 3 + level;
        const newFlowers = [];
        for (let i = 0; i < numFlowers; i++) {
            const flower = flowers[Math.floor(Math.random() * flowers.length)];
            newFlowers.push({
                ...flower,
                uniqueId: Date.now() + i,
                position: i
            });
        }
        setCurrentFlowers(newFlowers);
    };

    const startGame = () => {
        audioManager.play('click');
        setGameActive(true);
        setScore(0);
        setLevel(1);
        setMatches(0);
        setGameComplete(false);
        setGardenGrowth(0);
        generateFlowers();
    };

    const selectPollinator = (pollinator) => {
        audioManager.play('click');
        setSelectedPollinator(pollinator);
    };

    const matchFlower = (flower) => {
        if (!selectedPollinator) {
            audioManager.play('warning');
            return;
        }

        if (selectedPollinator.type === flower.type) {
            // Correct match!
            audioManager.play('bloom');
            setTimeout(() => audioManager.play(selectedPollinator.type === 'bee' ? 'buzz' : 'correct'), 100);

            const points = 15 * level;
            setScore(prev => prev + points);
            setMatches(prev => prev + 1);
            setGardenGrowth(prev => Math.min(prev + 10, 100));
            setShowFact(selectedPollinator.fact);

            setCurrentFlowers(prev => prev.filter(f => f.uniqueId !== flower.uniqueId));
            setSelectedPollinator(null);

            setTimeout(() => setShowFact(null), 3000);
        } else {
            // Wrong match
            audioManager.play('incorrect');
            setSelectedPollinator(null);
        }
    };

    const nextLevel = () => {
        audioManager.play('achievement');
        setLevel(prev => prev + 1);
        generateFlowers();
    };

    const endGame = () => {
        audioManager.play('success');
        setGameActive(false);
        setGameComplete(true);
    };

    const toggleMute = () => {
        audioManager.toggleMute();
        setIsMuted(!isMuted);
    };

    if (!gameActive && !gameComplete) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-pink-900 to-purple-900 p-6">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center justify-between mb-8">
                        <h1 className="text-4xl font-bold text-white flex items-center gap-3">
                            🐝 Pollinator Patrol
                        </h1>
                        <a href="/dashboard/student/games" className="text-pink-200 hover:text-white flex items-center gap-2">
                            <Home className="h-5 w-5" />
                            Back to Games
                        </a>
                    </div>

                    <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8 mb-6">
                        <h2 className="text-2xl font-bold text-white mb-4">How to Play</h2>
                        <ul className="text-white/90 space-y-2 mb-6">
                            <li>• Select a pollinator (bee, butterfly, or hummingbird)</li>
                            <li>• Click on the matching flower for that pollinator</li>
                            <li>• Each correct match grows your garden</li>
                            <li>• Learn fascinating facts about pollinators</li>
                            <li>• Complete 5 levels to finish the game</li>
                        </ul>
                    </div>

                    <button
                        onClick={startGame}
                        className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-400 hover:to-purple-400 text-white text-2xl font-bold py-6 rounded-2xl transition-all transform hover:scale-105"
                    >
                        🌸 Start Garden Mission
                    </button>
                </div>
            </div>
        );
    }

    if (gameComplete) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-pink-900 to-purple-900 p-6">
                <div className="max-w-2xl mx-auto">
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-pink-500/30 p-8 text-center">
                        <Flower2 className="h-20 w-20 text-pink-400 mx-auto mb-4" />
                        <h2 className="text-4xl font-bold text-white mb-4">Garden Complete! 🌺</h2>
                        <div className="text-6xl font-bold text-pink-400 mb-2">{score}</div>
                        <p className="text-white/80 mb-6">Total Points Earned</p>

                        <div className="bg-white/5 rounded-xl p-6 mb-6">
                            <div className="grid grid-cols-2 gap-4 text-left">
                                <div>
                                    <p className="text-white/60 text-sm">Successful Matches</p>
                                    <p className="text-2xl font-bold text-white">{matches}</p>
                                </div>
                                <div>
                                    <p className="text-white/60 text-sm">Levels Completed</p>
                                    <p className="text-2xl font-bold text-white">{level - 1}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={startGame}
                                className="flex-1 bg-pink-500 hover:bg-pink-400 text-white font-bold py-3 rounded-xl transition-colors"
                            >
                                Play Again
                            </button>
                            <a
                                href="/dashboard/student/games"
                                className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center"
                            >
                                Back to Games
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-pink-900 to-purple-900 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 flex items-center gap-2">
                            <Trophy className="h-5 w-5 text-yellow-400" />
                            <span className="text-white font-bold">{score}</span>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-pink-400" />
                            <span className="text-white font-bold">Level {level}</span>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 flex items-center gap-2">
                            <Heart className="h-5 w-5 text-red-400" />
                            <span className="text-white font-bold">{matches} matches</span>
                        </div>
                    </div>
                    <button
                        onClick={toggleMute}
                        className="bg-white/10 backdrop-blur-sm rounded-xl p-2 hover:bg-white/20 transition-colors"
                    >
                        {isMuted ? <VolumeX className="h-5 w-5 text-white/60" /> : <Volume2 className="h-5 w-5 text-white" />}
                    </button>
                </div>

                {/* Garden Growth Bar */}
                <div className="mb-4 bg-white/10 backdrop-blur-sm rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-white text-sm font-semibold">Garden Growth</span>
                        <span className="text-pink-400 text-sm font-bold">{gardenGrowth}%</span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-3">
                        <div
                            className="bg-gradient-to-r from-pink-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${gardenGrowth}%` }}
                        />
                    </div>
                </div>

                {/* Pollinator Selection */}
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6 mb-4">
                    <h3 className="text-white font-bold mb-4">Select a Pollinator:</h3>
                    <div className="grid grid-cols-3 gap-4">
                        {pollinators.map(pollinator => (
                            <button
                                key={pollinator.id}
                                onClick={() => selectPollinator(pollinator)}
                                className={`${selectedPollinator?.id === pollinator.id ? 'bg-pink-500/40 border-pink-400' : 'bg-white/10 border-white/20'} border-2 rounded-xl p-4 transition-all hover:scale-105`}
                            >
                                <div className="text-5xl mb-2">{pollinator.emoji}</div>
                                <p className="text-white font-semibold">{pollinator.name}</p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Flower Garden */}
                <div className="bg-gradient-to-b from-green-600/30 to-green-900/30 backdrop-blur-sm rounded-2xl border-4 border-white/20 p-8 min-h-[300px]">
                    <h3 className="text-white font-bold mb-4 text-center">
                        {selectedPollinator ? `Click the ${selectedPollinator.name}'s favorite flowers!` : "Select a pollinator first"}
                    </h3>
                    <div className="grid grid-cols-3 md:grid-cols-4 gap-6">
                        {currentFlowers.map(flower => (
                            <button
                                key={flower.uniqueId}
                                onClick={() => matchFlower(flower)}
                                className="bg-white/10 hover:bg-white/20 rounded-xl p-4 transition-all hover:scale-110"
                                disabled={!selectedPollinator}
                            >
                                <div className="text-6xl">{flower.emoji}</div>
                                <p className="text-white text-sm mt-2">{flower.name}</p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Fact Display */}
                {showFact && (
                    <div className="mt-4 bg-emerald-500/20 backdrop-blur-sm border border-emerald-500/30 rounded-xl p-4 animate-pulse">
                        <p className="text-white text-center font-semibold">💡 {showFact}</p>
                    </div>
                )}

                {/* Level Complete */}
                {currentFlowers.length === 0 && gameActive && level <= 5 && (
                    <div className="mt-4 text-center">
                        <button
                            onClick={nextLevel}
                            className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-400 hover:to-purple-400 text-white font-bold px-8 py-4 rounded-xl transition-all"
                        >
                            Next Level →
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
