import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(request) {
    try {
        const body = await request.json();
        const {
            teacherId,
            lessonPlanId,
            title,
            taskDescription,
            criteriaCount,
            totalPoints,
            rubricType
        } = body;

        // Validate required fields
        if (!teacherId || !title || !taskDescription) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields: teacherId, title, taskDescription' },
                { status: 400 }
            );
        }

        // Verify teacher role
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', teacherId)
            .single();

        if (profileError || !profile || profile.role !== 'teacher') {
            return NextResponse.json(
                { success: false, error: 'Unauthorized: User is not a teacher' },
                { status: 403 }
            );
        }

        // Get lesson plan context if provided
        let lessonPlanContext = '';
        if (lessonPlanId) {
            const { data: lessonPlan } = await supabase
                .from('lesson_plans')
                .select('title, subject, grade_level, learning_objectives')
                .eq('id', lessonPlanId)
                .eq('teacher_id', teacherId)
                .single();

            if (lessonPlan) {
                lessonPlanContext = `
Lesson Plan: ${lessonPlan.title}
Subject: ${lessonPlan.subject}
Grade Level: ${lessonPlan.grade_level}
Learning Objectives: ${JSON.stringify(lessonPlan.learning_objectives)}`;
            }
        }

        // Generate rubric using Gemini AI
        const rubric = await generateRubricWithAI({
            title,
            taskDescription,
            criteriaCount: criteriaCount || 4,
            totalPoints: totalPoints || 100,
            rubricType: rubricType || 'general',
            lessonPlanContext
        });

        // Save to Supabase
        const { data: savedRubric, error: saveError } = await supabase
            .from('rubrics')
            .insert({
                teacher_id: teacherId,
                lesson_plan_id: lessonPlanId || null,
                title: title,
                description: taskDescription,
                criteria: rubric.criteria,
                total_points: rubric.totalPoints,
                rubric_type: rubricType || 'general',
                ai_generated: true,
                is_active: true
            })
            .select()
            .single();

        if (saveError) {
            console.error('Error saving rubric:', saveError);
            return NextResponse.json(
                { success: false, error: 'Failed to save rubric', details: saveError.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            rubric: savedRubric,
            message: 'Rubric generated and saved successfully'
        });

    } catch (error) {
        console.error('Rubric generation error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}

async function generateRubricWithAI({ title, taskDescription, criteriaCount, totalPoints, rubricType, lessonPlanContext }) {
    try {
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

        if (!GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY not configured');
        }

        const prompt = `You are an expert educator creating assessment rubrics. Generate a detailed rubric in JSON format.

Task Title: ${title}
Task Description: ${taskDescription}
Rubric Type: ${rubricType}
Number of Criteria: ${criteriaCount}
Total Points: ${totalPoints}${lessonPlanContext ? '\n' + lessonPlanContext : ''}

Create a rubric with ${criteriaCount} criteria. Each criterion should have 4 performance levels:
- Exemplary (highest points)
- Proficient (good performance)
- Developing (needs improvement)
- Beginning (minimal performance)

Respond ONLY with valid JSON in this exact format:
{
  "criteria": [
    {
      "name": "Criterion name",
      "description": "What this criterion measures",
      "levels": [
        {
          "name": "Exemplary",
          "description": "Description of exemplary performance",
          "points": number
        },
        {
          "name": "Proficient",
          "description": "Description of proficient performance",
          "points": number
        },
        {
          "name": "Developing",
          "description": "Description of developing performance",
          "points": number
        },
        {
          "name": "Beginning",
          "description": "Description of beginning performance",
          "points": number
        }
      ]
    }
  ]
}

Distribute the ${totalPoints} points across all criteria evenly. Make the rubric clear, specific, and measurable.`;

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${GEMINI_API_KEY}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 2048
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Gemini API error:', response.status, errorText);
            throw new Error(`Gemini API returned ${response.status}`);
        }

        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '{}';

        // Clean up the response
        const cleanedText = text
            .replace(/```json/g, '')
            .replace(/```/g, '')
            .trim();

        const rubricData = JSON.parse(cleanedText);

        // Validate and calculate total points
        let calculatedTotal = 0;
        if (Array.isArray(rubricData.criteria)) {
            rubricData.criteria.forEach(criterion => {
                if (criterion.levels && criterion.levels.length > 0) {
                    const maxPoints = Math.max(...criterion.levels.map(l => l.points || 0));
                    calculatedTotal += maxPoints;
                }
            });
        }

        return {
            criteria: rubricData.criteria || [],
            totalPoints: calculatedTotal || totalPoints
        };

    } catch (error) {
        console.error('AI generation error:', error);
        throw new Error('Failed to generate rubric with AI: ' + error.message);
    }
}
