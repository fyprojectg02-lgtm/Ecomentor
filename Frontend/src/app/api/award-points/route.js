import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY // Use service role for admin operations
);

export async function POST(request) {
    try {
        const body = await request.json();
        const { studentId, points, activityType, activityId, metadata = {} } = body;

        // Validate required fields
        if (!studentId || !points || !activityType) {
            return NextResponse.json(
                { success: false, error: "Missing required fields: studentId, points, activityType" },
                { status: 400 }
            );
        }

        // Validate activity type
        const validActivityTypes = ['quiz', 'task', 'learning_path', 'action', 'bonus'];
        if (!validActivityTypes.includes(activityType)) {
            return NextResponse.json(
                { success: false, error: `Invalid activity type. Must be one of: ${validActivityTypes.join(', ')}` },
                { status: 400 }
            );
        }

        // Call the database function to award points
        const { data, error } = await supabase.rpc('award_points', {
            p_student_id: studentId,
            p_points: points,
            p_activity_type: activityType,
            p_activity_id: activityId || null,
            p_metadata: metadata
        });

        if (error) {
            console.error("Error awarding points:", error);
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 500 }
            );
        }

        // Get the result from the function
        const result = data[0];

        // Get updated impact metrics if this activity has environmental impact
        let impactUpdate = null;
        if (metadata.impactMetrics) {
            const { data: impactData, error: impactError } = await supabase.rpc('calculate_impact_metrics', {
                p_student_id: studentId
            });

            if (!impactError && impactData && impactData.length > 0) {
                const impact = impactData[0];
                impactUpdate = {
                    co2_saved_kg: impact.co2_saved,
                    trees_equivalent: impact.trees_equiv,
                    plastic_reduced_kg: impact.plastic_reduced,
                    water_saved_liters: impact.water_saved
                };
            }
        }

        return NextResponse.json({
            success: true,
            newTotal: result.new_total_points,
            pointsAwarded: result.points_awarded,
            rank: result.new_rank,
            impactUpdate: impactUpdate
        });

    } catch (error) {
        console.error("Award points API error:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
