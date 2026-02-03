import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(request) {
  try {
    const body = await request.json();
    const { studentId, actionType, description, location, date, estimatedImpact, images } = body;

    // Required fields check
    if (!studentId || !actionType || !description || !images || images.length === 0) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase();

    // IMPORTANT: Fetch student details from Supabase (not MongoDB)
    const { data: student, error: supabaseError } = await supabase
      .from('user_details')
      .select('*')
      .eq('user_id', studentId)
      .single();

    if (supabaseError || !student) {
      console.error("Supabase error:", supabaseError);
      return NextResponse.json(
        { success: false, error: "Student not found in Supabase" },
        { status: 404 }
      );
    }

    // STEP 1: Gemini AI Verification
    const aiVerification = await verifyWithGemini({
      actionType,
      description,
      location,
      date,
      estimatedImpact,
      images
    });

    // STEP 2: Determine submission status
    let status = "pending_review";
    let autoApproved = false;

    if (aiVerification.confidence > 0.9 && aiVerification.verified) {
      status = "approved";
      autoApproved = true;
    } else if (!aiVerification.verified || aiVerification.confidence < 0.7) {
      status = "ai_flagged";
    }

    // STEP 3: Save the submission to MongoDB
    // Store Supabase student ID as a STRING (not ObjectId)
    const submission = {
      studentId: studentId, // Store as string (Supabase UUID or ID)
      studentName: student.name || student.full_name || "Unknown",
      classroomId: student.classroom_id || null,
      actionType,
      description,
      location,
      date,
      estimatedImpact,
      images,
      status,
      autoApproved,
      aiVerification,
      submittedAt: new Date(),
      reviewedAt: autoApproved ? new Date() : null,
      reviewedBy: autoApproved ? "AI_AUTO_APPROVE" : null,
      teacherNotes: "",
      finalPoints: autoApproved ? aiVerification.suggestedPoints : 0,
    };

    const result = await db.collection("action_submissions").insertOne(submission);

    // STEP 4: Auto-approve: update student points in SUPABASE
    if (autoApproved) {
      // Update Supabase student record
      const { error: updateError } = await supabase
        .from('students')
        .update({
          eco_points: (student.eco_points || 0) + aiVerification.suggestedPoints,
          completed_tasks: (student.completed_tasks || 0) + 1,
        })
        .eq('id', studentId);

      if (updateError) {
        console.error("Error updating student in Supabase:", updateError);
      }

      // Log action in MongoDB
      await db.collection("student_actions").insertOne({
        studentId: studentId, // String, not ObjectId
        submissionId: result.insertedId,
        actionType,
        points: aiVerification.suggestedPoints,
        date: new Date(),
        status: "approved",
      });
    }

    // STEP 5: Notify teacher if flagged
    if (status === "ai_flagged" && student.classroom_id) {
      await db.collection("notifications").insertOne({
        type: "action_review_needed",
        classroomId: student.classroom_id,
        submissionId: result.insertedId,
        studentName: student.name || student.full_name,
        message: `${student.name || student.full_name}'s action needs review - AI flagged for verification`,
        createdAt: new Date(),
        read: false,
      });
    }

    return NextResponse.json({
      success: true,
      submissionId: result.insertedId.toString(),
      status,
      autoApproved,
      aiVerification: {
        message: aiVerification.verified
          ? `Action verified! ${autoApproved ? "Points awarded automatically." : "Pending teacher review."}`
          : "Action requires manual review by teacher.",
        confidence: aiVerification.confidence,
        suggestedPoints: aiVerification.suggestedPoints,
      },
    });

  } catch (error) {
    console.error("Verification error:", error);

    return NextResponse.json(
      { success: false, error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}


async function verifyWithGemini({ actionType, description, location, date, estimatedImpact, images }) {
  try {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
      console.warn("GEMINI_API_KEY not found, skipping AI verification");
      return {
        verified: false,
        confidence: 0,
        reasoning: "AI verification unavailable. Requires manual review.",
        suggestedPoints: 100,
        flaggedIssues: ["API key not configured"],
      };
    }

    // Prepare image parts
    const imageParts = images.slice(0, 3).map((img) => {
      const base64Data = img.includes(",") ? img.split(",")[1] : img;
      const mimeType = img.includes(",")
        ? img.split(",")[0].split(":")[1].split(";")[0]
        : "image/jpeg";

      return {
        inlineData: { data: base64Data, mimeType },
      };
    });

    // Gemini REST API endpoint
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${GEMINI_API_KEY}`;

    const prompt = `
You are an eco-action verification AI. Analyze the images and details and respond ONLY with JSON:
{
  "verified": true/false,
  "confidence": 0.0-1.0,
  "reasoning": "short reasoning",
  "suggestedPoints": number,
  "flaggedIssues": []
}

Action Type: ${actionType}
Description: ${description}
Location: ${location || "Not provided"}
Date: ${date || "Not provided"}
Impact: ${estimatedImpact || "Not provided"}
`;

    // Request to Gemini
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          { parts: [{ text: prompt }, ...imageParts] }
        ]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", response.status, errorText);
      throw new Error(`Gemini API returned ${response.status}`);
    }

    const data = await response.json();

    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "{}";

    const cleanedText = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const result = JSON.parse(cleanedText);

    return {
      verified: result.verified ?? false,
      confidence: result.confidence ?? 0,
      reasoning: result.reasoning || "No reasoning provided",
      suggestedPoints: result.suggestedPoints ?? 100,
      flaggedIssues: result.flaggedIssues || [],
    };
  } catch (error) {
    console.error("Gemini verification error:", error);

    return {
      verified: false,
      confidence: 0,
      reasoning: "AI verification failed. Requires manual review.",
      suggestedPoints: 100,
      flaggedIssues: ["AI verification error"],
    };
  }
}