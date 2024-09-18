import { Badge, Text } from "@chakra-ui/react";

type Level = "success" | "error" | "warning" | "info";

type LabelProps = {
  level?: Level;
  value: string | boolean | number | null | undefined;
};

function getLabelColorScheme(level: Level) {
  switch (level) {
    case "success":
      return "greensoft";
    case "error":
      return "red";
    case "warning":
      return "orangesoft";
    default:
      return "grey";
  }
}

function getText(value: LabelProps["value"]) {
  if (typeof value === "boolean") {
    return value ? "OUI" : "NON";
  }

  return value;
}

export function Label({ value, level = "info" }: LabelProps) {
  const scheme = getLabelColorScheme(level);

  return (
    <Badge backgroundColor={`${scheme}.200`} color={`${scheme}.600`}>
      <Text fontSize="zeta" fontWeight="bold" wordBreak="break-word" whiteSpace="break-spaces">
        {getText(value)}
      </Text>
    </Badge>
  );
}
