import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// POST submit an application
export async function POST(request) {
  try {
    const body = await request.json();
    const { studentId, opportunityId, applicationMessage } = body;

    // Validate required fields
    if (!studentId || !opportunityId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify student role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', studentId)
      .single();

    if (profileError || !profile || profile.role !== 'student') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: User is not a student' },
        { status: 403 }
      );
    }

    // Check if opportunity exists and is active
    const { data: opportunity, error: oppError } = await supabase
      .from('ngo_opportunities')
      .select('*')
      .eq('id', opportunityId)
      .eq('is_active', true)
      .single();

    if (oppError || !opportunity) {
      return NextResponse.json(
        { success: false, error: 'Opportunity not found or no longer available' },
        { status: 404 }
      );
    }

    // Check if deadline has passed
    const deadline = new Date(opportunity.deadline);
    if (deadline < new Date()) {
      return NextResponse.json(
        { success: false, error: 'Application deadline has passed' },
        { status: 400 }
      );
    }

    // Check student's points
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('eco_points')
      .eq('id', studentId)
      .single();

    if (studentError || !student) {
      return NextResponse.json(
        { success: false, error: 'Student data not found' },
        { status: 404 }
      );
    }

    if (student.eco_points < opportunity.min_points) {
      return NextResponse.json(
        { success: false, error: `You need at least ${opportunity.min_points} EcoPoints to apply. You currently have ${student.eco_points} points.` },
        { status: 400 }
      );
    }

    // Check if already applied
    const { data: existingApplication } = await supabase
      .from('opportunity_applications')
      .select('id, status')
      .eq('student_id', studentId)
      .eq('opportunity_id', opportunityId)
      .single();

    if (existingApplication) {
      if (existingApplication.status === 'withdrawn') {
        // Allow re-application if previously withdrawn
        const { data: updatedApp, error: updateError } = await supabase
          .from('opportunity_applications')
          .update({
            status: 'pending',
            application_message: applicationMessage || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingApplication.id)
          .select()
          .single();

        if (updateError) throw updateError;

        return NextResponse.json({
          success: true,
          application: updatedApp,
          message: 'Application submitted successfully!'
        });
      } else {
        return NextResponse.json(
          { success: false, error: 'You have already applied to this opportunity' },
          { status: 400 }
        );
      }
    }

    // Create new application
    const { data: application, error: insertError } = await supabase
      .from('opportunity_applications')
      .insert({
        student_id: studentId,
        opportunity_id: opportunityId,
        status: 'pending',
        application_message: applicationMessage || null
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating application:', insertError);
      return NextResponse.json(
        { success: false, error: 'Failed to submit application', details: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      application,
      message: 'Application submitted successfully!'
    });
  } catch (error) {
    console.error('Error in POST /api/opportunities/apply:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// GET check application status
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const opportunityId = searchParams.get('opportunityId');

    if (!studentId || !opportunityId) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const { data: application, error } = await supabase
      .from('opportunity_applications')
      .select('*')
      .eq('student_id', studentId)
      .eq('opportunity_id', opportunityId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching application:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch application' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      application: application || null,
      hasApplied: !!application
    });
  } catch (error) {
    console.error('Error in GET /api/opportunities/apply:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

