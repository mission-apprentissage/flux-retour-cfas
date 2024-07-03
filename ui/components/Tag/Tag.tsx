import { Tag as ChakraTag, SystemProps, TagLabel, TagLeftIcon, TagRightIcon, Box } from "@chakra-ui/react";
import { ElementType } from "react";

interface TagProps extends SystemProps {
  leftIcon?: ElementType;
  rightIcon?: ElementType;
  primaryText: string;
  secondaryText?: string;
  variant?: string;
  colorScheme?: string;
  size?: "sm" | "md" | "lg";
}

function Tag({
  leftIcon,
  rightIcon,
  primaryText,
  secondaryText,
  variant = "subtle",
  colorScheme = "red",
  size = "lg",
  ...props
}: TagProps) {
  return (
    <ChakraTag
      size={size}
      variant={variant}
      colorScheme={colorScheme}
      display="flex"
      alignItems="center"
      paddingX="10px"
      paddingY="4px"
      {...props}
    >
      {leftIcon && <TagLeftIcon as={leftIcon} boxSize={4} />}
      <TagLabel display="flex" flexDirection="column" alignItems="flex-start" overflow="none">
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
