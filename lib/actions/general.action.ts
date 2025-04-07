"use server";

import { generateText } from "ai";

import { generateObject } from "ai";
import { google } from "@ai-sdk/google";

import { db,auth } from "@/firebase/admin";
import { feedbackSchema } from "@/constants";
import { cookies } from "next/headers";


export async function createFeedback(params: CreateFeedbackParams) {
  const { interviewId, userId, transcript, feedbackId } = params;

  try {
    const formattedTranscript = transcript
      .map(
        (sentence: { role: string; content: string }) =>
          `- ${sentence.role}: ${sentence.content}\n`
      )
      .join("");

    const { object } = await generateObject({
      model: google("gemini-2.0-flash-001", {
        structuredOutputs: false,
      }),
      schema: feedbackSchema,
      prompt: `
        You are an AI interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories. Be thorough and detailed in your analysis. Don't be lenient with the candidate. If there are mistakes or areas for improvement, point them out.
        Transcript:
        ${formattedTranscript}

        Please score the candidate from 0 to 100 in the following areas. Do not add categories other than the ones provided:
        - **Communication Skills**: Clarity, articulation, structured responses.
        - **Technical Knowledge**: Understanding of key concepts for the role.
        - **Problem-Solving**: Ability to analyze problems and propose solutions.
        - **Cultural & Role Fit**: Alignment with company values and job role.
        - **Confidence & Clarity**: Confidence in responses, engagement, and clarity.
        `,
      system:
        "You are a professional interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories",
    });

    const feedback = {
      interviewId: interviewId,
      userId: userId,
      totalScore: object.totalScore,
      categoryScores: object.categoryScores,
      strengths: object.strengths,
      areasForImprovement: object.areasForImprovement,
      finalAssessment: object.finalAssessment,
      createdAt: new Date().toISOString(),
    };

    let feedbackRef;

    if (feedbackId) {
      feedbackRef = db.collection("feedback").doc(feedbackId);
    } else {
      feedbackRef = db.collection("feedback").doc();
    }

    await feedbackRef.set(feedback);

    return { success: true, feedbackId: feedbackRef.id };
  } catch (error) {
    console.error("Error saving feedback:", error);
    return { success: false };
  }
}

// export async function createFeedback({ 
//   interviewId, 
//   userId, 
//   transcript, 
//   feedbackId,
//   resume = "",
//   jobDescription = ""
// }) {
//   try {
//     console.log("Creating feedback for interview:", interviewId);
    
//     // Format transcript for AI
//     const formattedTranscript = transcript
//       .map((msg) => `${msg.role}: ${msg.content}`)
//       .join("\n\n");
      
//     // Generate prompt based on whether resume and job description are provided
//     let prompt = "";
    
//     if (resume && jobDescription) {
//       prompt = `You are an expert interview evaluator. Review this interview transcript and provide detailed feedback.

// CANDIDATE RESUME:
// ${resume}

// JOB DESCRIPTION:
// ${jobDescription}

// INTERVIEW TRANSCRIPT:
// ${formattedTranscript}

// Please provide comprehensive feedback on:
// 1. Technical Skills Assessment - How well did the candidate's technical skills align with the job requirements? Identify strengths and gaps.
// 2. Behavioral Assessment - Evaluate the candidate's communication skills, problem-solving approach, and cultural fit.
// 3. Resume vs. Performance - Compare the candidate's stated qualifications with their actual interview performance.
// 4. Areas of Improvement - What specific skills or knowledge areas should the candidate work on?
// 5. Overall Recommendation - Would you recommend hiring this candidate for this specific role? Why or why not?

// Format your feedback in markdown, with clear headings and bullet points for easy readability.`;
//     } else {
//       prompt = `You are an expert interview evaluator. Review this interview transcript and provide detailed feedback.

// INTERVIEW TRANSCRIPT:
// ${formattedTranscript}

// Please provide comprehensive feedback on:
// 1. Technical Skills - Evaluate the candidate's technical knowledge and problem-solving abilities.
// 2. Communication Skills - Assess clarity, conciseness, and effectiveness of communication.
// 3. Areas of Strength - What did the candidate do well during the interview?
// 4. Areas for Improvement - What could the candidate improve on?
// 5. Overall Assessment - Summarize your evaluation and provide general advice for future interviews.

// Format your feedback in markdown, with clear headings and bullet points for easy readability.`;
//     }
    
//     console.log("Generating feedback...");
    
//     // Generate feedback using AI
//     const { text: feedbackText } = await generateText({
//       model: google("gemini-2.0-flash-001"),
//       prompt: prompt,
//     });
    
//     console.log("Feedback generated");
    
//     // Save feedback to database
//     let feedbackRef;
//     if (feedbackId) {
//       feedbackRef = db.collection("feedback").doc(feedbackId);
//       await feedbackRef.update({
//         content: feedbackText,
//         updatedAt: new Date().toISOString(),
//       });
//     } else {
//       feedbackRef = db.collection("feedback").doc();
//       await feedbackRef.set({
//         interviewId,
//         userId,
//         content: feedbackText,
//         createdAt: new Date().toISOString(),
//       });
//     }
    
//     console.log("Feedback saved with ID:", feedbackRef.id);
    
//     return { success: true, feedbackId: feedbackRef.id };
//   } catch (error) {
//     console.error("Error creating feedback:", error);
//     return { success: false, error: `${error}` };
//   }
// }

export async function getInterviewById(id: string): Promise<Interview | null> {
  const interview = await db.collection("interviews").doc(id).get();

  return interview.data() as Interview | null;
}

export async function getFeedbackByInterviewId(
  params: GetFeedbackByInterviewIdParams
): Promise<Feedback | null> {
  const { interviewId, userId } = params;

  const querySnapshot = await db
    .collection("feedback")
    .where("interviewId", "==", interviewId)
    .where("userId", "==", userId)
    .limit(1)
    .get();

  if (querySnapshot.empty) return null;

  const feedbackDoc = querySnapshot.docs[0];
  return { id: feedbackDoc.id, ...feedbackDoc.data() } as Feedback;
}

export async function getLatestInterviews(
  params: GetLatestInterviewsParams
): Promise<Interview[] | null> {
  const { userId, limit = 20 } = params;

  const interviews = await db
    .collection("interviews")
    .orderBy("createdAt", "desc")
    .where("finalized", "==", true)
    .where("userId", "!=", userId)
    .limit(limit)
    .get();

  return interviews.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Interview[];
}

export async function getInterviewsByUserId(
  userId: string
): Promise<Interview[] | null> {
  const interviews = await db
    .collection("interviews")
    .where("userId", "==", userId)
    .orderBy("createdAt", "desc")
    .get();

  return interviews.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Interview[];
}

export async function getResumeInterviewsByUserId(userId: string): Promise<Interview[] | null> {
  try {

    
    // Query for resume-based interviews (isCustom: true) for this user
    const interviews = await db
      .collection("interviews")
      .where("userId", "==", userId)
      .where("isCustom", "==", true)
      .orderBy("createdAt", "desc")
      .get();

    return interviews.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))as Interview[];
  } catch (error) {
    console.error("Error getting resume-based interviews:", error);
    throw error;
  }
}