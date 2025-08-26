import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface TrendingTopic {
  id: string;
  category: string;
  name: string;
  blockCount: string;
  trend: 'trending' | 'rising' | 'stable';
}

interface TrendingTopicsProps {
  className?: string;
}

// Mock trending data for initial implementation
const mockTrendingData: TrendingTopic[] = [
  {
    id: '1',
    category: 'Technology',
    name: 'Artificial Intelligence',
    blockCount: '2.4K',
    trend: 'trending'
  },
  {
    id: '2',
    category: 'Environment',
    name: 'Climate Change',
    blockCount: '1.8K',
    trend: 'rising'
  },
  {
    id: '3',
    category: 'Health',
    name: 'Mental Health',
    blockCount: '1.2K',
    trend: 'stable'
  },
  {
    id: '4',
    category: 'Finance',
    name: 'Cryptocurrency',
    blockCount: '956',
    trend: 'trending'
  },
  {
    id: '5',
    category: 'Science',
    name: 'Space Exploration',
    blockCount: '743',
    trend: 'rising'
  }
];

const getTrendIcon = (trend: TrendingTopic['trend']) => {
  switch (trend) {
    case 'trending':
      return <TrendingUp className="h-3 w-3 text-teal-500" />;
    case 'rising':
      return <TrendingUp className="h-3 w-3 text-green-500" />;
    case 'stable':
      return <Minus className="h-3 w-3 text-gray-400" />;
    default:
      return null;
  }
};

export default function TrendingTopics({ className = '' }: TrendingTopicsProps) {
  return (
    <div className={`border border-border rounded-md p-6 bg-card ${className}`}>
      <h3 className="text-lg font-medium mb-4">What's happening</h3>
      
      <div className="flex flex-col gap-4">
        {mockTrendingData.map((topic) => (
          <div
            key={topic.id}
            className="group cursor-pointer hover:bg-muted/50 rounded-md p-2 -m-2 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-1">{topic.category}</p>
                <p className="font-medium text-sm text-foreground group-hover:text-teal-600 transition-colors">
                  {topic.name}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {topic.blockCount} blocks
                </p>
              </div>
              <div className="flex-shrink-0 ml-2">
                {getTrendIcon(topic.trend)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}