"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Briefcase,
  Save,
  X,
  CheckCircle,
  Loader2,
  Trash2,
  Edit
} from "lucide-react";

export default function ManageOpportunities() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [opportunities, setOpportunities] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    ngoName: "",
    description: "",
    duration: "",
    minPoints: 0,
    location: "",
    type: "Internship",
    spots: 1,
    category: "",
    perks: [],
    deadline: ""
  });
  const [perkInput, setPerkInput] = useState("");

  useEffect(() => {
    fetchUser();
    fetchOpportunities();
  }, []);

  const fetchUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUser(user);
    } else {
      router.push("/login");
    }
  };

  const fetchOpportunities = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/opportunities");
      const data = await response.json();
      
      if (data.success) {
        // Filter to show only opportunities created by this teacher
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const teacherOpportunities = data.opportunities.filter(
            opp => opp.teacher_id === user.id
          );
          setOpportunities(teacherOpportunities);
        }
      }
    } catch (error) {
      console.error("Error fetching opportunities:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "minPoints" || name === "spots" ? parseInt(value) || 0 : value
    }));
  };

  const addPerk = () => {
    if (perkInput.trim()) {
      setFormData(prev => ({
        ...prev,
        perks: [...prev.perks, perkInput.trim()]
      }));
      setPerkInput("");
    }
  };

  const removePerk = (index) => {
    setFormData(prev => ({
      ...prev,
      perks: prev.perks.filter((_, i) => i !== index)
    }));
  };

  const resetForm = () => {
    setFormData({
      title: "",
      ngoName: "",
      description: "",
      duration: "",
      minPoints: 0,
      location: "",
      type: "Internship",
      spots: 1,
      category: "",
      perks: [],
      deadline: ""
    });
    setPerkInput("");
    setShowForm(false);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) return;

    setSaving(true);
    try {
      const response = await fetch("/api/opportunities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacherId: user.id,
          ...formData,
          ngoName: formData.ngoName
        })
      });

      const data = await response.json();

      if (data.success) {
        alert("Opportunity created successfully!");
        resetForm();
        fetchOpportunities();
      } else {
        alert("Error: " + data.error);
      }
    } catch (error) {
      console.error("Error creating opportunity:", error);
      alert("Failed to create opportunity");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this opportunity?")) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Note: We'll need to add a DELETE endpoint or use Supabase directly
      // For now, we'll mark it as inactive
      const { error } = await supabase
        .from("ngo_opportunities")
        .update({ is_active: false })
        .eq("id", id)
        .eq("teacher_id", user.id);

      if (error) throw error;
      
      alert("Opportunity deleted successfully!");
      fetchOpportunities();
    } catch (error) {
      console.error("Error deleting opportunity:", error);
      alert("Failed to delete opportunity");
    }
  };

  return (
    <div className="min-h-screen bg-[#060606] text-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/teacher"
              className="p-2 hover:bg-[#0f0f0f] rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <p className="text-sm uppercase tracking-wide text-emerald-400">Teacher Portal</p>
              <h1 className="text-4xl font-bold text-white mt-1">Manage NGO Opportunities</h1>
              <p className="text-gray-400 mt-2">
                Create and manage opportunities for students
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#04210f] font-semibold transition-colors shadow-[0_10px_30px_rgba(16,185,129,0.35)] flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            {showForm ? "Cancel" : "Add Opportunity"}
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-[#0f0f0f] rounded-2xl border border-[#1a1a1a] p-6 mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">Create New Opportunity</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-black border border-[#1a1a1a] text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                    placeholder="e.g., Green Peace Internship"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    NGO Name *
                  </label>
                  <input
                    type="text"
                    name="ngoName"
                    value={formData.ngoName}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-black border border-[#1a1a1a] text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                    placeholder="e.g., GreenPeace"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Type *
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-black border border-[#1a1a1a] text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  >
                    <option value="Internship">Internship</option>
                    <option value="Volunteer">Volunteer</option>
                    <option value="Ambassador">Ambassador</option>
                    <option value="Training">Training</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Category *
                  </label>
                  <input
                    type="text"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-black border border-[#1a1a1a] text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                    placeholder="e.g., Climate Action"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Duration *
                  </label>
                  <input
                    type="text"
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-black border border-[#1a1a1a] text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                    placeholder="e.g., 3 months"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Location *
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-black border border-[#1a1a1a] text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                    placeholder="e.g., Remote"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Minimum Points *
                  </label>
                  <input
                    type="number"
                    name="minPoints"
                    value={formData.minPoints}
                    onChange={handleInputChange}
                    required
                    min="0"
                    className="w-full bg-black border border-[#1a1a1a] text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Available Spots *
                  </label>
                  <input
                    type="number"
                    name="spots"
                    value={formData.spots}
                    onChange={handleInputChange}
                    required
                    min="1"
                    className="w-full bg-black border border-[#1a1a1a] text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Deadline *
                  </label>
                  <input
                    type="date"
                    name="deadline"
                    value={formData.deadline}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-black border border-[#1a1a1a] text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  className="w-full bg-black border border-[#1a1a1a] text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  placeholder="Describe the opportunity..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Perks
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={perkInput}
                    onChange={(e) => setPerkInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addPerk())}
                    className="flex-1 bg-black border border-[#1a1a1a] text-white rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                    placeholder="e.g., Certificate"
                  />
                  <button
                    type="button"
                    onClick={addPerk}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-[#04210f] rounded-xl font-semibold transition-colors"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.perks.map((perk, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-lg text-sm flex items-center gap-2"
                    >
                      {perk}
                      <button
                        type="button"
                        onClick={() => removePerk(index)}
                        className="hover:text-red-400"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-[#04210f] rounded-xl font-semibold transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5" />
                      Create Opportunity
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-3 bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white rounded-xl font-semibold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Opportunities List */}
        <div className="bg-[#0f0f0f] rounded-2xl border border-[#1a1a1a] p-6">
          <h2 className="text-2xl font-bold text-white mb-6">Your Opportunities</h2>
          
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 text-emerald-400 animate-spin mx-auto mb-4" />
              <p className="text-gray-400">Loading opportunities...</p>
            </div>
          ) : opportunities.length === 0 ? (
            <div className="text-center py-12">
              <Briefcase className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No opportunities yet</h3>
              <p className="text-gray-400 mb-4">Create your first opportunity to get started</p>
              <button
                onClick={() => setShowForm(true)}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#04210f] font-semibold transition-colors"
              >
                Create Opportunity
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {opportunities.map((opp) => (
                <div
                  key={opp.id}
                  className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-5 hover:border-emerald-500/30 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      {opp.type}
                    </span>
                    {opp.is_active ? (
                      <span className="px-2 py-1 rounded text-xs bg-green-500/15 text-green-300">
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded text-xs bg-gray-500/15 text-gray-300">
                        Inactive
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">{opp.title}</h3>
                  <p className="text-sm text-gray-400 mb-2">by {opp.ngo_name}</p>
                  <p className="text-sm text-gray-300 mb-4 line-clamp-2">{opp.description}</p>
                  <div className="space-y-2 text-sm text-gray-400 mb-4">
                    <div>📍 {opp.location}</div>
                    <div>⏱️ {opp.duration}</div>
                    <div>👥 {opp.spots} spots</div>
                    <div>⭐ {opp.min_points} min points</div>
                    <div>📅 Deadline: {new Date(opp.deadline).toLocaleDateString()}</div>
                  </div>
                  <button
                    onClick={() => handleDelete(opp.id)}
                    className="w-full px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

