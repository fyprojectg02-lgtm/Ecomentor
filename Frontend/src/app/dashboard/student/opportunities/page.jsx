"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { 
  Briefcase, 
  Calendar, 
  MapPin, 
  Award,
  Clock,
  Users,
  CheckCircle,
  TrendingUp,
  Filter,
  Search,
  ArrowRight,
  Heart,
  Zap,
  Loader2,
  X
} from "lucide-react";

export default function NGOOpportunities() {
  const [opportunities, setOpportunities] = useState([]);
  const [filteredOpportunities, setFilteredOpportunities] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [studentPoints, setStudentPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [appliedOpportunities, setAppliedOpportunities] = useState(new Set());
  const [applyingId, setApplyingId] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: "", type: "" });

  useEffect(() => {
    fetchUser();
    fetchUserPoints();
    fetchOpportunities();
  }, []);

  useEffect(() => {
    filterOpportunities();
  }, [searchQuery, filterType, opportunities]);

  useEffect(() => {
    if (user) {
      checkAppliedOpportunities();
    }
  }, [user, opportunities]);

  const fetchUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
    }
  };

  const fetchUserPoints = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: student } = await supabase
          .from("students")
          .select("eco_points")
          .eq("id", user.id)
          .single();
        
        if (student) {
          setStudentPoints(student.eco_points || 0);
        }
      }
    } catch (error) {
      console.error("Error fetching user points:", error);
    }
  };

  const checkAppliedOpportunities = async () => {
    if (!user || opportunities.length === 0) return;

    try {
      const appliedSet = new Set();
      await Promise.all(
        opportunities.map(async (opp) => {
          const response = await fetch(
            `/api/opportunities/apply?studentId=${user.id}&opportunityId=${opp.id}`
          );
          const data = await response.json();
          if (data.success && data.hasApplied) {
            appliedSet.add(opp.id);
          }
        })
      );
      setAppliedOpportunities(appliedSet);
    } catch (error) {
      console.error("Error checking applied opportunities:", error);
    }
  };

  const fetchOpportunities = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/opportunities");
      const data = await response.json();
      
      if (data.success) {
        // Transform database format to match UI expectations
        const formattedOpportunities = data.opportunities.map(opp => ({
          id: opp.id,
          title: opp.title,
          ngo: opp.ngo_name,
          description: opp.description,
          duration: opp.duration,
          minPoints: opp.min_points,
          location: opp.location,
          type: opp.type,
          spots: opp.spots,
          category: opp.category,
          perks: opp.perks || [],
          deadline: opp.deadline
        }));
        setOpportunities(formattedOpportunities);
        setFilteredOpportunities(formattedOpportunities);
      } else {
        console.error("Error fetching opportunities:", data.error);
        setOpportunities([]);
        setFilteredOpportunities([]);
      }
    } catch (error) {
      console.error("Error fetching opportunities:", error);
      setOpportunities([]);
      setFilteredOpportunities([]);
    } finally {
      setLoading(false);
    }
  };

  const filterOpportunities = () => {
    let filtered = opportunities;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(opp => 
        opp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opp.ngo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opp.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Type filter
    if (filterType !== "all") {
      filtered = filtered.filter(opp => opp.type === filterType);
    }

    setFilteredOpportunities(filtered);
  };

  const isEligible = (minPoints) => studentPoints >= minPoints;

  const handleApply = async (opportunityId) => {
    if (!user) {
      showNotification("Please log in to apply", "error");
      return;
    }

    setApplyingId(opportunityId);
    try {
      const response = await fetch("/api/opportunities/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: user.id,
          opportunityId: opportunityId
        })
      });

      const data = await response.json();

      if (data.success) {
        setAppliedOpportunities(prev => new Set([...prev, opportunityId]));
        showNotification(data.message || "Application submitted successfully!", "success");
      } else {
        showNotification(data.error || "Failed to submit application", "error");
      }
    } catch (error) {
      console.error("Error applying:", error);
      showNotification("An error occurred. Please try again.", "error");
    } finally {
      setApplyingId(null);
    }
  };

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: "", type: "" });
    }, 5000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-emerald-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading opportunities...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Notification */}
        {notification.show && (
          <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 ${
            notification.type === "success" 
              ? "bg-emerald-500/90 text-white border border-emerald-400" 
              : "bg-red-500/90 text-white border border-red-400"
          }`}>
            {notification.type === "success" ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <X className="h-5 w-5" />
            )}
            <p className="font-semibold">{notification.message}</p>
            <button
              onClick={() => setNotification({ show: false, message: "", type: "" })}
              className="ml-2 hover:opacity-70"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">NGO Opportunities</h1>
            <p className="text-gray-400">
              Discover internships, volunteer programs, and more based on your EcoPoints
            </p>
          </div>
          <div className="bg-gradient-to-r from-emerald-900/20 to-emerald-800/20 border border-emerald-500/30 rounded-xl p-4">
            <p className="text-sm text-gray-400 mb-1">Your EcoPoints</p>
            <p className="text-3xl font-bold text-emerald-400">{studentPoints}</p>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-[#0f0f0f] rounded-2xl border border-[#1a1a1a] p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
              <input
                type="text"
                placeholder="Search opportunities, NGOs, categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-black border border-[#1a1a1a] text-white rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
              />
            </div>

            {/* Filter Dropdown */}
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-500" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-black border border-[#1a1a1a] text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none min-w-[150px]"
              >
                <option value="all">All Types</option>
                <option value="Internship">Internships</option>
                <option value="Volunteer">Volunteer</option>
                <option value="Ambassador">Ambassadors</option>
                <option value="Training">Training</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-[#0f0f0f] rounded-xl border border-[#1a1a1a] p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <Briefcase className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{filteredOpportunities.length}</p>
                <p className="text-sm text-gray-400">Total Opportunities</p>
              </div>
            </div>
          </div>

          <div className="bg-[#0f0f0f] rounded-xl border border-[#1a1a1a] p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <CheckCircle className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {filteredOpportunities.filter(o => isEligible(o.minPoints)).length}
                </p>
                <p className="text-sm text-gray-400">Eligible For You</p>
              </div>
            </div>
          </div>

          <div className="bg-[#0f0f0f] rounded-xl border border-[#1a1a1a] p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <Users className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {filteredOpportunities.reduce((sum, o) => sum + o.spots, 0)}
                </p>
                <p className="text-sm text-gray-400">Total Spots Available</p>
              </div>
            </div>
          </div>

          <div className="bg-[#0f0f0f] rounded-xl border border-[#1a1a1a] p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {filteredOpportunities.filter(o => !isEligible(o.minPoints)).length}
                </p>
                <p className="text-sm text-gray-400">Unlock Soon</p>
              </div>
            </div>
          </div>
        </div>

        {/* Opportunities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOpportunities.map((opp) => (
            <div
              key={opp.id}
              className={`bg-[#0f0f0f] rounded-2xl border overflow-hidden transition-all hover:shadow-2xl hover:scale-[1.02] ${
                isEligible(opp.minPoints)
                  ? "border-emerald-500/30 hover:border-emerald-500"
                  : "border-[#1a1a1a] hover:border-zinc-700"
              }`}
            >
              {/* Header Section */}
              <div className={`p-5 border-b ${
                isEligible(opp.minPoints) ? "border-emerald-500/30 bg-emerald-500/5" : "border-[#1a1a1a]"
              }`}>
                <div className="flex items-start justify-between mb-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    opp.type === "Internship" ? "bg-blue-500/15 text-blue-300 border border-blue-500/30" :
                    opp.type === "Volunteer" ? "bg-purple-500/15 text-purple-300 border border-purple-500/30" :
                    opp.type === "Ambassador" ? "bg-amber-500/15 text-amber-300 border border-amber-500/30" :
                    "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                  }`}>
                    {opp.type}
                  </span>
                  {isEligible(opp.minPoints) && (
                    <CheckCircle className="h-5 w-5 text-emerald-400" />
                  )}
                </div>
                <h3 className="text-xl font-bold text-white mb-1">{opp.title}</h3>
                <p className="text-sm text-gray-400">by <span className="text-emerald-400">{opp.ngo}</span></p>
              </div>

              {/* Content Section */}
              <div className="p-5 space-y-4">
                <p className="text-sm text-gray-300 leading-relaxed">{opp.description}</p>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Clock className="h-4 w-4 text-emerald-400" />
                    <span>{opp.duration}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <MapPin className="h-4 w-4 text-emerald-400" />
                    <span>{opp.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <Users className="h-4 w-4 text-emerald-400" />
                    <span>{opp.spots} spots</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <Calendar className="h-4 w-4 text-emerald-400" />
                    <span>Until {new Date(opp.deadline).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Category Badge */}
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-emerald-400" />
                  <span className="text-sm text-gray-400">{opp.category}</span>
                </div>

                {/* Perks */}
                <div>
                  <p className="text-xs text-gray-500 mb-2 font-semibold">PERKS:</p>
                  <div className="flex flex-wrap gap-2">
                    {opp.perks.map((perk, idx) => (
                      <span key={idx} className="px-2 py-1 bg-[#1a1a1a] border border-[#2a2a2a] text-xs text-gray-300 rounded-lg">
                        {perk}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Points Requirement */}
                <div className={`p-3 rounded-lg border ${
                  isEligible(opp.minPoints)
                    ? "bg-emerald-500/10 border-emerald-500/30"
                    : "bg-amber-500/10 border-amber-500/30"
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Required Points</p>
                      <p className="text-lg font-bold text-white">{opp.minPoints}</p>
                    </div>
                    {!isEligible(opp.minPoints) && (
                      <div className="text-right">
                        <p className="text-xs text-gray-400 mb-1">Need</p>
                        <p className="text-lg font-bold text-amber-300">
                          +{opp.minPoints - studentPoints}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Button */}
                {appliedOpportunities.has(opp.id) ? (
                  <button
                    disabled
                    className="w-full py-3 rounded-xl font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Applied
                  </button>
                ) : (
                  <button
                    onClick={() => handleApply(opp.id)}
                    disabled={!isEligible(opp.minPoints) || applyingId === opp.id}
                    className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                      isEligible(opp.minPoints) && applyingId !== opp.id
                        ? "bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                        : "bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed"
                    }`}
                  >
                    {applyingId === opp.id ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Applying...
                      </>
                    ) : isEligible(opp.minPoints) ? (
                      <>
                        Apply Now
                        <ArrowRight className="h-4 w-4" />
                      </>
                    ) : (
                      <>
                        Locked
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* No Results */}
        {filteredOpportunities.length === 0 && (
          <div className="text-center py-16">
            <Briefcase className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No opportunities found</h3>
            <p className="text-gray-400">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  );
}