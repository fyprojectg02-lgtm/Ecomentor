"use client";
import { useState, useEffect } from "react";
import { Trophy, Home, Volume2, VolumeX, Zap, Clock, Lightbulb } from "lucide-react";
import audioManager from "@/lib/AudioManager";

const appliances = [
    { id: 1, name: "Lamp", emoji: "💡", energy: 60, on: true },
    { id: 2, name: "TV", emoji: "📺", energy: 150, on: true },
    { id: 3, name: "Computer", emoji: "💻", energy: 200, on: true },
    { id: 4, name: "Fan", emoji: "🌀", energy: 75, on: true },
    { id: 5, name: "AC", emoji: "❄️", energy: 1500, on: true },
    { id: 6, name: "Heater", emoji: "🔥", energy: 1200, on: true },
    { id: 7, name: "Microwave", emoji: "📟", energy: 1000, on: false },
    { id: 8, name: "Fridge", emoji: "🧊", energy: 150, on: true },
    { id: 9, name: "Charger", emoji: "🔌", energy: 20, on: true },
    { id: 10, name: "Stereo", emoji: "🔊", energy: 100, on: true }
];

const tips = [
    "💡 LED bulbs use 75% less energy than incandescent bulbs!",
    "❄️ Setting AC 2°F higher can save 10% on cooling costs!",
    "🔌 Unplug chargers when not in use - they draw 'phantom power'!",
    "💻 Enable power-saving mode on computers and monitors!",
    "📺 Turn off devices instead of leaving them on standby!",
    "🌀 Use fans instead of AC when possible - they use 98% less energy!",
    "🔥 Lower your thermostat by 1°C to save 10% on heating!",
    "🧊 Keep fridge coils clean for optimal efficiency!",
    "💡 Natural light is free - open curtains during the day!",
    "⚡ Energy-efficient appliances can cut your bill by 30%!"
];

