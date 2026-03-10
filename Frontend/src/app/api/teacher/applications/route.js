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

        // 1. Get all opportunities created by this teacher
        const { data: opportunities, error: oppError } = await supabase
            .from('ngo_opportunities')
            .select('id, title, ngo_name')
            .eq('teacher_id', teacherId);

        if (oppError) {
            console.error('Error fetching teacher opportunities:', oppError);
            return NextResponse.json(
                { success: false, error: 'Failed to fetch opportunities' },
                { status: 500 }
            );
        }

        if (!opportunities || opportunities.length === 0) {
            return NextResponse.json({
                success: true,
                applications: []
            });
        }

        const opportunityIds = opportunities.map(opp => opp.id);

        // 2. Fetch applications for these opportunities
        const { data: applications, error: appError } = await supabase
            .from('opportunity_applications')
            .select(`
        id,
        opportunity_id,
        student_id,
        status,
        application_message,
        created_at
      `)
            .in('opportunity_id', opportunityIds)
            .order('created_at', { ascending: false });

        if (appError) {
            console.error('Error fetching applications:', appError);
            return NextResponse.json(
                { success: false, error: 'Failed to fetch applications' },
                { status: 500 }
            );
        }

        if (!applications || applications.length === 0) {
            return NextResponse.json({
                success: true,
                applications: []
            });
        }

        // 3. Get student details for the applications
        const studentIds = applications.map(app => app.student_id);
        const { data: students, error: studentError } = await supabase
            .from('students')
            .select('id, name, email')
            .in('id', studentIds);

        if (studentError) {
            console.error('Error fetching student details:', studentError);
            return NextResponse.json(
                { success: false, error: 'Failed to fetch student details' },
                { status: 500 }
            );
        }

        // Map student info for easy lookup
        const studentMap = (students || []).reduce((acc, s) => {
            acc[s.id] = s;
            return acc;
        }, {});

        // Map opportunity titles for easy lookup
        const opportunityMap = (opportunities || []).reduce((acc, o) => {
            acc[o.id] = { title: o.title, ngoName: o.ngo_name };
            return acc;
        }, {});

        // 4. Combine application data with student and opportunity info
        const formattedApplications = applications.map(app => ({
            ...app,
            student: studentMap[app.student_id] || { name: 'Unknown Student', email: 'N/A' },
            opportunity: opportunityMap[app.opportunity_id] || { title: 'Unknown Opportunity', ngoName: 'N/A' }
        }));

        return NextResponse.json({
            success: true,
            applications: formattedApplications
        });
    } catch (error) {
        console.error('Error in GET /api/teacher/applications:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}

// PATCH update application status
export async function PATCH(request) {
    try {
        const body = await request.json();
        const { applicationId, status, teacherId } = body;

        if (!applicationId || !status || !teacherId) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        if (!['accepted', 'rejected', 'pending'].includes(status)) {
            return NextResponse.json(
                { success: false, error: 'Invalid status' },
                { status: 400 }
            );
        }

        // 1. Verify user is a teacher
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

        // 2. Verify the application belongs to an opportunity created by this teacher
        const { data: application, error: appError } = await supabase
            .from('opportunity_applications')
            .select('opportunity_id')
            .eq('id', applicationId)
            .single();

        if (appError || !application) {
            return NextResponse.json(
                { success: false, error: 'Application not found' },
                { status: 404 }
            );
        }

        const { data: opportunity, error: oppError } = await supabase
            .from('ngo_opportunities')
            .select('teacher_id')
            .eq('id', application.opportunity_id)
            .single();

        if (oppError || !opportunity || opportunity.teacher_id !== teacherId) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized: You do not own this opportunity' },
                { status: 403 }
            );
        }

        // 3. Update status
        const { data: updatedApp, error: updateError } = await supabase
            .from('opportunity_applications')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', applicationId)
            .select()
            .single();

        if (updateError) {
            console.error('Error updating application status:', updateError);
            return NextResponse.json(
                { success: false, error: 'Failed to update status' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            application: updatedApp
        });
    } catch (error) {
        console.error('Error in PATCH /api/teacher/applications:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}
