import mongoose from 'mongoose';

const StudentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  classroomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Classroom',
    default: null
  },
  ecoPoints: {
    type: Number,
    default: 0
  },
  completedTasks: {
    type: Number,
    default: 0
  },
  pendingSubmissions: {
    type: Number,
    default: 0
  },
  level: {
    type: String,
    enum: ['school', 'college'],
    default: 'school'
  },
  rank: {
    type: Number,
    default: 0
  },
  interests: [{
    type: String
  }],
  environmentalImpact: {
    co2Saved: {
      type: Number,
      default: 0
    },
    treesPlanted: {
      type: Number,
      default: 0
    },
    plasticReduced: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Indexes
StudentSchema.index({ email: 1 });
StudentSchema.index({ classroomId: 1 });
StudentSchema.index({ ecoPoints: -1 }); // For leaderboard

export default mongoose.models.Student || mongoose.model('Student', StudentSchema);