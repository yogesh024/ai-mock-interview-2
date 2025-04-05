"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

import { cn } from "@/lib/utils";
import { vapi } from "@/lib/vapi.sdk";
import { interviewer } from "@/constants";
import { createFeedback } from "@/lib/actions/general.action";

enum CallStatus {
  INACTIVE = "INACTIVE",
  CONNECTING = "CONNECTING",
  ACTIVE = "ACTIVE",
  FINISHED = "FINISHED",
}

interface SavedMessage {
  role: "user" | "system" | "assistant";
  content: string;
}

interface AgentProps {
  userName: string;
  userId: string;
  interviewId?: string;
  feedbackId?: string;
  type: "generate" | "interview" | "custom";
  questions?: string[];
  jobDescription?: string;
  resume?: string;
}

const Agent = ({
  userName,
  userId,
  interviewId,
  feedbackId,
  type,
  questions,
  jobDescription,
  resume,
}: AgentProps) => {
  const router = useRouter();
  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
  const [messages, setMessages] = useState<SavedMessage[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastMessage, setLastMessage] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onCallStart = () => {
      console.log("Call started");
      setCallStatus(CallStatus.ACTIVE);
      setError(null);
    };

    const onCallEnd = () => {
      console.log("Call ended");
      setCallStatus(CallStatus.FINISHED);
    };

    const onMessage = (message: any) => {
      console.log("Received message:", message);
      if (message.type === "transcript" && message.transcriptType === "final") {
        const newMessage = { role: message.role, content: message.transcript };
        setMessages((prev) => [...prev, newMessage]);
      }
    };

    const onSpeechStart = () => {
      console.log("Speech started");
      setIsSpeaking(true);
    };

    const onSpeechEnd = () => {
      console.log("Speech ended");
      setIsSpeaking(false);
    };

    const onError = (error: Error) => {
      console.error("VAPI Error:", error);
      setError(error.message);
      toast.error(`Call error: ${error.message}`);
      setCallStatus(CallStatus.INACTIVE);
    };

    // Set up event listeners
    vapi.on("call-start", onCallStart);
    vapi.on("call-end", onCallEnd);
    vapi.on("message", onMessage);
    vapi.on("speech-start", onSpeechStart);
    vapi.on("speech-end", onSpeechEnd);
    vapi.on("error", onError);

    return () => {
      // Clean up event listeners
      vapi.off("call-start", onCallStart);
      vapi.off("call-end", onCallEnd);
      vapi.off("message", onMessage);
      vapi.off("speech-start", onSpeechStart);
      vapi.off("speech-end", onSpeechEnd);
      vapi.off("error", onError);
    };
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      setLastMessage(messages[messages.length - 1].content);
    }

    const handleGenerateFeedback = async(messages: SavedMessage[]) => {
      console.log("Generating feedback from transcript:", messages);
      
      try {
        const { success, feedbackId: id } = await createFeedback({
          interviewId: interviewId!,
          userId: userId!,
          transcript: messages,
          feedbackId,
          resume: resume,
          jobDescription: jobDescription
        });

        if (success && id) {
          toast.success("Feedback generated successfully!");
          router.push(`/interview/${interviewId}/feedback`);
        } else {
          console.error("Error saving feedback");
          toast.error("Failed to generate feedback");
          router.push("/");
        }
      } catch (error) {
        console.error("Error in feedback generation:", error);
        toast.error("Failed to generate feedback");
        router.push("/");
      }
    };

    if (callStatus === CallStatus.FINISHED) {
      if (type === "generate") {
        toast.success("Interview questions generated!");
        router.push("/");
      } else {
        if (messages.length > 0) {
          handleGenerateFeedback(messages);
        } else {
          toast.error("No interview transcript to generate feedback from");
          router.push("/");
        }
      }
    }
  }, [messages, callStatus, feedbackId, interviewId, router, type, userId, resume, jobDescription]);

  const handleCall = async () => {
    try {
      setError(null);
      setCallStatus(CallStatus.CONNECTING);
      toast.loading("Connecting to AI Interviewer...");

      if (type === "generate") {
        console.log("Starting generation call with variables:", {
          username: userName,
          userid: userId,
        });
        
        if (!process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID) {
          throw new Error("VAPI workflow ID is not configured");
        }

        await vapi.start(process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID, {
          variableValues: {
            username: userName,
            userid: userId,
          },
        });
      } else {
        let formattedQuestions = "";
        if (questions && questions.length > 0) {
          console.log("Formatting interview questions:", questions);
          formattedQuestions = questions
            .map((question) => `- ${question}`)
            .join("\n");
        } else {
          console.warn("No questions provided for interview");
        }

        let interviewContext = "";
        if (type === "custom" && resume && jobDescription) {
          interviewContext = `
This is a tailored interview based on the candidate's resume and the job description.

Resume:
${resume}

Job Description:
${jobDescription}

Please conduct an interview tailored to assess this candidate's fit for the role.
`;
        }

        console.log("Starting interview with questions:", formattedQuestions);
        await vapi.start(interviewer, {
          variableValues: {
            questions: formattedQuestions,
            context: interviewContext,
          },
        });
      }
      
      toast.dismiss();
    } catch (error: any) {
      console.error("Error starting call:", error);
      setError(error.message);
      toast.error(`Failed to start call: ${error.message}`);
      setCallStatus(CallStatus.INACTIVE);
    }
  };

  const handleDisconnect = () => {
    try {
      console.log("Disconnecting call");
      setCallStatus(CallStatus.FINISHED);
      vapi.stop();
    } catch (error: any) {
      console.error("Error stopping call:", error);
      toast.error(`Error ending call: ${error.message}`);
    }
  };

  return (
    <>
      <div className="call-view">
        {/* AI Interviewer Card */}
        <div className="card-interviewer">
          <div className="avatar">
            <Image
              src="/ai-avatar.png"
              alt="profile-image"
              width={65}
              height={54}
              className="object-cover"
            />
            {isSpeaking && <span className="animate-speak" />}
          </div>
          <h3>AI Interviewer</h3>
          {type === "custom" && <span className="text-xs bg-green-100 px-2 py-1 rounded">Tailored Interview</span>}
        </div>

        {/* User Profile Card */}
        <div className="card-border">
          <div className="card-content">
            <Image
              src="/user-avatar.png"
              alt="profile-image"
              width={539}
              height={539}
              className="rounded-full object-cover size-[120px]"
            />
            <h3>{userName}</h3>
          </div>
        </div>
      </div>

      {error && (
        <div className="error-message bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded my-4">
          <p>{error}</p>
        </div>
      )}

      {messages.length > 0 && (
        <div className="transcript-border">
          <div className="transcript">
            <p
              key={lastMessage}
              className={cn(
                "transition-opacity duration-500 opacity-0",
                "animate-fadeIn opacity-100"
              )}
            >
              {lastMessage}
            </p>
          </div>
        </div>
      )}

      <div className="w-full flex justify-center">
        {callStatus !== CallStatus.ACTIVE ? (
          <button 
            className="relative btn-call" 
            onClick={handleCall}
            disabled={callStatus === CallStatus.CONNECTING}
          >
            <span
              className={cn(
                "absolute animate-ping rounded-full opacity-75",
                callStatus !== CallStatus.CONNECTING && "hidden"
              )}
            />

            <span className="relative">
              {callStatus === CallStatus.INACTIVE || callStatus === CallStatus.FINISHED
                ? "Call"
                : "Connecting..."}
            </span>
          </button>
        ) : (
          <button className="btn-disconnect" onClick={handleDisconnect}>
            End
          </button>
        )}
      </div>
    </>
  );
};

export default Agent;