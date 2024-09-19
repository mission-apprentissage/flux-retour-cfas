import { Text, Img } from "@chakra-ui/react";
import React, { ReactNode } from "react";

interface HighlightProps {
  children: ReactNode;
  iconSrc?: string;
  iconAlt?: string;
  iconHeight?: number | string;
  iconWidth?: number | string;
  highlightText?: ReactNode;
  [key: string]: any;
}

const TextHighlight = ({
  children,
  iconSrc = "/images/ampoule.png",
  iconAlt = "Bon à savoir",
  iconHeight = 4,
  iconWidth = "auto",
  highlightText = <b>Bon à savoir :</b>,
  ...props
}: HighlightProps) => {
  return (
    <Text {...props}>
      <Img src={iconSrc} alt={iconAlt} height={iconHeight} width={iconWidth} display="inline" /> {highlightText}{" "}
      {children}
    </Text>
  );
};

export default TextHighlight;
