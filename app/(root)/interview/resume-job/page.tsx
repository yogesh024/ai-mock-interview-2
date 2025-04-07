"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ResumeJobInterviewForm from '@/components/ResumeJobInterviewForm';
import { getCurrentUser } from '@/lib/actions/auth.action';
// import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface ResumeJobInterviewData {
  resume: string;
  jobDescription: string;
  numberOfQuestions: number;
  difficultyLevel: 'beginner' | 'intermediate' | 'expert';
  interviewType: 'behavioral' | 'technical' | 'mixed';
}

interface User {
  id: string;
  name: string;
}

export default function ResumeJobInterviewPage(): JSX.Element {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  
  useEffect(() => {
    async function fetchUser() {
      try {
        const userData = await getCurrentUser();
        setUser(userData);
      } catch (err) {
        console.error('Error fetching user:', err);
        setError('Failed to load user data');
      }
    }
    
    fetchUser();
  }, []);

  const handleStartInterview = async (data: ResumeJobInterviewData): Promise<void> => {
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
        {user ? (
          <ResumeJobInterviewForm userId={user.id} userName={user.name} />
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : (
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        )}
      </div>
    </div>
  );
}