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
            subject,
            gradeLevel,
            educationLevel,
            duration,
            learningObjectives,
            additionalContext
        } = body;

        // Validate required fields (educationLevel is now optional)
        if (!teacherId || !subject || !gradeLevel) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields: teacherId, subject, gradeLevel' },
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

        // Generate lesson plan using Gemini AI
        const lessonPlan = await generateLessonPlanWithAI({
            subject,
            gradeLevel,
            educationLevel,
            duration: duration || '45 minutes',
            learningObjectives: learningObjectives || [],
            additionalContext: additionalContext || ''
        });

        // Save to Supabase (education_level is optional)
        const { data: savedPlan, error: saveError } = await supabase
            .from('lesson_plans')
            .insert({
                teacher_id: teacherId,
                title: lessonPlan.title,
                subject: subject,
                grade_level: gradeLevel,
                education_level: educationLevel || 'all', // Default to 'all' if not specified
                duration: duration || '45 minutes',
                learning_objectives: lessonPlan.learningObjectives,
                materials_needed: lessonPlan.materialsNeeded,
                activities: lessonPlan.activities,
                assessment_methods: lessonPlan.assessmentMethods,
                differentiation_strategies: lessonPlan.differentiationStrategies,
                homework_assignment: lessonPlan.homeworkAssignment,
                additional_resources: lessonPlan.additionalResources,
                ai_generated: true,
                ai_prompt: JSON.stringify({ subject, gradeLevel, educationLevel, duration, learningObjectives, additionalContext }),
                is_published: false
            })
            .select()
            .single();

        if (saveError) {
            console.error('Error saving lesson plan:', saveError);
            return NextResponse.json(
                { success: false, error: 'Failed to save lesson plan', details: saveError.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            lessonPlan: savedPlan,
            message: 'Lesson plan generated and saved successfully'
        });

    } catch (error) {
        console.error('Lesson plan generation error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}

async function generateLessonPlanWithAI({ subject, gradeLevel, educationLevel, duration, learningObjectives, additionalContext }) {
    try {
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

        if (!GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY not configured');
        }

        const objectivesText = learningObjectives.length > 0
            ? `\nSpecific Learning Objectives:\n${learningObjectives.map((obj, i) => `${i + 1}. ${obj}`).join('\n')}`
            : '';

        const contextText = additionalContext
            ? `\nAdditional Context: ${additionalContext}`
            : '';

        const prompt = `You are an expert educator. Generate a comprehensive, engaging lesson plan in JSON format.

Subject: ${subject}
Grade Level: ${gradeLevel}
Education Level: ${educationLevel}
Duration: ${duration}${objectivesText}${contextText}

Generate a detailed lesson plan with the following structure (respond ONLY with valid JSON):
{
  "title": "Engaging lesson title",
  "learningObjectives": ["objective 1", "objective 2", "objective 3"],
  "materialsNeeded": ["material 1", "material 2"],
  "activities": [
    {
      "name": "Activity name",
      "duration": "time",
      "description": "What students will do",
      "instructions": "Step-by-step guide"
    }
  ],
  "assessmentMethods": ["method 1", "method 2"],
  "differentiationStrategies": "How to adapt for different learning levels and styles",
  "homeworkAssignment": "Optional homework description",
  "additionalResources": ["resource 1", "resource 2"]
}

Make it appropriate for ${educationLevel} level (${gradeLevel}). Include eco-friendly and sustainability themes where relevant.`;

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

        const lessonPlan = JSON.parse(cleanedText);

        // Validate and provide defaults
        return {
            title: lessonPlan.title || `${subject} Lesson for ${gradeLevel}`,
            learningObjectives: Array.isArray(lessonPlan.learningObjectives) ? lessonPlan.learningObjectives : [],
            materialsNeeded: Array.isArray(lessonPlan.materialsNeeded) ? lessonPlan.materialsNeeded : [],
            activities: Array.isArray(lessonPlan.activities) ? lessonPlan.activities : [],
            assessmentMethods: Array.isArray(lessonPlan.assessmentMethods) ? lessonPlan.assessmentMethods : [],
            differentiationStrategies: lessonPlan.differentiationStrategies || '',
            homeworkAssignment: lessonPlan.homeworkAssignment || '',
            additionalResources: Array.isArray(lessonPlan.additionalResources) ? lessonPlan.additionalResources : []
        };

    } catch (error) {
        console.error('AI generation error:', error);
        throw new Error('Failed to generate lesson plan with AI: ' + error.message);
    }
}
