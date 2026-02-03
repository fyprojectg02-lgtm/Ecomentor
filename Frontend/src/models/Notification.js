import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['action_review_needed', 'action_approved', 'action_rejected', 'points_awarded'],
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'userType'
  },
  userType: {
    type: String,
    enum: ['Student', 'Teacher']
  },
  classroomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Classroom'
  },
  message: {
    type: String,
    required: true
  },
  submissionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ActionSubmission'
  },
  read: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

NotificationSchema.index({ userId: 1, read: 1 });
NotificationSchema.index({ classroomId: 1, read: 1 });
NotificationSchema.index({ createdAt: -1 });

export default mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);