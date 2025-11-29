import React from "react";

interface CircularTimerProps {
  percentage: number;
  timeString: string;
  modeColor: string;
  size?: number;
  strokeWidth?: number;
}

export const CircularTimer: React.FC<CircularTimerProps> = ({
  percentage,
  timeString,
  modeColor,
  size = 240,
  strokeWidth = 12,
}) => {
  const radius = size / 2;
  const normalizedRadius = radius - strokeWidth * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  // Calculate font size relative to container, usually 1/5th looks good for inner text
  const fontSize = size * 0.22;

  return (
    <div 
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg
        height={size}
        width={size}
        className="transform -rotate-90 transition-all duration-500 ease-in-out"
      >
        <circle
          stroke="#1e293b" // Surface color for track
          strokeWidth={strokeWidth}
          fill="transparent"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke={modeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference + " " + circumference}
          style={{ strokeDashoffset }}
          strokeLinecap="round"
          fill="transparent"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          className="transition-all duration-1000 ease-linear"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span 
          className="font-bold tracking-tighter text-white"
          style={{ fontSize: `${fontSize}px` }}
        >
          {timeString}
        </span>
      </div>
    </div>
  );
};