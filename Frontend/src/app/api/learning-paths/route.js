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
        const { userId, interests, regenerate } = await req.json();

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

        // Fetch student details (education level)
        const { data: details } = await supabase
            .from("user_details")
            .select("education_level, institution")
            .eq("user_id", userId)
            .single();

        if (!details || !details.education_level) {
            return NextResponse.json(
                { error: "Education level not found. Please update your profile." },
                { status: 400 }
            );
        }

        // Fetch student stats
        const { data: stats } = await supabase
            .from("students")
            .select("eco_points, completed_tasks")
            .eq("id", userId)
            .single();

        // Save or update interests
        if (interests && interests.length > 0) {
            await supabase
                .from("student_interests")
                .upsert({
                    student_id: userId,
                    interests: interests,
                    updated_at: new Date().toISOString()
                });
        }

        // Fetch existing interests if not provided
        let studentInterests = interests;
        if (!studentInterests || studentInterests.length === 0) {
            const { data: interestData } = await supabase
                .from("student_interests")
                .select("interests")
                .eq("student_id", userId)
                .single();

            studentInterests = interestData?.interests || ["sustainability", "environment"];
        }

        // Determine education context
        const educationLevel = details.education_level;
        let isCollege = educationLevel.toLowerCase().includes("college") ||
            educationLevel.toLowerCase().includes("university");
        let gradeLevel = null;

        if (!isCollege) {
            const gradeMatch = educationLevel.match(/\d+/);
            gradeLevel = gradeMatch ? parseInt(gradeMatch[0]) : 8;
        }

        // Generate learning paths with AI
        const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

        const prompt = `
You are an educational AI assistant for EcoMentor, an environmental learning platform.
Generate personalized learning paths for a student.

Student Profile:
- Name: ${profile.full_name}
- Education Level: ${educationLevel}
- Institution: ${details.institution || "Not specified"}
- Interests: ${studentInterests.join(", ")}
- Completed Tasks: ${stats?.completed_tasks || 0}
- Current EcoPoints: ${stats?.eco_points || 0}

Requirements:
1. Generate 3 learning paths tailored to their education level
2. ${isCollege ? "Use advanced terminology and concepts suitable for college students" : `Use age-appropriate language for Grade ${gradeLevel} students`}
3. Each path should align with their interests: ${studentInterests.join(", ")}
4. Progressive difficulty based on their experience (${stats?.completed_tasks || 0} tasks completed)
5. Include practical, actionable modules
6. Real-world environmental impact focus

For each learning path, provide:
- Title (engaging and specific)
- Description (2-3 sentences)
- Difficulty level (beginner/intermediate/advanced)
- 3-5 modules with:
  * Module title
  * Description
  * Activities (2-3 specific activities)
  * Duration estimate
  * Points value (50-250 based on complexity)
- Total estimated duration
- Total points
- Tags (3-5 relevant keywords)

Output MUST be valid JSON in this exact format:
{
  "learningPaths": [
    {
      "title": "string",
      "description": "string",
      "difficulty": "beginner|intermediate|advanced",
      "modules": [
        {
          "title": "string",
          "description": "string",
          "activities": ["string", "string"],
          "duration": "string",
          "points": number
        }
      ],
      "estimatedDuration": "string",
      "totalPoints": number,
      "tags": ["string", "string"]
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

        // Save generated learning paths to database
        const savedPaths = [];

        for (const path of aiResponse.learningPaths) {
            const { data: savedPath, error } = await supabase
                .from("learning_paths")
                .insert({
                    title: path.title,
                    description: path.description,
                    difficulty: path.difficulty,
                    education_level: isCollege ? "college" : "school",
                    min_grade: isCollege ? null : Math.max(1, gradeLevel - 2),
                    max_grade: isCollege ? null : Math.min(12, gradeLevel + 2),
                    modules: path.modules,
                    estimated_duration: path.estimatedDuration,
                    total_points: path.totalPoints,
                    tags: path.tags,
                    is_active: true,
                    created_by: userId // Associate with user for retrieval
                })
                .select()
                .single();

            if (error) {
                console.error("Error saving learning path:", error);
            }

            if (!error && savedPath) {
                savedPaths.push(savedPath);
            }
        }

        console.log(`✅ Saved ${savedPaths.length} learning paths to database for user ${userId}`);

        return NextResponse.json({
            success: true,
            learningPaths: savedPaths.length > 0 ? savedPaths : aiResponse.learningPaths,
            studentContext: {
                educationLevel,
                interests: studentInterests,
                completedTasks: stats?.completed_tasks || 0
            }
        });

    } catch (error) {
        console.error("Learning path generation error:", error);
        return NextResponse.json(
            { error: "Failed to generate learning paths", details: error.message },
            { status: 500 }
        );
    }
}

// GET endpoint to fetch existing learning paths
export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get("userId");
        const educationLevel = searchParams.get("educationLevel");
        const difficulty = searchParams.get("difficulty");

        let query = supabase
            .from("learning_paths")
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

        const { data: paths, error } = await query.order("created_at", { ascending: false });

        if (error) {
            throw error;
        }

        // If userId provided, fetch their progress
        let pathsWithProgress = paths;
        if (userId) {
            const { data: progressData } = await supabase
                .from("student_learning_progress")
                .select("*")
                .eq("student_id", userId);

            pathsWithProgress = paths.map(path => {
                const progress = progressData?.find(p => p.learning_path_id === path.id);
                return {
                    ...path,
                    userProgress: progress || null
                };
            });
        }

        return NextResponse.json({
            success: true,
            learningPaths: pathsWithProgress
        });

    } catch (error) {
        console.error("Fetch learning paths error:", error);
        return NextResponse.json(
            { error: "Failed to fetch learning paths", details: error.message },
            { status: 500 }
        );
    }
}
