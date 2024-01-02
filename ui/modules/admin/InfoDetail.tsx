import { Box, VStack, HStack } from "@chakra-ui/react";
import get from "lodash.get";
import React from "react";

/**
 * A handy component to display a list of key/value pairs
 * largely inspired by @tanstack/react-table
 */
const InfoDetail = ({
  title,
  rows,
  data,
}: {
  title?: string;
  rows: Record<any, { header?: () => any; cell?: ({ value }: { value: any; original: any }) => any }>;
  data: any;
}) => {
  return (
    <>
      {title && (
        <Box as="h2" fontSize="xl" fontWeight="semibold" mb={4}>
          {title}
        </Box>
      )}
      {Object.entries(rows).map(([key, { header, cell }]) => {
        const value = get(data, key);
        return (
          <VStack key={key} gap={6} alignItems="baseline">
            <HStack mb={4} alignItems="baseline">
              <Box w="300px">{header ? header() : key} </Box>
              <div>{cell ? cell({ value, original: data }) : value}</div>
            </HStack>
          </VStack>
        );
      })}
    </>
  );
};

export default InfoDetail;
