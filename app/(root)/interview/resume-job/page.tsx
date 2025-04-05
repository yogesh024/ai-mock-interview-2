"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import ResumeJobInterviewForm from '@/components/ResumeJobInterviewForm';
import { Button } from '@/components/ui/button';
// import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface ResumeJobInterviewData {
  resume: string;
  jobDescription: string;
  numberOfQuestions: number;
  difficultyLevel: 'beginner' | 'intermediate' | 'expert';
  interviewType: 'behavioral' | 'technical' | 'mixed';
}

export default function ResumeJobInterviewPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartInterview = async (data: ResumeJobInterviewData) => {
    try {
      setIsLoading(true);
      setError(null);

      // Make API call to generate interview questions
      const response = await fetch('/api/interviews/resume-job', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create interview');
      }

      const interviewData = await response.json();
      
      // Navigate to the interview session
      // You might want to save the interview data in localStorage or context
      // before navigating if needed
      localStorage.setItem('resumeJobInterview', JSON.stringify({
        questions: interviewData.questions,
        resumeData: {
          resume: data.resume,
          jobDescription: data.jobDescription
        },
        metadata: interviewData.metadata
      }));
      
      router.push(`/interview/${interviewData.interviewId}`);
    } catch (err) {
      console.error('Error starting interview:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Resume-Based Interview Generator</h1>
        <p className="text-gray-600">
          Upload your resume and job description to generate tailored interview questions.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <ResumeJobInterviewForm userId="user123" userName="User" />
      </div>
    </div>
  );
}