import { Infer } from "convex/values";
import {
  researchBriefValidator,
  researchDeepValidator,
  realWorldImpactValidator,
  summaryValidator,
  quizValidator,
  reorderValidator,
  finalQuizValidator,
  blockContentValidator,
} from "./schema";

// Inferred TypeScript types from validators
export type ResearchBriefContent = Infer<typeof researchBriefValidator>;
export type ResearchDeepContent = Infer<typeof researchDeepValidator>;
export type RealWorldImpactContent = Infer<typeof realWorldImpactValidator>;
export type SummaryContent = Infer<typeof summaryValidator>;
export type QuizContent = Infer<typeof quizValidator>;
export type ReorderContent = Infer<typeof reorderValidator>;
export type FinalQuizContent = Infer<typeof finalQuizValidator>;
export type BlockContent = Infer<typeof blockContentValidator>;

// Helper types for specific data structures
export type Question = {
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
};

export type FlashCard = {
  front: string;
  back: string;
};

// Type guards for block content
export function isResearchBrief(content: BlockContent): content is ResearchBriefContent {
  return content.step === "research_brief";
}

export function isResearchDeep(content: BlockContent): content is ResearchDeepContent {
  return content.step === "research_deep";
}

export function isRealWorldImpact(content: BlockContent): content is RealWorldImpactContent {
  return content.step === "real_world_impact";
}

export function isSummary(content: BlockContent): content is SummaryContent {
  return content.step === "summary";
}

export function isQuiz(content: BlockContent): content is QuizContent {
  return content.step === "quiz";
}

export function isReorder(content: BlockContent): content is ReorderContent {
  return content.step === "reorder";
}

export function isFinalQuiz(content: BlockContent): content is FinalQuizContent {
  return content.step === "final_quiz";
}