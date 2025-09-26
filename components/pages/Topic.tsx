"use client";

import { useParams, useRouter } from "next/navigation";
import { useTopic } from "@/hooks/useTopic";
import { Loader2 } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Clock, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatViews } from "@/lib/format";
import ReactMarkdown from "react-markdown";
import MultiQuiz from "@/components/content/MultiQuiz";
import Reorder from "@/components/content/Reorder";
import Summary from "@/components/content/Summary";
import { Doc } from "@/convex/_generated/dataModel";
import { Infer } from "convex/values";
import {
  researchBriefValidator,
  researchDeepValidator,
  realWorldImpactValidator,
  summaryValidator,
  quizValidator,
  reorderValidator,
  finalQuizValidator
} from "@/convex/schema";
import remarkGfm from "remark-gfm";
import Image from "next/image";
import Link from "next/link";
import { SimilarTopics } from "../content";

type ProgressStage =
  | "research_brief"
  | "quiz"
  | "research_deep"
  | "reorder"
  | "real_world_impact"
  | "final_quiz"
  | "summary";

// Inferred types from validators
type ResearchBriefContent = Infer<typeof researchBriefValidator>;
type ResearchDeepContent = Infer<typeof researchDeepValidator>;
type RealWorldImpactContent = Infer<typeof realWorldImpactValidator>;
type SummaryContent = Infer<typeof summaryValidator>;
type QuizContent = Infer<typeof quizValidator>;
type ReorderContent = Infer<typeof reorderValidator>;
type FinalQuizContent = Infer<typeof finalQuizValidator>;

interface Blocks {
  research_brief: Doc<"blocks"> & { content: ResearchBriefContent } | null;
  quiz: Doc<"blocks"> & { content: QuizContent } | null;
  research_deep: Doc<"blocks"> & { content: ResearchDeepContent } | null;
  reorder: Doc<"blocks"> & { content: ReorderContent } | null;
  real_world_impact: Doc<"blocks"> & { content: RealWorldImpactContent } | null;
  final_quiz: Doc<"blocks"> & { content: FinalQuizContent } | null;
  summary: Doc<"blocks"> & { content: SummaryContent } | null;
}

// Type guards for block content
function isResearchBrief(block: Doc<"blocks">): block is Doc<"blocks"> & { content: ResearchBriefContent } {
  return block.content.step === "research_brief";
}

function isResearchDeep(block: Doc<"blocks">): block is Doc<"blocks"> & { content: ResearchDeepContent } {
  return block.content.step === "research_deep";
}

function isRealWorldImpact(block: Doc<"blocks">): block is Doc<"blocks"> & { content: RealWorldImpactContent } {
  return block.content.step === "real_world_impact";
}

function isSummary(block: Doc<"blocks">): block is Doc<"blocks"> & { content: SummaryContent } {
  return block.content.step === "summary";
}

function isQuiz(block: Doc<"blocks">): block is Doc<"blocks"> & { content: QuizContent } {
  return block.content.step === "quiz";
}

function isReorder(block: Doc<"blocks">): block is Doc<"blocks"> & { content: ReorderContent } {
  return block.content.step === "reorder";
}

function isFinalQuiz(block: Doc<"blocks">): block is Doc<"blocks"> & { content: FinalQuizContent } {
  return block.content.step === "final_quiz";
}

