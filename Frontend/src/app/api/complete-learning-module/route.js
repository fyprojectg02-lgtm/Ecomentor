import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(request) {
    try {
        const body = await request.json();
        const { studentId, learningPathId, moduleIndex, completionData } = body;

        // Validate required fields
        if (!studentId || !learningPathId || moduleIndex === undefined) {
            return NextResponse.json(
                { success: false, error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Get learning path details
        const { data: learningPath, error: pathError } = await supabase
            .from('learning_paths')
            .select('*')
            .eq('id', learningPathId)
            .single();

        if (pathError || !learningPath) {
            return NextResponse.json(
                { success: false, error: "Learning path not found" },
                { status: 404 }
            );
        }

        // Get the specific module
        const modules = learningPath.modules || [];
        if (moduleIndex >= modules.length) {
            return NextResponse.json(
                { success: false, error: "Invalid module index" },
                { status: 400 }
            );
        }

        const module = modules[moduleIndex];
        const pointsEarned = module.points || 50;

        // Calculate environmental impact contribution for learning module
        // Learning contributes to knowledge and behavior change
        const impactContribution = {
            co2_saved_kg: pointsEarned * 0.1,      // 0.1 kg CO2 per point
            plastic_reduced_kg: pointsEarned * 0.02, // 0.02 kg plastic per point
            water_saved_liters: pointsEarned * 0.5,     // 0.5 liters per point
            energy_saved_kwh: pointsEarned * 0.05    // 0.05 kWh per point
        };

        // Update student progress
        const { data: existingProgress } = await supabase
            .from('student_learning_progress')
            .select('*')
            .eq('student_id', studentId)
            .eq('learning_path_id', learningPathId)
            .single();

        let completedModules = existingProgress?.completed_modules || [];

        // Add module to completed list if not already there
        if (!completedModules.includes(moduleIndex)) {
            completedModules.push(moduleIndex);
        }

        const totalModules = modules.length;
        const progressPercentage = Math.round((completedModules.length / totalModules) * 100);
        const isPathComplete = progressPercentage >= 100;

        // Upsert progress
        const { error: progressError } = await supabase
            .from('student_learning_progress')
            .upsert({
                student_id: studentId,
                learning_path_id: learningPathId,
                progress_percentage: progressPercentage,
                current_module: moduleIndex + 1,
                completed_modules: completedModules,
                points_earned: (existingProgress?.points_earned || 0) + pointsEarned,
                last_activity: new Date().toISOString(),
                completed_at: isPathComplete ? new Date().toISOString() : null
            }, {
                onConflict: 'student_id,learning_path_id'
            });

        if (progressError) {
            console.error("Error updating progress:", progressError);
        }

        // Record module completion
        const { error: completionError } = await supabase
            .from('activity_completions')
            .insert({
                student_id: studentId,
                activity_type: 'learning_module',
                activity_id: `${learningPathId}_module_${moduleIndex}`,
                completion_data: {
                    learningPathTitle: learningPath.title,
                    moduleTitle: module.title,
                    moduleIndex: moduleIndex,
                    ...completionData
                },
                points_awarded: pointsEarned,
                impact_contribution: impactContribution
            });

        if (completionError && completionError.code !== '23505') {
            console.error("Error recording completion:", completionError);
        }

        // Award points for module
        const { data: pointsData, error: pointsError } = await supabase.rpc('award_points', {
            p_student_id: studentId,
            p_points: pointsEarned,
            p_activity_type: 'learning_path',
            p_activity_id: `${learningPathId}_module_${moduleIndex}`,
            p_metadata: {
                learningPathTitle: learningPath.title,
                moduleTitle: module.title,
                moduleIndex: moduleIndex,
                progressPercentage: progressPercentage
            }
        });

        if (pointsError) {
            console.error("Error awarding points:", pointsError);
            return NextResponse.json(
                { success: false, error: pointsError.message },
                { status: 500 }
            );
        }

        // If path is complete, award bonus points
        let bonusPoints = 0;
        if (isPathComplete && !existingProgress?.completed_at) {
            const difficultyBonus = {
                'beginner': 100,
                'intermediate': 200,
                'advanced': 300
            };
            bonusPoints = difficultyBonus[learningPath.difficulty] || 150;

            await supabase.rpc('award_points', {
                p_student_id: studentId,
                p_points: bonusPoints,
                p_activity_type: 'bonus',
                p_activity_id: learningPathId,
                p_metadata: {
                    reason: 'Learning Path Completion',
                    learningPathTitle: learningPath.title
                }
            });
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
            bonusPoints: bonusPoints,
            totalPointsEarned: pointsEarned + bonusPoints,
            newTotalPoints: result.new_total_points + bonusPoints,
            newRank: result.new_rank,
            impactMetrics: updatedImpact,
            progressPercentage: progressPercentage,
            isPathComplete: isPathComplete,
            completedModules: completedModules.length,
            totalModules: totalModules,
            nextModule: isPathComplete ? null : modules[moduleIndex + 1]
        });

    } catch (error) {
        console.error("Complete learning module API error:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
