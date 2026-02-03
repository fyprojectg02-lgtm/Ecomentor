import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const studentId = searchParams.get('studentId');

        console.log('📚 Fetching ALL published lesson plans for student:', studentId);

        if (!studentId) {
            return NextResponse.json(
                { success: false, error: 'Missing studentId parameter' },
                { status: 400 }
            );
        }

        // Get ALL published lesson plans (no filtering by classroom or education level)
        const { data: lessonPlans, error: plansError } = await supabase
            .from('lesson_plans')
            .select('*')
            .eq('is_published', true)
            .order('created_at', { ascending: false });

        console.log('📖 Fetched lesson plans:', {
            count: lessonPlans?.length || 0,
            error: plansError
        });

        if (plansError) {
            console.error('❌ Error fetching lesson plans:', plansError);
            return NextResponse.json(
                { success: false, error: 'Failed to fetch lesson plans', details: plansError.message },
                { status: 500 }
            );
        }

        // Transform lesson plans to match learning path format
        const transformedPlans = (lessonPlans || []).map(plan => {
            console.log('🔄 Transforming plan:', plan.title, 'Activities:', plan.activities?.length);

            // Calculate total points based on activities
            const activitiesCount = Array.isArray(plan.activities) ? plan.activities.length : 0;
            const pointsPerActivity = 20; // 20 points per activity
            const totalPoints = activitiesCount * pointsPerActivity;

            // Transform activities into modules
            const modules = Array.isArray(plan.activities) ? plan.activities.map((activity, index) => ({
                title: activity.name || `Activity ${index + 1}`,
                description: activity.description || '',
                duration: activity.duration || '30 minutes',
                points: pointsPerActivity,
                activities: activity.instructions ? [activity.instructions] : []
            })) : [];

            return {
                id: plan.id,
                title: plan.title,
                description: `Teacher-created lesson plan: ${plan.subject}`,
                difficulty: 'intermediate',
                estimated_duration: plan.duration || '45 minutes',
                total_points: totalPoints,
                modules: modules,
                created_by: plan.teacher_id,
                is_active: true,
                subject: plan.subject,
                grade_level: plan.grade_level,
                learning_objectives: plan.learning_objectives,
                materials_needed: plan.materials_needed,
                assessment_methods: plan.assessment_methods,
                is_teacher_plan: true // Flag to identify teacher plans
            };
        });

        console.log('✅ Returning transformed plans:', transformedPlans.length);

        return NextResponse.json({
            success: true,
            lessonPlans: transformedPlans,
            debug: {
                studentId,
                totalPlansFound: lessonPlans?.length || 0,
                transformedCount: transformedPlans.length
            }
        });

    } catch (error) {
        console.error('❌ Error fetching student lesson plans:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}

