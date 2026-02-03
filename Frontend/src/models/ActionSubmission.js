import mongoose from 'mongoose';

const ActionSubmissionSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  studentName: {
    type: String,
    required: true
  },
  classroomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Classroom',
    default: null
  },
  actionType: {
    type: String,
    required: true,
    enum: [
      'Tree Planting',
      'Beach Cleanup',
      'Waste Recycling',
      'Energy Conservation',
      'Water Conservation',
      'Community Education',
      'Sustainable Transport',
      'Other'
    ]
  },
  description: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  estimatedImpact: {
    type: String,
    default: ''
  },
  images: [{
    type: String // Base64 or URL
  }],
  status: {
    type: String,
    enum: ['pending_review', 'ai_flagged', 'approved', 'rejected'],
    default: 'pending_review'
  },
  autoApproved: {
    type: Boolean,
    default: false
  },
  aiVerification: {
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      required: true
    },
    verified: {
      type: Boolean,
      required: true
    },
    reasoning: {
      type: String,
      required: true
    },
    suggestedPoints: {
      type: Number,
      required: true
    },
    flaggedIssues: [{
      type: String
    }]
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  reviewedAt: {
    type: Date,
    default: null
  },
  reviewedBy: {
    type: String,
    default: null
  },
  teacherNotes: {
    type: String,
    default: ''
  },
  finalPoints: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for better query performance
ActionSubmissionSchema.index({ studentId: 1, status: 1 });
ActionSubmissionSchema.index({ classroomId: 1, status: 1 });
ActionSubmissionSchema.index({ submittedAt: -1 });

export default mongoose.models.ActionSubmission || mongoose.model('ActionSubmission', ActionSubmissionSchema);
