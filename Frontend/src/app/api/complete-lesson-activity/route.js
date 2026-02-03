import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(request) {
    try {
        const body = await request.json();
        const { studentId, lessonPlanId, activityIndex } = body;

        if (!studentId || !lessonPlanId || activityIndex === undefined) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Get the lesson plan to calculate points
        const { data: lessonPlan } = await supabase
            .from('lesson_plans')
            .select('activities, title')
            .eq('id', lessonPlanId)
            .single();

        if (!lessonPlan) {
            return NextResponse.json(
                { success: false, error: 'Lesson plan not found' },
                { status: 404 }
            );
        }

        const pointsPerActivity = 20;
        const totalActivities = Array.isArray(lessonPlan.activities) ? lessonPlan.activities.length : 0;

        // Check if student has progress record for this lesson plan
        let { data: progress } = await supabase
            .from('lesson_plan_progress')
            .select('*')
            .eq('student_id', studentId)
            .eq('lesson_plan_id', lessonPlanId)
            .single();

        let completedActivities = [];
        let isNewCompletion = false;
        let initialProgressPercentage = 0;

        if (!progress) {
            // Create new progress record
            completedActivities = [activityIndex];
            initialProgressPercentage = Math.round((1 / totalActivities) * 100);
            const isComplete = initialProgressPercentage === 100;
            
            const { data: newProgress, error: insertError } = await supabase
                .from('lesson_plan_progress')
                .insert({
                    student_id: studentId,
                    lesson_plan_id: lessonPlanId,
                    completed_activities: completedActivities,
                    progress_percentage: initialProgressPercentage,
                    points_earned: pointsPerActivity,
                    completed_at: isComplete ? new Date().toISOString() : null
                })
                .select()
                .single();

            if (insertError) {
                console.error('Error creating progress:', insertError);
                return NextResponse.json(
                    { success: false, error: 'Failed to create progress' },
                    { status: 500 }
                );
            }
            progress = newProgress;
            isNewCompletion = true;
        } else {
            // Update existing progress
            completedActivities = progress.completed_activities || [];

            if (!completedActivities.includes(activityIndex)) {
                completedActivities.push(activityIndex);
                isNewCompletion = true;

                const newProgressPercentage = Math.round((completedActivities.length / totalActivities) * 100);
                const newPointsEarned = completedActivities.length * pointsPerActivity;

                // Only set completed_at if reaching 100%, don't overwrite if already completed
                const updateData = {
                    completed_activities: completedActivities,
                    progress_percentage: newProgressPercentage,
                    points_earned: newPointsEarned
                };
                
                // Only set completed_at if reaching 100% and not already completed
                if (newProgressPercentage >= 100 && !progress.completed_at) {
                    updateData.completed_at = new Date().toISOString();
                }
                
                const { error: updateError } = await supabase
                    .from('lesson_plan_progress')
                    .update(updateData)
                    .eq('id', progress.id);

                if (updateError) {
                    console.error('Error updating progress:', updateError);
                    return NextResponse.json(
                        { success: false, error: 'Failed to update progress' },
                        { status: 500 }
                    );
                }
            }
        }

        // Award points to student if new completion
        if (isNewCompletion) {
            const { data: student } = await supabase
                .from('students')
                .select('eco_points, completed_tasks')
                .eq('id', studentId)
                .single();

            const newEcoPoints = (student?.eco_points || 0) + pointsPerActivity;
            const newCompletedTasks = (student?.completed_tasks || 0) + 1;

            await supabase
                .from('students')
                .update({
                    eco_points: newEcoPoints,
                    completed_tasks: newCompletedTasks
                })
                .eq('id', studentId);

            // Add to points history
            await supabase
                .from('points_history')
                .insert({
                    student_id: studentId,
                    points_earned: pointsPerActivity,
                    activity_type: 'lesson_plan_activity',
                    activity_metadata: {
                        lesson_plan_id: lessonPlanId,
                        lesson_plan_title: lessonPlan.title,
                        activity_index: activityIndex
                    }
                });

            // Recalculate completion status after update
            const finalProgressPercentage = progress ? 
                Math.round((completedActivities.length / totalActivities) * 100) : 
                initialProgressPercentage;
            const isLessonComplete = completedActivities.length === totalActivities;

            return NextResponse.json({
                success: true,
                totalPointsEarned: pointsPerActivity,
                newTotalPoints: newEcoPoints,
                isLessonComplete: isLessonComplete,
                progressPercentage: finalProgressPercentage
            });
        } else {
            return NextResponse.json({
                success: true,
                message: 'Activity already completed',
                totalPointsEarned: 0
            });
        }

    } catch (error) {
        console.error('Error completing lesson activity:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}
