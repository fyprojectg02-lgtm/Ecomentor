import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(req) {
  try {
    const { topic, difficulty, educationLevel } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    // Adjust prompt based on education level
    let levelContext = "";
    if (educationLevel === "college") {
      levelContext = "The student is in College/University. The questions should be advanced, requiring critical thinking and application of concepts. Include some technical details.";
    } else {
      levelContext = `The student is in School (Grade ${educationLevel || "General"}). The questions should be age-appropriate, focusing on core concepts and awareness. Avoid overly complex jargon.`;
    }

    const prompt = `
      Generate a quiz about "${topic}".
      Difficulty: ${difficulty}.
      Target Audience: ${levelContext}

      The output MUST be a valid JSON object with the following structure:
      {
        "title": "Quiz Title",
        "topic": "${topic}",
        "difficulty": "${difficulty}",
        "totalQuestions": 10,
        "timeLimit": 600,
        "questions": [
          {
            "id": 1,
            "question": "Question text",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correctAnswer": 0, (index of correct option)
            "explanation": "Brief explanation of the answer",
            "points": 10
          }
        ]
      }
      
      Generate exactly 10 questions.
      Do not wrap the JSON in markdown code blocks. Just return the raw JSON string.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Clean up if markdown code blocks are present despite instructions
    const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();

    const quizData = JSON.parse(cleanedText);

    return NextResponse.json(quizData);
  } catch (error) {
    console.error("Quiz generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate quiz" },
      { status: 500 }
    );
  }
}
