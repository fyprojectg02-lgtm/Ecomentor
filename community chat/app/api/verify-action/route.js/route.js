import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(request) {
  try {
    const body = await request.json();
    const { studentId, actionType, description, location, date, estimatedImpact, images } = body;

    // Validate required fields
    if (!studentId || !actionType || !description || !images || images.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase();

    // ==========================================
    // STEP 1: AI VERIFICATION using Gemini API
    // ==========================================
    const aiVerification = await verifyWithGemini({
      actionType,
      description,
      location,
      date,
      estimatedImpact,
      images
    });

    // ==========================================
    // STEP 2: Determine submission status
    // ==========================================
    let status = 'pending_review';
    let autoApproved = false;

    // Auto-approve if AI confidence is very high (>90%) and verified
    if (aiVerification.confidence > 0.90 && aiVerification.verified) {
      status = 'approved';
      autoApproved = true;
    }
    // Flag for manual review if AI has concerns
    else if (!aiVerification.verified || aiVerification.confidence < 0.70) {
      status = 'ai_flagged';
    }

    // Get student details
    const student = await db.collection('students').findOne({
      _id: new ObjectId(studentId)
    });

    // ==========================================
    // STEP 3: Save to MongoDB
    // ==========================================
    const submission = {
      studentId: new ObjectId(studentId),
      studentName: student?.name || 'Unknown',
      classroomId: student?.classroomId || null,
      actionType,
      description,
      location,
      date,
      estimatedImpact,
      images, // Store as array of base64 or URLs
      status,
      autoApproved,
      aiVerification,
      submittedAt: new Date(),
      reviewedAt: autoApproved ? new Date() : null,
      reviewedBy: autoApproved ? 'AI_AUTO_APPROVE' : null,
      teacherNotes: '',
      finalPoints: autoApproved ? aiVerification.suggestedPoints : 0
    };

    const result = await db.collection('action_submissions').insertOne(submission);

    // ==========================================
    // STEP 4: Update student points if auto-approved
    // ==========================================
    if (autoApproved) {
      await db.collection('students').updateOne(
        { _id: new ObjectId(studentId) },
        {
          $inc: {
            ecoPoints: aiVerification.suggestedPoints,
            completedTasks: 1
          }
        }
      );

      // Add to student's action history
      await db.collection('student_actions').insertOne({
        studentId: new ObjectId(studentId),
        submissionId: result.insertedId,
        actionType,
        points: aiVerification.suggestedPoints,
        date: new Date(),
        status: 'approved'
      });
    }

    // ==========================================
    // STEP 5: Create notification for teacher if flagged
    // ==========================================
    if (status === 'ai_flagged' && student?.classroomId) {
      await db.collection('notifications').insertOne({
        type: 'action_review_needed',
        classroomId: student.classroomId,
        submissionId: result.insertedId,
        studentName: student.name,
        message: `${student.name}'s action needs review - AI flagged for verification`,
        createdAt: new Date(),
        read: false
      });
    }

    return NextResponse.json({
      success: true,
      submissionId: result.insertedId.toString(),
      status,
      autoApproved,
      aiVerification: {
        message: aiVerification.verified
          ? `Action verified! ${autoApproved ? 'Points awarded automatically.' : 'Pending teacher review.'}`
          : 'Action requires manual review by teacher.',
        confidence: aiVerification.confidence,
        suggestedPoints: aiVerification.suggestedPoints
      }
    });

  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// =============================================
// AI VERIFICATION FUNCTION using Gemini
// =============================================
async function verifyWithGemini({ actionType, description, location, date, estimatedImpact, images }) {
  try {
    // Use Gemini Pro Vision model
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    // Prepare images for Gemini (convert base64 to proper format)
    const imageParts = images.slice(0, 3).map(base64Image => {
      // Remove data URL prefix if present
      const base64Data = base64Image.includes(',')
        ? base64Image.split(',')[1]
        : base64Image;

      // Extract mime type
      const mimeType = base64Image.includes(',')
        ? base64Image.split(',')[0].split(':')[1].split(';')[0]
        : 'image/jpeg';

      return {
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      };
    });

    const prompt = `You are an eco-action verification AI. Analyze the submitted images and information to verify if this environmental action is legitimate and calculate appropriate points.

**Submission Details:**
- Action Type: ${actionType}
- Description: ${description}
- Location: ${location}
- Date: ${date}
- Estimated Impact: ${estimatedImpact || 'Not provided'}

**Your Task:**
1. Verify if the images show evidence of the described action
2. Check if the action type matches what's shown in images
3. Assess if the estimated impact is reasonable
4. Identify any red flags or concerns

**Respond ONLY with a valid JSON object (no markdown, no explanation) containing:**
{
  "verified": true/false,
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation",
  "suggestedPoints": number (50-500 based on impact),
  "flaggedIssues": ["issue1", "issue2"] or []
}

**Point Guidelines:**
- Small actions (picking litter, using reusable bags): 50-100 points
- Medium actions (tree planting 5-10, small cleanup): 100-200 points
- Large actions (major cleanups, 10+ trees, organizing events): 200-500 points`;

    // Generate content with images
    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    const text = response.text();

    // Clean and parse JSON response
    const cleanedText = text
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const aiResult = JSON.parse(cleanedText);

    return {
      verified: aiResult.verified,
      confidence: aiResult.confidence,
      reasoning: aiResult.reasoning,
      suggestedPoints: aiResult.suggestedPoints,
      flaggedIssues: aiResult.flaggedIssues || []
    };

  } catch (error) {
    console.error('Gemini verification error:', error);
    // Fallback: flag for manual review if AI fails
    return {
      verified: false,
      confidence: 0,
      reasoning: 'AI verification failed. Requires manual review.',
      suggestedPoints: 100,
      flaggedIssues: ['AI verification error']
    };
  }
}