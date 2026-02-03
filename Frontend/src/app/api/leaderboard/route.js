import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);

        // Get query parameters
        const scope = searchParams.get('scope') || 'global';
        const classroomId = searchParams.get('classroomId');
        const educationLevel = searchParams.get('educationLevel');
        const timeframe = searchParams.get('timeframe') || 'all_time';
        const limit = parseInt(searchParams.get('limit') || '100');
        const offset = parseInt(searchParams.get('offset') || '0');
        const currentUserId = searchParams.get('userId');

        // Determine which leaderboard to query based on timeframe
        let leaderboardData;
        let error;

        if (timeframe === 'weekly') {
            // Query weekly leaderboard view
            const query = supabase
                .from('weekly_leaderboard')
                .select('*')
                .range(offset, offset + limit - 1);

            if (educationLevel) {
                query.eq('education_level', educationLevel);
            }

            const result = await query;
            leaderboardData = result.data;
            error = result.error;

        } else {
            // Query global leaderboard using the database function
            const { data, error: rpcError } = await supabase.rpc('get_leaderboard', {
                p_scope: scope,
                p_classroom_id: classroomId || null,
                p_education_level: educationLevel || null,
                p_limit: limit,
                p_offset: offset
            });

            leaderboardData = data;
            error = rpcError;
        }

        if (error) {
            console.error("Error fetching leaderboard:", error);
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 500 }
            );
        }

        // Get current user's rank if userId provided
        let currentUser = null;
        if (currentUserId) {
            const { data: rankData, error: rankError } = await supabase.rpc('get_student_rank', {
                p_student_id: currentUserId
            });

            if (!rankError && rankData && rankData.length > 0) {
                const userRank = rankData[0];

                // Also get user's points
                const { data: userData } = await supabase
                    .from('students')
                    .select('eco_points, completed_tasks')
                    .eq('id', currentUserId)
                    .single();

                if (userData) {
                    currentUser = {
                        rank: userRank.rank,
                        ecoPoints: userData.eco_points,
                        completedTasks: userData.completed_tasks,
                        totalStudents: userRank.total_students,
                        percentile: userRank.percentile
                    };
                }
            }
        }

        // Get total count for pagination
        const { count } = await supabase
            .from('students')
            .select('*', { count: 'exact', head: true })
            .gt('eco_points', 0);

        // Format the response
        const formattedLeaderboard = leaderboardData.map(entry => ({
            rank: entry.rank,
            studentId: entry.student_id,
            name: entry.name || 'Anonymous Student',
            ecoPoints: entry.eco_points,
            completedTasks: entry.completed_tasks,
            educationLevel: entry.education_level,
            impactMetrics: {
                co2_saved_kg: entry.co2_saved_kg || 0,
                trees_equivalent: entry.trees_equivalent || 0,
                plastic_reduced_kg: entry.plastic_reduced_kg || 0
            }
        }));

        return NextResponse.json({
            success: true,
            leaderboard: formattedLeaderboard,
            currentUser: currentUser,
            totalStudents: count || 0,
            pagination: {
                limit,
                offset,
                hasMore: (offset + limit) < (count || 0)
            }
        });

    } catch (error) {
        console.error("Leaderboard API error:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
