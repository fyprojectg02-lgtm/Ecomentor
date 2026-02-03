import mongoose from 'mongoose';

const ClassroomSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  name: {
    type: String,
    required: true
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: true
  },
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  }],
  description: {
    type: String,
    default: ''
  },
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

ClassroomSchema.index({ code: 1 });
ClassroomSchema.index({ teacherId: 1 });

export default mongoose.models.Classroom || mongoose.model('Classroom', ClassroomSchema);
