import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { connectToDatabase } from '@/lib/mongodb';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const teacherId = searchParams.get('teacherId');
        const studentId = searchParams.get('studentId');

        if (!teacherId || !studentId) {
            return NextResponse.json(
                { success: false, error: 'Missing teacherId or studentId parameter' },
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

        // Get student basic info
        const { data: student, error: studentError } = await supabase
            .from('students')
            .select('id, name, email, eco_points, completed_tasks, classroom_id')
            .eq('id', studentId)
            .single();

        if (studentError || !student) {
            return NextResponse.json(
                { success: false, error: 'Student not found' },
                { status: 404 }
            );
        }

        // Get student education level
        const { data: userDetails } = await supabase
            .from('user_details')
            .select('education_level, institution')
            .eq('user_id', studentId)
            .single();

        // Get learning paths progress
        const { data: learningProgress } = await supabase
            .from('student_learning_progress')
            .select(`
        id,
        learning_path_id,
        progress_percentage,
        current_module,
        points_earned,
        started_at,
        last_activity,
        completed_at,
        learning_paths (
          title,
          difficulty,
          total_points
        )
      `)
            .eq('student_id', studentId);

        // Get impact metrics
        const { data: impactMetrics } = await supabase
            .from('impact_metrics')
            .select('*')
            .eq('student_id', studentId)
            .single();

        // Get recent activity completions
        const { data: recentActivities } = await supabase
            .from('activity_completions')
            .select('*')
            .eq('student_id', studentId)
            .order('completed_at', { ascending: false })
            .limit(10);

        // Get submissions from MongoDB
        const { db } = await connectToDatabase();
        const submissions = await db
            .collection('action_submissions')
            .find({ studentId: studentId })
            .sort({ submittedAt: -1 })
            .limit(20)
            .toArray();

        // Format submissions
        const formattedSubmissions = submissions.map(sub => ({
            id: sub._id.toString(),
            actionType: sub.actionType,
            description: sub.description,
            status: sub.status,
            points: sub.finalPoints || 0,
            submittedAt: sub.submittedAt,
            reviewedAt: sub.reviewedAt,
            teacherNotes: sub.teacherNotes,
            aiVerification: sub.aiVerification
        }));

        // Get points history
        const { data: pointsHistory } = await supabase
            .from('points_history')
            .select('*')
            .eq('student_id', studentId)
            .order('created_at', { ascending: false })
            .limit(20);

        // Calculate statistics
        const totalLearningPaths = learningProgress?.length || 0;
        const completedLearningPaths = learningProgress?.filter(lp => lp.completed_at).length || 0;
        const avgProgress = totalLearningPaths > 0
            ? learningProgress.reduce((sum, lp) => sum + lp.progress_percentage, 0) / totalLearningPaths
            : 0;

        return NextResponse.json({
            success: true,
            student: {
                id: student.id,
                name: student.name,
                email: student.email,
                ecoPoints: student.eco_points || 0,
                completedTasks: student.completed_tasks || 0,
                classroomId: student.classroom_id,
                educationLevel: userDetails?.education_level || 'unknown',
                institution: userDetails?.institution || ''
            },
            learningPaths: {
                total: totalLearningPaths,
                completed: completedLearningPaths,
                inProgress: totalLearningPaths - completedLearningPaths,
                averageProgress: Math.round(avgProgress),
                paths: (learningProgress || []).map(lp => ({
                    id: lp.learning_path_id,
                    title: lp.learning_paths?.title || 'Unknown',
                    difficulty: lp.learning_paths?.difficulty || 'unknown',
                    progress: lp.progress_percentage,
                    pointsEarned: lp.points_earned,
                    totalPoints: lp.learning_paths?.total_points || 0,
                    startedAt: lp.started_at,
                    lastActivity: lp.last_activity,
                    completedAt: lp.completed_at
                }))
            },
            environmentalImpact: {
                co2Saved: impactMetrics?.co2_saved_kg || 0,
                treesPlanted: impactMetrics?.trees_equivalent || 0,
                plasticReduced: impactMetrics?.plastic_reduced_kg || 0,
                waterSaved: impactMetrics?.water_saved_liters || 0,
                energySaved: impactMetrics?.energy_saved_kwh || 0
            },
            recentActivities: (recentActivities || []).map(activity => ({
                id: activity.id,
                type: activity.activity_type,
                activityId: activity.activity_id,
                points: activity.points_awarded,
                completedAt: activity.completed_at,
                impact: activity.impact_contribution
            })),
            submissions: formattedSubmissions,
            pointsHistory: (pointsHistory || []).map(ph => ({
                id: ph.id,
                points: ph.points_earned,
                activityType: ph.activity_type,
                createdAt: ph.created_at,
                metadata: ph.activity_metadata
            }))
        });

    } catch (error) {
        console.error('Error fetching student progress:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}
