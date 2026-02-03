import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(request) {
    try {
        const body = await request.json();
        const { studentId, quizId, quizTopic, answers, score, correctAnswers, totalQuestions, difficulty } = body;

        // Validate required fields
        if (!studentId || !answers || score === undefined || !correctAnswers || !totalQuestions) {
            return NextResponse.json(
                { success: false, error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Calculate points based on correct answers and difficulty
        const basePointsPerQuestion = 10;
        const difficultyMultiplier = {
            'easy': 1,
            'medium': 1.5,
            'hard': 2
        };

        const multiplier = difficultyMultiplier[difficulty] || 1;
        const pointsEarned = Math.round(correctAnswers * basePointsPerQuestion * multiplier);

        // Calculate environmental impact contribution for quiz
        // Quizzes contribute to awareness and education, which has indirect environmental impact
        const impactPerCorrectAnswer = {
            co2_saved: 0.5,      // kg CO2 (awareness leads to better choices)
            plastic_reduced: 0.1, // kg plastic
            water_saved: 2,       // liters
            energy_saved: 0.3     // kWh
        };

        const impactContribution = {
            co2_saved_kg: correctAnswers * impactPerCorrectAnswer.co2_saved,
            plastic_reduced_kg: correctAnswers * impactPerCorrectAnswer.plastic_reduced,
            water_saved_liters: correctAnswers * impactPerCorrectAnswer.water_saved,
            energy_saved_kwh: correctAnswers * impactPerCorrectAnswer.energy_saved
        };

        // Record the quiz completion
        const { error: completionError } = await supabase
            .from('activity_completions')
            .insert({
                student_id: studentId,
                activity_type: 'quiz',
                activity_id: quizId || `quiz_${Date.now()}`,
                completion_data: {
                    answers,
                    score,
                    correctAnswers,
                    totalQuestions,
                    difficulty,
                    topic: quizTopic
                },
                points_awarded: pointsEarned,
                impact_contribution: impactContribution
            });

        if (completionError && completionError.code !== '23505') { // Ignore duplicate key errors
            console.error("Error recording quiz completion:", completionError);
        }

        // Award points using the award_points function
        const { data: pointsData, error: pointsError } = await supabase.rpc('award_points', {
            p_student_id: studentId,
            p_points: pointsEarned,
            p_activity_type: 'quiz',
            p_activity_id: quizId || `quiz_${Date.now()}`,
            p_metadata: {
                score,
                correctAnswers,
                totalQuestions,
                difficulty,
                topic: quizTopic
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

        // Check for achievements
        let achievement = null;
        if (score === 100) {
            achievement = "Perfect Score! 🎯";
        } else if (score >= 90) {
            achievement = "Quiz Master! 🏆";
        } else if (score >= 80) {
            achievement = "Great Job! ⭐";
        }

        return NextResponse.json({
            success: true,
            pointsEarned: pointsEarned,
            newTotalPoints: result.new_total_points,
            newRank: result.new_rank,
            achievement: achievement,
            impactMetrics: updatedImpact,
            scorePercentage: score,
            correctAnswers: correctAnswers,
            totalQuestions: totalQuestions
        });

    } catch (error) {
        console.error("Complete quiz API error:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
