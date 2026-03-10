import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Initialize Supabase
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(req) {
    try {
        const { userId, limit = 5, regenerate = false } = await req.json();

        if (!userId) {
            return NextResponse.json(
                { error: "User ID is required" },
                { status: 400 }
            );
        }

        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json(
                { error: "GEMINI_API_KEY is not configured" },
                { status: 500 }
            );
        }

        // Fetch student profile
        const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, role")
            .eq("id", userId)
            .single();

        if (!profile || profile.role !== "student") {
            return NextResponse.json(
                { error: "Student profile not found" },
                { status: 404 }
            );
        }

        // Fetch student details
        const { data: details } = await supabase
            .from("user_details")
            .select("education_level, institution")
            .eq("user_id", userId)
            .single();

        if (!details || !details.education_level) {
            return NextResponse.json(
                { error: "Education level not found" },
                { status: 400 }
            );
        }

        // Fetch student stats
        const { data: stats } = await supabase
            .from("students")
            .select("eco_points, completed_tasks")
            .eq("id", userId)
            .single();

        // Fetch student interests
        const { data: interestData } = await supabase
            .from("student_interests")
            .select("interests")
            .eq("student_id", userId)
            .single();

        const interests = interestData?.interests || ["sustainability", "environment"];

        // Determine education context
        const educationLevel = details.education_level;
        const isCollege = educationLevel.toLowerCase().includes("college") ||
            educationLevel.toLowerCase().includes("university");
        let gradeLevel = null;

        if (!isCollege) {
            const gradeMatch = educationLevel.match(/\d+/);
            gradeLevel = gradeMatch ? parseInt(gradeMatch[0]) : 8;
        }

        // First, try to get recommendations from database
        if (!regenerate) {
            // 1. Fetch user-specific tasks
            let { data: userTasks, error: userTasksError } = await supabase
                .from("recommended_tasks")
                .select("*")
                .eq("is_active", true)
                .eq("created_by", userId);

            if (userTasksError) console.error("Error fetching user tasks:", userTasksError);

            // 2. If not enough user tasks, fetch global tasks
            let combinedTasks = userTasks || [];
            if (combinedTasks.length < limit) {
                let query = supabase
                    .from("recommended_tasks")
                    .select("*")
                    .eq("is_active", true)
                    .is("created_by", null);

                if (isCollege) {
                    query = query.in("education_level", ["college", "all"]);
                } else {
                    query = query.or(`education_level.eq.all,and(education_level.eq.school,min_grade.lte.${gradeLevel},max_grade.gte.${gradeLevel})`);
                }

                const { data: globalTasks, error: globalTasksError } = await query.limit(limit - combinedTasks.length);
                if (globalTasksError) console.error("Error fetching global tasks:", globalTasksError);

                if (globalTasks) {
                    combinedTasks = [...combinedTasks, ...globalTasks];
                }
            }

            if (combinedTasks.length > 0) {
                return NextResponse.json({
                    success: true,
                    recommendations: combinedTasks,
                    source: "database"
                });
            }
        }

        // Force exactly 3 tasks for new generation
        const taskLimit = 3;

        // Generate AI recommendations
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

        const prompt = `
You are recommending eco-actions for a student on the EcoMentor platform.

Student Context:
- Name: ${profile.full_name}
- Education Level: ${educationLevel}
- Institution: ${details.institution || "Not specified"}
- Completed Tasks: ${stats?.completed_tasks || 0}
- Current EcoPoints: ${stats?.eco_points || 0}
- Interests: ${interests.join(", ")}

Requirements:
1. Generate ${taskLimit} personalized eco-action task recommendations
2. ${isCollege ? "Tasks should be sophisticated and suitable for college students with access to campus resources" : `Tasks should be age-appropriate for Grade ${gradeLevel} students`}
3. Align with their interests: ${interests.join(", ")}
4. Progressive difficulty based on experience (${stats?.completed_tasks || 0} tasks completed)
5. Tasks should be achievable with commonly available resources
6. Each task should have clear environmental impact
7. Variety in action types (recycling, energy, water, transportation, advocacy, etc.)

For each task, provide:
- Title (specific and actionable)
- Description (2-3 sentences explaining the task)
- Action type (e.g., "recycling", "energy_conservation", "tree_planting")
- Difficulty (easy/medium/hard based on their level)
- Estimated points (50-300 based on complexity and impact)
- Estimated time (realistic time commitment)
- Required resources (list of 2-5 items needed)
- Tags (3-5 relevant keywords)
- Impact metrics (e.g., co2_saved, plastic_reduced, trees_equivalent)
- Step-by-step instructions (5-8 clear steps)

Output MUST be valid JSON in this exact format:
{
  "recommendations": [
    {
      "title": "string",
      "description": "string",
      "actionType": "string",
      "difficulty": "easy|medium|hard",
      "estimatedPoints": number,
      "estimatedTime": "string",
      "requiredResources": ["string"],
      "tags": ["string"],
      "impactMetrics": {
        "co2_saved": number,
        "plastic_reduced": number,
        "trees_equivalent": number
      },
      "instructions": "string with numbered steps"
    }
  ]
}

Do not include markdown code blocks. Return only the JSON object.
`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Clean up response
        const cleanedText = text
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();

        const aiResponse = JSON.parse(cleanedText);

        // Optionally save to database for future use
        const savedTasks = [];
        for (const task of aiResponse.recommendations) {
            const { data: savedTask, error: saveError } = await supabase
                .from("recommended_tasks")
                .insert({
                    title: task.title,
                    description: task.description,
                    action_type: task.actionType,
                    difficulty: task.difficulty,
                    education_level: isCollege ? "college" : "school",
                    min_grade: isCollege ? null : Math.max(1, gradeLevel - 2),
                    max_grade: isCollege ? null : Math.min(12, gradeLevel + 2),
                    estimated_points: task.estimatedPoints,
                    estimated_time: task.estimatedTime,
                    required_resources: task.requiredResources,
                    tags: task.tags,
                    impact_metrics: task.impactMetrics,
                    instructions: task.instructions,
                    is_active: true,
                    created_by: userId // AI-generated and saved for this user
                })
                .select()
                .single();

            if (saveError) {
                console.error("❌ Error saving generated task to database:", saveError);
            }

            if (savedTask) {
                savedTasks.push(savedTask);
            }
        }

        // After generation, fetch ALL tasks for this user to return the full set
        const { data: allUserTasks } = await supabase
            .from("recommended_tasks")
            .select("*")
            .eq("is_active", true)
            .eq("created_by", userId);

        return NextResponse.json({
            success: true,
            recommendations: allUserTasks || savedTasks,
            source: "ai_generated",
            studentContext: {
                educationLevel,
                interests,
                completedTasks: stats?.completed_tasks || 0
            }
        });

    } catch (error) {
        console.error("Task recommendation error:", error);
        return NextResponse.json(
            { error: "Failed to generate recommendations", details: error.message },
            { status: 500 }
        );
    }
}

