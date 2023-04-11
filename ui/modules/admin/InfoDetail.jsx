import React from "react";
import { Box, VStack, HStack } from "@chakra-ui/react";
import get from "lodash.get";

/**
 * A handy component to display a list of key/value pairs
 * largely inspired by @tanstack/react-table
 *
 * @param {*} param0
 * @returns
 */
const InfoDetail = ({ rows, data }) => {
  return (
    <>
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
