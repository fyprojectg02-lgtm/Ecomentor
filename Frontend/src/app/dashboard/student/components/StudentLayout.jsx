"use client";
import { useState, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import {
  Home,
  Brain,
  BookOpen,
  Trophy,
  MessageSquare,
  Briefcase,
  User,
  Bell,
  LogOut,
  Leaf,
  Bot,
  Target,
  Sparkles,
  Gamepad2,
  Upload
} from "lucide-react";

export default function StudentLayout({ children }) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const showEcoBot = searchParams.get("chat") === "true";
  const [ecoBotInput, setEcoBotInput] = useState("");
  const [chatMessages, setChatMessages] = useState([]);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = () => {
    // Mock data
    setNotifications([
      { id: 1, message: "Your tree planting submission was approved! +150 points", time: "2 hours ago", read: false },
      { id: 2, message: "New opportunity: Green Peace Internship", time: "5 hours ago", read: false },
      { id: 3, message: "You've reached Rank 12 on the leaderboard!", time: "1 day ago", read: true }
    ]);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const sendEcoBotMessage = async () => {
    if (!ecoBotInput.trim()) return;

    const userMessage = ecoBotInput.trim();
    setChatMessages(prev => [...prev, { text: userMessage, sender: "user", time: new Date() }]);
    setEcoBotInput("");

    // Show loading state
    const loadingMessage = { text: "...", sender: "bot", time: new Date(), loading: true };
    setChatMessages(prev => [...prev, loadingMessage]);

    try {
      // Get user ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not found");
      }

      // Prepare chat history for API
      const history = chatMessages
        .filter(m => m.sender === "user" || m.sender === "bot")
        .map(msg => ({
          role: msg.sender === "user" ? "user" : "model",
          parts: [{ text: msg.text }]
        }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          history: history,
          userId: user.id
        })
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();

      // Remove loading message and add bot response
      setChatMessages(prev => {
        const filtered = prev.filter(m => !m.loading);
        return [...filtered, {
          text: data.reply || "Sorry, I'm having trouble connecting right now.",
          sender: "bot",
          time: new Date()
        }];
      });
    } catch (error) {
      console.error("Error sending message to EcoBot:", error);
      // Remove loading message and add error message
      setChatMessages(prev => {
        const filtered = prev.filter(m => !m.loading);
        return [...filtered, {
          text: "Sorry, I'm having trouble connecting right now. Please try again later.",
          sender: "bot",
          time: new Date()
        }];
      });
    }
  };

  const getActiveTab = () => {
    const tabParam = searchParams.get("tab");
    if (tabParam) return tabParam;

    if (pathname === "/dashboard/student") return "home";
    if (pathname?.includes("learning")) return "learning-paths";
    if (pathname?.includes("community")) return "community";
    if (pathname?.includes("tasks")) return "tasks";
    if (pathname?.includes("quiz")) return "quiz";
    if (pathname?.includes("games")) return "games";
    if (pathname?.includes("leaderboard")) return "leaderboard";
    if (pathname?.includes("opportunities")) return "opportunities";
    if (pathname?.includes("profile")) return "profile";
    if (pathname?.includes("submit-action")) return "submit-action";
    return "home";
  };

  const toggleEcoBot = (open) => {
    const params = new URLSearchParams(searchParams.toString());
    if (open) {
      params.set("chat", "true");
    } else {
      params.delete("chat");
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const activeTab = getActiveTab();

  const sidebarItems = [
    { id: "home", label: "Dashboard", icon: Home, href: "/dashboard/student" },
    { id: "learning-paths", label: "Learning Paths", icon: Sparkles, href: "/dashboard/student?tab=learning-paths" },
    { id: "tasks", label: "Recommended Tasks", icon: Target, href: "/dashboard/student?tab=tasks" },
    { id: "quiz", label: "AI Quizzes", icon: Brain, href: "/dashboard/student?tab=quiz" },
    { id: "games", label: "Games", icon: Gamepad2, href: "/dashboard/student/games" },
    { id: "leaderboard", label: "Leaderboard", icon: Trophy, href: "/dashboard/student?tab=leaderboard" },
    { id: "community", label: "Community", icon: MessageSquare, href: "/dashboard/student/community" },
    { id: "opportunities", label: "Opportunities", icon: Briefcase, href: "/dashboard/student/opportunities" },
    { id: "submit-action", label: "Submit Eco-Action", icon: Upload, href: "/dashboard/student/submit-action" },
    { id: "profile", label: "Profile", icon: User, href: "/dashboard/student/profile" },
  ];

  return (
    <div className="min-h-screen bg-[#060606] text-gray-100 flex overflow-hidden">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#0b0b0b] border-r border-[#111] h-screen sticky top-0">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <Leaf className="text-emerald-500" size={28} />
            <h1 className="text-2xl font-semibold text-white">EcoMentor</h1>
          </div>

          <nav className="space-y-2">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive ? "bg-emerald-600 text-white" : "text-gray-300 hover:bg-[#111]"
                    }`}
                >
                  <Icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto p-4 border-t border-[#111]">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors font-medium"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto">
        {/* Mobile Nav Placeholder or Unified Navbar */}
        <header className="lg:hidden bg-[#0b0b0b] border-b border-[#111] p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Leaf className="text-emerald-500" size={28} />
            <span className="text-xl font-semibold text-white">EcoMentor</span>
          </div>
          {/* Mobile menu button could go here */}
        </header>

        <div className="p-6 space-y-6">
          {/* Top Navigation Bar / Breadcrumbs / Actions */}
          <nav className="bg-[#0b0b0b] border border-[#111] rounded-xl px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4 text-sm text-gray-400">
              Dashboard / <span className="text-white capitalize">{activeTab.replace("-", " ")}</span>
            </div>

            <div className="flex items-center gap-4">

              <div className="h-8 w-[1px] bg-[#111] mx-2" />

              <div className="flex items-center gap-3 px-2">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 font-bold text-xs">
                  {(user?.user_metadata?.full_name || user?.email || "U").substring(0, 2).toUpperCase()}
                </div>
                <div className="hidden sm:block">
                  <p className="text-xs font-medium text-white">
                    {user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Eco Student"}
                  </p>
                  <p className="text-[10px] text-gray-500">{user?.email}</p>
                </div>
              </div>
            </div>
          </nav>

          {/* Page Content */}
          <main>
            {children}
          </main>
        </div>
      </div>

      {/* EcoBot Floating Button */}
      <button
        onClick={() => toggleEcoBot(!showEcoBot)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-emerald-500 hover:bg-emerald-400 text-[#04210f] font-bold rounded-full shadow-lg shadow-emerald-500/30 flex items-center justify-center transition-transform hover:scale-110 z-40"
      >
        <Bot size={24} />
      </button>

      {/* EcoBot Chat Window */}
      {showEcoBot && (
        <div className="fixed bottom-24 right-6 w-96 bg-[#0f0f0f] rounded-lg shadow-2xl border border-[#1a1a1a] overflow-hidden z-50">
          <div className="bg-emerald-600 text-white p-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Bot size={22} />
              <h3 className="font-bold">EcoBot Assistant</h3>
            </div>
            <button
              onClick={() => toggleEcoBot(false)}
              className="text-white hover:text-gray-200"
            >
              ✕
            </button>
          </div>

          <div className="h-96 overflow-y-auto p-4 space-y-3 bg-[#0b0b0b]">
            <div className="flex justify-start">
              <div className="max-w-xs p-3 rounded-lg bg-[#111] border border-[#1a1a1a] shadow-sm text-gray-100">
                <p className="text-sm">Hi! I'm EcoBot 🌱 Ask me about your progress, learning paths, or eco-actions!</p>
              </div>
            </div>

            {chatMessages.filter(m => m.sender === "user" || m.sender === "bot").map((msg, idx) => (
              <div key={idx} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-xs p-3 rounded-lg ${msg.sender === "user"
                  ? "bg-emerald-500 text-[#04210f]"
                  : "bg-[#111] text-gray-100 border border-[#1a1a1a]"
                  }`}>
                  {msg.loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-[#1a1a1a] p-3 bg-[#0f0f0f]">
            <div className="flex gap-2">
              <input
                type="text"
                value={ecoBotInput}
                onChange={(e) => setEcoBotInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && sendEcoBotMessage()}
                className="flex-1 border border-[#1a1a1a] bg-[#0b0b0b] text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Ask EcoBot..."
              />
              <button
                onClick={sendEcoBotMessage}
                className="bg-emerald-500 hover:bg-emerald-400 text-[#04210f] px-4 py-2 rounded-lg transition-colors text-sm font-semibold"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

