"use client";
import { useState } from "react";
import { Home, Volume2, VolumeX, Leaf, TrendingDown, TrendingUp } from "lucide-react";
import audioManager from "@/lib/AudioManager";

const scenarios = [
    {
        id: 1,
        title: "Morning Commute",
        description: "How will you get to work today?",
        emoji: "🚗",
        choices: [
            { text: "Drive alone", carbon: 5.2, tip: "Carpooling or public transit can reduce emissions by 50%!" },
            { text: "Carpool", carbon: 2.6, tip: "Great choice! Sharing rides cuts emissions in half." },
            { text: "Public transit", carbon: 1.5, tip: "Excellent! Public transit is much more efficient." },
            { text: "Bike/Walk", carbon: 0, tip: "Perfect! Zero emissions and great exercise!" }
        ]
    },
    {
        id: 2,
        title: "Lunch Decision",
        description: "What's for lunch today?",
        emoji: "🍽️",
        choices: [
            { text: "Beef burger", carbon: 3.3, tip: "Beef has the highest carbon footprint of common foods." },
            { text: "Chicken meal", carbon: 1.2, tip: "Poultry has a lower carbon footprint than red meat." },
            { text: "Vegetarian", carbon: 0.5, tip: "Plant-based meals have much lower emissions!" },
            { text: "Vegan salad", carbon: 0.2, tip: "Excellent! Vegan options have the lowest impact." }
        ]
    },
    {
        id: 3,
        title: "Energy at Home",
        description: "How do you power your home?",
        emoji: "⚡",
        choices: [
            { text: "Coal power", carbon: 4.5, tip: "Coal is the most carbon-intensive energy source." },
            { text: "Natural gas", carbon: 2.3, tip: "Better than coal, but still fossil fuel based." },
            { text: "Grid mix", carbon: 1.8, tip: "Most grids include some renewable energy now." },
            { text: "Solar panels", carbon: 0.1, tip: "Amazing! Solar is clean and renewable!" }
        ]
    },
    {
        id: 4,
        title: "Shopping Trip",
        description: "You need groceries. What do you bring?",
        emoji: "🛒",
        choices: [
            { text: "Nothing (use plastic)", carbon: 0.8, tip: "Plastic bags take 500+ years to decompose!" },
            { text: "Paper bags", carbon: 0.4, tip: "Better, but still single-use waste." },
            { text: "Reusable bags", carbon: 0.05, tip: "Perfect! Reusable bags can be used 1000+ times." },
            { text: "Backpack", carbon: 0, tip: "Excellent! Using what you have is the greenest choice." }
        ]
    },
    {
        id: 5,
        title: "Water Usage",
        description: "Time for a shower. How long?",
        emoji: "🚿",
        choices: [
            { text: "20+ minutes", carbon: 2.1, tip: "Long showers waste water and energy for heating." },
            { text: "10-15 minutes", carbon: 1.2, tip: "Average, but could be shorter!" },
            { text: "5-10 minutes", carbon: 0.6, tip: "Good! Shorter showers save water and energy." },
            { text: "Under 5 minutes", carbon: 0.3, tip: "Excellent! You're a water conservation champion!" }
        ]
    },
    {
        id: 6,
        title: "Thermostat Setting",
        description: "What temperature do you set?",
        emoji: "🌡️",
        choices: [
            { text: "Very cold/hot", carbon: 3.8, tip: "Extreme temps use lots of energy for heating/cooling." },
            { text: "Comfortable", carbon: 2.2, tip: "Moderate, but adjusting 2°F can save 10% energy!" },
            { text: "Slightly adjusted", carbon: 1.1, tip: "Great! Small adjustments make big differences." },
            { text: "Natural/Off", carbon: 0.2, tip: "Perfect! Using natural ventilation when possible is best." }
        ]
    },
    {
        id: 7,
        title: "Online Shopping",
        description: "How do you want your package delivered?",
        emoji: "📦",
        choices: [
            { text: "Next day air", carbon: 4.2, tip: "Air freight has the highest carbon footprint!" },
            { text: "2-day shipping", carbon: 2.5, tip: "Fast shipping often means less efficient routes." },
            { text: "Standard shipping", carbon: 0.8, tip: "Good! Slower shipping allows route optimization." },
            { text: "Pick up in store", carbon: 0.3, tip: "Excellent! Combining trips reduces emissions." }
        ]
    },
    {
        id: 8,
        title: "Coffee Break",
        description: "How do you take your coffee?",
        emoji: "☕",
        choices: [
            { text: "Disposable cup", carbon: 0.6, tip: "Disposable cups create waste and use resources." },
            { text: "Styrofoam cup", carbon: 0.9, tip: "Styrofoam is particularly harmful to the environment." },
            { text: "Reusable mug", carbon: 0.05, tip: "Great! Reusable mugs can be used thousands of times." },
            { text: "No coffee", carbon: 0, tip: "Or choose tea! Production has lower carbon impact." }
        ]
    }
];

