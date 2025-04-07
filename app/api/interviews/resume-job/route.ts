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

    // Generate interview questions with improved prompt for better JSON formatting
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
6. Format your response as a valid JSON array of strings, following this exact format:
["Question 1", "Question 2", "Question 3"]
7. The questions are going to be read by a voice assistant so do not use "/" or "*" or any other special characters which might break the voice assistant
8. DO NOT include any explanations, preamble or additional text outside the JSON array

Return ONLY a valid JSON array and nothing else.`,
    });

    console.log("Generated questions text:", questionsText);

    // Parse the questions with enhanced error handling
    let questions;
    try {
      // Clean the response text to improve JSON parsing success
      const cleanedText = questionsText.trim()
        .replace(/^```json/i, '') // Remove potential markdown code block start
        .replace(/```$/i, '')     // Remove potential markdown code block end
        .trim();
        
      questions = JSON.parse(cleanedText);
      
      // Ensure questions is an array
      if (!Array.isArray(questions)) {
        console.error("Parsed questions is not an array:", questions);
        
        // If the result is an object with a questions array, extract it
        if (questions && questions.questions && Array.isArray(questions.questions)) {
          questions = questions.questions;
        } else {
          throw new Error("Questions format is invalid");
        }
      }
    } catch (parseError) {
      console.error("Failed to parse questions:", parseError);
      console.log("Raw questions text:", questionsText);
      
      // More robust regex to extract array content
      // This handles cases where the model might add extra text
      const arrayMatch = questionsText.match(/\[([\s\S]*?)\]/);
      if (arrayMatch) {
        try {
          // Try to parse the extracted content as a JSON array
          const extractedContent = arrayMatch[0];
          questions = JSON.parse(extractedContent);
          
          if (!Array.isArray(questions)) {
            throw new Error("Extracted content is not an array");
          }
        } catch (e) {
          console.error("Array extraction parse attempt failed:", e);
          
          // Last resort: try to split by commas and clean up
          try {
            const arrayContent = arrayMatch[1];
            const questionItems = arrayContent.split('","').map(item => 
              item.replace(/^"/, '').replace(/"$/, '').trim()
            );
            questions = questionItems.filter(q => q.length > 0);
            
            if (questions.length === 0) {
              throw new Error("No valid questions extracted");
            }
          } catch (lastError) {
            return NextResponse.json(
              { success: false, error: "Failed to parse generated questions" },
              { status: 500 }
            );
          }
        }
      } else {
        // If all else fails, try to generate questions from the text directly
        const lines = questionsText.split(/\n/).filter(line => 
          line.trim().length > 10 && 
          !line.includes('```') && 
          !line.includes('{') && 
          !line.includes('}')
        );
        
        if (lines.length >= 3) {
          questions = lines.slice(0, amount).map(line => 
            line.replace(/^\d+[\.\)\s]+/, '').trim()
          );
        } else {
          return NextResponse.json(
            { success: false, error: "Failed to parse generated questions" },
            { status: 500 }
          );
        }
      }
    }

    // Ensure we have the right number of questions
    questions = questions.slice(0, amount);
    
    // Validate that we have at least one question
    if (!questions || questions.length === 0) {
      return NextResponse.json(
        { success: false, error: "Failed to generate valid questions" },
        { status: 500 }
      );
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
      { success: false, error: error instanceof Error ? error.message : `${error}` },
      { status: 500 }
    );
  }
}