import mongoose from 'mongoose';

const StudentActionSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  submissionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ActionSubmission',
    required: true
  },
  actionType: {
    type: String,
    required: true
  },
  points: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['approved', 'rejected'],
    required: true
  }
}, {
  timestamps: true
});

StudentActionSchema.index({ studentId: 1 });
StudentActionSchema.index({ createdAt: -1 });

export default mongoose.models.StudentAction || mongoose.model('StudentAction', StudentActionSchema);