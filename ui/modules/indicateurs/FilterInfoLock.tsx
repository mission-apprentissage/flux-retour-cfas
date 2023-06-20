import { LockIcon } from "@chakra-ui/icons";
import { Box, HStack, Stack, Text } from "@chakra-ui/react";

export default function FilterInfoLock({ value }) {
  return (
    <Box bg="#F9F8F6" w="100%" h={14} px={4} py={2}>
      <HStack alignItems="center" height="100%">
        <Stack direction="row" flex="1" alignItems="center">
          <Text>{value}</Text>
        </Stack>
        <LockIcon color="bluefrance" />
      </HStack>
    </Box>
  );
}
