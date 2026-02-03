"use client";
import { useState } from "react";
import { 
  Upload, 
  Camera, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  X,
  FileText,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  Eye,
  Filter,
  Search
} from "lucide-react";

// =============================================
// STUDENT SUBMISSION COMPONENT
// =============================================
export function StudentActionSubmission({ studentId, onSubmitSuccess }) {
  const [formData, setFormData] = useState({
    actionType: "",
    description: "",
    location: "",
    date: new Date().toISOString().split('T')[0],
    estimatedImpact: ""
  });
  const [images, setImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewUrls, setPreviewUrls] = useState([]);

  const actionTypes = [
    "Tree Planting",
    "Beach Cleanup",
    "Waste Recycling",
    "Energy Conservation",
    "Water Conservation",
    "Community Education",
    "Sustainable Transport",
    "Other"
  ];

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + images.length > 5) {
      alert("Maximum 5 images allowed");
      return;
    }

    setImages([...images, ...files]);
    
    // Create preview URLs
    const newPreviewUrls = files.map(file => URL.createObjectURL(file));
    setPreviewUrls([...previewUrls, ...newPreviewUrls]);
  };

  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = previewUrls.filter((_, i) => i !== index);
    URL.revokeObjectURL(previewUrls[index]);
    setImages(newImages);
    setPreviewUrls(newPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Convert images to base64
      const imagePromises = images.map(file => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      });

      const base64Images = await Promise.all(imagePromises);

      // Call AI verification API
      const response = await fetch("/api/verify-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          ...formData,
          images: base64Images
        })
      });

      const result = await response.json();

      if (result.success) {
        alert(`Submission successful! Status: ${result.status}\n${result.aiVerification.message}`);
        onSubmitSuccess?.();
        // Reset form
        setFormData({
          actionType: "",
          description: "",
          location: "",
          date: new Date().toISOString().split('T')[0],
          estimatedImpact: ""
        });
        setImages([]);
        setPreviewUrls([]);
      }
    } catch (error) {
      console.error("Submission error:", error);
      alert("Failed to submit action. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-[#0f0f0f] rounded-2xl border border-[#1a1a1a]">
      <h2 className="text-2xl font-bold text-white mb-6">Submit Eco-Action</h2>
      
      <div className="space-y-6">
        {/* Action Type */}
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">
            Action Type *
          </label>
          <select
            value={formData.actionType}
            onChange={(e) => setFormData({...formData, actionType: e.target.value})}
            className="w-full bg-black border border-[#1a1a1a] text-white rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 outline-none"
          >
            <option value="">Select action type</option>
            {actionTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">
            Description *
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            placeholder="Describe your eco-action in detail..."
            rows={4}
            className="w-full bg-black border border-[#1a1a1a] text-white rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
          />
        </div>

        {/* Location and Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Location *
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
              placeholder="City, State"
              className="w-full bg-black border border-[#1a1a1a] text-white rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Date *
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
              className="w-full bg-black border border-[#1a1a1a] text-white rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
        </div>

        {/* Estimated Impact */}
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">
            Estimated Impact
          </label>
          <input
            type="text"
            value={formData.estimatedImpact}
            onChange={(e) => setFormData({...formData, estimatedImpact: e.target.value})}
            placeholder="e.g., 10 trees planted, 50kg waste collected"
            className="w-full bg-black border border-[#1a1a1a] text-white rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>

        {/* Image Upload */}
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">
            Upload Photos * (Max 5)
          </label>
          
          <div className="border-2 border-dashed border-[#1a1a1a] rounded-xl p-6 text-center hover:border-emerald-500/50 transition-colors">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
              id="image-upload"
              disabled={images.length >= 5}
            />
            <label htmlFor="image-upload" className="cursor-pointer block">
              <Camera className="h-12 w-12 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-400 mb-1">Click to upload images</p>
              <p className="text-xs text-gray-600">PNG, JPG up to 10MB</p>
            </label>
          </div>

          {/* Image Previews */}
          {previewUrls.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
              {previewUrls.map((url, index) => (
                <div key={index} className="relative group">
                  <img 
                    src={url} 
                    alt={`Preview ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg border border-[#1a1a1a]"
                  />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 bg-red-500 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || images.length === 0 || !formData.actionType || !formData.description}
          className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-gray-700 disabled:cursor-not-allowed text-black font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Upload className="h-5 w-5" />
              Submit for Verification
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// =============================================
// TEACHER REVIEW QUEUE COMPONENT
// =============================================
export function TeacherReviewQueue() {
  const [submissions, setSubmissions] = useState([
    {
      id: "sub_1",
      studentName: "Alex Kumar",
      studentId: "student_123",
      actionType: "Tree Planting",
      description: "Planted 15 saplings in the school garden with the environmental club",
      location: "Mumbai, Maharashtra",
      date: "2025-12-10",
      estimatedImpact: "15 trees planted",
      images: ["https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=400"],
      status: "pending_review",
      submittedAt: "2025-12-10T10:30:00Z",
      aiVerification: {
        confidence: 0.85,
        verified: true,
        reasoning: "Images show students planting trees in a garden setting. Action description matches visual evidence. Estimated impact is reasonable.",
        suggestedPoints: 150,
        flaggedIssues: []
      }
    },
    {
      id: "sub_2",
      studentName: "Priya Sharma",
      studentId: "student_124",
      actionType: "Beach Cleanup",
      description: "Organized beach cleanup drive at Juhu Beach",
      location: "Mumbai, Maharashtra",
      date: "2025-12-09",
      estimatedImpact: "50kg waste collected",
      images: ["https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=400"],
      status: "ai_flagged",
      submittedAt: "2025-12-09T14:20:00Z",
      aiVerification: {
        confidence: 0.62,
        verified: false,
        reasoning: "Image quality is unclear. Unable to verify waste collection quantities. Requires manual review.",
        suggestedPoints: 100,
        flaggedIssues: ["Low image quality", "Unverifiable quantities"]
      }
    }
  ]);

  const [filter, setFilter] = useState("all");
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  const handleApprove = async (submissionId, points) => {
    try {
      const response = await fetch("/api/review-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId,
          action: "approve",
          points,
          teacherNotes: ""
        })
      });

      const result = await response.json();
      if (result.success) {
        setSubmissions(prev => prev.filter(s => s.id !== submissionId));
        setSelectedSubmission(null);
        alert("Action approved successfully!");
      }
    } catch (error) {
      console.error("Approval error:", error);
      alert("Failed to approve action");
    }
  };

  const handleReject = async (submissionId, reason) => {
    try {
      const response = await fetch("/api/review-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId,
          action: "reject",
          teacherNotes: reason
        })
      });

      const result = await response.json();
      if (result.success) {
        setSubmissions(prev => prev.filter(s => s.id !== submissionId));
        setSelectedSubmission(null);
        alert("Action rejected");
      }
    } catch (error) {
      console.error("Rejection error:", error);
      alert("Failed to reject action");
    }
  };

  const filteredSubmissions = submissions.filter(sub => {
    if (filter === "all") return true;
    if (filter === "flagged") return sub.status === "ai_flagged";
    if (filter === "pending") return sub.status === "pending_review";
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white">Action Review Queue</h2>
          <p className="text-gray-400 mt-1">Review and approve student submissions</p>
        </div>
        
        {/* Filter */}
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="bg-black border border-[#1a1a1a] text-white rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none"
        >
          <option value="all">All Submissions ({submissions.length})</option>
          <option value="flagged">AI Flagged ({submissions.filter(s => s.status === "ai_flagged").length})</option>
          <option value="pending">Pending Review ({submissions.filter(s => s.status === "pending_review").length})</option>
        </select>
      </div>

      {/* Submissions List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredSubmissions.map((submission) => (
          <div
            key={submission.id}
            className={`bg-[#0f0f0f] rounded-2xl border p-6 transition-all hover:shadow-lg ${
              submission.status === "ai_flagged"
                ? "border-amber-500/50"
                : "border-[#1a1a1a]"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              {/* Left Section */}
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold text-white">{submission.studentName}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    submission.status === "ai_flagged"
                      ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                      : "bg-blue-500/15 text-blue-300 border border-blue-500/30"
                  }`}>
                    {submission.status === "ai_flagged" ? "AI Flagged" : "Pending Review"}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span className="font-semibold text-emerald-400">{submission.actionType}</span>
                  <span>•</span>
                  <span>{submission.location}</span>
                  <span>•</span>
                  <span>{new Date(submission.date).toLocaleDateString()}</span>
                </div>

                <p className="text-gray-300">{submission.description}</p>

                {submission.estimatedImpact && (
                  <p className="text-sm text-gray-400">
                    <span className="font-semibold">Impact:</span> {submission.estimatedImpact}
                  </p>
                )}

                {/* AI Verification Summary */}
                <div className={`p-4 rounded-xl border ${
                  submission.aiVerification.verified
                    ? "bg-emerald-500/5 border-emerald-500/30"
                    : "bg-amber-500/5 border-amber-500/30"
                }`}>
                  <div className="flex items-start gap-3">
                    {submission.aiVerification.verified ? (
                      <CheckCircle className="h-5 w-5 text-emerald-400 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-amber-400 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="font-semibold text-white mb-1">
                        AI Confidence: {(submission.aiVerification.confidence * 100).toFixed(0)}%
                      </p>
                      <p className="text-sm text-gray-300">{submission.aiVerification.reasoning}</p>
                      {submission.aiVerification.flaggedIssues.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-400 mb-1">Flagged Issues:</p>
                          <div className="flex flex-wrap gap-2">
                            {submission.aiVerification.flaggedIssues.map((issue, idx) => (
                              <span key={idx} className="px-2 py-1 bg-amber-500/20 text-amber-300 text-xs rounded-lg">
                                {issue}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      <p className="text-sm text-gray-400 mt-2">
                        Suggested Points: <span className="font-bold text-emerald-400">{submission.aiVerification.suggestedPoints}</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Section - Images & Actions */}
              <div className="w-48 space-y-3">
                {/* Image Preview */}
                {submission.images.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {submission.images.slice(0, 4).map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt={`Evidence ${idx + 1}`}
                        className="w-full h-20 object-cover rounded-lg border border-[#1a1a1a] cursor-pointer hover:border-emerald-500 transition-colors"
                        onClick={() => setSelectedSubmission(submission)}
                      />
                    ))}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-2">
                  <button
                    onClick={() => setSelectedSubmission(submission)}
                    className="w-full bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    Review
                  </button>
                  <button
                    onClick={() => handleApprove(submission.id, submission.aiVerification.suggestedPoints)}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-black py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <ThumbsUp className="h-4 w-4" />
                    Approve
                  </button>
                  <button
                    onClick={() => {
                      const reason = prompt("Reason for rejection:");
                      if (reason) handleReject(submission.id, reason);
                    }}
                    className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <ThumbsDown className="h-4 w-4" />
                    Reject
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detailed Review Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-6 z-50">
          <div className="bg-[#0f0f0f] rounded-2xl border border-[#1a1a1a] max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-white">Detailed Review</h3>
                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Full Images */}
              <div className="grid grid-cols-2 gap-4">
                {selectedSubmission.images.map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`Evidence ${idx + 1}`}
                    className="w-full h-64 object-cover rounded-xl border border-[#1a1a1a]"
                  />
                ))}
              </div>

              {/* Full Details */}
              <div className="space-y-4 text-gray-300">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Student</p>
                  <p className="font-semibold text-white">{selectedSubmission.studentName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Action Type</p>
                  <p className="font-semibold text-white">{selectedSubmission.actionType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Description</p>
                  <p>{selectedSubmission.description}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">AI Analysis</p>
                  <p>{selectedSubmission.aiVerification.reasoning}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => handleApprove(selectedSubmission.id, selectedSubmission.aiVerification.suggestedPoints)}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black py-3 rounded-xl font-bold transition-colors"
                >
                  Approve
                </button>
                <button
                  onClick={() => {
                    const reason = prompt("Reason for rejection:");
                    if (reason) handleReject(selectedSubmission.id, reason);
                  }}
                  className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 py-3 rounded-xl font-bold transition-colors"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================
// MAIN DEMO COMPONENT
// =============================================
export default function AIActionVerificationDemo() {
  const [view, setView] = useState("student");

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-8">
      {/* View Switcher */}
      <div className="max-w-7xl mx-auto px-6 mb-6">
        <div className="flex gap-4">
          <button
            onClick={() => setView("student")}
            className={`px-6 py-3 rounded-xl font-bold transition-colors ${
              view === "student"
                ? "bg-emerald-500 text-black"
                : "bg-[#1a1a1a] text-gray-400 hover:text-white"
            }`}
          >
            Student View
          </button>
          <button
            onClick={() => setView("teacher")}
            className={`px-6 py-3 rounded-xl font-bold transition-colors ${
              view === "teacher"
                ? "bg-emerald-500 text-black"
                : "bg-[#1a1a1a] text-gray-400 hover:text-white"
            }`}
          >
            Teacher View
          </button>
        </div>
      </div>

      {/* Content */}
      {view === "student" ? (
        <StudentActionSubmission 
          studentId="student_123"
          onSubmitSuccess={() => alert("Submission recorded!")}
        />
      ) : (
        <TeacherReviewQueue />
      )}
    </div>
  );
}