export default function EnergySaverGame() {
    const [gameStarted, setGameStarted] = useState(false);
    const [timeLeft, setTimeLeft] = useState(60);
    const [score, setScore] = useState(0);
    const [energySaved, setEnergySaved] = useState(0);
    const [applianceStates, setApplianceStates] = useState(appliances);
    const [currentTip, setCurrentTip] = useState("");
    const [isMuted, setIsMuted] = useState(false);
    const [gameComplete, setGameComplete] = useState(false);
    const [combo, setCombo] = useState(0);
    const [showCombo, setShowCombo] = useState(false);

    useEffect(() => {
        if (gameStarted && timeLeft > 0) {
            const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
            return () => clearTimeout(timer);
        } else if (timeLeft === 0 && gameStarted) {
            endGame();
        }
    }, [timeLeft, gameStarted]);

    useEffect(() => {
        if (gameStarted) {
            const tipInterval = setInterval(() => {
                setCurrentTip(tips[Math.floor(Math.random() * tips.length)]);
            }, 8000);
            return () => clearInterval(tipInterval);
        }
    }, [gameStarted]);

    const startGame = () => {
        audioManager.play('click');
        setGameStarted(true);
        setTimeLeft(60);
        setScore(0);
        setEnergySaved(0);
        setCombo(0);
        setGameComplete(false);
        setApplianceStates(appliances.map(a => ({ ...a, on: Math.random() > 0.3 })));
        setCurrentTip(tips[Math.floor(Math.random() * tips.length)]);
    };

    const toggleAppliance = (id) => {
        const appliance = applianceStates.find(a => a.id === id);
        if (!appliance) return;

        const newStates = applianceStates.map(a => {
            if (a.id === id) {
                return { ...a, on: !a.on };
            }
            return a;
        });

        setApplianceStates(newStates);

        if (appliance.on) {
            // Turning off - good!
            audioManager.play('correct');
            const points = Math.ceil(appliance.energy / 10);
            const newCombo = combo + 1;
            const comboBonus = Math.floor(newCombo / 3) * 5;
            setScore(score + points + comboBonus);
            setEnergySaved(energySaved + appliance.energy);
            setCombo(newCombo);

            if (newCombo > 0 && newCombo % 3 === 0) {
                setShowCombo(true);
                setTimeout(() => setShowCombo(false), 1000);
            }
        } else {
            // Turning on - bad!
            audioManager.play('incorrect');
            setScore(Math.max(0, score - Math.ceil(appliance.energy / 20)));
            setEnergySaved(Math.max(0, energySaved - appliance.energy));
            setCombo(0);
        }
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

    const getCurrentEnergyUsage = () => {
        return applianceStates.reduce((total, a) => total + (a.on ? a.energy : 0), 0);
    };

    if (!gameStarted && !gameComplete) {
        return (
            <div className="min-h-screen bg-black p-6">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center justify-between mb-8">
                        <h1 className="text-4xl font-bold text-white flex items-center gap-3">
                            ⚡ Energy Saver Challenge
                        </h1>
                        <a href="/dashboard/student?tab=home" className="text-emerald-400 hover:text-emerald-300 flex items-center gap-2">
                            <Home className="h-5 w-5" />
                            Back to Dashboard
                        </a>
                    </div>

                    <div className="bg-[#0f0f0f] rounded-2xl border border-[#1a1a1a] p-8 mb-6">
                        <h2 className="text-2xl font-bold text-white mb-4">How to Play</h2>
                        <ul className="text-gray-300 space-y-2 mb-6">
                            <li>• Turn off appliances to save energy before time runs out</li>
                            <li>• Higher energy appliances give more points</li>
                            <li>• Build combos by turning off multiple devices in a row</li>
                            <li>• Avoid turning devices back on - it costs points!</li>
                            <li>• Learn energy-saving tips while you play</li>
                        </ul>
                    </div>

                    <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl p-12 text-center">
                        <div className="text-8xl mb-6">⚡</div>
                        <h2 className="text-3xl font-bold text-white mb-4">Save Energy, Save the Planet!</h2>
                        <p className="text-yellow-100 mb-8">Turn off appliances and reduce energy waste!</p>
                        <button
                            onClick={startGame}
                            className="bg-white hover:bg-yellow-50 text-orange-600 font-bold text-xl px-12 py-4 rounded-xl transition-all transform hover:scale-105"
                        >
                            Start Saving
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (gameComplete) {
        const efficiency = Math.round((energySaved / 3500) * 100); // Max possible ~3500W

        return (
            <div className="min-h-screen bg-black p-6">
                <div className="max-w-2xl mx-auto">
                    <div className="bg-gradient-to-br from-[#0f0f0f] to-[#1a1a1a] rounded-2xl border border-yellow-500/30 p-8 text-center">
                        <Zap className="h-20 w-20 text-yellow-400 mx-auto mb-4" />
                        <h2 className="text-4xl font-bold text-white mb-4">Time's Up! ⚡</h2>
                        <div className="text-6xl font-bold text-yellow-400 mb-2">{score}</div>
                        <p className="text-gray-400 mb-6">Total Points Earned</p>

                        <div className="bg-[#0a0a0a] rounded-xl p-6 mb-6">
                            <div className="grid grid-cols-2 gap-4 text-left">
                                <div>
                                    <p className="text-gray-400 text-sm">Energy Saved</p>
                                    <p className="text-2xl font-bold text-white">{energySaved}W</p>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-sm">Efficiency</p>
                                    <p className="text-2xl font-bold text-white">{efficiency}%</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6">
                            <p className="text-yellow-300 text-sm">
                                💡 If everyone saved this much energy daily, we'd reduce CO₂ emissions by millions of tons!
                            </p>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={startGame}
                                className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 rounded-xl transition-colors"
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

    const currentUsage = getCurrentEnergyUsage();
    const maxUsage = appliances.reduce((total, a) => total + a.energy, 0);

    return (
        <div className="min-h-screen bg-black p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl px-4 py-2 flex items-center gap-2">
                            <Trophy className="h-5 w-5 text-yellow-400" />
                            <span className="text-white font-bold">{score}</span>
                        </div>
                        <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl px-4 py-2 flex items-center gap-2">
                            <Clock className={`h-5 w-5 ${timeLeft < 10 ? 'text-red-400' : 'text-blue-400'}`} />
                            <span className={`font-bold ${timeLeft < 10 ? 'text-red-400' : 'text-white'}`}>{timeLeft}s</span>
                        </div>
                        <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl px-4 py-2 flex items-center gap-2">
                            <Zap className="h-5 w-5 text-yellow-400" />
                            <span className="text-white font-bold">{energySaved}W saved</span>
                        </div>
                    </div>
                    <button
                        onClick={toggleMute}
                        className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl p-2 hover:bg-[#1a1a1a] transition-colors"
                    >
                        {isMuted ? <VolumeX className="h-5 w-5 text-gray-400" /> : <Volume2 className="h-5 w-5 text-yellow-400" />}
                    </button>
                </div>

                {/* Energy Meter */}
                <div className="bg-[#0f0f0f] rounded-2xl border border-[#1a1a1a] p-6 mb-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-400 text-sm">Current Energy Usage</span>
                        <span className={`font-bold ${currentUsage > maxUsage * 0.5 ? 'text-red-400' : currentUsage > maxUsage * 0.25 ? 'text-yellow-400' : 'text-emerald-400'}`}>
                            {currentUsage}W / {maxUsage}W
                        </span>
                    </div>
                    <div className="w-full bg-[#1a1a1a] rounded-full h-4">
                        <div
                            className={`h-4 rounded-full transition-all ${currentUsage > maxUsage * 0.5 ? 'bg-red-400' : currentUsage > maxUsage * 0.25 ? 'bg-yellow-400' : 'bg-emerald-400'}`}
                            style={{ width: `${(currentUsage / maxUsage) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Combo Display */}
                {showCombo && (
                    <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
                        <div className="bg-yellow-500 text-black font-bold text-4xl px-8 py-4 rounded-2xl animate-bounce">
                            🔥 {combo} COMBO!
                        </div>
                    </div>
                )}

                {/* Appliances Grid */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                    {applianceStates.map((appliance) => (
                        <button
                            key={appliance.id}
                            onClick={() => toggleAppliance(appliance.id)}
                            className={`rounded-2xl p-6 transition-all transform hover:scale-105 ${appliance.on
                                    ? 'bg-gradient-to-br from-yellow-500 to-orange-500 shadow-lg shadow-yellow-500/50'
                                    : 'bg-[#1a1a1a] border border-[#2a2a2a]'
                                }`}
                        >
                            <div className={`text-5xl mb-2 ${appliance.on ? 'animate-pulse' : 'opacity-50'}`}>
                                {appliance.emoji}
                            </div>
                            <p className={`font-bold text-sm ${appliance.on ? 'text-white' : 'text-gray-500'}`}>
                                {appliance.name}
                            </p>
                            <p className={`text-xs ${appliance.on ? 'text-yellow-100' : 'text-gray-600'}`}>
                                {appliance.energy}W
                            </p>
                        </button>
                    ))}
                </div>

                {/* Energy Tip */}
                {currentTip && (
                    <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-2xl p-4">
                        <div className="flex items-center gap-3">
                            <Lightbulb className="h-6 w-6 text-yellow-400 flex-shrink-0" />
                            <p className="text-gray-300 text-sm">{currentTip}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
