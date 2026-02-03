"use client";
import { useState, useEffect } from "react";
import { TreePine, Trophy, Droplet, Sun, Volume2, VolumeX, Home, TrendingUp } from "lucide-react";
import audioManager from "@/lib/AudioManager";

const treeTypes = [
    { id: 1, emoji: "🌲", name: "Pine", co2: 22, water: 2, sunlight: 3, growTime: 3, biome: "temperate" },
    { id: 2, emoji: "🌳", name: "Oak", co2: 28, water: 3, sunlight: 4, growTime: 4, biome: "temperate" },
    { id: 3, emoji: "🌴", name: "Palm", co2: 15, water: 4, sunlight: 5, growTime: 2, biome: "tropical" },
    { id: 4, emoji: "🎋", name: "Bamboo", co2: 35, water: 3, sunlight: 3, growTime: 1, biome: "tropical" },
    { id: 5, emoji: "🌲", name: "Spruce", co2: 20, water: 2, sunlight: 2, growTime: 3, biome: "boreal" },
];

const biomes = [
    { id: "temperate", name: "Temperate Forest", color: "from-green-600 to-green-800", emoji: "🌲" },
    { id: "tropical", name: "Tropical Rainforest", color: "from-emerald-500 to-green-700", emoji: "🌴" },
    { id: "boreal", name: "Boreal Forest", color: "from-teal-600 to-blue-800", emoji: "🌲" },
];

