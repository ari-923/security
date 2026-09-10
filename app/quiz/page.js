import { chapters, practiceQuestions } from "@/content";
import QuizClient from "@/components/QuizClient";

export const metadata = { title: "Practice Center | Security+ Study Guide" };

export default function QuizPage() {
  return <QuizClient questionBank={practiceQuestions} chapters={chapters} />;
}
