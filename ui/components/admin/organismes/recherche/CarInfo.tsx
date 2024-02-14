import { Box, HStack, Stack, Text } from "@chakra-ui/react";
import { ReactNode } from "react";

type CardInfoProps = {
  title: string;
  children: ReactNode;
};

export function CardInfo({ title, children }: CardInfoProps) {
  return (
    <Stack borderColor="#0063CB" borderWidth="2px" p="2w">
      <HStack color="#0063CB">
        <Box>
          <Text fontSize="zeta" fontWeight="bold">
            {title}:
          </Text>
        </Box>
      </HStack>
      {children}
    </Stack>
  );
}