const Topic = () => {
  const router = useRouter();
  const { id } = useParams();
  const topicId = id as Id<"topics">;
  const [currentStage, setCurrentStage] = useState<ProgressStage>("research_brief"); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [completedStages, setCompletedStages] = useState<Set<ProgressStage>>(new Set());
  const { data: topicData, isLoading, error } = useTopic(topicId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !topicData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-lg font-medium mb-2">Topic not found</p>
          <p className="text-muted-foreground mb-4">The topic you are looking for does not exist or has been removed.</p>
          <Button onClick={() => router.push("/")}>
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  const { topic, category } = topicData;

  const handleStageComplete = (stage: ProgressStage) => {
    setCompletedStages(prev => new Set([...prev, stage]));

    // Progress to next stage
    const stageOrder: ProgressStage[] = [
      "research_brief", "quiz", "research_deep", "reorder",
      "real_world_impact", "final_quiz", "summary"
    ];

    const currentIndex = stageOrder.indexOf(stage);
    if (currentIndex < stageOrder.length - 1) {
      setCurrentStage(stageOrder[currentIndex + 1]);
    }

    // Auto-scroll to the next content after a short delay
    setTimeout(() => {
      // Find the next content section and scroll to it
      const nextStageIndex = currentIndex + 1;
      if (nextStageIndex < stageOrder.length) {
        const nextStage = stageOrder[nextStageIndex];

        // Create a more specific selector for the next stage
        let selector = '';
        switch (nextStage) {
          case 'research_deep':
            selector = '[data-stage="research_deep"]';
            break;
          case 'reorder':
            selector = '[data-stage="reorder"]';
            break;
          case 'real_world_impact':
            selector = '[data-stage="real_world_impact"]';
            break;
          case 'final_quiz':
            selector = '[data-stage="final_quiz"]';
            break;
          case 'summary':
            selector = '[data-stage="summary"]';
            break;
        }

        if (selector) {
          const element = document.querySelector(selector);
          if (element) {
            element.scrollIntoView({
              behavior: 'smooth',
              block: 'start',
              inline: 'nearest'
            });
          }
        }
      }
    }, 500); // Small delay to allow content to render
  };

  const canShowStage = (stage: ProgressStage): boolean => {
    // Always show research_brief and quiz together
    if (stage === "research_brief" || stage === "quiz") {
      return true;
    }

    // Show research_deep and reorder after quiz is completed
    if (stage === "research_deep" || stage === "reorder") {
      return completedStages.has("quiz");
    }

    // Show real_world_impact and final_quiz after reorder is completed
    if (stage === "real_world_impact" || stage === "final_quiz") {
      return completedStages.has("reorder");
    }

    // Show summary after final_quiz is completed
    if (stage === "summary") {
      return completedStages.has("final_quiz");
    }

    return false;
  };

  const shouldShowInfoAlert = (stage: ProgressStage): boolean => {
    // Only show info alert for the next immediate stage that's locked
    const stageOrder: ProgressStage[] = [
      "research_brief", "quiz", "research_deep", "reorder",
      "real_world_impact", "final_quiz", "summary"
    ];

    // Find the first stage that can't be shown yet
    for (const stageItem of stageOrder) {
      if (!canShowStage(stageItem)) {
        return stageItem === stage;
      }
    }

    return false;
  };

  const getContentBlocks = (): Blocks => {
    const blocks: Blocks = {
      research_brief: null,
      quiz: null,
      research_deep: null,
      reorder: null,
      real_world_impact: null,
      final_quiz: null,
      summary: null,
    };

    if (!topicData?.blocks) return blocks;

    // Sort blocks by order to ensure correct assignment
    const sortedBlocks = [...topicData.blocks].sort((a, b) => a.order - b.order);

    sortedBlocks.forEach(block => {
      // Use type guards to safely assign blocks based on their step
      if (isResearchBrief(block)) {
        blocks.research_brief = block;
      } else if (isResearchDeep(block)) {
        blocks.research_deep = block;
      } else if (isRealWorldImpact(block)) {
        blocks.real_world_impact = block;
      } else if (isSummary(block)) {
        blocks.summary = block;
      } else if (isQuiz(block)) {
        blocks.quiz = block;
      } else if (isReorder(block)) {
        blocks.reorder = block;
      } else if (isFinalQuiz(block)) {
        blocks.final_quiz = block;
      }
    });

    return blocks;
  };

  const contentBlocks = getContentBlocks();

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner": return "text-green-800 bg-green-100 border-green-300 dark:text-green-200 dark:bg-green-950 dark:border-green-500";
      case "intermediate": return "text-orange-800 bg-orange-100 border-orange-300 dark:text-orange-200 dark:bg-orange-950 dark:border-orange-500";
      case "advanced": return "text-fuchsia-800 bg-fuchsia-100 border-fuchsia-300 dark:text-fuchsia-200 dark:bg-fuchsia-950 dark:border-fuchsia-500";
      default: return "text-gray-600 bg-gray-50 border-gray-200 dark:text-gray-400 dark:bg-gray-950 dark:border-gray-800";
    }
  };

  return (
    <div className="space-y-6 lg:mt-3">
      {/* Header */}
      <div className="space-y-4">
        {topic.imageUrl && (
          <div className="aspect-video overflow-hidden relative rounded-3xl">
            <Image
              src={topic.imageUrl}
              alt={topic.title}
              fill
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            {category && (
              <Link href={`/user/explore/category/${category.slug}`}>
                <Button variant="secondary" className="cursor-pointer" size="sm">
                  {category.name}
                </Button>
              </Link>
            )}
            <span className={cn("h-8 flex items-center justify-center px-4 rounded-full border font-bold uppercase", getDifficultyColor(topic.difficulty))}>
              {topic.difficulty}
            </span>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {topic.estimatedReadTime} min read
            </div>
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {formatViews(topic.viewCount)}
            </div>
          </div>

          <div className="flex flex-col">
            <h1 className="text-3xl/relaxed font-bold capitalize">{topic.title}</h1>
            <p className="text-lg/relaxed text-muted-foreground">{topic.description}</p>
            {topic.tagIds.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {topic.tagIds.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 text-xs bg-muted rounded-md"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content Stages */}
      <div className="space-y-6 pt-3">
        {/* Research Brief */}
        {canShowStage("research_brief") && (
          contentBlocks.research_brief ? (
            <div className="prose dark:prose-invert min-w-full">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {contentBlocks.research_brief.content.data.text}
              </ReactMarkdown>
            </div>
          ) : (
            <p>Research brief content not available.</p>
          )
        )}

        {/* Quiz */}
        {canShowStage("quiz") && contentBlocks.quiz && (
          <MultiQuiz
            questions={contentBlocks.quiz.content.data.questions.map(question => {
              // Find the index of the correct answer to use as ID
              const correctAnswerIndex = question.options.findIndex(option => option === question.correct_answer);
              return {
                question: question.question,
                options: question.options.map((option, idx) => ({ id: idx.toString(), text: option })),
                correct_answer: correctAnswerIndex.toString(),
                explanation: question.explanation,
              };
            })}
            title="Knowledge Check"
            onComplete={() => handleStageComplete("quiz")}
          />
        )}

        {/* Info Alert for Research Deep */}
        {shouldShowInfoAlert("research_deep") && (
          <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
            <AlertDescription className="text-blue-800 dark:text-blue-200">
              Complete the quiz above to unlock the deep dive content and continue learning.
            </AlertDescription>
          </Alert>
        )}

        {/* Research Deep */}
        {canShowStage("research_deep") && (
          <div data-stage="research_deep">
            {contentBlocks.research_deep ? (
              <div className="prose dark:prose-invert min-w-full">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {contentBlocks.research_deep.content.data.text}
                </ReactMarkdown>
              </div>
            ) : (
              <p>Deep research content not available.</p>
            )}
          </div>
        )}

        {/* Info Alert for Reorder */}
        {shouldShowInfoAlert("reorder") && (
          <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
            <AlertDescription className="text-blue-800 dark:text-blue-200">
              Complete the quiz above to unlock the reorder activity and continue your learning journey.
            </AlertDescription>
          </Alert>
        )}

        {/* Reorder */}
        {canShowStage("reorder") && contentBlocks.reorder && (
          <div data-stage="reorder">
            <Reorder
              question={contentBlocks.reorder.content.data.question}
              items={contentBlocks.reorder.content.data.options.map((option: string, index: number) => ({
                id: `option-${index}`,
                text: option,
              }))}
              correctOrder={contentBlocks.reorder.content.data.correct_answer.map((option: string, index: number) => ({
                id: `option-${index}`,
                text: option,
              }))}
              explanation={contentBlocks.reorder.content.data.explanation}
              onComplete={() => handleStageComplete("reorder")}
            />
          </div>
        )}

        {/* Info Alert for Real World Impact */}
        {shouldShowInfoAlert("real_world_impact") && (
          <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
            <AlertDescription className="text-blue-800 dark:text-blue-200">
              Complete the reorder activity above to unlock real-world impact insights and see how this topic applies today.
            </AlertDescription>
          </Alert>
        )}

        {/* Real World Impact */}
        {canShowStage("real_world_impact") && (
          <div data-stage="real_world_impact">
            {contentBlocks.real_world_impact ? (
              <div className="prose dark:prose-invert min-w-full">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {contentBlocks.real_world_impact.content.data.content}
                </ReactMarkdown>
                {contentBlocks.real_world_impact.content.data.source_urls.length > 0 && (
                  <div className="border-t">
                    <h4 className="text-sm font-medium mb-2">Sources:</h4>
                    <div className="text-sm flex flex-col gap-2 text-muted-foreground overflow-clip">
                      {contentBlocks.real_world_impact.content.data.source_urls.slice(0, 10).map((url, index) => (
                        <a key={index} href={url} className="line-clamp-1 hover:underline" target="_blank" rel="noopener noreferrer">
                          {url}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p>Real-world impact content not available.</p>
            )}
          </div>
        )}

        {/* Info Alert for Final Quiz */}
        {shouldShowInfoAlert("final_quiz") && (
          <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
            <AlertDescription className="text-blue-800 dark:text-blue-200">
              Complete the reorder activity above to unlock the final assessment and test your comprehensive understanding.
            </AlertDescription>
          </Alert>
        )}

        {/* Final Quiz */}
        {canShowStage("final_quiz") && contentBlocks.final_quiz && (
          <div data-stage="final_quiz">
            <MultiQuiz
              questions={contentBlocks.final_quiz.content.data.questions.map(question => {
                // Find the index of the correct answer to use as ID
                const correctAnswerIndex = question.options.findIndex(option => option === question.correct_answer);
                return {
                  question: question.question,
                  options: question.options.map((option, idx) => ({ id: idx.toString(), text: option })),
                  correct_answer: correctAnswerIndex.toString(),
                  explanation: question.explanation,
                };
              })}
              title="Final Assessment"
              onComplete={() => handleStageComplete("final_quiz")}
            />
          </div>
        )}

        {/* Info Alert for Summary */}
        {shouldShowInfoAlert("summary") && (
          <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
            <AlertDescription className="text-blue-800 dark:text-blue-200">
              Complete the final assessment above to unlock the summary flashcards and review key concepts.
            </AlertDescription>
          </Alert>
        )}

        {/* Summary */}
        {canShowStage("summary") && contentBlocks.summary && (
          <>
            <div data-stage="summary">
              <Summary flashCards={contentBlocks.summary.content.data.flash_cards} />
            </div>
            <div className="block lg:hidden"><SimilarTopics /></div>
          </>
        )}
      </div>
    </div>
  );
}

export default Topic;