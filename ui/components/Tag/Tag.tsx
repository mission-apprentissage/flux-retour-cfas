import { Tag as ChakraTag, SystemProps, TagLabel, TagLeftIcon, TagRightIcon, Box, useTheme } from "@chakra-ui/react";
import { ElementType } from "react";

interface TagProps extends SystemProps {
  leftIcon?: ElementType;
  rightIcon?: ElementType;
  primaryText: string;
  secondaryText?: string;
  variant?: string;
  colorScheme?: string;
  size?: "sm" | "md" | "lg";
  isLink?: boolean;
  leftIconColor?: string;
}

function Tag({
  leftIcon,
  leftIconColor,
  rightIcon,
  primaryText,
  secondaryText,
  variant = "subtle",
  colorScheme = "red",
  size = "lg",
  isLink = false,
  ...props
}: TagProps) {
  const theme = useTheme();
  const hoverBg = theme.colors[colorScheme]?.[300];

  return (
    <ChakraTag
      size={size}
      variant={variant}
      colorScheme={colorScheme}
      display="flex"
      alignItems="center"
      paddingX="14px"
      paddingY="4px"
      _hover={isLink ? { bg: hoverBg } : undefined}
      {...props}
    >
      {leftIcon && <TagLeftIcon as={leftIcon} boxSize={4} color={leftIconColor} />}
      <TagLabel display="flex" flexDirection="column" alignItems="flex-start" justifyContent="center">
        <Box>{primaryText}</Box>
        {secondaryText && (
          <Box fontSize="caption" fontWeight="normal" mt="1px">
            {secondaryText}
          </Box>
        )}
      </TagLabel>
      {rightIcon && <TagRightIcon as={rightIcon} />}
    </ChakraTag>
  );
}

export default Tag;
