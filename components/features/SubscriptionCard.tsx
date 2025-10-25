"use client"

import React from 'react';
import { Button } from '@/components/ui/button';

interface SubscriptionCardProps {
    className?: string;
}

const SubscriptionCard: React.FC<SubscriptionCardProps> = ({ className = "" }) => {
    const handleSubscribe = () => {
        // TODO: Implement subscription logic
        console.log('Subscribe button clicked');
    };

    return (
        <div className={`border border-border rounded-md p-6 bg-card ${className}`}>
            <h3 className="text-lg font-medium mb-4">Subscribe to Premium</h3>

            <div className="space-y-3 mb-6">
                <p className="text-sm/relaxed text-muted-foreground">
                    Unlock unlimited access to premium content and features:
                </p>

                <ul className="text-sm text-muted-foreground space-y-2">
                    <li className="flex items-start">
                        <span className="text-teal-500 mr-2">•</span>
                        Unlimited topic searches
                    </li>
                    <li className="flex items-start">
                        <span className="text-teal-500 mr-2">•</span>
                        Ad-free experience
                    </li>
                    <li className="flex items-start">
                        <span className="text-teal-500 mr-2">•</span>
                        Enhanced topic content with visual aids
                    </li>
                    <li className="flex items-start">
                        <span className="text-teal-500 mr-2">•</span>
                        Unlimited saves and notes
                    </li>
                </ul>
            </div>

            <Button
                onClick={handleSubscribe}
                size="lg"
                className="w-full touch-manipulation"
                disabled
            >
                Subscribe (Launching soon!)
            </Button>
        </div>
    );
};

export default SubscriptionCard;