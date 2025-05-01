"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

interface ResumeJobInterviewFormProps {
  userId: string;
  userName: string;
}

export default function ResumeJobInterviewForm({ userId, userName }: ResumeJobInterviewFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [resume, setResume] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [role, setRole] = useState("");
  const [level, setLevel] = useState("mid");
  const [type, setType] = useState("technical");
  const [amount, setAmount] = useState(5);
  const [questions, setQuestions] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resume || !jobDescription) {
      toast.error("Please provide both resume and job description");
      return;
    }
    
    if (!userId) {
      toast.error("User authentication required");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch("/api/interviews/resume-job", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resume,
          jobDescription,
          userId,
          role,
          level,
          type,
          amount,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success("Interview created successfully!");
        if (data.questions && Array.isArray(data.questions)) {
          setQuestions(data.questions);
          setShowPreview(true);
        }
        router.push(`/interview/${data.interviewId}?generated=true`);
      } else {
        toast.error(data.error || "Failed to create interview");
      }
    } catch (error: any) {
      console.error("Error creating interview:", error);
      toast.error(error.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-8 bg-white rounded-xl shadow-lg border border-gray-100">
      <div className="mb-8 border-b pb-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Create AI-Powered Interview</h1>
        <p className="text-lg text-gray-700">
          We'll analyze your resume against the job description to generate tailored interview questions using Google's Gemini 2.0 AI.
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 p-4 rounded-lg ">
            <label className="block mb-2 text-lg font-medium text-gray-800">Target Role</label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Frontend Developer"
              className="w-full p-3 border
              bg-gray-500 border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
            <p className="mt-1 text-sm text-gray-600">If left blank, we'll extract the role from the job description</p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <label className="block mb-2 text-lg font-medium text-gray-800">Experience Level</label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="w-full p-3 border 
              bg-gray-500 border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            >
              <option value="junior">Junior</option>
              <option value="mid">Mid-level</option>
              <option value="senior">Senior</option>
              <option value="lead">Lead/Manager</option>
              <option value="custom">Custom (Based on Resume)</option>
            </select>
            <p className="mt-1 text-sm text-gray-600">Select your experience level for appropriate questions</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <label className="block mb-2 text-lg font-medium text-gray-800">Question Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full p-3 border
              bg-gray-500 border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            >
              <option value="technical">Technical</option>
              <option value="behavioral">Behavioral</option>
              <option value="mixed">Mixed</option>
            </select>
            <p className="mt-1 text-sm text-gray-600">Choose the style of interview questions</p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <label className="block mb-2 text-lg font-medium text-gray-800">Number of Questions</label>
            <input
              type="number"
              min="3"
              max="10"
              value={amount}
              onChange={(e) => setAmount(parseInt(e.target.value) || 5)}
              className="w-full p-3 border 
              bg-gray-500 border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
            <p className="mt-1 text-sm text-gray-600">Select between 3-10 questions</p>
          </div>
        </div>
        
        <div className="bg-gray-50 p-6 rounded-lg">
          <label className="block mb-2 text-lg font-medium text-gray-800">Your Resume</label>
          <p className="mb-2 text-gray-600">Copy and paste the content of your resume below</p>
          <textarea
            value={resume}
            onChange={(e) => setResume(e.target.value)}
            placeholder="Paste your resume text here..."
            className="w-full p-4 border 
             bg-gray-500 border-gray-300 rounded-md h-64 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-800"
            required
          />
          <p className="mt-2 text-sm text-gray-500">Required - The AI will analyze your skills and experience</p>
        </div>
        
        <div className="bg-gray-50 p-6 rounded-lg">
          <label className="block mb-2 text-lg font-medium text-gray-800">Job Description</label>
          <p className="mb-2 text-gray-600">Copy and paste the job posting you're interested in</p>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the job description here..."
            className="w-full p-4 border 
            bg-gray-500 border-gray-300 rounded-md h-64 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-800"
            required
          />
          <p className="mt-2 text-sm text-gray-500">Required - The AI will identify key requirements and generate relevant questions</p>
        </div>
        
        <div className="pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-blue-600 text-white text-lg font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-300 focus:ring-4 focus:ring-blue-300 focus:outline-none shadow-md"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating Interview Questions...
              </span>
            ) : (
              "Generate Tailored Interview"
            )}
          </button>
          
          <p className="text-center mt-4 text-sm text-gray-600">
            Powered by Google's Gemini 2.0 AI to create questions that bridge the gap between your resume and the job requirements
          </p>
        </div>
      </form>

      {showPreview && questions.length > 0 && (
        <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Preview Generated Questions</h2>
          <ul className="list-disc pl-5 space-y-2">
            {questions.map((question, index) => (
              <li key={index} className="text-gray-700">{question}</li>
            ))}
          </ul>
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">Your interview has been created. Redirecting to interview page...</p>
          </div>
        </div>
      )}
    </div>
  );
}
