// app/api/student/current/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET(request) {
  try {
    // TODO: Get authenticated user's ID from your auth system
    // For now, fetch the first student as demo
    const { data: students, error } = await supabase
      .from('students')
      .select('*')
      .limit(1);

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch student from Supabase" },
        { status: 500 }
      );
    }

    if (!students || students.length === 0) {
      return NextResponse.json(
        { success: false, error: "No students found in Supabase" },
        { status: 404 }
      );
    }

    const student = students[0];

    return NextResponse.json({
      success: true,
      student: {
        id: student.id, // This is your Supabase student ID (UUID or integer)
        name: student.name || student.full_name || "Unknown",
        email: student.email,
        ecoPoints: student.eco_points || 0,
        completedTasks: student.completed_tasks || 0,
        classroomId: student.classroom_id
      }
    });
  } catch (error) {
    console.error("Error fetching student:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch student" },
      { status: 500 }
    );
  }
}

// Optional: Get student by ID
export async function POST(request) {
  try {
    const { studentId } = await request.json();

    if (!studentId) {
      return NextResponse.json(
        { success: false, error: "Student ID required" },
        { status: 400 }
      );
    }

    const { data: student, error } = await supabase
      .from('students')
      .select('*')
      .eq('id', studentId)
      .single();

    if (error || !student) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { success: false, error: "Student not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      student: {
        id: student.id,
        name: student.name || student.full_name || "Unknown",
        email: student.email,
        ecoPoints: student.eco_points || 0,
        completedTasks: student.completed_tasks || 0,
        classroomId: student.classroom_id
      }
    });
  } catch (error) {
    console.error("Error fetching student:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch student" },
      { status: 500 }
    );
  }
}