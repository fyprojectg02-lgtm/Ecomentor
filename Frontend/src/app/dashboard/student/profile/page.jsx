"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { User, Mail, GraduationCap, Building2, Heart, Save, Loader2, CheckCircle, XCircle, Award, Trophy, Target, TrendingUp, Leaf, Droplet, TreeDeciduous } from "lucide-react";

export default function StudentProfile() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [notification, setNotification] = useState(null);

    // User stats
    const [userStats, setUserStats] = useState({
        ecoPoints: 0,
        rank: 0,
        completedTasks: 0,
        co2Saved: 0,
        treesEquivalent: 0,
        plasticReduced: 0,
        waterSaved: 0
    });

    // Form state
    const [formData, setFormData] = useState({
        fullName: "",
        educationLevel: "",
        institution: "",
        interests: ""
    });

    useEffect(() => {
        fetchProfileData();
    }, []);

    const fetchProfileData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push("/login");
                return;
            }

            setUser(user);

            // Fetch profile data
            const { data: profile } = await supabase
                .from("profiles")
                .select("full_name")
                .eq("id", user.id)
                .single();

            // Fetch user details
            const { data: details } = await supabase
                .from("user_details")
                .select("education_level, institution")
                .eq("user_id", user.id)
                .single();

            // Fetch student interests separately
            const { data: interestData } = await supabase
                .from("student_interests")
                .select("interests")
                .eq("student_id", user.id)
                .single();

            // Fetch student stats
            const { data: stats } = await supabase
                .from("students")
                .select("eco_points, completed_tasks")
                .eq("id", user.id)
                .single();

            // Fetch rank
            const { data: rankData } = await supabase
                .rpc('get_student_rank', { p_student_id: user.id });

            // Fetch environmental impact
            const { data: impact } = await supabase
                .from("impact_metrics")
                .select("co2_saved_kg, trees_equivalent, plastic_reduced_kg, water_saved_liters")
                .eq("student_id", user.id)
                .single();

            setFormData({
                fullName: profile?.full_name || "",
                educationLevel: details?.education_level || "School",
                institution: details?.institution || "",
                interests: Array.isArray(interestData?.interests) ? interestData.interests.join(", ") : ""
            });

            setUserStats({
                ecoPoints: stats?.eco_points || 0,
                rank: rankData?.[0]?.rank || 0,
                completedTasks: stats?.completed_tasks || 0,
                co2Saved: impact?.co2_saved_kg || 0,
                treesEquivalent: impact?.trees_equivalent || 0,
                plasticReduced: impact?.plastic_reduced_kg || 0,
                waterSaved: impact?.water_saved_liters || 0
            });

            setLoading(false);
        } catch (error) {
            console.error("Error fetching profile:", error);
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const showNotification = (type, message) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 4000);
    };

    const handleSave = async (e) => {
        e.preventDefault();

        if (!formData.fullName.trim()) {
            showNotification("error", "Please enter your full name");
            return;
        }

        setSaving(true);

        try {
            // Update profiles table
            const { error: profileError } = await supabase
                .from("profiles")
                .update({ full_name: formData.fullName })
                .eq("id", user.id);

            if (profileError) throw profileError;

            // Update or insert user_details
            const { error: detailsError } = await supabase
                .from("user_details")
                .upsert({
                    user_id: user.id,
                    education_level: formData.educationLevel,
                    institution: formData.institution
                }, {
                    onConflict: "user_id"
                });

            if (detailsError) throw detailsError;

            // Update or insert student_interests
            const interestsArray = formData.interests
                .split(",")
                .map(i => i.trim())
                .filter(i => i !== "");

            const { error: interestsError } = await supabase
                .from("student_interests")
                .upsert({
                    student_id: user.id,
                    interests: interestsArray,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: "student_id"
                });

            if (interestsError) throw interestsError;

            showNotification("success", "Profile updated successfully!");
        } catch (error) {
            console.error("Error updating profile:", error);
            showNotification("error", "Failed to update profile. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#060606] flex items-center justify-center">
                <div className="flex items-center gap-3 text-emerald-400">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span>Loading profile...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#060606] p-6">
            {/* Notification Toast */}
            {notification && (
                <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border animate-in slide-in-from-top duration-300 ${notification.type === "success"
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : "bg-red-500/10 border-red-500/30 text-red-400"
                    }`}>
                    {notification.type === "success" ? (
                        <CheckCircle className="h-5 w-5" />
                    ) : (
                        <XCircle className="h-5 w-5" />
                    )}
                    <span className="font-semibold">{notification.message}</span>
                </div>
            )}

            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">Profile Settings</h1>
                    <p className="text-gray-400">Manage your personal information and view your achievements</p>
                </div>

                {/* User Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-[#0f0f0f]/40 backdrop-blur-md rounded-2xl border border-white/5 p-6 hover:border-emerald-500/20 transition-all">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                                <Award className="h-5 w-5 text-emerald-400" />
                            </div>
                            <p className="text-sm text-gray-400">EcoPoints</p>
                        </div>
                        <p className="text-3xl font-black text-emerald-400">{userStats.ecoPoints}</p>
                    </div>

                    <div className="bg-[#0f0f0f]/40 backdrop-blur-md rounded-2xl border border-white/5 p-6 hover:border-amber-500/20 transition-all">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                                <Trophy className="h-5 w-5 text-amber-400" />
                            </div>
                            <p className="text-sm text-gray-400">Global Rank</p>
                        </div>
                        <p className="text-3xl font-black text-white">#{userStats.rank}</p>
                    </div>

                    <div className="bg-[#0f0f0f]/40 backdrop-blur-md rounded-2xl border border-white/5 p-6 hover:border-blue-500/20 transition-all">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                                <Target className="h-5 w-5 text-blue-400" />
                            </div>
                            <p className="text-sm text-gray-400">Tasks Done</p>
                        </div>
                        <p className="text-3xl font-black text-white">{userStats.completedTasks}</p>
                    </div>

                    <div className="bg-[#0f0f0f]/40 backdrop-blur-md rounded-2xl border border-white/5 p-6 hover:border-purple-500/20 transition-all">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                                <TrendingUp className="h-5 w-5 text-purple-400" />
                            </div>
                            <p className="text-sm text-gray-400">Impact Score</p>
                        </div>
                        <p className="text-3xl font-black text-white">{Math.round(userStats.co2Saved + userStats.plasticReduced)}</p>
                    </div>
                </div>

                {/* Environmental Impact */}
                <div className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-emerald-500/20 rounded-[2rem] p-8 mb-8">
                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                        <Leaf className="h-6 w-6 text-emerald-400" />
                        Your Environmental Impact
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="text-center">
                            <div className="inline-flex p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-3">
                                <Leaf className="h-8 w-8 text-emerald-400" />
                            </div>
                            <p className="text-3xl font-black text-white mb-1">{userStats.co2Saved} kg</p>
                            <p className="text-sm text-gray-400">CO₂ Saved</p>
                        </div>
                        <div className="text-center">
                            <div className="inline-flex p-4 rounded-2xl bg-green-500/10 border border-green-500/20 mb-3">
                                <TreeDeciduous className="h-8 w-8 text-green-400" />
                            </div>
                            <p className="text-3xl font-black text-white mb-1">{userStats.treesEquivalent}</p>
                            <p className="text-sm text-gray-400">Trees Equivalent</p>
                        </div>
                        <div className="text-center">
                            <div className="inline-flex p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 mb-3">
                                <Droplet className="h-8 w-8 text-blue-400" />
                            </div>
                            <p className="text-3xl font-black text-white mb-1">{userStats.waterSaved} L</p>
                            <p className="text-sm text-gray-400">Water Saved</p>
                        </div>
                        <div className="text-center">
                            <div className="inline-flex p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 mb-3">
                                <svg className="h-8 w-8 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                            </div>
                            <p className="text-3xl font-black text-white mb-1">{userStats.plasticReduced} kg</p>
                            <p className="text-sm text-gray-400">Plastic Reduced</p>
                        </div>
                    </div>
                </div>

                {/* Profile Form */}
                <form onSubmit={handleSave} className="bg-[#0f0f0f]/40 backdrop-blur-md rounded-[2rem] border border-white/5 p-8 space-y-6">
                    <h2 className="text-2xl font-bold text-white mb-6">Personal Information</h2>

                    {/* Email (Read-only) */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-400 mb-3">
                            <Mail className="h-4 w-4" />
                            Email Address
                        </label>
                        <input
                            type="email"
                            value={user?.email || ""}
                            disabled
                            readOnly
                            className="w-full bg-zinc-900/50 border border-zinc-800 text-gray-500 rounded-xl p-4 cursor-not-allowed"
                        />
                        <p className="text-xs text-gray-600 mt-2">Email cannot be changed</p>
                    </div>

                    {/* Full Name */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-white mb-3">
                            <User className="h-4 w-4 text-emerald-400" />
                            Full Name *
                        </label>
                        <input
                            type="text"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleInputChange}
                            className="w-full bg-black border-2 border-zinc-700 text-white rounded-xl p-4 placeholder-zinc-600 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                            placeholder="Enter your full name"
                            required
                        />
                    </div>

                    {/* Education Level */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-white mb-3">
                            <GraduationCap className="h-4 w-4 text-emerald-400" />
                            Education Level
                        </label>
                        <select
                            name="educationLevel"
                            value={formData.educationLevel}
                            onChange={handleInputChange}
                            className="w-full bg-black border-2 border-zinc-700 text-white rounded-xl p-4 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                        >
                            <option value="School">School</option>
                            <option value="College/University">College/University</option>
                        </select>
                    </div>

                    {/* Institution */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-white mb-3">
                            <Building2 className="h-4 w-4 text-emerald-400" />
                            Institution
                        </label>
                        <input
                            type="text"
                            name="institution"
                            value={formData.institution}
                            onChange={handleInputChange}
                            className="w-full bg-black border-2 border-zinc-700 text-white rounded-xl p-4 placeholder-zinc-600 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                            placeholder="Enter your school/college name"
                        />
                    </div>

                    {/* Interests */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-white mb-3">
                            <Heart className="h-4 w-4 text-emerald-400" />
                            Environmental Interests
                        </label>
                        <input
                            type="text"
                            name="interests"
                            value={formData.interests}
                            onChange={handleInputChange}
                            className="w-full bg-black border-2 border-zinc-700 text-white rounded-xl p-4 placeholder-zinc-600 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                            placeholder="e.g., Climate Change, Renewable Energy, Conservation"
                        />
                        <p className="text-xs text-gray-600 mt-2">Separate multiple interests with commas</p>
                    </div>

                    {/* Save Button */}
                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full mt-6 bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-500/50 text-[#04210f] py-4 rounded-xl font-bold text-lg transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] disabled:cursor-not-allowed flex items-center justify-center gap-3"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                Saving Changes...
                            </>
                        ) : (
                            <>
                                <Save className="h-5 w-5" />
                                Save Changes
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
