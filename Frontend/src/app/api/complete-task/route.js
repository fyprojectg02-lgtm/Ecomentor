import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(request) {
    try {
        const body = await request.json();
        const { studentId, taskId, submissionData } = body;

        // Validate required fields
        if (!studentId || !taskId) {
            return NextResponse.json(
                { success: false, error: "Missing required fields: studentId, taskId" },
                { status: 400 }
            );
        }

        // Get task details to determine points and impact
        const { data: task, error: taskError } = await supabase
            .from('recommended_tasks')
            .select('*')
            .eq('id', taskId)
            .single();

        if (taskError || !task) {
            return NextResponse.json(
                { success: false, error: "Task not found" },
                { status: 404 }
            );
        }

        const pointsEarned = task.estimated_points || 100;
        const impactMetrics = task.impact_metrics || {};

        // Record the task completion
        const { error: completionError } = await supabase
            .from('activity_completions')
            .insert({
                student_id: studentId,
                activity_type: 'task',
                activity_id: taskId,
                completion_data: {
                    ...(submissionData || {}),
                    task_title: task.title,
                    status: 'completed'
                },
                points_awarded: pointsEarned,
                impact_contribution: impactMetrics
            });

        if (completionError && completionError.code !== '23505') {
            console.error("Error recording task completion:", completionError);
            return NextResponse.json(
                { success: false, error: completionError.message },
                { status: 500 }
            );
        }

        // Award points
        const { data: pointsData, error: pointsError } = await supabase.rpc('award_points', {
            p_student_id: studentId,
            p_points: pointsEarned,
            p_activity_type: 'task',
            p_activity_id: taskId,
            p_metadata: {
                taskTitle: task.title,
                difficulty: task.difficulty,
                actionType: task.action_type,
                impactMetrics: impactMetrics
            }
        });

        if (pointsError) {
            console.error("Error awarding points:", pointsError);
            return NextResponse.json(
                { success: false, error: pointsError.message },
                { status: 500 }
            );
        }

        // Calculate updated impact metrics
        const { data: impactData, error: impactError } = await supabase.rpc('calculate_impact_metrics', {
            p_student_id: studentId
        });

        let updatedImpact = null;
        if (!impactError && impactData && impactData.length > 0) {
            const impact = impactData[0];
            updatedImpact = {
                co2_saved_kg: impact.co2_saved,
                trees_equivalent: impact.trees_equiv,
                plastic_reduced_kg: impact.plastic_reduced,
                water_saved_liters: impact.water_saved
            };
        }

        const result = pointsData[0];

        return NextResponse.json({
            success: true,
            pointsEarned: pointsEarned,
            impactMetrics: updatedImpact,
            newTotalPoints: result.new_total_points,
            newRank: result.new_rank,
            taskTitle: task.title
        });

    } catch (error) {
        console.error("Complete task API error:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
