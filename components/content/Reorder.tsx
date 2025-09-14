"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GripVertical, CheckCircle, XCircle, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReorderItem {
  id: string;
  text: string;
}

interface ReorderProps {
  question: string;
  items: ReorderItem[];
  correctOrder: ReorderItem[];
  explanation?: string;
  onComplete: () => void;
}

export default function Reorder({ question, items, correctOrder, explanation, onComplete }: ReorderProps) {
  const [currentOrder, setCurrentOrder] = useState<ReorderItem[]>([...items]);
  const [showResult, setShowResult] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false); // eslint-disable-line @typescript-eslint/no-unused-vars

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData("text/plain"));

    if (dragIndex === dropIndex) return;

    const newOrder = [...currentOrder];
    const draggedItem = newOrder[dragIndex];
    newOrder.splice(dragIndex, 1);
    newOrder.splice(dropIndex, 0, draggedItem);

    setCurrentOrder(newOrder);
  };

  const handleSubmit = () => {
    setShowResult(true);
  };

  const handleReset = () => {
    setCurrentOrder([...items]);
    setShowResult(false);
  };

  const handleContinue = () => {
    setIsCompleted(true);
    onComplete();
  };

  // Simple comparison: join current order text with ", " and compare with correctOrder string
  // const currentOrderText = currentOrder.map(item => item.text).join(", ");
  // const isCorrect = currentOrderText.toLowerCase().trim() === correctOrder.toLowerCase().trim();

  const isAllCorrect = currentOrder.every((item, index) => {
    return item.text.toLowerCase() === correctOrder[index].text.toLowerCase();
  });

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GripVertical className="h-5 w-5" />
          Reorder Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-lg font-medium">{question}</p>

        <div className="space-y-2">
          {currentOrder.map((item, index) => {
            const isCorrect = item.text.toLowerCase() === correctOrder[index].text.toLowerCase();

            return (<div
              key={item.id}
              draggable={!showResult}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                !showResult && "cursor-move hover:bg-muted/50",
                showResult && isCorrect && "bg-green-50 border-green-500 dark:bg-green-950 dark:border-green-400",
                showResult && !isCorrect && "bg-red-50 border-red-500 dark:bg-red-950 dark:border-red-400"
              )}
            >
              <GripVertical className={cn(
                "h-4 w-4 text-muted-foreground",
                showResult && "opacity-50"
              )} />
              <span className="flex-1">{item.text}</span>
              {showResult && (
                isCorrect ? (
                  <CheckCircle className="h-5 min-w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 min-w-5 text-red-500" />
                )
              )}
            </div>)
          })}
        </div>

        {showResult && explanation && (
          <div className={cn(
            "p-4 rounded-lg",
            isAllCorrect ? "bg-green-50 border border-green-200 dark:bg-green-950 dark:border-green-800" : "bg-red-50 border border-red-200 dark:bg-red-950 dark:border-red-800"
          )}>
            <p className="text-sm">{explanation}</p>
          </div>
        )}

        <div className="flex justify-between">
          {!showResult ? (
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleReset}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button onClick={handleSubmit}>
                Submit
              </Button>
            </div>
          ) : (
            <div className="flex gap-2 ml-auto">
              <Button variant="outline" onClick={handleReset}>
                Try Again
              </Button>
              <Button onClick={handleContinue}>
                Continue
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}