// GET endpoint to fetch recommended tasks from database
export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const educationLevel = searchParams.get("educationLevel");
        const difficulty = searchParams.get("difficulty");
        const actionType = searchParams.get("actionType");
        const limit = parseInt(searchParams.get("limit") || "10");

        let query = supabase
            .from("recommended_tasks")
            .select("*")
            .eq("is_active", true);

        // Filter by education level
        if (educationLevel) {
            const isCollege = educationLevel.toLowerCase().includes("college") ||
                educationLevel.toLowerCase().includes("university");

            if (isCollege) {
                query = query.in("education_level", ["college", "all"]);
            } else {
                const gradeMatch = educationLevel.match(/\d+/);
                const grade = gradeMatch ? parseInt(gradeMatch[0]) : null;

                if (grade) {
                    query = query.or(`education_level.eq.all,and(education_level.eq.school,min_grade.lte.${grade},max_grade.gte.${grade})`);
                } else {
                    query = query.in("education_level", ["school", "all"]);
                }
            }
        }

        // Filter by difficulty
        if (difficulty) {
            query = query.eq("difficulty", difficulty);
        }

        // Filter by action type
        if (actionType) {
            query = query.eq("action_type", actionType);
        }

        const { data: tasks, error } = await query
            .order("created_at", { ascending: false })
            .limit(limit);

        if (error) {
            throw error;
        }

        return NextResponse.json({
            success: true,
            tasks
        });

    } catch (error) {
        console.error("Fetch recommended tasks error:", error);
        return NextResponse.json(
            { error: "Failed to fetch tasks", details: error.message },
            { status: 500 }
        );
    }
}
