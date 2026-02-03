export async function POST(request) {
  try {
    const body = await request.json();
    const { submissionId, action, points, teacherNotes } = body;

    // Validate
    if (!submissionId || !action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid request' },
        { status: 400 }
      );
    }

    // Get teacher ID from session/auth
    // const session = await getServerSession();
    // const teacherId = session?.user?.id || 'teacher_123';

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
      reviewedBy: 'teacher_123', // Replace with actual teacher ID
      teacherNotes: teacherNotes || '',
      finalPoints: action === 'approve' ? points : 0
    };

    await db.collection('action_submissions').updateOne(
      { _id: new ObjectId(submissionId) },
      { $set: updateData }
    );

    // ==========================================
    // Update student points if approved
    // ==========================================
    if (action === 'approve') {
      await db.collection('students').updateOne(
        { _id: submission.studentId },
        { 
          $inc: { 
            ecoPoints: points,
            completedTasks: 1
          }
        }
      );

      // Add to student's action history
      await db.collection('student_actions').insertOne({
        studentId: submission.studentId,
        submissionId: new ObjectId(submissionId),
        actionType: submission.actionType,
        points: points,
        date: new Date(),
        status: 'approved'
      });

      // Create notification for student
      await db.collection('notifications').insertOne({
        type: 'action_approved',
        userId: submission.studentId,
        message: `Your ${submission.actionType} action has been approved! You earned ${points} EcoPoints.`,
        submissionId: new ObjectId(submissionId),
        createdAt: new Date(),
        read: false
      });
    } else {
      // Create rejection notification
      await db.collection('notifications').insertOne({
        type: 'action_rejected',
        userId: submission.studentId,
        message: `Your ${submission.actionType} action was not approved. ${teacherNotes || ''}`,
        submissionId: new ObjectId(submissionId),
        createdAt: new Date(),
        read: false
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