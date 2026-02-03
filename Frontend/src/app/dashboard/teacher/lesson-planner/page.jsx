"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft,
    Sparkles,
    Loader2,
    Save,
    FileText,
    CheckCircle,
    Edit,
    Trash2,
    Plus,
    Minus,
    Clock,
    BookOpen,
    Target,
    Award,
    Layers,
    Lightbulb,
    Library
} from "lucide-react";

export default function LessonPlannerPage() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [generatedPlan, setGeneratedPlan] = useState(null);
    const [previousPlans, setPreviousPlans] = useState([]);
    const [fetchingPrevious, setFetchingPrevious] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        subject: "",
        gradeLevel: "",
        educationLevel: "school",
        duration: "45 minutes",
        learningObjectives: [""],
        additionalContext: ""
    });

    useEffect(() => {
        fetchUser();
    }, []);

    useEffect(() => {
        if (user) {
            fetchPreviousPlans();
        }
    }, [user]);

    const fetchUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            setUser(user);
        } else {
            router.push("/login");
        }
    };

    const fetchPreviousPlans = async () => {
        if (!user) return;
        setFetchingPrevious(true);
        try {
            const response = await fetch(`/api/teacher/lesson-plans?teacherId=${user.id}`);
            const data = await response.json();
            if (data.success) {
                setPreviousPlans(data.lessonPlans);
            }
        } catch (error) {
            console.error("Error fetching previous plans:", error);
        } finally {
            setFetchingPrevious(false);
        }
    };

    const loadLessonPlan = (plan) => {
        setGeneratedPlan(plan);
        setIsEditing(false);
        // Scroll to the generated plan section on mobile
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleObjectiveChange = (index, value) => {
        const newObjectives = [...formData.learningObjectives];
        newObjectives[index] = value;
        setFormData(prev => ({ ...prev, learningObjectives: newObjectives }));
    };

    const addObjective = () => {
        setFormData(prev => ({
            ...prev,
            learningObjectives: [...prev.learningObjectives, ""]
        }));
    };

    const removeObjective = (index) => {
        if (formData.learningObjectives.length > 1) {
            const newObjectives = formData.learningObjectives.filter((_, i) => i !== index);
            setFormData(prev => ({ ...prev, learningObjectives: newObjectives }));
        }
    };

    const handleGenerate = async () => {
        if (!formData.subject || !formData.gradeLevel) {
            alert("Please fill in subject and grade level");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch("/api/generate-lesson-plan", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    teacherId: user.id,
                    subject: formData.subject,
                    gradeLevel: formData.gradeLevel,
                    educationLevel: formData.educationLevel,
                    duration: formData.duration,
                    learningObjectives: formData.learningObjectives.filter(obj => obj.trim() !== ""),
                    additionalContext: formData.additionalContext
                })
            });

            const data = await response.json();

            if (data.success) {
                setGeneratedPlan(data.lessonPlan);
                setIsEditing(false);
            } else {
                alert("Error generating lesson plan: " + data.error);
            }
        } catch (error) {
            console.error("Error:", error);
            alert("Failed to generate lesson plan");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!generatedPlan) return;

        setSaving(true);
        try {
            const { error } = await supabase
                .from("lesson_plans")
                .update({
                    title: generatedPlan.title,
                    learning_objectives: generatedPlan.learning_objectives,
                    materials_needed: generatedPlan.materials_needed,
                    activities: generatedPlan.activities,
                    assessment_methods: generatedPlan.assessment_methods,
                    differentiation_strategies: generatedPlan.differentiation_strategies,
                    homework_assignment: generatedPlan.homework_assignment,
                    additional_resources: generatedPlan.additional_resources,
                    is_published: true
                })
                .eq("id", generatedPlan.id);

            if (error) {
                alert("Error saving lesson plan: " + error.message);
            } else {
                setShowSuccess(true);
                fetchPreviousPlans(); // Refresh the list
                setTimeout(() => setShowSuccess(false), 3000);
            }
        } catch (error) {
            console.error("Error:", error);
            alert("Failed to save lesson plan");
        } finally {
            setSaving(false);
        }
    };

    const handleEditField = (field, value) => {
        setGeneratedPlan(prev => ({ ...prev, [field]: value }));
    };

    const handleEditArrayField = (field, index, value) => {
        const newArray = [...generatedPlan[field]];
        newArray[index] = value;
        setGeneratedPlan(prev => ({ ...prev, [field]: newArray }));
    };

    const addArrayItem = (field) => {
        setGeneratedPlan(prev => ({
            ...prev,
            [field]: [...prev[field], ""]
        }));
    };

    const removeArrayItem = (field, index) => {
        const newArray = generatedPlan[field].filter((_, i) => i !== index);
        setGeneratedPlan(prev => ({ ...prev, [field]: newArray }));
    };

    return (
        <div className="min-h-screen bg-[#050505] text-gray-100 p-4 md:p-8 selection:bg-emerald-500/30">
            {/* Background Glows */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-500/10 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-500/10 blur-[120px] rounded-full"></div>
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
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
                                <div className="p-2 bg-emerald-500/20 rounded-lg">
                                    <Sparkles className="h-6 w-6 text-emerald-400" />
                                </div>
                                <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-gray-500">
                                    AI Lesson Planner
                                </h1>
                            </div>
                            <p className="text-gray-400 mt-2 flex items-center gap-2">
                                <Library className="h-4 w-4 text-emerald-500/60" />
                                Craft world-class education with artificial intelligence
                            </p>
                        </div>
                    </div>
                </div>

                {/* Success Message */}
                {showSuccess && (
                    <div className="mb-8 bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-md rounded-2xl p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="p-1.5 bg-emerald-500/20 rounded-full">
                            <CheckCircle className="h-5 w-5 text-emerald-400" />
                        </div>
                        <p className="text-emerald-300 font-medium">Lesson plan saved to your library!</p>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Left Column: Form and Recent Plans */}
                    <div className="lg:col-span-4 space-y-8">
                        {/* Form Section */}
                        <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-6 md:p-8 shadow-2xl">
                            <h2 className="text-xl font-bold text-white mb-8 flex items-center gap-3">
                                <Layers className="h-5 w-5 text-emerald-400" />
                                Parameters
                            </h2>

                            <div className="space-y-6">
                                {/* Subject */}
                                <div className="group">
                                    <label className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5 group-focus-within:text-emerald-400 transition-colors">
                                        <BookOpen className="h-3.5 w-3.5" />
                                        Subject
                                    </label>
                                    <input
                                        type="text"
                                        name="subject"
                                        value={formData.subject}
                                        onChange={handleInputChange}
                                        placeholder="e.g., Climate Change"
                                        className="w-full bg-black/40 border border-white/10 hover:border-white/20 text-white rounded-xl p-3.5 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all placeholder:text-gray-600"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {/* Grade Level */}
                                    <div className="group">
                                        <label className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5 group-focus-within:text-emerald-400 transition-colors">
                                            <Award className="h-3.5 w-3.5" />
                                            Grade
                                        </label>
                                        <input
                                            type="text"
                                            name="gradeLevel"
                                            value={formData.gradeLevel}
                                            onChange={handleInputChange}
                                            placeholder="Grade 8"
                                            className="w-full bg-black/40 border border-white/10 hover:border-white/20 text-white rounded-xl p-3.5 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all placeholder:text-gray-600"
                                        />
                                    </div>

                                    {/* Duration */}
                                    <div className="group">
                                        <label className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5 group-focus-within:text-emerald-400 transition-colors">
                                            <Clock className="h-3.5 w-3.5" />
                                            Duration
                                        </label>
                                        <select
                                            name="duration"
                                            value={formData.duration}
                                            onChange={handleInputChange}
                                            className="w-full bg-black/40 border border-white/10 hover:border-white/20 text-white rounded-xl p-3.5 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all cursor-pointer"
                                        >
                                            <option value="30 minutes">30m</option>
                                            <option value="45 minutes">45m</option>
                                            <option value="1 hour">1h</option>
                                            <option value="90 minutes">90m</option>
                                            <option value="2 hours">2h</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Learning Objectives */}
                                <div className="group">
                                    <label className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5 group-focus-within:text-emerald-400 transition-colors">
                                        <Target className="h-3.5 w-3.5" />
                                        Objectives
                                    </label>
                                    <div className="space-y-3">
                                        {formData.learningObjectives.map((objective, index) => (
                                            <div key={index} className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={objective}
                                                    onChange={(e) => handleObjectiveChange(index, e.target.value)}
                                                    placeholder="Define main target..."
                                                    className="flex-1 bg-black/40 border border-white/10 text-white rounded-xl p-3 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all placeholder:text-gray-700"
                                                />
                                                {formData.learningObjectives.length > 1 && (
                                                    <button
                                                        onClick={() => removeObjective(index)}
                                                        className="p-3 bg-red-500/10 border border-white/5 rounded-xl hover:bg-red-500/20 transition-all"
                                                    >
                                                        <Minus className="h-4 w-4 text-red-400" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        <button
                                            onClick={addObjective}
                                            className="w-full py-3 border border-dashed border-white/10 rounded-xl hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all flex items-center justify-center gap-2 text-gray-400 hover:text-emerald-400 font-medium text-sm"
                                        >
                                            <Plus className="h-4 w-4" />
                                            Add Objective
                                        </button>
                                    </div>
                                </div>

                                {/* Generate Button */}
                                <button
                                    onClick={handleGenerate}
                                    disabled={loading || !formData.subject || !formData.gradeLevel}
                                    className="w-full mt-2 relative group overflow-hidden bg-emerald-500 disabled:bg-white/10 disabled:cursor-not-allowed text-emerald-950 py-4 rounded-2xl font-bold text-base transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                                    <div className="relative flex items-center justify-center gap-3">
                                        {loading ? (
                                            <>
                                                <Loader2 className="h-5 w-5 animate-spin" />
                                                <span>Architecting Plan...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="h-5 w-5 fill-current" />
                                                <span>Generate Masterplan</span>
                                            </>
                                        )}
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Recent Plans Section */}
                        <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-6 shadow-2xl overflow-hidden">
                            <h2 className="text-sm font-bold text-white mb-6 flex items-center gap-3 px-2">
                                <Library className="h-4 w-4 text-emerald-400" />
                                RECENT PLANS
                            </h2>

                            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
                                {fetchingPrevious ? (
                                    <div className="flex flex-col items-center justify-center py-10 gap-3 grayscale opacity-50">
                                        <Loader2 className="h-6 w-6 text-emerald-500 animate-spin" />
                                        <span className="text-xs font-medium text-gray-400 tracking-widest">LOADING</span>
                                    </div>
                                ) : previousPlans.length > 0 ? (
                                    previousPlans.map((plan) => (
                                        <button
                                            key={plan.id}
                                            onClick={() => loadLessonPlan(plan)}
                                            className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 group ${generatedPlan?.id === plan.id
                                                ? "bg-emerald-500/10 border-emerald-500/30"
                                                : "bg-black/20 border-white/5 hover:border-white/10 hover:bg-white/5"
                                                }`}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className={`font-semibold transition-colors truncate pr-4 ${generatedPlan?.id === plan.id ? 'text-emerald-400' : 'text-gray-200 group-hover:text-white'}`}>
                                                    {plan.title}
                                                </h3>
                                                <span className="text-[10px] font-bold text-gray-600 uppercase">
                                                    {new Date(plan.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-[11px] font-medium text-gray-500">
                                                <span className="px-1.5 py-0.5 rounded bg-white/5 uppercase tracking-tighter">{plan.subject}</span>
                                                <div className="h-1 w-1 rounded-full bg-gray-700"></div>
                                                <span className="capitalize">{plan.grade_level}</span>
                                            </div>
                                        </button>
                                    ))
                                ) : (
                                    <div className="text-center py-12 px-4">
                                        <div className="bg-white/5 p-4 rounded-full w-fit mx-auto mb-4 border border-white/5 opacity-20">
                                            <FileText className="h-6 w-6 text-gray-400" />
                                        </div>
                                        <p className="text-gray-500 text-sm font-medium">Your library is empty.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Generated Plan Section - Document Canvas Style */}
                    <div className="lg:col-span-8">
                        <div className={`bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 min-h-[600px] flex flex-col transition-all duration-500 ${generatedPlan ? 'opacity-100' : 'opacity-80'}`}>
                            {generatedPlan ? (
                                <>
                                    {/* Document Header/Toolbar */}
                                    <div className="p-6 border-b border-white/10 flex items-center justify-between sticky top-0 z-20 bg-black/40 backdrop-blur-2xl rounded-t-3xl">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-500/20 rounded-lg">
                                                <FileText className="h-5 w-5 text-blue-400" />
                                            </div>
                                            <h2 className="text-xl font-bold text-white tracking-tight">Lesson Masterplan</h2>
                                        </div>
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => setIsEditing(!isEditing)}
                                                className={`px-4 py-2.5 rounded-xl border transition-all flex items-center gap-2 font-semibold text-sm ${isEditing
                                                    ? "bg-blue-500 text-white border-blue-400 shadow-lg shadow-blue-500/20"
                                                    : "bg-white/5 border-white/10 hover:bg-white/10 text-gray-300"
                                                    }`}
                                            >
                                                <Edit className="h-4 w-4" />
                                                {isEditing ? "FINISH EDITING" : "EDIT PLAN"}
                                            </button>
                                            <button
                                                onClick={handleSave}
                                                disabled={saving}
                                                className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-white/10 text-emerald-950 disabled:text-gray-500 rounded-xl font-bold text-sm transition-all active:scale-95 shadow-lg shadow-emerald-500/20 flex items-center gap-2"
                                            >
                                                {saving ? (
                                                    <>
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                        SAVING...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Save className="h-4 w-4" />
                                                        SAVE TO LIBRARY
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Document Content */}
                                    <div className="p-8 md:p-12 overflow-y-auto max-h-[800px] custom-scrollbar space-y-12">
                                        {/* Document Title Area */}
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">DOCUMENT TITLE</label>
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    value={generatedPlan.title}
                                                    onChange={(e) => handleEditField("title", e.target.value)}
                                                    className="w-full bg-black/40 border-b-2 border-emerald-500/50 text-white text-3xl font-bold p-2 focus:ring-0 outline-none placeholder:text-gray-700"
                                                />
                                            ) : (
                                                <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight tracking-tight">
                                                    {generatedPlan.title}
                                                </h1>
                                            )}
                                            <div className="flex flex-wrap gap-4 pt-4">
                                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                                                    <BookOpen className="h-3 w-3" />
                                                    {generatedPlan.subject}
                                                </div>
                                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                                                    <Award className="h-3 w-3" />
                                                    {generatedPlan.grade_level}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                            {/* Learning Objectives Panel */}
                                            <div className="space-y-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-1 bg-emerald-500 rounded-full"></div>
                                                    <h3 className="text-lg font-bold text-white uppercase tracking-wider">Objectives</h3>
                                                </div>
                                                <div className="space-y-3">
                                                    {isEditing ? (
                                                        <div className="space-y-3">
                                                            {generatedPlan.learning_objectives?.map((obj, index) => (
                                                                <div key={index} className="flex gap-2">
                                                                    <input
                                                                        type="text"
                                                                        value={obj}
                                                                        onChange={(e) => handleEditArrayField("learning_objectives", index, e.target.value)}
                                                                        className="flex-1 bg-black/20 border border-white/10 rounded-xl p-3 text-sm focus:border-emerald-500 outline-none"
                                                                    />
                                                                    <button onClick={() => removeArrayItem("learning_objectives", index)} className="p-2 hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
                                                                </div>
                                                            ))}
                                                            <button onClick={() => addArrayItem("learning_objectives")} className="flex items-center gap-2 text-xs text-emerald-400 font-bold hover:text-emerald-300">
                                                                <Plus className="h-4 w-4" /> ADD OBJECTIVE
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="grid gap-3">
                                                            {generatedPlan.learning_objectives?.map((obj, index) => (
                                                                <div key={index} className="group flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/[0.07] transition-all">
                                                                    <span className="text-emerald-500 font-black text-xs pt-1 opacity-50">0{index + 1}</span>
                                                                    <p className="text-gray-300 text-[15px] leading-relaxed italic">{obj}</p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Materials Needed Panel */}
                                            <div className="space-y-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-1 bg-blue-500 rounded-full"></div>
                                                    <h3 className="text-lg font-bold text-white uppercase tracking-wider">Resources</h3>
                                                </div>
                                                <div className="space-y-3">
                                                    {isEditing ? (
                                                        <div className="space-y-3">
                                                            {generatedPlan.materials_needed?.map((material, index) => (
                                                                <div key={index} className="flex gap-2">
                                                                    <input
                                                                        type="text"
                                                                        value={material}
                                                                        onChange={(e) => handleEditArrayField("materials_needed", index, e.target.value)}
                                                                        className="flex-1 bg-black/20 border border-white/10 rounded-xl p-3 text-sm focus:border-blue-500 outline-none"
                                                                    />
                                                                    <button onClick={() => removeArrayItem("materials_needed", index)} className="p-2 hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
                                                                </div>
                                                            ))}
                                                            <button onClick={() => addArrayItem("materials_needed")} className="flex items-center gap-2 text-xs text-blue-400 font-bold hover:text-blue-300">
                                                                <Plus className="h-4 w-4" /> ADD RESOURCE
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-wrap gap-2">
                                                            {generatedPlan.materials_needed?.map((material, index) => (
                                                                <span key={index} className="px-4 py-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-sm font-medium">
                                                                    {material}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Activities - Timeline Style */}
                                        <div className="space-y-10">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-1 bg-orange-500 rounded-full"></div>
                                                <h3 className="text-lg font-bold text-white uppercase tracking-wider">Activity Timeline</h3>
                                            </div>
                                            <div className="relative space-y-12">
                                                {/* Vertical line connector */}
                                                <div className="absolute left-[15px] top-6 bottom-6 w-0.5 bg-gradient-to-b from-orange-500/50 via-gray-800 to-transparent z-0"></div>

                                                {generatedPlan.activities?.map((activity, index) => (
                                                    <div key={index} className="relative z-10 flex gap-8 group">
                                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-black border-2 border-orange-500/50 flex items-center justify-center text-orange-500 text-xs font-black shadow-[0_0_15px_rgba(249,115,22,0.2)]">
                                                            {index + 1}
                                                        </div>
                                                        <div className="flex-1 bg-white/[0.03] border border-white/5 rounded-3xl p-6 hover:bg-white/[0.06] hover:border-white/10 transition-all">
                                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                                                <h4 className="text-xl font-bold text-white tracking-tight">{activity.name}</h4>
                                                                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-black tracking-widest uppercase">
                                                                    <Clock className="h-3 w-3" />
                                                                    {activity.duration}
                                                                </div>
                                                            </div>
                                                            <p className="text-gray-400 text-base leading-relaxed mb-6">{activity.description}</p>
                                                            {activity.instructions && (
                                                                <div className="p-4 rounded-2xl bg-black/40 border border-white/5 flex gap-3 italic text-sm text-gray-500 leading-relaxed">
                                                                    <div className="pt-0.5"><Lightbulb className="h-4 w-4 text-orange-500 opacity-60" /></div>
                                                                    <div>{activity.instructions}</div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Differentiation & Homework */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                            <div className="space-y-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-1 bg-purple-500 rounded-full"></div>
                                                    <h3 className="text-lg font-bold text-white uppercase tracking-wider">Differentiation</h3>
                                                </div>
                                                {isEditing ? (
                                                    <textarea
                                                        value={generatedPlan.differentiation_strategies}
                                                        onChange={(e) => handleEditField("differentiation_strategies", e.target.value)}
                                                        className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 text-sm focus:border-purple-500 outline-none min-h-[120px]"
                                                    />
                                                ) : (
                                                    <div className="p-6 rounded-3xl bg-purple-500/5 border border-purple-500/10">
                                                        <p className="text-gray-400 text-sm leading-relaxed">{generatedPlan.differentiation_strategies}</p>
                                                    </div>
                                                )}
                                            </div>

                                            {generatedPlan.homework_assignment && (
                                                <div className="space-y-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-8 w-1 bg-pink-500 rounded-full"></div>
                                                        <h3 className="text-lg font-bold text-white uppercase tracking-wider">Homework</h3>
                                                    </div>
                                                    {isEditing ? (
                                                        <textarea
                                                            value={generatedPlan.homework_assignment}
                                                            onChange={(e) => handleEditField("homework_assignment", e.target.value)}
                                                            className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 text-sm focus:border-pink-500 outline-none min-h-[120px]"
                                                        />
                                                    ) : (
                                                        <div className="p-6 rounded-3xl bg-pink-500/5 border border-pink-500/10">
                                                            <p className="text-gray-400 text-sm leading-relaxed">{generatedPlan.homework_assignment}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center flex-1 text-center py-20 px-8">
                                    <div className="relative mb-8">
                                        <div className="absolute inset-0 bg-emerald-500/20 blur-[60px] rounded-full"></div>
                                        <div className="relative w-24 h-24 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center rotate-3 scale-110">
                                            <FileText className="h-10 w-10 text-gray-700" />
                                        </div>
                                        <div className="absolute -top-4 -right-4 w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center -rotate-12 shadow-xl animate-bounce">
                                            <Sparkles className="h-6 w-6 text-emerald-950" />
                                        </div>
                                    </div>
                                    <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">
                                        Your classroom canvas awaits.
                                    </h3>
                                    <p className="text-gray-500 max-w-sm leading-relaxed">
                                        Configure your parameters on the left and let AI synthesize a world-class lesson plan for you.
                                    </p>
                                    <div className="mt-10 flex gap-4">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/40"></div>
                                            <div className="w-1.5 h-8 rounded-full bg-gradient-to-b from-emerald-500/40 to-transparent"></div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

