"use client";
import { useState, useEffect } from "react";
import { Trophy, Clock, Zap, Volume2, VolumeX, Home } from "lucide-react";
import audioManager from "@/lib/AudioManager";

const quizQuestions = {
    easy: [
        {
            question: "What percentage of Earth's water is freshwater?",
            options: ["2.5%", "10%", "25%", "50%"],
            correct: 0,
            fact: "Only 2.5% of Earth's water is freshwater, and most of it is frozen in glaciers!"
        },
        {
            question: "Which of these is a renewable energy source?",
            options: ["Coal", "Solar", "Natural Gas", "Oil"],
            correct: 1,
            fact: "Solar energy is renewable and produces no greenhouse gases during operation."
        },
        {
            question: "How long does a plastic bottle take to decompose?",
            options: ["1 year", "10 years", "100 years", "450+ years"],
            correct: 3,
            fact: "Plastic bottles can take 450+ years to decompose, polluting our environment for generations."
        },
        {
            question: "What is the main greenhouse gas?",
            options: ["Oxygen", "Carbon Dioxide", "Nitrogen", "Hydrogen"],
            correct: 1,
            fact: "Carbon dioxide (CO2) is the primary greenhouse gas emitted through human activities."
        },
        {
            question: "Which day is Earth Day celebrated?",
            options: ["April 22", "June 5", "March 21", "May 1"],
            correct: 0,
            fact: "Earth Day is celebrated on April 22nd every year to support environmental protection."
        }
    ],
    medium: [
        {
            question: "What is the process by which plants absorb CO2?",
            options: ["Respiration", "Photosynthesis", "Transpiration", "Decomposition"],
            correct: 1,
            fact: "Photosynthesis allows plants to convert CO2 and sunlight into oxygen and energy."
        },
        {
            question: "Which country produces the most renewable energy?",
            options: ["USA", "China", "Germany", "India"],
            correct: 1,
            fact: "China leads the world in renewable energy production, especially in solar and wind."
        },
        {
            question: "What is carbon footprint?",
            options: ["Size of carbon atoms", "Total greenhouse gas emissions", "Carbon in soil", "Forest area"],
            correct: 1,
            fact: "Carbon footprint measures the total greenhouse gas emissions caused by an individual or organization."
        },
        {
            question: "Which ocean has the most plastic pollution?",
            options: ["Atlantic", "Pacific", "Indian", "Arctic"],
            correct: 1,
            fact: "The Pacific Ocean contains the Great Pacific Garbage Patch, the largest accumulation of ocean plastic."
        },
        {
            question: "What does 'sustainable' mean?",
            options: ["Expensive", "Meeting needs without compromising future", "Organic", "Recyclable"],
            correct: 1,
            fact: "Sustainability means meeting our needs without compromising the ability of future generations to meet theirs."
        }
    ],
    hard: [
        {
            question: "What is the Paris Agreement's main goal?",
            options: ["Limit warming to 1.5°C", "Ban fossil fuels", "Plant 1 trillion trees", "Reduce plastic by 50%"],
            correct: 0,
            fact: "The Paris Agreement aims to limit global warming to well below 2°C, preferably 1.5°C above pre-industrial levels."
        },
        {
            question: "Which sector produces the most greenhouse gases globally?",
            options: ["Transportation", "Energy Production", "Agriculture", "Manufacturing"],
            correct: 1,
            fact: "Energy production (electricity and heat) is the largest contributor to global greenhouse gas emissions."
        },
        {
            question: "What is ocean acidification caused by?",
            options: ["Plastic pollution", "CO2 absorption", "Oil spills", "Overfishing"],
            correct: 1,
            fact: "Ocean acidification occurs when oceans absorb excess CO2 from the atmosphere, lowering pH levels."
        },
        {
            question: "Which renewable energy has the highest capacity factor?",
            options: ["Solar", "Wind", "Geothermal", "Hydroelectric"],
            correct: 2,
            fact: "Geothermal energy has the highest capacity factor, producing consistent power 24/7."
        },
        {
            question: "What is biodiversity loss primarily caused by?",
            options: ["Climate change", "Habitat destruction", "Pollution", "All of the above"],
            correct: 3,
            fact: "Biodiversity loss is caused by multiple factors including habitat destruction, climate change, and pollution."
        }
    ]
};

