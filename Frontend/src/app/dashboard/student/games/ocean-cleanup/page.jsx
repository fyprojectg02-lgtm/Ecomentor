"use client";
import { useState, useEffect, useRef } from "react";
import { Waves, Trophy, Clock, Volume2, VolumeX, Home, Zap } from "lucide-react";
import audioManager from "@/lib/AudioManager";

const trashTypes = [
    { id: 1, emoji: "🍾", name: "Plastic Bottle", points: 10, speed: 2, fact: "Plastic bottles take 450+ years to decompose in the ocean." },
    { id: 2, emoji: "🛍️", name: "Plastic Bag", points: 15, speed: 2.5, fact: "Plastic bags are often mistaken for jellyfish by sea turtles." },
    { id: 3, emoji: "🥫", name: "Aluminum Can", points: 12, speed: 1.8, fact: "Recycling one aluminum can saves enough energy to power a TV for 3 hours." },
    { id: 4, emoji: "🎣", name: "Fishing Net", points: 25, speed: 1.5, fact: "Ghost fishing nets kill over 100,000 marine animals annually." },
    { id: 5, emoji: "🧴", name: "Shampoo Bottle", points: 10, speed: 2.2, fact: "Most shampoo bottles are made from recyclable plastic." },
    { id: 6, emoji: "🥤", name: "Plastic Cup", points: 8, speed: 2.8, fact: "Americans use 500 million plastic straws daily." },
    { id: 7, emoji: "🍴", name: "Plastic Utensils", points: 10, speed: 2.5, fact: "Plastic utensils are used for minutes but last for centuries." },
    { id: 8, emoji: "🎈", name: "Balloon", points: 20, speed: 3, fact: "Balloons are one of the deadliest forms of marine debris." },
];

