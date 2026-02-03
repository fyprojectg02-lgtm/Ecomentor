import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const teacherId = searchParams.get('teacherId');
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

        // Get students from these classrooms
        const { data: userDetails, error: detailsError } = await supabase
            .from('user_details')
            .select('user_id, education_level, classroom_id')
            .in('classroom_id', classroomIds);

        if (detailsError) {
            console.error('Error fetching user details:', detailsError);
            return NextResponse.json(
                { success: false, error: 'Failed to fetch students' },
                { status: 500 }
            );
        }

        const studentIds = userDetails.map(ud => ud.user_id);

        // Get student profiles and stats
        const { data: students, error: studentsError } = await supabase
            .from('students')
            .select(`
        id,
        name,
        email,
        eco_points,
        completed_tasks,
        classroom_id
      `)
            .in('id', studentIds);

        if (studentsError) {
            console.error('Error fetching students:', studentsError);
            return NextResponse.json(
                { success: false, error: 'Failed to fetch student data' },
                { status: 500 }
            );
        }

        // Get impact metrics for each student
        const { data: impactMetrics } = await supabase
            .from('impact_metrics')
            .select('student_id, co2_saved_kg, trees_equivalent, plastic_reduced_kg')
            .in('student_id', studentIds);

        const impactMap = (impactMetrics || []).reduce((acc, im) => {
            acc[im.student_id] = {
                co2Saved: im.co2_saved_kg || 0,
                treesPlanted: im.trees_equivalent || 0,
                plasticReduced: im.plastic_reduced_kg || 0
            };
            return acc;
        }, {});

        // Get education level for each student
        const educationMap = userDetails.reduce((acc, ud) => {
            acc[ud.user_id] = ud.education_level;
            return acc;
        }, {});

        // Format student data
        const formattedStudents = (students || []).map(student => ({
            id: student.id,
            name: student.name,
            email: student.email,
            ecoPoints: student.eco_points || 0,
            completedTasks: student.completed_tasks || 0,
            classroomId: student.classroom_id,
            educationLevel: educationMap[student.id] || 'unknown',
            environmentalImpact: impactMap[student.id] || {
                co2Saved: 0,
                treesPlanted: 0,
                plasticReduced: 0
            }
        }));

        // Sort by eco points descending
        formattedStudents.sort((a, b) => b.ecoPoints - a.ecoPoints);

        return NextResponse.json({
            success: true,
            students: formattedStudents,
            total: formattedStudents.length
        });

    } catch (error) {
        console.error('Error fetching students:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}
