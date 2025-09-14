"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface FlashCard {
  front: string;
  back: string;
}

interface SummaryProps {
  flashCards: FlashCard[];
}

export default function Summary({ flashCards }: SummaryProps) {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const currentCard = flashCards[currentCardIndex];

  const handleNext = () => {
    if (currentCardIndex < flashCards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setIsFlipped(false);
    }
  };

  const handlePrevious = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
      setIsFlipped(false);
    }
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleReset = () => {
    setCurrentCardIndex(0);
    setIsFlipped(false);
  };

  if (!flashCards || flashCards.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Summary Flashcards
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No flashcards available.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Summary Flashcards
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Card {currentCardIndex + 1} of {flashCards.length}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Flashcard */}
        <div
          className="relative h-72 cursor-pointer perspective-1000"
          onClick={handleFlip}
        >
          <div className={cn(
            "absolute inset-0 w-full h-full transition-transform duration-500 transform-style-preserve-3d",
            isFlipped && "rotate-y-180"
          )}>
            {/* Front of card */}
            <div className="absolute inset-0 w-full h-full backface-hidden">
              <Card className="h-72 border-2 border-dashed border-primary/20 hover:border-primary/40 overflow-auto text-center transition-colors">
                <CardContent className="h-fit m-auto">
                  <p className="text-lg">{currentCard.front}</p>
                  <p className="text-sm text-muted-foreground pt-2">Click to reveal answer</p>
                </CardContent>
              </Card>
            </div>

            {/* Back of card */}
            <div className="absolute inset-0 w-full h-72 backface-hidden rotate-y-180">
              <Card className="h-72 border-2 border-primary overflow-auto text-center">
                <CardContent className="h-fit m-auto">
                  <p className="text-lg">{currentCard.back}</p>
                  <p className="text-sm text-muted-foreground pt-2">Click to flip back</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentCardIndex === 0}
          >
            Previous
          </Button>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
          </div>

          <Button
            onClick={handleNext}
            disabled={currentCardIndex === flashCards.length - 1}
          >
            Next
          </Button>
        </div>

        {/* Progress indicator */}
        <div className="flex gap-1 justify-center">
          {flashCards.map((_, index) => (
            <div
              key={index}
              className={cn(
                "w-2 h-2 rounded-full transition-colors",
                index === currentCardIndex ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}