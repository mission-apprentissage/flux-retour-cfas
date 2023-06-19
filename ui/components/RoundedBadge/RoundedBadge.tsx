import { Box, Text } from "@chakra-ui/react";

export default function RoundedBadge({ value }: { value: number }) {
  return (
    <Box
      width="18px"
      height="18px"
      fontSize="12px"
      borderRadius="50%"
      backgroundColor="bluefrance"
      color="white"
      display="flex"
      alignItems="center"
      alignSelf="center"
      justifyContent="center"
      fontWeight="bold"
    >
      <Text mt="-1px">{value}</Text>
    </Box>
  );
}
