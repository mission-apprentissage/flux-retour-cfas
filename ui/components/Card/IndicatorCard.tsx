import { Box, Center, HStack, Text } from "@chakra-ui/react";
import { ReactNode } from "react";

import { formatNumber } from "@/common/utils/stringUtils";

import { InfoTooltip } from "../Tooltip/InfoTooltip";

interface CardProps {
  label: string;
  count: number;
  tooltipHeader: ReactNode | string;
  tooltipLabel: ReactNode | string;
  icon: ReactNode;
  big?: boolean;
  children?: ReactNode;
}
export function IndicatorCard({ label, count, tooltipHeader, tooltipLabel, icon, big = false, children }: CardProps) {
  return (
    <Center h="100%" justifyContent={big ? "center" : "start"} py="6" px="10">
      <HStack gap={3}>
        <Box alignSelf={"start"} pt="3">
          {icon}
        </Box>
        <Box>
          <Text fontSize={big ? "40px" : "28px"} fontWeight="700">
            {formatNumber(count)}
          </Text>
          <Text fontSize={12}>
            {label}
            <InfoTooltip headerComponent={() => tooltipHeader} contentComponent={() => <Box>{tooltipLabel}</Box>} />
          </Text>
          {children}
        </Box>
      </HStack>
    </Center>
  );
}
