import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const studentId = searchParams.get('studentId');

        if (!studentId) {
            return NextResponse.json(
                { success: false, error: "Missing studentId parameter" },
                { status: 400 }
            );
        }

        // Get impact metrics for the student
        const { data: impactData, error: impactError } = await supabase
            .from('impact_metrics')
            .select('*')
            .eq('student_id', studentId)
            .single();

        if (impactError && impactError.code !== 'PGRST116') { // PGRST116 = no rows returned
            console.error("Error fetching impact metrics:", impactError);
            return NextResponse.json(
                { success: false, error: impactError.message },
                { status: 500 }
            );
        }

        const impact = impactData || {
            co2_saved_kg: 0,
            trees_equivalent: 0,
            plastic_reduced_kg: 0,
            water_saved_liters: 0,
            energy_saved_kwh: 0
        };

        // Get breakdown by activity type
        const { data: completions, error: completionsError } = await supabase
            .from('activity_completions')
            .select('activity_type, impact_contribution')
            .eq('student_id', studentId);

        if (completionsError) {
            console.error("Error fetching completions:", completionsError);
        }

        // Aggregate impact by activity type
        const breakdown = {
            quizzes: { co2_saved_kg: 0, trees_equivalent: 0, plastic_reduced_kg: 0, water_saved_liters: 0 },
            tasks: { co2_saved_kg: 0, trees_equivalent: 0, plastic_reduced_kg: 0, water_saved_liters: 0 },
            actions: { co2_saved_kg: 0, trees_equivalent: 0, plastic_reduced_kg: 0, water_saved_liters: 0 },
            learning_paths: { co2_saved_kg: 0, trees_equivalent: 0, plastic_reduced_kg: 0, water_saved_liters: 0 }
        };

        if (completions) {
            completions.forEach(completion => {
                const type = completion.activity_type === 'learning_module' ? 'learning_paths' :
                    completion.activity_type === 'quiz' ? 'quizzes' :
                        completion.activity_type === 'task' ? 'tasks' : 'actions';

                const contribution = completion.impact_contribution || {};

                breakdown[type].co2_saved_kg += parseFloat(contribution.co2_saved_kg || 0);
                breakdown[type].plastic_reduced_kg += parseFloat(contribution.plastic_reduced_kg || 0);
                breakdown[type].water_saved_liters += parseFloat(contribution.water_saved_liters || 0);
            });

            // Calculate trees equivalent for each category
            Object.keys(breakdown).forEach(key => {
                breakdown[key].trees_equivalent = Math.floor(breakdown[key].co2_saved_kg / 21);
            });
        }

        // Get recent activities
        const { data: recentActivities, error: activitiesError } = await supabase
            .from('activity_completions')
            .select('activity_type, points_awarded, impact_contribution, completed_at')
            .eq('student_id', studentId)
            .order('completed_at', { ascending: false })
            .limit(10);

        if (activitiesError) {
            console.error("Error fetching recent activities:", activitiesError);
        }

        // Calculate real-world comparisons
        const comparisons = {
            carTripsAvoided: Math.floor(impact.co2_saved_kg / 4.6), // Average car trip emits ~4.6 kg CO2
            plasticBottlesRecycled: Math.floor(impact.plastic_reduced_kg / 0.025), // Average bottle weighs 25g
            showersSaved: Math.floor(impact.water_saved_liters / 65), // Average shower uses 65 liters
            homesEnergized: Math.floor(impact.energy_saved_kwh / 30) // Average home uses 30 kWh/day
        };

        return NextResponse.json({
            success: true,
            totalImpact: {
                co2_saved_kg: parseFloat(impact.co2_saved_kg || 0).toFixed(2),
                trees_equivalent: impact.trees_equivalent || 0,
                plastic_reduced_kg: parseFloat(impact.plastic_reduced_kg || 0).toFixed(2),
                water_saved_liters: parseFloat(impact.water_saved_liters || 0).toFixed(2),
                energy_saved_kwh: parseFloat(impact.energy_saved_kwh || 0).toFixed(2)
            },
            breakdown: breakdown,
            comparisons: comparisons,
            recentActivities: recentActivities || [],
            lastCalculated: impact.last_calculated
        });

    } catch (error) {
        console.error("Impact metrics API error:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
