interface LoadingSkeletonProps {
  rows?: number;
  showHeader?: boolean;
  className?: string;
}

const LoadingSkeleton = ({ rows = 5, showHeader = true, className = '' }: LoadingSkeletonProps) => {
  return (
    <div className={`animate-pulse ${className}`}>
      {showHeader && (
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
      )}
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex space-x-4">
            <div className="h-4 bg-gray-200 rounded flex-1"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/6"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LoadingSkeleton;

