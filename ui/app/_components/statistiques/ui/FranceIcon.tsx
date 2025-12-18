import Image from "next/image";

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
      className={className}
      style={{
        filter: isActive ? "none" : "grayscale(100%) brightness(1.6)",
        opacity: isActive ? 1 : 0.35,
      }}
    />
  );
}
