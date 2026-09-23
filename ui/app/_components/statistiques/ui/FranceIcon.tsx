import Image from "next/image";

import styles from "./FranceIcon.module.css";

interface FranceIconProps {
  isActive: boolean;
  width?: number;
  height?: number;
  className?: string;
}

export function FranceIcon({ isActive, width = 22, height = 22, className }: FranceIconProps) {
  return (
    <Image
      src="/images/france-icon.svg"
      alt="France"
      width={width}
      height={height}
      className={`${isActive ? "" : styles.inactive} ${className || ""}`}
    />
  );
}
