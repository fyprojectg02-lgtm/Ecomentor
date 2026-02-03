import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { createClient } from '@supabase/supabase-js';
import { ObjectId } from 'mongodb';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(request) {
  try {
    const body = await request.json();
    const { submissionId, action, points, teacherId, teacherNotes } = body;

    // Validate
    if (!submissionId || !action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid request' },
        { status: 400 }
      );
    }

    if (!teacherId) {
      return NextResponse.json(
        { success: false, error: 'Teacher ID required' },
        { status: 400 }
      );
    }

    // Verify teacher role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', teacherId)
      .single();

    if (profileError || !profile || profile.role !== 'teacher') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: User is not a teacher' },
        { status: 403 }
      );
    }

    const { db } = await connectToDatabase();

    // Get submission details
    const submission = await db.collection('action_submissions').findOne({
      _id: new ObjectId(submissionId)
    });

    if (!submission) {
      return NextResponse.json(
        { success: false, error: 'Submission not found' },
        { status: 404 }
      );
    }

    // ==========================================
    // Update submission in MongoDB
    // ==========================================
    const updateData = {
      status: action === 'approve' ? 'approved' : 'rejected',
      reviewedAt: new Date(),
      reviewedBy: teacherId,
      teacherNotes: teacherNotes || '',
      finalPoints: action === 'approve' ? points : 0
    };

    await db.collection('action_submissions').updateOne(
      { _id: new ObjectId(submissionId) },
      { $set: updateData }
    );

    // ==========================================
    // Update student points if approved in SUPABASE
    // ==========================================
    if (action === 'approve') {
      // Get current student data
      const { data: student } = await supabase
        .from('students')
        .select('eco_points, completed_tasks')
        .eq('id', submission.studentId)
        .single();

      // Update student points in Supabase
      const { error: updateError } = await supabase
        .from('students')
        .update({
          eco_points: (student?.eco_points || 0) + points,
          completed_tasks: (student?.completed_tasks || 0) + 1
        })
        .eq('id', submission.studentId);

      if (updateError) {
        console.error('Error updating student in Supabase:', updateError);
      }

      // Add to student's action history in MongoDB
      await db.collection('student_actions').insertOne({
        studentId: submission.studentId,
        submissionId: new ObjectId(submissionId),
        actionType: submission.actionType,
        points: points,
        date: new Date(),
        status: 'approved'
      });

      // Create notification for student in Supabase
      await supabase
        .from('teacher_notifications')
        .insert({
          teacher_id: teacherId,
          notification_type: 'classroom_activity',
          title: 'Action Approved',
          message: `You approved ${submission.studentName}'s ${submission.actionType} action for ${points} points`,
          related_id: submissionId,
          related_type: 'submission',
          metadata: { studentId: submission.studentId, points: points },
          priority: 'normal'
        });

    } else {
      // Create rejection notification
      await supabase
        .from('teacher_notifications')
        .insert({
          teacher_id: teacherId,
          notification_type: 'classroom_activity',
          title: 'Action Rejected',
          message: `You rejected ${submission.studentName}'s ${submission.actionType} action`,
          related_id: submissionId,
          related_type: 'submission',
          metadata: { studentId: submission.studentId, reason: teacherNotes },
          priority: 'normal'
        });
    }

    return NextResponse.json({
      success: true,
      action,
      message: `Action ${action === 'approve' ? 'approved' : 'rejected'} successfully`
    });

  } catch (error) {
    console.error('Review error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
