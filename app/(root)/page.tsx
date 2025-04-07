// import Link from "next/link";
// import Image from "next/image";

// import { Button } from "@/components/ui/button";
// import InterviewCard from "@/components/InterviewCard";

// import { getCurrentUser } from "@/lib/actions/auth.action";
// import {
//   getInterviewsByUserId,
//   getLatestInterviews,
// } from "@/lib/actions/general.action";

// async function Home() {
//   const user = await getCurrentUser();

//   const [userInterviews, allInterview] = await Promise.all([
//     getInterviewsByUserId(user?.id!),
//     getLatestInterviews({ userId: user?.id! }),
//   ]);

//   const hasPastInterviews = userInterviews?.length! > 0;
//   const hasUpcomingInterviews = allInterview?.length! > 0;

//   return (
//     <>
//       <section className="card-cta">
//         <div className="flex flex-col gap-6 max-w-lg">
//           <h2>Get Interview-Ready with AI-Powered Practice & Feedback</h2>
//           <p className="text-lg">
//             Practice real interview questions & get instant feedback
//           </p>

//           <Button asChild className="btn-primary max-sm:w-full">
//             <Link href="/interview">Start Standard Interview</Link>
//           </Button>

//           <Button asChild className="btn-primary max-sm:w-full">
//             <Link href="/interview/resume-job">Resume Based Interview</Link>
//           </Button>
//         </div>

//         <Image
//           src="/robot.png"
//           alt="robo-dude"
//           width={400}
//           height={400}
//           className="max-sm:hidden"
//         />
//       </section>

//       <section className="flex flex-col gap-6 mt-8">
//         <h2>Your Interviews</h2>

//         <div className="interviews-section">
//           {hasPastInterviews ? (
//             userInterviews?.map((interview) => (
//               <InterviewCard
//                 key={interview.id}
//                 userId={user?.id}
//                 interviewId={interview.id}
//                 role={interview.role}
//                 type={interview.type}
//                 techstack={interview.techstack}
//                 createdAt={interview.createdAt}
//               />
//             ))
//           ) : (
//             <p>You haven&apos;t taken any interviews yet</p>
//           )}
//         </div>
//       </section>

//       <section className="flex flex-col gap-6 mt-8">
//         <h2>Take Interviews</h2>

//         <div className="interviews-section">
//           {hasUpcomingInterviews ? (
//             allInterview?.map((interview) => (
//               <InterviewCard
//                 key={interview.id}
//                 userId={user?.id}
//                 interviewId={interview.id}
//                 role={interview.role}
//                 type={interview.type}
//                 techstack={interview.techstack}
//                 createdAt={interview.createdAt}
//               />
//             ))
//           ) : (
//             <p>There are no interviews available</p>
//           )}
//         </div>
//       </section>
//     </>
//   );
// }

// export default Home;

import Link from "next/link";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import InterviewCard from "@/components/InterviewCard";

import { getCurrentUser } from "@/lib/actions/auth.action";
import {
  getStandardInterviewsByUserId,
  getResumeInterviewsByUserId,
  getLatestInterviews,
  getInterviewsByUserId
} from "@/lib/actions/general.action";

async function Home() {
  const user = await getCurrentUser();

  const [standardInterviews, resumeInterviews, allInterview] = await Promise.all([
    getInterviewsByUserId(user?.id!),
    getResumeInterviewsByUserId(user?.id!),
    getLatestInterviews({ userId: user?.id! }),
  ]);

  const hasStandardInterviews = standardInterviews?.length > 0;
  const hasResumeInterviews = resumeInterviews?.length > 0;
  const hasUpcomingInterviews = allInterview?.length > 0;

  return (
    <>
     <section className="card-cta">
        <div className="flex flex-col gap-6 max-w-lg">
          <h2>Get Interview-Ready with AI-Powered Practice & Feedback</h2>
          <p className="text-lg">
            Practice real interview questions & get instant feedback
          </p>

          <Button asChild className="btn-primary max-sm:w-full">
            <Link href="/interview">Start Standard Interview</Link>
          </Button>

          <Button asChild className="btn-primary max-sm:w-full">
            <Link href="/interview/resume-job">Resume Based Interview</Link>
          </Button>
        </div>

        <Image
          src="/robot.png"
          alt="robo-dude"
          width={400}
          height={400}
          className="max-sm:hidden"
        />
      </section>

      <section className="flex flex-col gap-6 mt-8">
        <h2>Your Interviews</h2>

        <div className="interviews-section">
          {hasStandardInterviews ? (
            standardInterviews.map((interview) => (
              <InterviewCard
                key={interview.id}
                userId={user?.id}
                interviewId={interview.id}
                role={interview.role}
                type={interview.type}
                techstack={interview.techstack}
                createdAt={interview.createdAt}
              />
            ))
          ) : (
            <p>You haven&apos;t taken any standard interviews yet</p>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-6 mt-8">
        <h2>Your Resume-Based Interviews</h2>

        <div className="interviews-section">
          {hasResumeInterviews ? (
            resumeInterviews.map((interview) => (
              <InterviewCard
                key={interview.id}
                userId={user?.id}
                interviewId={interview.id}
                role={interview.role}
                type={interview.type}
                techstack={interview.techstack || []}
                createdAt={interview.createdAt}
              />
            ))
          ) : (
            <p>You haven&apos;t taken any resume-based interviews yet</p>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-6 mt-8">
        <h2>Take Interviews</h2>

        <div className="interviews-section">
          {hasUpcomingInterviews ? (
            allInterview?
      .slice(0, 6) // Take only the top 6 interviews
      .map((interview) => (
              <InterviewCard
                key={interview.id}
                userId={user?.id}
                interviewId={interview.id}
                role={interview.role}
                type={interview.type}
                techstack={interview.techstack}
                createdAt={interview.createdAt}
              />
            ))
          ) : (
            <p>There are no interviews available</p>
          )}
        </div>
      </section>
    </>
  );
}

export default Home;
