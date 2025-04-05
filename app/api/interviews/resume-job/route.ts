import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { db } from "@/firebase/admin";
import { getRandomInterviewCover } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const { resume, jobDescription, userId, role, level, type, amount = 5 } = body;

    // Validate required fields
    if (!resume || !jobDescription || !userId) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: resume, jobDescription, and userId are required" },
        { status: 400 }
      );
    }

    console.log("Generating tailored interview questions based on resume and job description");

    // Generate interview questions
    const { text: questionsText } = await generateText({
      model: google("gemini-2.0-flash-001"),
      prompt: `Create a personalized technical interview for a candidate based on their resume and the job description.

Resume:
${resume}

Job Description:
${jobDescription}

Instructions:
1. Generate ${amount} interview questions that assess the candidate's fit for this specific role
2. The questions should focus on ${type || "a balance of technical and behavioral"} aspects
3. Evaluate the candidate's experience level (${level || "as shown in their resume"}) and match questions to this level
4. Include questions that specifically address the gap between the candidate's resume and job requirements
5. For the job role of ${role || "the position in the job description"}
6. Format your response as a valid JSON array of strings: ["Question 1", "Question 2", "Question 3"]
7. The questions are going to be read by a voice assistant so do not use "/" or "*" or any other special characters which might break the voice assistant

Return ONLY the JSON array with no explanation or additional text.`,
    });

    console.log("Generated questions text:", questionsText);

    // Parse the questions
    let questions;
    try {
      questions = JSON.parse(questionsText.trim());
      
      // Ensure questions is an array
      if (!Array.isArray(questions)) {
        console.error("Parsed questions is not an array:", questions);
        throw new Error("Questions format is invalid");
      }
    } catch (parseError) {
      console.error("Failed to parse questions:", parseError);
      console.log("Raw questions text:", questionsText);
      
      // Attempt to extract array from text if JSON parse failed
      const match = questionsText.match(/\[(.*)\]/s);
      if (match) {
        try {
          questions = JSON.parse(`[${match[1]}]`);
        } catch (e) {
          console.error("Second parse attempt failed:", e);
          return NextResponse.json(
            { success: false, error: "Failed to parse generated questions" },
            { status: 500 }
          );
        }
      } else {
        return NextResponse.json(
          { success: false, error: "Failed to parse generated questions" },
          { status: 500 }
        );
      }
    }

    // Create interview document
    const interview = {
      role: role || "Custom Role",
      type: type || "mixed",
      level: level || "custom",
      resume: resume,
      jobDescription: jobDescription,
      isCustom: true,
      questions: questions,
      userId: userId,
      finalized: true,
      coverImage: getRandomInterviewCover(),
      createdAt: new Date().toISOString(),
    };

    // Save to Firestore
    const docRef = await db.collection("interviews").add(interview);
    console.log("Interview saved with ID:", docRef.id);

    return NextResponse.json(
      { 
        success: true, 
        interviewId: docRef.id,
        questions: questions
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in interview generation:", error);
    return NextResponse.json(
      { success: false, error: `${error}` },
      { status: 500 }
    );
  }
}