export default function TreePlantingGame() {
    const [selectedBiome, setSelectedBiome] = useState(null);
    const [gameActive, setGameActive] = useState(false);
    const [resources, setResources] = useState({ water: 10, sunlight: 10 });
    const [plantedTrees, setPlantedTrees] = useState([]);
    const [score, setScore] = useState(0);
    const [co2Absorbed, setCo2Absorbed] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [gameComplete, setGameComplete] = useState(false);
    const [timeLeft, setTimeLeft] = useState(120);

    // Timer
    useEffect(() => {
        if (gameActive && timeLeft > 0) {
            const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
            return () => clearTimeout(timer);
        } else if (timeLeft === 0 && gameActive) {
            endGame();
        }
    }, [timeLeft, gameActive]);

    // Resource regeneration
    useEffect(() => {
        if (!gameActive) return;

        const regenInterval = setInterval(() => {
            setResources(prev => ({
                water: Math.min(prev.water + 1, 15),
                sunlight: Math.min(prev.sunlight + 1, 15)
            }));
        }, 3000);

        return () => clearInterval(regenInterval);
    }, [gameActive]);

    // Tree growth
    useEffect(() => {
        if (!gameActive) return;

        const growthInterval = setInterval(() => {
            setPlantedTrees(prev => prev.map(tree => {
                if (tree.stage < 3) {
                    audioManager.play('grow');
                    const newStage = tree.stage + 1;
                    if (newStage === 3) {
                        setCo2Absorbed(c => c + tree.co2);
                        setScore(s => s + tree.co2);
                    }
                    return { ...tree, stage: newStage };
                }
                return tree;
            }));
        }, 2000);

        return () => clearInterval(growthInterval);
    }, [gameActive]);

    const startGame = (biome) => {
        audioManager.play('click');
        audioManager.playAmbient('forest');
        setSelectedBiome(biome);
        setGameActive(true);
        setResources({ water: 10, sunlight: 10 });
        setPlantedTrees([]);
        setScore(0);
        setCo2Absorbed(0);
        setGameComplete(false);
        setTimeLeft(120);
    };

    const plantTree = (treeType) => {
        if (resources.water < treeType.water || resources.sunlight < treeType.sunlight) {
            audioManager.play('warning');
            return;
        }

        audioManager.play('click');
        setResources(prev => ({
            water: prev.water - treeType.water,
            sunlight: prev.sunlight - treeType.sunlight
        }));

        const newTree = {
            ...treeType,
            id: Date.now(),
            stage: 0,
            position: Math.random() * 80 + 10
        };

        setPlantedTrees(prev => [...prev, newTree]);
    };

    const endGame = () => {
        audioManager.play('achievement');
        audioManager.stopAmbient();
        setGameActive(false);
        setGameComplete(true);
    };

    const toggleMute = () => {
        audioManager.toggleMute();
        setIsMuted(!isMuted);
    };

    if (!selectedBiome) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-green-900 to-green-700 p-6">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center justify-between mb-8">
                        <h1 className="text-4xl font-bold text-white flex items-center gap-3">
                            🌲 Tree Planting Simulator
                        </h1>
                        <a href="/dashboard/student/games" className="text-green-200 hover:text-white flex items-center gap-2">
                            <Home className="h-5 w-5" />
                            Back to Games
                        </a>
                    </div>

                    <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8 mb-6">
                        <h2 className="text-2xl font-bold text-white mb-4">How to Play</h2>
                        <ul className="text-white/90 space-y-2 mb-6">
                            <li>• Choose a biome to start your forest</li>
                            <li>• Plant trees using water and sunlight resources</li>
                            <li>• Watch your trees grow through 3 stages</li>
                            <li>• Mature trees absorb CO₂ and earn points</li>
                            <li>• Resources regenerate over time</li>
                        </ul>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {biomes.map(biome => (
                            <button
                                key={biome.id}
                                onClick={() => startGame(biome.id)}
                                className={`bg-gradient-to-br ${biome.color} hover:scale-105 text-white rounded-2xl p-8 transition-all`}
                            >
                                <div className="text-6xl mb-4">{biome.emoji}</div>
                                <h3 className="text-2xl font-bold">{biome.name}</h3>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (gameComplete) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-green-900 to-green-700 p-6">
                <div className="max-w-2xl mx-auto">
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-emerald-500/30 p-8 text-center">
                        <TreePine className="h-20 w-20 text-emerald-400 mx-auto mb-4" />
                        <h2 className="text-4xl font-bold text-white mb-4">Forest Complete! 🌳</h2>
                        <div className="text-6xl font-bold text-emerald-400 mb-2">{score}</div>
                        <p className="text-white/80 mb-6">Total Points Earned</p>

                        <div className="bg-white/5 rounded-xl p-6 mb-6">
                            <div className="grid grid-cols-2 gap-4 text-left">
                                <div>
                                    <p className="text-white/60 text-sm">Trees Planted</p>
                                    <p className="text-2xl font-bold text-white">{plantedTrees.length}</p>
                                </div>
                                <div>
                                    <p className="text-white/60 text-sm">CO₂ Absorbed</p>
                                    <p className="text-2xl font-bold text-white">{co2Absorbed} kg</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => setSelectedBiome(null)}
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

    const availableTrees = treeTypes.filter(t => t.biome === selectedBiome);

    return (
        <div className="min-h-screen bg-gradient-to-b from-green-900 to-green-700 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 flex items-center gap-2">
                            <Trophy className="h-5 w-5 text-yellow-400" />
                            <span className="text-white font-bold">{score}</span>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 flex items-center gap-2">
                            <Droplet className="h-5 w-5 text-blue-400" />
                            <span className="text-white font-bold">{resources.water}</span>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 flex items-center gap-2">
                            <Sun className="h-5 w-5 text-yellow-400" />
                            <span className="text-white font-bold">{resources.sunlight}</span>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-emerald-400" />
                            <span className="text-emerald-400 font-bold">{co2Absorbed} kg CO₂</span>
                        </div>
                    </div>
                    <button
                        onClick={toggleMute}
                        className="bg-white/10 backdrop-blur-sm rounded-xl p-2 hover:bg-white/20 transition-colors"
                    >
                        {isMuted ? <VolumeX className="h-5 w-5 text-white/60" /> : <Volume2 className="h-5 w-5 text-white" />}
                    </button>
                </div>

                {/* Forest Area */}
                <div className="bg-gradient-to-b from-green-600/30 to-green-900/50 backdrop-blur-sm rounded-2xl border-4 border-white/20 p-8 mb-4" style={{ minHeight: '400px' }}>
                    <div className="relative h-full flex items-end justify-around">
                        {plantedTrees.map(tree => (
                            <div
                                key={tree.id}
                                className="transition-all duration-500"
                                style={{
                                    fontSize: tree.stage === 0 ? '24px' : tree.stage === 1 ? '48px' : tree.stage === 2 ? '64px' : '80px',
                                    opacity: tree.stage === 3 ? 1 : 0.7
                                }}
                            >
                                {tree.emoji}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Tree Selection */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {availableTrees.map(tree => {
                        const canPlant = resources.water >= tree.water && resources.sunlight >= tree.sunlight;
                        return (
                            <button
                                key={tree.id}
                                onClick={() => plantTree(tree)}
                                disabled={!canPlant}
                                className={`${canPlant ? 'bg-emerald-500/20 hover:bg-emerald-500/30' : 'bg-gray-500/20'} backdrop-blur-sm border border-white/20 rounded-xl p-4 transition-all ${canPlant ? 'hover:scale-105' : 'opacity-50 cursor-not-allowed'}`}
                            >
                                <div className="text-4xl mb-2">{tree.emoji}</div>
                                <p className="text-white font-bold text-sm">{tree.name}</p>
                                <div className="flex gap-2 justify-center mt-2 text-xs text-white/80">
                                    <span>💧{tree.water}</span>
                                    <span>☀️{tree.sunlight}</span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
