import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const teacherId = searchParams.get('teacherId');

        if (!teacherId) {
            return NextResponse.json(
                { success: false, error: 'Missing teacherId parameter' },
                { status: 400 }
            );
        }

        const { data: lessonPlans, error } = await supabase
            .from('lesson_plans')
            .select('*')
            .eq('teacher_id', teacherId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching lesson plans:', error);
            return NextResponse.json(
                { success: false, error: 'Failed to fetch lesson plans', details: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            lessonPlans
        });

    } catch (error) {
        console.error('Lesson plans fetch error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}
