import React from "react";

import styles from "./Spinner.module.css";

interface SpinnerProps {
  size?: string;
  color?: string;
  className?: string;
}

export function Spinner({ size = "1em", color = "#3498db", className }: SpinnerProps) {
  return (
    <div
      className={`${styles.spinner} ${className || ""}`}
      style={{ "--spinner-size": size, "--spinner-color": color } as React.CSSProperties}
    />
  );
}
