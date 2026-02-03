import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Initialize Supabase Admin Client (to fetch user data securely)
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    // Note: For read-only access to user stats, anon key is often fine if RLS policies allow reading.
    // If we need to bypass RLS, we'd need a SERVICE_ROLE_KEY, but let's stick to standard flow for now using passed user ID.
);

export async function POST(req) {
    try {
        const { message, history, userId } = await req.json();

        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json(
                { error: "GEMINI_API_KEY is not configured" },
                { status: 500 }
            );
        }

        // 1. Fetch Student Context
        let studentContext = "The user is a student on EcoMentor.";

        if (userId) {
            // Fetch profile
            const { data: profile } = await supabase
                .from("profiles")
                .select("full_name, role")
                .eq("id", userId)
                .single();

            // Fetch details
            const { data: details } = await supabase
                .from("user_details")
                .select("education_level, institution")
                .eq("user_id", userId)
                .single();

            // Fetch stats
            const { data: stats } = await supabase
                .from("students")
                .select("eco_points, completed_tasks")
                .eq("id", userId)
                .single();

            // Fetch impact metrics
            const { data: impact } = await supabase
                .from("impact_metrics")
                .select("co2_saved_kg, trees_equivalent, plastic_reduced_kg, water_saved_liters")
                .eq("student_id", userId)
                .single();

            // Fetch rank
            const { data: rankData } = await supabase
                .rpc('get_student_rank', { p_student_id: userId });

            if (profile) {
                studentContext += ` Name: ${profile.full_name || 'Student'}. Role: ${profile.role}.`;
            }
            if (details) {
                studentContext += ` Education Level: ${details.education_level || 'Not specified'}. Institution: ${details.institution || 'Not specified'}.`;
            }
            if (stats) {
                studentContext += ` Current EcoPoints: ${stats.eco_points || 0}. Completed Tasks: ${stats.completed_tasks || 0}.`;
            }
            if (impact) {
                studentContext += ` Environmental Impact: CO₂ Saved: ${impact.co2_saved_kg || 0} kg, Trees Equivalent: ${impact.trees_equivalent || 0}, Plastic Reduced: ${impact.plastic_reduced_kg || 0} kg, Water Saved: ${impact.water_saved_liters || 0} liters.`;
            }
            if (rankData && rankData.length > 0) {
                studentContext += ` Current Rank: #${rankData[0].rank || 'N/A'} out of ${rankData[0].total_students || 0} students.`;
            }
        }

        const model = genAI.getGenerativeModel({
            model: "gemini-3-flash-preview",
            systemInstruction: {
                parts: [{
                    text: `
        You are EcoBot, a friendly and motivating AI assistant for the EcoMentor platform - an environmental education platform that gamifies learning about sustainability.
        
        Your Goal: Help students learn about sustainability, track their progress, and stay motivated through personalized guidance.
        
        Student Context:
        ${studentContext}
        
        Guidelines:
        1. Personalize responses based on their education level (Simple explanations for school students, detailed for college students).
        2. When they ask about their points, progress, rank, or impact metrics, use the exact numbers from the context provided above.
        3. Provide educational answers about environmental topics (climate change, renewable energy, conservation, recycling, etc.) tailored to their level.
        4. Keep responses concise (2-3 sentences) unless they ask for detailed explanations.
        5. Use emojis occasionally to be friendly and engaging 🌱🌍♻️.
        6. Encourage real-world eco-actions and celebrate their achievements.
        7. If they ask about topics you don't have specific data for, provide general educational information.
        8. Be motivational and supportive, especially when discussing their progress.
        9. Answer questions about environmental education, sustainability practices, and how to improve their environmental impact.
        
        Remember: You have access to their current EcoPoints, completed tasks, rank, and environmental impact metrics. Use this information to provide personalized responses.
      `
                }]
            }
        });

        const chat = model.startChat({
            history: history || [],
        });

        const result = await chat.sendMessage(message);
        const response = await result.response;
        const text = response.text();

        return NextResponse.json({ reply: text });

    } catch (error) {
        console.error("Chat error:", error);
        return NextResponse.json(
            { error: "Failed to process chat" },
            { status: 500 }
        );
    }
}
