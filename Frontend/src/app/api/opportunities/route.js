import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// GET all active opportunities
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // Optional filter by type
    const category = searchParams.get('category'); // Optional filter by category

    let query = supabase
      .from('ngo_opportunities')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    // Apply filters if provided
    if (type && type !== 'all') {
      query = query.eq('type', type);
    }

    if (category) {
      query = query.eq('category', category);
    }

    const { data: opportunities, error } = await query;

    if (error) {
      console.error('Error fetching opportunities:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch opportunities' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      opportunities: opportunities || []
    });
  } catch (error) {
    console.error('Error in GET /api/opportunities:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// POST create a new opportunity (teachers only)
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      teacherId,
      title,
      ngoName,
      description,
      duration,
      minPoints,
      location,
      type,
      spots,
      category,
      perks,
      deadline
    } = body;

    // Validate required fields
    if (!teacherId || !title || !ngoName || !description || !duration || 
        !location || !type || !category || !deadline) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
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

    // Validate type
    const validTypes = ['Internship', 'Volunteer', 'Ambassador', 'Training'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid opportunity type' },
        { status: 400 }
      );
    }

    // Insert opportunity
    const { data: opportunity, error: insertError } = await supabase
      .from('ngo_opportunities')
      .insert({
        teacher_id: teacherId,
        title,
        ngo_name: ngoName,
        description,
        duration,
        min_points: minPoints || 0,
        location,
        type,
        spots: spots || 1,
        category,
        perks: perks || [],
        deadline,
        is_active: true
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating opportunity:', insertError);
      return NextResponse.json(
        { success: false, error: 'Failed to create opportunity', details: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      opportunity
    });
  } catch (error) {
    console.error('Error in POST /api/opportunities:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

