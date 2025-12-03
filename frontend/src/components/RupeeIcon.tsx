import React from 'react';

interface RupeeIconProps {
  className?: string;
  size?: number;
}

/**
 * Custom Rupee Icon Component
 * Displays the Indian Rupee symbol (₹)
 */
export const RupeeIcon: React.FC<RupeeIconProps> = ({ className = 'w-6 h-6', size }) => {
  const sizeStyle = size ? { width: size, height: size } : {};
  
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      style={sizeStyle}
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Rupee Symbol as Text - Most Reliable */}
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        fontSize="20"
        fontWeight="bold"
        fill="currentColor"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        ₹
      </text>
    </svg>
  );
};

/**
 * Simple Rupee Symbol Component (just the ₹ character)
 */
export const RupeeSymbol: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <span className={`inline-block ${className}`} aria-hidden="true">
      ₹
    </span>
  );
};

