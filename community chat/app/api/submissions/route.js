export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const classroomId = searchParams.get('classroomId');

    const { db } = await connectToDatabase();

    // Build query
    let query = {};
    
    if (classroomId) {
      query.classroomId = new ObjectId(classroomId);
    }

    if (status !== 'all') {
      query.status = status;
    }

    // Get submissions
    const submissions = await db
      .collection('action_submissions')
      .find(query)
      .sort({ submittedAt: -1 })
      .limit(50)
      .toArray();

    // Convert ObjectId to string for JSON serialization
    const serializedSubmissions = submissions.map(sub => ({
      ...sub,
      _id: sub._id.toString(),
      studentId: sub.studentId.toString(),
      classroomId: sub.classroomId ? sub.classroomId.toString() : null
    }));

    return NextResponse.json({
      success: true,
      submissions: serializedSubmissions
    });

  } catch (error) {
    console.error('Fetch submissions error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
