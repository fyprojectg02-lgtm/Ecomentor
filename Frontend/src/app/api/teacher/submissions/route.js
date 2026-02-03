import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const teacherId = searchParams.get('teacherId');
        const status = searchParams.get('status') || 'all'; // 'all', 'ai_flagged', 'pending_review'
        const classroomId = searchParams.get('classroomId');

        if (!teacherId) {
            return NextResponse.json(
                { success: false, error: 'Missing teacherId parameter' },
                { status: 400 }
            );
        }

        // Verify teacher role
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', teacherId)
            .single();

        if (profileError || !profile || profile.role !== 'teacher') {
            return NextResponse.json(
                { success: false, error: 'Unauthorized: User is not a teacher' },
                { status: 403 }
            );
        }

        // Get teacher's classrooms if not specified
        let classroomIds = [];
        if (classroomId) {
            classroomIds = [classroomId];
        } else {
            const { data: classrooms } = await supabase
                .from('teacher_classrooms')
                .select('classroom_id')
                .eq('teacher_id', teacherId)
                .eq('is_active', true);

            if (classrooms && classrooms.length > 0) {
                classroomIds = classrooms.map(c => c.classroom_id);
            }
        }

        // Connect to MongoDB to get submissions
        const { db } = await connectToDatabase();

        // Build query for submissions
        const query = {
            classroomId: { $in: classroomIds }
        };

        // Filter by status
        if (status !== 'all') {
            query.status = status;
        } else {
            // Get submissions that need review (ai_flagged or pending_review)
            query.status = { $in: ['ai_flagged', 'pending_review'] };
        }

        const submissions = await db
            .collection('action_submissions')
            .find(query)
            .sort({ submittedAt: -1 })
            .limit(100)
            .toArray();

        // Get student details from Supabase for each submission
        const studentIds = [...new Set(submissions.map(s => s.studentId))];
        const { data: students } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', studentIds);

        const studentMap = (students || []).reduce((acc, s) => {
            acc[s.id] = s.full_name;
            return acc;
        }, {});

        // Format submissions with student names
        const formattedSubmissions = submissions.map(sub => ({
            id: sub._id.toString(),
            studentId: sub.studentId,
            studentName: studentMap[sub.studentId] || sub.studentName || 'Unknown',
            classroomId: sub.classroomId,
            actionType: sub.actionType,
            description: sub.description,
            location: sub.location,
            date: sub.date,
            estimatedImpact: sub.estimatedImpact,
            images: sub.images,
            status: sub.status,
            autoApproved: sub.autoApproved,
            aiVerification: sub.aiVerification,
            submittedAt: sub.submittedAt,
            reviewedAt: sub.reviewedAt,
            reviewedBy: sub.reviewedBy,
            teacherNotes: sub.teacherNotes,
            finalPoints: sub.finalPoints
        }));

        return NextResponse.json({
            success: true,
            submissions: formattedSubmissions,
            total: formattedSubmissions.length
        });

    } catch (error) {
        console.error('Error fetching submissions:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}