export default function EcoQuizGame() {
    const [difficulty, setDifficulty] = useState(null);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(30);
    const [gameActive, setGameActive] = useState(false);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [showFeedback, setShowFeedback] = useState(false);
    const [questions, setQuestions] = useState([]);
    const [isMuted, setIsMuted] = useState(false);
    const [gameComplete, setGameComplete] = useState(false);

    useEffect(() => {
        if (gameActive && timeLeft > 0 && !showFeedback) {
            const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
            return () => clearTimeout(timer);
        } else if (timeLeft === 0 && !showFeedback) {
            handleTimeout();
        }
    }, [timeLeft, gameActive, showFeedback]);

    const startGame = (level) => {
        audioManager.play('click');
        setDifficulty(level);
        setQuestions(shuffleArray([...quizQuestions[level]]));
        setCurrentQuestion(0);
        setScore(0);
        setTimeLeft(30);
        setGameActive(true);
        setGameComplete(false);
        setShowFeedback(false);
    };

    const shuffleArray = (array) => {
        return array.sort(() => Math.random() - 0.5);
    };

    const handleAnswer = (answerIndex) => {
        if (showFeedback) return;

        setSelectedAnswer(answerIndex);
        setShowFeedback(true);

        const isCorrect = answerIndex === questions[currentQuestion].correct;

        if (isCorrect) {
            audioManager.play('correct');
            const points = difficulty === 'easy' ? 10 : difficulty === 'medium' ? 20 : 30;
            const timeBonus = Math.floor(timeLeft / 5);
            setScore(score + points + timeBonus);
        } else {
            audioManager.play('incorrect');
        }

        setTimeout(() => {
            if (currentQuestion < questions.length - 1) {
                setCurrentQuestion(currentQuestion + 1);
                setSelectedAnswer(null);
                setShowFeedback(false);
                setTimeLeft(30);
            } else {
                endGame();
            }
        }, 2500);
    };

    const handleTimeout = () => {
        audioManager.play('incorrect');
        setShowFeedback(true);
        setTimeout(() => {
            if (currentQuestion < questions.length - 1) {
                setCurrentQuestion(currentQuestion + 1);
                setShowFeedback(false);
                setTimeLeft(30);
            } else {
                endGame();
            }
        }, 2000);
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

    if (!difficulty) {
        return (
            <div className="min-h-screen bg-black p-6">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center justify-between mb-8">
                        <h1 className="text-4xl font-bold text-white flex items-center gap-3">
                            🎯 Eco Quiz Challenge
                        </h1>
                        <a href="/dashboard/student?tab=home" className="text-emerald-400 hover:text-emerald-300 flex items-center gap-2">
                            <Home className="h-5 w-5" />
                            Back to Dashboard
                        </a>
                    </div>

                    <div className="bg-[#0f0f0f] rounded-2xl border border-[#1a1a1a] p-8 mb-6">
                        <h2 className="text-2xl font-bold text-white mb-4">How to Play</h2>
                        <ul className="text-gray-300 space-y-2 mb-6">
                            <li>• Answer environmental questions before time runs out</li>
                            <li>• Faster answers earn bonus points</li>
                            <li>• Learn interesting facts after each question</li>
                            <li>• Earn EcoPoints based on your performance</li>
                        </ul>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <button
                            onClick={() => startGame('easy')}
                            className="bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white rounded-2xl p-8 transition-all transform hover:scale-105"
                        >
                            <div className="text-6xl mb-4">🌱</div>
                            <h3 className="text-2xl font-bold mb-2">Easy</h3>
                            <p className="text-emerald-100">Perfect for beginners</p>
                            <p className="text-sm mt-2 text-emerald-200">10 points per question</p>
                        </button>

                        <button
                            onClick={() => startGame('medium')}
                            className="bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white rounded-2xl p-8 transition-all transform hover:scale-105"
                        >
                            <div className="text-6xl mb-4">🌿</div>
                            <h3 className="text-2xl font-bold mb-2">Medium</h3>
                            <p className="text-blue-100">Test your knowledge</p>
                            <p className="text-sm mt-2 text-blue-200">20 points per question</p>
                        </button>

                        <button
                            onClick={() => startGame('hard')}
                            className="bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-400 hover:to-purple-500 text-white rounded-2xl p-8 transition-all transform hover:scale-105"
                        >
                            <div className="text-6xl mb-4">🌳</div>
                            <h3 className="text-2xl font-bold mb-2">Hard</h3>
                            <p className="text-purple-100">For eco-experts</p>
                            <p className="text-sm mt-2 text-purple-200">30 points per question</p>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (gameComplete) {
        const maxScore = questions.length * (difficulty === 'easy' ? 10 : difficulty === 'medium' ? 20 : 30) + (30 * questions.length / 5);
        const percentage = Math.round((score / maxScore) * 100);

        return (
            <div className="min-h-screen bg-black p-6">
                <div className="max-w-2xl mx-auto">
                    <div className="bg-gradient-to-br from-[#0f0f0f] to-[#1a1a1a] rounded-2xl border border-emerald-500/30 p-8 text-center">
                        <Trophy className="h-20 w-20 text-emerald-400 mx-auto mb-4" />
                        <h2 className="text-4xl font-bold text-white mb-4">Quiz Complete! 🎉</h2>
                        <div className="text-6xl font-bold text-emerald-400 mb-2">{score}</div>
                        <p className="text-gray-400 mb-6">Total Points Earned</p>

                        <div className="bg-[#0a0a0a] rounded-xl p-6 mb-6">
                            <div className="grid grid-cols-2 gap-4 text-left">
                                <div>
                                    <p className="text-gray-400 text-sm">Accuracy</p>
                                    <p className="text-2xl font-bold text-white">{percentage}%</p>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-sm">Questions</p>
                                    <p className="text-2xl font-bold text-white">{questions.length}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => setDifficulty(null)}
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

    const question = questions[currentQuestion];
    const progress = ((currentQuestion + 1) / questions.length) * 100;

    return (
        <div className="min-h-screen bg-black p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl px-4 py-2 flex items-center gap-2">
                            <Trophy className="h-5 w-5 text-emerald-400" />
                            <span className="text-white font-bold">{score}</span>
                        </div>
                        <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl px-4 py-2 flex items-center gap-2">
                            <Clock className={`h-5 w-5 ${timeLeft < 10 ? 'text-red-400' : 'text-blue-400'}`} />
                            <span className={`font-bold ${timeLeft < 10 ? 'text-red-400' : 'text-white'}`}>{timeLeft}s</span>
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
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-400 text-sm">Question {currentQuestion + 1} of {questions.length}</span>
                        <span className="text-emerald-400 text-sm font-bold">{difficulty.toUpperCase()}</span>
                    </div>
                    <div className="w-full bg-[#1a1a1a] rounded-full h-2">
                        <div
                            className="bg-emerald-400 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                {/* Question Card */}
                <div className="bg-[#0f0f0f] rounded-2xl border border-[#1a1a1a] p-8 mb-6">
                    <h2 className="text-2xl font-bold text-white mb-8">{question.question}</h2>

                    <div className="grid grid-cols-1 gap-4">
                        {question.options.map((option, index) => {
                            const isSelected = selectedAnswer === index;
                            const isCorrect = index === question.correct;
                            const showResult = showFeedback;

                            let bgColor = "bg-[#1a1a1a] hover:bg-[#222]";
                            if (showResult) {
                                if (isCorrect) bgColor = "bg-emerald-500/20 border-emerald-500";
                                else if (isSelected) bgColor = "bg-red-500/20 border-red-500";
                            }

                            return (
                                <button
                                    key={index}
                                    onClick={() => handleAnswer(index)}
                                    disabled={showFeedback}
                                    className={`${bgColor} border border-[#2a2a2a] rounded-xl p-4 text-left text-white font-semibold transition-all transform hover:scale-102 disabled:cursor-not-allowed`}
                                >
                                    <span className="flex items-center gap-3">
                                        <span className="bg-[#0a0a0a] rounded-lg px-3 py-1 text-sm">{String.fromCharCode(65 + index)}</span>
                                        {option}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Feedback */}
                {showFeedback && (
                    <div className={`rounded-2xl border p-6 ${selectedAnswer === question.correct ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                        <p className={`font-bold text-lg mb-2 ${selectedAnswer === question.correct ? 'text-emerald-400' : 'text-red-400'}`}>
                            {selectedAnswer === question.correct ? '✓ Correct!' : selectedAnswer === null ? '⏱ Time\'s up!' : '✗ Incorrect'}
                        </p>
                        <p className="text-gray-300">{question.fact}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
