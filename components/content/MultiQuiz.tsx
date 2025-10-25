"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuizOption {
  id: string;
  text: string;
}

interface QuizQuestion {
  question: string;
  options: QuizOption[];
  correct_answer: string;
  explanation: string;
}

interface MultiQuizProps {
  questions: QuizQuestion[];
  title?: string;
  onComplete: () => void;
}

export default function MultiQuiz({ questions, title = "Quiz", onComplete }: MultiQuizProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [showResults, setShowResults] = useState<{ [key: number]: boolean }>({});
  const [isCompleted, setIsCompleted] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];
  const selectedAnswer = answers[currentQuestionIndex];
  const showResult = showResults[currentQuestionIndex];
  const isCorrect = selectedAnswer === currentQuestion.correct_answer;

  const handleAnswerSelect = (answerId: string) => {
    if (showResult) return;
    setAnswers(prev => ({ ...prev, [currentQuestionIndex]: answerId }));
  };

  const handleSubmit = () => {
    if (!selectedAnswer) return;
    setShowResults(prev => ({ ...prev, [currentQuestionIndex]: true }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setIsCompleted(true);
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const getScore = () => {
    let correct = 0;
    questions.forEach((question, index) => {
      if (answers[index] === question.correct_answer) {
        correct++;
      }
    });
    return { correct, total: questions.length };
  };

  const score = getScore();

  return (
    <Card className="w-full shadow-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          {title}
        </CardTitle>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
          {isCompleted && (
            <span className="font-medium">
              Score: {score.correct}/{score.total} ({Math.round((score.correct / score.total) * 100)}%)
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-lg font-medium">{currentQuestion.question}</p>
        
        <div className="space-y-2">
          {currentQuestion.options.map((option) => (
            <button
              key={option.id}
              onClick={() => handleAnswerSelect(option.id)}
              disabled={showResult}
              className={cn(
                "w-full p-3 text-left rounded-lg border transition-colors",
                "hover:bg-muted/50 disabled:cursor-not-allowed",
                selectedAnswer === option.id && !showResult && "bg-primary/10 border-primary",
                showResult && selectedAnswer === option.id && isCorrect && "bg-green-50 border-green-500 text-green-700 dark:bg-green-950 dark:border-green-400 dark:text-green-300",
                showResult && selectedAnswer === option.id && !isCorrect && "bg-red-50 border-destructive text-red-700 dark:bg-red-950 dark:border-red-400 dark:text-red-200",
                showResult && option.id === currentQuestion.correct_answer && selectedAnswer !== currentQuestion.correct_answer && "bg-green-50 border-green-500 text-green-700 dark:bg-green-950 dark:border-green-400 dark:text-green-300"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="mr-4">{option.text}</span>
                {showResult && selectedAnswer === option.id && (
                  isCorrect ? (
                    <CheckCircle className="h-5 min-w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 min-w-5 text-destructive" />
                  )
                )}
                {showResult && option.id === currentQuestion.correct_answer && selectedAnswer !== currentQuestion.correct_answer && (
                  <CheckCircle className="h-5 min-w-5 text-green-600" />
                )}
              </div>
            </button>
          ))}
        </div>

        {showResult && currentQuestion.explanation && (
          <div className={cn(
            "p-4 rounded-lg",
            isCorrect ? "bg-green-50 border border-green-200 dark:bg-green-950 dark:border-green-800" : "bg-red-50 border border-red-200 dark:bg-red-950 dark:border-red-800"
          )}>
            <p className="text-sm">{currentQuestion.explanation}</p>
          </div>
        )}

        <div className="flex justify-between items-center">
          <Button 
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          {!showResult ? (
            <Button 
              onClick={handleSubmit} 
              disabled={!selectedAnswer}
              className="min-w-24"
            >
              Submit
            </Button>
          ) : (
            <Button 
              onClick={handleNext}
              className="flex items-center gap-2 min-w-24"
            >
              {currentQuestionIndex === questions.length - 1 ? "Continue" : "Next"}
              {currentQuestionIndex < questions.length - 1 && <ChevronRight className="h-4 w-4" />}
            </Button>
          )}
        </div>

        {/* Progress indicator */}
        <div className="flex gap-1 justify-center">
          {questions.map((_, index) => (
            <div
              key={index}
              className={cn(
                "w-2 h-2 rounded-full transition-colors",
                index === currentQuestionIndex ? "bg-primary" : 
                answers[index] ? "bg-green-500" : "bg-muted"
              )}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}