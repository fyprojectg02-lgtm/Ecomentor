"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import {
  Lock,
  Mail,
  GraduationCap,
  BookOpen,
  Shield,
  Eye,
  EyeOff,
  Leaf
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [institution, setInstitution] = useState("");
  const [educationLevel, setEducationLevel] = useState("");
  const [role, setRole] = useState("student");
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

const handleAuth = async (e) => {
  e.preventDefault();
  setError(null);
  setIsLoading(true);

  try {
    if (isLogin) {
      // ============ SIGN IN ============
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      const { user } = data;

      // Fetch user profile to get role
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profileError) {
        throw new Error("Could not fetch user profile");
      }

      // Redirect based on role using else-if chain
      if (profile.role === "student") {
        router.push("/dashboard/student");
      } else if (profile.role === "teacher") {
        router.push("/dashboard/teacher");
      } else if (profile.role === "administrator") {
        router.push("/dashboard/admin");
      } else {
        throw new Error("Invalid user role");
      }
    } else {
      // ============ SIGN UP ============
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) throw error;

      const { user } = data;

      // Insert into profiles table
      const { error: profileError } = await supabase.from("profiles").insert({
        id: user.id,
        full_name: fullName,
        role,
      });

      if (profileError) {
        console.error("Profile insert error:", profileError);
        throw new Error("Failed to create profile: " + profileError.message);
      }

      // Insert into user_details table (institution and education level)
      const { error: detailsError } = await supabase.from("user_details").insert({
        user_id: user.id,
        institution,
        education_level: educationLevel,
      });

      if (detailsError) {
        console.error("User details insert error:", detailsError);
        throw new Error("Failed to save user details: " + detailsError.message);
      }

      alert("Signup successful! Please login.");
      setIsLogin(true);
      
      // Clear form fields
      setEmail("");
      setPassword("");
      setFullName("");
      setInstitution("");
      setEducationLevel("");
      setRole("student");
    }
  } catch (err) {
    setError(err.message || "An error occurred");
    console.error("Auth error:", err);
  } finally {
    setIsLoading(false);
  }
};

  const roleIcons = {
    student: <GraduationCap className="w-5 h-5" />,
    teacher: <BookOpen className="w-5 h-5" />,
    administrator: <Shield className="w-5 h-5" />
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#050505]">
      {/* Background glow */}
      <div className="absolute inset-0 flex items-center justify-center opacity-50 pointer-events-none">
        <div className="w-[760px] h-[760px] rounded-full bg-emerald-500/15 blur-[150px]" />
      </div>

      <div className="w-full max-w-lg relative z-10">
        <div className="border border-emerald-900/50 rounded-3xl bg-[#0c0f0d] backdrop-blur-xl shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
          {/* Header */}
          <div className="p-10 text-center space-y-3">
            <div className="flex items-center justify-center">
              <div className="h-14 w-14 rounded-full bg-emerald-400/20 flex items-center justify-center shadow-inner shadow-emerald-600/40">
                <Leaf className="h-7 w-7 text-emerald-400" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white">
              {isLogin ? "Welcome to EcoMentor" : "Create your EcoMentor account"}
            </h2>
            <p className="text-sm text-emerald-100/70">
              {isLogin
                ? "Sign in to continue your learning journey"
                : "Join to start your sustainability journey"}
            </p>
          </div>

          {/* Form */}
          <div className="px-10 pb-10">
            <div className="space-y-4">
              {!isLogin && (
                <div className="space-y-1">
                  <label className="text-emerald-50 text-sm font-semibold block">Full Name</label>
                  <input
                    type="text"
                    placeholder="Your full name"
                    className="w-full px-4 py-3 bg-[#0a0d0b] border border-emerald-900/60 rounded-xl text-emerald-50 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:border-emerald-400"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-emerald-50 text-sm font-semibold block">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-400/80" />
                  <input
                    type="email"
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-3 bg-[#0a0d0b] border border-emerald-900/60 rounded-xl text-emerald-50 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:border-emerald-400"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-emerald-50 text-sm font-semibold block">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-400/80" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-12 py-3 bg-[#0a0d0b] border border-emerald-900/60 rounded-xl text-emerald-50 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:border-emerald-400"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400/80 hover:text-emerald-300"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Signup-only fields */}
              {!isLogin && (
                <>
                  <div className="space-y-1">
                    <label className="text-emerald-50 text-sm font-semibold block">Institution Name</label>
                    <input
                      type="text"
                      placeholder="Your school or university"
                      className="w-full px-4 py-3 bg-[#0a0d0b] border border-emerald-900/60 rounded-xl text-emerald-50 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:border-emerald-400"
                      value={institution}
                      onChange={(e) => setInstitution(e.target.value)}
                      required
                    />
                  </div>

                  {role === "student" && (
                    <div className="space-y-1">
                      <label className="text-emerald-50 text-sm font-semibold block">Education Level</label>
                      <select
                        className="w-full px-4 py-3 bg-[#0a0d0b] border border-emerald-900/60 rounded-xl text-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:border-emerald-400"
                        value={educationLevel}
                        onChange={(e) => setEducationLevel(e.target.value)}
                        required
                      >
                        <option value="" disabled>Select level</option>
                        {[...Array(12)].map((_, i) => (
                          <option key={i + 1} value={`Grade ${i + 1}`}>Grade {i + 1}</option>
                        ))}
                        <option value="College/University">College/University</option>
                      </select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-emerald-50 text-sm font-semibold block">Select Your Role</label>
                    <div className="grid grid-cols-2 gap-3">
                      {["student", "teacher"].map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setRole(r)}
                          className={`p-3 rounded-xl border transition-all flex flex-col items-center gap-2 ${
                            role === r
                              ? "border-emerald-400 bg-emerald-900/30 shadow-sm"
                              : "border-emerald-900/60 bg-[#0a0d0b] hover:bg-emerald-900/20"
                          }`}
                        >
                          <div className={`${role === r ? "text-emerald-300" : "text-gray-400"}`}>
                            {roleIcons[r]}
                          </div>
                          <span className={`text-xs font-semibold capitalize ${role === r ? "text-emerald-200" : "text-gray-400"}`}>
                            {r}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Error message */}
              {error && (
                <div className="bg-red-500/10 border border-red-400/60 rounded-xl p-3">
                  <p className="text-red-200 text-sm text-center font-medium">{error}</p>
                </div>
              )}

              {/* Submit */}
              <button
                type="button"
                onClick={handleAuth}
                disabled={isLoading}
                className="w-full bg-[#00ff63] hover:bg-[#00e65a] text-[#033015] font-semibold py-3 rounded-xl shadow-[0_15px_35px_rgba(0,255,99,0.35)] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? "Processing..." : isLogin ? "Sign In" : "Create Account"}
              </button>

              {/* Toggle */}
              <div className="text-center text-sm text-gray-300">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError(null);
                  }}
                  className="text-[#00ff63] font-semibold hover:underline"
                >
                  {isLogin ? "Sign up" : "Sign in"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
