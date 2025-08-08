import React from "react";

interface SpinnerProps {
  size?: string;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function Spinner({ size = "1em", color = "#3498db", className, style }: SpinnerProps) {
  return (
    <>
      <div
        className={className}
        style={{
          display: "inline-block",
          width: size,
          height: size,
          border: `2px solid #f3f3f3`,
          borderTop: `2px solid ${color}`,
          borderRadius: "50%",
          animation: "spinner-spin 1s linear infinite",
          ...style,
        }}
      />
      <style jsx>{`
        @keyframes spinner-spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </>
  );
}