export default function OceanCleanupGame() {
    const [gameActive, setGameActive] = useState(false);
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(60);
    const [trashItems, setTrashItems] = useState([]);
    const [combo, setCombo] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [gameComplete, setGameComplete] = useState(false);
    const [itemsCaught, setItemsCaught] = useState(0);
    const [currentFact, setCurrentFact] = useState("");
    const gameAreaRef = useRef(null);

    // Timer
    useEffect(() => {
        if (gameActive && timeLeft > 0) {
            const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
            return () => clearTimeout(timer);
        } else if (timeLeft === 0 && gameActive) {
            endGame();
        }
    }, [timeLeft, gameActive]);

    // Spawn trash items
    useEffect(() => {
        if (!gameActive) return;

        const spawnInterval = setInterval(() => {
            const randomTrash = trashTypes[Math.floor(Math.random() * trashTypes.length)];
            const newItem = {
                ...randomTrash,
                uniqueId: Date.now() + Math.random(),
                x: Math.random() * 80 + 10, // 10-90% of width
                y: 0,
                caught: false
            };
            setTrashItems(prev => [...prev, newItem]);
        }, 1500);

        return () => clearInterval(spawnInterval);
    }, [gameActive]);

    // Move trash items down
    useEffect(() => {
        if (!gameActive) return;

        const moveInterval = setInterval(() => {
            setTrashItems(prev =>
                prev
                    .map(item => ({ ...item, y: item.y + item.speed }))
                    .filter(item => item.y < 100 && !item.caught)
            );
        }, 50);

        return () => clearInterval(moveInterval);
    }, [gameActive]);

    const startGame = () => {
        audioManager.play('click');
        audioManager.playAmbient('ocean');
        setGameActive(true);
        setScore(0);
        setTimeLeft(60);
        setTrashItems([]);
        setCombo(0);
        setGameComplete(false);
        setItemsCaught(0);
        setCurrentFact("");
    };

    const catchTrash = (item) => {
        audioManager.play('splash');

        const newCombo = combo + 1;
        const comboMultiplier = Math.floor(newCombo / 3) + 1;
        const points = item.points * comboMultiplier;

        setScore(prev => prev + points);
        setCombo(newCombo);
        setItemsCaught(prev => prev + 1);
        setCurrentFact(item.fact);

        if (newCombo % 3 === 0) {
            audioManager.play('combo');
        }

        setTrashItems(prev => prev.filter(t => t.uniqueId !== item.uniqueId));

        setTimeout(() => setCurrentFact(""), 3000);
    };

    const endGame = () => {
        audioManager.play('success');
        audioManager.stopAmbient();
        setGameActive(false);
        setGameComplete(true);
    };

    const toggleMute = () => {
        audioManager.toggleMute();
        setIsMuted(!isMuted);
    };

    if (!gameActive && !gameComplete) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-blue-900 to-blue-600 p-6">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center justify-between mb-8">
                        <h1 className="text-4xl font-bold text-white flex items-center gap-3">
                            🌊 Ocean Cleanup Challenge
                        </h1>
                        <a href="/dashboard/student/games" className="text-blue-200 hover:text-white flex items-center gap-2">
                            <Home className="h-5 w-5" />
                            Back to Games
                        </a>
                    </div>

                    <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8 mb-6">
                        <h2 className="text-2xl font-bold text-white mb-4">How to Play</h2>
                        <ul className="text-white/90 space-y-2 mb-6">
                            <li>• Click on floating trash to clean the ocean</li>
                            <li>• Different trash types have different point values</li>
                            <li>• Build combos for multiplier bonuses</li>
                            <li>• Learn ocean facts as you play</li>
                            <li>• Clean as much as you can in 60 seconds!</li>
                        </ul>
                    </div>

                    <button
                        onClick={startGame}
                        className="w-full bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-400 hover:to-blue-400 text-white text-2xl font-bold py-6 rounded-2xl transition-all transform hover:scale-105"
                    >
                        🌊 Start Cleanup Mission
                    </button>
                </div>
            </div>
        );
    }

    if (gameComplete) {
        const efficiency = Math.round((itemsCaught / (itemsCaught + trashItems.length + 10)) * 100);

        return (
            <div className="min-h-screen bg-gradient-to-b from-blue-900 to-blue-600 p-6">
                <div className="max-w-2xl mx-auto">
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-emerald-500/30 p-8 text-center">
                        <Waves className="h-20 w-20 text-emerald-400 mx-auto mb-4" />
                        <h2 className="text-4xl font-bold text-white mb-4">Mission Complete! 🎉</h2>
                        <div className="text-6xl font-bold text-emerald-400 mb-2">{score}</div>
                        <p className="text-white/80 mb-6">Total Points Earned</p>

                        <div className="bg-white/5 rounded-xl p-6 mb-6">
                            <div className="grid grid-cols-3 gap-4 text-left">
                                <div>
                                    <p className="text-white/60 text-sm">Items Caught</p>
                                    <p className="text-2xl font-bold text-white">{itemsCaught}</p>
                                </div>
                                <div>
                                    <p className="text-white/60 text-sm">Max Combo</p>
                                    <p className="text-2xl font-bold text-white">{combo}</p>
                                </div>
                                <div>
                                    <p className="text-white/60 text-sm">Efficiency</p>
                                    <p className="text-2xl font-bold text-white">{efficiency}%</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={startGame}
                                className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3 rounded-xl transition-colors"
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
        <div className="min-h-screen bg-gradient-to-b from-blue-900 to-blue-600 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 flex items-center gap-2">
                            <Trophy className="h-5 w-5 text-yellow-400" />
                            <span className="text-white font-bold">{score}</span>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 flex items-center gap-2">
                            <Clock className={`h-5 w-5 ${timeLeft < 10 ? 'text-red-400' : 'text-blue-300'}`} />
                            <span className={`font-bold ${timeLeft < 10 ? 'text-red-400' : 'text-white'}`}>{timeLeft}s</span>
                        </div>
                        {combo > 0 && (
                            <div className="bg-emerald-500/20 backdrop-blur-sm rounded-xl px-4 py-2 flex items-center gap-2 animate-pulse">
                                <Zap className="h-5 w-5 text-emerald-400" />
                                <span className="text-emerald-400 font-bold">Combo x{Math.floor(combo / 3) + 1}</span>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={toggleMute}
                        className="bg-white/10 backdrop-blur-sm rounded-xl p-2 hover:bg-white/20 transition-colors"
                    >
                        {isMuted ? <VolumeX className="h-5 w-5 text-white/60" /> : <Volume2 className="h-5 w-5 text-white" />}
                    </button>
                </div>

                {/* Game Area */}
                <div
                    ref={gameAreaRef}
                    className="relative bg-gradient-to-b from-blue-400/30 to-blue-800/30 backdrop-blur-sm rounded-2xl border-4 border-white/20 overflow-hidden"
                    style={{ height: '500px' }}
                >
                    {/* Ocean waves decoration */}
                    <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-blue-900/50 to-transparent pointer-events-none" />

                    {/* Trash items */}
                    {trashItems.map(item => (
                        <button
                            key={item.uniqueId}
                            onClick={() => catchTrash(item)}
                            className="absolute text-4xl transition-transform hover:scale-125 cursor-pointer"
                            style={{
                                left: `${item.x}%`,
                                top: `${item.y}%`,
                                transform: 'translate(-50%, -50%)'
                            }}
                        >
                            {item.emoji}
                        </button>
                    ))}
                </div>

                {/* Current Fact */}
                {currentFact && (
                    <div className="mt-4 bg-emerald-500/20 backdrop-blur-sm border border-emerald-500/30 rounded-xl p-4">
                        <p className="text-white text-center font-semibold">💡 {currentFact}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