export default function CarbonFootprintGame() {
    const [gameStarted, setGameStarted] = useState(false);
    const [currentScenario, setCurrentScenario] = useState(0);
    const [totalCarbon, setTotalCarbon] = useState(0);
    const [choices, setChoices] = useState([]);
    const [showFeedback, setShowFeedback] = useState(false);
    const [selectedChoice, setSelectedChoice] = useState(null);
    const [isMuted, setIsMuted] = useState(false);
    const [gameComplete, setGameComplete] = useState(false);

    const startGame = () => {
        audioManager.play('click');
        setGameStarted(true);
        setCurrentScenario(0);
        setTotalCarbon(0);
        setChoices([]);
        setGameComplete(false);
        setShowFeedback(false);
    };

    const handleChoice = (choiceIndex) => {
        if (showFeedback) return;

        const choice = scenarios[currentScenario].choices[choiceIndex];
        setSelectedChoice(choice);
        setShowFeedback(true);
        setTotalCarbon(totalCarbon + choice.carbon);
        setChoices([...choices, { scenario: scenarios[currentScenario].title, choice: choice.text, carbon: choice.carbon }]);

        if (choice.carbon < 1) {
            audioManager.play('correct');
        } else if (choice.carbon > 3) {
            audioManager.play('incorrect');
        } else {
            audioManager.play('click');
        }

        setTimeout(() => {
            if (currentScenario < scenarios.length - 1) {
                setCurrentScenario(currentScenario + 1);
                setShowFeedback(false);
                setSelectedChoice(null);
            } else {
                endGame();
            }
        }, 3000);
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

    const getCarbonRating = (carbon) => {
        if (carbon < 5) return { rating: "Eco Champion! 🌟", color: "text-emerald-400", message: "You're making excellent choices for the planet!" };
        if (carbon < 10) return { rating: "Eco Friendly 🌱", color: "text-green-400", message: "Great job! You're well below average emissions." };
        if (carbon < 15) return { rating: "Room for Improvement 🌿", color: "text-yellow-400", message: "Good start! Small changes can make a big difference." };
        return { rating: "High Impact 🌍", color: "text-orange-400", message: "Consider making greener choices to reduce your footprint." };
    };

    if (!gameStarted && !gameComplete) {
        return (
            <div className="min-h-screen bg-black p-6">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center justify-between mb-8">
                        <h1 className="text-4xl font-bold text-white flex items-center gap-3">
                            🌍 Carbon Footprint Challenge
                        </h1>
                        <a href="/dashboard/student?tab=home" className="text-emerald-400 hover:text-emerald-300 flex items-center gap-2">
                            <Home className="h-5 w-5" />
                            Back to Dashboard
                        </a>
                    </div>

                    <div className="bg-[#0f0f0f] rounded-2xl border border-[#1a1a1a] p-8 mb-6">
                        <h2 className="text-2xl font-bold text-white mb-4">How to Play</h2>
                        <ul className="text-gray-300 space-y-2 mb-6">
                            <li>• Make daily decisions that affect your carbon footprint</li>
                            <li>• See the environmental impact of each choice</li>
                            <li>• Learn tips for reducing your carbon emissions</li>
                            <li>• Try to keep your total carbon footprint as low as possible</li>
                        </ul>
                    </div>

                    <div className="bg-gradient-to-br from-blue-500 to-green-500 rounded-2xl p-12 text-center">
                        <div className="text-8xl mb-6">🌍</div>
                        <h2 className="text-3xl font-bold text-white mb-4">Track Your Impact</h2>
                        <p className="text-blue-100 mb-8">Make choices and see how they affect the planet!</p>
                        <button
                            onClick={startGame}
                            className="bg-white hover:bg-blue-50 text-blue-600 font-bold text-xl px-12 py-4 rounded-xl transition-all transform hover:scale-105"
                        >
                            Start Challenge
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (gameComplete) {
        const rating = getCarbonRating(totalCarbon);
        const avgDailyCarbon = 16; // Average US daily carbon footprint in kg
        const percentageVsAverage = Math.round((totalCarbon / avgDailyCarbon) * 100);

        return (
            <div className="min-h-screen bg-black p-6">
                <div className="max-w-3xl mx-auto">
                    <div className="bg-gradient-to-br from-[#0f0f0f] to-[#1a1a1a] rounded-2xl border border-emerald-500/30 p-8">
                        <div className="text-center mb-8">
                            <Leaf className="h-20 w-20 text-emerald-400 mx-auto mb-4" />
                            <h2 className="text-4xl font-bold text-white mb-4">Day Complete!</h2>
                            <div className="text-6xl font-bold mb-2 bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
                                {totalCarbon.toFixed(1)} kg CO₂
                            </div>
                            <p className={`text-2xl font-bold ${rating.color} mb-2`}>{rating.rating}</p>
                            <p className="text-gray-400">{rating.message}</p>
                        </div>

                        <div className="bg-[#0a0a0a] rounded-xl p-6 mb-6">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-gray-400">vs. Average Daily Footprint</span>
                                <span className={`font-bold ${percentageVsAverage < 100 ? 'text-emerald-400' : 'text-orange-400'}`}>
                                    {percentageVsAverage}%
                                </span>
                            </div>
                            <div className="w-full bg-[#1a1a1a] rounded-full h-3 mb-2">
                                <div
                                    className={`h-3 rounded-full transition-all ${percentageVsAverage < 100 ? 'bg-emerald-400' : 'bg-orange-400'}`}
                                    style={{ width: `${Math.min(percentageVsAverage, 100)}%` }}
                                />
                            </div>
                            <p className="text-sm text-gray-500">Average US daily footprint: {avgDailyCarbon} kg CO₂</p>
                        </div>

                        <div className="bg-[#0a0a0a] rounded-xl p-6 mb-6">
                            <h3 className="text-lg font-bold text-white mb-4">Your Choices Today</h3>
                            <div className="space-y-3">
                                {choices.map((choice, index) => (
                                    <div key={index} className="flex items-center justify-between text-sm">
                                        <span className="text-gray-300">{choice.scenario}: {choice.choice}</span>
                                        <span className={`font-bold ${choice.carbon < 1 ? 'text-emerald-400' : choice.carbon > 3 ? 'text-orange-400' : 'text-yellow-400'}`}>
                                            {choice.carbon.toFixed(1)} kg
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={startGame}
                                className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3 rounded-xl transition-colors"
                            >
                                Try Again
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

    const scenario = scenarios[currentScenario];
    const progress = ((currentScenario + 1) / scenarios.length) * 100;

    return (
        <div className="min-h-screen bg-black p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl px-4 py-2 flex items-center gap-2">
                            <Leaf className="h-5 w-5 text-emerald-400" />
                            <span className="text-white font-bold">{totalCarbon.toFixed(1)} kg CO₂</span>
                        </div>
                        <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl px-4 py-2">
                            <span className="text-gray-400 text-sm">Scenario {currentScenario + 1}/{scenarios.length}</span>
                        </div>
                    </div>
                    <button
                        onClick={toggleMute}
                        className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl p-2 hover:bg-[#1a1a1a] transition-colors"
                    >
                        {isMuted ? <VolumeX className="h-5 w-5 text-gray-400" /> : <Volume2 className="h-5 w-5 text-emerald-400" />}
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="mb-6">
                    <div className="w-full bg-[#1a1a1a] rounded-full h-2">
                        <div
                            className="bg-gradient-to-r from-emerald-400 to-blue-400 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                {/* Scenario Card */}
                <div className="bg-[#0f0f0f] rounded-2xl border border-[#1a1a1a] p-8 mb-6">
                    <div className="text-center mb-8">
                        <div className="text-7xl mb-4">{scenario.emoji}</div>
                        <h2 className="text-3xl font-bold text-white mb-2">{scenario.title}</h2>
                        <p className="text-gray-400 text-lg">{scenario.description}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {scenario.choices.map((choice, index) => (
                            <button
                                key={index}
                                onClick={() => handleChoice(index)}
                                disabled={showFeedback}
                                className={`bg-[#1a1a1a] hover:bg-[#222] border border-[#2a2a2a] rounded-xl p-6 text-left transition-all transform hover:scale-102 disabled:cursor-not-allowed ${showFeedback && selectedChoice === choice ? 'ring-2 ring-emerald-400' : ''
                                    }`}
                            >
                                <p className="text-white font-semibold mb-2">{choice.text}</p>
                                <div className="flex items-center gap-2">
                                    {choice.carbon < 1 ? (
                                        <TrendingDown className="h-4 w-4 text-emerald-400" />
                                    ) : (
                                        <TrendingUp className="h-4 w-4 text-orange-400" />
                                    )}
                                    <span className={`text-sm font-bold ${choice.carbon < 1 ? 'text-emerald-400' : choice.carbon > 3 ? 'text-orange-400' : 'text-yellow-400'}`}>
                                        {choice.carbon.toFixed(1)} kg CO₂
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Feedback */}
                {showFeedback && selectedChoice && (
                    <div className={`rounded-2xl border p-6 ${selectedChoice.carbon < 1 ? 'bg-emerald-500/10 border-emerald-500/30' : selectedChoice.carbon > 3 ? 'bg-orange-500/10 border-orange-500/30' : 'bg-yellow-500/10 border-yellow-500/30'}`}>
                        <p className={`font-bold text-lg mb-2 ${selectedChoice.carbon < 1 ? 'text-emerald-400' : selectedChoice.carbon > 3 ? 'text-orange-400' : 'text-yellow-400'}`}>
                            {selectedChoice.carbon < 1 ? '🌟 Excellent Choice!' : selectedChoice.carbon > 3 ? '⚠️ High Impact' : '👍 Good Choice'}
                        </p>
                        <p className="text-gray-300">{selectedChoice.tip}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
